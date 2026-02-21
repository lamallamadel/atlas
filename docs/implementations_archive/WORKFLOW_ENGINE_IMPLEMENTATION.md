# Workflow Engine Implementation

## Overview

The workflow engine provides a configurable system for managing status transitions in dossiers based on case types. It allows tenants to define their own workflow rules, validation conditions, and required fields for status transitions.

## Features

### 1. Workflow Definitions
- Define allowed status transitions per case type per tenant
- Configure transition rules with JSON-based conditions
- Specify required fields that must be present for a transition
- Enable/disable transitions dynamically

### 2. Workflow Validation
- Automatically validates transitions against configured workflows
- Checks required fields before allowing transitions
- Evaluates custom conditions (equals, greaterThan, isNull, etc.)
- Records all transition attempts (successful and failed)

### 3. Transition History
- Complete audit trail of all workflow transitions
- Track validation errors for failed transitions
- User attribution and reason tracking
- Queryable history per dossier

## Database Schema

### workflow_definition
- `id`: Primary key
- `org_id`: Tenant identifier
- `case_type`: Case type code (e.g., "CRM_LEAD_BUY")
- `from_status`: Source status
- `to_status`: Target status
- `is_active`: Enable/disable flag
- `conditions_json`: JSON object with validation conditions
- `required_fields_json`: JSON object with required fields
- Standard audit fields (created_at, updated_at, created_by, updated_by)

### workflow_transition
- `id`: Primary key
- `org_id`: Tenant identifier
- `dossier_id`: Related dossier
- `case_type`: Case type at time of transition
- `from_status`: Source status
- `to_status`: Target status
- `is_allowed`: Whether transition was allowed
- `validation_errors_json`: JSON with validation errors if not allowed
- `user_id`: User who triggered transition
- `reason`: Optional reason text
- `transitioned_at`: Timestamp of transition attempt
- Standard audit fields

## API Endpoints

### Workflow Definitions (Admin Only)

#### Create Workflow Definition
```
POST /api/v1/workflow/definitions
Authorization: Bearer {token} (ROLE_ADMIN required)
X-Org-Id: {tenant-id}

Request Body:
{
  "caseType": "CRM_LEAD_BUY",
  "fromStatus": "NEW",
  "toStatus": "QUALIFIED",
  "isActive": true,
  "conditionsJson": {
    "scoreCheck": {
      "field": "score",
      "operator": "greaterThanOrEqual",
      "value": 50
    }
  },
  "requiredFieldsJson": {
    "leadName": true,
    "leadPhone": true
  }
}

Response: 201 Created
{
  "id": 1,
  "orgId": "tenant-123",
  "caseType": "CRM_LEAD_BUY",
  "fromStatus": "NEW",
  "toStatus": "QUALIFIED",
  "isActive": true,
  "conditionsJson": {...},
  "requiredFieldsJson": {...},
  "createdAt": "2024-01-15T10:00:00",
  "updatedAt": "2024-01-15T10:00:00"
}
```

#### List Workflow Definitions
```
GET /api/v1/workflow/definitions?caseType=CRM_LEAD_BUY&isActive=true&page=0&size=20
Authorization: Bearer {token} (ROLE_ADMIN or ROLE_PRO)
X-Org-Id: {tenant-id}

Response: 200 OK
{
  "content": [...],
  "totalElements": 10,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

#### Get Workflow Definition
```
GET /api/v1/workflow/definitions/{id}
Authorization: Bearer {token} (ROLE_ADMIN or ROLE_PRO)
X-Org-Id: {tenant-id}

Response: 200 OK
{workflow definition object}
```

#### Update Workflow Definition
```
PUT /api/v1/workflow/definitions/{id}
Authorization: Bearer {token} (ROLE_ADMIN required)
X-Org-Id: {tenant-id}

Request Body: {same as create}
Response: 200 OK
```

#### Delete Workflow Definition
```
DELETE /api/v1/workflow/definitions/{id}
Authorization: Bearer {token} (ROLE_ADMIN required)
X-Org-Id: {tenant-id}

Response: 204 No Content
```

#### Get Transitions for Case Type
```
GET /api/v1/workflow/definitions/case-type/{caseType}
Authorization: Bearer {token} (ROLE_ADMIN or ROLE_PRO)
X-Org-Id: {tenant-id}

Response: 200 OK
[
  {workflow definition 1},
  {workflow definition 2},
  ...
]
```

### Workflow Transitions

#### Get Transition History
```
GET /api/v1/workflow/transitions/dossier/{dossierId}?page=0&size=20
Authorization: Bearer {token} (ROLE_ADMIN or ROLE_PRO)
X-Org-Id: {tenant-id}

