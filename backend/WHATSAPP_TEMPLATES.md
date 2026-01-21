# WhatsApp Template Management System

## Overview

The WhatsApp Template Management System provides a comprehensive solution for creating, managing, and deploying WhatsApp Business API message templates. Templates must comply with WhatsApp Business API format requirements and can include dynamic variables, media, and interactive buttons.

## Features

- **Template CRUD Operations**: Create, read, update, and delete templates
- **Status Management**: Draft, Pending Approval, Active, Inactive, Rejected
- **Activation/Deactivation Controls**: Admin controls for template lifecycle
- **Format Validation**: Comprehensive validation for WhatsApp Business API requirements
- **Variable Management**: Support for dynamic variables with examples
- **Component Support**: Header, Body, Footer, and Buttons
- **Multi-language Support**: Templates can be created in multiple languages
- **Organization Isolation**: Templates are scoped per organization (tenant)
- **Audit Trail**: All operations are audited for compliance

## Architecture

### Entities

#### WhatsAppTemplate
- `id`: Unique identifier
- `orgId`: Organization identifier (tenant isolation)
- `name`: Template name (lowercase, numbers, underscores only)
- `language`: ISO 639-1 language code (e.g., "en", "en_US")
- `category`: Template category (MARKETING, UTILITY, AUTHENTICATION, TRANSACTIONAL)
- `status`: Template status (DRAFT, ACTIVE, INACTIVE, PENDING_APPROVAL, REJECTED)
- `whatsAppTemplateId`: WhatsApp Business API template ID (after approval)
- `components`: JSONB field containing template structure
- `description`: Template description
- `rejectionReason`: Reason for rejection (if applicable)

#### TemplateVariable
- `id`: Unique identifier
- `templateId`: Foreign key to WhatsAppTemplate
- `variableName`: Variable name for reference
- `componentType`: Where variable is used (HEADER, BODY, FOOTER, BUTTONS)
- `position`: Variable position (1, 2, 3, etc.)
- `exampleValue`: Example value for testing
- `description`: Variable description
- `isRequired`: Whether the variable is required

### Enums

- **TemplateStatus**: ACTIVE, INACTIVE, PENDING_APPROVAL, REJECTED, DRAFT
- **TemplateCategory**: MARKETING, UTILITY, AUTHENTICATION, TRANSACTIONAL
- **ComponentType**: HEADER, BODY, FOOTER, BUTTONS
- **ButtonType**: QUICK_REPLY, CALL_TO_ACTION, URL, PHONE_NUMBER

## API Endpoints

All endpoints are under `/api/whatsapp/templates` and require admin role except where noted.

### Get All Templates
```http
GET /api/whatsapp/templates?status=ACTIVE
Authorization: Bearer {token}
```

### Get Active Templates (Public)
```http
GET /api/whatsapp/templates/active
Authorization: Bearer {token}
```

### Get Template by ID
```http
GET /api/whatsapp/templates/{id}
Authorization: Bearer {token}
```

### Get Template by Name and Language
```http
GET /api/whatsapp/templates/by-name?name=order_confirmation&language=en
Authorization: Bearer {token}
```

### Create Template
```http
POST /api/whatsapp/templates
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "order_confirmation",
  "language": "en",
  "category": "TRANSACTIONAL",
  "description": "Order confirmation message",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Order Confirmed"
    },
    {
      "type": "BODY",
      "text": "Hi {{1}}, your order {{2}} has been confirmed."
    },
    {
      "type": "FOOTER",
      "text": "Thank you for shopping with us!"
    }
  ],
  "variables": [
    {
      "variableName": "customer_name",
      "componentType": "BODY",
      "position": 1,
      "exampleValue": "John Doe",
      "description": "Customer's full name",
      "isRequired": true
    },
    {
      "variableName": "order_number",
      "componentType": "BODY",
      "position": 2,
      "exampleValue": "#12345",
      "description": "Order number",
      "isRequired": true
    }
  ]
}
```

### Update Template
```http
PUT /api/whatsapp/templates/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "order_confirmation",
  "language": "en",
  "category": "TRANSACTIONAL",
  "components": [...],
  "variables": [...]
}
```

### Activate Template
```http
POST /api/whatsapp/templates/{id}/activate
Authorization: Bearer {token}
```

### Deactivate Template
```http
POST /api/whatsapp/templates/{id}/deactivate
Authorization: Bearer {token}
```

### Submit for Approval
```http
POST /api/whatsapp/templates/{id}/submit-for-approval
Authorization: Bearer {token}
```

### Approve Template
```http
POST /api/whatsapp/templates/{id}/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "whatsAppTemplateId": "123456789"
}
```

