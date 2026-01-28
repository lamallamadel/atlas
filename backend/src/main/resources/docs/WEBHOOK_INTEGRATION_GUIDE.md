# Webhook Integration Guide

## Overview

Webhooks allow your application to receive real-time notifications when events occur in the system. This guide covers webhook setup, payload schemas, signature verification, and retry policies.

## Webhook Events

### Available Events

- `dossier.created` - Triggered when a new dossier is created
- `dossier.updated` - Triggered when a dossier is modified
- `dossier.status_changed` - Triggered when a dossier status changes
- `message.received` - Triggered when a new message is received
- `message.sent` - Triggered when a message is sent
- `appointment.scheduled` - Triggered when an appointment is scheduled
- `appointment.updated` - Triggered when an appointment is modified
- `appointment.cancelled` - Triggered when an appointment is cancelled

## Setting Up a Webhook

### 1. Create a Webhook Subscription

```bash
POST /api/v1/developer/webhooks
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Production Webhook",
  "url": "https://your-app.com/webhooks/endpoint",
  "eventType": "dossier.created",
  "description": "Receive notifications for new dossiers",
  "retryPolicy": {
    "maxRetries": 3,
    "retryDelaySeconds": 60,
    "backoffStrategy": "exponential"
  }
}
```

Response:
```json
{
  "id": 123,
  "name": "Production Webhook",
  "url": "https://your-app.com/webhooks/endpoint",
  "eventType": "dossier.created",
  "status": "ACTIVE",
  "secret": "whsec_abc123...",
  "retryPolicy": {
    "maxRetries": 3,
    "retryDelaySeconds": 60,
    "backoffStrategy": "exponential"
  },
  "createdAt": "2024-01-01T10:00:00Z"
}
```

**Important:** Save the `secret` value - you'll need it to verify webhook signatures.

## Webhook Payload Schemas

### dossier.created

```json
{
  "event": "dossier.created",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "id": 456,
    "orgId": "ORG-123",
    "reference": "DOS-2024-001",
    "status": "NEW",
    "createdAt": "2024-01-01T10:00:00Z",
    "createdBy": "user@example.com"
  }
}
```

### message.received

```json
{
  "event": "message.received",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "id": 789,
    "dossierId": 456,
    "channel": "WHATSAPP",
    "from": "+33612345678",
    "content": "Hello, I'm interested in the property",
    "receivedAt": "2024-01-01T10:00:00Z"
  }
}
```

### appointment.scheduled

```json
{
  "event": "appointment.scheduled",
  "timestamp": "2024-01-01T10:00:00Z",
  "data": {
    "id": 321,
    "dossierId": 456,
    "title": "Property Visit",
    "scheduledAt": "2024-01-05T14:00:00Z",
    "duration": 60,
    "location": "123 Main St",
    "attendees": ["agent@example.com", "client@example.com"]
  }
}
```

## Signature Verification (HMAC-SHA256)

All webhook requests include an `X-Webhook-Signature` header. You must verify this signature.

### Node.js Example

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Python Example

```python
import hmac
import hashlib
import base64

def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    expected_signature = base64.b64encode(
        hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).digest()
    ).decode('utf-8')
    
    return hmac.compare_digest(signature, expected_signature)
```

## Retry Policy

### Exponential Backoff (Recommended)

```json
{
  "maxRetries": 3,
  "retryDelaySeconds": 60,
  "backoffStrategy": "exponential"
}
```

Delays: 60s, 120s, 240s

### Fixed Delay

```json
{
  "maxRetries": 5,
  "retryDelaySeconds": 300,
  "backoffStrategy": "fixed"
}
```

## Best Practices

1. **Return 200 OK quickly** - Process asynchronously
2. **Implement idempotency** - Use webhook delivery ID
3. **Use HTTPS** - Always use secure endpoints
4. **Monitor health** - Check Developer Portal regularly
5. **Verify signatures** - Always validate HMAC signature

## Rate Limits

- **Free**: 60 requests/minute
- **Pro**: 600 requests/minute  
- **Enterprise**: 6000 requests/minute
