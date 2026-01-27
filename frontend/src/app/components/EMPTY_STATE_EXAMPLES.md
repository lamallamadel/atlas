# Empty State Component - Usage Examples

## Table of Contents
1. [Basic Examples](#basic-examples)
2. [Context-Based Examples](#context-based-examples)
3. [User Adaptation Examples](#user-adaptation-examples)
4. [Advanced Customization](#advanced-customization)
5. [Real-World Scenarios](#real-world-scenarios)

## Basic Examples

### Simple Empty State (Legacy Mode)

```html
<app-empty-state 
  message="No items found"
  subtext="Try adding some items to get started.">
</app-empty-state>
```

### With Primary Action

```typescript
// Component
handleCreate(): void {
  this.router.navigate(['/create']);
}
```

```html
<app-empty-state 
  message="No items yet"
  subtext="Create your first item to begin."
  [primaryAction]="{
    label: 'Create Item',
    handler: handleCreate.bind(this)
  }">
</app-empty-state>
```

### With Primary and Secondary Actions

```typescript
// Component
handleCreate(): void {
  this.openCreateDialog();
}

handleImport(): void {
  this.openImportDialog();
}
```

```html
<app-empty-state 
  message="No data available"
  [primaryAction]="{
    label: 'Create New',
    handler: handleCreate.bind(this)
  }"
  [secondaryAction]="{
    label: 'Import Data',
    handler: handleImport.bind(this)
  }">
</app-empty-state>
```

## Context-Based Examples

### Dossiers (Leads) Empty State

```typescript
import { EmptyStateContext } from '../../services/empty-state-illustrations.service';

export class DossiersComponent {
  EmptyStateContext = EmptyStateContext;
  
  get emptyStateContext(): EmptyStateContext {
    return this.hasFilters 
      ? EmptyStateContext.NO_DOSSIERS_FILTERED
      : EmptyStateContext.NO_DOSSIERS;
  }
  
  createDossier(): void {
    // Create logic
  }
  
  clearFilters(): void {
    // Clear filters logic
  }
}
```

```html
<app-empty-state 
  *ngIf="dossiers.length === 0"
  [context]="emptyStateContext"
  [primaryAction]="{
    label: 'Create',
    handler: createDossier.bind(this)
  }"
  [secondaryAction]="{
    label: hasFilters ? 'Clear Filters' : 'Import',
    handler: hasFilters ? clearFilters.bind(this) : openImport.bind(this)
  }">
</app-empty-state>
```

### Annonces (Listings) Empty State

```typescript
export class AnnoncesComponent {
  EmptyStateContext = EmptyStateContext;
  
  get emptyStateContext(): EmptyStateContext {
    return this.appliedFilters.length > 0
      ? EmptyStateContext.NO_ANNONCES_FILTERED
      : EmptyStateContext.NO_ANNONCES;
  }
}
```

```html
<app-empty-state 
  [context]="emptyStateContext"
  [primaryAction]="{
    label: 'Create Listing',
    handler: createAnnonce.bind(this)
  }"
  [secondaryAction]="{
    label: 'Browse Templates',
    handler: browseTemplates.bind(this)
  }">
</app-empty-state>
```

### Messages Empty State

```typescript
export class MessagesComponent {
  EmptyStateContext = EmptyStateContext;
}
```

```html
<app-empty-state 
  [context]="EmptyStateContext.NO_MESSAGES"
  [primaryAction]="{
    label: 'Send Message',
    icon: 'send',
    handler: openMessageForm.bind(this)
  }"
  [secondaryAction]="{
    label: 'Use Template',
    icon: 'text_snippet',
    handler: selectTemplate.bind(this)
  }">
</app-empty-state>
```

### Appointments Empty State

```html
<app-empty-state 
  [context]="EmptyStateContext.NO_APPOINTMENTS"
  [primaryAction]="{
    label: 'Schedule Appointment',
    icon: 'event',
    handler: scheduleAppointment.bind(this)
  }">
</app-empty-state>
```

### Tasks Empty State

```html
<app-empty-state 
  [context]="EmptyStateContext.NO_TASKS"
  [primaryAction]="{
    label: 'Create Task',
    icon: 'add_task',
    handler: createTask.bind(this)
  }">
</app-empty-state>
```

### Documents Empty State

```html
<app-empty-state 
  [context]="EmptyStateContext.NO_DOCUMENTS"
  [primaryAction]="{
    label: 'Upload Document',
    icon: 'upload_file',
    handler: uploadDocument.bind(this)
  }">
</app-empty-state>
```

### Search Results Empty State

```html
<app-empty-state 
  [context]="EmptyStateContext.NO_SEARCH_RESULTS"
  [primaryAction]="{
    label: 'Clear Search',
    icon: 'close',
    handler: clearSearch.bind(this)
  }">
</app-empty-state>
```

## User Adaptation Examples

### New User Detection

```typescript
export class MyListComponent {
  get isNewUser(): boolean {
    // User is "new" if they have zero items and no active filters
    return this.items.length === 0 
      && this.page?.totalElements === 0 
      && this.appliedFilters.length === 0;
  }
}
```

```html
<!-- New user sees: "Bienvenue ! Créez votre premier dossier" -->
<!-- Experienced user sees: "Aucun dossier pour le moment" -->
<app-empty-state 
  [context]="EmptyStateContext.NO_DOSSIERS"
  [isNewUser]="isNewUser"
  [primaryAction]="primaryAction">
</app-empty-state>
```

### Time-Based User Detection

```typescript
export class MyComponent {
  get isNewUser(): boolean {
    const accountCreatedAt = this.authService.getAccountCreatedDate();
    const daysSinceCreation = this.getDaysSince(accountCreatedAt);
    return daysSinceCreation < 7; // New if account < 7 days old
  }
  
  private getDaysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
```

### Activity-Based User Detection

```typescript
export class MyComponent {
  get isNewUser(): boolean {
    const totalActions = this.getTotalUserActions();
    return totalActions < 10; // New if < 10 actions performed
  }
  
  private getTotalUserActions(): number {
    return this.dashboardService.getTotalActionsCount();
  }
}
```

## Advanced Customization

### Custom Illustration

```typescript
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export class MyComponent {
  customIllustration: SafeHtml;
  
  constructor(private sanitizer: DomSanitizer) {
    this.customIllustration = this.sanitizer.bypassSecurityTrustHtml(`
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="80" fill="#e0f2fe"/>
        <rect x="70" y="70" width="60" height="60" rx="8" fill="#3b82f6"/>
      </svg>
    `);
  }
}
```

```html
<app-empty-state 
  [context]="EmptyStateContext.NO_DOCUMENTS"
  [customIllustration]="customIllustration"
  [primaryAction]="primaryAction">
</app-empty-state>
```

### With Help Link

```html
<app-empty-state 
  [context]="EmptyStateContext.NO_DOSSIERS"
  [primaryAction]="{
    label: 'Create Dossier',
    icon: 'add',
    handler: createDossier.bind(this)
  }"
  [helpLink]="{
    label: 'Learn about dossier management',
    url: '/help/dossiers'
  }">
</app-empty-state>
```

### Multiple Actions with Icons

```html
<app-empty-state 
  [context]="EmptyStateContext.NO_DOCUMENTS"
  [primaryAction]="{
    label: 'Upload from Computer',
    icon: 'upload',
    handler: uploadFromComputer.bind(this)
  }"
  [secondaryAction]="{
    label: 'Link from Cloud',
    icon: 'cloud',
    handler: linkFromCloud.bind(this)
  }"
  [helpLink]="{
    label: 'Supported file types',
    url: '/help/documents/types'
  }">
</app-empty-state>
```

## Real-World Scenarios

### Filtered List with No Results

```typescript
export class ProductListComponent {
  products: Product[] = [];
  filters: FilterState = {};
  
  get emptyStateContext(): EmptyStateContext {
    return this.hasActiveFilters()
      ? EmptyStateContext.NO_SEARCH_RESULTS
      : EmptyStateContext.NO_PRODUCTS;
  }
  
  get emptyStatePrimaryAction(): ActionButtonConfig {
    return this.hasActiveFilters()
      ? { label: 'Clear Filters', handler: () => this.clearFilters() }
      : { label: 'Add Product', handler: () => this.addProduct() };
  }
  
  hasActiveFilters(): boolean {
    return Object.keys(this.filters).length > 0;
  }
}
```

```html
<div *ngIf="!loading && products.length === 0">
  <app-empty-state 
    [context]="emptyStateContext"
    [primaryAction]="emptyStatePrimaryAction"
    [secondaryAction]="{
      label: hasActiveFilters() ? 'Modify Filters' : 'Import Products',
      handler: hasActiveFilters() ? openFilters.bind(this) : importProducts.bind(this)
    }">
  </app-empty-state>
</div>
```

### Progressive Onboarding

```typescript
export class DashboardComponent {
  completedSteps: string[] = [];
  
  get currentEmptyState(): EmptyStateContext {
    if (!this.hasCompletedStep('profile')) {
      return EmptyStateContext.COMPLETE_PROFILE;
    }
    if (!this.hasCompletedStep('first-listing')) {
      return EmptyStateContext.NO_ANNONCES;
    }
    if (!this.hasCompletedStep('first-lead')) {
      return EmptyStateContext.NO_DOSSIERS;
    }
    return EmptyStateContext.ALL_CAUGHT_UP;
  }
  
  get nextStepAction(): ActionButtonConfig {
    if (!this.hasCompletedStep('profile')) {
      return {
        label: 'Complete Your Profile',
        icon: 'person',
        handler: () => this.router.navigate(['/profile'])
      };
    }
    // ... other steps
  }
  
  hasCompletedStep(step: string): boolean {
    return this.completedSteps.includes(step);
  }
}
```

### Permission-Based Empty States

```typescript
export class RestrictedListComponent {
  get emptyStateMessage(): string {
    if (!this.hasPermission('view')) {
      return 'You don\'t have permission to view this content';
    }
    if (!this.hasPermission('create')) {
      return 'No items yet. Ask an admin to create items.';
    }
    return 'No items yet. Create your first item!';
  }
  
  get showCreateButton(): boolean {
    return this.hasPermission('create');
  }
}
```

```html
<app-empty-state 
  [message]="emptyStateMessage"
  [primaryAction]="showCreateButton ? createAction : null"
  [secondaryAction]="{
    label: 'Request Access',
    handler: requestAccess.bind(this)
  }">
</app-empty-state>
```

### Loading State Integration

```typescript
export class MyComponent {
  loading = false;
  items: Item[] = [];
  error: string | null = null;
}
```

```html
<!-- Loading -->
<app-loading-skeleton 
  *ngIf="loading" 
  variant="table" 
  [rows]="5">
</app-loading-skeleton>

<!-- Error -->
<div *ngIf="error && !loading" class="error-state">
  <p>{{ error }}</p>
  <button (click)="reload()">Retry</button>
</div>

<!-- Empty State -->
<app-empty-state 
  *ngIf="!loading && !error && items.length === 0"
  [context]="emptyStateContext"
  [primaryAction]="primaryAction">
</app-empty-state>

<!-- Content -->
<div *ngIf="!loading && !error && items.length > 0">
  <!-- Your content -->
</div>
```

### Mobile-Optimized Empty State

```typescript
export class ResponsiveListComponent {
  isMobile = false;
  
  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }
  
  get secondaryActionLabel(): string {
    return this.isMobile ? 'Import' : 'Import from File';
  }
}
```

```html
<app-empty-state 
  [context]="emptyStateContext"
  [primaryAction]="{
    label: 'Create',
    handler: create.bind(this)
  }"
  [secondaryAction]="{
    label: secondaryActionLabel,
    handler: import.bind(this)
  }">
</app-empty-state>
```

### Multi-Tenant Empty State

```typescript
export class TenantAwareComponent {
  get emptyStateContext(): EmptyStateContext {
    const tenant = this.authService.getCurrentTenant();
    
    if (tenant.type === 'trial') {
      return EmptyStateContext.TRIAL_NO_DATA;
    }
    
    return EmptyStateContext.NO_DOSSIERS;
  }
  
  get upgradeAction(): ActionButtonConfig | undefined {
    const tenant = this.authService.getCurrentTenant();
    
    if (tenant.type === 'trial') {
      return {
        label: 'Upgrade to Premium',
        icon: 'star',
        handler: () => this.router.navigate(['/upgrade'])
      };
    }
    
    return undefined;
  }
}
```

## Testing Examples

### Unit Test

```typescript
describe('MyComponent', () => {
  it('should show filtered empty state when filters applied', () => {
    component.filters = { status: 'active' };
    fixture.detectChanges();
    
    expect(component.emptyStateContext).toBe(EmptyStateContext.NO_DOSSIERS_FILTERED);
  });
  
  it('should detect new users correctly', () => {
    component.items = [];
    component.page = { totalElements: 0 } as any;
    component.appliedFilters = [];
    
    expect(component.isNewUser).toBe(true);
  });
  
  it('should call handler when primary action clicked', () => {
    const spy = jasmine.createSpy('createHandler');
    component.primaryAction = { label: 'Create', handler: spy };
    
    const button = fixture.nativeElement.querySelector('.btn-primary-action');
    button.click();
    
    expect(spy).toHaveBeenCalled();
  });
});
```

### E2E Test

```typescript
describe('Empty State Flow', () => {
  it('should show new user empty state on first visit', () => {
    cy.visit('/dossiers');
    cy.get('app-empty-state').should('be.visible');
    cy.contains('Bienvenue').should('be.visible');
    cy.contains('premier dossier').should('be.visible');
  });
  
  it('should allow creating item from empty state', () => {
    cy.visit('/dossiers');
    cy.get('.btn-primary-action').click();
    cy.url().should('include', '/dossiers/create');
  });
  
  it('should show filtered empty state when no results', () => {
    cy.visit('/dossiers');
    cy.get('input[placeholder*="filter"]').type('nonexistent');
    cy.get('.btn-apply-filters').click();
    
    cy.get('app-empty-state').should('be.visible');
    cy.contains('Aucun dossier ne correspond').should('be.visible');
    cy.get('.btn-primary-action').contains('Réinitialiser').should('be.visible');
  });
});
```

## Best Practices

1. **Always provide context** - Use context-based configuration instead of generic messages
2. **Adapt for user level** - Show different content for new vs experienced users
3. **Provide clear actions** - Always include at least a primary action
4. **Use appropriate CTAs** - Match button labels to the action (specific > generic)
5. **Include help when needed** - Add help links for complex features
6. **Test accessibility** - Verify with screen readers and keyboard navigation
7. **Consider mobile** - Ensure touch targets are large enough
8. **Handle edge cases** - Account for permissions, errors, and loading states
