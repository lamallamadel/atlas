# Workflow Validation Engine

## Overview

The Workflow Validation Engine provides tenant-scoped, role-based status transition validation for dossiers. It enforces:

1. **Allowed transitions** from WorkflowDefinition table
2. **Required field validation** (e.g., lossReason for terminal states)
3. **Role-based authorization** (e.g., only AGENT role can move to CRM_QUALIFIED)
4. **Pre-condition evaluation** (e.g., appointment required before CRM_VISIT_DONE)
5. **Custom condition validation** using JSON-based rules

## Architecture

### Two-Tier Validation

1. **Basic Validation** (`DossierStatusTransitionService`)
   - Always applied to ALL dossiers
   - Enforces terminal states (WON, LOST cannot transition)
   - Validates basic allowed transitions

2. **Workflow Validation** (`WorkflowValidationService`)
   - Only applied when `dossier.caseType` is set
   - Enforces custom rules per case type
   - Tenant-scoped (org_id filtering)
   - Records all transition attempts for audit

### Bypass Mechanism

When `caseType` is null or blank, workflow validation is skipped, allowing:
- Generic dossiers without workflow constraints
- Legacy data migration
- Flexible transitions with only basic validation

## Validation Types

### 1. Transition Validation

Checks if a transition is allowed in the WorkflowDefinition table.

**Database Schema:**
```sql
CREATE TABLE workflow_definition (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    case_type VARCHAR(100) NOT NULL,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    conditions_json JSONB,
    required_fields_json JSONB
);
```

**Example Error:**
```json
{
  "title": "Workflow Validation Failed",
  "detail": "Invalid workflow transition from NEW to WON for case type SALE",
  "validationErrors": {
    "transition": "Transition from NEW to WON is not allowed for case type SALE",
    "allowedTransitions": ["QUALIFYING", "QUALIFIED", "APPOINTMENT", "LOST"],
    "actionableMessage": "The status transition from 'NEW' to 'WON' is not configured in your workflow. Please configure this transition in the workflow definition or choose from the allowed transitions: QUALIFYING, QUALIFIED, APPOINTMENT, LOST"
  }
}
```

### 2. Required Fields Validation

Validates that required fields are present before allowing a transition.

**Special Built-in Requirements:**
- `lossReason` is **required** for transitions to LOST status
- `wonReason` is **required** for transitions to WON status

**Custom Requirements (via JSON):**
```json
{
  "requiredFieldsJson": {
    "leadName": true,
    "leadPhone": true,
    "score": true
  }
}
```

**Example Error:**
```json
{
  "title": "Workflow Validation Failed",
  "detail": "Workflow validation failed for transition from APPOINTMENT to LOST",
  "validationErrors": {
    "missingRequiredFields": ["lossReason"],
    "requiredFieldsActionableMessages": [
      "Loss reason is required when marking a dossier as LOST. Please provide a reason such as 'Client not interested', 'Budget constraints', 'Competitor chosen', etc."
    ]
  }
}
```

### 3. Role-Based Authorization

Restricts certain transitions to users with specific roles.

**Built-in Role Requirements:**
- Transition to `CRM_QUALIFIED` requires **AGENT** role

**Implementation:**
```java
if ("CRM_QUALIFIED".equalsIgnoreCase(toStatus)) {
    boolean hasAgentRole = authorities.stream()
        .anyMatch(auth -> auth.getAuthority().equalsIgnoreCase("ROLE_AGENT"));
    
    if (!hasAgentRole) {
        // Reject transition
    }
}
```

**Example Error:**
```json
{
  "title": "Workflow Validation Failed",
  "detail": "Workflow validation failed for transition from NEW to CRM_QUALIFIED",
  "validationErrors": {
    "roleAuthorizationError": "Transition to CRM_QUALIFIED requires AGENT role",
    "roleActionableMessage": "Only users with the AGENT role can move dossiers to 'CRM_QUALIFIED' status. Your current roles are: [ROLE_PRO]. Please contact your administrator to request the appropriate role."
  }
}
```

### 4. Pre-Condition Validation

Validates that certain conditions are met before allowing a transition.

**Built-in Pre-conditions:**
- Transition to `CRM_VISIT_DONE` requires at least one **COMPLETED** appointment

**Custom Pre-conditions (via JSON):**
```json
{
  "conditionsJson": {
    "requiresAppointment": true,
    "requiresCompletedAppointment": true
  }
}
```

