# Implementation Summary: Referential-Based Status System

## Overview
Extended the Dossier entity and services to support flexible, referential-based case types and status codes, replacing hardcoded enums while maintaining full backward compatibility.

## Changes Implemented

### 1. Database Layer

#### Migration V28
**File**: `backend/src/main/resources/db/migration/V29__Migrate_dossier_status_to_referential.sql`

- Populates `statusCode` from existing `status` enum values for all dossiers
- Creates performance indexes:
  - `idx_dossier_status_code` on `status_code`
  - `idx_dossier_case_type_status_code` on `(case_type, status_code)`
- Adds column documentation comments
- Safe to run on existing data (uses COALESCE)

### 2. Entity Layer

#### Dossier Entity
**File**: `backend/src/main/java/com/example/backend/entity/Dossier.java`

Fields already present (from V16 migration):
- `caseType`: String field referencing CASE_TYPE referential
- `statusCode`: String field referencing CASE_STATUS referential
- `lossReason`: String field for loss reason codes
- `wonReason`: String field for won reason codes

The `status` enum field remains for backward compatibility.

### 3. Service Layer

#### New Service: DossierStatusCodeValidationService
**File**: `backend/src/main/java/com/example/backend/service/DossierStatusCodeValidationService.java`

**Responsibilities**:
- Validates case type exists and is active in referential
- Validates status code exists and is active in referential
- Validates status code is allowed for the case type based on workflow definitions
- Derives status code from enum status for backward compatibility
- Provides list of allowed status codes for a given case type

**Key Methods**:
```java
void validateCaseType(String caseType)
void validateStatusCodeForCaseType(String caseType, String statusCode)
String deriveStatusCodeFromEnumStatus(DossierStatus status)
List<String> getAllowedStatusCodesForCaseType(String caseType)
```

#### Updated Service: DossierService
**File**: `backend/src/main/java/com/example/backend/service/DossierService.java`

**Changes**:
- Added dependency on `DossierStatusCodeValidationService`
- Validates case type and status code on dossier creation
- Validates status code on status updates
- Automatically derives status code from enum if not provided
- Maintains backward compatibility with enum-based status

### 4. Controller Layer

#### DossierController (V1)
**File**: `backend/src/main/java/com/example/backend/controller/DossierController.java`

**New Endpoint**:
```
GET /api/v1/dossiers/allowed-status-codes?caseType={caseType}
```
Returns list of valid status codes for the specified case type.

#### DossierControllerV2
**File**: `backend/src/main/java/com/example/backend/controller/v2/DossierControllerV2.java`

**New Endpoint**:
```
GET /api/v2/dossiers/allowed-status-codes?caseType={caseType}
```
Returns list of valid status codes for the specified case type.

### 5. DTO Layer

#### DossierCreateRequest
**File**: `backend/src/main/java/com/example/backend/dto/DossierCreateRequest.java`

Fields already present:
- `caseType`: Optional case type code
- `statusCode`: Optional status code
- `lossReason`: Optional loss reason code
- `wonReason`: Optional won reason code

#### DossierResponse
**File**: `backend/src/main/java/com/example/backend/dto/DossierResponse.java`

Fields already present:
- `caseType`: Case type code
- `statusCode`: Status code (with fallback to enum)
- `lossReason`: Loss reason code
- `wonReason`: Won reason code

#### DossierResponseV2
**File**: `backend/src/main/java/com/example/backend/dto/v2/DossierResponseV2.java`

Fields already present:
- `caseType`: Case type code
- `statusCode`: Status code (with fallback to enum)
- `lossReason`: Loss reason code
- `wonReason`: Won reason code

#### DossierStatusPatchRequest
**File**: `backend/src/main/java/com/example/backend/dto/DossierStatusPatchRequest.java`

Fields already present:
- `statusCode`: Optional new status code
- `lossReason`: Optional loss reason code
- `wonReason`: Optional won reason code

#### New DTO: AllowedStatusCodesResponse
**File**: `backend/src/main/java/com/example/backend/dto/AllowedStatusCodesResponse.java`

Response for allowed status codes endpoint:
```json
{
  "caseType": "CRM_LEAD_BUY",
  "allowedStatusCodes": ["CRM_NEW", "CRM_QUALIFIED", "CRM_CLOSED_WON"]
}
```

### 6. Mapper Layer

#### DossierMapper
**File**: `backend/src/main/java/com/example/backend/dto/DossierMapper.java`

**Changes**:
- Maps `caseType` and `statusCode` from request to entity
- Defaults `statusCode` to enum status name if not provided
- In `toResponse()`: Falls back to enum status name if `statusCode` is null

