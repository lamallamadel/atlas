# Referential-Based Status System for Dossiers

## Overview

The Dossier entity has been extended to support a flexible, referential-based status system that replaces hardcoded enums with configurable status codes. This allows organizations to define custom case types and statuses tailored to their specific workflows.

## Key Features

### 1. Case Type Field (`caseType`)
- **Type**: String (100 characters max)
- **References**: `CASE_TYPE` category in the `referential` table
- **Purpose**: Defines the type of case/dossier (e.g., "CRM_LEAD_BUY", "CRM_LEAD_RENT", "CRM_SALE_TRANSACTION")
- **Optional**: Can be null for generic dossiers without workflow constraints

### 2. Status Code Field (`statusCode`)
- **Type**: String (100 characters max)
- **References**: `CASE_STATUS` category in the `referential` table
- **Purpose**: Flexible status code that can be customized per organization
- **Backward Compatible**: Automatically derives from `DossierStatus` enum if not provided

## Validation Rules

### Status Code Validation
1. **Existence Check**: Status code must exist in `CASE_STATUS` referential
2. **Active Check**: Status code must be active (`is_active = true`)
3. **Case Type Compatibility**: When `caseType` is set, status code must be allowed for that case type based on workflow definitions

### Case Type Validation
1. **Existence Check**: Case type must exist in `CASE_TYPE` referential
2. **Active Check**: Case type must be active (`is_active = true`)

### Workflow-Based Validation
When a dossier has a `caseType`:
- The `statusCode` must be part of the allowed transitions in the `workflow_definition` table
- If no workflow is defined for the case type, all active status codes are allowed
- Workflow validation is enforced by `WorkflowValidationService`

## Backward Compatibility

### Enum Status Field Preserved
- The original `status` field (enum `DossierStatus`) is still present
- Used for backward compatibility with existing API consumers
- Automatically synced with `statusCode` through mapping layer

### Automatic Migration
- V28 migration populates `statusCode` from existing `status` enum values
- Legacy status codes (NEW, QUALIFYING, QUALIFIED, APPOINTMENT, WON, LOST, DRAFT) are seeded in referentials

### API Compatibility
- Existing endpoints continue to work with `DossierStatus` enum
- New `statusCode` field is optional in requests
- Responses include both `status` (enum) and `statusCode` (string)

## Database Schema

### Dossier Table
```sql
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS case_type VARCHAR(100);
ALTER TABLE dossier ADD COLUMN IF NOT EXISTS status_code VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_dossier_case_type ON dossier(case_type);
CREATE INDEX IF NOT EXISTS idx_dossier_status_code ON dossier(status_code);
CREATE INDEX IF NOT EXISTS idx_dossier_case_type_status_code ON dossier(case_type, status_code);
```

### Referential Seeding
Default referentials include:
- **Case Types**: CRM_LEAD_BUY, CRM_LEAD_RENT, CRM_OWNER_LEAD, CRM_SALE_TRANSACTION, CRM_RENTAL_TRANSACTION
- **Case Statuses**: CRM_NEW, CRM_QUALIFIED, CRM_VISIT_PLANNED, CRM_CLOSED_WON, CRM_CLOSED_LOST, etc.
- **Legacy Statuses**: NEW, QUALIFYING, QUALIFIED, APPOINTMENT, WON, LOST, DRAFT

## Service Layer

### DossierStatusCodeValidationService
New service for validating status codes and case types:

```java
public class DossierStatusCodeValidationService {
    // Validates that case type exists and is active
    void validateCaseType(String caseType);
    
    // Validates that status code exists, is active, and is allowed for the case type
    void validateStatusCodeForCaseType(String caseType, String statusCode);
    
    // Derives status code from enum for backward compatibility
    String deriveStatusCodeFromEnumStatus(DossierStatus status);
    
    // Gets all allowed status codes for a case type
    List<String> getAllowedStatusCodesForCaseType(String caseType);
}
```

### Integration with DossierService
- Validation is called on dossier creation
- Validation is called on status updates
- Automatic status code derivation when not provided

