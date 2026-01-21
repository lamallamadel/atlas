# Referential Data Seeding System - Implementation Summary

## Overview

A comprehensive referential data management system has been implemented with the following features:
- Migration scripts for database schema and default data seeding
- Versioning system for audit trail
- Admin UI endpoints in workflow-admin module
- CRUD operations with tenant isolation
- Import/export capability for referential templates

## Implementation Components

### 1. Database Layer

#### Entities
- **ReferentialEntity** (`backend/src/main/java/com/example/backend/entity/ReferentialEntity.java`)
  - Extended with `version` and `lastChangeType` fields for tracking
  - Supports all 5 categories: CASE_TYPE, CASE_STATUS, LEAD_SOURCE, LOSS_REASON, WON_REASON
  
- **ReferentialVersionEntity** (`backend/src/main/java/com/example/backend/entity/ReferentialVersionEntity.java`)
  - New entity for audit trail
  - Stores complete snapshot of each change
  - Includes change_type enum (CREATED, UPDATED, DELETED, ACTIVATED, DEACTIVATED)
  - Optional change_reason field for documentation

#### Repositories
- **ReferentialRepository** (existing, unchanged)
- **ReferentialVersionRepository** (`backend/src/main/java/com/example/backend/repository/ReferentialVersionRepository.java`)
  - Queries for version history by referential ID
  - Queries for category-wide version history

#### Migrations

**Standard Migrations (H2 & PostgreSQL compatible):**
- `V26__Add_referential_versioning.sql` - Creates referential_version table and adds version tracking columns
- `V27__Seed_default_referentials_per_org.sql` - Seeds default referentials for DEMO-ORG

**PostgreSQL-Specific Migrations:**
- `V103__Add_referential_versioning.sql` - PostgreSQL version with conditional DDL
- `V104__Seed_default_referentials_per_org.sql` - PostgreSQL version for DEMO-ORG seeding

### 2. Service Layer

#### ReferentialService (Enhanced)
**File:** `backend/src/main/java/com/example/backend/service/ReferentialService.java`

**Enhancements:**
- Automatic version tracking on create, update, delete
- Optional change reason parameter
- Version history retrieval methods
- Automatic creation of version snapshots

**Key Methods:**
- `create()` - Creates referential with version 1
- `update(id, entity, changeReason)` - Updates with version increment and history
- `delete(id, changeReason)` - Deletes with history preservation
- `getVersionHistory(referentialId)` - Gets all versions for a referential
- `getCategoryVersionHistory(category)` - Gets all versions for a category

#### ReferentialSeedingService (New)
**File:** `backend/src/main/java/com/example/backend/service/ReferentialSeedingService.java`

**Purpose:** Programmatic seeding of default referentials per organization

**Features:**
- Seeds all 5 categories with default values
- Idempotent (checks for existing data)
- Parameterized by organization ID
- Includes all standard values for real estate CRM

**Categories Seeded:**
- CASE_TYPE (5 types)
- CASE_STATUS (17 statuses)
- LEAD_SOURCE (13 sources)
- LOSS_REASON (12 reasons)
- WON_REASON (7 reasons)

#### ReferentialTemplateService (New)
**File:** `backend/src/main/java/com/example/backend/service/ReferentialTemplateService.java`

**Purpose:** Import/export functionality for referential templates

**Features:**
- Export specific categories or all categories
- Import with overwrite option
- JSON template format
- Tenant-aware operations

**Key Methods:**
- `exportTemplate(categories)` - Exports selected categories as JSON template
- `exportAllCategories()` - Exports all 5 categories
- `importTemplate(template, overwrite)` - Imports template with optional overwrite

### 3. Controller Layer

#### WorkflowAdminController (New)
**File:** `backend/src/main/java/com/example/backend/controller/WorkflowAdminController.java`

**Base Path:** `/api/workflow-admin/referentials`

**Endpoints:**

