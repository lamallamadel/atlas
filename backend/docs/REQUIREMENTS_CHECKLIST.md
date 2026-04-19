# Requirements Checklist - Outbox Pattern Implementation

## ✅ Requirement 1: OutboundMessageRepository with QUEUED/SENDING/SENT/FAILED States

**Status:** ✅ COMPLETE

### Implementation Details:

- **File:** `backend/src/main/java/com/example/backend/repository/OutboundMessageRepository.java`
- **Entity:** `backend/src/main/java/com/example/backend/entity/OutboundMessageEntity.java`
- **Enum:** `backend/src/main/java/com/example/backend/entity/enums/OutboundMessageStatus.java`

### States Implemented:
1. ✅ **QUEUED** - Message is queued for sending
2. ✅ **SENDING** - Message is currently being sent
3. ✅ **SENT** - Message successfully sent to provider
4. ✅ **DELIVERED** - Message delivered to recipient (from webhook)
5. ✅ **FAILED** - Message failed to send
6. ✅ **CANCELLED** - Message cancelled (for future use)

### Repository Methods:
- ✅ `findPendingMessages(status, pageable)` - Query messages in QUEUED state
- ✅ `findStaleMessages(status, beforeTime, pageable)` - Find messages stuck in SENDING
- ✅ `findByProviderMessageId(providerMessageId)` - Lookup by provider's message ID
- ✅ `findByOrgIdAndIdempotencyKey(orgId, key)` - Idempotency support
- ✅ `findByDossierId(dossierId)` - List messages for a dossier

### Database:
- ✅ Table: `outbound_message` with all required fields
- ✅ Index: `idx_outbound_message_status_attempts` for efficient polling
- ✅ Index: `idx_outbound_message_provider_id` for webhook lookups
- ✅ Unique constraint: `uk_outbound_idempotency` on (org_id, idempotency_key)

---

## ✅ Requirement 2: Scheduled Worker with Exponential Backoff

**Status:** ✅ COMPLETE

### Implementation Details:

- **File:** `backend/src/main/java/com/example/backend/service/OutboundJobWorker.java`
- **Scheduling:** `@Scheduled(fixedDelayString = "${outbound.worker.poll-interval-ms:5000}")`

### Worker Features:
- ✅ **Polling:** Runs every 5 seconds (configurable)
- ✅ **Batch Processing:** Processes up to 10 messages per run (configurable)
- ✅ **Stale Recovery:** Recovers messages stuck in SENDING >10 minutes

### Exponential Backoff:
```java
private static final int[] BACKOFF_MINUTES = {1, 5, 15, 60, 360};
```

| Attempt | Delay      | Implementation |
|---------|------------|----------------|
| 1       | Immediate  | ✅ No delay   |
| 2       | 1 minute   | ✅ BACKOFF_MINUTES[0] |
| 3       | 5 minutes  | ✅ BACKOFF_MINUTES[1] |
| 4       | 15 minutes | ✅ BACKOFF_MINUTES[2] |
| 5       | 1 hour     | ✅ BACKOFF_MINUTES[3] |
| 6       | 6 hours    | ✅ BACKOFF_MINUTES[4] |

### Retry Logic:
- ✅ `calculateNextRetry(attemptCount)` - Calculates next retry time
- ✅ `isReadyForProcessing(message)` - Checks if retry window has passed
- ✅ `processMessage(message)` - Processes individual message
- ✅ `handleSuccess()` - Updates status to SENT on success
- ✅ `handleFailure()` - Handles retryable and non-retryable failures
- ✅ `createAttempt()` - Creates OutboundAttemptEntity for each try

### Attempt Tracking:
- ✅ Table: `outbound_attempt` tracks each delivery attempt
- ✅ Fields: `attempt_no`, `status`, `error_code`, `error_message`, `next_retry_at`
- ✅ Index: `idx_outbound_attempt_next_retry` for efficient retry scheduling

### Configuration:
```yaml
outbound:
  worker:
    enabled: true
    poll-interval-ms: 5000
    batch-size: 10
```

