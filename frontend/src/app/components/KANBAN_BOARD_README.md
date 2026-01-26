# Kanban Board Component

## Overview

The `KanbanBoardComponent` provides a visual pipeline view for managing dossiers through their lifecycle stages. It features drag-and-drop functionality with workflow validation, compact cards with key information, quick filtering, and column counters.

## Features

### 1. Column-Based Status View
- **6 Status Columns**: NEW, QUALIFYING, QUALIFIED, APPOINTMENT, WON, LOST
- **Visual Hierarchy**: Each column has a distinct icon and color scheme
- **Counter Badges**: Real-time count of dossiers in each column

### 2. Drag-and-Drop with Workflow Validation
- **Workflow Rules**: Enforces valid status transitions based on business logic
- **Visual Feedback**: Drag preview, placeholder, and hover effects
- **Error Handling**: Prevents invalid transitions with user-friendly messages

#### Allowed Transitions
```typescript
NEW → QUALIFYING, LOST
QUALIFYING → NEW, QUALIFIED, LOST
QUALIFIED → QUALIFYING, APPOINTMENT, LOST
APPOINTMENT → QUALIFIED, WON, LOST
WON → (final state)
LOST → NEW, QUALIFYING (recovery)
```

### 3. Compact Card Design
Each card displays:
- **Dossier ID**: Quick reference number
- **Lead Information**: Name and phone number
- **Property Link**: Associated annonce title
- **Metadata**: Source, score (if available)
- **Last Updated**: Date of last modification
- **Drag Handle**: Visual indicator for draggable elements

### 4. Quick Filter
- **Real-time Search**: Filters cards across all columns
- **Multi-field Search**: Searches by name, phone, annonce title, or ID
- **Debounced Input**: 300ms delay for performance

### 5. Responsive Design
- **Horizontal Scrolling**: For columns on smaller screens
- **Mobile Optimized**: Card sizes and spacing adjust for mobile devices
- **Custom Scrollbars**: Styled column scrollbars for better UX

## Usage

### Basic Implementation

```typescript
<app-kanban-board
  [dossiers]="dossiers"
  [loading]="loading"
  [quickFilter]="quickFilterValue"
  (dossierClick)="onDossierClick($event)"
  (dossierUpdated)="onDossierUpdated()">
</app-kanban-board>
```

### Input Properties

| Property | Type | Description |
|----------|------|-------------|
| `dossiers` | `DossierResponse[]` | Array of dossiers to display |
| `loading` | `boolean` | Shows loading spinner when true |
| `quickFilter` | `string` | Filter value for quick search |

### Output Events

| Event | Type | Description |
|-------|------|-------------|
| `dossierClick` | `EventEmitter<DossierResponse>` | Emitted when a card is clicked |
| `dossierUpdated` | `EventEmitter<void>` | Emitted after successful status change |

### Integration Example

```typescript
// component.ts
export class DossiersComponent implements OnInit {
  dossiers: DossierResponse[] = [];
  loading = false;
  quickFilterControl = new FormControl<string>('');
  quickFilterValue = '';
  viewMode: 'list' | 'kanban' = 'list';

  ngOnInit(): void {
    this.setupQuickFilter();
    this.loadViewPreference();
    this.loadDossiers();
  }

  private setupQuickFilter(): void {
    this.quickFilterControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => {
        this.quickFilterValue = value || '';
      });
  }

  onKanbanDossierClick(dossier: DossierResponse): void {
    this.router.navigate(['/dossiers', dossier.id]);
  }

  onKanbanDossierUpdated(): void {
    this.loadDossiers();
  }
}
```

```html
<!-- component.html -->
<mat-form-field appearance="outline" class="quick-filter-field">
  <mat-label>Recherche rapide</mat-label>
  <input
    matInput
    [formControl]="quickFilterControl"
    placeholder="Filtrer par nom, téléphone, annonce..."
  />
  <mat-icon matSuffix>search</mat-icon>
</mat-form-field>

<app-kanban-board
  [dossiers]="dossiers"
  [loading]="loading"
  [quickFilter]="quickFilterValue"
  (dossierClick)="onKanbanDossierClick($event)"
  (dossierUpdated)="onKanbanDossierUpdated()">
</app-kanban-board>
```

## Styling

### CSS Classes

- `.kanban-board` - Main container
- `.kanban-columns` - Columns container with flexbox
- `.kanban-column` - Individual column
- `.column-won` / `.column-lost` - Special styling for final states
- `.kanban-card` - Individual dossier card
- `.empty-column` - Empty state for columns with no dossiers

### Customization

The component uses CSS variables from the design system:

```scss
// Spacing
--spacing-2, --spacing-3, --spacing-4

// Colors
--color-primary-*, --color-success-*, --color-error-*, etc.

// Effects
--shadow-sm, --shadow-md, --shadow-xl
--transition-base
--radius-lg
```

### Column Badge Colors

Each status has a distinct badge color defined in the component CSS:

