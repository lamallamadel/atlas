# WhatsApp Integration

## Overview

This document describes the WhatsApp integration foundation, which enables the application to receive and process inbound WhatsApp messages through webhooks.

## Architecture

### Components

1. **WhatsAppProviderConfig Entity**: Stores organization-specific WhatsApp API credentials (encrypted)
2. **WhatsAppWebhookController**: REST endpoint that receives WhatsApp webhook events
3. **WhatsAppMessageProcessingService**: Processes incoming messages and manages dossier creation/updates
4. **MessageEntity Enhancement**: Added `providerMessageId` field for idempotency

### Database Schema

#### whatsapp_provider_config Table
- `id`: Primary key
- `org_id`: Organization identifier (unique)
- `api_key_encrypted`: Encrypted API key
- `api_secret_encrypted`: Encrypted API secret
- `webhook_secret_encrypted`: Encrypted webhook secret for HMAC validation
- `phone_number_id`: WhatsApp phone number ID
- `business_account_id`: WhatsApp business account ID
- `enabled`: Whether the integration is enabled
- `created_at`, `updated_at`: Timestamps

#### message Table Enhancement
- Added `provider_message_id` column with unique constraint for idempotency

## Features

### 1. Webhook Verification (GET endpoint)
- **Endpoint**: `GET /api/v1/webhooks/whatsapp/inbound`
- **Purpose**: WhatsApp webhook verification challenge
- **Parameters**: `hub.mode`, `hub.verify_token`, `hub.challenge`
- **Authentication**: Not required (public endpoint)

### 2. Inbound Message Processing (POST endpoint)
- **Endpoint**: `POST /api/v1/webhooks/whatsapp/inbound`
- **Purpose**: Receive and process inbound WhatsApp messages
- **Headers**: 
  - `X-Org-Id`: Organization identifier (required)
  - `X-Hub-Signature-256`: HMAC-SHA256 signature (optional but recommended)
- **Authentication**: Not required (validated via HMAC signature)

### 3. HMAC Signature Validation
- Uses HMAC-SHA256 algorithm
- Signature format: `sha256=<hex-encoded-hash>`
- Validates against webhook secret stored in `whatsapp_provider_config`
- Prevents unauthorized webhook calls

### 4. Idempotency
- Uses `providerMessageId` (WhatsApp message ID) to prevent duplicate processing
- Checks existence before processing any message
- Returns success even for duplicate messages (202 behavior)

### 5. Dossier Management
- **Phone Lookup**: Finds existing dossiers by `leadPhone`
- **Exclusions**: Ignores dossiers with status `WON` or `LOST`
- **Create New**: If no active dossier exists, creates a new one with:
  - `leadPhone`: From WhatsApp message sender
  - `leadName`: From WhatsApp contact profile (if available)
  - `leadSource`: "WhatsApp"
  - `status`: NEW
- **Update Existing**: If dossier exists without a name, updates it with contact name

### 6. Message Storage
- Creates `MessageEntity` with:
  - `channel`: WHATSAPP
  - `direction`: INBOUND
  - `content`: Text message body or `[<type> message]` for non-text messages
  - `timestamp`: Parsed from Unix epoch timestamp
  - `providerMessageId`: WhatsApp message ID
  - Links to associated dossier

### 7. Multi-tenant Support
- Requires `X-Org-Id` header
- Isolates data by organization
- Each organization has separate webhook secrets

## API Endpoints

### Webhook Verification
```http
GET /api/v1/webhooks/whatsapp/inbound?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>
```

**Response**: Returns the challenge value as plain text

