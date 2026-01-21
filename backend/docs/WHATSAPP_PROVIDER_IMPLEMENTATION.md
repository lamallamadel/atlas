# WhatsApp Cloud API Provider - Complete Implementation

## Overview

This document describes the complete implementation of the WhatsAppCloudApiProvider with advanced features including:

1. **Session Window Management** - 24-hour window tracking for freeform messages
2. **Template vs Freeform Logic** - Automatic switching based on session state
3. **Rate Limiting & Quota Management** - Prevent API throttling errors
4. **Comprehensive Error Code Mapping** - All WhatsApp Business API error codes
5. **Webhook Signature Verification** - Secure webhook validation using HMAC-SHA256

## Architecture

### Components

#### 1. WhatsAppCloudApiProvider
Main service that handles message sending with:
- Session window checking
- Rate limit validation
- Message type selection (template vs freeform)
- Comprehensive error handling
- Provider message ID tracking

#### 2. WhatsAppSessionWindowService
Manages 24-hour session windows:
- Tracks last inbound message timestamp per phone number
- Determines if freeform messages are allowed
- Records outbound message timestamps
- Scheduled cleanup of expired sessions

#### 3. WhatsAppRateLimitService
Manages API quotas and rate limiting:
- Per-organization quota tracking
- Automatic quota reset after window expiration
- Throttling support with retry-after handling
- Configurable quota limits

#### 4. WhatsAppErrorMapper
Maps WhatsApp API error codes to actionable information:
- 50+ error code mappings
- Retryable vs non-retryable classification
- Rate limit error detection
- Human-readable error messages

#### 5. WhatsAppWebhookSignatureValidator
Validates webhook signatures:
- HMAC-SHA256 signature verification
- Constant-time comparison to prevent timing attacks
- Per-organization secret management

## Database Schema

### whatsapp_session_window
```sql
CREATE TABLE whatsapp_session_window (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    window_opens_at TIMESTAMP NOT NULL,
    window_expires_at TIMESTAMP NOT NULL,
    last_inbound_message_at TIMESTAMP NOT NULL,
    last_outbound_message_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_session_org_phone UNIQUE (org_id, phone_number)
);
```

### whatsapp_rate_limit
```sql
CREATE TABLE whatsapp_rate_limit (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    messages_sent_count INTEGER NOT NULL DEFAULT 0,
    quota_limit INTEGER NOT NULL DEFAULT 1000,
    reset_at TIMESTAMP NOT NULL,
    rate_limit_window_seconds INTEGER NOT NULL DEFAULT 86400,
    last_request_at TIMESTAMP,
    throttle_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_rate_limit_org UNIQUE (org_id)
);
```

## Message Flow

### Outbound Message Flow

1. **Pre-send Validation**
   - Verify provider config exists and is enabled
   - Check rate limit quota availability
   - Verify not currently throttled

2. **Session Window Check**
   - Query session window for recipient phone number
   - Determine if within 24-hour window
   - If outside window, require template message

3. **Message Preparation**
   - If within window and no template: build freeform text message
   - If outside window or template specified: build template message
   - Normalize phone number (ensure + prefix)

4. **API Request**
   - Send message to WhatsApp Cloud API
   - Extract provider message ID from response
   - Record outbound message timestamp in session window

5. **Error Handling**
   - Parse error response
   - Map error code to error info
   - Handle rate limit errors (set throttle time)
   - Determine if retryable
   - Return appropriate result

### Inbound Message Flow

1. **Webhook Validation**
   - Verify X-Hub-Signature-256 header
   - Compute HMAC-SHA256 of payload
   - Compare with constant-time comparison

2. **Message Processing**
   - Parse webhook payload
   - Extract message details
   - Find or create dossier

3. **Session Window Update**
   - Update or create session window entry
   - Set window_opens_at to message timestamp
   - Set window_expires_at to timestamp + 24 hours
   - Record last_inbound_message_at

## Error Code Mappings

### Rate Limit Errors (Retryable, Rate Limit Flag)
- **130**: Rate limit hit
- **3**: Business account rate limited
- **132069**: Business account sending limit reached
- **80007**: Rate limit exceeded

### Session Window Errors (Non-retryable)
- **132015**: Cannot send message after 24 hour window
- **132016**: Out of session window - template required

### Template Errors (Non-retryable)
- **133004**: Template not found
- **133005**: Template paused
- **133006**: Template disabled
- **133008**: Template parameter count mismatch
- **133009**: Template missing parameters
- **133010**: Template parameter format invalid

### Recipient Errors (Non-retryable)
- **131021**: Recipient not on WhatsApp
- **131031**: Recipient blocked
- **133000**: Invalid phone number

### Temporary Errors (Retryable)
- **0**: Temporary error
- **1**: Service temporarily unavailable
- **131016**: Service temporarily unavailable
- **131026**: Message undeliverable
- **132001**: Message send failed

### Permanent Errors (Non-retryable)
- **131047**: Invalid parameter value
- **131051**: Unsupported message type
- **131052**: Media download error
- **131053**: Media upload error
- **470**: Message expired

