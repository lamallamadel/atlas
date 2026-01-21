# Referential Data System

## Overview

The referential data system provides a flexible, tenant-isolated way to manage reference data such as case types, case statuses, lead sources, loss reasons, and won reasons. It includes versioning for audit trails and import/export capabilities for templates.

## Database Schema

### Main Tables

#### `referential`
Stores the current state of referential values per organization.

- `id`: Primary key
- `org_id`: Organization/tenant identifier (tenant isolation)
- `category`: Type of referential (CASE_TYPE, CASE_STATUS, LEAD_SOURCE, LOSS_REASON, WON_REASON)
- `code`: Unique code within category
- `label`: Display label
- `description`: Optional description
- `display_order`: Sort order for display
- `is_active`: Whether the value is active
- `is_system`: Whether it's a system-defined value (cannot be deleted)
- `version`: Version number for optimistic locking
- `last_change_type`: Type of last change (CREATED, UPDATED, DELETED, ACTIVATED, DEACTIVATED)
- `created_at`, `updated_at`, `created_by`, `updated_by`: Audit fields

#### `referential_version`
Stores complete history of all changes to referential values.

- `id`: Primary key
- `referential_id`: Reference to the referential item
- `org_id`: Organization identifier
- All fields from referential table (snapshot)
- `change_type`: Type of change
- `change_reason`: Optional reason for change

### Indexes

- Primary unique constraint on `(org_id, category, code)`
- Indexes on `category`, `code`, `is_active`
- Version table indexes on `referential_id`, `org_id`, `created_at`, `category`

## API Endpoints

### Standard CRUD Operations

All endpoints are under `/api/referentials`:

- `GET /api/referentials?category={category}&activeOnly={true|false}` - List referentials by category
- `GET /api/referentials/{id}` - Get single referential
- `GET /api/referentials/by-code?category={category}&code={code}` - Get by category and code
- `POST /api/referentials` - Create new referential
- `PUT /api/referentials/{id}` - Update referential
- `DELETE /api/referentials/{id}` - Delete referential (system items protected)

### Admin Operations

All admin endpoints are under `/api/workflow-admin/referentials`:

- `GET /api/workflow-admin/referentials` - Admin view with versioning info
- `GET /api/workflow-admin/referentials/{id}/versions` - Get version history for item
- `GET /api/workflow-admin/referentials/categories/{category}/versions` - Get all versions for category
- `POST /api/workflow-admin/referentials/seed` - Seed default referentials for current org
- `GET /api/workflow-admin/referentials/export?categories={category1,category2}` - Export as template
- `POST /api/workflow-admin/referentials/import?overwrite={true|false}` - Import from template
- `GET /api/workflow-admin/referentials/categories` - List available categories

## Seeding Strategies

### 1. Migration-Based Seeding

For initial setup or specific organizations:

```sql
-- V27__Seed_default_referentials_per_org.sql
INSERT INTO referential (org_id, category, code, label, ...) VALUES
('ORG-123', 'CASE_TYPE', 'CRM_LEAD_BUY', 'Prospect Achat', ...);
```

### 2. Programmatic Seeding

Use the `ReferentialSeedingService`:

```java
@Autowired
private ReferentialSeedingService seedingService;

// Seed for specific organization
seedingService.seedDefaultReferentialsForOrg("NEW-ORG");
```

### 3. Template Import

Export from one organization and import to another:

```bash
# Export template
curl -H "X-Organization-ID: SOURCE-ORG" \
  http://localhost:8080/api/workflow-admin/referentials/export > template.json

# Import to target organization
curl -H "X-Organization-ID: TARGET-ORG" \
  -H "Content-Type: application/json" \
  -d @template.json \
  http://localhost:8080/api/workflow-admin/referentials/import?overwrite=false
```

## Categories

### CASE_TYPE
Defines the type of case/dossier:
- `CRM_LEAD_BUY` - Property purchase lead
- `CRM_LEAD_RENT` - Property rental lead
- `CRM_OWNER_LEAD` - Owner lead (sell/rent)
- `CRM_SALE_TRANSACTION` - Sale transaction
- `CRM_RENTAL_TRANSACTION` - Rental transaction

### CASE_STATUS
Defines the status of a case through its lifecycle:
- `CRM_NEW` - New case
- `CRM_TRIAGED` - Triaged
- `CRM_CONTACTED` - Contacted
- `CRM_QUALIFIED` - Qualified
- `CRM_VISIT_PLANNED` - Visit planned
- `CRM_CLOSED_WON` - Closed won
- `CRM_CLOSED_LOST` - Closed lost
- (Plus many more...)

