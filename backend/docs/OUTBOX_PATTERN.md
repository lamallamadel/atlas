# Outbox Pattern and Delivery Tracking Implementation

## Overview

This document describes the implementation of the outbox pattern for WhatsApp message delivery with delivery tracking, exponential backoff retry mechanism, webhook callbacks, and comprehensive audit trail.

## Architecture

### Core Components

1. **OutboundMessageEntity** - Stores outbound messages with delivery tracking
2. **OutboundAttemptEntity** - Tracks individual delivery attempts with retry scheduling
3. **OutboundJobWorker** - Scheduled worker that processes pending messages
4. **WhatsAppCloudApiProvider** - Provider implementation for WhatsApp Cloud API
5. **WhatsAppWebhookController** - Webhook endpoint for delivery callbacks
6. **WhatsAppMessageProcessingService** - Processes delivery status updates

## Database Schema

### outbound_message Table

Stores all outbound messages with the following key fields:

- `id` - Primary key
- `org_id` - Organization identifier (multi-tenant support)
- `dossier_id` - Optional link to dossier/lead
- `channel` - Message channel (EMAIL, SMS, WHATSAPP, PHONE)
- `to_recipient` - Recipient address/phone number
- `template_code` - Optional template identifier
- `subject` - Optional message subject
- `payload_json` - JSONB field containing message payload/parameters
- `status` - Current message status (QUEUED, SENDING, SENT, DELIVERED, FAILED, CANCELLED)
- `provider_message_id` - Provider's unique message identifier
- `idempotency_key` - Unique key for idempotent operations
- `attempt_count` - Number of delivery attempts made
- `max_attempts` - Maximum retry attempts (default: 5)
- `error_code` - Error code from failed attempts
- `error_message` - Error message from failed attempts

**Unique Constraint:** `(org_id, idempotency_key)` - Ensures idempotent message creation

### outbound_attempt Table

Tracks individual delivery attempts:

- `id` - Primary key
- `outbound_message_id` - Foreign key to outbound_message
- `attempt_no` - Attempt number (1, 2, 3, etc.)
- `status` - Attempt status (TRYING, SUCCESS, FAILED)
- `error_code` - Error code if failed
- `error_message` - Error message if failed
- `provider_response_json` - JSONB field with provider response
- `next_retry_at` - Scheduled time for next retry (used for exponential backoff)

## Message States

### OutboundMessageStatus

1. **QUEUED** - Message is queued for sending
2. **SENDING** - Message is currently being sent to provider
3. **SENT** - Message successfully sent to provider (but not yet delivered)
4. **DELIVERED** - Message confirmed delivered to recipient
5. **FAILED** - Message failed to send (max retries exhausted or non-retryable error)
6. **CANCELLED** - Message cancelled (not currently used)

### State Transitions

```
QUEUED -> SENDING -> SENT -> DELIVERED
   |         |         
   v         v         
 FAILED <- FAILED      
```

## Retry Strategy

### Exponential Backoff

The system uses exponential backoff with the following retry intervals:

- **Attempt 1**: Immediate
- **Attempt 2**: 1 minute delay
- **Attempt 3**: 5 minutes delay
- **Attempt 4**: 15 minutes delay
- **Attempt 5**: 60 minutes delay
- **Attempt 6**: 360 minutes (6 hours) delay

Implemented in `OutboundJobWorker.BACKOFF_MINUTES[]`

### Retry Logic

1. Message is created with status `QUEUED` and `attempt_count = 0`
2. Worker picks up message and sets status to `SENDING`
3. Worker creates `OutboundAttemptEntity` with status `TRYING`
4. Provider call is made:
   - **Success**: Message status -> `SENT`, Attempt status -> `SUCCESS`
   - **Failure (retryable)**: Message status -> `QUEUED`, Attempt status -> `FAILED`, `next_retry_at` calculated
   - **Failure (non-retryable)**: Message status -> `FAILED`, Attempt status -> `FAILED`
5. Worker checks `next_retry_at` before processing retries

### Stale Message Recovery

Messages stuck in `SENDING` state for more than 10 minutes are automatically recovered:

```java
private void recoverStaleMessages() {
    LocalDateTime staleThreshold = LocalDateTime.now().minusMinutes(10);
    List<OutboundMessageEntity> staleMessages = 
        outboundMessageRepository.findStaleMessages(
            OutboundMessageStatus.SENDING,
            staleThreshold,
            PageRequest.of(0, batchSize)
        );
    
    for (OutboundMessageEntity message : staleMessages) {
        message.setStatus(OutboundMessageStatus.QUEUED);
        outboundMessageRepository.save(message);
    }
}
```

## Scheduled Worker

### OutboundJobWorker

Runs on a fixed delay schedule (default: 5 seconds between runs):

