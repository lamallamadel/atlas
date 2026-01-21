# Email Integration

This document describes the email integration functionality for both inbound and outbound email messaging.

## Features

- **Outbound Email**: Send emails via SMTP with JavaMailSender
- **Inbound Email**: Receive emails via webhooks from SendGrid, Mailgun, or generic providers
- **Template Rendering**: Use Thymeleaf templates for professional email formatting
- **Automatic Dossier Linking**: Auto-create and link messages to Dossiers by email lookup
- **Multi-tenant Support**: Per-organization email provider configuration

## Architecture

### Components

1. **EmailProviderConfig Entity**: Stores email provider credentials per organization
2. **EmailProviderService**: Implements OutboundMessageProvider for sending emails
3. **EmailWebhookController**: Handles inbound email webhooks
4. **EmailParserService**: Extracts from/to/subject/body/attachments from webhooks
5. **EmailMessageProcessingService**: Creates MessageEntity and links to Dossier

### Database Schema

```sql
-- Email provider configuration table
CREATE TABLE email_provider_config (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL,  -- 'SMTP', 'SENDGRID', 'MAILGUN'
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    smtp_username VARCHAR(255),
    smtp_password_encrypted TEXT,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    api_key_encrypted TEXT,
    webhook_secret_encrypted TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    use_tls BOOLEAN NOT NULL DEFAULT TRUE,
    use_ssl BOOLEAN NOT NULL DEFAULT FALSE,
    reply_to_email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced message table with email fields
ALTER TABLE message ADD COLUMN from_address VARCHAR(255);
ALTER TABLE message ADD COLUMN to_address VARCHAR(255);
ALTER TABLE message ADD COLUMN subject VARCHAR(500);
ALTER TABLE message ADD COLUMN html_content TEXT;
ALTER TABLE message ADD COLUMN text_content TEXT;
ALTER TABLE message ADD COLUMN attachments_json JSONB;

-- Enhanced dossier table
ALTER TABLE dossier ADD COLUMN lead_email VARCHAR(255);
```

## Configuration

### Provider Setup

Create an `EmailProviderConfig` entry for each organization:

```java
EmailProviderConfig config = new EmailProviderConfig();
config.setOrgId("org-123");
config.setProviderType("SMTP");
config.setSmtpHost("smtp.gmail.com");
config.setSmtpPort(587);
config.setSmtpUsername("noreply@example.com");
config.setSmtpPasswordEncrypted("encrypted-password");
config.setFromEmail("noreply@example.com");
config.setFromName("Example Company");
config.setUseTls(true);
config.setEnabled(true);
emailProviderConfigRepository.save(config);
```

### SMTP Configuration Examples

**Gmail:**
```
smtp_host: smtp.gmail.com
smtp_port: 587
use_tls: true
use_ssl: false
```

**Office 365:**
```
smtp_host: smtp.office365.com
smtp_port: 587
use_tls: true
use_ssl: false
```

**AWS SES:**
```
smtp_host: email-smtp.us-east-1.amazonaws.com
smtp_port: 587
use_tls: true
use_ssl: false
```

## Outbound Email

### Sending Emails

Create an `OutboundMessageEntity` with channel `EMAIL`:

```java
OutboundMessageEntity message = new OutboundMessageEntity();
message.setOrgId("org-123");
message.setChannel(MessageChannel.EMAIL);
message.setTo("customer@example.com");
message.setSubject("Welcome to our service");
message.setTemplateCode("emails/welcome");

Map<String, Object> variables = new HashMap<>();
variables.put("name", "John Doe");
variables.put("actionUrl", "https://app.example.com/login");
message.setPayloadJson(variables);

outboundMessageRepository.save(message);
```

The `OutboundJobWorker` will process the message and send it via `EmailProviderService`.

### Template Rendering

Templates are located in `src/main/resources/templates/emails/`.

**Available Templates:**
- `emails/notification` - General notification template
- `emails/welcome` - Welcome email template
- `emails/appointment-reminder` - Appointment reminder template

**Template Variables:**

Common variables for all templates:
- `title` - Email title
- `message` - Main message content
- `companyName` - Company name for footer
- `footerText` - Custom footer text

Template-specific variables:
- **notification**: `greeting`, `infoBox`, `details`, `actionUrl`, `actionText`
- **welcome**: `name`, `actionUrl`
- **appointment-reminder**: `name`, `appointmentDate`, `appointmentTime`, `location`, `duration`, `notes`, `actionUrl`

### Direct HTML Content

Instead of using a template, you can provide HTML directly:

```java
Map<String, Object> payload = new HashMap<>();
payload.put("htmlBody", "<html><body><h1>Hello!</h1></body></html>");
message.setPayloadJson(payload);
```

## Inbound Email

### Webhook Endpoints

**Mailgun Webhook:**
```
POST /api/v1/webhooks/email/inbound/mailgun
Content-Type: application/x-www-form-urlencoded
Headers:
  X-Org-Id: org-123
  X-Mailgun-Signature: <signature>
  X-Mailgun-Timestamp: <timestamp>
  X-Mailgun-Token: <token>
```

**SendGrid Webhook:**
```
POST /api/v1/webhooks/email/inbound/sendgrid
Content-Type: multipart/form-data
Headers:
  X-Org-Id: org-123
```

