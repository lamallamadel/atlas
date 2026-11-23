# Two-Tier Workflow Validation Architecture

## Overview

The dossier status transition system uses a two-tier validation architecture that provides flexibility for different use cases while maintaining data integrity.

## Validation Tiers

### Tier 1: Basic Validation (Always Applied)

**Service:** `DossierStatusTransitionService`

**Applies to:** ALL dossiers, regardless of `caseType`

**Validates:**
- Terminal state enforcement (WON, LOST cannot transition to other states)
- Basic allowed transitions between status states
- Example: NEW can transition to QUALIFYING, QUALIFIED, APPOINTMENT, or LOST

**Purpose:** Ensures fundamental business rules are never violated

### Tier 2: Workflow Validation (Conditional)

**Service:** `WorkflowValidationService`

**Applies to:** Only dossiers with `caseType` set (not null/blank)

**Validates:**
- Custom workflow rules defined per case type (e.g., "CRM_LEAD_BUY", "CRM_LEAD_RENT")
- Required fields for specific transitions
- Custom conditions for status changes
- Records all transition attempts in `workflow_transition` table for audit

**Purpose:** Enforces organization-specific workflow constraints

## Bypass Mechanism

When `dossier.caseType` is `null` or blank:
- Tier 2 (Workflow Validation) is **bypassed**
- Only Tier 1 (Basic Validation) is enforced
- Allows flexible transitions that meet basic rules without requiring workflow setup

**Use Cases for Bypass:**
1. Generic dossiers without specific workflow requirements
2. Legacy data migration without pre-configured workflows
3. Testing scenarios that need flexible state transitions
4. Organizations that haven't set up custom workflows yet

## Default caseType Behavior

**Important:** There is **NO default `caseType`** set in the system.

- When creating a dossier via API, `caseType` defaults to `null` if not explicitly provided
- This ensures backward compatibility and allows flexible adoption of workflow rules
- Organizations can gradually adopt workflow validation by setting `caseType` only where needed

### Previous Behavior

In earlier iterations, there may have been attempts to set a default `caseType` (e.g., "CRM_LEAD_BUY"). This has been **removed** to support the two-tier validation architecture and allow flexible workflow adoption.

## Code Implementation

### DossierService.patchStatus()

```java
// Step 1: Basic validation - always enforced
transitionService.validateTransition(currentStatus, newStatus);

// Step 2: Workflow validation - only when caseType is set
if (dossier.getCaseType() != null && !dossier.getCaseType().isBlank()) {
    workflowValidationService.validateAndRecordTransition(
        dossier, currentStatus.name(), newStatus.name(), 
        request.getUserId(), request.getReason()
    );
}
```

### WorkflowValidationService.validateAndRecordTransition()

```java
// BYPASS: When caseType is null or blank, skip custom workflow validation
if (caseType == null || caseType.isBlank()) {
    transition.setIsAllowed(true);
    transition.setValidationErrorsJson(null);
    workflowTransitionRepository.save(transition);
    return; // Skip workflow validation
}

// Check for workflow definition...
Optional<WorkflowDefinition> workflowDef = 
    workflowDefinitionRepository.findActiveTransition(orgId, caseType, fromStatus, toStatus);

if (workflowDef.isEmpty()) {
    // Transition not allowed for this case type
    throw new WorkflowValidationException(...);
}
```

## Testing Strategy

### E2E Tests

End-to-end tests can operate in two modes:

1. **Without Workflow Validation** (caseType = null)
   - Tests basic status transition rules
   - Validates terminal state enforcement
   - Uses `testDataBuilder.withCaseType(null)` or omits caseType entirely
   
2. **With Workflow Validation** (caseType = "CRM_LEAD_BUY", etc.)
   - Tests custom workflow rules
   - Requires workflow definitions in database
   - Uses `testDataBuilder.withCaseType("CRM_LEAD_BUY")`

### Example Test Patterns

```java
// Test without workflow validation (flexible transitions)
Dossier dossier = testDataBuilder.dossierBuilder()
    .withStatus(DossierStatus.NEW)
    .withCaseType(null)  // Bypass workflow validation
    .persist();

// Test with workflow validation (strict transitions)
Dossier dossier = testDataBuilder.dossierBuilder()
    .withStatus(DossierStatus.NEW)
    .withCaseType("CRM_LEAD_BUY")  // Enforce workflow rules
    .persist();
```

## Migration Guide

### For Existing Systems

1. **Default Behavior:** All existing dossiers without `caseType` will continue to work with basic validation only
2. **Gradual Adoption:** Set `caseType` on new dossiers to enable workflow validation
3. **Workflow Setup:** Create workflow definitions for your case types via `/api/v1/workflow/definitions`

### For New Systems

1. **Define Case Types:** Create referential entries for your case types (e.g., "CRM_LEAD_BUY", "CRM_SALE_TRANSACTION")
2. **Configure Workflows:** Set up workflow definitions for each case type
3. **Set Case Type:** Always set `caseType` when creating dossiers to enable full validation

## Benefits

1. **Backward Compatibility:** Existing code without workflow setup continues to work
2. **Gradual Migration:** Organizations can adopt workflow validation incrementally  
3. **Flexibility:** Mix workflow-controlled and flexible dossiers in the same system
4. **Testing:** Easy to test basic transitions without workflow setup overhead
5. **Audit Trail:** All workflow transitions are recorded regardless of validation outcome

## See Also

- `DossierService.java` - Main dossier business logic
- `WorkflowValidationService.java` - Workflow validation implementation
- `DossierStatusTransitionService.java` - Basic transition rules
- `WorkflowDefinitionRepository.java` - Workflow definition queries
- `V16__Add_workflow_engine.sql` - Workflow database schema
- `V17__Seed_default_workflows.sql` - Default workflow definitions