### LEAD_SOURCE
Tracks where leads originated from:
- `WHATSAPP` - WhatsApp
- `PHONE_CALL` - Phone call
- `EMAIL` - Email
- `FACEBOOK` - Facebook
- `AVITO` - Avito (marketplace)
- (Plus more channels...)

### LOSS_REASON
Records why a deal was lost:
- `PRICE_TOO_HIGH` - Price too high
- `NOT_INTERESTED` - Not interested
- `COMPETITOR` - Lost to competitor
- `NO_RESPONSE` - No response
- (Plus more reasons...)

### WON_REASON
Records why a deal was won:
- `SIGNED` - Contract signed
- `RESERVED` - Property reserved
- `DEPOSIT_PAID` - Deposit paid
- `SOLD` - Property sold
- (Plus more reasons...)

## Versioning & Audit Trail

Every change to a referential creates a version record:

```java
// Update with change reason
ReferentialUpdateRequest request = new ReferentialUpdateRequest();
request.setLabel("Updated Label");
request.setChangeReason("Business process changed");

// Service automatically creates version entry
referentialService.update(id, entity, request.getChangeReason());
```

Version history tracks:
- What changed (old and new values)
- When it changed
- Who changed it
- Why it changed (optional reason)
- Type of change (CREATED, UPDATED, DELETED, ACTIVATED, DEACTIVATED)

## Tenant Isolation

All referential data is strictly isolated per organization:

1. **Entity Level**: `org_id` field required on all records
2. **Database Level**: Unique constraint includes `org_id`
3. **Application Level**: Hibernate filter automatically applies `org_id` from TenantContext
4. **Repository Level**: All queries filtered by current tenant

## Best Practices

### 1. System Items Protection
Mark default/required items as `is_system = true` to prevent deletion:

```java
referential.setIsSystem(true); // Cannot be deleted via API
```

### 2. Soft Deletion via Deactivation
Instead of hard deleting, deactivate items:

```java
referential.setIsActive(false); // Soft delete
```

### 3. Change Reasons
Always provide change reasons for audit trail:

```java
referentialService.update(id, entity, "Merged duplicate entries");
```

### 4. Export/Import for Multi-Tenant Setup
Use templates to standardize across organizations:

1. Create master template from reference organization
2. Export template
3. Import to new organizations during onboarding
4. Customize per-organization as needed

### 5. Version History Review
Regularly review version history for compliance:

```java
List<ReferentialVersionEntity> history = 
    referentialService.getVersionHistory(referentialId);
```

## Migration Files

### Standard Migrations (H2 & PostgreSQL)
- `V14__Add_referential_system.sql` - Creates referential table
- `V15__Seed_default_referentials.sql` - Seeds DEFAULT-ORG
- `V26__Add_referential_versioning.sql` - Adds versioning table
- `V27__Seed_default_referentials_per_org.sql` - Seeds DEMO-ORG

### PostgreSQL-Specific Migrations
- `V103__Add_referential_versioning.sql` - PostgreSQL version with conditional DDL
- `V104__Seed_default_referentials_per_org.sql` - PostgreSQL dynamic seeding

## Service Classes

- **ReferentialService**: Core CRUD operations with versioning
- **ReferentialSeedingService**: Programmatic seeding
- **ReferentialTemplateService**: Export/import templates

## Controller Classes

- **ReferentialController**: Public API for standard operations
- **WorkflowAdminController**: Admin API with versioning and templates

## Example Workflows

### New Organization Onboarding

```java
// 1. Seed default referentials
seedingService.seedDefaultReferentialsForOrg("NEW-ORG-123");

// 2. Or import from template
ReferentialTemplateDto template = loadTemplate();
templateService.importTemplate(template, false);
```

### Customizing Referentials

```java
// 1. Add custom referential
ReferentialRequest request = new ReferentialRequest();
request.setCategory("LEAD_SOURCE");
request.setCode("CUSTOM_PORTAL");
request.setLabel("Custom Portal");
referentialService.create(ReferentialMapper.toEntity(request));

// 2. Update existing
ReferentialUpdateRequest updateRequest = new ReferentialUpdateRequest();
updateRequest.setLabel("Updated Label");
updateRequest.setChangeReason("Business requirements changed");
referentialService.update(id, entity, updateRequest.getChangeReason());
```

### Audit & Compliance

```java
// Get complete history for category
List<ReferentialVersionEntity> history = 
    referentialService.getCategoryVersionHistory("CASE_STATUS");

// Export current state for backup
ReferentialTemplateDto backup = templateService.exportAllCategories();
```
