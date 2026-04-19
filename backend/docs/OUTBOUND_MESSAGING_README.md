# Outbound Messaging System

## Quick Start

The outbound messaging system provides reliable message delivery with automatic retries, delivery tracking, and webhook support.

## Features

✅ **Outbox Pattern** - Reliable message delivery with database-backed queue  
✅ **Exponential Backoff** - Smart retry strategy (1min → 5min → 15min → 1hr → 6hr)  
✅ **Delivery Tracking** - Track message status from queued to delivered  
✅ **Webhook Callbacks** - Receive delivery status updates from providers  
✅ **Signature Verification** - Secure webhook validation with HMAC-SHA256  
✅ **Audit Trail** - Complete history of all message operations  
✅ **Multi-Tenant** - Full organization isolation  
✅ **Idempotency** - Prevent duplicate messages  
✅ **Consent Validation** - Ensure GDPR compliance  

## Message States

```
QUEUED → SENDING → SENT → DELIVERED
   ↓         ↓
 FAILED ← FAILED
```

## Sending a Message

### REST API

```bash
POST /api/v1/outbound/messages
X-Org-Id: your-org-id
Content-Type: application/json

{
  "dossierId": 123,
  "channel": "WHATSAPP",
  "to": "+1234567890",
  "templateCode": "order_confirmation",
  "payloadJson": {
    "language": "en",
    "components": [
      {
        "type": "body",
        "parameters": [
          {"type": "text", "text": "John Doe"},
          {"type": "text", "text": "123456"}
        ]
      }
    ]
  },
  "idempotencyKey": "unique-key-123"
}
```

### Programmatic API

```java
@Autowired
private OutboundMessageService outboundMessageService;

public void sendMessage() {
    Map<String, Object> payload = Map.of(
        "language", "en",
        "components", List.of(
            Map.of(
                "type", "body",
                "parameters", List.of(
                    Map.of("type", "text", "text", "John Doe"),
                    Map.of("type", "text", "text", "123456")
                )
            )
        )
    );
    
    OutboundMessageEntity message = outboundMessageService.createOutboundMessage(
        123L,                           // dossierId
        MessageChannel.WHATSAPP,        // channel
        "+1234567890",                  // to
        "order_confirmation",           // templateCode
        null,                           // subject
        payload,                        // payloadJson
        "unique-key-123"                // idempotencyKey
    );
}
```

## Retry Strategy

| Attempt | Delay     | Total Time |
|---------|-----------|------------|
| 1       | Immediate | 0          |
| 2       | 1 minute  | 1 min      |
| 3       | 5 minutes | 6 min      |
| 4       | 15 minutes| 21 min     |
| 5       | 1 hour    | 1h 21min   |
| 6       | 6 hours   | 7h 21min   |

After 6 attempts, message is marked as `FAILED`.

## Webhook Configuration

### Setup Webhook Endpoint

Configure your WhatsApp Business API webhook to point to:

```
POST https://your-domain.com/api/v1/webhooks/whatsapp/inbound
```

### Required Headers

```
X-Org-Id: your-org-id
X-Hub-Signature-256: sha256=<hmac-signature>
```

### Webhook Secret

Store your webhook secret in `WhatsAppProviderConfig` table:

```sql
UPDATE whatsapp_provider_config 
SET webhook_secret_encrypted = 'your-secret' 
WHERE org_id = 'your-org-id';
```

## Delivery Status Updates

Webhook automatically updates message status:

| WhatsApp Status | System Status | Description |
|----------------|---------------|-------------|
| `sent`         | SENT          | Sent to WhatsApp servers |
| `delivered`    | DELIVERED     | Delivered to recipient |
| `read`         | DELIVERED     | Read by recipient |
| `failed`       | FAILED        | Delivery failed |

## Monitoring

### Check Message Status

```bash
GET /api/v1/outbound/messages/{id}
```

### List Messages for Dossier

```bash
GET /api/v1/outbound/messages?dossierId=123
```

### Query by Status

```sql
SELECT * FROM outbound_message 
WHERE org_id = 'your-org-id' 
  AND status = 'FAILED'
ORDER BY created_at DESC;
```

