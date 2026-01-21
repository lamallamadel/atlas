# Rate Limiting Implementation

## Overview

The backend implements API rate limiting and throttling using the token bucket algorithm (via Bucket4j) to protect against abuse and ensure fair resource allocation across organizations.

## Features

- **Token Bucket Algorithm**: Implemented using Bucket4j for smooth rate limiting
- **Per-Organization Limits**: Each organization gets its own rate limit bucket based on X-Org-Id header
- **Configurable Tiers**: Admins can configure rate limits per organization via REST API
- **In-Memory Storage**: Uses ConcurrentHashMap for fast, thread-safe bucket state management
- **Micrometer Metrics**: Tracks rate limit hits and rejections for monitoring
- **Standard HTTP Responses**: Returns 429 Too Many Requests with Retry-After header
- **Graceful Degradation**: Can be disabled via configuration for testing

## Architecture

### Components

1. **RateLimitFilter** (`filter/RateLimitFilter.java`)
   - Extends `OncePerRequestFilter`
   - Runs at `HIGHEST_PRECEDENCE - 50` (after TenantFilter)
   - Checks rate limits for all /api/** endpoints
   - Returns 429 with Retry-After header when limit exceeded

2. **RateLimitService** (`service/RateLimitService.java`)
   - Manages Bucket4j buckets per organization
   - Queries database for configured limits
   - Falls back to default limit if no configuration exists
   - Provides CRUD operations for rate limit tiers

3. **RateLimitTier** (`entity/RateLimitTier.java`)
   - Stores per-organization rate limit configuration
   - Fields: orgId, tierName, requestsPerMinute, description

4. **RateLimitController** (`controller/RateLimitController.java`)
   - Admin API at `/api/v1/admin/rate-limits`
   - Requires ADMIN role
   - CRUD operations for rate limit tiers

5. **RateLimitConfig** (`config/RateLimitConfig.java`)
   - Configuration properties for rate limiting
   - Allows enabling/disabling via `rate-limit.enabled`

## Default Configuration

```yaml
rate-limit:
  default-requests-per-minute: 100  # Default for orgs without custom config
  enabled: true                      # Enable/disable rate limiting
```

## Rate Limit Tiers

### Standard Tier (Default)
- **Requests per minute**: 100
- **Applied to**: All organizations without custom configuration

### Premium Tier
- **Requests per minute**: 1000
- **Applied to**: Organizations with premium tier configured

### Custom Tiers
Admins can create custom tiers with any request limit.

## Database Schema

```sql
CREATE TABLE rate_limit_tier (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL UNIQUE,
    tier_name VARCHAR(50) NOT NULL,
    requests_per_minute INTEGER NOT NULL CHECK (requests_per_minute > 0),
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_rate_limit_tier_org_id ON rate_limit_tier(org_id);
```

## API Endpoints

### Get All Rate Limits
```http
GET /api/v1/admin/rate-limits
Authorization: Bearer <admin-token>
X-Org-Id: <org-id>
```

### Get Rate Limit by Organization
```http
GET /api/v1/admin/rate-limits/{orgId}
Authorization: Bearer <admin-token>
X-Org-Id: <org-id>
```

### Create Rate Limit
```http
POST /api/v1/admin/rate-limits
Authorization: Bearer <admin-token>
X-Org-Id: <org-id>
Content-Type: application/json

{
  "orgId": "ORG-123",
  "tierName": "PREMIUM",
  "requestsPerMinute": 1000,
  "description": "Premium tier for high-volume customers"
}
```

### Update Rate Limit
```http
PUT /api/v1/admin/rate-limits/{orgId}
Authorization: Bearer <admin-token>
X-Org-Id: <org-id>
Content-Type: application/json

{
  "tierName": "ENTERPRISE",
  "requestsPerMinute": 5000,
  "description": "Enterprise tier with higher limits"
}
```

### Delete Rate Limit
```http
DELETE /api/v1/admin/rate-limits/{orgId}
Authorization: Bearer <admin-token>
X-Org-Id: <org-id>
```

### Reset Rate Limit Bucket
```http
POST /api/v1/admin/rate-limits/{orgId}/reset
Authorization: Bearer <admin-token>
X-Org-Id: <org-id>
```

Clears the in-memory bucket for an organization, forcing re-creation on next request.

## Rate Limit Response

When a rate limit is exceeded, the API returns:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/problem+json
Retry-After: 60

{
  "type": "about:blank",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded. Please try again later."
}
```

## Metrics

### Prometheus Metrics

1. **rate_limit.hits** (Counter)
   - Total number of requests that hit the rate limiter
   - Incremented for every request checked

2. **rate_limit.rejections** (Counter)
   - Total number of requests rejected due to rate limiting
   - Incremented when 429 is returned

### Querying Metrics

```promql
# Rate of requests hitting rate limiter
rate(rate_limit_hits_total[5m])

# Rate of rejections
rate(rate_limit_rejections_total[5m])

# Rejection ratio
rate(rate_limit_rejections_total[5m]) / rate(rate_limit_hits_total[5m])
```

## Exempt Endpoints

The following endpoints are **exempt** from rate limiting:
- `/actuator/**` - Health checks and metrics
- `/swagger-ui/**` - API documentation
- `/api-docs/**` - OpenAPI specs
- `/v3/api-docs/**` - OpenAPI v3 specs
- `/api/v1/webhooks/**` - Webhook endpoints

## Testing

### Disabling Rate Limiting in Tests

Rate limiting is automatically disabled in test profiles:

```yaml
# application-test.yml
rate-limit:
  enabled: false
```

### Testing Rate Limits

To test rate limits in development:

1. **Enable rate limiting**:
```yaml
rate-limit:
  enabled: true
  default-requests-per-minute: 10  # Set low for testing
```

2. **Make rapid requests**:
```bash
for i in {1..15}; do
  curl -H "X-Org-Id: TEST-ORG" \
       -H "Authorization: Bearer <token>" \
       http://localhost:8080/api/v1/annonces
done
```

3. **Observe 429 responses** after exceeding limit

## Implementation Details

### Token Bucket Algorithm

- **Capacity**: Equal to `requestsPerMinute` setting
- **Refill**: Linear refill of full capacity every 1 minute
- **Consumption**: 1 token per request
- **Strategy**: `Bandwidth.classic()` with `Refill.intervally()`

### Thread Safety

- Uses `ConcurrentHashMap` for bucket storage
- `Bucket` objects from Bucket4j are thread-safe
- No external synchronization needed

### Memory Management

- Buckets are created on-demand (lazy initialization)
- Buckets persist in memory for the application lifetime
- No automatic eviction (suitable for bounded number of orgs)
- Can be manually cleared via admin API

### Performance

- **Lookup Time**: O(1) for bucket resolution (HashMap)
- **Token Consumption**: O(1) Bucket4j operation
- **Database Queries**: Cached in-memory after first lookup per org
- **Overhead**: ~1-2ms per request

## Migration

The rate limiting tables are created via Flyway migration `V23__Add_rate_limit_tier.sql`:

```sql
-- Creates rate_limit_tier table
-- Seeds default STANDARD and example PREMIUM tiers
```

## Environment Variables

```bash
# Default rate limit for organizations without custom tier
RATE_LIMIT_DEFAULT_RPM=100

# Enable/disable rate limiting globally
RATE_LIMIT_ENABLED=true
```

## Best Practices

1. **Set Appropriate Limits**: Consider API usage patterns when setting limits
2. **Monitor Metrics**: Watch for high rejection rates indicating undersized limits
3. **Gradual Rollout**: Start with high limits and reduce based on data
4. **Document Limits**: Communicate rate limits to API consumers
5. **Provide Reset Endpoint**: Allow admins to clear buckets in case of issues
6. **Use Retry-After**: Clients should respect Retry-After header

## Troubleshooting

### Rate Limits Not Applied

**Symptom**: Requests not being rate limited

**Solutions**:
1. Check `rate-limit.enabled=true` in configuration
2. Verify RateLimitFilter is registered (check logs)
3. Ensure X-Org-Id header is present
4. Check endpoint is not exempt from rate limiting

### Rate Limits Too Aggressive

**Symptom**: Legitimate requests being rejected

**Solutions**:
1. Check rate limit tier for organization
2. Increase `requestsPerMinute` for the tier
3. Reset bucket if corrupted: `POST /api/v1/admin/rate-limits/{orgId}/reset`
4. Check for request bursts (token bucket smooths bursts)

### Metrics Not Appearing

**Symptom**: rate_limit.* metrics missing in Prometheus

**Solutions**:
1. Verify Micrometer is configured correctly
2. Check `/actuator/prometheus` endpoint
3. Ensure rate limiting is enabled
4. Make some API requests to generate metrics

## Future Enhancements

Potential improvements for future iterations:

1. **Redis Storage**: Distribute buckets across instances
2. **Per-Endpoint Limits**: Different limits for different APIs
3. **Burst Allowance**: Separate burst capacity
4. **Time-Based Rules**: Different limits for peak/off-peak hours
5. **IP-Based Limiting**: Secondary limit by IP address
6. **Quota Management**: Monthly/daily quotas in addition to rate limits
7. **Rate Limit Headers**: Add X-RateLimit-* headers to responses
8. **Warming Period**: Gradual reduction for new organizations

## References

- [Bucket4j Documentation](https://bucket4j.com/)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [RFC 6585 - 429 Too Many Requests](https://tools.ietf.org/html/rfc6585)
- [Micrometer Documentation](https://micrometer.io/)
