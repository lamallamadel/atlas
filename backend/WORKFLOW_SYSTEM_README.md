# Comprehensive Multi-Tenant Workflow Customization System

## Overview

This document describes the comprehensive workflow customization system that enables per-organization workflow definitions with versioning, templates, simulation, and role-based authorization.

## Features

### 1. **Multi-Tenant Workflow Definitions**
- Each organization can define custom workflows for different case types (SALE, RENTAL, MANDATE, CONSTRUCTION)
- Workflows are isolated per organization using `org_id` filtering
- Support for multiple case types with different state machines

### 2. **Workflow Versioning**
- Create new versions of existing workflows without disrupting active dossiers
- Published workflows are immutable - changes require creating a new version
- Parent-child relationship tracking via `parent_version_id`
- Version number auto-increment per case type
- Safe activation checking to ensure no active dossiers use old versions

### 3. **Workflow Template Library**
- Pre-built workflow templates for common business scenarios:
  - **Sales Workflow**: NEW → QUALIFYING → QUALIFIED → PROPOSAL → WON/LOST
  - **Rental Workflow**: NEW → VIEWING → APPLICATION → SCREENING → RENTED/LOST
  - **Mandate Workflow**: LEAD → CONTACT → EVALUATION → PROPOSAL → SIGNED/LOST
  - **Construction Workflow**: INQUIRY → PLANNING → PERMITS → CONSTRUCTION → INSPECTION → COMPLETED/CANCELLED
- Organizations can instantiate templates and customize them
- System templates stored with `org_id = 'SYSTEM'`

### 4. **Visual Workflow Builder (D3.js)**
- Drag-and-drop state nodes on canvas
- Draw transition arrows between states
- Visual representation with color-coded states:
  - Initial states (typically blue)
  - Intermediate states (various colors)
  - Final states (green for success, red for failure)
- Real-time graph rendering with force-directed layout
- Interactive state and transition editing

### 5. **Transition Rules & Validations**
- **Required Fields**: Specify fields that must be populated before transition
- **Field Validations**: Custom validation rules per transition
- **Role-Based Authorization**: Control which roles can execute transitions
- **Business Conditions**: JSON-based condition evaluation
- **Actions**: Automated actions to execute on successful transition

### 6. **Workflow Simulation Service**
- Test workflows with sample data before activation
- Validate all transitions and required fields
- Execution log with detailed step-by-step results
- Identify potential issues before deploying to production
- Simulation history tracking for audit

### 7. **Safe Version Updates**
- Active dossiers maintain reference to their workflow version
- New versions can be tested and validated before activation
- Only one active workflow per case type at a time
- Prevents deletion of workflows with active dossiers

## Architecture

### Database Schema

#### workflow_definition
```sql
- id: Primary key
- org_id: Organization identifier
- name: Human-readable workflow name
- description: Workflow description
- case_type: Type of case (SALE, RENTAL, etc.)
- version: Version number (auto-incremented)
- is_active: Currently active workflow
- is_published: Published and immutable
- is_template: System template flag
- template_category: Template category
- parent_version_id: Reference to parent version
- states_json: JSON array of workflow states
- transitions_json: JSON array of transitions
- metadata_json: Additional metadata
- initial_state: Starting state code
- final_states: Comma-separated final states
```

#### workflow_state
```sql
- id: Primary key
- org_id: Organization identifier
- workflow_definition_id: Reference to workflow
- state_code: Unique state identifier
- state_name: Display name
- state_type: initial, intermediate, or final
- description: State description
- color: Display color (hex)
- position_x/position_y: Canvas position
- is_initial/is_final: State flags
- metadata_json: Additional metadata
```

#### workflow_transition_rule
```sql
- id: Primary key
- org_id: Organization identifier
- workflow_definition_id: Reference to workflow
- from_state/to_state: State transition
- label: Transition label
- is_active: Active flag
- required_fields: JSON array of required field names
- field_validations: JSON validation rules
- allowed_roles: JSON array of role names
- conditions_json: Business logic conditions
- actions_json: Actions to execute
- priority: Execution priority
```