**Example Error:**
```json
{
  "title": "Workflow Validation Failed",
  "detail": "Workflow validation failed for transition from APPOINTMENT to CRM_VISIT_DONE",
  "validationErrors": {
    "preConditionError": "At least one completed appointment is required",
    "preConditionActionableMessage": "Before moving to 'CRM_VISIT_DONE' status, you must have at least one completed appointment. Please create and mark an appointment as completed, or if an appointment has already occurred, update its status to COMPLETED."
  }
}
```

### 5. Custom Condition Validation

Evaluates custom conditions defined in JSON format.

**Supported Operators:**
- `equals`, `notEquals`
- `greaterThan`, `lessThan`, `greaterThanOrEqual`, `lessThanOrEqual`
- `isNull`, `isNotNull`
- `isEmpty`, `isNotEmpty`

**Example Configuration:**
```json
{
  "conditionsJson": {
    "minimumScore": {
      "field": "score",
      "operator": "greaterThanOrEqual",
      "value": 50
    },
    "hasLeadPhone": {
      "field": "leadPhone",
      "operator": "isNotEmpty"
    }
  }
}
```

**Example Error:**
```json
{
  "title": "Workflow Validation Failed",
  "detail": "Workflow validation failed for transition from QUALIFYING to QUALIFIED",
  "validationErrors": {
    "failedConditions": [
      "minimumScore: score greaterThanOrEqual 50"
    ],
    "conditionsActionableMessages": [
      "Field 'score' must be greater than or equal to '50', but current value is '30'. Please ensure the value meets the minimum requirement."
    ]
  }
}
```

## API Usage

### Check Transition Validity (Before Attempting)

```http
GET /api/v1/workflow/validate-transition/dossier/{dossierId}?fromStatus=NEW&toStatus=QUALIFIED
Authorization: Bearer {token}
X-Org-Id: {orgId}
```

**Response (Valid):**
```json
{
  "isValid": true
}
```

**Response (Invalid):**
```json
{
  "isValid": false,
  "validationErrors": {
    "missingRequiredFields": ["leadPhone", "score"],
    "requiredFieldsActionableMessages": [
      "Field 'leadPhone' is required for this transition. Please provide a valid value.",
      "Field 'score' is required for this transition. Please provide a valid value."
    ]
  }
}
```

### Get Allowed Next Statuses

```http
GET /api/v1/workflow/allowed-transitions?caseType=SALE&currentStatus=NEW
Authorization: Bearer {token}
X-Org-Id: {orgId}
```

**Response:**
```json
["QUALIFYING", "QUALIFIED", "APPOINTMENT", "LOST"]
```

### Perform Status Transition

```http
PATCH /api/v1/dossiers/{id}/status
Authorization: Bearer {token}
X-Org-Id: {orgId}
Content-Type: application/json

{
  "status": "QUALIFIED",
  "reason": "Client passed initial qualification"
}
```

If workflow validation fails, returns 400 Bad Request with detailed errors.

## Configuration Examples

### Example 1: Basic Sale Workflow

```sql
-- NEW -> QUALIFYING (no restrictions)
INSERT INTO workflow_definition (org_id, case_type, from_status, to_status, is_active)
VALUES ('org-001', 'SALE', 'NEW', 'QUALIFYING', true);

-- QUALIFYING -> QUALIFIED (requires minimum score)
INSERT INTO workflow_definition (org_id, case_type, from_status, to_status, is_active, conditions_json)
VALUES ('org-001', 'SALE', 'QUALIFYING', 'QUALIFIED', true, 
  '{"minimumScore": {"field": "score", "operator": "greaterThanOrEqual", "value": 60}}');

-- QUALIFIED -> APPOINTMENT (requires phone number)
INSERT INTO workflow_definition (org_id, case_type, from_status, to_status, is_active, required_fields_json)
VALUES ('org-001', 'SALE', 'QUALIFIED', 'APPOINTMENT', true,
  '{"leadPhone": true}');

-- APPOINTMENT -> WON (requires completed appointment)
INSERT INTO workflow_definition (org_id, case_type, from_status, to_status, is_active, conditions_json)
VALUES ('org-001', 'SALE', 'APPOINTMENT', 'WON', true,
  '{"requiresCompletedAppointment": true}');
```

