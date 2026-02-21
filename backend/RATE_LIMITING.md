# API Rate Limiting and Abuse Prevention

## Overview

This application implements comprehensive API rate limiting and abuse prevention using the bucket4j token bucket algorithm with distributed storage in Redis. The system supports both organization-based and IP-based rate limiting.

## Features

### 1. Token Bucket Algorithm
- Uses bucket4j library for efficient token bucket implementation
- Tokens refill at a configurable rate per minute
- Requests consume tokens; rejected when bucket is empty

### 2. Distributed Rate Limiting
- **Redis-backed storage**: Bucket state stored in Redis for consistency across multiple backend instances
- **Automatic failover**: Falls back to in-memory buckets if Redis is unavailable
- **Lettuce client**: Uses Lettuce Redis client for async, non-blocking operations

### 3. Per-Organization Quotas
- **Standard tier**: 100 requests per minute (default)
- **Premium tier**: 1000 requests per minute
- **Custom tiers**: Configurable per organization via admin API
- Database-backed tier configuration

### 4. IP-Based Rate Limiting
- **Public endpoints**: 60 requests per minute per IP address (default)
- **Proxy-aware**: Extracts real IP from X-Forwarded-For and X-Real-IP headers
- Protects webhook endpoints and unauthenticated APIs

### 5. HTTP 429 Too Many Requests
- Returns proper HTTP 429 status code when limit exceeded
- **Retry-After header**: Indicates wait time (60 seconds)
- **X-RateLimit-Limit-Type header**: Specifies whether limit is org or IP-based
- RFC 7807 Problem Details format for error responses

### 6. Comprehensive Metrics
All metrics are exposed via Micrometer and available at `/actuator/prometheus`:

- `rate_limit_hits_total`: Total requests hitting rate limiter
- `rate_limit_rejections_total`: Total requests rejected
- `rate_limit_org_hits_total`: Organization-based requests
- `rate_limit_org_rejections_total`: Organization-based rejections
- `rate_limit_ip_hits_total`: IP-based requests
- `rate_limit_ip_rejections_total`: IP-based rejections
- `rate_limit_check_duration_seconds`: Time to perform rate limit checks

### 7. Admin Management API
Exposed at `/api/v1/admin/rate-limits`:

- `GET /api/v1/admin/rate-limits` - List all rate limit configurations
- `GET /api/v1/admin/rate-limits/{orgId}` - Get rate limit for specific org
- `POST /api/v1/admin/rate-limits` - Create new rate limit configuration
- `PUT /api/v1/admin/rate-limits/{orgId}` - Update rate limit configuration
- `DELETE /api/v1/admin/rate-limits/{orgId}` - Delete rate limit configuration
- `POST /api/v1/admin/rate-limits/org/{orgId}/reset` - Clear bucket for org
- `POST /api/v1/admin/rate-limits/ip/{ipAddress}/reset` - Clear bucket for IP
- `GET /api/v1/admin/rate-limits/statistics` - Get rate limiting statistics

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Request Flow                             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  RateLimitFilter     │
                    │  (Servlet Filter)    │
                    └──────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  RateLimitService    │
                    └──────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
    ┌───────────────────────┐     ┌───────────────────────┐
    │  Redis (via bucket4j) │     │  In-Memory Fallback   │
    │  Distributed Storage  │     │  ConcurrentHashMap    │
    └───────────────────────┘     └───────────────────────┘
                │
                ▼
    ┌───────────────────────┐
    │  RateLimitTier Entity │
    │  (PostgreSQL/H2)      │
    └───────────────────────┘
