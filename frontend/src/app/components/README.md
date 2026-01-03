# Components

This directory contains reusable Angular components.

---

## BadgeStatusComponent

A shared component for displaying status badges with consistent styling across the application.

### Usage

```html
<app-badge-status [status]="statusValue" entityType="annonce"></app-badge-status>
<app-badge-status [status]="statusValue" entityType="dossier"></app-badge-status>
```

### Inputs

- `status` (string, required): The status value (e.g., 'DRAFT', 'PUBLISHED', 'NEW', 'QUALIFIED', etc.)
- `entityType` (EntityType, required): Either 'annonce' or 'dossier'

### Status Colors

**Annonce:**
- DRAFT → Gray (#e9ecef)
- PUBLISHED (displayed as "Actif") → Green (#d4edda)
- ARCHIVED → Red (#f8d7da)

**Dossier:**
- NEW → Blue (#d1ecf1)
- QUALIFIED → Green (#d4edda)
- APPOINTMENT (displayed as "Rendez-vous") → Yellow (#fff3cd)
- WON → Dark Green (#c3e6cb)
- LOST → Red (#f8d7da)

---

## GenericTableComponent

A reusable Angular Material table component with built-in pagination, sorting, and row actions.

## Features

- Configurable columns with type support (text, number, date, boolean)
- Built-in pagination with customizable page sizes
- Sortable columns
- Customizable row actions (view, edit, delete, or custom actions)
- Conditional action visibility
- Material Design styling
- Responsive layout

## Usage

### Basic Example

```typescript
import { Component } from '@angular/core';
import { ColumnConfig, RowAction } from './components/generic-table.component';

@Component({
  selector: 'app-example',
  template: `
    <app-generic-table
      [columns]="columns"
      [data]="data"
      [showActions]="true"
      [actions]="actions"
      [pageSize]="10"
      [showPagination]="true"
      [enableSort]="true"
      (rowAction)="handleAction($event)">
    </app-generic-table>
  `
})
export class ExampleComponent {
  columns: ColumnConfig[] = [
    { key: 'id', header: 'ID', sortable: true, type: 'number' },
    { key: 'name', header: 'Name', sortable: true, type: 'text' },
    { key: 'email', header: 'Email', sortable: true, type: 'text' },
    { key: 'createdAt', header: 'Created', sortable: true, type: 'date' },
    { key: 'active', header: 'Active', sortable: true, type: 'boolean' }
  ];

  data = [
    { id: 1, name: 'John Doe', email: 'john@example.com', createdAt: new Date(), active: true },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date(), active: false }
  ];

  actions: RowAction[] = [
    { icon: 'visibility', tooltip: 'View Details', action: 'view', color: 'primary' },
    { icon: 'edit', tooltip: 'Edit', action: 'edit', color: 'accent' },
    { 
      icon: 'delete', 
      tooltip: 'Delete', 
      action: 'delete', 
      color: 'warn',
      show: (row) => !row.active // Only show delete for inactive items
    }
  ];

  handleAction(event: { action: string; row: any }) {
    console.log('Action:', event.action, 'Row:', event.row);
    
    switch (event.action) {
      case 'view':
        // Navigate to view page
        break;
      case 'edit':
        // Navigate to edit page
        break;
      case 'delete':
        // Show delete confirmation
        break;
    }
  }
}
```

## API

### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `ColumnConfig[]` | `[]` | Column configuration array |
| `data` | `any[]` | `[]` | Data array to display |
| `showActions` | `boolean` | `true` | Show/hide actions column |
| `actions` | `RowAction[]` | Default actions | Custom row actions |
| `pageSize` | `number` | `10` | Initial page size |
| `pageSizeOptions` | `number[]` | `[5, 10, 25, 50, 100]` | Available page sizes |
| `showPagination` | `boolean` | `true` | Show/hide pagination |
| `enableSort` | `boolean` | `true` | Enable/disable sorting |

### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `rowAction` | `EventEmitter<{action: string, row: any}>` | Emitted when a row action is clicked |

### Interfaces

#### ColumnConfig
```typescript
interface ColumnConfig {
  key: string;                                    // Property key in data object
  header: string;                                 // Column header text
  sortable?: boolean;                            // Enable sorting (default: true)
  type?: 'text' | 'number' | 'date' | 'boolean'; // Data type for formatting
}
```

#### RowAction
```typescript
interface RowAction {
  icon: string;                      // Material icon name
  tooltip: string;                   // Button tooltip text
  action: 'view' | 'edit' | 'delete' | string; // Action identifier
  color?: string;                    // Material color: 'primary', 'accent', 'warn'
  show?: (row: any) => boolean;      // Conditional visibility function
}
```

## Customization

### Custom Actions

You can define completely custom actions:

```typescript
actions: RowAction[] = [
  { icon: 'download', tooltip: 'Download', action: 'download', color: 'primary' },
  { icon: 'share', tooltip: 'Share', action: 'share', color: 'accent' }
];
```

### Without Actions

```html
<app-generic-table
  [columns]="columns"
  [data]="data"
  [showActions]="false">
</app-generic-table>
```

### Without Pagination

```html
<app-generic-table
  [columns]="columns"
  [data]="data"
  [showPagination]="false">
</app-generic-table>
```

### Without Sorting

```html
<app-generic-table
  [columns]="columns"
  [data]="data"
  [enableSort]="false">
</app-generic-table>
```
