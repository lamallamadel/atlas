# WhatsApp Outbound Messaging Infrastructure Implementation

## Overview

This document describes the complete implementation of the WhatsApp outbound messaging infrastructure following the specifications in `docs/atlas-immobilier/03_technique/09_notifications.md`.

## Implementation Summary

The outbound messaging infrastructure has been fully implemented with the following components:

### 1. Database Schema (V13__Add_outbound_messaging.sql)

**Tables Created:**
- `outbound_message`: Stores outbound message requests with org/dossier scoping
  - Idempotency support via unique constraint on `(org_id, idempotency_key)`
  - Retry tracking with `attempt_count` and `max_attempts`
  - Status tracking: QUEUED, SENDING, SENT, DELIVERED, FAILED, CANCELLED
  - Error tracking with `error_code` and `error_message`

- `outbound_attempt`: Tracks individual send attempts for retry/backoff
  - Links to `outbound_message` with cascade delete
  - Stores provider responses and next retry timestamps
  - Status: TRYING, SUCCESS, FAILED

**Indexes:**
- Performance indexes on org_id, dossier_id, status, created_at, provider_message_id
- Specialized index for worker queries: `(status, attempt_count) WHERE status = 'QUEUED'`

### 2. Domain Entities

**OutboundMessageEntity:**
- Extends `BaseEntity` for multi-tenant support
- Contains all fields per spec: channel, to, templateCode, subject, payloadJson
- Idempotency key for duplicate prevention
- Retry management: attemptCount, maxAttempts, errorCode, errorMessage
- Provider integration: providerMessageId for tracking

**OutboundAttemptEntity:**
- Tracks each send attempt
- Stores provider responses as JSON
- Calculates next retry time for backoff

**Enums:**
- `OutboundMessageStatus`: QUEUED, SENDING, SENT, DELIVERED, FAILED, CANCELLED
- `OutboundAttemptStatus`: TRYING, SUCCESS, FAILED
- `AuditAction`: Added SENT, FAILED, BLOCKED_BY_POLICY
- `AuditEntityType`: Added OUTBOUND_MESSAGE
- `ActivityType`: Added MESSAGE_SENT, MESSAGE_FAILED

### 3. Consent Validation

**OutboundMessageService.validateConsent():**
- Strict deny-by-default consent validation
- Maps MessageChannel to ConsentementChannel (WHATSAPP, SMS, EMAIL, PHONE)
- Queries latest consent by dossier and channel
- Blocks if no consent found or status != GRANTED
- Logs audit event "BLOCKED_BY_POLICY" on rejection
- Throws `ResponseStatusException` with HTTP 422 (Unprocessable Entity)

**Channel Mapping:**
```
MessageChannel.WHATSAPP -> ConsentementChannel.WHATSAPP
MessageChannel.SMS      -> ConsentementChannel.SMS
MessageChannel.EMAIL    -> ConsentementChannel.EMAIL
MessageChannel.PHONE    -> ConsentementChannel.PHONE
```

### 4. Provider Abstraction

**OutboundMessageProvider Interface:**
- `send(OutboundMessageEntity)`: Send message via provider
- `supports(String channel)`: Check if provider handles channel
- `isRetryableError(String errorCode)`: Determine if error is retryable

**ProviderSendResult:**
- Encapsulates send result with success/failure status
- Contains providerMessageId on success
- Contains errorCode, errorMessage, retryable flag on failure
- Stores provider response data for audit

**WhatsAppCloudApiProvider:**
- Implements OutboundMessageProvider for WhatsApp Cloud API
- Configurable base URL (default: `https://graph.facebook.com/v18.0`)
- Fetches credentials from `WhatsAppProviderConfig` per org
- Builds template or text message payloads
- Phone number normalization to E.164 format
- Non-retryable error codes: 131047, 131051, 133000, 133004, 133005, 133006, 133008, 470, 131031
- Error sanitization (removes secrets from logs)

### 5. Outbound Job Worker