#### workflow_transition (Audit Log)
```sql
- id: Primary key
- org_id: Organization identifier
- dossier_id: Reference to dossier
- case_type: Case type
- from_status/to_status: Transition states
- is_allowed: Whether transition was allowed
- validation_errors_json: Validation errors
- user_id: User who attempted transition
- reason: Transition reason
- transitioned_at: Timestamp
```

#### workflow_simulation
```sql
- id: Primary key
- org_id: Organization identifier
- workflow_definition_id: Reference to workflow
- simulation_name: Name of simulation run
- current_state: Starting state
- test_data_json: Sample test data
- execution_log: JSON array of log entries
- status: RUNNING, COMPLETED, FAILED
- result_json: Simulation results
```

### Service Layer

#### WorkflowService
Main service for workflow CRUD operations:
- `createDefinition()`: Create new workflow
- `updateDefinition()`: Update unpublished workflow
- `publishWorkflow()`: Publish and make immutable
- `activateWorkflow()`: Set as active for case type
- `createNewVersion()`: Create new version from parent
- `deleteDefinition()`: Delete workflow (with safety checks)
- `getVersionsByCaseType()`: List all versions for case type

#### WorkflowTemplateLibraryService
Manages workflow templates:
- `listTemplates()`: List available templates
- `instantiateTemplate()`: Create workflow from template
- `seedSystemTemplates()`: Populate system templates
- Pre-built templates for SALE, RENTAL, MANDATE, CONSTRUCTION

#### WorkflowSimulationService
Tests workflows before activation:
- `runSimulation()`: Execute workflow simulation
- `getSimulationHistory()`: List past simulations
- Validates transitions, required fields, and conditions
- Returns detailed execution log

#### WorkflowVersioningService
Handles workflow versioning:
- `createNewVersion()`: Clone workflow with new version
- `canSafelyActivateVersion()`: Check for active dossiers
- Maintains parent-child relationships

#### WorkflowValidationService
Validates workflow transitions:
- `validateAndRecordTransition()`: Validate and log transition
- `validateWorkflowStructure()`: Validate workflow definition
- `checkTransitionValidity()`: Pre-check transition validity
- Enforces required fields, role authorization, and business conditions

### REST API Endpoints

#### Workflow Definitions
```
POST   /api/v1/workflow/definitions              - Create workflow
GET    /api/v1/workflow/definitions/{id}         - Get workflow by ID
GET    /api/v1/workflow/definitions              - List workflows (with filters)
PUT    /api/v1/workflow/definitions/{id}         - Update workflow
DELETE /api/v1/workflow/definitions/{id}         - Delete workflow
POST   /api/v1/workflow/definitions/{id}/publish - Publish workflow
POST   /api/v1/workflow/definitions/{id}/activate - Activate workflow
POST   /api/v1/workflow/definitions/{id}/version  - Create new version
```

#### Templates
```
GET    /api/v1/workflow/templates                         - List templates
POST   /api/v1/workflow/templates/{id}/instantiate        - Instantiate template
POST   /api/v1/workflow/templates/seed                    - Seed system templates
```

#### Simulations
```
POST   /api/v1/workflow/simulations                       - Run simulation
GET    /api/v1/workflow/simulations/{id}                  - Get simulation result
GET    /api/v1/workflow/simulations/workflow/{id}         - Get simulation history
```

#### Validation
```
GET    /api/v1/workflow/validate-transition/dossier/{id}  - Validate transition
GET    /api/v1/workflow/allowed-transitions               - Get allowed transitions
```

### Frontend Components

#### WorkflowBuilderComponent
Visual workflow editor with D3.js:
- Drag-and-drop state creation
- Visual transition drawing
- State property editing
- Transition rule configuration
- Save, publish, and activate workflows

#### WorkflowTemplateLibraryComponent
Browse and use templates:
- Grid view of available templates
- Category filtering
- Template instantiation
- Template details view

