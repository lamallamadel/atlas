# Workflow Admin Module

This module provides a comprehensive visual workflow configuration interface for administrators to design and manage workflows for Dossiers and Annonces.

## Features

### 1. Visual Workflow Editor
- **Drag-and-drop nodes**: Position workflow status nodes anywhere on the canvas
- **Visual connections**: Curved arrows showing transitions between statuses
- **Interactive canvas**: Click nodes to view details, drag to reposition
- **Add transitions**: Click "Add transition" on a node, then click target node to create connection
- **Real-time updates**: Canvas redraws automatically as you make changes

### 2. Transition Rule Configuration
- **Required Fields**: Define which fields must be filled before a transition
- **Role Permissions**: Specify which user roles can execute each transition
- **Approval Requirements**: Mark transitions that need supervisor approval
- **Custom Conditions**: Add advanced conditions using expressions

### 3. Workflow Preview Mode
- **Interactive simulation**: Test workflow progression through different states
- **Transition history**: See a timeline of all transitions executed
- **Current state display**: Visual representation of the current workflow state
- **Available transitions**: Shows all possible next steps with their requirements
- **Workflow statistics**: Summary of nodes, transitions, and execution path

## Architecture

### Components

#### WorkflowAdminComponent
Main container component with tab navigation:
- Case type selector (Dossier/Annonce)
- Save functionality
- Tab management

#### WorkflowEditorComponent
Visual canvas with drag-and-drop:
- Canvas drawing for transition arrows
- Node positioning and selection
- Transition creation workflow
- Properties panel

#### WorkflowNodeComponent
Individual status node:
- Draggable with CDK Drag & Drop
- Visual styling with colors and icons
- Action buttons for adding transitions
- Selection state management

#### TransitionRuleFormComponent
Form for configuring transition rules:
- Required fields management
- Role permissions
- Approval toggles
- Condition expressions

#### WorkflowPreviewComponent
Interactive preview mode:
- Current state visualization
- Available transitions display
- Execution simulation
- History timeline

### Services

#### WorkflowConfigService
Central state management:
- Workflow configuration storage
- Node updates
- Transition CRUD operations
- Default configurations for Dossier and Annonce workflows

### Models

#### WorkflowConfiguration
```typescript
{
  id?: string;
  caseType: CaseType;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  transitions: TransitionRule[];
  createdAt?: string;
  updatedAt?: string;
}
```

#### WorkflowNode
```typescript
{
  id: string;
  label: string;
  status: string;
  x: number;
  y: number;
  color?: string;
  icon?: string;
}
```

#### TransitionRule
```typescript
{
  id: string;
  fromStatus: string;
  toStatus: string;
  label?: string;
  requiredFields?: string[];
  allowedRoles?: string[];
  requiresApproval?: boolean;
  conditions?: string;
}
```

## Usage

### Accessing the Module

Navigate to `/workflow-admin` or click "Workflows" in the side navigation.

### Creating a Transition

1. Select the case type (Dossier or Annonce)
2. In the Visual Editor tab:
   - Click on a source node
   - Click "Add transition" button
   - Click on the destination node
3. Switch to "Transition Rules" tab to configure the new transition

### Configuring Transition Rules

1. Go to "Transition Rules" tab
2. Expand the source status in the left panel
3. Click on a transition to edit
4. Configure:
   - Label
   - Required fields (select from dropdown)
   - Allowed roles (select from dropdown)
   - Approval requirement (toggle)
   - Custom conditions (optional expression)
5. Click "Save"

### Testing the Workflow

1. Go to "Preview" tab
2. Click on available transitions to simulate progression
3. View the history timeline to see your path
4. Click "Reset" to start over

### Saving Changes

Click the "Save" button in the header to persist your workflow configuration.

## Default Workflows

### Dossier Workflow
- **NEW** → QUALIFYING → QUALIFIED → APPOINTMENT → WON/LOST
- 6 status nodes
- 6 transitions with role-based permissions

### Annonce Workflow
- **DRAFT** → PUBLISHED → ACTIVE ⇄ PAUSED → ARCHIVED
- 5 status nodes
- 6 transitions with field validation

## Styling

The module uses Material Design components and follows the application's theme:
- Primary color: #2196F3 (blue)
- Node colors reflect status semantics (green for success, red for failure, etc.)
- Responsive design with mobile support
- Accessible with ARIA labels and keyboard navigation

## Future Enhancements

- Backend API integration for persistence
- Workflow versioning
- Export/import workflow configurations
- Validation rules for preventing invalid workflows
- Bulk transition operations
- Workflow templates library
- Real-time collaboration
- Audit log for configuration changes