## API Endpoints

### Get Allowed Status Codes
```
GET /api/v1/dossiers/allowed-status-codes?caseType=CRM_LEAD_BUY
```

**Response**:
```json
[
  "CRM_NEW",
  "CRM_QUALIFIED",
  "CRM_VISIT_PLANNED",
  "CRM_CLOSED_WON",
  "CRM_CLOSED_LOST"
]
```

### Create Dossier with Status Code
```
POST /api/v1/dossiers
```

**Request**:
```json
{
  "caseType": "CRM_LEAD_BUY",
  "statusCode": "CRM_NEW",
  "leadName": "John Doe",
  "leadPhone": "+33612345678",
  "source": "WEB"
}
```

### Update Dossier Status
```
PATCH /api/v1/dossiers/{id}/status
```

**Request**:
```json
{
  "status": "QUALIFIED",
  "statusCode": "CRM_QUALIFIED",
  "userId": "user123",
  "reason": "Client qualified after call"
}
```

## Migration Guide

### For Existing API Consumers

**No Changes Required** - The API remains backward compatible:
- Continue using `DossierStatus` enum in requests
- Both `status` (enum) and `statusCode` (string) are returned in responses
- Status code is automatically derived if not provided

### For New Implementations

**Recommended Approach**:
1. Set `caseType` when creating dossiers to leverage workflow validation
2. Explicitly set `statusCode` for granular status control
3. Use `GET /allowed-status-codes` to fetch valid status codes for UI dropdowns
4. Configure workflow definitions to enforce allowed transitions

### Example: Migrating to Referential Statuses

**Before (Enum-based)**:
```java
DossierCreateRequest request = new DossierCreateRequest();
request.setLeadName("John Doe");
// status defaults to NEW
```

**After (Referential-based)**:
```java
DossierCreateRequest request = new DossierCreateRequest();
request.setLeadName("John Doe");
request.setCaseType("CRM_LEAD_BUY");
request.setStatusCode("CRM_NEW");
// Validation ensures CRM_NEW is valid for CRM_LEAD_BUY
```

## Error Handling

### Invalid Status Code
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid statusCode: 'INVALID_CODE'. Status code does not exist in CASE_STATUS referential.",
  "instance": "/api/v1/dossiers"
}
```

### Invalid Case Type
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid caseType: 'INVALID_TYPE'. Case type does not exist in CASE_TYPE referential.",
  "instance": "/api/v1/dossiers"
}
```

### Status Code Not Allowed for Case Type
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Invalid statusCode: 'CRM_SIGNING_SCHEDULED' for caseType: 'CRM_LEAD_BUY'. Allowed status codes for this case type are: CRM_NEW, CRM_QUALIFIED, CRM_VISIT_PLANNED",
  "instance": "/api/v1/dossiers"
}
```

## Best Practices

1. **Always Set Case Type**: When creating workflow-driven dossiers, always set `caseType` to enable validation
2. **Validate Before Submit**: Use `GET /allowed-status-codes` to populate UI dropdowns with valid options
3. **Explicit Status Codes**: For clarity, always provide `statusCode` explicitly rather than relying on derivation
4. **Configure Workflows**: Define workflow transitions for each case type to enforce business rules
5. **Active Status Codes Only**: Deactivate unused status codes rather than deleting them for historical data integrity

## Database Migration Notes

### V28 Migration
- Populates `statusCode` from existing `status` enum values
- Creates indexes for performance optimization
- Adds column comments for documentation
- Safe to run on existing data (uses COALESCE to preserve existing values)

### Performance Impact
- New indexes improve query performance for filtering by case type and status code
- Minimal overhead for validation queries (referential lookups are fast)
- Workflow validation only runs when case type is set

## Future Enhancements

1. **Multi-language Labels**: Support for localized status labels in UI
2. **Status Icons**: Configurable icons/colors per status code
3. **Transition History**: Track status code transitions separately from enum transitions
4. **Bulk Status Updates**: API for bulk status code updates with validation
5. **Status Code Templates**: Predefined status code sets for common industries
