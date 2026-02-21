# WhatsApp Template Management System

## Overview

The WhatsApp Template Management System provides a comprehensive solution for creating, managing, and versioning WhatsApp Business message templates with full approval workflow integration with Meta Business Manager API.

## Features

### 1. Template Entity with Approval Workflow

The system supports the following statuses:
- **DRAFT**: Initial state when template is created
- **PENDING**: Template submitted to Meta Business Manager and awaiting approval
- **APPROVED**: Template approved by Meta and ready for use
- **REJECTED**: Template rejected by Meta with reason
- **PAUSED**: Template temporarily disabled
- **ACTIVE**: Template is active and available for messaging
- **INACTIVE**: Template deactivated

### 2. Template Management Controller

**Endpoint:** `/api/whatsapp/templates`

#### CRUD Operations
- `GET /api/whatsapp/templates` - Get all templates (with optional status filter)
- `GET /api/whatsapp/templates/{id}` - Get template by ID
- `POST /api/whatsapp/templates` - Create new template
- `PUT /api/whatsapp/templates/{id}` - Update template
- `DELETE /api/whatsapp/templates/{id}` - Delete template (non-active only)

#### Search & Filter
- `GET /api/whatsapp/templates/search` - Search with filters:
  - `category`: MARKETING, UTILITY, AUTHENTICATION, TRANSACTIONAL
  - `status`: DRAFT, PENDING, APPROVED, REJECTED, PAUSED, ACTIVE, INACTIVE
  - `language`: en, es, fr, de, pt, etc.
  - `searchTerm`: Search in name and description

#### Workflow Actions
- `POST /api/whatsapp/templates/{id}/submit-for-approval` - Submit to Meta Business API
- `POST /api/whatsapp/templates/{id}/poll-status` - Poll approval status from Meta
- `POST /api/whatsapp/templates/{id}/activate` - Activate approved template
- `POST /api/whatsapp/templates/{id}/pause` - Pause active template
- `POST /api/whatsapp/templates/{id}/deactivate` - Deactivate template

#### Versioning
- `POST /api/whatsapp/templates/{id}/versions` - Create new version
- `GET /api/whatsapp/templates/{id}/versions` - Get all versions
- `GET /api/whatsapp/templates/{id}/versions/{versionNumber}` - Get specific version
- `POST /api/whatsapp/templates/{id}/versions/{versionNumber}/activate` - Activate version

### 3. Template Editor Component

**Location:** `frontend/src/app/components/template-editor.component.ts`

#### Features
- Form-based template creation/editing
- Support for:
  - Header, Body, Footer components
  - Dynamic variables with placeholders
  - Action buttons (Quick Reply, URL, Phone Number)
- **Live Preview** with variable interpolation
- Real-time preview updates as you type
- Example values for variables shown in preview

#### Usage
```typescript
<app-template-editor 
  [template]="existingTemplate" 
  [mode]="'edit'"
  (save)="handleSave($event)"
  (cancel)="handleCancel()">
</app-template-editor>
```

### 4. Meta Business Manager API Integration

**Service:** `MetaBusinessApiService`

#### Configuration
Add to `application.yml`:
```yaml
whatsapp:
  business:
    api:
      url: https://graph.facebook.com/v18.0
      access-token: ${META_ACCESS_TOKEN}
      waba-id: ${WHATSAPP_BUSINESS_ACCOUNT_ID}
```

#### Methods
- `submitTemplateForApproval(template)` - Submit template to Meta
- `pollApprovalStatus(submissionId)` - Check approval status

#### Mock Mode
If credentials are not configured, the service operates in mock mode for development/testing.

### 5. Template Library Component

**Location:** `frontend/src/app/components/template-library.component.ts`

#### Features
- Display all organization templates
- Advanced search and filtering:
  - By category (Marketing, Utility, Authentication, Transactional)
  - By status (Draft, Pending, Approved, etc.)
  - By language
  - By text search
- Status badges with color coding
- Version history access
- Contextual action menus per template
- Responsive table layout

### 6. Template Versioning

#### Version Management
- Each template tracks `currentVersion` number
- Creating a new version snapshots:
  - Components (header, body, footer, buttons)
  - Variables with all metadata
  - Description and change summary
- Only one version can be active at a time
- Activating a version restores template to that state

#### Use Cases
- **A/B Testing**: Create versions with different messaging
- **Seasonal Updates**: Revert to previous versions when needed
- **Campaign Management**: Different versions for different campaigns
- **Audit Trail**: Track all changes with change summaries