```java
@Scheduled(fixedDelayString = "${outbound.worker.poll-interval-ms:5000}")
@Transactional
public void processPendingMessages() {
    // 1. Recover stale messages
    recoverStaleMessages();
    
    // 2. Fetch pending messages
    List<OutboundMessageEntity> messages = outboundMessageRepository.findPendingMessages(
        OutboundMessageStatus.QUEUED,
        PageRequest.of(0, batchSize)
    );
    
    // 3. Process each message
    for (OutboundMessageEntity message : messages) {
        if (isReadyForProcessing(message)) {
            processMessage(message);
        }
    }
}
```

### Configuration

```yaml
outbound:
  worker:
    enabled: true
    poll-interval-ms: 5000
    batch-size: 10
```

## Webhook Delivery Callbacks

### Endpoint

**POST** `/api/v1/webhooks/whatsapp/inbound`

### Signature Verification

Uses HMAC-SHA256 signature verification:

```java
private boolean validateSignature(String payload, String signature, String orgId) {
    String webhookSecret = processingService.getWebhookSecret(orgId);
    
    Mac mac = Mac.getInstance(HMAC_SHA256);
    SecretKeySpec secretKeySpec = new SecretKeySpec(
        webhookSecret.getBytes(StandardCharsets.UTF_8), 
        HMAC_SHA256
    );
    mac.init(secretKeySpec);
    byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
    String expectedSignature = "sha256=" + HexFormat.of().formatHex(hash);
    
    return expectedSignature.equals(signature);
}
```

### Webhook Headers

- `X-Org-Id` - Organization identifier (required)
- `X-Hub-Signature-256` - HMAC signature (optional, validated if present)

### Webhook Payload

