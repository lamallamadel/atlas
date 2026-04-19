# Workflow Builder Frontend Guide

## Overview

The Workflow Builder provides a visual drag-and-drop interface for designing custom workflows using D3.js for graph visualization.

## Components

### 1. WorkflowBuilderComponent

Visual workflow editor with interactive canvas.

**Features:**
- Drag-and-drop state nodes
- Force-directed graph layout
- Color-coded state types
- Interactive transition creation
- Real-time validation

**Usage:**
```typescript
import { WorkflowBuilderComponent } from './components/workflow-builder.component';

// In your module
declarations: [WorkflowBuilderComponent]

// In your template
<app-workflow-builder></app-workflow-builder>
```

**State Management:**
- Initial states (blue): Entry point of workflow
- Intermediate states (various colors): Processing states
- Final states (green/red): Terminal states

**Interaction:**
- Click state to select and view properties
- Drag states to rearrange layout
- Click "Add Transition" to create arrows between states
- Right-click or use context menu for delete operations

### 2. WorkflowTemplateLibraryComponent

Browse and instantiate pre-built workflow templates.

**Features:**
- Grid view of templates
- Category filtering (SALE, RENTAL, MANDATE, CONSTRUCTION)
- Template preview with state/transition counts
- One-click instantiation

**Usage:**
```typescript
import { WorkflowTemplateLibraryComponent } from './components/workflow-template-library.component';

// In your routing
{
  path: 'workflow-templates',
  component: WorkflowTemplateLibraryComponent
}
```

**Template Categories:**
- **SALE**: Property sales workflows
- **RENTAL**: Rental property workflows
- **MANDATE**: Mandate acquisition workflows
- **CONSTRUCTION**: New construction project workflows

### 3. WorkflowSimulationComponent

Test workflows with sample data before activation.

**Features:**
- JSON editor for test data
- State selection for simulation starting point
- Execution log viewer
- Results analysis
- Simulation history

**Usage:**
```typescript
import { WorkflowSimulationComponent } from './components/workflow-simulation.component';

// As child component with input
<app-workflow-simulation 
  [workflowDefinitionId]="workflowId"
  [workflow]="workflow">
</app-workflow-simulation>
```

**Test Data Format:**
```json
{
  "leadName": "John Doe",
  "leadPhone": "+1234567890",
  "leadEmail": "john@example.com",
  "budget": 500000,
  "notes": "Interested in downtown properties"
}
```

## Services

### WorkflowApiService

Central service for all workflow-related API calls.

**Methods:**

```typescript
// Workflow CRUD
createWorkflow(workflow: WorkflowDefinition): Observable<WorkflowDefinition>
getWorkflowById(id: number): Observable<WorkflowDefinition>
listWorkflows(caseType?, isActive?, isPublished?, page?, size?): Observable<PageResponse<WorkflowDefinition>>
updateWorkflow(id: number, workflow: WorkflowDefinition): Observable<WorkflowDefinition>
deleteWorkflow(id: number): Observable<void>

// Workflow Lifecycle
publishWorkflow(id: number): Observable<WorkflowDefinition>
activateWorkflow(id: number): Observable<WorkflowDefinition>
createNewVersion(id: number, description?: string): Observable<WorkflowDefinition>

// Templates
listTemplates(category?: string): Observable<WorkflowTemplate[]>
instantiateTemplate(templateId: number, name?: string): Observable<WorkflowDefinition>
seedTemplates(): Observable<void>

// Simulation
runSimulation(request: WorkflowSimulationRequest): Observable<WorkflowSimulationResponse>
getSimulationById(id: number): Observable<WorkflowSimulationResponse>
getSimulationHistory(workflowDefinitionId: number): Observable<WorkflowSimulationResponse[]>

// Validation
validateTransition(dossierId: number, fromStatus: string, toStatus: string): Observable<any>
getAllowedTransitions(caseType: string, currentStatus: string): Observable<string[]>
```

## D3.js Integration

### Graph Visualization

The workflow builder uses D3.js v7 for interactive graph visualization:

**Force Simulation:**
```typescript
this.simulation = d3.forceSimulation<D3Node>(this.nodes)
  .force('link', d3.forceLink<D3Node, D3Link>(this.links).distance(150))
  .force('charge', d3.forceManyBody().strength(-300))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide().radius(50));
```

**Features:**
- Force-directed layout automatically positions nodes
- Collision detection prevents overlapping
- Link distance maintains readability
- Center force keeps graph centered

**Node Rendering:**
- Circles represent states
- Colors indicate state type
- Labels show state names
- Interactive dragging

**Link Rendering:**
- Lines with arrow markers
- Labels show transition names
- Hover effects for interaction

### Customization

To customize the visualization:

```typescript
// Change node size
node.append('circle').attr('r', 40)  // Default: 30

// Change force strength
.force('charge', d3.forceManyBody().strength(-500))  // Default: -300

// Change link distance
.force('link', d3.forceLink().distance(200))  // Default: 150
```

## State Types & Colors

### Default Color Palette

```typescript
stateColors = [
  '#3B82F6',  // Blue - Typically for initial states
  '#10B981',  // Green - Success states
  '#F59E0B',  // Amber - Warning/pending states
  '#8B5CF6',  // Purple - Special processing states
  '#DC2626',  // Red - Error/rejection states
  '#06B6D4'   // Cyan - Information states
];
```

### State Type Definitions

- **initial**: Entry point (only one per workflow)
- **intermediate**: Processing states (multiple allowed)
- **final**: Terminal states (multiple allowed for different outcomes)

## Transition Rules

### Required Fields

Specify fields that must be populated:

