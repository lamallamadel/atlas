# Premium Skeleton Loader Component

A high-performance skeleton screen loader with GPU-accelerated shimmer effects and comprehensive layout variants.

## Features

✨ **Premium Shimmer Effect**: GPU-accelerated animations using CSS transforms  
🎨 **Theme Support**: Automatic light/dark mode adaptation  
📱 **Responsive**: Mobile-optimized with adaptive breakpoints  
♿ **Accessible**: WCAG AA compliant with proper ARIA labels  
🚀 **Performance**: Hardware-accelerated animations with reduced motion support  
🎭 **9 Variants**: Matching real application layouts  

## Installation

The component is already registered in `AppModule`. Simply import and use it in your templates.

## Basic Usage

```html
<!-- Simple table skeleton -->
<app-skeleton-loader 
  *ngIf="loading" 
  variant="table" 
  [rows]="10" 
  [columns]="8">
</app-skeleton-loader>

<!-- Card list skeleton -->
<app-skeleton-loader 
  *ngIf="loading" 
  variant="card" 
  [rows]="5">
</app-skeleton-loader>

<!-- Dashboard KPI skeleton -->
<app-skeleton-loader 
  *ngIf="loading" 
  variant="dashboard-kpi">
</app-skeleton-loader>
```

## Available Variants

### 1. Card Variant (`variant="card"`)

Perfect for: Property listings, user cards, product cards

```html
<app-skeleton-loader 
  variant="card" 
  [rows]="3" 
  [animate]="true">
</app-skeleton-loader>
```

**Features:**
- Avatar placeholder
- Title and subtitle
- Body lines
- Footer actions

### 2. List Variant (`variant="list"`)

Perfect for: Contact lists, message threads, notifications

```html
<app-skeleton-loader 
  variant="list" 
  [rows]="10">
</app-skeleton-loader>
```

**Features:**
- Icon/avatar on left
- Primary and secondary text
- Action button on right

### 3. Table Variant (`variant="table"`)

Perfect for: Data tables, grids

```html
<app-skeleton-loader 
  variant="table" 
  [rows]="15" 
  [columns]="8">
</app-skeleton-loader>
```

**Features:**
- Header row with distinct styling
- Multiple data rows
- Fully customizable columns

### 4. Form Variant (`variant="form"`)

Perfect for: Forms, settings pages

```html
<app-skeleton-loader 
  variant="form" 
  [rows]="5">
</app-skeleton-loader>
```

**Features:**
- Label + input field pairs
- Action buttons at bottom

### 5. Dashboard KPI Variant (`variant="dashboard-kpi"`)

Perfect for: KPI cards, metric widgets

```html
<app-skeleton-loader 
  variant="dashboard-kpi">
</app-skeleton-loader>
```

**Features:**
- Header with icon placeholder
- Large number display area
- Footer action button

### 6. Detail Variant (`variant="detail"`)

Perfect for: Detail pages, profile views

```html
<app-skeleton-loader 
  variant="detail" 
  [rows]="8">
</app-skeleton-loader>
```

**Features:**
- Back button and title header
- Label-value pairs
- Badge placeholder

### 7. Grid Variant (`variant="grid"`)

Perfect for: Image galleries, product grids

```html
<app-skeleton-loader 
  variant="grid" 
  [rows]="6">
</app-skeleton-loader>
```

**Features:**
- Large image placeholder
- Title, subtitle, and price
- Responsive grid layout

### 8. Message Variant (`variant="message"`)

Perfect for: Chat interfaces, messaging

```html
<app-skeleton-loader 
  variant="message" 
  [rows]="8">
</app-skeleton-loader>
```

**Features:**
- Alternating left/right messages
- Avatar placeholders
- Message bubble styling

### 9. Timeline Variant (`variant="timeline"`)

Perfect for: Activity feeds, history logs

```html
<app-skeleton-loader 
  variant="timeline" 
  [rows]="5">
</app-skeleton-loader>
```

**Features:**
- Vertical timeline connector
- Timestamp dots
- Event cards

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `SkeletonVariant` | `'card'` | Layout variant to use |
| `rows` | `number` | `3` | Number of rows to display |
| `columns` | `number` | `8` | Number of columns (table variant only) |
| `animate` | `boolean` | `true` | Enable shimmer animation |

## Shimmer Animation

The component uses a premium GPU-accelerated shimmer effect:

```css
/* Shimmer uses CSS transforms for 60fps performance */
.skeleton-animated .skeleton-rectangle::before {
  transform: translateX(-100%);
  animation: shimmer-wave 2s ease-in-out infinite;
  will-change: transform;
}

@keyframes shimmer-wave {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

**Performance Benefits:**
- Hardware-accelerated via GPU
- 60fps smooth animations
- Minimal CPU usage
- No layout reflows

## Theme Support

The component automatically adapts to light and dark themes:

```css
/* Light theme (default) */
:host-context(body:not(.dark-theme)) .skeleton-rectangle {
  --skeleton-base: #e8e8e8;
  --skeleton-shimmer: #f5f5f5;
  --skeleton-highlight: #ffffff;
}

/* Dark theme */
:host-context(body.dark-theme) .skeleton-rectangle {
  --skeleton-base: #2a2a2a;
  --skeleton-shimmer: #383838;
  --skeleton-highlight: #4a4a4a;
}
```

## Accessibility

The component follows WCAG AA guidelines:

```html
<div role="status" aria-live="polite" aria-label="Chargement en cours">
  <span class="sr-only">Chargement des données en cours...</span>
  <!-- Skeleton content -->