**OutboundJobWorker:**
- Spring `@Scheduled` worker polling at configurable interval (default: 5s)
- Batch processing (default: 10 messages per poll)
- Status flow: QUEUED -> SENDING -> SENT/FAILED
- Exponential backoff: 1m, 5m, 15m, 1h, 6h
- Retry logic respects `maxAttempts` (default: 5)
- Non-retryable errors immediately move to FAILED status
- Creates `OutboundAttemptEntity` for each send attempt
- Logs audit events: CREATED, SENT, FAILED
- Creates timeline activities: MESSAGE_SENT, MESSAGE_FAILED

**Configuration Properties:**
```yaml
outbound:
  worker:
    enabled: true
    poll-interval-ms: 5000
    batch-size: 10

whatsapp:
  cloud:
    api:
      base-url: https://graph.facebook.com/v18.0
```

**Disabled in E2E Tests:**
- All e2e profiles have `outbound.worker.enabled: false` to prevent background processing during tests

### 6. Service Layer

**OutboundMessageService:**
- `createOutboundMessage()`: Main entry point with idempotency support
  - Validates consent before creating message
  - Returns existing message for duplicate idempotency keys
  - Creates message with QUEUED status
  - Logs audit event on creation
  
- `getById()`, `listByDossier()`, `listByDossierPaginated()`: Query methods with tenant isolation
- `updateStatus()`, `updateProviderMessageId()`: Internal update methods

**ActivityService.logActivity():**
- New method to log activities from worker
- Accepts dossierId, activityType, description, metadata
- Creates INTERNAL visibility activities for message events

### 7. REST API

**OutboundMessageController** (`/api/v1/outbound/messages`)

**Endpoints:**
- `POST /api/v1/outbound/messages`: Create outbound message
  - Supports `Idempotency-Key` header
  - Request body: dossierId, channel, to, templateCode, subject, payloadJson, idempotencyKey
  - Returns 201 Created with message details
  - Returns 422 if consent validation fails

- `GET /api/v1/outbound/messages/{id}`: Get message by ID
  - Returns message with all details including status, attempts, errors

- `GET /api/v1/outbound/messages?dossierId={id}`: List messages for dossier
  - Returns all messages for the dossier

- `GET /api/v1/outbound/messages/paginated?dossierId={id}`: Paginated list
  - Supports page, size, sort, direction parameters

- `POST /api/v1/outbound/messages/{id}/retry`: Manual retry for failed messages
  - Only works for messages in FAILED status
  - Resets attempt counter and immediately triggers send

### 8. DTOs

**OutboundMessageRequest:**
- Validation: `@NotNull` channel, `@NotBlank` to
- Optional: dossierId, templateCode, subject, payloadJson, idempotencyKey

**OutboundMessageResponse:**
- Complete message state including status, attempts, errors
- Timestamps: createdAt, updatedAt

**OutboundMessageMapper:**
- Maps entity to response DTO

### 9. Configuration

**OutboundConfig:**
- Provides `RestTemplate` bean with timeouts:
  - Connect timeout: 10s
  - Read timeout: 30s

**Application Properties:**
- Main properties in `application.yml`
- Worker disabled in all e2e profiles for deterministic testing

### 10. Repositories

**OutboundMessageRepository:**
- `findByOrgIdAndIdempotencyKey()`: Idempotency check
- `findPendingMessages()`: Worker query for QUEUED messages under max attempts
- `findStaleMessages()`: Query for stuck messages by status and time
- `findByProviderMessageId()`: Callback lookup
- `findByDossierId()`: Dossier-scoped queries

**OutboundAttemptRepository:**
- `findByOutboundMessageIdOrderByAttemptNoAsc()`: Get attempt history

## Architecture Compliance

### ✅ Outbox Pattern
- Messages persisted before processing (QUEUED status)
- Worker polls and processes asynchronously
- No external calls in synchronous API endpoints

### ✅ Retry & Backoff
- Exponential backoff: 1m, 5m, 15m, 1h, 6h
- Max attempts: 5 (configurable)
- Non-retryable errors immediately fail
- Attempt tracking in separate table