- **NEW**: Warning (yellow/orange gradient)
- **QUALIFYING**: Info (blue gradient)
- **QUALIFIED**: Success (green gradient)
- **APPOINTMENT**: Primary (blue gradient)
- **WON**: Success (dark green, bold)
- **LOST**: Error (red gradient)

## Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Cards are focusable with tab navigation
- **Screen Reader Support**: Status updates announced via toast notifications
- **Semantic HTML**: Proper use of sections, buttons, and roles

## Performance Considerations

### Optimization Strategies

1. **TrackBy Functions**: Used for `*ngFor` loops to optimize rendering
2. **Debounced Filtering**: 300ms delay on quick filter input
3. **Lazy Loading**: Only loads visible cards
4. **Change Detection**: OnPush strategy for better performance

### Loading States

- **Loading Spinner**: Displayed during data fetch
- **Empty States**: User-friendly messages for empty columns
- **Error Handling**: Rollback on failed drag-and-drop

## Workflow Validation

The component enforces business rules for status transitions:

```typescript
private readonly workflowTransitions: Record<DossierStatus, DossierStatus[]> = {
  [DossierStatus.NEW]: [DossierStatus.QUALIFYING, DossierStatus.LOST],
  [DossierStatus.QUALIFYING]: [DossierStatus.NEW, DossierStatus.QUALIFIED, DossierStatus.LOST],
  [DossierStatus.QUALIFIED]: [DossierStatus.QUALIFYING, DossierStatus.APPOINTMENT, DossierStatus.LOST],
  [DossierStatus.APPOINTMENT]: [DossierStatus.QUALIFIED, DossierStatus.WON, DossierStatus.LOST],
  [DossierStatus.WON]: [],
  [DossierStatus.LOST]: [DossierStatus.NEW, DossierStatus.QUALIFYING]
};
```

### Validation Process

1. User drags a card to a new column
2. Component checks if transition is allowed
3. If valid: Updates backend → Shows success toast → Emits event
4. If invalid: Prevents drop → Shows warning toast → Returns card to original position

### Error Recovery

- **Optimistic Updates**: Card moves immediately, then rolls back on error
- **User Feedback**: Toast notifications for all outcomes
- **State Consistency**: Emits `dossierUpdated` event to refresh parent data

## Testing

### Unit Tests

```typescript
it('should validate workflow transitions', () => {
  component.ngOnInit();
  const isAllowed = (component as any).isTransitionAllowed(
    DossierStatus.NEW, 
    DossierStatus.QUALIFYING
  );
  expect(isAllowed).toBe(true);
});

it('should reject invalid workflow transitions', () => {
  component.ngOnInit();
  const isAllowed = (component as any).isTransitionAllowed(
    DossierStatus.WON, 
    DossierStatus.NEW
  );
  expect(isAllowed).toBe(false);
});

it('should apply quick filter', () => {
  component.dossiers = [
    { id: 1, status: DossierStatus.NEW, leadName: 'John Doe' } as any,
    { id: 2, status: DossierStatus.NEW, leadName: 'Jane Smith' } as any
  ];
  component.ngOnInit();
  component.quickFilter = 'john';
  component.ngOnChanges({ 
    quickFilter: { 
      currentValue: 'john', 
      previousValue: '', 
      firstChange: false, 
      isFirstChange: () => false 
    } 
  });

  const newColumn = component.filteredColumns.find(c => c.id === DossierStatus.NEW);
  expect(newColumn?.dossiers.length).toBe(1);
  expect(newColumn?.dossiers[0].leadName).toBe('John Doe');
});
```

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Drag and Drop**: Requires browser support for HTML5 drag API
- **CSS Grid**: Used for responsive layout
- **Flexbox**: Used for card layout

## Dependencies

- **Angular CDK**: `@angular/cdk` - Drag and drop functionality
- **Angular Material**: Icons, buttons, spinners
- **RxJS**: For async operations and observables

## Future Enhancements

### Planned Features

1. **Swimlanes**: Group dossiers by property type or agent
2. **Card Customization**: User-configurable card fields
3. **Bulk Operations**: Multi-select and bulk status changes
4. **Analytics**: Time in status, conversion rates
5. **Custom Workflows**: Per-organization workflow rules
6. **Card Sorting**: Sort within columns (priority, date, etc.)
7. **Keyboard Shortcuts**: Arrow keys for card navigation
8. **Column Collapse**: Hide/show columns
9. **Export**: Export board view as image/PDF

## Related Components

- `DossiersComponent` - Parent component managing list/kanban toggle
- `GenericTableComponent` - Alternative list view
- `DossierDetailComponent` - Detailed view when card is clicked
- `UserPreferencesService` - Persists view mode preference

## Resources

- [Angular CDK Drag and Drop](https://material.angular.io/cdk/drag-drop/overview)
- [Kanban Board UX Best Practices](https://www.nngroup.com/articles/kanban-boards/)
- [Workflow State Machines](https://xstate.js.org/docs/)
