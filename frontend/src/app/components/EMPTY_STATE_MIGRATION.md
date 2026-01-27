# Empty State Migration Guide

This guide helps you migrate from the legacy empty state implementation to the new context-based system with illustrations and enhanced features.

## Table of Contents
1. [Why Migrate?](#why-migrate)
2. [Migration Checklist](#migration-checklist)
3. [Step-by-Step Migration](#step-by-step-migration)
4. [Common Patterns](#common-patterns)
5. [Troubleshooting](#troubleshooting)

## Why Migrate?

### Benefits of the New System

1. **Better UX**: Rich SVG illustrations with animations
2. **Contextual Content**: Pre-configured messages for common scenarios
3. **User Adaptation**: Different content for new vs. experienced users
4. **Enhanced CTAs**: Support for primary, secondary, and help link actions
5. **Consistency**: Standardized empty states across the application
6. **Accessibility**: Improved ARIA support and keyboard navigation
7. **Responsive**: Better mobile experience out of the box

### What's New?

- `EmptyStateContext` enum for predefined scenarios
- `EmptyStateIllustrationsService` with animated SVG illustrations
- `isNewUser` property for adaptive content
- `helpLink` for contextual guidance
- Icon support in action buttons
- Smooth fade-in animations

## Migration Checklist

Before migrating, ensure:

- [ ] You understand your current empty state usage
- [ ] You've identified which context best matches your use case
- [ ] You know if your users should be detected as "new"
- [ ] You have handlers for primary and secondary actions
- [ ] You've reviewed the new API in `EMPTY_STATE_README.md`

## Step-by-Step Migration

### Level 1: Simple Message Upgrade (No Breaking Changes)

**Before:**
```html
<app-empty-state 
  message="Aucune annonce trouvée"
  subtext="Commencez par créer votre première annonce.">
</app-empty-state>
```

**After (still works, no changes needed):**
```html
<app-empty-state 
  message="Aucune annonce trouvée"
  subtext="Commencez par créer votre première annonce.">
</app-empty-state>
```

✅ **Result**: Works as before (backwards compatible)

### Level 2: Add Context for Illustrations

**Before:**
```html
<app-empty-state 
  message="Aucune annonce trouvée"
  subtext="Commencez par créer votre première annonce.">
</app-empty-state>
```

**After:**
```typescript
// Component
import { EmptyStateContext } from '../../services/empty-state-illustrations.service';

export class AnnoncesComponent {
  EmptyStateContext = EmptyStateContext;
}
```

```html
<app-empty-state 
  [context]="EmptyStateContext.NO_ANNONCES">
</app-empty-state>
```

✅ **Result**: Gets illustration and pre-configured messages

### Level 3: Add Actions

**Before:**
```html
<app-empty-state 
  message="Aucune annonce trouvée">
</app-empty-state>
```

**After:**
```typescript
// Component
createAnnonce(): void {
  // Your create logic
}

openImport(): void {
  // Your import logic
}
```

```html
<app-empty-state 
  [context]="EmptyStateContext.NO_ANNONCES"
  [primaryAction]="{
    label: 'Créer une annonce',
    handler: createAnnonce.bind(this)
  }"
  [secondaryAction]="{
    label: 'Importer',
    handler: openImport.bind(this)
  }">
</app-empty-state>
```

✅ **Result**: Gets actions with proper styling and icons

### Level 4: Add User Adaptation

**Before:**
```html
<app-empty-state 
  message="Aucune annonce trouvée">
</app-empty-state>
```

**After:**
```typescript
// Component
get isNewUser(): boolean {
  return this.annonces.length === 0 
    && this.page?.totalElements === 0 
    && !this.hasAppliedFilters;
}
```

```html
<app-empty-state 
  [context]="EmptyStateContext.NO_ANNONCES"
  [isNewUser]="isNewUser"
  [primaryAction]="primaryAction"
  [secondaryAction]="secondaryAction">
</app-empty-state>
```

✅ **Result**: Shows different messages for new vs. experienced users

### Level 5: Full Migration with Conditional Context

**Before:**
```typescript
get emptyStateMessage(): string {
  return this.appliedFilters.length > 0
    ? 'Aucun dossier ne correspond aux filtres'
    : 'Vous n\'avez encore aucun dossier';
}

get emptyStateSubtext(): string {
  return this.appliedFilters.length > 0
    ? 'Essayez de modifier ou réinitialiser les filtres.'
    : '';
}

get emptyStatePrimaryAction(): ActionButtonConfig {
  return {
    label: 'Créer un dossier',
    handler: () => this.createDossier()
  };
}

get emptyStateSecondaryAction(): ActionButtonConfig | undefined {
  return this.appliedFilters.length > 0
    ? { label: 'Réinitialiser', handler: () => this.clearFilters() }
    : undefined;
}
```

```html
<app-empty-state 
  [message]="emptyStateMessage"
  [subtext]="emptyStateSubtext"
  [primaryAction]="emptyStatePrimaryAction"
  [secondaryAction]="emptyStateSecondaryAction">
</app-empty-state>
```

**After:**
```typescript
import { EmptyStateContext } from '../../services/empty-state-illustrations.service';

export class DossiersComponent {
  EmptyStateContext = EmptyStateContext;

  get emptyStateContext(): EmptyStateContext {
    return this.appliedFilters.length > 0
      ? EmptyStateContext.NO_DOSSIERS_FILTERED
      : EmptyStateContext.NO_DOSSIERS;
  }

  get isNewUser(): boolean {
    return this.dossiers.length === 0 
      && this.appliedFilters.length === 0 
      && this.page?.totalElements === 0;
  }

  get emptyStatePrimaryAction(): ActionButtonConfig {
    return {
      label: 'Créer un dossier',
      handler: () => this.createDossier()
    };
  }

  get emptyStateSecondaryAction(): ActionButtonConfig {
    return this.appliedFilters.length > 0
      ? { label: 'Réinitialiser', handler: () => this.clearFilters() }
      : { label: 'Importer', handler: () => this.openImport() };
  }
}
```

```html
<app-empty-state 
  [context]="emptyStateContext"
  [isNewUser]="isNewUser"
  [primaryAction]="emptyStatePrimaryAction"
  [secondaryAction]="emptyStateSecondaryAction">
</app-empty-state>
```

✅ **Result**: Full context-based implementation with illustrations and user adaptation

## Common Patterns

### Pattern 1: Filtered vs. Unfiltered

```typescript
// OLD
get emptyMessage(): string {
  return this.hasFilters ? 'No results' : 'No items';
}

// NEW
get emptyStateContext(): EmptyStateContext {
  return this.hasFilters 
    ? EmptyStateContext.NO_DOSSIERS_FILTERED
    : EmptyStateContext.NO_DOSSIERS;
}
```

### Pattern 2: Dynamic Actions Based on State

```typescript
// OLD
get primaryAction(): ActionButtonConfig {
  return { 
    label: this.hasFilters ? 'Clear' : 'Create',
    handler: this.hasFilters ? this.clear : this.create
  };
}

// NEW
get emptyStatePrimaryAction(): ActionButtonConfig {
  return {
    label: 'Create Item',
    handler: () => this.create()
  };
}

get emptyStateSecondaryAction(): ActionButtonConfig {
  return this.hasFilters
    ? { label: 'Clear Filters', handler: () => this.clear() }
    : { label: 'Import', handler: () => this.import() };
}
```

### Pattern 3: Permission-Aware Empty States

```typescript
// OLD
get canCreate(): boolean {
  return this.hasPermission('create');
}

get emptyMessage(): string {
  return this.canCreate 
    ? 'No items. Create one!'
    : 'No items. Contact admin.';
}

// NEW
get emptyStateContext(): EmptyStateContext {
  return EmptyStateContext.NO_ITEMS;
}

get emptyStatePrimaryAction(): ActionButtonConfig | undefined {
  if (!this.hasPermission('create')) {
    return undefined;
  }
  return {
    label: 'Create Item',
    handler: () => this.create()
  };
}

get emptyStateSecondaryAction(): ActionButtonConfig {
  return this.hasPermission('create')
    ? { label: 'Import', handler: () => this.import() }
    : { label: 'Request Access', handler: () => this.requestAccess() };
}
```

## Troubleshooting

### Issue: Context enum not available in template

**Error:**
```
Cannot read property 'NO_DOSSIERS' of undefined
```

**Solution:**
```typescript
// Component
export class MyComponent {
  // Expose enum to template
  EmptyStateContext = EmptyStateContext;
}
```

```html
<!-- Template -->
<app-empty-state [context]="EmptyStateContext.NO_DOSSIERS">
```

### Issue: Illustration not showing

**Check:**
1. Is `context` property set?
2. Is `DomSanitizer` injected in service?
3. Check browser console for security errors

**Solution:**
```typescript
// Service should have
constructor(private sanitizer: DomSanitizer) {}

// Component should use
[context]="EmptyStateContext.NO_DOSSIERS"  // Not a string!
```

### Issue: Actions not firing

**Problem:**
```typescript
// Missing .bind(this)
[primaryAction]="{ label: 'Create', handler: this.create }"
```

**Solution:**
```typescript
// Add .bind(this)
[primaryAction]="{ label: 'Create', handler: this.create.bind(this) }"

// Or use arrow function
[primaryAction]="{ label: 'Create', handler: () => this.create() }"
```

### Issue: "Cannot read property 'totalElements' of null"

**Problem:**
```typescript
get isNewUser(): boolean {
  return this.page.totalElements === 0;  // page might be null
}
```

**Solution:**
```typescript
get isNewUser(): boolean {
  return this.page?.totalElements === 0;  // Use optional chaining
}
```

### Issue: Custom illustration not showing

**Problem:**
```typescript
customIllustration = '<svg>...</svg>';  // String, not SafeHtml
```

**Solution:**
```typescript
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

constructor(private sanitizer: DomSanitizer) {
  this.customIllustration = this.sanitizer.bypassSecurityTrustHtml('<svg>...</svg>');
}
```

### Issue: Animations not working

**Check:**
1. Is user in reduced motion mode?
2. Are CSS animations being overridden?
3. Check browser DevTools for CSS conflicts

**Solution:**
```css
/* Don't override component animations */
app-empty-state {
  /* Remove this: */
  /* animation: none !important; */
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  app-empty-state * {
    animation: none !important;
  }
}
```

## Migration Testing Checklist

After migration, verify:

- [ ] Empty state displays correctly
- [ ] Illustration loads and animates
- [ ] Primary action button works
- [ ] Secondary action button works (if present)
- [ ] Help link opens in new tab (if present)
- [ ] Content adapts for new vs. experienced users
- [ ] Mobile responsive layout works
- [ ] Keyboard navigation works
- [ ] Screen reader announces content
- [ ] Reduced motion is respected
- [ ] Dark mode (if supported) works

## Rollback Plan

If you need to rollback:

```html
<!-- Remove context-based properties -->
<app-empty-state 
  message="Your old message"
  subtext="Your old subtext"
  [primaryAction]="oldPrimaryAction">
</app-empty-state>
```

The component is fully backwards compatible, so removing the new properties will revert to legacy behavior.

## Need Help?

1. Check `EMPTY_STATE_README.md` for full API documentation
2. Review `EMPTY_STATE_EXAMPLES.md` for usage examples
3. Look at reference implementations:
   - `dossiers.component.ts` (full implementation)
   - `annonces.component.ts` (full implementation)
   - `outbound-message-list.component.ts` (simple implementation)

## Migration Timeline Suggestion

1. **Week 1**: Migrate high-traffic pages (dashboard, main lists)
2. **Week 2**: Migrate secondary pages (detail views, settings)
3. **Week 3**: Migrate edge cases (permission-based, conditional states)
4. **Week 4**: Final polish and user testing

## Success Metrics

Track these metrics to measure migration success:

- User engagement with empty state CTAs
- Time to first action for new users
- Support tickets related to "how to get started"
- User satisfaction scores
- Bounce rate on empty state pages