Supports both inbound messages and delivery status updates:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "PHONE_NUMBER",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "statuses": [
              {
                "id": "wamid.XXX",
                "status": "delivered",
                "timestamp": "1234567890",
                "recipient_id": "16505551234",
                "errors": []
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### Status Mapping

WhatsApp status to OutboundMessageStatus:

- `sent` -> `SENT`
- `delivered` -> `DELIVERED`
- `read` -> `DELIVERED`
- `failed` -> `FAILED`

### Delivery Status Processing

```java
private void processDeliveryStatus(Status status, String orgId) {
    String providerMessageId = status.getId();
    
    Optional<OutboundMessageEntity> messageOpt = 
        outboundMessageRepository.findByProviderMessageId(providerMessageId);
    
    if (messageOpt.isPresent()) {
        OutboundMessageEntity message = messageOpt.get();
        OutboundMessageStatus newStatus = mapWhatsAppStatusToOutboundStatus(status.getStatus());
        
        if (shouldUpdateStatus(message.getStatus(), newStatus)) {
            message.setStatus(newStatus);
            outboundMessageRepository.save(message);
            
            // Log audit event
            logDeliveryStatusAudit(message, status.getStatus());
            
            // Log activity
            logDeliveryStatusActivity(message, status.getStatus());
        }
    }
}
```

## Audit Trail Integration

### Audit Events

The system logs audit events for the following actions:

1. **Message Creation** - When a new outbound message is queued
   - Entity Type: `OUTBOUND_MESSAGE`
   - Action: `CREATED`
   - Details: "Outbound message created: channel=X, to=Y, template=Z"

2. **Message Sent** - When message is successfully sent to provider
   - Entity Type: `OUTBOUND_MESSAGE`
   - Action: `SENT`
   - Details: "Message sent successfully"

3. **Message Failed** - When message fails permanently
   - Entity Type: `OUTBOUND_MESSAGE`
   - Action: `FAILED`
   - Details: "Message failed: {errorMessage} ({reason})"

4. **Delivery Status Updated** - When delivery status is received via webhook
   - Entity Type: `OUTBOUND_MESSAGE`
   - Action: `UPDATED`
   - Details: "Delivery status updated to: {status}"

5. **Consent Blocking** - When message is blocked due to missing consent
   - Entity Type: `DOSSIER`
   - Action: `BLOCKED_BY_POLICY`
   - Details: "Outbound message blocked: {reason}"

### Activity Timeline

For messages linked to a dossier, activities are logged:

1. **MESSAGE_SENT** - When message is sent
   ```json
   {
     "outboundMessageId": 123,
     "channel": "WHATSAPP",
     "to": "+1234567890",
     "status": "SENT"
   }
   ```

2. **MESSAGE_STATUS_UPDATE** - When delivery status changes
   ```json
   {
     "outboundMessageId": 123,
     "providerMessageId": "wamid.XXX",
     "status": "delivered",
     "channel": "WHATSAPP"
   }
   ```

3. **MESSAGE_FAILED** - When message fails
   ```json
   {
     "outboundMessageId": 123,
     "channel": "WHATSAPP",
     "errorCode": "131047"
   }
   ```

## API Endpoints

### Create Outbound Message

**POST** `/api/v1/outbound/messages`

```json
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

**Headers:**
- `X-Org-Id: org-123` (required)
- `Idempotency-Key: unique-key-123` (optional, can be in body)

**Response:**
```json
{
  "id": 456,
  "orgId": "org-123",
  "dossierId": 123,
  "channel": "WHATSAPP",
  "direction": "OUTBOUND",
  "to": "+1234567890",
  "templateCode": "order_confirmation",
  "status": "QUEUED",
  "idempotencyKey": "unique-key-123",
  "attemptCount": 0,
  "maxAttempts": 5,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

### Get Outbound Message

**GET** `/api/v1/outbound/messages/{id}`

### List Outbound Messages

**GET** `/api/v1/outbound/messages?dossierId=123`

### List Outbound Messages (Paginated)

**GET** `/api/v1/outbound/messages/paginated?dossierId=123&page=0&size=20&sort=createdAt&direction=DESC`

### Retry Failed Message

**POST** `/api/v1/outbound/messages/{id}/retry`

Resets a failed message back to QUEUED status and immediately processes it.

## Idempotency

The system supports idempotent message creation using the `idempotency_key` field:

1. When creating a message, an `idempotency_key` can be provided
2. If a message with the same `(org_id, idempotency_key)` already exists, that message is returned
3. If no `idempotency_key` is provided, a UUID is generated automatically

This prevents duplicate messages when the same request is retried.

## Consent Validation

Before queuing a message, the system validates that the recipient has granted consent:

```java
private void validateConsent(Long dossierId, MessageChannel channel) {
    List<ConsentementEntity> consents = consentementRepository
        .findByDossierIdAndChannelOrderByUpdatedAtDesc(dossierId, channel);
    
    if (consents.isEmpty() || consents.get(0).getStatus() != ConsentementStatus.GRANTED) {
        throw new ResponseStatusException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "Consent required: No consent found for channel"
        );
    }
}
```

## Error Handling

### Non-Retryable Errors

The following WhatsApp error codes are considered non-retryable:

- `131047` - Invalid parameter
- `131051` - Unsupported message type
- `131052` - Media download error
- `131053` - Media upload error
- `133000` - Invalid phone number
- `133004` - Template not found
- `133005` - Template paused
- `133006` - Template disabled
- `133008` - Template parameter mismatch
- `470` - Message expired
- `131031` - Recipient blocked

For these errors, the message is immediately marked as `FAILED` without retries.

### Retryable Errors

All other errors are considered retryable and will be retried with exponential backoff up to `max_attempts`.

## Multi-Tenancy

The system fully supports multi-tenancy:

1. All queries are filtered by `org_id`
2. Webhook signature verification uses org-specific secrets
3. Provider configuration is org-specific
4. Audit events are scoped to organization

## Monitoring

### Key Metrics

1. **Message Counts by Status**
   ```sql
   SELECT status, COUNT(*) 
   FROM outbound_message 
   WHERE org_id = ? 
   GROUP BY status;
   ```

2. **Retry Statistics**
   ```sql
   SELECT attempt_count, COUNT(*) 
   FROM outbound_message 
   WHERE org_id = ? AND status = 'FAILED' 
   GROUP BY attempt_count;
   ```

3. **Processing Time**
   - Track time from `QUEUED` to `SENT`
   - Track time from `SENT` to `DELIVERED`

### Logging

- All operations are logged with appropriate levels
- Errors include context (message ID, org ID, attempt count)
- Audit trail provides complete history

## Testing

### Unit Tests

Test the following components:

1. `OutboundMessageService` - Message creation and consent validation
2. `OutboundJobWorker` - Message processing and retry logic
3. `WhatsAppMessageProcessingService` - Delivery status processing
4. `WhatsAppCloudApiProvider` - Provider integration

### Integration Tests

Test the complete flow:

1. Create message
2. Worker picks up message
3. Provider sends message
4. Webhook receives delivery status
5. Status is updated in database
6. Audit events are created

## Configuration

### Application Properties

```yaml
# Worker configuration
outbound:
  worker:
    enabled: true
    poll-interval-ms: 5000
    batch-size: 10

# WhatsApp Cloud API
whatsapp:
  cloud:
    api:
      base-url: https://graph.facebook.com/v18.0

# Scheduling
spring:
  scheduling:
    enabled: true
```

### Database Indexes

Ensure the following indexes exist for optimal performance:

```sql
-- Pending messages query
CREATE INDEX idx_outbound_message_status_attempts 
ON outbound_message(status, attempt_count) 
WHERE status = 'QUEUED';

-- Stale messages query
CREATE INDEX idx_outbound_message_status_updated 
ON outbound_message(status, updated_at);

-- Provider message ID lookup
CREATE INDEX idx_outbound_message_provider_id 
ON outbound_message(provider_message_id);

-- Retry scheduling
CREATE INDEX idx_outbound_attempt_next_retry 
ON outbound_attempt(next_retry_at) 
WHERE next_retry_at IS NOT NULL;
```

## Future Enhancements

1. **Dead Letter Queue** - Move permanently failed messages to a DLQ
2. **Circuit Breaker** - Implement circuit breaker for provider calls
3. **Rate Limiting** - Add rate limiting per organization
4. **Batch Processing** - Support batch message creation
5. **Priority Queue** - Add priority field for urgent messages
6. **Scheduled Sending** - Support scheduled message delivery
7. **Template Validation** - Validate template parameters before sending
8. **Metrics Dashboard** - Real-time dashboard for monitoring