**Generic Webhook:**
```
POST /api/v1/webhooks/email/inbound/generic
Content-Type: application/json
Headers:
  X-Org-Id: org-123

{
  "from": "customer@example.com",
  "to": "support@example.com",
  "subject": "Help needed",
  "text": "Plain text content",
  "html": "<p>HTML content</p>",
  "messageId": "unique-message-id",
  "timestamp": 1234567890
}
```

### Webhook Security

**Mailgun:** Uses HMAC-SHA256 signature validation with timestamp and token.

Configure the webhook secret in `EmailProviderConfig.webhookSecretEncrypted`.

### Email Processing Flow

1. Webhook receives email data
2. `EmailParserService` extracts email fields (from, to, subject, body, attachments)
3. `EmailMessageProcessingService` looks up Dossier by email:
   - First, searches `dossier.lead_email`
   - Then, searches `partie_prenante.email`
   - Creates new Dossier if not found
4. Creates `MessageEntity` with:
   - `channel = EMAIL`
   - `direction = INBOUND`
   - All email fields populated
5. Links message to Dossier
6. Logs activity

### Dossier Lookup Strategy

The system uses a multi-step lookup to find or create the appropriate Dossier:

1. **Direct Email Match**: Check `dossier.lead_email` for exact match (case-insensitive)
2. **Party Email Match**: Check `partie_prenante.email` for stakeholders
3. **Create New Dossier**: If no match found, create new Dossier with:
   - `lead_email` = sender email
   - `lead_name` = sender name (if available)
   - `lead_source` = "Email"
   - `status` = NEW

**Important:** Only Dossiers with status NOT IN (WON, LOST) are considered for linking.

## Email Parsing

The `EmailParserService` handles various email address formats:

- `"John Doe <john@example.com>"` → name: "John Doe", email: "john@example.com"
- `<john@example.com>` → email: "john@example.com"
- `john@example.com` → email: "john@example.com"

Attachments are stored in `MessageEntity.attachmentsJson`:
```json
{
  "attachments": [
    {
      "filename": "document.pdf",
      "contentType": "application/pdf",
      "size": 12345,
      "url": "https://storage.example.com/abc123",
      "contentId": "cid:abc123"
    }
  ],
  "count": 1
}
```

## Testing

### Testing Outbound Emails

```java
@Test
void testSendEmail() {
    EmailProviderConfig config = new EmailProviderConfig();
    config.setOrgId("test-org");
    config.setSmtpHost("smtp.mailtrap.io");
    config.setSmtpPort(2525);
    config.setSmtpUsername("username");
    config.setSmtpPasswordEncrypted("password");
    config.setFromEmail("test@example.com");
    config.setEnabled(true);
    emailProviderConfigRepository.save(config);

    OutboundMessageEntity message = new OutboundMessageEntity();
    message.setOrgId("test-org");
    message.setChannel(MessageChannel.EMAIL);
    message.setTo("recipient@example.com");
    message.setSubject("Test Email");
    message.setTemplateCode("emails/notification");
    
    ProviderSendResult result = emailProviderService.send(message);
    assertTrue(result.isSuccess());
}
```

### Testing Inbound Webhooks

Use a tool like ngrok to expose your local server, then configure SendGrid/Mailgun to send webhooks to:
```
https://your-domain.ngrok.io/api/v1/webhooks/email/inbound/mailgun
```

Or test directly with curl:
```bash
curl -X POST http://localhost:8080/api/v1/webhooks/email/inbound/generic \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: test-org" \
  -d '{
    "from": "customer@example.com",
    "to": "support@example.com",
    "subject": "Test",
    "text": "Test message"
  }'
```

## Error Handling

### Outbound Errors

**Non-retryable errors:**
- 550: Mailbox unavailable
- 551: User not local
- 552: Exceeded storage allocation
- 553: Mailbox name not allowed
- 554: Transaction failed
- INVALID_EMAIL: Invalid email address format

**Retryable errors:**
- Network timeouts
- Temporary SMTP errors
- Rate limiting

### Inbound Errors

Webhook errors are logged but do not prevent other operations. Failed emails can be retried by resending the webhook.

## Best Practices

1. **Security**: Always encrypt credentials in `EmailProviderConfig`
2. **Templates**: Use Thymeleaf templates for consistent branding
3. **Testing**: Use services like Mailtrap or MailHog for development
4. **Rate Limits**: Be aware of SMTP provider rate limits
5. **Monitoring**: Monitor delivery rates and error logs
6. **Spam**: Configure SPF, DKIM, and DMARC records
7. **Unsubscribe**: Include unsubscribe links in marketing emails

## Troubleshooting

### Emails Not Sending

1. Check `EmailProviderConfig` is enabled for the organization
2. Verify SMTP credentials are correct
3. Check firewall allows outbound connections to SMTP port
4. Review `OutboundJobWorker` logs for errors
5. Verify email addresses are valid format

### Webhooks Not Processing

1. Verify webhook endpoint is accessible from provider
2. Check `X-Org-Id` header is present
3. Validate webhook signature (for Mailgun)
4. Review `EmailWebhookController` logs
5. Ensure email addresses in webhook match Dossier records

### Template Rendering Errors

1. Verify template file exists in `templates/emails/`
2. Check variable names match template expectations
3. Review Thymeleaf logs for syntax errors
4. Test template with fallback content

## Future Enhancements

- [ ] Email bounce handling
- [ ] Email open/click tracking
- [ ] Attachment download support
- [ ] Email thread/conversation tracking
- [ ] Rich text editor for composing emails
- [ ] Email template builder
- [ ] Email scheduling
- [ ] A/B testing for email content
