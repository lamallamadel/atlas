# Cloudflare CDN Configuration Guide

## Overview

This document describes the Cloudflare CDN configuration for Atlas CRM, including edge caching strategies, load balancing, and security policies.

## Architecture

```
User Request
    ↓
Cloudflare Edge (200+ locations worldwide)
    ↓
Cloudflare Load Balancer (Geo-steering)
    ↓
┌─────────┬─────────┬─────────┐
│ EU Pool │ US Pool │ AP Pool │
└─────────┴─────────┴─────────┘
    ↓         ↓         ↓
Regional ALBs → ECS Services
```

## Load Balancer Configuration

### Geographic Steering

Traffic is routed based on user location:

| User Region | Primary Pool | Fallback Pool |
|-------------|-------------|---------------|
| Western Europe | EU-West-1 | US-East-1 |
| Eastern Europe | EU-West-1 | US-East-1 |
| North America | US-East-1 | EU-West-1 |
| South America | US-East-1 | EU-West-1 |
| Southeast Asia | AP-Southeast-1 | US-East-1 |
| Northeast Asia | AP-Southeast-1 | US-East-1 |
| Oceania | AP-Southeast-1 | US-East-1 |
| Africa | EU-West-1 | US-East-1 |

### Health Checks

Each origin pool is monitored with:
- **Interval**: 60 seconds
- **Timeout**: 5 seconds
- **Retries**: 2
- **Method**: GET /actuator/health
- **Expected Status**: 200
- **Expected Body**: Contains "UP"

### Pool Configuration

```javascript
// EU-West-1 Pool
{
  name: "atlas-crm-eu-west-1",
  origins: [{
    name: "eu-west-1-origin",
    address: "atlas-crm-alb-eu-west-1-xxx.eu-west-1.elb.amazonaws.com",
    enabled: true,
    weight: 1.0
  }],
  check_regions: ["WEUR", "EEUR"],
  minimum_origins: 1
}

// US-East-1 Pool
{
  name: "atlas-crm-us-east-1",
  origins: [{
    name: "us-east-1-origin",
    address: "atlas-crm-alb-us-east-1-xxx.us-east-1.elb.amazonaws.com",
    enabled: true,
    weight: 1.0
  }],
  check_regions: ["NAM"],
  minimum_origins: 1
}

// AP-Southeast-1 Pool
{
  name: "atlas-crm-ap-southeast-1",
  origins: [{
    name: "ap-southeast-1-origin",
    address: "atlas-crm-alb-ap-southeast-1-xxx.ap-southeast-1.elb.amazonaws.com",
    enabled: true,
    weight: 1.0
  }],
  check_regions: ["SEAS", "NEAS"],
  minimum_origins: 1
}
```

## Caching Rules

### Page Rules Priority