## Usage Examples

### Sending a Freeform Message (Within Session Window)

```java
OutboundMessageEntity message = new OutboundMessageEntity();
message.setOrgId("org-123");
message.setChannel(MessageChannel.WHATSAPP);
message.setTo("+1234567890");
message.setSubject("Hello! How can I help you today?");

ProviderSendResult result = whatsAppCloudApiProvider.send(message);
if (result.isSuccess()) {
    System.out.println("Sent: " + result.getProviderMessageId());
}
```

### Sending a Template Message (Outside Session Window)

```java
OutboundMessageEntity message = new OutboundMessageEntity();
message.setOrgId("org-123");
message.setChannel(MessageChannel.WHATSAPP);
message.setTo("+1234567890");
message.setTemplateCode("hello_world");
message.setPayloadJson(Map.of(
    "language", "en",
    "components", List.of(
        Map.of("type", "body", "parameters", List.of(
            Map.of("type", "text", "text", "John")
        ))
    )
));

ProviderSendResult result = whatsAppCloudApiProvider.send(message);
```

### Checking Session Window Status

```java
boolean withinWindow = sessionWindowService.isWithinSessionWindow("org-123", "+1234567890");
if (withinWindow) {
    // Can send freeform message
} else {
    // Must use template
}

Optional<LocalDateTime> expiry = sessionWindowService.getSessionWindowExpiry("org-123", "+1234567890");
expiry.ifPresent(time -> System.out.println("Window expires at: " + time));
```

### Checking Quota Status

```java
WhatsAppRateLimitService.QuotaStatus status = rateLimitService.getQuotaStatus("org-123");
System.out.println("Messages sent: " + status.getMessagesSent());
System.out.println("Quota limit: " + status.getQuotaLimit());
System.out.println("Remaining: " + status.getRemainingQuota());
System.out.println("Throttled: " + status.isThrottled());
```

### Validating Webhook Signature

```java
@PostMapping("/webhooks/whatsapp")
public ResponseEntity<String> handleWebhook(
        @RequestHeader("X-Hub-Signature-256") String signature,
        @RequestBody String payload) {
    
    if (!signatureValidator.validateSignature(payload, signature, orgId)) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
    }
    
    // Process webhook...
    return ResponseEntity.ok("OK");
}
```

## Configuration

### Application Properties

```yaml
whatsapp:
  cloud:
    api:
      base-url: https://graph.facebook.com/v18.0
```

### Per-Organization Configuration

Stored in `whatsapp_provider_config` table:
- `api_key_encrypted`: WhatsApp Business API access token
- `api_secret_encrypted`: API secret (currently unused)
- `webhook_secret_encrypted`: Secret for webhook signature validation
- `phone_number_id`: WhatsApp phone number ID
- `business_account_id`: WhatsApp Business Account ID
- `enabled`: Enable/disable provider for organization

### Rate Limit Configuration

Stored in `whatsapp_rate_limit` table:
- `quota_limit`: Maximum messages per window (default: 1000)
- `rate_limit_window_seconds`: Window duration in seconds (default: 86400 = 24 hours)
- `throttle_until`: When to resume sending after rate limit

## Scheduled Tasks

### Session Window Cleanup

Runs hourly at the top of the hour:
```java
@Scheduled(cron = "0 0 * * * ?")
public void cleanupExpiredSessions()
```

Deletes session windows that have expired (window_expires_at < current time).

## Security Considerations

1. **Webhook Signature Verification**: All webhooks should verify HMAC-SHA256 signatures
2. **Constant-Time Comparison**: Signature validation uses constant-time comparison to prevent timing attacks
3. **Secret Storage**: All secrets stored encrypted in database
4. **Error Message Sanitization**: Sensitive data removed from error messages before logging

## Testing

Unit tests cover:
- Session window tracking and expiry
- Rate limit quota management
- Error code mapping and classification
- Webhook signature validation
- Template vs freeform message selection
- Phone number normalization
- Retry logic

Integration tests should verify:
- End-to-end message sending
- Webhook processing with session window updates
- Rate limit enforcement
- Error handling and retry behavior

## Performance Optimizations

1. **Indexes**: Session window and rate limit tables have appropriate indexes
2. **Scheduled Cleanup**: Expired sessions cleaned up automatically
3. **Early Validation**: Rate limits checked before API calls
4. **Efficient Queries**: Single queries for session window and rate limit lookups

## Monitoring and Observability

Key metrics to monitor:
- Session window creation/update rate
- Rate limit hit frequency
- Quota consumption per organization
- Throttle events and duration
- Error code distribution
- Webhook signature validation failures
- Template vs freeform message ratio

## Future Enhancements

Potential improvements:
1. Support for media messages (images, videos, documents)
2. Interactive message support (buttons, lists)
3. Message template synchronization from WhatsApp API
4. Advanced rate limiting strategies (per-phone number)
5. Session window TTL configuration per organization
6. Webhook event replay mechanism
7. Message delivery analytics