**CRUD Operations:**
- `GET /?category={category}&activeOnly={boolean}` - List referentials by category
- `GET /{id}` - Get single referential with version info
- `POST /` - Create new referential
- `PUT /{id}` - Update with version tracking and change reason
- `DELETE /{id}?reason={reason}` - Delete with audit reason

**Version History:**
- `GET /{id}/versions` - Get version history for specific referential
- `GET /categories/{category}/versions` - Get all versions for category

**Seeding & Templates:**
- `POST /seed` - Seed default referentials for current organization
- `GET /export?categories={list}` - Export referentials as JSON template
- `POST /import?overwrite={boolean}` - Import from JSON template
- `GET /categories` - List available categories

**Features:**
- Audit logging via @Auditable annotation
- Tenant-aware (uses TenantContext)
- OpenAPI/Swagger documentation
- Validation on all inputs

#### ReferentialController (Updated)
**File:** `backend/src/main/java/com/example/backend/controller/ReferentialController.java`

**Status:** Unchanged, continues to provide standard CRUD operations

### 4. DTO Layer

#### New DTOs

**ReferentialVersionResponse**
**File:** `backend/src/main/java/com/example/backend/dto/ReferentialVersionResponse.java`
- Response for version history
- Includes change type and reason
- Full snapshot of referential state

**ReferentialUpdateRequest**
**File:** `backend/src/main/java/com/example/backend/dto/ReferentialUpdateRequest.java`
- Update request with optional changeReason field
- Used for version tracking

**ReferentialTemplateDto**
**File:** `backend/src/main/java/com/example/backend/dto/ReferentialTemplateDto.java`
- Template container for import/export
- Contains metadata (name, description, version)
- Nested ReferentialTemplateItem class for items

#### Updated DTOs

**ReferentialResponse**
**File:** `backend/src/main/java/com/example/backend/dto/ReferentialResponse.java`
- Added `version` field
- Added `lastChangeType` field

**ReferentialMapper**
**File:** `backend/src/main/java/com/example/backend/dto/ReferentialMapper.java`
- Updated to map version fields

### 5. Documentation

#### README
**File:** `backend/src/main/resources/db/migration/README_REFERENTIAL_SYSTEM.md`

Comprehensive documentation covering:
- Database schema
- API endpoints
- Seeding strategies
- Categories and their values
- Versioning system
- Tenant isolation
- Best practices
- Example workflows

#### Sample Template
**File:** `backend/src/main/resources/templates/referential-default-template.json`

JSON template with sample referentials for:
- CASE_TYPE (5 items)
- CASE_STATUS (7 key statuses)
- LEAD_SOURCE (5 sources)
- LOSS_REASON (4 reasons)
- WON_REASON (4 reasons)

## Key Features

### 1. Tenant Isolation
- All referentials scoped by org_id
- Unique constraint: (org_id, category, code)
- Hibernate filter automatically applies tenant context
- Complete data isolation between organizations

### 2. Versioning & Audit Trail
- Every change creates a version record
- Tracks what changed, when, who, and why
- Change types: CREATED, UPDATED, DELETED, ACTIVATED, DEACTIVATED
- Optional change reason for compliance
- Full snapshot of state at each version

### 3. System Item Protection
- System items marked with is_system=true
- Cannot be deleted via API
- Prevents accidental removal of required values
- Custom items fully editable

### 4. Import/Export Templates
- JSON-based template format
- Export from any organization
- Import to target organization
- Overwrite option for updates
- Useful for multi-tenant onboarding

### 5. Seeding Strategies

**Migration-Based:**
- V27 seeds DEMO-ORG
- V104 (PostgreSQL) can seed dynamically
- Good for initial setup

**Programmatic:**
- ReferentialSeedingService.seedDefaultReferentialsForOrg()
- Called from application code
- Useful for runtime setup

**Template-Based:**
- Export/import via API
- Good for tenant replication
- Supports customization

