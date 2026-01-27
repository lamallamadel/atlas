# Card Design System

## Overview

The card design system provides a comprehensive set of styles for creating visually rich, depth-enhanced card components with excellent user experience and accessibility.

## Visual Design Principles

### 1. **Visual Depth**
- **Border Radius**: 12px (`var(--radius-xl)`) for modern, approachable aesthetics
- **Subtle Border**: 1px solid neutral-200 for clear component boundaries
- **Shadow Elevation**: Base shadow-2, elevates to shadow-4 on hover
- **Gradient Background**: Subtle top-to-bottom gradient (white → neutral-50)

### 2. **Interactive States**
- **Hover State**: 
  - Elevation increase (shadow-2 → shadow-4)
  - Lift effect (translateY -2px)
  - Smooth 200ms transition
- **Active State**:
  - Inner glow with accent color
  - Border color change to indicate selection
- **Focus State**:
  - 2px solid primary outline with offset
  - Visible focus ring for accessibility

### 3. **Generous Hit Areas**
- Default padding: 24px (`var(--spacing-6)`)
- Comfortable touch targets for mobile
- Optimized for user interaction

## Usage

### Basic Card

```html
<div class="card">
  <div class="card__header">
    <h3 class="card__title">Card Title</h3>
  </div>
  <div class="card__content">
    Card content goes here.
  </div>
</div>
```

### Material Card

Material Design cards automatically receive the new visual design:

```html
<mat-card>
  <mat-card-header>
    <mat-card-title>Card Title</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    Content here
  </mat-card-content>
</mat-card>
```

## Card Variants

### Style Variants

#### **Flat Card**
No shadow, minimal elevation
```html
<div class="card card--flat">...</div>
```

#### **Elevated Card**
Higher elevation with stronger shadow
```html
<div class="card card--elevated">...</div>
```

#### **Outlined Card**
Emphasized border with no shadow
```html
<div class="card card--outlined">...</div>
```

#### **Static Card**
Non-interactive, no hover effects
```html
<div class="card card--static">...</div>
```

### Padding Variants

#### **Compact**
16px padding for dense layouts
```html
<div class="card card--compact">...</div>
```

#### **Comfortable** (Default)
24px padding for balanced spacing
```html
<div class="card card--comfortable">...</div>
```

#### **Spacious**
32px padding for airy layouts
```html
<div class="card card--spacious">...</div>
```

### Semantic Colors

#### **Primary Card**
```html
<div class="card card--primary">...</div>
```

#### **Secondary Card**
```html
<div class="card card--secondary">...</div>
```

#### **Success Card**
```html
<div class="card card--success">...</div>
```

#### **Warning Card**
```html
<div class="card card--warning">...</div>
```

#### **Error Card**
```html
<div class="card card--error">...</div>
```

#### **Info Card**
```html
<div class="card card--info">...</div>
```

### Active/Selected States

#### **Active Primary**
Inner glow with primary color
```html
<div class="card card--active">...</div>
<!-- or -->
<div class="card active">...</div>
<!-- or -->
<div class="card" aria-selected="true">...</div>
```

#### **Active Accent**
Inner glow with secondary/accent color
```html
<div class="card card--accent-active">...</div>
```

#### **Active Success**
Inner glow with success color
```html
<div class="card card--success-active">...</div>
```

## Card Structure

### Card Elements

#### **Header**
```html
<div class="card__header">
  <div class="card__icon">
    <mat-icon>home</mat-icon>
  </div>
  <div>
    <h3 class="card__title">Property Name</h3>
    <p class="card__subtitle">Location details</p>
  </div>
</div>
```

#### **Content**
```html
<div class="card__content">
  <p>Main content text goes here.</p>
</div>
```

#### **Footer**
```html
<div class="card__footer">
  <span>Footer info</span>
  <div class="card__actions">
    <button mat-button>Action</button>
  </div>
</div>
```

#### **Media**
```html
<img src="image.jpg" alt="Description" class="card__media">
```

#### **Badge**
```html
<div class="card__badge">New</div>
```

### Complete Example

```html
<div class="card card--primary">
  <div class="card__badge">Featured</div>
  
  <img src="property.jpg" alt="Property" class="card__media">
  
  <div class="card__header">
    <div class="card__icon">
      <mat-icon>home</mat-icon>
    </div>
    <div>
      <h3 class="card__title">Luxury Apartment</h3>
      <p class="card__subtitle">Paris, France</p>
    </div>
  </div>
  
  <div class="card__content">
    <p>Beautiful 3-bedroom apartment with stunning views.</p>
  </div>
  
  <div class="card__footer">
    <span>€350,000</span>
    <div class="card__actions">
      <button mat-icon-button>
        <mat-icon>favorite</mat-icon>
      </button>
      <button mat-icon-button>
        <mat-icon>share</mat-icon>
      </button>
    </div>
  </div>
</div>
```

