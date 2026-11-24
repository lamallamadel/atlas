# WhatsApp Template API Examples

## 1. Submit Template to Meta

**Endpoint:** `POST /api/whatsapp/templates/{id}/submit`

**Request:**
```bash
curl -X POST "http://localhost:8080/api/whatsapp/templates/123/submit" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "id": 123,
  "name": "order_confirmation",
  "language": "en",
  "category": "TRANSACTIONAL",
  "status": "PENDING",
  "metaSubmissionId": "1234567890",
  "components": [...],
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:35:00"
}
```

## 2. Preview Template with Sample Data

**Endpoint:** `GET /api/whatsapp/templates/{id}/preview`

**Request:**
```bash
curl -X GET "http://localhost:8080/api/whatsapp/templates/123/preview?1=John%20Doe&2=Order123&3=99.99" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "templateId": 123,
  "name": "order_confirmation",
  "language": "en",
  "renderedComponents": [
    {
      "type": "BODY",
      "text": "Hello John Doe, your order Order123 for $99.99 has been confirmed."
    }
  ],
  "originalComponents": [
    {
      "type": "BODY",
      "text": "Hello {{1}}, your order {{2}} for ${{3}} has been confirmed."
    }
  ]
}
```

## 3. Handle Template Status Webhook (Meta → Your Server)

**Endpoint:** `POST /api/v1/whatsapp/webhooks/template-status`

**Request from Meta (APPROVED):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "time": 1704195600,
      "changes": [
        {
          "field": "message_template_status_update",
          "value": {
            "event": "APPROVED",
            "message_template_id": "567890123",
            "message_template_name": "order_confirmation",
            "message_template_language": "en",
            "reason": null
          }
        }
      ]
    }
  ]
}
```

**Request from Meta (REJECTED):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "time": 1704195600,
      "changes": [
        {
          "field": "message_template_status_update",
          "value": {
            "event": "REJECTED",
            "message_template_id": "567890123",
            "message_template_name": "order_confirmation",
            "message_template_language": "en",
            "reason": "INCORRECT_CATEGORY"
          }
        }
      ]
    }
  ]
}
```

## 4. Webhook Verification (Meta → Your Server)

**Endpoint:** `GET /api/v1/whatsapp/webhooks/template-status`

**Request from Meta:**
```bash
GET /api/v1/whatsapp/webhooks/template-status?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=CHALLENGE_STRING
```

**Response:**
```
CHALLENGE_STRING
```

## Template with Variables Example

### Template Structure
```json
{
  "name": "order_confirmation",
  "language": "en",
  "category": "TRANSACTIONAL",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Order Confirmation"
    },
    {
      "type": "BODY",
      "text": "Hello {{1}}, your order {{2}} for ${{3}} has been confirmed. Expected delivery: {{4}}."
    },
    {
      "type": "FOOTER",
      "text": "Thank you for your business!"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Track Order",
          "url": "https://example.com/orders/{{1}}"
        },
        {
          "type": "PHONE_NUMBER",
          "text": "Call Support",
          "phone_number": "+1234567890"
        }
      ]
    }
  ]
}
```

### Preview Request
```bash
curl -X GET "http://localhost:8080/api/whatsapp/templates/123/preview?1=John%20Doe&2=ORD-12345&3=149.99&4=Jan%2020,%202024" \
  -H "Authorization: Bearer <token>"
```

### Preview Response
```json
{
  "templateId": 123,
  "name": "order_confirmation",
  "language": "en",
  "renderedComponents": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Order Confirmation"
    },
    {
      "type": "BODY",
      "text": "Hello John Doe, your order ORD-12345 for $149.99 has been confirmed. Expected delivery: Jan 20, 2024."
    },
    {
      "type": "FOOTER",
      "text": "Thank you for your business!"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Track Order",
          "url": "https://example.com/orders/John Doe"
        },
        {
          "type": "PHONE_NUMBER",
          "text": "Call Support",
          "phone_number": "+1234567890"
        }
      ]
    }
  ],
  "originalComponents": [...]
}
```

## Validation Examples

### Valid Template (Sequential Variables)
```json
{
  "type": "BODY",
  "text": "Hello {{1}}, your order {{2}} is ready."
}
```
✅ Valid - variables are sequential (1, 2)

### Invalid Template (Non-Sequential Variables)
```json
{
  "type": "BODY",
  "text": "Hello {{1}}, your order {{3}} is ready."
}
```
❌ Invalid - skipped {{2}}, expecting sequential numbering

### Valid Template (Multiple Components)
```json
{
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Hello {{1}}"
    },
    {
      "type": "BODY",
      "text": "Your order {{1}} for ${{2}} is ready."
    }
  ]
}
```
✅ Valid - each component's variables are sequential independently

## Error Responses

### Template Not Found
```json
{
  "timestamp": "2024-01-15T10:30:00.000+00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Template not found with id: 123",
  "path": "/api/whatsapp/templates/123/submit"
}
```

### Validation Failure
```json
{
  "timestamp": "2024-01-15T10:30:00.000+00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Template validation failed: BODY: Variables must be sequential starting from {{1}}. Expected {{2}} but found {{3}}",
  "path": "/api/whatsapp/templates/123/submit"
}
```

### Unauthorized
```json
{
  "timestamp": "2024-01-15T10:30:00.000+00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied",
  "path": "/api/whatsapp/templates/123/submit"
}
```