#### Database Schema
```sql
CREATE TABLE whatsapp_template_version (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL,
    version_number INTEGER NOT NULL,
    components JSONB,
    variables_snapshot JSONB,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT false,
    change_summary TEXT,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_template_version UNIQUE (template_id, version_number)
);
```

## Template Structure

### Template Components
Templates consist of multiple components:

```json
{
  "name": "order_confirmation",
  "language": "en",
  "category": "TRANSACTIONAL",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Order Confirmed"
    },
    {
      "type": "BODY",
      "text": "Hello {{name}}, your order {{orderId}} has been confirmed!"
    },
    {
      "type": "FOOTER",
      "text": "Thank you for your business"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "QUICK_REPLY",
          "text": "Track Order"
        }
      ]
    }
  ],
  "variables": [
    {
      "variableName": "name",
      "componentType": "BODY",
      "position": 1,
      "exampleValue": "John",
      "isRequired": true
    },
    {
      "variableName": "orderId",
      "componentType": "BODY",
      "position": 2,
      "exampleValue": "12345",
      "isRequired": true
    }
  ]
}
```

## Security

All template management endpoints require `ADMIN` role:
```java
@PreAuthorize("hasRole('ADMIN')")
```

## Workflow Example

### Creating and Approving a Template

1. **Create Draft Template**
   ```http
   POST /api/whatsapp/templates
   {
     "name": "welcome_message",
     "language": "en",
     "category": "UTILITY",
     "components": [...]
   }
   ```
   Status: DRAFT

2. **Submit for Approval**
   ```http
   POST /api/whatsapp/templates/1/submit-for-approval
   ```
   - Submits to Meta Business API
   - Stores `metaSubmissionId`
   - Status: PENDING

3. **Poll Approval Status**
   ```http
   POST /api/whatsapp/templates/1/poll-status
   ```
   - Queries Meta Business API
   - Updates status automatically
   - Status: APPROVED (if approved)

4. **Activate Template**
   ```http
   POST /api/whatsapp/templates/1/activate
   ```
   Status: ACTIVE

### Creating a New Version

1. **Create Version**
   ```http
   POST /api/whatsapp/templates/1/versions
   {
     "changeSummary": "Updated promotional text for holiday season"
   }
   ```
   - Snapshots current template state
   - Increments version number
   - Version 2 created

2. **Activate Version**
   ```http
   POST /api/whatsapp/templates/1/versions/2/activate
   ```
   - Restores template to version 2 state
   - Sets version 2 as active
   - Deactivates previous version

## Best Practices

### Template Naming
- Use lowercase letters, numbers, and underscores only
- Be descriptive: `order_confirmation`, `appointment_reminder`
- Include language code for multi-language templates

### Variable Management
- Always provide example values
- Use clear, descriptive variable names
- Mark variables as required appropriately

### Version Control
- Always add meaningful change summaries
- Test versions before activating in production
- Keep old versions for rollback capability

### Approval Workflow
- Review templates thoroughly before submission
- Address rejection reasons promptly
- Poll status regularly for pending templates

## Frontend Integration

### Using the Template Library
```typescript
import { Router } from '@angular/router';

// Navigate to library
router.navigate(['/templates']);

// Navigate to create
router.navigate(['/templates/create']);

// Navigate to edit
router.navigate(['/templates/edit', templateId]);

// Navigate to versions
router.navigate(['/templates', templateId, 'versions']);
```

### Using the Template Editor
```typescript
import { WhatsAppTemplateApiService } from './services/whatsapp-template-api.service';

// Create template
templateService.createTemplate(request).subscribe(
  template => console.log('Created:', template),
  error => console.error('Error:', error)
);

// Update template
templateService.updateTemplate(id, request).subscribe(
  template => console.log('Updated:', template)
);
```

## Database Migrations

The system includes database migration `V108__Add_whatsapp_template_versioning.sql`:
- Adds versioning columns to `whatsapp_template`
- Creates `whatsapp_template_version` table
- Adds indexes for performance

## Testing

### Backend Testing
```bash
cd backend
mvn test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## Configuration

### Environment Variables
```bash
# Meta Business API (optional - works in mock mode without)
META_ACCESS_TOKEN=your_access_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
```

### Application Properties
```yaml
whatsapp:
  business:
    api:
      url: https://graph.facebook.com/v18.0
      access-token: ${META_ACCESS_TOKEN:}
      waba-id: ${WHATSAPP_BUSINESS_ACCOUNT_ID:}
```

## Support

For issues or questions:
- Check logs for detailed error messages
- Ensure Meta Business API credentials are correct
- Verify template format matches WhatsApp requirements
- Review audit logs for workflow tracking
