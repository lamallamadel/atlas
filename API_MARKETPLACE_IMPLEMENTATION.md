# API Marketplace Implementation

Complete implementation of public API marketplace infrastructure with OAuth2, webhooks, and developer portal.

## Overview

This implementation provides a comprehensive API marketplace with:

- **Public REST API** (`/api/public/v1/*`) with versioned endpoints
- **OAuth2 Authorization Server** using Spring Authorization Server
- **Webhook System** with signature verification (HMAC-SHA256)
- **Developer Portal** (Angular) for API key management and analytics
- **Rate Limiting Tiers** (Free/Pro/Enterprise)
- **Integration Examples** for Zapier/Make/n8n

## Architecture

### Backend Components

#### 1. Entities

- **ApiKeyEntity** - API key management with hashing and tiered access
- **WebhookSubscriptionEntity** - Webhook subscriptions with retry policies
- **WebhookDeliveryEntity** - Delivery tracking and retry logic
- **ApiUsageEntity** - Usage analytics per endpoint and date

#### 2. Services

- **ApiKeyService** - API key generation, validation, and management
- **WebhookService** - Webhook delivery with HMAC-SHA256 signing
- **ApiUsageTrackingService** - Usage analytics and reporting

#### 3. Controllers

- **PublicApiV1Controller** - Public API endpoints for third-party access
- **DeveloperPortalController** - Developer portal API for key/webhook management

#### 4. Security

- **ApiKeyAuthenticationFilter** - API key validation for public endpoints
- **PublicApiRateLimitFilter** - Tier-based rate limiting using Bucket4j
- **SecurityConfig** - Updated with API key authentication

### Frontend Components

#### Developer Portal (Angular)

- **DeveloperPortalComponent** - Main UI for developers
  - API key creation and management
  - Webhook subscription configuration
  - Usage analytics dashboard
  - Real-time delivery monitoring

## Features

### 1. API Key Management

**Tiers:**
- **Free**: 60 requests/minute
- **Pro**: 600 requests/minute
- **Enterprise**: 6000 requests/minute

**Security:**
- SHA-256 hashing with BCrypt
- Prefix-based key identification
- Expiration support
- Scope-based permissions

**Example:**
```bash
curl -X POST https://api.example.com/api/v1/developer/api-keys \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "tier": "PRO",
    "description": "Main production key"
  }'
```

### 2. Webhook System

**Supported Events:**
- `dossier.created` - New dossier created
- `dossier.updated` - Dossier modified
- `dossier.status_changed` - Status transition
- `message.received` - Incoming message
- `message.sent` - Outgoing message sent
- `appointment.scheduled` - New appointment
- `appointment.updated` - Appointment modified
- `appointment.cancelled` - Appointment cancelled

**Signature Verification (HMAC-SHA256):**
```javascript
// Node.js example
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expected = hmac.digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

**Retry Policy:**
```json
{
  "maxRetries": 3,
  "retryDelaySeconds": 60,
  "backoffStrategy": "exponential"
}
```
Delays: 60s → 120s → 240s (exponential backoff)

### 3. Public API Endpoints

**List Dossiers:**
```bash
GET /api/public/v1/dossiers
X-API-Key: YOUR_API_KEY

