# Outbox Pattern Flow Diagram

## Complete Message Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        MESSAGE CREATION FLOW                              │
└──────────────────────────────────────────────────────────────────────────┘

1. API Request
   ↓
   POST /api/v1/outbound/messages
   Headers: X-Org-Id, Idempotency-Key
   Body: { dossierId, channel, to, templateCode, payloadJson }
   ↓
2. OutboundMessageController.createOutboundMessage()
   ↓
3. OutboundMessageService.createOutboundMessage()
   ↓
4. Check Idempotency
   ├─ Exists? → Return existing message
   └─ New?
      ↓
5. Validate Consent (if dossierId provided)
   ├─ No consent? → Throw exception + Log BLOCKED_BY_POLICY
   └─ Consent granted?
      ↓
6. Create OutboundMessageEntity
   - status = QUEUED
   - attemptCount = 0
   - maxAttempts = 5
   - idempotencyKey = provided or UUID
   ↓
7. Save to Database
   ↓
8. Log Audit Event (CREATED)
   ↓
9. Return Response
   { id, status: QUEUED, ... }


┌──────────────────────────────────────────────────────────────────────────┐
│                        WORKER PROCESSING FLOW                             │
└──────────────────────────────────────────────────────────────────────────┘

Every 5 seconds:

1. OutboundJobWorker.processPendingMessages()
   ↓
2. Recover Stale Messages (SENDING >10min → QUEUED)
   ↓
3. Query Pending Messages
   SELECT * FROM outbound_message 
   WHERE status = 'QUEUED' AND attempt_count < max_attempts
   ORDER BY created_at ASC
   LIMIT 10
   ↓
4. For each message:
   ↓
5. Check if Ready for Processing
   ├─ First attempt? → Process
   └─ Retry?
      ↓
      Query last attempt's next_retry_at
      ├─ Time passed? → Process
      └─ Still waiting? → Skip
   ↓
6. processMessage(message)
   ↓
7. Set status = SENDING, attemptCount++
   ↓
8. Create OutboundAttemptEntity (status = TRYING)
   ↓
9. Find Provider (WhatsAppCloudApiProvider)
   ↓
10. provider.send(message)
    ↓
    Call WhatsApp Cloud API
    ↓
    ┌─────────────────────────┐
    │   Provider Response     │
    └─────────────────────────┘
    ↓
11. Handle Result
    ├─ SUCCESS
    │  ↓
    │  - message.status = SENT
    │  - message.providerMessageId = "wamid.XXX"
    │  - attempt.status = SUCCESS
    │  - Log Audit Event (SENT)
    │  - Log Activity (MESSAGE_SENT)
    │  ↓
    │  Save to Database
    │
    └─ FAILURE
       ↓
       Check if Retryable
       ├─ Retryable + attempts < maxAttempts
       │  ↓
       │  - message.status = QUEUED
       │  - message.errorCode = "XXX"
       │  - message.errorMessage = "..."
       │  - attempt.status = FAILED
       │  - attempt.nextRetryAt = now + backoff[attemptCount]
       │  ↓
       │  Save to Database
       │  (Will be picked up again after nextRetryAt)
       │
       └─ Non-retryable OR max attempts reached
          ↓
          - message.status = FAILED
          - message.errorCode = "XXX"
          - message.errorMessage = "..."
          - attempt.status = FAILED
          - Log Audit Event (FAILED)
          - Log Activity (MESSAGE_FAILED)
          ↓
          Save to Database


┌──────────────────────────────────────────────────────────────────────────┐
│                     WEBHOOK DELIVERY STATUS FLOW                          │
└──────────────────────────────────────────────────────────────────────────┘

1. WhatsApp Cloud API sends webhook
   ↓
   POST https://your-domain.com/api/v1/webhooks/whatsapp/inbound
   Headers: X-Org-Id, X-Hub-Signature-256
   Body: { entry: [{ changes: [{ value: { statuses: [...] } }] }] }
   ↓
2. WhatsAppWebhookController.receiveWebhook()
   ↓