1. **Static Assets** (Priority 1)
   - Pattern: `cdn.atlas-crm.com/assets/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 2 hours (7200 seconds)
   - Browser Cache TTL: 1 hour (3600 seconds)

2. **Images** (Priority 2)
   - Pattern: `cdn.atlas-crm.com/images/*`
   - Cache Level: Cache Everything
   - Edge Cache TTL: 24 hours (86400 seconds)
   - Browser Cache TTL: 2 hours (7200 seconds)

3. **API Bypass** (Priority 3)
   - Pattern: `api.atlas-crm.com/api/*`
   - Cache Level: Bypass
   - Security Level: Medium

### Cache Key Fields

For static assets, cache keys exclude:
- Query strings (except version parameter)
- Most headers
- Cookies
- User device type
- User geolocation

Example cache key:
```
cdn.atlas-crm.com/assets/main.js?v=1.2.3
```

## Security Configuration

### TLS Settings

```javascript
{
  tls_1_3: "on",
  automatic_https_rewrites: "on",
  ssl: "strict",
  always_use_https: "on",
  min_tls_version: "1.2",
  opportunistic_encryption: "on",
  tls_client_auth: "off"
}
```

### Rate Limiting

**API Rate Limit:**
- Threshold: 1000 requests per minute per IP
- Action: Challenge (CAPTCHA)
- Timeout: 60 seconds
- Pattern: `api.atlas-crm.com/api/*`

**Login Rate Limit:**
- Threshold: 5 requests per minute per IP
- Action: Block
- Timeout: 300 seconds
- Pattern: `api.atlas-crm.com/api/auth/login`

### Firewall Rules

1. **Block Known Bad Bots**
   - Expression: `(cf.client.bot) and not (cf.verified_bot_category in {"Search Engine Crawler" "Monitoring & Analytics"})`
   - Action: Block

2. **Challenge Suspicious Countries** (if needed)
   - Expression: `ip.geoip.country in {"XX" "YY"}`
   - Action: Challenge

3. **Block Common Attack Patterns**
   - SQL Injection attempts
   - XSS attempts
   - Path traversal attempts

## Performance Optimizations

### Compression

- **Brotli**: Enabled (for supported browsers)
- **Gzip**: Enabled (fallback)

### HTTP/2 & HTTP/3

- **HTTP/2**: Enabled
- **HTTP/3 (QUIC)**: Enabled
- **0-RTT**: Enabled for returning visitors

### Early Hints

Enabled to send HTTP 103 responses with critical resource hints before full response.

### Minification

Automatic minification enabled for:
- JavaScript files
- CSS files
- HTML files

### Image Optimization (Polish)

- **Lossy**: Enabled
- **WebP**: Enabled for supported browsers
- **AVIF**: Enabled for supported browsers

### Tiered Caching

Enabled to reduce origin load:
- Upper-tier cache (regional)
- Lower-tier cache (edge)

## Testing CDN Configuration

### Test Geographic Routing

```bash
# Test from different regions using VPN or proxy
curl -I https://cdn.atlas-crm.com/test

# Check CF-Ray header to identify PoP
curl -I https://cdn.atlas-crm.com/test | grep CF-Ray

# Check which origin served request
curl -I https://cdn.atlas-crm.com/test | grep X-Served-By
```

### Test Caching

```bash
# First request (should be MISS)
curl -I https://cdn.atlas-crm.com/assets/main.js
# Check: CF-Cache-Status: MISS

# Second request (should be HIT)
curl -I https://cdn.atlas-crm.com/assets/main.js
# Check: CF-Cache-Status: HIT

# Check cache age
curl -I https://cdn.atlas-crm.com/assets/main.js | grep Age
```

### Test Load Balancing

```bash
# Continuously test to see pool selection
for i in {1..10}; do
  curl -s -I https://api.atlas-crm.com/actuator/health | grep X-Served-By
  sleep 1
done
```

### Test Failover

```bash
# Disable primary pool in Cloudflare dashboard
# Then test that traffic redirects to fallback

curl -I https://api.atlas-crm.com/actuator/health
# Should show fallback pool in X-Served-By header
```

## Monitoring

### Analytics

Access Cloudflare Analytics:
- Dashboard: https://dash.cloudflare.com/
- Zone: atlas-crm.com
- Analytics tab

Key metrics:
- Total requests
- Bandwidth saved (cache ratio)
- Requests by country
- Traffic by content type
- Security events

### Logs

Enable Logpush to S3 for analysis:

```javascript
{
  destination_conf: "s3://atlas-crm-logs/cloudflare/?region=eu-west-1",
  ownership_challenge: "xxx",
  dataset: "http_requests",
  frequency: "high"
}
```

### Alerts

Configure alerts for:
- Origin health changes
- High error rates (5xx)
- DDoS attacks
- Certificate expiration

## Troubleshooting

### Issue: Cache Not Working

**Check:**
```bash
# Verify cache status
curl -I https://cdn.atlas-crm.com/assets/test.js | grep CF-Cache-Status

# Possible values:
# HIT - Served from cache
# MISS - Not in cache, fetched from origin
# EXPIRED - Cache expired, revalidating
# DYNAMIC - Not cacheable
# BYPASS - Bypassed by page rule
```

**Solutions:**
1. Check page rules priority
2. Verify cache level settings
3. Check origin cache headers
4. Purge cache manually

### Issue: Load Balancer Not Routing

**Check:**
```bash
# Check pool health
curl https://api.cloudflare.com/client/v4/accounts/{account_id}/load_balancers/pools/{pool_id}/health

# Check load balancer status
curl https://api.cloudflare.com/client/v4/zones/{zone_id}/load_balancers/{lb_id}
```

**Solutions:**
1. Verify origin health checks passing
2. Check pool weights
3. Verify DNS records
4. Check traffic steering rules

### Issue: High Origin Load

**Check:**
- Cache hit ratio in Analytics
- Bypass rate
- Origin response times

**Solutions:**
1. Increase cache TTLs
2. Enable Tiered Cache
3. Add more page rules for static content
4. Enable image optimization

## Best Practices

1. **Always use versioned URLs** for static assets
   - Good: `/assets/main.js?v=1.2.3`
   - Bad: `/assets/main.js`

2. **Set appropriate cache headers** at origin
   ```
   Cache-Control: public, max-age=31536000, immutable
   ```

3. **Use cache tags** for selective purging
   ```
   Cache-Tag: version-1.2.3, component-header
   ```

4. **Monitor cache ratio** - aim for >90% for static assets

5. **Test changes in staging** before production

6. **Use Page Rules sparingly** - limit 125 per zone

7. **Enable Bot Management** for API endpoints

8. **Review security events** weekly

## API Management

### Purge Cache

```bash
# Purge everything (use sparingly)
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Purge specific files
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://cdn.atlas-crm.com/assets/main.js"]}'

# Purge by tag
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"tags":["version-1.2.3"]}'
```

### Update Load Balancer

```bash
# Update pool health
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/{account_id}/load_balancers/pools/{pool_id}" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"enabled":false}'
```
