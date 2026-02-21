# Illustration Library - Quick Reference

Fast reference guide for using the illustration library.

## Quick Start

### 1. Import the Service

```typescript
import { IllustrationLibraryService } from '../components/illustrations';
```

### 2. Inject in Constructor

```typescript
constructor(private illustrationService: IllustrationLibraryService) {}
```

### 3. Get an Illustration

```typescript
this.illustration = this.illustrationService.getIllustration('dossier');
```

### 4. Display in Template

```html
<div [innerHTML]="illustration"></div>
```

## All Available Illustrations

Quick copy-paste names:

```typescript
// Business
'dossier'
'annonce'
'message'
'document'
'calendar'
'task'
'calendar-events'

// Search & Filter
'search'
'empty-search'

// System States
'activity'
'notification'
'no-data'
'favorites'

// Feedback & Status
'network-error'
'import-success'
'export-success'
'maintenance'
```

## Empty State Context Mapping

| Context Enum | Illustration Name |
|--------------|-------------------|
| `NO_DOSSIERS` | `dossier` |
| `NO_ANNONCES` | `annonce` |
| `NO_MESSAGES` | `message` |
| `NO_DOCUMENTS` | `document` |
| `NO_APPOINTMENTS` | `calendar` |
| `NO_TASKS` | `task` |
| `NO_SEARCH_RESULTS` | `search` |
| `NO_ACTIVITIES` | `activity` |
| `NO_NOTIFICATIONS` | `notification` |
| `NETWORK_ERROR` | `network-error` |
| `IMPORT_SUCCESS` | `import-success` |
| `EXPORT_SUCCESS` | `export-success` |
| `MAINTENANCE` | `maintenance` |
| `NO_DATA` | `no-data` |
| `EMPTY_SEARCH` | `empty-search` |
| `NO_FAVORITES` | `favorites` |
| `NO_CALENDAR_EVENTS` | `calendar-events` |

## Common Patterns

### Pattern 1: Empty List

```typescript
<app-empty-state 
  *ngIf="items.length === 0"
  [context]="EmptyStateContext.NO_DOSSIERS"
  [primaryAction]="{ label: 'Create', handler: onCreate }">
</app-empty-state>
```

### Pattern 2: Error State

```typescript
<app-empty-state 
  *ngIf="hasError"
  [context]="EmptyStateContext.NETWORK_ERROR"
  [primaryAction]="{ label: 'Retry', handler: onRetry }">
</app-empty-state>
```

### Pattern 3: Success Feedback

```typescript
<app-empty-state 
  *ngIf="success"
  [context]="EmptyStateContext.IMPORT_SUCCESS"
  [primaryAction]="{ label: 'View', handler: onView }">
</app-empty-state>
```

### Pattern 4: Standalone Illustration

```typescript
illustration = this.illustrationService.getIllustration('message');
```

```html
<div [innerHTML]="illustration" class="my-illustration"></div>
```

### Pattern 5: Conditional Context

```typescript
get context(): EmptyStateContext {
  if (this.hasError) return EmptyStateContext.NETWORK_ERROR;
  if (this.isFiltered) return EmptyStateContext.NO_DOSSIERS_FILTERED;
  return EmptyStateContext.NO_DOSSIERS;
}
```

## Styling Quick Tips

### Resize Illustration

```css
.my-illustration ::ng-deep svg {
  width: 150px;
  height: 150px;
}
```

### Disable Animations

```css
.no-animation ::ng-deep * {
  animation: none !important;
}
```

### Custom Background Color

```css
.custom-empty-state ::ng-deep circle[fill^="#"] {
  fill: your-color !important;
}
```

## API Cheatsheet

```typescript
// Get by name
getIllustration(name: string): SafeHtml | null

// Get by context
getIllustrationByContext(context: string): SafeHtml | null

// List all
getAllIllustrations(): IllustrationLibraryItem[]
```

## Color Palette

```css
/* Primary */
--purple-gradient: linear-gradient(135deg, #667eea, #764ba2);
--blue-gradient: linear-gradient(135deg, #4facfe, #00f2fe);
--pink-gradient: linear-gradient(135deg, #f093fb, #f5576c);

/* Accents */
--success: #48bb78;
--error: #f56565;
--warning: #ed8936;
--info: #4299e1;
```

## Accessibility

```css
/* Already included in all illustrations */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
```

## Responsive Breakpoints

```css
/* Desktop */
svg { width: 200px; height: 200px; }

/* Tablet */
@media (max-width: 1024px) {
  svg { width: 180px; height: 180px; }
}

/* Mobile */
@media (max-width: 768px) {
  svg { width: 160px; height: 160px; }
}

/* Small Mobile */
@media (max-width: 480px) {
  svg { width: 120px; height: 120px; }
}
```

## Common Issues

### Issue: Illustration not showing
**Solution**: Check that you're using `[innerHTML]` binding and SafeHtml type

### Issue: Animation not working
**Solution**: Verify no `.no-animation` class on parent elements

### Issue: Wrong size
**Solution**: Use CSS to override `::ng-deep svg { width: Xpx; height: Xpx; }`

### Issue: Colors don't match brand
**Solution**: Override gradients in the SVG or use CSS filters

## Best Practices

✅ **DO**:
- Use context-based empty states via EmptyStateComponent
- Provide primary action on empty states
- Respect user's reduced motion preferences
- Keep illustration sizes consistent across similar contexts

❌ **DON'T**:
- Don't modify illustration SVG inline (use service)
- Don't use multiple illustrations in one empty state
- Don't override animations without considering accessibility
- Don't use illustrations without context (title + message)

## Import Checklist

```typescript
// 1. Import service
import { IllustrationLibraryService } from '../components/illustrations';

// 2. Inject in constructor
constructor(private illustrationService: IllustrationLibraryService) {}

// 3. Get illustration
this.illustration = this.illustrationService.getIllustration('name');

// 4. Display in template
<div [innerHTML]="illustration"></div>

// OR use with EmptyStateComponent
<app-empty-state [context]="EmptyStateContext.NO_DOSSIERS"></app-empty-state>
```

## Full Documentation

For detailed documentation, see:
- [ILLUSTRATION_LIBRARY_README.md](./ILLUSTRATION_LIBRARY_README.md)
- [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)
- [Implementation Summary](../../../ILLUSTRATION_LIBRARY_IMPLEMENTATION.md)