```

### Filter Order
`RateLimitFilter` runs at `Ordered.HIGHEST_PRECEDENCE - 50`, ensuring rate limiting occurs early in the filter chain before authentication and business logic.

### Exempt Endpoints
The following endpoints are exempt from rate limiting:
- `/actuator/**` - Health checks and metrics
- `/swagger-ui/**` - API documentation
- `/api-docs/**`, `/v3/api-docs/**` - OpenAPI specs

### Public Endpoints (IP-based rate limiting)
- `/api/v1/webhooks/**` - Webhook receivers
- `/api/v1/public/**` - Public APIs without authentication

## Configuration

### Application Properties

```yaml
rate-limit:
  default-requests-per-minute: 100
  ip-based-requests-per-minute: 60
  enabled: true
  use-redis: true

spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: ""
```

### Environment Variables

- `RATE_LIMIT_DEFAULT_RPM`: Default requests per minute (default: 100)
- `RATE_LIMIT_IP_BASED_RPM`: IP-based requests per minute (default: 60)
- `RATE_LIMIT_ENABLED`: Enable/disable rate limiting (default: true)
- `RATE_LIMIT_USE_REDIS`: Use Redis for distributed rate limiting (default: true)
- `REDIS_HOST`: Redis host (default: localhost)
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password (optional)

## Database Schema

```sql
CREATE TABLE rate_limit_tier (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    tier_name VARCHAR(50) NOT NULL,
    requests_per_minute INTEGER NOT NULL CHECK (requests_per_minute > 0),
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_rate_limit_tier_org_id UNIQUE (org_id)
);

CREATE INDEX idx_rate_limit_tier_org_id ON rate_limit_tier(org_id);
```

## Redis Key Structure

### Organization Buckets
```
rate-limit:org:{orgId}
```
Example: `rate-limit:org:ORG-123`

### IP Address Buckets
```
rate-limit:ip:{ipAddress}
```
Example: `rate-limit:ip:192.168.1.100`

### Expiration Strategy
Buckets expire 2 minutes after the last write operation to prevent memory leaks for inactive keys.

## Usage Examples

### 1. Creating a Premium Tier Organization

```bash
curl -X POST http://localhost:8080/api/v1/admin/rate-limits \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "premium-org-123",
    "tierName": "PREMIUM",
    "requestsPerMinute": 1000,
    "description": "Premium tier with 1000 req/min"
  }'
```

### 2. Updating Organization Limits

```bash
curl -X PUT http://localhost:8080/api/v1/admin/rate-limits/premium-org-123 \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "tierName": "ENTERPRISE",
    "requestsPerMinute": 5000,
    "description": "Enterprise tier with 5000 req/min"
  }'
```

### 3. Resetting Rate Limit Bucket

```bash
# Reset organization bucket
curl -X POST http://localhost:8080/api/v1/admin/rate-limits/org/premium-org-123/reset \
  -H "Authorization: Bearer ${TOKEN}"

# Reset IP bucket
curl -X POST http://localhost:8080/api/v1/admin/rate-limits/ip/192.168.1.100/reset \
  -H "Authorization: Bearer ${TOKEN}"
```

### 4. Getting Rate Limit Statistics

```bash
curl http://localhost:8080/api/v1/admin/rate-limits/statistics \
  -H "Authorization: Bearer ${TOKEN}"
```

Response:
```json
{
  "totalHits": 15230,
  "totalRejections": 342,
  "orgHits": 12450,
  "orgRejections": 234,
  "ipHits": 2780,
  "ipRejections": 108,
  "rejectionRate": 2.24
}
```

## Testing Rate Limits

### Test Organization-Based Limiting

```bash
# Make requests with X-Org-Id header
for i in {1..110}; do
  curl -X GET http://localhost:8080/api/v1/annonces \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-Org-Id: test-org"
  echo "Request $i"
done
```

After 100 requests, you should receive:
```json
{
  "type": "about:blank",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded for organization. Please try again later.",
  "retryAfter": 60
}
```

Headers:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit-Type: organization
```

### Test IP-Based Limiting

```bash
# Make requests to public endpoint without X-Org-Id
for i in {1..70}; do
  curl -X POST http://localhost:8080/api/v1/webhooks/test \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
  echo "Request $i"
done
```

After 60 requests (default IP limit), you should receive HTTP 429.

## Monitoring

### Prometheus Metrics

Access metrics at: `http://localhost:8080/actuator/prometheus`

```promql
# Total rate limit rejections
rate_limit_rejections_total

# Rejection rate over last 5 minutes
rate(rate_limit_rejections_total[5m])

# Organization-specific rejections
rate_limit_org_rejections_total

# IP-based rejections
rate_limit_ip_rejections_total

# Rate limit check duration (p99)
histogram_quantile(0.99, rate(rate_limit_check_duration_seconds_bucket[5m]))
```

### Grafana Dashboard Queries

**Rejection Rate Panel:**
```promql
100 * (
  rate(rate_limit_rejections_total[5m])
  /
  rate(rate_limit_hits_total[5m])
)
```

**Requests Per Second by Type:**
```promql
rate(rate_limit_org_hits_total[1m])
rate(rate_limit_ip_hits_total[1m])
```

## Performance Considerations

### Redis Performance
- **Bucket operations**: O(1) complexity
- **Network latency**: Typically 1-2ms for local Redis
- **Throughput**: Redis can handle 100k+ ops/sec
- **Replication**: Use Redis Sentinel or Cluster for HA

### Fallback Strategy
If Redis is unavailable:
1. Logs error and falls back to in-memory buckets
2. Rate limiting continues to function (per-instance basis)
3. Inconsistent limits across multiple instances (acceptable degradation)

### Memory Usage
- **In-memory buckets**: ~200 bytes per bucket
- **Redis buckets**: ~150 bytes per key in Redis
- **Auto-cleanup**: Buckets expire after 2 minutes of inactivity

## Security Considerations

### IP Spoofing Prevention
- Filter validates X-Forwarded-For header format
- Only uses first IP in X-Forwarded-For chain
- Configurable trusted proxy setup recommended for production

### DDoS Protection
- IP-based rate limiting provides first line of defense
- Consider additional layers (WAF, CDN rate limiting)
- Redis-based storage prevents memory exhaustion attacks

### Admin API Access
- All admin endpoints require `ROLE_ADMIN`
- Use OAuth2/JWT for authentication
- Consider IP whitelisting for admin endpoints

## Troubleshooting

### Rate limits not working
1. Check if rate limiting is enabled: `rate-limit.enabled=true`
2. Verify Redis connectivity
3. Check logs for fallback messages
4. Verify X-Org-Id header is being sent

### Redis connection errors
```
Error accessing Redis-backed bucket for key: rate-limit:org:XXX. Falling back to in-memory bucket.
```
- Verify Redis is running: `redis-cli ping`
- Check Redis host/port configuration
- Verify network connectivity
- Check Redis password if configured

### Bucket not resetting
- Use admin API to manually reset: `POST /api/v1/admin/rate-limits/org/{orgId}/reset`
- Check Redis expiration strategy
- Verify bucket configuration updates are propagating

## Future Enhancements

1. **Sliding window algorithm**: More precise rate limiting
2. **Tiered rate limits**: Different limits for different endpoint groups
3. **Rate limit headers**: Add X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
4. **GraphQL rate limiting**: Per-query complexity scoring
5. **WebSocket rate limiting**: Message-based throttling
6. **Geographic rate limiting**: Different limits per region
7. **User-based rate limiting**: Per-user quotas independent of org
