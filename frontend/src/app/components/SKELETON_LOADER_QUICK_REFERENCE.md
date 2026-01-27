# Skeleton Loader - Quick Reference

⚡ **Premium skeleton screens with GPU-accelerated shimmer effects**

## Quick Start

```html
<app-skeleton-loader 
  *ngIf="loading" 
  variant="table" 
  [rows]="10">
</app-skeleton-loader>
```

## Variants Cheat Sheet

| Variant | Use Case | Example |
|---------|----------|---------|
| `card` | Property cards, user cards | Annonces grid |
| `list` | Contact lists, notifications | Recent dossiers |
| `table` | Data tables, spreadsheets | Annonces table |
| `form` | Forms, settings | Create annonce |
| `dashboard-kpi` | KPI widgets, metrics | Dashboard cards |
| `detail` | Detail pages, profiles | Dossier detail |
| `grid` | Photo galleries, products | Property gallery |
| `message` | Chat, messaging | WhatsApp thread |
| `timeline` | Activity feeds, history | Activity log |

## Common Patterns

### Page Load
```html
<app-skeleton-loader 
  *ngIf="loading" 
  variant="table" 
  [rows]="15" 
  [columns]="8">
</app-skeleton-loader>

<div *ngIf="!loading">
  <!-- Content -->
</div>
```

### Dashboard Widget
```html
<mat-card>
  <mat-card-content>
    <app-skeleton-loader 
      *ngIf="kpi.loading" 
      variant="dashboard-kpi">
    </app-skeleton-loader>
    
    <div *ngIf="!kpi.loading">
      {{ kpi.value }}
    </div>
  </mat-card-content>
</mat-card>
```

### List Items
```html
<app-skeleton-loader 
  *ngIf="loading" 
  variant="list" 
  [rows]="8">
</app-skeleton-loader>

<div *ngIf="!loading">
  <div *ngFor="let item of items">
    <!-- Item content -->
  </div>
</div>
```

## Props Quick Reference

```typescript
variant: SkeletonVariant   // Required: Layout type
rows: number = 3            // Optional: Number of items
columns: number = 8         // Optional: Table columns only
animate: boolean = true     // Optional: Enable shimmer
```

## Real Examples

### Annonces Page
```html
<app-skeleton-loader 
  *ngIf="loading" 
  variant="table" 
  [rows]="10" 
  [columns]="8" 
  aria-label="Chargement des annonces">
</app-skeleton-loader>
```

### Dossiers Page (List)
```html
<app-skeleton-loader 
  *ngIf="loading && viewMode === 'list'" 
  variant="table" 
  [rows]="10" 
  [columns]="8">
</app-skeleton-loader>
```

### Dossiers Page (Mobile)
```html
<app-skeleton-loader 
  *ngIf="loading" 
  variant="card" 
  [rows]="5">
</app-skeleton-loader>
```

### Dashboard KPIs
```html
<app-skeleton-loader 
  *ngIf="kpiCards[key].loading" 
  variant="dashboard-kpi">
</app-skeleton-loader>
```

### Dashboard Recent List
```html
<app-skeleton-loader 
  *ngIf="loadingRecent" 
  variant="list" 
  [rows]="5">
</app-skeleton-loader>
```

## Theme Colors

Automatically adapts to theme:

```css
/* Light Mode */
--skeleton-base: #e8e8e8
--skeleton-shimmer: #f5f5f5
--skeleton-highlight: #ffffff

/* Dark Mode */
--skeleton-base: #2a2a2a
--skeleton-shimmer: #383838
--skeleton-highlight: #4a4a4a
```

## Performance

- ✅ GPU-accelerated (`transform: translateX()`)
- ✅ 60fps animations
- ✅ OnPush change detection
- ✅ Reduced motion support
- ✅ Hardware-accelerated (`will-change: transform`)

## Accessibility

```html
<!-- All skeletons include -->
role="status"
aria-live="polite"
aria-label="Chargement en cours"

<!-- Plus screen reader text -->
<span class="sr-only">
  Chargement des données en cours...
</span>
```

## Best Practices

### ✅ Do
- Match skeleton to actual layout
- Use 8-15 rows for tables
- Use 3-6 rows for cards/lists
- Provide aria-label
- Hide skeleton when loaded

### ❌ Don't
- Mix multiple variants in same view
- Use more than 20 rows
- Forget loading state cleanup
- Override animation timing
- Nest skeletons

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No shimmer | Check `animate` prop is `true` |
| Wrong colors | Verify `body.dark-theme` class |
| Performance lag | Reduce number of rows |
| Not responsive | Check variant matches viewport |

## Migration from LoadingSkeletonComponent

```diff
- <app-loading-skeleton variant="table">
+ <app-skeleton-loader variant="table">
```

All props remain the same!

## TypeScript

```typescript
import { SkeletonLoaderComponent } from './components/skeleton-loader.component';

type SkeletonVariant = 
  | 'card' 
  | 'list' 
  | 'table' 
  | 'form' 
  | 'dashboard-kpi' 
  | 'detail' 
  | 'grid' 
  | 'message' 
  | 'timeline';
```

## Animation Details

**Duration**: 2s (optimized for smooth, not distracting)  
**Easing**: `ease-in-out` (natural acceleration)  
**Direction**: Left to right (`translateX(-100% → 100%)`)  
**Hardware**: GPU-accelerated  

## Browser Support

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

## Related

- `EmptyStateComponent` - No data states
- `LoadingButtonComponent` - Button loaders
- `ProgressBarComponent` - Linear progress

---

**Need help?** See [SKELETON_LOADER_README.md](./SKELETON_LOADER_README.md) for full documentation.