### View Retry Attempts

```sql
SELECT om.id, om.status, om.attempt_count, 
       oa.attempt_no, oa.status, oa.next_retry_at
FROM outbound_message om
JOIN outbound_attempt oa ON oa.outbound_message_id = om.id
WHERE om.id = 123
ORDER BY oa.attempt_no;
```

## Error Handling

### Non-Retryable Errors

These errors immediately fail the message:

- Invalid phone number
- Template not found
- Template disabled
- Recipient blocked
- Invalid parameters

### Retryable Errors

These errors trigger retry with exponential backoff:

- Network timeout
- Provider rate limiting
- Temporary provider issues
- Unknown errors

## Audit Trail

All operations are logged:

```sql
SELECT * FROM audit_event 
WHERE entity_type = 'OUTBOUND_MESSAGE' 
  AND entity_id = 123
ORDER BY created_at DESC;
```

## Configuration

### Worker Settings

```yaml
outbound:
  worker:
    enabled: true           # Enable/disable worker
    poll-interval-ms: 5000  # How often to check for pending messages
    batch-size: 10          # Max messages per batch
```

### Provider Settings

```yaml
whatsapp:
  cloud:
    api:
      base-url: https://graph.facebook.com/v18.0
```

## Troubleshooting

### Messages Stuck in QUEUED

1. Check if worker is enabled:
   ```yaml
   outbound.worker.enabled: true
   ```

2. Check logs for worker errors:
   ```bash
   grep "OutboundJobWorker" application.log
   ```

3. Verify provider configuration:
   ```sql
   SELECT * FROM whatsapp_provider_config WHERE org_id = 'your-org-id';
   ```

### Messages Stuck in SENDING

Stale messages (>10 minutes in SENDING) are automatically recovered to QUEUED.

### Failed Messages

1. Check error details:
   ```sql
   SELECT id, error_code, error_message, attempt_count 
   FROM outbound_message 
   WHERE status = 'FAILED';
   ```

2. Check attempt history:
   ```sql
   SELECT * FROM outbound_attempt WHERE outbound_message_id = 123;
   ```

3. Retry failed message:
   ```bash
   POST /api/v1/outbound/messages/123/retry
   ```

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/v1/outbound/messages
       ▼
┌─────────────────────┐
│ OutboundMessage     │──────┐
│ Service             │      │ Validate Consent
└──────┬──────────────┘      │
       │ Create Message      │
       ▼                     │
┌─────────────────────┐      │
│ outbound_message    │◄─────┘
│ (status: QUEUED)    │
└──────┬──────────────┘
       │
       │ Worker polls every 5s
       ▼
┌─────────────────────┐
│ OutboundJobWorker   │
└──────┬──────────────┘
       │ Process Message
       ▼
┌─────────────────────┐
│ WhatsAppCloud       │──────┐
│ ApiProvider         │      │ Create Attempt
└──────┬──────────────┘      │
       │                     ▼
       │              ┌─────────────────────┐
       │              │ outbound_attempt    │
       │              │ (attempt_no: 1)     │
       │              └─────────────────────┘
       │ Send to WhatsApp
       ▼
┌─────────────────────┐
│ WhatsApp API        │
└──────┬──────────────┘
       │
       │ Webhook callback
       ▼
┌─────────────────────┐
│ WhatsAppWebhook     │
│ Controller          │
└──────┬──────────────┘
       │ Verify Signature
       ▼
┌─────────────────────┐
│ WhatsAppMessage     │
│ ProcessingService   │
└──────┬──────────────┘
       │ Update Status
       ▼
┌─────────────────────┐
│ outbound_message    │
│ (status: DELIVERED) │
└─────────────────────┘
```

## API Reference

See [OUTBOX_PATTERN.md](OUTBOX_PATTERN.md) for detailed API documentation.

## Database Schema

See [V13__Add_outbound_messaging.sql](src/main/resources/db/migration/V13__Add_outbound_messaging.sql)

## Related Documentation

- [Audit Trail](docs/audit-trail.md)
- [Multi-Tenancy](docs/multi-tenancy.md)
- [Consent Management](docs/consent-management.md)
