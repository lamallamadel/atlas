# API Marketplace Quick Start

Get started with the API Marketplace in 5 minutes.

## Prerequisites

- Backend running on http://localhost:8080
- Frontend running on http://localhost:4200
- Valid JWT token for authentication
- Database migrations applied (V108)

## Step 1: Access Developer Portal

Navigate to: http://localhost:4200/developer-portal

## Step 2: Create an API Key

1. Click **"API Keys"** tab
2. Click **"Create API Key"** button
3. Fill in the form:
   - **Name**: "My First API Key"
   - **Tier**: Free (60 req/min)
   - **Description**: "Testing the public API"
4. Click **"Create"**
5. **IMPORTANT**: Copy the API key immediately (shown only once)

```
sk_abc123xyz...
```

## Step 3: Test the Public API

Use your API key to call public endpoints:

```bash
# List dossiers
curl -X GET http://localhost:8080/api/public/v1/dossiers \
  -H "X-API-Key: YOUR_API_KEY"

# Get specific dossier
curl -X GET http://localhost:8080/api/public/v1/dossiers/1 \
  -H "X-API-Key: YOUR_API_KEY"
```

## Step 4: Create a Webhook

1. Click **"Webhooks"** tab
2. Click **"Create Webhook"** button
3. Fill in the form:
   - **Name**: "Test Webhook"
   - **URL**: "https://webhook.site/YOUR_UNIQUE_ID" (get from webhook.site)
   - **Event Type**: "dossier.created"
4. Click **"Create"**
5. Copy the signing secret for verification

## Step 5: Test Webhook Delivery

Trigger a test webhook:

```bash
curl -X POST http://localhost:8080/api/public/v1/webhooks/test \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true, "message": "Hello from API"}'
```

Check webhook.site to see the delivered payload.

## Step 6: View Usage Analytics

1. Click **"Usage Analytics"** tab
2. Select time range (7/30/90 days)
3. View metrics:
   - Total requests
   - Success rate
   - Average response time
   - Per-endpoint breakdown

## Rate Limits

Your tier determines request limits:

- **Free**: 60 requests/minute
- **Pro**: 600 requests/minute
- **Enterprise**: 6000 requests/minute

When you exceed the limit:
```json
HTTP/1.1 429 Too Many Requests
{
  "error": "Rate limit exceeded"
}
```

## Webhook Signature Verification

Always verify webhook signatures:

```javascript
// Node.js
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

app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  if (!verifySignature(req.body, signature, SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  const payload = JSON.parse(req.body);
  // Process webhook...
  
  res.status(200).send('OK');
});
```

## Available Events

Subscribe to these webhook events:

- `dossier.created` - New dossier
- `dossier.updated` - Dossier modified
- `dossier.status_changed` - Status changed
- `message.received` - Message received
- `message.sent` - Message sent
- `appointment.scheduled` - Appointment created
- `appointment.updated` - Appointment modified
- `appointment.cancelled` - Appointment cancelled

## API Documentation

View complete API docs:
- **Swagger UI**: http://localhost:8080/swagger-ui
- **Select**: "Public API (Third-Party)" group

## Next Steps

1. **Read the full guide**: [API_MARKETPLACE_IMPLEMENTATION.md](./API_MARKETPLACE_IMPLEMENTATION.md)
2. **Check webhook guide**: [WEBHOOK_INTEGRATION_GUIDE.md](./backend/src/main/resources/docs/WEBHOOK_INTEGRATION_GUIDE.md)
3. **Explore integrations**: Use Zapier, Make, or n8n
4. **Upgrade tier**: Contact support for Pro/Enterprise access

## Troubleshooting

### API Key Not Working

```bash
# Check key status
curl -X GET http://localhost:8080/api/v1/developer/api-keys \
  -H "Authorization: Bearer YOUR_JWT"
```

### Webhook Not Delivering

1. Check webhook status is "ACTIVE"
2. Verify URL is accessible
3. Check delivery logs in Developer Portal
4. Test with webhook.site first

### Rate Limit Issues

- Wait 60 seconds before retrying
- Implement exponential backoff
- Consider upgrading tier
- Cache responses when possible

## Support

- **Documentation**: http://localhost:8080/swagger-ui
- **Developer Portal**: http://localhost:4200/developer-portal
- **Issues**: Check console logs for errors
