# Rate Limiting Quick Start Guide

## For Developers

### Quick Setup

1. **Ensure Redis is running** (required for distributed rate limiting):
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

2. **Configuration** is already set up in `application.yml`:
   ```yaml
   rate-limit:
     default-requests-per-minute: 100
     ip-based-requests-per-minute: 60
     enabled: true
     use-redis: true
   ```

3. **Database migrations** automatically run on startup (Flyway).

### Testing Rate Limits Locally

#### Test Organization-Based Rate Limiting

```bash
# Set your auth token
TOKEN="your-jwt-token-here"

# Make 105 requests to exceed the 100/min default limit
for i in {1..105}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-Org-Id: test-org" \
    http://localhost:8080/api/v1/annonces
done
```

Expected output: First 100 requests return `200`, remaining return `429`.

#### Test IP-Based Rate Limiting

```bash
# Make 65 requests to exceed the 60/min IP limit
for i in {1..65}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    http://localhost:8080/api/v1/webhooks/test
done
```

Expected output: First 60 requests return `200` or `404`, remaining return `429`.

### Admin API Endpoints

All admin endpoints require `ROLE_ADMIN` and are at `/api/v1/admin/rate-limits`:

```bash
# List all rate limit configurations
curl -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:8080/api/v1/admin/rate-limits

# Get rate limit for specific org
curl -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:8080/api/v1/admin/rate-limits/my-org

# Create premium tier (1000 req/min)
curl -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "premium-org-123",
    "tierName": "PREMIUM",
    "requestsPerMinute": 1000,
    "description": "Premium tier with 1000 req/min"
  }' \
  http://localhost:8080/api/v1/admin/rate-limits

# Update rate limit
curl -X PUT \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "tierName": "ENTERPRISE",
    "requestsPerMinute": 5000,
    "description": "Enterprise tier"
  }' \
  http://localhost:8080/api/v1/admin/rate-limits/premium-org-123

# Reset rate limit bucket (clear immediately)
curl -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:8080/api/v1/admin/rate-limits/org/premium-org-123/reset

# Get statistics
curl -H "Authorization: Bearer ${TOKEN}" \
  http://localhost:8080/api/v1/admin/rate-limits/statistics
```

### Checking Metrics

Access Prometheus metrics at: `http://localhost:8080/actuator/prometheus`

Key metrics:
- `rate_limit_hits_total` - Total requests evaluated
- `rate_limit_rejections_total` - Total requests rejected
- `rate_limit_org_hits_total` - Organization-based requests
- `rate_limit_org_rejections_total` - Organization rejections
- `rate_limit_ip_hits_total` - IP-based requests
- `rate_limit_ip_rejections_total` - IP rejections
- `rate_limit_check_duration_seconds` - Performance timer

```bash
# View rate limit metrics
curl http://localhost:8080/actuator/prometheus | grep rate_limit
```

### Disabling Rate Limiting (for Testing)

#### Option 1: Environment Variable
```bash
RATE_LIMIT_ENABLED=false mvn spring-boot:run
```

#### Option 2: Application Properties
```yaml
rate-limit:
  enabled: false
```

#### Option 3: Test Profile
E2E tests automatically disable rate limiting via `application-e2e.yml`.

### Common Tier Configurations

```sql
-- Standard tier (100 req/min)
INSERT INTO rate_limit_tier (org_id, tier_name, requests_per_minute, description, created_at, updated_at)
VALUES ('standard-org', 'STANDARD', 100, 'Standard tier', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Premium tier (1000 req/min)
INSERT INTO rate_limit_tier (org_id, tier_name, requests_per_minute, description, created_at, updated_at)
VALUES ('premium-org', 'PREMIUM', 1000, 'Premium tier', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Enterprise tier (5000 req/min)
INSERT INTO rate_limit_tier (org_id, tier_name, requests_per_minute, description, created_at, updated_at)
VALUES ('enterprise-org', 'ENTERPRISE', 5000, 'Enterprise tier', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Developer tier (50 req/min - for testing)
INSERT INTO rate_limit_tier (org_id, tier_name, requests_per_minute, description, created_at, updated_at)
VALUES ('dev-org', 'DEVELOPER', 50, 'Developer tier', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

### HTTP Response Format

When rate limit is exceeded, API returns:

**Status Code:** `429 Too Many Requests`

**Headers:**
```
Retry-After: 60
X-RateLimit-Limit-Type: organization
```

**Body (RFC 7807 Problem Details):**
```json
{
  "type": "about:blank",
  "title": "Too Many Requests",
  "status": 429,
  "detail": "Rate limit exceeded for organization. Please try again later.",
  "retryAfter": 60
}
```

### Troubleshooting

#### Rate limits not enforcing
1. Check if enabled: `rate-limit.enabled=true`
2. Verify Redis is running: `redis-cli ping`
3. Check logs for errors
4. Verify `X-Org-Id` header is sent

#### Redis connection issues
```
Error accessing Redis-backed bucket for key: rate-limit:org:XXX. Falling back to in-memory bucket.
```
- System automatically falls back to in-memory buckets
- Rate limiting continues to work (per-instance basis)
- Fix Redis and restart to restore distributed functionality

#### Bucket not resetting
- Wait 60 seconds for tokens to refill
- Or use admin API to manually reset: `POST /api/v1/admin/rate-limits/org/{orgId}/reset`

### Development Tips

1. **Mock Authentication**: Use mock tokens in development:
   ```bash
   TOKEN="mock-token-test"
   ```

2. **Test Different Tiers**: Create test organizations with different limits

3. **Monitor Performance**: Use `/actuator/prometheus` to track rate limit check latency

4. **Exempt Your Development Endpoints**: Add to `RateLimitFilter.isExemptEndpoint()` if needed

5. **Clear Buckets During Development**: Use reset endpoints to clear rate limit state quickly

### Integration with Frontend

Frontend should handle 429 responses:

```typescript
// Example Angular HTTP interceptor
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  return next.handle(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 429) {
        const retryAfter = error.headers.get('Retry-After');
        const limitType = error.headers.get('X-RateLimit-Limit-Type');
        
        // Show user-friendly message
        this.notificationService.error(
          `Rate limit exceeded for ${limitType}. Please try again in ${retryAfter} seconds.`
        );
      }
      return throwError(() => error);
    })
  );
}
```

### Performance Characteristics

- **Redis latency**: 1-2ms for local Redis
- **Rate limit check**: <5ms including Redis round-trip
- **Throughput**: Redis supports 100k+ ops/sec
- **Memory per bucket**: ~150 bytes in Redis
- **Auto-cleanup**: Buckets expire after 2 minutes of inactivity

### Further Reading

- Full documentation: [RATE_LIMITING.md](RATE_LIMITING.md)
- bucket4j documentation: https://bucket4j.com/
- Redis configuration: [application.yml](src/main/resources/application.yml)