---

## ✅ Requirement 3: Webhook Endpoint for Provider Delivery Callbacks

**Status:** ✅ COMPLETE

### Implementation Details:

- **File:** `backend/src/main/java/com/example/backend/controller/WhatsAppWebhookController.java`
- **Endpoint:** `POST /api/v1/webhooks/whatsapp/inbound`

### Webhook Features:
- ✅ **Verification:** `GET` endpoint for webhook verification (hub.challenge)
- ✅ **Callback:** `POST` endpoint for receiving events
- ✅ **Headers:** 
  - `X-Org-Id` - Organization identifier
  - `X-Hub-Signature-256` - HMAC signature

### Signature Verification:
- ✅ **Algorithm:** HMAC-SHA256
- ✅ **Implementation:** `validateSignature(payload, signature, orgId)`
- ✅ **Secret:** Stored in `WhatsAppProviderConfig.webhook_secret_encrypted`
- ✅ **Format:** `sha256=<hex-encoded-hash>`

```java
Mac mac = Mac.getInstance(HMAC_SHA256);
SecretKeySpec secretKeySpec = new SecretKeySpec(
    webhookSecret.getBytes(StandardCharsets.UTF_8), 
    HMAC_SHA256
);
mac.init(secretKeySpec);
byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
String expectedSignature = "sha256=" + HexFormat.of().formatHex(hash);
return expectedSignature.equals(signature);
```

### Payload Processing:
- ✅ **DTO:** `WhatsAppWebhookPayload` with full structure
- ✅ **Messages:** Processes inbound messages
- ✅ **Statuses:** Processes delivery status updates

### Status Processing:
- **File:** `backend/src/main/java/com/example/backend/service/WhatsAppMessageProcessingService.java`
- ✅ `processDeliveryStatus(status, orgId)` - Processes delivery callbacks
- ✅ `mapWhatsAppStatusToOutboundStatus()` - Maps WhatsApp statuses
- ✅ `shouldUpdateStatus()` - Validates state transitions

### Status Mapping:
| WhatsApp | Outbound Status | Implementation |
|----------|----------------|----------------|
| sent     | SENT           | ✅ Mapped     |
| delivered| DELIVERED      | ✅ Mapped     |
| read     | DELIVERED      | ✅ Mapped     |
| failed   | FAILED         | ✅ Mapped     |

### Error Handling:
- ✅ Extracts error details from webhook payload
- ✅ Updates message with error_code and error_message
- ✅ Prevents invalid state transitions
- ✅ Validates organization ownership

---

## ✅ Requirement 4: Audit Trail Integration

**Status:** ✅ COMPLETE

### Implementation Details:

- **File:** `backend/src/main/java/com/example/backend/service/AuditEventService.java`
- **Method:** `logEvent(entityType, entityId, action, details)`

### Audit Events Logged:

#### 1. Message Creation
- ✅ **Entity Type:** `OUTBOUND_MESSAGE`
- ✅ **Action:** `CREATED`
- ✅ **Location:** `OutboundMessageService.createOutboundMessage()`
- ✅ **Details:** "Outbound message created: channel=X, to=Y, template=Z"

#### 2. Message Sent Successfully
- ✅ **Entity Type:** `OUTBOUND_MESSAGE`
- ✅ **Action:** `SENT`
- ✅ **Location:** `OutboundJobWorker.handleSuccess()`
- ✅ **Details:** "Message sent successfully"

#### 3. Message Failed
- ✅ **Entity Type:** `OUTBOUND_MESSAGE`
- ✅ **Action:** `FAILED`
- ✅ **Location:** `OutboundJobWorker.handleFailure()`
- ✅ **Details:** "Message failed: {errorMessage} ({reason})"

#### 4. Delivery Status Updated
- ✅ **Entity Type:** `OUTBOUND_MESSAGE`
- ✅ **Action:** `UPDATED`
- ✅ **Location:** `WhatsAppMessageProcessingService.processDeliveryStatus()`
- ✅ **Details:** "Delivery status updated to: {status}"