# Response
{
  "content": [
    {
      "id": 123,
      "reference": "DOS-2024-001",
      "status": "NEW",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ],
  "totalElements": 1,
  "totalPages": 1
}
```

**Get Dossier:**
```bash
GET /api/public/v1/dossiers/123
X-API-Key: YOUR_API_KEY

# Response
{
  "id": 123,
  "reference": "DOS-2024-001",
  "status": "NEW",
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-01T10:00:00Z"
}
```

### 4. Developer Portal Features

**API Key Management:**
- Create/revoke API keys
- View usage statistics
- Monitor active keys
- Copy keys securely

**Webhook Configuration:**
- Subscribe to events
- Configure retry policies
- Pause/resume subscriptions
- View delivery logs

**Usage Analytics:**
- Request count per endpoint
- Success/error rates
- Average response times
- Date range filtering

## Database Schema

### Migration: V108__Create_api_marketplace_tables.sql

```sql
-- API Keys
CREATE TABLE api_key (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    tier VARCHAR(20) NOT NULL DEFAULT 'FREE',
    ...
);

-- Webhook Subscriptions
CREATE TABLE webhook_subscription (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    retry_policy ${json_type},
    ...
);

-- Webhook Deliveries
CREATE TABLE webhook_delivery (
    id BIGSERIAL PRIMARY KEY,
    subscription_id BIGINT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload ${json_type},
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    ...
);

-- API Usage
CREATE TABLE api_usage (
    id BIGSERIAL PRIMARY KEY,
    api_key_id BIGINT NOT NULL,
    usage_date DATE NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    request_count BIGINT DEFAULT 0,
    ...
);
```

## Integration Examples

### Zapier

1. Create webhook in Zapier (Webhooks by Zapier → Catch Hook)
2. Copy webhook URL
3. Create subscription in Developer Portal
4. Add action steps to process events

### Make (Integromat)

1. Add Webhooks module → Custom webhook
2. Copy webhook URL
3. Create subscription with webhook URL
4. Configure router for multiple event types

### n8n (Self-hosted)

1. Import workflow JSON
2. Configure webhook node
3. Set up API authentication (Header Auth)
4. Test workflow with sample data

### Custom Integration (Node.js)

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.example.com',
  headers: {
    'X-API-Key': process.env.API_KEY
  }
});

// List dossiers
const dossiers = await client.get('/api/public/v1/dossiers');

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = process.env.WEBHOOK_SECRET;
  
  if (!verifySignature(req.body, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  console.log('Event:', req.body.event);
  res.status(200).send('OK');
});
```

## Rate Limiting

Rate limits are enforced per API key based on tier:

| Tier | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Free | 60 | 86,400 |
| Pro | 600 | 864,000 |
| Enterprise | 6000 | 8,640,000 |

**Rate Limit Headers:**
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit-Type: FREE
Retry-After: 60
```

## OpenAPI Documentation

Access comprehensive API documentation:

- **Swagger UI**: http://localhost:8080/swagger-ui
- **Public API Group**: Select "Public API (Third-Party)" from dropdown
- **Developer Portal Group**: Select "Developer Portal"

### Security Schemes

- **API Key**: `X-API-Key` header
- **Bearer JWT**: For authenticated developer portal endpoints

## Configuration

### application.yml

```yaml
app:
  webhook:
    signature:
      enabled: true

rate-limit:
  enabled: true
  use-redis: true
```

### Security Configuration

Public API endpoints are exempt from JWT authentication but require API key:

```java
.requestMatchers("/api/public/v1/**").permitAll()
```

## Testing

### Test API Key Creation

```bash
# Create API key
curl -X POST http://localhost:8080/api/v1/developer/api-keys \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Key",
    "tier": "FREE"
  }'

# Response includes plainTextKey (shown only once)
{
  "id": 1,
  "name": "Test Key",
  "keyPrefix": "sk_abc123",
  "tier": "FREE",
  "status": "ACTIVE",
  "plainTextKey": "sk_abc123xyz..."
}
```

### Test Public API

```bash
# Use the API key
curl -X GET http://localhost:8080/api/public/v1/dossiers \
  -H "X-API-Key: sk_abc123xyz..."
```

### Test Webhook

```bash
# Create webhook subscription
curl -X POST http://localhost:8080/api/v1/developer/webhooks \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Webhook",
    "url": "https://webhook.site/YOUR_ID",
    "eventType": "dossier.created"
  }'

# Trigger test webhook
curl -X POST http://localhost:8080/api/public/v1/webhooks/test \
  -H "X-API-Key: sk_abc123xyz..." \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## Documentation Files

- **WEBHOOK_INTEGRATION_GUIDE.md** - Complete webhook integration guide
  - Event types and payload schemas
  - Signature verification examples (Node.js, Python, Java)
  - Retry policies and best practices
  - Troubleshooting guide

## Best Practices

### API Key Security

1. **Never commit keys** to version control
2. **Rotate keys regularly** for production
3. **Use environment variables** for key storage
4. **Revoke compromised keys** immediately
5. **Monitor usage** for anomalies

### Webhook Security

1. **Always verify signatures** using HMAC-SHA256
2. **Use HTTPS endpoints** only
3. **Implement idempotency** using delivery IDs
4. **Return 200 quickly** - process asynchronously
5. **Monitor delivery health** in Developer Portal

### Rate Limiting

1. **Start with Free tier** for development
2. **Upgrade to Pro** for production
3. **Implement exponential backoff** on 429 responses
4. **Cache frequently accessed data**
5. **Batch requests** when possible

## Troubleshooting

### API Key Not Working

- Check key status is `ACTIVE`
- Verify key hasn't expired
- Ensure correct header: `X-API-Key` or `Authorization: Bearer`
- Check rate limits haven't been exceeded

### Webhook Not Delivering

- Verify webhook status is `ACTIVE`
- Check URL is accessible from internet
- Review delivery logs for errors
- Verify signature verification logic
- Check firewall rules

### Rate Limit Exceeded

- Reduce request frequency
- Implement caching
- Upgrade to higher tier
- Use pagination for list endpoints

## Future Enhancements

1. **OAuth2 Client Credentials Flow** - Alternative to API keys
2. **Webhook Filtering** - Filter events by criteria
3. **GraphQL Public API** - Alternative to REST
4. **SDK Generation** - Auto-generated client libraries
5. **Webhook Replay** - Replay failed deliveries
6. **API Versioning** - Deprecation and migration support
7. **Usage Quotas** - Hard limits per tier
8. **Team Management** - Share API keys across team

## Support

- **Documentation**: http://localhost:8080/swagger-ui
- **Developer Portal**: http://localhost:4200/developer-portal
- **Email**: api-support@example.com