### ✅ Idempotency
- API level: `(org_id, idempotency_key)` unique constraint
- Callback level: `providerMessageId` for deduplication
- Returns existing message on duplicate request

### ✅ Consent Validation
- Strict deny-by-default
- Blocks if no consent or consent not GRANTED
- Audit event logged: BLOCKED_BY_POLICY
- HTTP 422 with clear error message

### ✅ Traçabilité (Traceability)
- Audit events: CREATED, SENT, FAILED, BLOCKED_BY_POLICY
- Timeline activities: MESSAGE_SENT, MESSAGE_FAILED
- Attempt history preserved in outbound_attempt table
- Provider responses stored as JSON

### ✅ Multi-tenant
- All entities extend BaseEntity with org_id
- Hibernate filter for automatic tenant isolation
- Service layer enforces org_id checks

### ✅ Observability
- Structured logging with correlation IDs
- Attempt tracking for metrics
- Status counters available via repository queries
- Error codes and messages sanitized

## Integration Points

### WhatsApp Cloud API
- Base URL: `https://graph.facebook.com/v18.0/{phone_number_id}/messages`
- Authentication: Bearer token from WhatsAppProviderConfig
- Template messages: Uses template name, language, components
- Text messages: Simple text body
- Phone normalization: E.164 format (+33...)

### Audit System
- Uses existing AuditEventService
- Entity type: OUTBOUND_MESSAGE
- Actions: CREATED, SENT, FAILED, BLOCKED_BY_POLICY

### Activity Timeline
- Uses existing ActivityService
- Activity types: MESSAGE_SENT, MESSAGE_FAILED
- Visibility: INTERNAL
- Metadata includes outboundMessageId, channel, status

## Error Handling

### Non-Retryable Errors
- Invalid parameters (131047)
- Unsupported message type (131051)
- Invalid phone number (133000)
- Template not found (133004)
- Template paused/disabled (133005, 133006)
- Template parameter mismatch (133008)
- Message expired (470)
- Recipient blocked (131031)

### Retryable Errors
- Network errors
- Provider rate limits
- Temporary provider failures
- Timeout errors

### Error Sanitization
- Truncates to 500 characters
- Redacts API keys, secrets, tokens, passwords

## Configuration Options

### Environment Variables
```bash
OUTBOUND_WORKER_ENABLED=true
OUTBOUND_WORKER_POLL_INTERVAL_MS=5000
OUTBOUND_WORKER_BATCH_SIZE=10
WHATSAPP_CLOUD_API_BASE_URL=https://graph.facebook.com/v18.0
```

### Per-Organization Config
- Stored in `whatsapp_provider_config` table
- Fields: api_key_encrypted, phone_number_id, enabled flag
- Fetched per message send

## Testing Considerations

### E2E Tests
- Worker disabled in all e2e profiles
- Allows manual triggering via retry endpoint
- Idempotency can be tested
- Consent validation testable

### Integration Tests
- Can test worker directly by calling `processMessage()`
- Can mock providers by implementing OutboundMessageProvider
- Attempt history queryable for verification

## Security

### Secrets Management
- API keys stored encrypted in database
- Error messages sanitized before storage
- No secrets in logs

### Multi-Tenant Isolation
- org_id in all queries
- Hibernate filters enforce tenant boundaries
- Service layer double-checks ownership

### Consent Enforcement
- Strict validation before queueing
- Audit trail for blocked messages
- No bypass mechanism

## Next Steps (Not Implemented)

The following were mentioned in the spec but not implemented:
1. SMS Provider implementation
2. Email Provider implementation
3. Webhook callbacks for delivery status updates
4. Metrics/monitoring dashboards
5. Alerting (DLQ > 0, failure rate thresholds)
6. Template management UI
7. Scheduled messages (reminders)
8. Message templates table and API

## Files Created/Modified