## Categories and Default Values

### CASE_TYPE (5 types)
- CRM_LEAD_BUY - Prospect Achat
- CRM_LEAD_RENT - Prospect Location
- CRM_OWNER_LEAD - Prospect Propriétaire
- CRM_SALE_TRANSACTION - Transaction Vente
- CRM_RENTAL_TRANSACTION - Transaction Location

### CASE_STATUS (17 statuses)
- CRM_NEW - Nouveau
- CRM_TRIAGED - Trié
- CRM_CONTACTED - Contacté
- CRM_UNREACHABLE - Injoignable
- CRM_QUALIFIED - Qualifié
- CRM_DISQUALIFIED - Disqualifié
- CRM_ON_HOLD - En attente
- CRM_VISIT_PLANNED - Visite planifiée
- CRM_VISIT_DONE - Visite effectuée
- CRM_NO_SHOW - Absent
- CRM_FOLLOW_UP - Relance
- CRM_OFFER_REQUESTED - Offre demandée
- CRM_OFFER_RECEIVED - Offre reçue
- CRM_NEGOTIATION - Négociation
- CRM_SIGNING_SCHEDULED - Signature planifiée
- CRM_CLOSED_WON - Gagné
- CRM_CLOSED_LOST - Perdu

### LEAD_SOURCE (13 sources)
- WHATSAPP - WhatsApp
- PHONE_CALL - Appel téléphonique
- SMS - SMS
- EMAIL - Email
- FACEBOOK - Facebook
- INSTAGRAM - Instagram
- AVITO - Avito
- MUBAWAB - Mubawab
- WEBSITE - Site web
- WALK_IN - Visite directe
- REFERRAL - Recommandation
- PARTNER - Partenaire
- OTHER - Autre

### LOSS_REASON (12 reasons)
- PRICE_TOO_HIGH - Prix trop élevé
- NOT_INTERESTED - Pas intéressé
- COMPETITOR - Concurrence
- NO_RESPONSE - Sans réponse
- FINANCING_ISSUE - Problème de financement
- DOCS_INCOMPLETE - Documents incomplets
- OWNER_CHANGED_MIND - Propriétaire a changé d'avis
- PROPERTY_UNAVAILABLE - Bien indisponible
- REQUIREMENTS_MISMATCH - Besoin non correspondant
- TIMELINE_TOO_LONG - Délai trop long
- FRAUD_RISK - Risque de fraude
- OTHER - Autre

### WON_REASON (7 reasons)
- SIGNED - Signé
- RESERVED - Réservé
- DEPOSIT_PAID - Acompte versé
- SOLD - Vendu
- RENTED - Loué
- PROJECT_DELIVERED - Projet livré
- OTHER - Autre

## Usage Examples

### Seeding New Organization
```bash
# Via API
curl -X POST \
  -H "X-Organization-ID: NEW-ORG" \
  -H "Authorization: Bearer {token}" \
  http://localhost:8080/api/workflow-admin/referentials/seed
```

### Exporting Template
```bash
curl -H "X-Organization-ID: SOURCE-ORG" \
  -H "Authorization: Bearer {token}" \
  http://localhost:8080/api/workflow-admin/referentials/export \
  > template.json
```

### Importing Template
```bash
curl -X POST \
  -H "X-Organization-ID: TARGET-ORG" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d @template.json \
  "http://localhost:8080/api/workflow-admin/referentials/import?overwrite=false"
```

### Getting Version History
```bash
curl -H "X-Organization-ID: ORG-123" \
  -H "Authorization: Bearer {token}" \
  http://localhost:8080/api/workflow-admin/referentials/123/versions
```

### Updating with Change Reason
```bash
curl -X PUT \
  -H "X-Organization-ID: ORG-123" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Updated Label",
    "description": "Updated description",
    "displayOrder": 1,
    "isActive": true,
    "changeReason": "Business process updated"
  }' \
  http://localhost:8080/api/workflow-admin/referentials/123
```