3. Extract orgId from header
   ↓
4. Validate HMAC Signature
   ├─ Invalid? → Return 401 Unauthorized
   └─ Valid or not provided?
      ↓
5. Parse Payload
   ↓
6. WhatsAppMessageProcessingService.processInboundMessage()
   ↓
7. Process Status Updates
   ↓
   For each status in statuses[]:
   ↓
8. processDeliveryStatus(status, orgId)
   ↓
9. Extract providerMessageId from status.id
   ↓
10. Query OutboundMessage
    SELECT * FROM outbound_message 
    WHERE provider_message_id = 'wamid.XXX'
    ↓
    ├─ Not found? → Log warning and skip
    └─ Found?
       ↓
11. Verify orgId matches
    ├─ Mismatch? → Log warning and skip
    └─ Match?
       ↓
12. Map WhatsApp Status to Outbound Status
    - sent → SENT
    - delivered → DELIVERED
    - read → DELIVERED
    - failed → FAILED
    ↓
13. Validate State Transition
    - Can't update from FAILED or CANCELLED
    - Can't downgrade from DELIVERED
    ↓
14. Update Message
    - message.status = new status
    - If failed: extract error_code, error_message
    - message.updatedAt = now
    ↓
15. Save to Database
    ↓
16. Log Audit Event (UPDATED)
    Details: "Delivery status updated to: delivered"
    ↓
17. Log Activity (MESSAGE_STATUS_UPDATE)
    ↓
18. Return 200 OK to webhook


┌──────────────────────────────────────────────────────────────────────────┐
│                        RETRY BACKOFF TIMELINE                             │
└──────────────────────────────────────────────────────────────────────────┘

T=0:00    Attempt 1 (IMMEDIATE)
          ↓ FAIL (retryable)
          
T=0:01    Attempt 2 (1 min later)
          ↓ FAIL (retryable)
          
T=0:06    Attempt 3 (5 min later)
          ↓ FAIL (retryable)
          
T=0:21    Attempt 4 (15 min later)
          ↓ FAIL (retryable)
          
T=1:21    Attempt 5 (60 min later)
          ↓ FAIL (retryable)
          
T=7:21    Attempt 6 (360 min later)
          ↓ FAIL (retryable)
          
          → STATUS = FAILED (max attempts reached)


┌──────────────────────────────────────────────────────────────────────────┐
│                        STATE TRANSITION DIAGRAM                           │
└──────────────────────────────────────────────────────────────────────────┘

    CREATE
       ↓
   ┌─────────┐
   │ QUEUED  │←─────────────────┐
   └─────────┘                  │
       ↓                        │
   (worker picks up)            │
       ↓                        │
   ┌─────────┐                  │
   │ SENDING │                  │
   └─────────┘                  │
       ↓                        │
   (provider call)              │
       ↓                        │
       ├──SUCCESS────→ ┌──────┐ │
       │               │ SENT │ │
       │               └──────┘ │
       │                  ↓     │
       │           (webhook)    │
       │                  ↓     │
       │            ┌───────────┐
       │            │ DELIVERED │
       │            └───────────┘
       │
       └──FAILURE──→ Check Retryable?
                          ↓
                ┌─────────┴─────────┐
                │                   │
             YES + attempts<max    NO or max reached
                │                   │
                └───────────────────┘
                        ↓
                  ┌─────────┐
                  │ FAILED  │
                  └─────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                          DATABASE INTERACTIONS                            │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│ outbound_message    │
├─────────────────────┤
│ id                  │
│ org_id              │
│ dossier_id          │
│ channel             │
│ to_recipient        │
│ template_code       │
│ payload_json        │ (JSONB)
│ status              │ (QUEUED/SENDING/SENT/DELIVERED/FAILED)
│ provider_message_id │
│ idempotency_key     │ (UNIQUE with org_id)
│ attempt_count       │
│ max_attempts        │
│ error_code          │
│ error_message       │
│ created_at          │
│ updated_at          │
└─────────────────────┘
         │
         │ 1:N
         ↓
