# LoadingSkeletonComponent

A reusable loading skeleton component with shimmer animation effect using CSS gradients. Provides multiple variants to match different content structures for better loading states UX.

## Features

- **Shimmer Animation**: Smooth gradient animation effect for visual feedback
- **Multiple Variants**: Pre-configured layouts for common UI patterns
- **Customizable**: Adjustable rows and columns for each variant
- **Responsive**: Adapts to different screen sizes

## Variants

### Card Variant
Displays skeleton for card-based layouts with avatar, title, subtitle, and content lines.

**Usage:**
```html
<app-loading-skeleton variant="card" [rows]="3"></app-loading-skeleton>
```

**Best for:** Dashboard cards, profile cards, content previews

---

### List Variant
Displays skeleton for list-based layouts with icon, title, subtitle, and action button.

**Usage:**
```html
<app-loading-skeleton variant="list" [rows]="5"></app-loading-skeleton>
```

**Best for:** Message lists, activity feeds, timeline views

---

### Table Variant
Displays skeleton for table layouts with headers and rows.

**Usage:**
```html
<app-loading-skeleton variant="table" [rows]="10" [columns]="8"></app-loading-skeleton>
```

**Best for:** Data tables, annonces list, dossiers list

---

### Form Variant
Displays skeleton for form layouts with labels, inputs, and action buttons.

**Usage:**
```html
<app-loading-skeleton variant="form" [rows]="6"></app-loading-skeleton>
```

**Best for:** Create/edit forms, settings pages

---

### Dashboard KPI Variant
Displays skeleton for KPI cards with title, value, and action button.

**Usage:**
```html
<app-loading-skeleton variant="dashboard-kpi"></app-loading-skeleton>
```

**Best for:** Dashboard KPI cards, metric displays

---

### Detail Variant
Displays skeleton for detail pages with header (back button, title, badge) and field rows.

**Usage:**
```html
<app-loading-skeleton variant="detail" [rows]="12"></app-loading-skeleton>
```

**Best for:** Detail pages, view pages

---

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `SkeletonVariant` | `'card'` | The layout variant to display |
| `rows` | `number` | `3` | Number of rows to display |
| `columns` | `number` | `8` | Number of columns (for table variant) |

## SkeletonVariant Type

```typescript
type SkeletonVariant = 'card' | 'list' | 'table' | 'form' | 'dashboard-kpi' | 'detail';
```

## Implementation Examples

### Dashboard Component
```html
<!-- KPI Cards -->
<div class="kpi-card">
  <app-loading-skeleton *ngIf="loading" variant="dashboard-kpi"></app-loading-skeleton>
  <div *ngIf="!loading">
    <!-- Actual content -->
  </div>
</div>

<!-- Recent Dossiers List -->
<app-loading-skeleton *ngIf="loadingRecent" variant="list" [rows]="5"></app-loading-skeleton>
```

### Annonces/Dossiers List
```html
<app-loading-skeleton *ngIf="loading" variant="table" [rows]="10" [columns]="8"></app-loading-skeleton>
```

### Detail Pages
```html
<app-loading-skeleton *ngIf="loading" variant="detail" [rows]="15"></app-loading-skeleton>
```

### Form Pages
```html
<app-loading-skeleton *ngIf="loading" variant="form" [rows]="8"></app-loading-skeleton>
```

### Messages/Activity Tab
```html
<app-loading-skeleton *ngIf="loadingMessages" variant="list" [rows]="5"></app-loading-skeleton>
```

### Appointments Tab
```html
<app-loading-skeleton *ngIf="loadingAppointments" variant="table" [rows]="5" [columns]="6"></app-loading-skeleton>
```

## Styling

The component uses CSS gradients and animations to create a shimmer effect:

```css
.skeleton-rectangle {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #f8f8f8 50%,
    #f0f0f0 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

## Responsive Behavior

The skeleton adapts to different screen sizes:

- On mobile (< 768px): Reduced padding, stacked layouts for detail rows
- On tablet/desktop: Full spacing and side-by-side layouts

## Best Practices

1. **Match Content Structure**: Choose the variant that best matches your actual content layout
2. **Row Count**: Set rows to approximately match the number of items users typically see
3. **Consistent Duration**: Keep loading skeleton visible for at least 300ms to avoid flashing
4. **Progressive Enhancement**: Show skeleton immediately, don't wait for API calls to start

## Migration from Spinner

Before (old spinner approach):
```html
<div *ngIf="loading" class="loading-state">
  <div class="spinner"></div>
  <p>Chargement...</p>
</div>
```

After (with skeleton):
```html
<app-loading-skeleton *ngIf="loading" variant="table" [rows]="10"></app-loading-skeleton>
```

Benefits:
- Better visual continuity
- Reduced perceived loading time
- More professional appearance
- Matches content structure