## Files Created/Modified

### New Files
1. `backend/src/main/java/com/example/backend/entity/ReferentialVersionEntity.java`
2. `backend/src/main/java/com/example/backend/repository/ReferentialVersionRepository.java`
3. `backend/src/main/java/com/example/backend/service/ReferentialSeedingService.java`
4. `backend/src/main/java/com/example/backend/service/ReferentialTemplateService.java`
5. `backend/src/main/java/com/example/backend/controller/WorkflowAdminController.java`
6. `backend/src/main/java/com/example/backend/dto/ReferentialVersionResponse.java`
7. `backend/src/main/java/com/example/backend/dto/ReferentialUpdateRequest.java`
8. `backend/src/main/java/com/example/backend/dto/ReferentialTemplateDto.java`
9. `backend/src/main/resources/db/migration/V26__Add_referential_versioning.sql`
10. `backend/src/main/resources/db/migration/V27__Seed_default_referentials_per_org.sql`
11. `backend/src/main/resources/db/migration-postgres/V103__Add_referential_versioning.sql`
12. `backend/src/main/resources/db/migration-postgres/V104__Seed_default_referentials_per_org.sql`
13. `backend/src/main/resources/db/migration/README_REFERENTIAL_SYSTEM.md`
14. `backend/src/main/resources/templates/referential-default-template.json`

### Modified Files
1. `backend/src/main/java/com/example/backend/entity/ReferentialEntity.java` - Added version and lastChangeType fields
2. `backend/src/main/java/com/example/backend/service/ReferentialService.java` - Added versioning logic
3. `backend/src/main/java/com/example/backend/dto/ReferentialResponse.java` - Added version fields
4. `backend/src/main/java/com/example/backend/dto/ReferentialMapper.java` - Updated mapping

## Testing Considerations

### Unit Tests Needed
- ReferentialService versioning logic
- ReferentialSeedingService seeding logic
- ReferentialTemplateService import/export
- Version history retrieval

### Integration Tests Needed
- WorkflowAdminController endpoints
- Migration scripts (both H2 and PostgreSQL)
- Tenant isolation verification
- Template import/export workflow

### E2E Tests Needed
- Full seeding workflow
- Export from org A, import to org B
- Version history tracking
- System item protection

## Security Considerations

1. **Tenant Isolation**: Strict enforcement via org_id filtering
2. **System Item Protection**: Cannot delete is_system=true items
3. **Audit Trail**: Complete change history with user tracking
4. **Authorization**: All endpoints should require appropriate roles
5. **Input Validation**: Jakarta validation on all DTOs

## Performance Considerations

1. **Indexes**: Added on frequently queried columns
2. **Version Table**: Will grow over time, consider archival strategy
3. **Batch Seeding**: Template import processes items efficiently
4. **Query Optimization**: Version history queries limited by default

## Next Steps (Not Implemented)

1. **UI Components**: Admin UI for visual management
2. **Bulk Operations**: Bulk update/delete capabilities
3. **Version Comparison**: Compare two versions visually
4. **Rollback**: Rollback to previous version
5. **Archival**: Archive old version history
6. **Templates Library**: Predefined templates for different industries
7. **Workflow Integration**: Link referentials to workflow definitions
8. **Validation Rules**: Custom validation per category

## Conclusion

The referential data seeding system is fully implemented with:
- ✅ Database schema with versioning
- ✅ Migration scripts for both H2 and PostgreSQL
- ✅ Seeding service for programmatic setup
- ✅ Admin API with full CRUD operations
- ✅ Version history and audit trail
- ✅ Import/export templates
- ✅ Tenant isolation
- ✅ System item protection
- ✅ Comprehensive documentation

The system is ready for use and provides a solid foundation for managing referential data across multiple tenants with full audit capability.