┌─────────────────────┐
│ outbound_attempt    │
├─────────────────────┤
│ id                  │
│ outbound_message_id │ (FK)
│ attempt_no          │ (1, 2, 3, ...)
│ status              │ (TRYING/SUCCESS/FAILED)
│ error_code          │
│ error_message       │
│ provider_response   │ (JSONB)
│ next_retry_at       │ (TIMESTAMP for scheduling)
│ created_at          │
│ updated_at          │
└─────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                          KEY QUERIES                                      │
└──────────────────────────────────────────────────────────────────────────┘

-- Worker: Find pending messages
SELECT * FROM outbound_message 
WHERE status = 'QUEUED' 
  AND attempt_count < max_attempts
ORDER BY created_at ASC
LIMIT 10;

-- Worker: Find stale messages
SELECT * FROM outbound_message 
WHERE status = 'SENDING' 
  AND updated_at < (NOW() - INTERVAL '10 minutes')
ORDER BY updated_at ASC
LIMIT 10;

-- Webhook: Find message by provider ID
SELECT * FROM outbound_message 
WHERE provider_message_id = 'wamid.XXX';

-- Idempotency: Check for existing message
SELECT * FROM outbound_message 
WHERE org_id = 'org-123' 
  AND idempotency_key = 'key-456';

-- Worker: Check retry readiness
SELECT * FROM outbound_attempt 
WHERE outbound_message_id = 123 
ORDER BY attempt_no DESC 
LIMIT 1;

-- Monitoring: Count by status
SELECT status, COUNT(*) 
FROM outbound_message 
WHERE org_id = 'org-123' 
GROUP BY status;


┌──────────────────────────────────────────────────────────────────────────┐
│                          AUDIT TRAIL FLOW                                 │
└──────────────────────────────────────────────────────────────────────────┘

Every operation creates audit events:

1. Message Created
   → AuditEvent(OUTBOUND_MESSAGE, id, CREATED, details)

2. Message Sent
   → AuditEvent(OUTBOUND_MESSAGE, id, SENT, "Message sent successfully")

3. Status Updated (webhook)
   → AuditEvent(OUTBOUND_MESSAGE, id, UPDATED, "Status updated to: delivered")

4. Message Failed
   → AuditEvent(OUTBOUND_MESSAGE, id, FAILED, "Message failed: error details")

5. Blocked by Policy
   → AuditEvent(DOSSIER, dossierId, BLOCKED_BY_POLICY, "Consent required")

Additionally, for dossier-linked messages:

1. Message Sent
   → Activity(dossierId, MESSAGE_SENT, metadata)

2. Status Updated
   → Activity(dossierId, MESSAGE_STATUS_UPDATE, metadata)

3. Message Failed
   → Activity(dossierId, MESSAGE_FAILED, metadata)
```

## Legend

- `→` Sequential flow
- `├─` Decision branch (if)
- `└─` Decision branch (else)
- `↓` Continue to next step
- `(...)` Comment/explanation

## Key Classes

- **OutboundMessageController** - REST API endpoints
- **OutboundMessageService** - Business logic and consent validation
- **OutboundJobWorker** - Scheduled worker for processing
- **WhatsAppCloudApiProvider** - Provider integration
- **WhatsAppWebhookController** - Webhook endpoint
- **WhatsAppMessageProcessingService** - Webhook processing and status updates
- **AuditEventService** - Audit trail logging
- **ActivityService** - Activity timeline logging

## Configuration

```yaml
outbound:
  worker:
    enabled: true
    poll-interval-ms: 5000  # Check for pending messages every 5 seconds
    batch-size: 10          # Process up to 10 messages per batch
```

## Error Codes (WhatsApp)

**Non-Retryable:**
- 131047 - Invalid parameter
- 133000 - Invalid phone number
- 133004 - Template not found
- 133006 - Template disabled
- 131031 - Recipient blocked

**Retryable:**
- Network errors
- Rate limiting
- Temporary provider issues
- Unknown errors
