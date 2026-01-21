# Email and SMS Provider Integration

## Overview

This document describes the Email and SMS provider implementations with SMTP, Twilio, and AWS SNS support. The architecture follows the same patterns as WhatsAppCloudApiProvider with comprehensive error mapping, rate limiting, idempotence, and delivery webhook support.

## Architecture

### Email Provider (JavaMailEmailProvider)

**Features:**
- SMTP configuration per organization
- Support for TLS/SSL
- HTML and plain text email support
- CC/BCC support
- Reply-To support
- Idempotence key handling via Message-ID header
- Connection pooling
- Comprehensive SMTP error code mapping
- Email size validation (25MB limit)

**Configuration Fields (email_provider_config table):**
- `provider_type`: Always "SMTP"
- `smtp_host`: SMTP server hostname
- `smtp_port`: SMTP server port
- `smtp_username`: SMTP authentication username
- `smtp_password_encrypted`: Encrypted SMTP password
- `from_email`: Sender email address
- `from_name`: Sender display name
- `reply_to_email`: Reply-To email address
- `use_tls`: Enable TLS/STARTTLS
- `use_ssl`: Enable SSL
- `webhook_secret_encrypted`: Secret for webhook signature verification
- `enabled`: Enable/disable provider

**Payload Format:**
```json
{
  "htmlBody": "HTML content",
  "textBody": "Plain text content",
  "body": "Fallback text",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com"
}
```

### SMS Providers

#### Twilio SMS Provider (TwilioSmsProvider)

**Features:**
- REST API integration with Twilio
- Basic authentication
- Rate limiting and quota management
- Idempotence key support via X-Idempotency-Key header
- Status callback webhook support
- Comprehensive Twilio error code mapping (20003, 21211, 30001-30008, etc.)
- SMS length validation (1600 characters)

**Configuration Fields (sms_provider_config table):**
- `provider_type`: "TWILIO"
- `twilio_account_sid`: Twilio Account SID
- `twilio_auth_token_encrypted`: Encrypted Twilio Auth Token
- `twilio_from_number`: Sender phone number
- `webhook_secret_encrypted`: Secret for webhook signature verification
- `enabled`: Enable/disable provider

**Payload Format:**
```json
{
  "body": "SMS message text",
  "statusCallback": "https://example.com/callback",
  "validityPeriod": 3600
}
```

#### AWS SNS SMS Provider (AwsSnsSmsProvider)

**Features:**
- AWS SDK integration
- IAM credential-based authentication
- Regional deployment support
- Sender ID support
- Rate limiting and quota management
- Idempotence via message attributes
- Delivery status webhook support
- Comprehensive AWS error code mapping
- SMS length validation (1600 characters)

**Configuration Fields (sms_provider_config table):**
- `provider_type`: "AWS_SNS"
- `aws_access_key_encrypted`: Encrypted AWS Access Key
- `aws_secret_key_encrypted`: Encrypted AWS Secret Key
- `aws_region`: AWS region (e.g., "us-east-1")
- `aws_sender_id`: Sender ID for SMS
- `webhook_secret_encrypted`: Secret for webhook signature verification
- `enabled`: Enable/disable provider

**Payload Format:**
```json
{
  "body": "SMS message text",
  "maxPrice": "0.50"
}
```

## Error Mapping

### Email Error Codes

**Retryable Errors:**
- `SMTP_421`: Service not available
- `SMTP_450`: Mailbox unavailable (temporary)
- `SMTP_451`: Local error in processing
- `SMTP_452`: Insufficient system storage
- `CONNECTION_FAILED`: Cannot connect to SMTP server
- `TLS_FAILED`: TLS/SSL negotiation failed
- `TIMEOUT`: Connection timeout
- `RATE_LIMIT`: Rate limit exceeded
- `QUOTA_EXCEEDED`: Daily/monthly quota exceeded

**Non-Retryable Errors:**
- `SMTP_500-504`: Syntax/command errors
- `SMTP_550`: Mailbox unavailable (permanent)
- `SMTP_551-554`: Invalid mailbox/transaction
- `AUTH_FAILED`: Authentication failed
- `INVALID_EMAIL`: Invalid email address
- `MESSAGE_TOO_LARGE`: Message exceeds size limit
- `RECIPIENT_REJECTED`: Recipient rejected
- `SENDER_REJECTED`: Sender rejected
- `RELAY_DENIED`: Relay access denied
- `SPAM_DETECTED`: Flagged as spam
- `BLACKLISTED`: IP/domain blacklisted

### SMS Error Codes

