# WhatsApp Template Management UI

This module provides a comprehensive UI for managing WhatsApp Business API message templates within the workflow-admin module.

## Features

### 1. Template Library View
- **Grid Layout**: Templates displayed in a card-based grid layout
- **Status Filtering**: Filter templates by status (Draft, Pending, Active, Rejected, Paused)
- **Search**: Search templates by name or description
- **Status Badges**: Visual indicators for template status with color coding
- **Actions**: Quick actions for each template (View, Edit, Duplicate, Delete)
- **Status Management**: Submit for approval, pause/activate templates

### 2. Template Editor
- **Form-Based Editor**: Intuitive form for creating and editing templates
- **Component Sections**:
  - Header (optional)
  - Body (required)
  - Footer (optional)
  - Buttons (optional)
- **Variable Insertion**: Quick buttons to insert variable placeholders
- **Button Management**: Add/remove buttons with different types (Quick Reply, URL, Phone Number)
- **Validation**: Real-time form validation with error messages
- **Responsive Layout**: Split-screen layout with live preview on desktop

### 3. Template Preview
- **WhatsApp UI Simulation**: Preview styled like actual WhatsApp messages
- **Variable Substitution**: Shows example values in place of variables
- **Component Display**: Shows header, body, footer, and buttons
- **Metadata Display**: Language, category, and status information
- **Variable List**: Overview of all variables with their example values

### 4. Variable Management
- **Drag-and-Drop Reordering**: Reorder variables by dragging
- **Visual Cards**: Each variable displayed in a card with details
- **Component Type Icons**: Icons indicating where variable is used
- **Required Flag**: Visual indication of required variables
- **Example Values**: Support for example values to help with preview
- **Position Tracking**: Automatic position updates when reordering

### 5. Status Tracking
- **Status Lifecycle**:
  - DRAFT → Template being created/edited
  - PENDING_APPROVAL → Submitted to WhatsApp for approval
  - ACTIVE → Approved and ready to use
  - REJECTED → Rejected by WhatsApp with reason
  - INACTIVE → Paused/deactivated template

### 6. WhatsApp Business API Integration
- **Submission**: Submit templates to WhatsApp Business API for approval
- **Approval Tracking**: Track approval status
- **Rejection Handling**: Display rejection reasons from WhatsApp
- **Template ID Mapping**: Store WhatsApp-assigned template IDs

## Components

### TemplateLibraryComponent
Location: `template-library/`
- Displays all templates for the organization
- Provides filtering and search
- Handles template CRUD operations
- Manages status transitions

### TemplateEditorComponent
Location: `template-editor/`
- Form for creating/editing templates
- Handles validation
- Manages components and variables
- Integrates with preview

### TemplatePreviewComponent
Location: `template-preview/`
- Live preview of template
- WhatsApp-style message bubble
- Variable substitution with example values
- Shows buttons and metadata

### VariableManagerComponent
Location: `variable-manager/`
- Manages template variables
- Drag-and-drop reordering
- Variable CRUD operations
- Position tracking

## Models