#### WorkflowSimulationComponent
Test workflows before activation:
- Configure test data
- Run simulations
- View execution logs
- Review validation results
- Access simulation history

## Usage Examples

### 1. Create Workflow from Template

```typescript
// Instantiate sales workflow template
this.workflowApi.instantiateTemplate(templateId, 'My Sales Workflow').subscribe(
  workflow => {
    console.log('Workflow created:', workflow);
  }
);
```

### 2. Define Custom Workflow

```typescript
const workflow: WorkflowDefinition = {
  name: 'Custom Lead Workflow',
  description: 'Tailored for our sales process',
  caseType: 'SALE',
  isActive: false,
  isPublished: false,
  statesJson: [
    { stateCode: 'NEW', stateName: 'New Lead', stateType: 'initial', color: '#3B82F6', ... },
    { stateCode: 'QUALIFIED', stateName: 'Qualified', stateType: 'intermediate', color: '#10B981', ... },
    { stateCode: 'WON', stateName: 'Won', stateType: 'final', color: '#059669', ... }
  ],
  transitionsJson: [
    { 
      fromState: 'NEW', 
      toState: 'QUALIFIED', 
      label: 'Qualify Lead',
      requiredFields: ['leadName', 'leadPhone', 'leadEmail'],
      allowedRoles: ['ADMIN', 'AGENT']
    }
  ],
  initialState: 'NEW',
  finalStates: 'WON,LOST'
};

this.workflowApi.createWorkflow(workflow).subscribe(...);
```

### 3. Test Workflow with Simulation

```typescript
const simulationRequest: WorkflowSimulationRequest = {
  workflowDefinitionId: 1,
  simulationName: 'Test lead qualification',
  currentState: 'NEW',
  testDataJson: {
    leadName: 'John Doe',
    leadPhone: '+1234567890',
    leadEmail: 'john@example.com'
  }
};

this.workflowApi.runSimulation(simulationRequest).subscribe(
  result => {
    console.log('Possible transitions:', result.resultJson.possibleTransitions);
    console.log('Execution log:', result.executionLog);
  }
);
```

### 4. Publish and Activate Workflow

```typescript
// Publish workflow (makes it immutable)
this.workflowApi.publishWorkflow(workflowId).subscribe(
  published => {
    // Activate workflow (sets as active for case type)
    this.workflowApi.activateWorkflow(workflowId).subscribe(
      activated => console.log('Workflow is now active')
    );
  }
);
```

### 5. Create New Version

```typescript
// Create new version of existing workflow
this.workflowApi.createNewVersion(
  parentWorkflowId, 
  'Updated qualification rules'
).subscribe(
  newVersion => {
    console.log('New version created:', newVersion.version);
  }
);
```

## Security Considerations

1. **Organization Isolation**: All queries filter by `org_id` to ensure data isolation
2. **Role-Based Access**: Transitions can be restricted to specific roles
3. **Audit Trail**: All transition attempts are logged in `workflow_transition` table
4. **Immutable Published Workflows**: Published workflows cannot be modified
5. **Safe Deletion**: Workflows with active dossiers cannot be deleted

## Performance Optimizations

1. **Indexes**: Strategic indexes on frequently queried fields
2. **JSON Storage**: States and transitions stored as JSONB for efficient querying
3. **Version Caching**: Active workflows can be cached per organization
4. **Lazy Loading**: Frontend components use lazy loading for D3.js

## Migration Path

The system is designed to coexist with existing workflow logic:
- Legacy dossiers without `workflow_definition_id` continue to use basic validation
- New dossiers can be assigned to workflows
- Organizations can gradually migrate to custom workflows
- Template library provides quick start options

## Future Enhancements

1. **Workflow Analytics**: Track transition success rates and bottlenecks
2. **Conditional Branching**: Support for complex conditional logic
3. **Parallel States**: Support for concurrent states
4. **SLA Tracking**: Monitor time spent in each state
5. **Notification Triggers**: Automated notifications on state changes
6. **External System Integration**: Webhooks for external system integration
7. **Workflow Import/Export**: Share workflows between organizations