### Receive Inbound Message
```http
POST /api/v1/webhooks/whatsapp/inbound
X-Org-Id: org123
X-Hub-Signature-256: sha256=<hmac-hash>
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "123456789",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "+1234567890",
          "phone_number_id": "123456789"
        },
        "contacts": [{
          "profile": {
            "name": "John Doe"
          },
          "wa_id": "+33612345678"
        }],
        "messages": [{
          "from": "+33612345678",
          "id": "wamid.123456789",
          "timestamp": "1234567890",
          "text": {
            "body": "Hello, this is a test message"
          },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**Responses**:
- `200 OK`: Message processed successfully
- `400 Bad Request`: Missing organization context
- `401 Unauthorized`: Invalid HMAC signature
- `500 Internal Server Error`: Processing error

## Security

### Encryption
- API keys, secrets, and webhook secrets are stored encrypted
- Current implementation stores them as-is (placeholder for actual encryption)
- In production, should use proper encryption service (e.g., AWS KMS, Azure Key Vault)

### HMAC Signature Validation
- Prevents unauthorized webhook calls
- Uses SHA-256 HMAC
- Signature is optional but strongly recommended
- If no signature provided, message is still processed (configure based on security requirements)

### Public Endpoint
- Webhook endpoints are publicly accessible (required by WhatsApp)
- Security relies on HMAC signature validation
- Rate limiting should be implemented at infrastructure level

## Testing

### Integration Tests
Comprehensive test coverage in `WhatsAppWebhookControllerTest.java`:
- Webhook verification
- Valid payload processing
- Duplicate message handling (idempotency)
- Existing dossier lookup and update
- Invalid signature rejection
- Multi-message payload processing
- Non-text message handling
- Closed dossier handling

### Service Tests
Unit tests in `WhatsAppMessageProcessingServiceTest.java`:
- Message processing logic
- Idempotency checks
- Dossier creation and lookup
- Webhook secret retrieval

## Configuration

### Database Migration
Run migration `V7__Add_whatsapp_integration.sql` to:
- Add `provider_message_id` column to `message` table
- Create `whatsapp_provider_config` table

### Security Configuration
Webhook endpoints are exempt from OAuth2 authentication:
```java
.requestMatchers("/api/v1/webhooks/**").permitAll()
```

## Usage Example

### 1. Configure WhatsApp Provider
```sql
INSERT INTO whatsapp_provider_config (
    org_id, 
    api_key_encrypted, 
    api_secret_encrypted, 
    webhook_secret_encrypted, 
    phone_number_id, 
    business_account_id, 
    enabled
) VALUES (
    'org123',
    'encrypted-api-key',
    'encrypted-api-secret',
    'my-webhook-secret',
    '123456789',
    '987654321',
    true
);
```

### 2. Configure WhatsApp Business API
- Set webhook URL: `https://your-domain.com/api/v1/webhooks/whatsapp/inbound`
- Set webhook secret: Same as `webhook_secret_encrypted` in database
- Subscribe to `messages` events

### 3. Test Webhook
```bash
curl -X GET "https://your-domain.com/api/v1/webhooks/whatsapp/inbound?hub.mode=subscribe&hub.verify_token=test&hub.challenge=challenge123"
```

## Future Enhancements

1. **Encryption Service**: Implement proper encryption for API credentials
2. **Outbound Messages**: Add support for sending WhatsApp messages
3. **Media Support**: Enhanced handling for images, videos, documents
4. **Status Updates**: Process message status updates (delivered, read)
5. **Rate Limiting**: Implement webhook-specific rate limiting
6. **Monitoring**: Add metrics and alerting for webhook processing
7. **Retry Logic**: Implement retry mechanism for failed message processing
8. **Template Messages**: Support for WhatsApp template messages

## Troubleshooting

### Message Not Processed
- Check `X-Org-Id` header is present
- Verify webhook secret matches in database
- Check HMAC signature is correct
- Review application logs for errors

### Duplicate Messages
- Idempotency is handled automatically via `providerMessageId`
- Same message ID will only be processed once
- Check database for existing message with same `provider_message_id`

### Dossier Not Created
- Verify phone number format matches existing dossiers
- Check if dossier already exists with different status
- Review logs for any validation errors
