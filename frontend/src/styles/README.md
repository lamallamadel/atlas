# Styles Directory

This directory contains all global styles, design tokens, and utility classes for the frontend application.

## File Structure

```
styles/
├── README.md                    # This file
├── TYPOGRAPHY.md                # Typography system documentation
├── TYPOGRAPHY_EXAMPLES.scss     # Code examples for typography usage
├── _typography.scss             # Typography mixins and modular scale
├── animations.css               # Animation utilities
├── document-preview-dialog.css  # Document preview styles
├── material-overrides.css       # Angular Material customizations
├── pages.css                    # Page-specific styles
├── print.scss                   # Print media styles
├── shepherd-theme.css           # Tour/guide styling
├── theme.scss                   # Main Material theme (light mode)
├── theme-dark.scss              # Dark mode theme
├── utilities.scss               # Utility classes (flex, spacing, etc.)
└── variables.scss               # CSS custom properties (design tokens)
```

## Core System Components

### 1. Design Tokens (`variables.scss`)

Central source of truth for all design values:

- **Colors**: Primary, secondary, neutral, semantic (success, warning, error, info)
- **Spacing**: 4px base grid system
- **Typography**: Modular scale with Perfect Fourth ratio (1.25)
- **Shadows**: 5-level elevation system
- **Border Radius**: Rounded corners scale
- **Transitions**: Duration and easing presets
- **Z-Index**: Layering scale

**Usage:**
```css
.my-component {
  color: var(--color-primary-600);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-2);
}
```

### 2. Typography System (`_typography.scss`)

Modular typography scale based on the Perfect Fourth ratio (1.25):

**Base:** 14px  
**Scale:** 14px → 17.5px → 21.9px → 27.4px → 34.2px → 42.8px

**Features:**
- Semantic heading mixins (`heading-1` through `heading-6`)
- Body text mixins (`body-large`, `body-base`, `body-small`)
- Dynamic line heights (1.2 for headings, 1.6 for body)
- Optimal letter spacing (-0.02em for large text, 0em for body)

**Usage in SCSS:**
```scss
@use 'src/styles/typography' as typography;

.page-title {
  @include typography.heading-2;
}

.intro-text {
  @include typography.body-large;
}
```

**Usage in HTML:**
```html
<h1 class="heading-1">Hero Title</h1>
<p class="body-base">Standard paragraph text</p>
```

See [`TYPOGRAPHY.md`](./TYPOGRAPHY.md) for complete documentation.

### 3. Angular Material Theme (`theme.scss`)

Defines the Material Design theme with:
- Custom color palettes (primary, accent, warn)
- Typography configuration using modular scale
- Density variants (default, compact, compact-max)

The typography configuration is automatically applied to all Material components.

### 4. Dark Theme (`theme-dark.scss`)

Dark mode color overrides that maintain:
- WCAG AA contrast ratios
- Inverted color palettes
- Same typography scale
- Consistent component styling

Applied via `.dark-theme` class on `<body>`.

### 5. Utility Classes (`utilities.scss`)

Comprehensive utility classes for:
- **Layout**: Flexbox, grid, positioning
- **Spacing**: Margin, padding (with responsive variants)
- **Typography**: Font sizes, weights, line heights, letter spacing
- **Display**: Visibility, overflow, z-index
- **Borders**: Width, radius
- **Shadows**: Elevation levels
- **Responsive**: Breakpoint-specific modifiers

**Examples:**
```html
<div class="flex items-center gap-4 p-4">
  <h2 class="heading-3 font-semibold">Title</h2>
  <p class="body-base leading-body">Text content</p>
</div>

<!-- Responsive -->
<div class="flex-col tablet:flex-row desktop:gap-8">
  <!-- Content adapts to screen size -->
</div>
```

## Importing Styles

### In Component SCSS

```scss
// Import typography mixins
@use 'src/styles/typography' as typography;

// Import utilities (for breakpoint mixins)
@use 'src/styles/utilities' as utils;

.component {
  @include typography.heading-4;
  
  @include utils.tablet {
    @include typography.heading-3;
  }
}
```

### Global Styles

Main entry point is `src/styles.css` which imports:
1. Font families (Google Fonts)
2. Global animations
3. Page styles
4. Material overrides
5. Dialog styles
6. Theme styles (via Angular Material)

## Responsive Breakpoints

```scss
$breakpoint-mobile: 375px   // Default (mobile-first)
$breakpoint-tablet: 768px   // Tablet and up
$breakpoint-desktop: 1440px // Desktop and up
```

**Media Query Mixins:**
```scss
@use 'src/styles/utilities' as utils;

.component {
  // Mobile-first default
  font-size: 14px;
  
  @include utils.tablet {
    font-size: 16px;
  }
  
  @include utils.desktop {
    font-size: 18px;
  }
}
```

## Best Practices

### 1. Use Design Tokens
✅ **Good:**
```css
color: var(--color-primary-600);
padding: var(--spacing-4);
```

❌ **Bad:**
```css
color: #265192;
padding: 16px;
```

### 2. Use Typography Mixins
✅ **Good:**
```scss
@include typography.heading-3;
```

❌ **Bad:**
```css
font-size: 27px;
line-height: 1.2;
font-weight: 600;
letter-spacing: -0.02em;
```

### 3. Use Utility Classes for Layout
✅ **Good:**
```html
<div class="flex items-center gap-4 p-4">
```

❌ **Bad:**
```css
.container {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}
```

### 4. Maintain Semantic HTML
✅ **Good:**
```html
<h2>Section Title</h2>
<div class="heading-3">Visual Title</div>
```

❌ **Bad:**
```html
<div class="text-2xl font-bold">Title</div>
```

### 5. Follow Mobile-First Approach
✅ **Good:**
```scss
.component {
  width: 100%; // Mobile default
  
  @include tablet {
    width: 50%; // Tablet override
  }
}
```

❌ **Bad:**
```scss
.component {
  width: 50%;
  
  @media (max-width: 767px) {
    width: 100%;
  }
}
```

## Accessibility

All styles maintain WCAG AA compliance:
- **Color Contrast**: Minimum 4.5:1 for text, 3:1 for UI components
- **Focus Indicators**: 2px solid outline with visible contrast
- **Touch Targets**: Minimum 40x40px for interactive elements
- **Reduced Motion**: Respects `prefers-reduced-motion` preference

## Print Styles

See `print.scss` for optimized print layouts:
- Hides navigation and interactive elements
- Optimizes table page breaks
- Monochrome-friendly badge styling
- A4 portrait page sizing

## Dark Theme

Toggle dark theme via `.dark-theme` class on `<body>`:

```typescript
document.body.classList.toggle('dark-theme');
```

Dark theme automatically:
- Inverts color palettes
- Maintains contrast ratios
- Updates shadows for depth perception
- Preserves typography scale

## Contributing

When adding new styles:

1. **Use existing tokens** before creating new values
2. **Add utility classes** to `utilities.scss` for reusable patterns
3. **Document typography** changes in `TYPOGRAPHY.md`
4. **Test in dark mode** to ensure proper contrast
5. **Validate accessibility** with WCAG AA standards
6. **Check print styles** if content is printable

## Resources

- [TYPOGRAPHY.md](./TYPOGRAPHY.md) - Complete typography documentation
- [TYPOGRAPHY_EXAMPLES.scss](./TYPOGRAPHY_EXAMPLES.scss) - Code examples
- [Modular Scale Calculator](https://www.modularscale.com/)
- [Type Scale Generator](https://typescale.com/)
- [Material Design Guidelines](https://m3.material.io/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