</div>
```

**Features:**
- Screen reader announcements
- Proper ARIA roles
- Reduced motion support
- Semantic HTML

## Reduced Motion Support

Automatically disables animations for users who prefer reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .skeleton-animated .skeleton-rectangle::before {
    animation: none;
  }
  
  .skeleton-animated .skeleton-rectangle {
    animation: none;
  }
}
```

## Examples in Real Components

### Annonces List Page

```typescript
// annonces.component.ts
loading = false;

loadAnnonces(): void {
  this.loading = true;
  this.annonceService.list().subscribe({
    next: (data) => {
      this.annonces = data;
      this.loading = false;
    }
  });
}
```

```html
<!-- annonces.component.html -->
<app-skeleton-loader 
  *ngIf="loading" 
  variant="table" 
  [rows]="10" 
  [columns]="8" 
  aria-label="Chargement des annonces">
</app-skeleton-loader>

<app-generic-table 
  *ngIf="!loading" 
  [data]="annonces">
</app-generic-table>
```

### Dashboard KPIs

```html
<!-- dashboard.component.html -->
<mat-card *ngFor="let kpi of kpiCards">
  <mat-card-content>
    <app-skeleton-loader 
      *ngIf="kpi.loading" 
      variant="dashboard-kpi">
    </app-skeleton-loader>
    
    <div *ngIf="!kpi.loading" class="kpi-content">
      {{ kpi.value }}
    </div>
  </mat-card-content>
</mat-card>
```

### Dossier Details

```html
<!-- dossier-detail.component.html -->
<app-skeleton-loader 
  *ngIf="loading" 
  variant="detail" 
  [rows]="12">
</app-skeleton-loader>

<div *ngIf="!loading" class="dossier-details">
  <!-- Actual content -->
</div>
```

## Best Practices

### ✅ Do

- Match skeleton variant to actual layout
- Set appropriate row/column counts
- Use consistent loading states
- Provide descriptive ARIA labels
- Test with screen readers

### ❌ Don't

- Mix multiple skeleton variants in same view
- Use too many rows (overwhelming)
- Forget to hide skeleton when loaded
- Nest skeleton components
- Override animation timing (optimized for 60fps)

## Performance Tips

1. **Use OnPush Change Detection**: The component already uses `ChangeDetectionStrategy.OnPush`

2. **Lazy Load Heavy Components**: Only show skeletons while loading

3. **Optimize Row Counts**: 
   - Tables: 10-15 rows max
   - Lists: 8-12 rows
   - Cards: 3-6 rows
   - Grids: 6-9 rows

4. **Disable Animation When Not Visible**: 
   ```html
   <app-skeleton-loader [animate]="isVisible">
   ```

## Browser Support

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

**Required CSS Features:**
- CSS Custom Properties
- CSS Grid
- CSS Transforms
- CSS Animations
- `prefers-reduced-motion` media query

## Customization

### Adjust Animation Speed

To customize animation speed, override the CSS variable:

```css
/* Global override in styles.css */
.skeleton-animated .skeleton-rectangle::before {
  animation-duration: 1.5s; /* Default: 2s */
}
```

### Custom Colors

Override theme colors:

```css
:host-context(body) .skeleton-rectangle {
  --skeleton-base: #f0f0f0;
  --skeleton-shimmer: #f8f8f8;
  --skeleton-highlight: #ffffff;
}
```

## Migration from LoadingSkeletonComponent

If you're migrating from the old `LoadingSkeletonComponent`:

1. Update imports:
```typescript
// Old
import { LoadingSkeletonComponent } from './components/loading-skeleton.component';

// New
import { SkeletonLoaderComponent } from './components/skeleton-loader.component';
```

2. Update templates:
```html
<!-- Old -->
<app-loading-skeleton variant="table"></app-loading-skeleton>

<!-- New -->
<app-skeleton-loader variant="table"></app-skeleton-loader>
```

All props and variants remain compatible.

## Troubleshooting

### Animation Not Working

**Issue**: Shimmer effect not visible

**Solutions**:
1. Check `animate` prop is `true`
2. Verify browser supports CSS transforms
3. Check for `prefers-reduced-motion` setting
4. Inspect element for animation styles

### Dark Theme Colors Not Applied

**Issue**: Skeleton shows light colors in dark mode

**Solutions**:
1. Verify `body.dark-theme` class is present
2. Check CSS specificity conflicts
3. Ensure theme stylesheet is loaded

### Performance Issues

**Issue**: Animation causes frame drops

**Solutions**:
1. Reduce number of skeleton rows
2. Check for layout thrashing elsewhere
3. Verify GPU acceleration is enabled
4. Use Chrome DevTools Performance tab

## TypeScript Types

```typescript
export type SkeletonVariant = 
  | 'card' 
  | 'list' 
  | 'table' 
  | 'form' 
  | 'dashboard-kpi' 
  | 'detail' 
  | 'grid' 
  | 'message' 
  | 'timeline';

interface SkeletonLoaderProps {
  variant: SkeletonVariant;
  rows?: number;
  columns?: number;
  animate?: boolean;
}
```

## Related Components

- `EmptyStateComponent` - For when there's no data
- `ErrorStateComponent` - For error states
- `LoadingButtonComponent` - Inline loading states
- `ProgressBarComponent` - Linear progress indication

## Credits

Designed and developed for real estate CRM application with focus on:
- Premium UX
- Performance optimization
- Accessibility compliance
- Theme consistency