## Card Layouts

### Horizontal Card

```html
<div class="card card--horizontal">
  <img src="image.jpg" alt="Description" class="card__media">
  <div class="card__content">
    <h3 class="card__title">Title</h3>
    <p>Content text</p>
  </div>
</div>
```

### Clickable Card

Entire card is clickable
```html
<div class="card card--clickable">
  <a href="/details">
    <h3 class="card__title">Card Title</h3>
    <p class="card__content">Card content</p>
  </a>
</div>
```

### Card Grid

```html
<!-- 3-column responsive grid -->
<div class="card-grid">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>

<!-- 2-column grid -->
<div class="card-grid card-grid--2-col">...</div>

<!-- 4-column grid -->
<div class="card-grid card-grid--4-col">...</div>
```

## Accessibility

### WCAG Compliance

- **Focus Indicators**: 2px solid primary color outline
- **Color Contrast**: All text meets WCAG AA standards
- **Touch Targets**: Minimum 40x40px for interactive elements
- **ARIA Support**: Use `aria-selected` for active states
- **Keyboard Navigation**: Full keyboard support with visible focus

### Best Practices

1. **Always include semantic HTML**:
   ```html
   <article class="card" role="article">...</article>
   ```

2. **Use proper heading hierarchy**:
   ```html
   <h3 class="card__title">...</h3>
   ```

3. **Provide alt text for images**:
   ```html
   <img src="..." alt="Descriptive text" class="card__media">
   ```

4. **Add ARIA labels for interactive cards**:
   ```html
   <div class="card card--clickable" role="button" tabindex="0" aria-label="View property details">
   ```

## Reduced Motion

The card system respects user motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
  
  .card:hover {
    transform: none;
  }
}
```

## Dark Theme Support

Cards automatically adapt to dark theme:

```html
<!-- Automatically styled in dark theme -->
<body class="dark-theme">
  <div class="card">...</div>
</body>
```

Dark theme features:
- Gradient: neutral-800 → neutral-900
- Border: neutral-700
- Adjusted shadows for better visibility
- Text colors optimized for dark backgrounds

## Technical Implementation

### CSS Custom Properties Used

- **Spacing**: `--spacing-6` (24px), `--spacing-4`, `--spacing-8`
- **Border Radius**: `--radius-xl` (12px)
- **Shadows**: `--shadow-2`, `--shadow-4`
- **Colors**: `--color-neutral-*`, `--color-primary-*`, etc.
- **Transitions**: `--duration-normal` (200ms)

### Transitions

```css
transition: box-shadow 200ms ease-in-out,
            transform 200ms ease-in-out;
```

### Inner Glow Effect

```css
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 200ms ease-in-out;
}

.card--active::before {
  opacity: 1;
  box-shadow: inset 0 0 0 1px var(--color-primary-500),
              inset 0 0 20px var(--color-primary-alpha-10);
}
```

## Migration Guide

### From Old Card Styles

**Before:**
```html
<div class="card-container">
  <div class="card-header">Title</div>
  <div class="card-body">Content</div>
</div>
```

**After:**
```html
<div class="card">
  <div class="card__header">
    <h3 class="card__title">Title</h3>
  </div>
  <div class="card__content">Content</div>
</div>
```

### Material Cards

Material Design cards automatically receive the new styling. No changes required:

```html
<mat-card>
  <mat-card-header>...</mat-card-header>
  <mat-card-content>...</mat-card-content>
</mat-card>
```

## Performance

- **GPU Acceleration**: Transform and opacity changes use GPU
- **Efficient Transitions**: Only animate transform and box-shadow
- **Minimal Repaints**: Pseudo-element for inner glow avoids reflows
- **Optimized Selectors**: Single-class selectors for performance

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with touch optimization

## Examples

See `/frontend/src/stories/` for Storybook examples and interactive demos.

## Related Documentation

- [Design Tokens](./src/styles/variables.scss)
- [Color System](./COLOR_SYSTEM_CHEATSHEET.md)
- [Accessibility Guidelines](./ACCESSIBILITY.md)
- [Material Overrides](./src/styles/material-overrides.css)