#### DossierMapperV2
**File**: `backend/src/main/java/com/example/backend/dto/v2/DossierMapperV2.java`

**Changes**:
- In `toResponse()`: Falls back to enum status name if `statusCode` is null

### 7. Documentation

#### Referential Status System Guide
**File**: `backend/docs/REFERENTIAL_STATUS_SYSTEM.md`

Comprehensive documentation covering:
- System overview and key features
- Validation rules
- Backward compatibility strategy
- Database schema
- Service layer architecture
- API endpoints and usage examples
- Migration guide
- Error handling
- Best practices

## Validation Flow

### On Dossier Creation:
1. Validate `caseType` exists and is active (if provided)
2. Validate `statusCode` exists and is active (if provided)
3. If both `caseType` and `statusCode` are provided:
   - Check if `statusCode` is allowed for the `caseType` based on workflow definitions
   - If no workflow exists for the case type, allow all active status codes

### On Status Update:
1. Validate new status using existing `DossierStatusTransitionService` (enum-based)
2. If `statusCode` is provided:
   - Validate it exists and is active
   - Validate it's allowed for the dossier's `caseType`
3. If `statusCode` is not provided:
   - Automatically derive from the enum status

### Workflow Integration:
When a dossier has a `caseType`, `WorkflowValidationService` enforces:
- Custom transition rules per case type
- Role-based authorization
- Pre-conditions (e.g., completed appointments)
- Required fields per transition

## Backward Compatibility

### Preserved Functionality:
- Original `status` enum field remains and functions as before
- All existing API endpoints work without changes
- Status enum validation still enforced by `DossierStatusTransitionService`

### New Capabilities:
- Optional `caseType` field enables workflow-driven validation
- Optional `statusCode` field enables flexible status management
- Automatic fallback to enum status when `statusCode` is not provided
- New endpoint to query allowed status codes

### Migration Path:
1. **Existing API Consumers**: No changes required - continue using enum statuses
2. **New Implementations**: Can use `caseType` and `statusCode` for enhanced validation
3. **Gradual Migration**: Can mix enum-based and referential-based approaches

## Testing Considerations

### Unit Tests Required:
- `DossierStatusCodeValidationService` validation logic
- Status code derivation from enum
- Allowed status codes retrieval

### Integration Tests Required:
- Dossier creation with valid/invalid case types
- Dossier creation with valid/invalid status codes
- Status updates with valid/invalid combinations
- Workflow validation with case types
- Backward compatibility (enum-only requests)

### E2E Tests Required:
- Full workflow: create dossier → update status → validate transitions
- Error scenarios: invalid case type, invalid status code, disallowed combination
- Backward compatibility: existing tests should pass without modification

## Performance Impact

### Positive:
- New indexes improve filtering by case type and status code
- Validation queries are fast (referential lookups)
- No impact on existing enum-based operations

### Negligible:
- Additional validation queries on create/update
- Workflow validation only runs when `caseType` is set
- Backward compatibility logic is lightweight

## Rollback Strategy

If issues arise, the changes can be rolled back:
1. Revert code changes to services and controllers
2. Keep database migration (safe to keep new columns and indexes)
3. System continues to function with enum-based status only
4. Data in `statusCode` field is preserved for future use

## Future Enhancements

1. **Status Code Translation**: Multi-language support for status labels
2. **Visual Customization**: Icons and colors per status code
3. **Audit Trail**: Separate tracking for status code vs enum transitions
4. **Bulk Operations**: Batch status code updates with validation
5. **Templates**: Predefined status sets for different industries
6. **UI Components**: React components for status code selectors
7. **Analytics**: Reports based on custom status codes
8. **Webhooks**: Notifications on status code transitions

## Security Considerations

- Validation enforces referential integrity
- Workflow validation prevents unauthorized transitions
- Role-based authorization respected
- Tenant isolation maintained through orgId filtering
- No direct SQL injection risk (parameterized queries)

## Deployment Notes

### Prerequisites:
- Ensure default referentials are seeded (V15 and V27 migrations)
- Verify workflow definitions are configured (if using case types)

### Deployment Steps:
1. Deploy code changes
2. Run V28 migration (populates status codes)
3. Verify migration success
4. Test backward compatibility
5. Gradually adopt referential-based approach

### Monitoring:
- Monitor validation errors in logs
- Track usage of new endpoints
- Measure performance of status code queries
- Validate data consistency (status vs statusCode)

## Conclusion

This implementation provides a robust, flexible status system while maintaining complete backward compatibility. Organizations can adopt the new referential-based approach at their own pace, enabling custom workflows without breaking existing integrations.