### WhatsAppTemplate
```typescript
interface WhatsAppTemplate {
  id?: number;
  orgId?: string;
  name: string;
  language: string;
  category: TemplateCategory;
  status: TemplateStatus;
  whatsAppTemplateId?: string;
  components: TemplateComponent[];
  variables: TemplateVariable[];
  description?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### TemplateComponent
```typescript
interface TemplateComponent {
  type: ComponentType;
  text?: string;
  format?: string;
  buttons?: TemplateButton[];
}
```

### TemplateVariable
```typescript
interface TemplateVariable {
  id?: number;
  variableName: string;
  componentType: ComponentType;
  position: number;
  exampleValue?: string;
  description?: string;
  isRequired: boolean;
}
```

## Services

### TemplateApiService
Location: `services/template-api.service.ts`

**Methods**:
- `getAllTemplates(status?)`: Get all templates, optionally filtered by status
- `getActiveTemplates()`: Get only active templates
- `getTemplateById(id)`: Get a specific template
- `createTemplate(template)`: Create a new template
- `updateTemplate(id, template)`: Update an existing template
- `deleteTemplate(id)`: Delete a template
- `submitForApproval(id)`: Submit template to WhatsApp for approval
- `approveTemplate(id, request)`: Mark template as approved
- `rejectTemplate(id, request)`: Mark template as rejected
- `activateTemplate(id)`: Activate a paused template
- `deactivateTemplate(id)`: Pause an active template

## Routing

Routes are configured in `workflow-admin.module.ts`:

- `/workflow-admin/templates` - Template library
- `/workflow-admin/templates/new` - Create new template
- `/workflow-admin/templates/:id` - View template (read-only)
- `/workflow-admin/templates/:id/edit` - Edit template

## Usage

### Creating a Template

1. Navigate to Workflow Admin → WhatsApp Templates tab
2. Click "Manage Templates"
3. Click "Create Template" button
4. Fill in template details:
   - Name (lowercase, underscores only)
   - Language (ISO 639-1 format)
   - Category
   - Description
5. Add content:
   - Header (optional)
   - Body (required)
   - Footer (optional)
   - Buttons (optional)
6. Add variables using the + button or manually with {{variable_name}}
7. Preview updates in real-time
8. Click "Create Template"

### Submitting for Approval

1. From the template library, find your draft template
2. Click the menu (⋮) icon
3. Select "Submit for Approval"
4. Template status changes to PENDING_APPROVAL
5. Wait for WhatsApp to review (external process)

### Managing Approved Templates

1. Active templates can be paused but not edited
2. To edit an active template:
   - Pause it first
   - Edit the paused version
   - Submit for approval again
3. Templates can be duplicated to create variations

## Validation

### Template Name Rules
- Lowercase letters, numbers, and underscores only
- No spaces or special characters
- Example: `order_confirmation`, `welcome_message_v2`

### Language Code Rules
- ISO 639-1 format
- Examples: `en`, `fr`, `en_US`, `fr_FR`

### Variable Rules
- Must be unique within a template
- Use descriptive names
- Example values help with preview and testing

### Button Rules
- Maximum varies by WhatsApp (check their documentation)
- URL buttons require valid URLs
- Phone buttons require valid phone numbers

## Integration with Backend

The frontend integrates with these backend endpoints:

- `GET /api/whatsapp/templates` - List templates
- `GET /api/whatsapp/templates/{id}` - Get template
- `POST /api/whatsapp/templates` - Create template
- `PUT /api/whatsapp/templates/{id}` - Update template
- `DELETE /api/whatsapp/templates/{id}` - Delete template
- `POST /api/whatsapp/templates/{id}/submit-for-approval` - Submit
- `POST /api/whatsapp/templates/{id}/approve` - Approve
- `POST /api/whatsapp/templates/{id}/reject` - Reject
- `POST /api/whatsapp/templates/{id}/activate` - Activate
- `POST /api/whatsapp/templates/{id}/deactivate` - Deactivate

## Styling

The UI uses Material Design components with custom styling:
- WhatsApp-inspired preview with green theme
- Responsive grid layout
- Card-based design
- Drag-and-drop visual feedback
- Status color coding:
  - Green (Active)
  - Yellow (Pending)
  - Red (Rejected)
  - Gray (Paused/Draft)

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast status indicators
- Tooltip help text

## Mobile Responsive

- Stack layout on mobile devices
- Touch-friendly drag-and-drop
- Collapsible filters
- Bottom sheet for actions
- Optimized preview for small screens

## Best Practices

1. **Use Descriptive Names**: Make template names clear and purposeful
2. **Provide Example Values**: Help others understand variable usage
3. **Test Before Submitting**: Use the preview to verify formatting
4. **Document Variables**: Add descriptions for complex variables
5. **Keep Content Concise**: WhatsApp has character limits
6. **Follow WhatsApp Guidelines**: Ensure compliance with their policies

## Troubleshooting

### Template Won't Submit
- Check all required fields are filled
- Ensure variable syntax is correct: {{variable_name}}
- Verify button URLs/phone numbers are valid

### Preview Not Updating
- Check form validity
- Ensure variables have example values
- Refresh the page if necessary

### Variables Not Working
- Verify variable names match in content and variable list
- Check for typos in placeholder syntax
- Ensure position numbers are sequential

## Future Enhancements

Potential improvements:
- Rich media support (images, documents)
- Template versioning
- Template analytics
- Bulk operations
- Template categories/tags
- Template testing tool
- Approval workflow with internal reviewers
- Template usage statistics