Response: 200 OK
{
  "content": [
    {
      "id": 1,
      "dossierId": 123,
      "caseType": "CRM_LEAD_BUY",
      "fromStatus": "NEW",
      "toStatus": "QUALIFIED",
      "isAllowed": true,
      "userId": "user-456",
      "reason": "Customer qualified",
      "transitionedAt": "2024-01-15T10:00:00"
    }
  ],
  "totalElements": 5,
  "totalPages": 1
}
```

#### Get Allowed Next Statuses
```
GET /api/v1/workflow/allowed-transitions?caseType=CRM_LEAD_BUY&currentStatus=NEW
Authorization: Bearer {token} (ROLE_ADMIN or ROLE_PRO)
X-Org-Id: {tenant-id}

Response: 200 OK
[
  "QUALIFYING",
  "QUALIFIED",
  "LOST"
]
```

## Integration with Dossier Status Updates

When updating a dossier status via:
```
PATCH /api/v1/dossiers/{id}/status
```

If the dossier has a `caseType` configured, the workflow engine automatically:
1. Validates the transition against workflow definitions
2. Checks required fields
3. Evaluates conditions
4. Records the transition attempt
5. Throws `WorkflowValidationException` if validation fails

Example error response for failed validation:
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Workflow validation failed for transition from NEW to QUALIFIED",
  "instance": "/api/v1/dossiers/123/status",
  "properties": {
    "validationErrors": {
      "missingRequiredFields": ["leadPhone"],
      "failedConditions": ["scoreCheck: score greaterThanOrEqual 50"]
    }
  }
}
```

## Conditions Configuration

The `conditionsJson` field supports various operators:

### Comparison Operators
- `equals`: Field value equals expected value
- `notEquals`: Field value does not equal expected value
- `greaterThan`: Field value is greater than expected value
- `lessThan`: Field value is less than expected value
- `greaterThanOrEqual`: Field value is >= expected value
- `lessThanOrEqual`: Field value is <= expected value

### Existence Operators
- `isNull`: Field value is null
- `isNotNull`: Field value is not null
- `isEmpty`: Field value is null or empty string
- `isNotEmpty`: Field value is not null and not empty string

### Example Conditions
```json
{
  "conditionsJson": {
    "minimumScore": {
      "field": "score",
      "operator": "greaterThanOrEqual",
      "value": 50
    },
    "hasAnnonce": {
      "field": "annonceId",
      "operator": "isNotNull"
    },
    "notesRequired": {
      "field": "notes",
      "operator": "isNotEmpty"
    }
  }
}
```

## Supported Fields for Validation

The following dossier fields can be used in conditions and required fields:
- `leadName`
- `leadPhone`
- `leadSource`
- `notes`
- `score`
- `annonceId`
- `statusCode`
- `lossReason`
- `wonReason`
- `caseType`

## Default Workflows

The system seeds three default workflows for common case types:
- `CRM_LEAD_BUY`: Buy lead workflow
- `CRM_LEAD_SELL`: Sell lead workflow
- `CRM_LEAD_RENT`: Rent lead workflow

All follow the same transition pattern:
```
NEW → QUALIFYING → QUALIFIED → APPOINTMENT → WON
  ↓      ↓           ↓            ↓
LOST   LOST        LOST         LOST
```

These default workflows use `org_id = 'default'` and can be copied/modified per tenant.

## Usage Examples

### 1. Create a Custom Workflow with Validation

```bash
curl -X POST http://localhost:8080/api/v1/workflow/definitions \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: tenant-123" \
  -H "Content-Type: application/json" \
  -d '{
    "caseType": "CRM_LEAD_BUY",
    "fromStatus": "QUALIFIED",
    "toStatus": "APPOINTMENT",
    "isActive": true,
    "requiredFieldsJson": {
      "leadPhone": true,
      "annonceId": true
    },
    "conditionsJson": {
      "minimumScore": {
        "field": "score",
        "operator": "greaterThanOrEqual",
        "value": 60
      }
    }
  }'
```

### 2. Update Dossier Status with Workflow Validation

```bash
# This will trigger workflow validation
curl -X PATCH http://localhost:8080/api/v1/dossiers/123/status \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: tenant-123" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "QUALIFIED",
    "userId": "user-456",
    "reason": "Customer meets qualification criteria"
  }'
```

### 3. View Transition History

```bash
curl -X GET http://localhost:8080/api/v1/workflow/transitions/dossier/123 \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: tenant-123"
```

### 4. Check Allowed Transitions

```bash
curl -X GET "http://localhost:8080/api/v1/workflow/allowed-transitions?caseType=CRM_LEAD_BUY&currentStatus=NEW" \
  -H "Authorization: Bearer {token}" \
  -H "X-Org-Id: tenant-123"
```

## Security

- All workflow definition management endpoints require `ROLE_ADMIN`
- Workflow definition queries and transition history require `ROLE_ADMIN` or `ROLE_PRO`
- All endpoints respect multi-tenant isolation via `X-Org-Id` header
- Workflow validation is applied automatically when updating dossier status

## Migration

The workflow engine is added via two Flyway migrations:
- `V16__Add_workflow_engine.sql`: Creates tables and adds dossier columns
- `V17__Seed_default_workflows.sql`: Seeds default workflow definitions

Both migrations are backward compatible and will not affect existing data.