#### 5. Consent Blocking
- ✅ **Entity Type:** `DOSSIER`
- ✅ **Action:** `BLOCKED_BY_POLICY`
- ✅ **Location:** `OutboundMessageService.validateConsent()`
- ✅ **Details:** "Outbound message blocked: {reason}"

### Activity Timeline Integration:

- **File:** `backend/src/main/java/com/example/backend/service/ActivityService.java`
- **Method:** `logActivity(dossierId, activityType, description, metadata)`

#### Activity Types:
- ✅ **MESSAGE_SENT** - When message is sent
  ```json
  {
    "outboundMessageId": 123,
    "channel": "WHATSAPP",
    "to": "+1234567890",
    "status": "SENT"
  }
  ```

- ✅ **MESSAGE_STATUS_UPDATE** - When delivery status changes
  ```json
  {
    "outboundMessageId": 123,
    "providerMessageId": "wamid.XXX",
    "status": "delivered",
    "channel": "WHATSAPP"
  }
  ```

- ✅ **MESSAGE_FAILED** - When message fails
  ```json
  {
    "outboundMessageId": 123,
    "channel": "WHATSAPP",
    "errorCode": "131047"
  }
  ```

### Audit Trail Features:
- ✅ Organization scoping (org_id)
- ✅ User tracking (extracts from JWT)
- ✅ Timestamp tracking
- ✅ Detailed diff/metadata in JSONB
- ✅ Complete history of state changes

---

## 📊 Additional Features Implemented

### 1. Idempotency
- ✅ Unique constraint on `(org_id, idempotency_key)`
- ✅ Returns existing message if duplicate detected
- ✅ Auto-generates UUID if not provided
- ✅ Supports header-based and body-based keys

### 2. Consent Validation
- ✅ Validates consent before queuing messages
- ✅ Checks for GRANTED status
- ✅ Blocks messages without consent
- ✅ Logs BLOCKED_BY_POLICY events

### 3. Multi-Tenancy
- ✅ All queries filtered by org_id
- ✅ Cross-tenant access prevention
- ✅ Org-specific provider configuration
- ✅ Org-specific webhook secrets

### 4. Provider Abstraction
- ✅ `OutboundMessageProvider` interface
- ✅ `WhatsAppCloudApiProvider` implementation
- ✅ Support for retryable vs non-retryable errors
- ✅ Provider response storage

### 5. Stale Message Recovery
- ✅ Detects messages stuck in SENDING >10 minutes
- ✅ Automatically requeues for retry
- ✅ Prevents message loss from worker crashes
- ✅ Configurable threshold

### 6. REST API
- ✅ Create message: `POST /api/v1/outbound/messages`
- ✅ Get message: `GET /api/v1/outbound/messages/{id}`
- ✅ List messages: `GET /api/v1/outbound/messages?dossierId=X`
- ✅ Paginated list: `GET /api/v1/outbound/messages/paginated`
- ✅ Retry message: `POST /api/v1/outbound/messages/{id}/retry`

---

## 📚 Documentation

- ✅ **OUTBOX_PATTERN.md** - Complete technical documentation
- ✅ **OUTBOUND_MESSAGING_README.md** - Quick start guide
- ✅ **IMPLEMENTATION_SUMMARY.md** - Implementation summary
- ✅ **REQUIREMENTS_CHECKLIST.md** - This checklist

---

## ✅ Summary

All requirements have been fully implemented:

1. ✅ **OutboundMessageRepository** with QUEUED/SENDING/SENT/FAILED states
2. ✅ **Scheduled worker** polling pending messages with exponential backoff
3. ✅ **Webhook endpoint** for provider delivery callbacks with signature verification
4. ✅ **Audit trail integration** for all operations

**Additional Features:**
- ✅ Idempotency support
- ✅ Consent validation
- ✅ Multi-tenancy
- ✅ Provider abstraction
- ✅ Stale message recovery
- ✅ Complete REST API
- ✅ Comprehensive documentation

**Status:** READY FOR USE