### New Files
- `backend/src/main/java/com/example/backend/entity/OutboundMessageEntity.java`
- `backend/src/main/java/com/example/backend/entity/OutboundAttemptEntity.java`
- `backend/src/main/java/com/example/backend/entity/enums/OutboundMessageStatus.java`
- `backend/src/main/java/com/example/backend/entity/enums/OutboundAttemptStatus.java`
- `backend/src/main/java/com/example/backend/repository/OutboundMessageRepository.java`
- `backend/src/main/java/com/example/backend/repository/OutboundAttemptRepository.java`
- `backend/src/main/java/com/example/backend/service/OutboundMessageProvider.java`
- `backend/src/main/java/com/example/backend/service/ProviderSendResult.java`
- `backend/src/main/java/com/example/backend/service/WhatsAppCloudApiProvider.java`
- `backend/src/main/java/com/example/backend/service/OutboundMessageService.java`
- `backend/src/main/java/com/example/backend/service/OutboundJobWorker.java`
- `backend/src/main/java/com/example/backend/dto/OutboundMessageRequest.java`
- `backend/src/main/java/com/example/backend/dto/OutboundMessageResponse.java`
- `backend/src/main/java/com/example/backend/dto/OutboundMessageMapper.java`
- `backend/src/main/java/com/example/backend/controller/OutboundMessageController.java`
- `backend/src/main/java/com/example/backend/config/OutboundConfig.java`
- `backend/src/main/resources/db/migration/V13__Add_outbound_messaging.sql`
- `OUTBOUND_MESSAGING_IMPLEMENTATION.md` (this file)

### Modified Files
- `backend/src/main/java/com/example/backend/entity/enums/AuditEntityType.java` (added OUTBOUND_MESSAGE)
- `backend/src/main/java/com/example/backend/entity/enums/AuditAction.java` (added SENT, FAILED, BLOCKED_BY_POLICY)
- `backend/src/main/java/com/example/backend/entity/enums/ActivityType.java` (added MESSAGE_SENT, MESSAGE_FAILED)
- `backend/src/main/java/com/example/backend/service/ActivityService.java` (added logActivity method)
- `backend/src/main/resources/application.yml` (added outbound and whatsapp configuration)
- `backend/src/main/resources/application-e2e.yml` (disabled worker)
- `backend/src/main/resources/application-e2e-h2-mock.yml` (disabled worker)
- `backend/src/main/resources/application-e2e-h2-keycloak.yml` (disabled worker)
- `backend/src/main/resources/application-e2e-postgres-mock.yml` (disabled worker)
- `backend/src/main/resources/application-e2e-postgres-keycloak.yml` (disabled worker)

## Example Usage

### Creating an Outbound WhatsApp Message

```bash
POST /api/v1/outbound/messages
X-Org-Id: org123
Idempotency-Key: msg-20240107-001
Content-Type: application/json

{
  "dossierId": 42,
  "channel": "WHATSAPP",
  "to": "+33612345678",
  "templateCode": "property_viewing_reminder",
  "payloadJson": {
    "language": "fr",
    "components": [
      {
        "type": "body",
        "parameters": [
          {"type": "text", "text": "123 Rue de la Paix"},
          {"type": "text", "text": "15/01/2024 à 14h00"}
        ]
      }
    ]
  }
}
```

### Response
```json
{
  "id": 123,
  "orgId": "org123",
  "dossierId": 42,
  "channel": "WHATSAPP",
  "direction": "OUTBOUND",
  "to": "+33612345678",
  "templateCode": "property_viewing_reminder",
  "status": "QUEUED",
  "idempotencyKey": "msg-20240107-001",
  "attemptCount": 0,
  "maxAttempts": 5,
  "createdAt": "2024-01-07T10:30:00",
  "updatedAt": "2024-01-07T10:30:00"
}
```

### Consent Rejection Response (422)
```json
{
  "timestamp": "2024-01-07T10:30:00.123Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Consent required: Consent status is DENIED for channel WHATSAPP. Message blocked by policy.",
  "path": "/api/v1/outbound/messages"
}
```