**Twilio Error Codes (Retryable):**
- `TWILIO_21612`: Unable to reach destination
- `TWILIO_30001`: Queue overflow
- `TWILIO_30003`: Unreachable destination handset
- `TWILIO_30008`: Unknown error
- `TWILIO_30026`: Message undeliverable

**Twilio Error Codes (Non-Retryable):**
- `TWILIO_20003`: Authentication failed
- `TWILIO_21211`: Invalid 'To' phone number
- `TWILIO_21408`: Permission to send to unverified number
- `TWILIO_21601`: Phone number not capable of receiving SMS
- `TWILIO_21610`: Cannot send to landline
- `TWILIO_21614`: Invalid mobile number
- `TWILIO_30002`: Account suspended
- `TWILIO_30004`: Message blocked by carrier
- `TWILIO_30005`: Unknown destination handset
- `TWILIO_30006`: Landline or unreachable carrier
- `TWILIO_30007`: Carrier violation or spam
- `TWILIO_30022`: Exceeded max price

**AWS SNS Error Codes:**
- `AWS_THROTTLING`: Rate limit exceeded (retryable)
- `AWS_INTERNAL_ERROR`: Internal service error (retryable)
- `AWS_INVALID_PARAMETER`: Invalid parameter (non-retryable)
- `AWS_INVALID_SMS`: Invalid SMS message (non-retryable)
- `AWS_OPTED_OUT`: Phone number opted out (non-retryable)

## Rate Limiting

### SMS Rate Limiting (sms_rate_limit table)

**Fields:**
- `quota_limit`: Maximum messages per window (default: 1000)
- `messages_sent_count`: Current count in window
- `rate_limit_window_seconds`: Window duration (default: 86400 = 24 hours)
- `reset_at`: Timestamp when quota resets
- `throttle_until`: Timestamp when throttling ends (set on rate limit errors)

**Behavior:**
- Quota is checked and consumed before each send
- Quota automatically resets when `reset_at` is reached
- Provider-side rate limit errors trigger throttling for 5 minutes (or provider-specified duration)
- Throttled requests immediately fail without consuming quota

## Idempotence

### Email Idempotence
- Message-ID header: `<{idempotency_key}-{random}@{domain}>`
- X-Idempotency-Key header: `{idempotency_key}`

### Twilio Idempotence
- X-Idempotency-Key header sent with API requests
- Twilio deduplicates based on this header

### AWS SNS Idempotence
- IdempotencyKey message attribute
- AWS SNS uses this for deduplication

## Webhook Support

### Email Webhooks

**Endpoints:**
- `POST /api/webhooks/email/{orgId}/delivery` - Delivery status
- `POST /api/webhooks/email/{orgId}/bounce` - Bounce notifications
- `POST /api/webhooks/email/{orgId}/complaint` - Spam complaints

**Signature Verification:**
- Header: `X-Webhook-Signature`
- Algorithm: HMAC-SHA256
- Payload: JSON body
- Secret: From `email_provider_config.webhook_secret_encrypted`

### SMS Webhooks

**Twilio Endpoints:**
- `POST /api/webhooks/sms/{orgId}/twilio/status` - Status callbacks

**Twilio Signature Verification:**
- Header: `X-Twilio-Signature`
- Algorithm: HMAC-SHA1
- Payload: Sorted form parameters concatenated
- Secret: From `sms_provider_config.webhook_secret_encrypted`

**AWS SNS Endpoints:**
- `POST /api/webhooks/sms/{orgId}/aws-sns/delivery` - Delivery status

**AWS SNS Message Types:**
- `SubscriptionConfirmation`: Returns subscribe URL
- `Notification`: Processes delivery status

**Generic Endpoint:**
- `POST /api/webhooks/sms/{orgId}/delivery` - Generic delivery webhook

## Retry Logic

### Exponential Backoff
Implemented at the outbound messaging layer (OutboundMessageProcessor), not in providers:
- Attempt 1: Immediate
- Attempt 2: 60 seconds
- Attempt 3: 300 seconds (5 minutes)
- Attempt 4: 900 seconds (15 minutes)
- Attempt 5: 3600 seconds (1 hour)

### Retry Decision
Providers return `ProviderSendResult` with:
- `success`: Boolean indicating success
- `providerMessageId`: Provider's message ID
- `errorCode`: Error code from provider
- `errorMessage`: Human-readable error
- `retryable`: Boolean indicating if retry is recommended
- `responseData`: Additional response data

The retry scheduler uses the `retryable` flag to determine if another attempt should be made.

## Security