```typescript
{
  fromState: 'NEW',
  toState: 'QUALIFIED',
  label: 'Qualify Lead',
  requiredFields: ['leadName', 'leadPhone', 'leadEmail'],
  allowedRoles: ['ADMIN', 'AGENT'],
  isActive: true
}
```

### Role-Based Authorization

Control access by role:

```typescript
allowedRoles: ['ADMIN', 'MANAGER', 'AGENT']
```

### Field Validations

Advanced validation rules:

```typescript
fieldValidations: {
  budget: { min: 100000, max: 10000000 },
  leadEmail: { pattern: '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$' }
}
```

## Workflow Lifecycle

### 1. Draft (Unpublished)
- Can be edited
- Not available for use
- Can be deleted

### 2. Published
- Immutable (cannot edit)
- Can be activated
- Available for instantiation

### 3. Active
- Currently in use for case type
- New dossiers use this workflow
- Only one active per case type

### 4. Versioned
- New version created from published workflow
- Starts as draft
- Can be tested before activation

## Best Practices

### Workflow Design

1. **Keep it Simple**: Start with 3-5 states
2. **Clear Naming**: Use descriptive state names
3. **Logical Flow**: Ensure transitions make business sense
4. **Test Thoroughly**: Use simulation before activation
5. **Version Safely**: Test new versions with simulations

### State Organization

1. **Initial State**: Single entry point
2. **Happy Path**: Main success flow
3. **Alternative Paths**: Handle edge cases
4. **Final States**: Clear success/failure outcomes

### Transition Rules

1. **Required Fields**: Only enforce truly required fields
2. **Roles**: Limit sensitive transitions to appropriate roles
3. **Conditions**: Keep business logic simple and testable
4. **Labels**: Use action verbs (e.g., "Qualify", "Approve")

## Error Handling

### Common Errors

**Validation Errors:**
```typescript
{
  isValid: false,
  validationErrors: {
    missingRequiredFields: ['leadPhone'],
    roleAuthorizationError: 'Requires AGENT role'
  }
}
```

**Structure Errors:**
```typescript
{
  errors: [
    'Workflow must have at least one state',
    'Initial state must be defined'
  ]
}
```

### Error Display

Use Material Snackbar for user feedback:

```typescript
this.snackBar.open('Error: ' + error.message, 'Close', {
  duration: 5000,
  panelClass: 'error-snackbar'
});
```

## Performance Considerations

### D3.js Optimization

1. **Lazy Loading**: D3 is loaded on-demand
2. **Simulation Stop**: Pause simulation when not visible
3. **Event Throttling**: Throttle drag events
4. **Canvas Size**: Limit canvas to reasonable dimensions

### Data Management

1. **Pagination**: List workflows with pagination
2. **Caching**: Cache active workflow per case type
3. **Debouncing**: Debounce search inputs
4. **Lazy Rendering**: Only render visible simulations

## Accessibility

### Keyboard Navigation

- Tab through states and transitions
- Arrow keys to navigate canvas
- Enter to select/edit
- Delete key to remove items

### Screen Reader Support

- ARIA labels on interactive elements
- Descriptive button text
- Status announcements for actions

### Color Contrast

- States use WCAG AA compliant colors
- Text contrasts with backgrounds
- Visual indicators beyond color

## Integration Examples

### Integrate with Dossier Creation

```typescript
createDossier(data: any) {
  // Get active workflow for case type
  this.workflowApi.listWorkflows(data.caseType, true, true).subscribe(
    workflows => {
      const activeWorkflow = workflows.content[0];
      
      // Create dossier with workflow
      const dossier = {
        ...data,
        workflowDefinitionId: activeWorkflow.id,
        workflowVersion: activeWorkflow.version,
        status: activeWorkflow.initialState
      };
      
      this.dossierApi.create(dossier).subscribe(...);
    }
  );
}
```

### Validate Before Status Change

```typescript
changeStatus(dossierId: number, newStatus: string) {
  this.workflowApi.validateTransition(dossierId, currentStatus, newStatus).subscribe(
    result => {
      if (result.isValid) {
        // Proceed with status change
        this.updateDossierStatus(dossierId, newStatus);
      } else {
        // Show validation errors
        this.showValidationErrors(result.validationErrors);
      }
    }
  );
}
```

## Testing

### Unit Tests

```typescript
describe('WorkflowBuilderComponent', () => {
  it('should create state node on canvas', () => {
    component.addState();
    expect(component.states.length).toBe(1);
    expect(component.nodes.length).toBe(1);
  });

  it('should validate required fields', () => {
    const form = component.stateForm;
    form.patchValue({ stateCode: '', stateName: '' });
    expect(form.valid).toBeFalse();
  });
});
```

### E2E Tests

```typescript
test('create workflow from template', async ({ page }) => {
  await page.goto('/workflow-templates');
  await page.click('button:has-text("Use Template")');
  await page.waitForSelector('.workflow-canvas');
  expect(await page.locator('.node').count()).toBeGreaterThan(0);
});
```

## Troubleshooting

### Canvas Not Rendering

**Issue**: SVG canvas is blank
**Solution**: 
1. Check if D3.js is loaded
2. Verify canvas has dimensions
3. Check browser console for errors

### Drag Not Working

**Issue**: Cannot drag state nodes
**Solution**:
1. Ensure simulation is running
2. Check if drag behavior is attached
3. Verify SVG pointer-events

### Simulation Fails

**Issue**: Simulation returns errors
**Solution**:
1. Validate test data JSON format
2. Check required fields are provided
3. Verify workflow is published

## Additional Resources

- [D3.js Documentation](https://d3js.org/)
- [Angular Material](https://material.angular.io/)
- [Workflow System Backend README](../backend/WORKFLOW_SYSTEM_README.md)