### Example 2: Rental Workflow with Agent Approval

```sql
-- NEW -> CRM_QUALIFIED (requires AGENT role - enforced in code)
INSERT INTO workflow_definition (org_id, case_type, from_status, to_status, is_active)
VALUES ('org-001', 'RENTAL', 'NEW', 'CRM_QUALIFIED', true);

-- CRM_QUALIFIED -> CRM_VISIT_SCHEDULED (requires appointment)
INSERT INTO workflow_definition (org_id, case_type, from_status, to_status, is_active, conditions_json)
VALUES ('org-001', 'RENTAL', 'CRM_QUALIFIED', 'CRM_VISIT_SCHEDULED', true,
  '{"requiresAppointment": true}');

-- CRM_VISIT_SCHEDULED -> CRM_VISIT_DONE (built-in: requires completed appointment)
INSERT INTO workflow_definition (org_id, case_type, from_status, to_status, is_active)
VALUES ('org-001', 'RENTAL', 'CRM_VISIT_SCHEDULED', 'CRM_VISIT_DONE', true);
```

### Example 3: Complex Validation

```sql
INSERT INTO workflow_definition (
  org_id, case_type, from_status, to_status, is_active,
  required_fields_json, conditions_json
)
VALUES (
  'org-001', 'SALE', 'QUALIFYING', 'QUALIFIED', true,
  '{"leadName": true, "leadPhone": true, "leadEmail": true}',
  '{
    "minimumScore": {
      "field": "score",
      "operator": "greaterThanOrEqual",
      "value": 50
    },
    "hasNotes": {
      "field": "notes",
      "operator": "isNotEmpty"
    }
  }'
);
```

## Error Response Format

All workflow validation errors follow this structure:

```json
{
  "type": "about:blank",
  "title": "Workflow Validation Failed",
  "status": 400,
  "detail": "Workflow validation failed for transition from X to Y",
  "instance": "/api/v1/dossiers/123/status",
  "errorType": "MISSING_REQUIRED_FIELDS",
  "validationErrors": {
    "missingRequiredFields": [...],
    "requiredFieldsActionableMessages": [...],
    "roleAuthorizationError": "...",
    "roleActionableMessage": "...",
    "preConditionError": "...",
    "preConditionActionableMessage": "...",
    "failedConditions": [...],
    "conditionsActionableMessages": [...],
    "transition": "...",
    "allowedTransitions": [...],
    "actionableMessage": "..."
  }
}
```

**Error Types:**
- `MISSING_REQUIRED_FIELDS`
- `ROLE_AUTHORIZATION_FAILED`
- `PRE_CONDITION_NOT_MET`
- `CUSTOM_CONDITION_FAILED`
- `INVALID_TRANSITION`

## Audit Trail

All transition attempts (successful or failed) are recorded in `workflow_transition` table:

```sql
CREATE TABLE workflow_transition (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    dossier_id BIGINT NOT NULL,
    case_type VARCHAR(100),
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    reason TEXT,
    is_allowed BOOLEAN NOT NULL,
    validation_errors_json JSONB,
    transitioned_at TIMESTAMP NOT NULL
);
```

This provides full audit history of:
- Who attempted the transition
- When it was attempted
- Whether it was allowed
- What validation errors occurred (if any)

## Extension Points

To add new pre-condition types or validation logic:

1. **Add condition check in `validatePreConditions()`:**
```java
if (conditions != null && conditions.containsKey("requiresDocument")) {
    Object requiresDoc = conditions.get("requiresDocument");
    if (Boolean.TRUE.equals(requiresDoc)) {
        // Check if dossier has required document
        if (!hasRequiredDocument(dossier)) {
            errors.put("preConditionError", "Document upload required");
            errors.put("preConditionActionableMessage", 
                "Please upload the required documents before proceeding.");
        }
    }
}
```

2. **Add built-in status requirements in `validateRoleBasedAuthorization()`:**
```java
if ("ADMIN_REVIEW".equalsIgnoreCase(toStatus)) {
    boolean hasAdminRole = authorities.stream()
        .anyMatch(auth -> auth.getAuthority().equalsIgnoreCase("ROLE_ADMIN"));
    if (!hasAdminRole) {
        // Add error
    }
}
```

3. **Add new field to `getFieldValue()` for custom conditions:**
```java
case "customField" -> dossier.getCustomField();
```
