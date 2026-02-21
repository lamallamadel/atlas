# Card Design System - Quick Reference

## Basic Card

```html
<div class="card">
  <h3 class="card__title">Title</h3>
  <div class="card__content">Content</div>
</div>
```

## Variants

| Class | Description |
|-------|-------------|
| `card--flat` | No shadow |
| `card--elevated` | Higher elevation |
| `card--outlined` | Emphasized border |
| `card--static` | No hover effects |
| `card--compact` | 16px padding |
| `card--comfortable` | 24px padding (default) |
| `card--spacious` | 32px padding |

## Semantic Colors

| Class | Use Case |
|-------|----------|
| `card--primary` | Primary actions, focus areas |
| `card--secondary` | Secondary information |
| `card--success` | Success states, completed items |
| `card--warning` | Warnings, important notices |
| `card--error` | Errors, critical alerts |
| `card--info` | Informational content |

## Active States

| Class | Effect |
|-------|--------|
| `card--active` | Primary inner glow |
| `card--accent-active` | Accent inner glow |
| `card--success-active` | Success inner glow |
| `active` | Same as `card--active` |
| `aria-selected="true"` | Same as `card--active` |

## Structure Elements

```html
<div class="card">
  <!-- Badge -->
  <div class="card__badge">New</div>
  
  <!-- Media -->
  <img src="..." alt="..." class="card__media">
  
  <!-- Header -->
  <div class="card__header">
    <div class="card__icon">
      <mat-icon>icon</mat-icon>
    </div>
    <div>
      <h3 class="card__title">Title</h3>
      <p class="card__subtitle">Subtitle</p>
    </div>
  </div>
  
  <!-- Content -->
  <div class="card__content">
    Content text
  </div>
  
  <!-- Footer -->
  <div class="card__footer">
    <span>Info</span>
    <div class="card__actions">
      <button>Action</button>
    </div>
  </div>
</div>
```

## Layouts

### Horizontal Card
```html
<div class="card card--horizontal">
  <img src="..." class="card__media">
  <div class="card__content">...</div>
</div>
```

### Clickable Card
```html
<div class="card card--clickable">
  <a href="...">...</a>
</div>
```

### Card Grid
```html
<div class="card-grid">
  <div class="card">...</div>
  <div class="card">...</div>
</div>

<!-- Variants -->
<div class="card-grid card-grid--2-col">...</div>
<div class="card-grid card-grid--3-col">...</div>
<div class="card-grid card-grid--4-col">...</div>
```

## Material Cards

Material cards automatically use the new design:

```html
<mat-card>
  <mat-card-header>
    <mat-card-title>Title</mat-card-title>
  </mat-card-header>
  <mat-card-content>Content</mat-card-content>
</mat-card>
```

Add classes for active state:
```html
<mat-card class="active">...</mat-card>
<mat-card [attr.aria-selected]="true">...</mat-card>
```

## Design Tokens

| Property | Value | Variable |
|----------|-------|----------|
| Border radius | 12px | `var(--radius-xl)` |
| Border | 1px solid | `var(--color-neutral-200)` |
| Padding | 24px | `var(--spacing-6)` |
| Shadow (base) | shadow-2 | `var(--shadow-2)` |
| Shadow (hover) | shadow-4 | `var(--shadow-4)` |
| Transition | 200ms | `var(--duration-normal)` |

## Hover Effects

- **Elevation**: shadow-2 → shadow-4
- **Lift**: translateY(-2px)
- **Timing**: 200ms ease-in-out

## Focus States

- **Outline**: 2px solid primary
- **Offset**: 2px
- **Ring**: 4px primary-alpha-20

## Accessibility Checklist

- ✅ Use semantic HTML (`<article>`, proper headings)
- ✅ Include alt text for images
- ✅ Add ARIA labels for interactive cards
- ✅ Ensure keyboard navigation works
- ✅ Test with screen readers
- ✅ Verify color contrast (WCAG AA)
- ✅ Check touch target sizes (40x40px minimum)

## Dark Theme

Cards automatically adapt to dark theme when using `.dark-theme` class on `<body>`.

## Common Patterns

### Property Card
```html
<div class="card card--primary">
  <div class="card__badge">For Sale</div>
  <img src="property.jpg" alt="Property" class="card__media">
  <div class="card__header">
    <h3 class="card__title">Luxury Apartment</h3>
    <p class="card__subtitle">Paris, France</p>
  </div>
  <div class="card__content">
    <p>3 bed, 2 bath, 120m²</p>
  </div>
  <div class="card__footer">
    <span>€350,000</span>
    <div class="card__actions">
      <button mat-icon-button><mat-icon>favorite</mat-icon></button>
      <button mat-icon-button><mat-icon>share</mat-icon></button>
    </div>
  </div>
</div>
```

### Status Card
```html
<div class="card card--success card--success-active">
  <div class="card__header">
    <div class="card__icon">
      <mat-icon>check_circle</mat-icon>
    </div>
    <h3 class="card__title">Completed</h3>
  </div>
  <div class="card__content">
    All tasks completed successfully.
  </div>
</div>
```

### Metric Card
```html
<div class="card card--flat card--compact">
  <p class="card__subtitle">Total Sales</p>
  <h2 class="card__title">€1,250,000</h2>
  <p class="card__content">+15% from last month</p>
</div>
```

## Tips

1. **Combine classes**: `card card--primary card--elevated`
2. **Use BEM naming**: `card__element--modifier`
3. **Material cards**: Add custom classes to `<mat-card>` for variants
4. **Grid responsive**: Cards adjust automatically in card-grid
5. **Motion**: Respects `prefers-reduced-motion` automatically