### Reject Template
```http
POST /api/whatsapp/templates/{id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "rejectionReason": "Template contains prohibited content"
}
```

### Delete Template
```http
DELETE /api/whatsapp/templates/{id}
Authorization: Bearer {token}
```

**Note**: Cannot delete active templates. Deactivate first.

### Get Template Variables
```http
GET /api/whatsapp/templates/{id}/variables
Authorization: Bearer {token}
```

## Validation Rules

### Template Name
- **Pattern**: `^[a-z0-9_]+$` (lowercase letters, numbers, underscores only)
- **Max Length**: 512 characters
- **Uniqueness**: Must be unique per organization and language

### Language Code
- **Pattern**: `^[a-z]{2}(_[A-Z]{2})?$`
- **Examples**: "en", "en_US", "fr", "es_MX"

### Components

#### Header (Optional)
- **Format**: TEXT, IMAGE, VIDEO, DOCUMENT
- **Text Max Length**: 60 characters
- **Variables**: Allowed for TEXT format
- **Limit**: Maximum 1 header per template

#### Body (Required)
- **Max Length**: 1024 characters
- **Variables**: Allowed
- **Limit**: Exactly 1 body per template

#### Footer (Optional)
- **Max Length**: 60 characters
- **Variables**: Not allowed
- **Limit**: Maximum 1 footer per template

#### Buttons (Optional)
- **Max Count**: 10 buttons total
- **Max Quick Reply**: 3 buttons
- **Max Call-to-Action**: 2 buttons
- **Button Text Max Length**: 25 characters
- **Types**: QUICK_REPLY, URL, PHONE_NUMBER

### Variables
- **Format**: `{{1}}`, `{{2}}`, `{{3}}`, etc.
- **Must be Sequential**: Start from 1 and increment
- **Example**: If using {{1}} and {{3}}, validation fails (missing {{2}})

## Template Lifecycle

```
DRAFT
  ↓
PENDING_APPROVAL → REJECTED
  ↓                    ↓
ACTIVE              DRAFT
  ↓
INACTIVE
```

### Status Transitions

1. **DRAFT**: Initial state when template is created
2. **PENDING_APPROVAL**: Template submitted to WhatsApp for approval
3. **APPROVED/ACTIVE**: Template approved by WhatsApp and ready to use
4. **REJECTED**: Template rejected by WhatsApp with reason
5. **INACTIVE**: Template deactivated by admin

## Usage Examples

See `backend/src/main/resources/whatsapp-template-examples.json` for complete examples including:

- Order Confirmation
- Appointment Reminder
- Welcome Message

## Error Handling

The system throws appropriate exceptions:

- `IllegalArgumentException`: Validation errors (invalid format, missing fields)
- `IllegalStateException`: State transition errors (e.g., deleting active template)
- `ResourceNotFoundException`: Template not found

All exceptions are handled by `GlobalExceptionHandler` and return appropriate HTTP status codes with detailed error messages.

## Security

- All endpoints require authentication
- Admin role required for template management (except getting active templates)
- Organization isolation enforced via tenant filtering
- All operations are audited

## Database Schema

### Migration: V24__Add_whatsapp_template_management.sql

Creates:
- `whatsapp_template` table with JSONB components
- `template_variable` table with foreign key to template
- Indexes for performance optimization
- Unique constraint on (org_id, name, language)

## Integration with WhatsApp Business API

1. Create template in DRAFT status
2. Submit for approval using `/submit-for-approval` endpoint
3. Submit to WhatsApp Business API separately (external process)
4. Upon WhatsApp approval, use `/approve` endpoint with WhatsApp template ID
5. Upon WhatsApp rejection, use `/reject` endpoint with rejection reason
6. Activate template using `/activate` endpoint

## Testing

Use the examples in `whatsapp-template-examples.json` for testing:

```bash
# Create a template
curl -X POST http://localhost:8080/api/whatsapp/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: org-123" \
  -d @examples/order_confirmation.json

# Get active templates
curl http://localhost:8080/api/whatsapp/templates/active \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: org-123"
```

## Best Practices

1. **Template Naming**: Use descriptive, lowercase names with underscores
2. **Variables**: Always provide example values for testing
3. **Descriptions**: Document the purpose and use case for each template
4. **Testing**: Test templates with example values before submitting to WhatsApp
5. **Versioning**: If changing a template, create a new version with different name
6. **Deactivation**: Deactivate old templates instead of deleting them for audit trail

## Future Enhancements

- Template versioning
- Template cloning
- Bulk template operations
- Template usage analytics
- Integration with WhatsApp Business API for automatic approval sync
- Template preview rendering
- A/B testing support