### Credential Encryption
All sensitive fields are encrypted at rest:
- `smtp_password_encrypted`
- `twilio_auth_token_encrypted`
- `aws_access_key_encrypted`
- `aws_secret_key_encrypted`
- `webhook_secret_encrypted`

### Webhook Signature Verification
All webhooks verify signatures using HMAC:
- Email: HMAC-SHA256
- Twilio: HMAC-SHA1
- Generic: HMAC-SHA256

### Credential Sanitization
Error messages automatically sanitize sensitive data:
- Regex: `(?i)(password|secret|token|key|auth|credential)\s*[:=]\s*[^\s,}]+`
- Replacement: `$1=***`

## Usage Examples

### Email Configuration
```sql
INSERT INTO email_provider_config (
    org_id, provider_type, smtp_host, smtp_port,
    smtp_username, smtp_password_encrypted,
    from_email, from_name, use_tls, enabled
) VALUES (
    'org-123', 'SMTP', 'smtp.gmail.com', 587,
    'sender@example.com', 'encrypted_password',
    'sender@example.com', 'Company Name', true, true
);
```

### Twilio SMS Configuration
```sql
INSERT INTO sms_provider_config (
    org_id, provider_type,
    twilio_account_sid, twilio_auth_token_encrypted,
    twilio_from_number, enabled
) VALUES (
    'org-123', 'TWILIO',
    'ACxxxxxxxxxxxxx', 'encrypted_auth_token',
    '+15551234567', true
);
```

### AWS SNS SMS Configuration
```sql
INSERT INTO sms_provider_config (
    org_id, provider_type,
    aws_access_key_encrypted, aws_secret_key_encrypted,
    aws_region, aws_sender_id, enabled
) VALUES (
    'org-123', 'AWS_SNS',
    'encrypted_access_key', 'encrypted_secret_key',
    'us-east-1', 'MySenderID', true
);
```

## Monitoring and Observability

### Logging
All providers log key events:
- `INFO`: Successful sends with provider message ID
- `WARN`: Rate limits, throttling, quota exceeded
- `ERROR`: Send failures with error codes

### Metrics
Key metrics to monitor:
- Send success rate by channel
- Average send latency
- Error rate by error code
- Rate limit hits
- Quota consumption
- Retry attempts

### Alerts
Recommended alerts:
- Error rate > 10%
- Rate limit hits
- Quota > 90%
- Provider authentication failures
- Webhook signature failures

## Testing

### Email Testing
Use a test SMTP server like Mailhog or Mailtrap:
```yaml
smtp_host: localhost
smtp_port: 1025
smtp_username: test
use_tls: false
```

### Twilio Testing
Use Twilio test credentials:
- Test phone numbers always succeed
- Magic numbers trigger specific behaviors

### AWS SNS Testing
Use AWS SNS sandbox:
- Verify phone numbers before sending
- Limited to verified numbers in sandbox mode

## Migration Path

### From Existing Email System
1. Create email_provider_config entries
2. Migrate SMTP credentials (encrypted)
3. Configure webhooks
4. Test with small volume
5. Gradually migrate traffic

### From Other SMS Provider
1. Create sms_provider_config entries
2. Configure Twilio or AWS SNS credentials
3. Update webhook URLs
4. Test with small volume
5. Monitor error rates
6. Full migration

## Troubleshooting

### Email Issues
- **AUTH_FAILED**: Check SMTP username/password, port, TLS settings
- **CONNECTION_FAILED**: Check firewall, DNS resolution, port accessibility
- **RELAY_DENIED**: Configure SMTP server to allow relay
- **TLS_FAILED**: Check TLS version support (TLSv1.2+)

### SMS Issues
- **Twilio AUTH_FAILED**: Verify Account SID and Auth Token
- **Twilio 21211**: Phone number format must be E.164 (+15551234567)
- **Twilio 30004**: Message blocked by carrier - check content
- **AWS THROTTLING**: Reduce send rate or request limit increase
- **AWS INVALID_PARAMETER**: Check phone number format and region

## Performance Considerations

### Email
- Connection pooling enabled (default: 5 connections)
- Timeout: 30 seconds (configurable)
- Max message size: 25MB

### SMS
- Twilio: REST API with connection pooling
- AWS SNS: SDK with automatic retry and connection pooling
- Rate limit check adds ~10ms overhead
- Phone number normalization adds ~1ms overhead

## Future Enhancements

### Planned Features
- Template management for emails
- Attachment support for emails
- MMS support for SMS
- Delivery report aggregation
- A/B testing support
- Sender reputation monitoring
- Automatic failover between providers
- Multi-region deployment
- Advanced analytics and reporting
