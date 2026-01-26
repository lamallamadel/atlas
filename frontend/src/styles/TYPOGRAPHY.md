# Typography System

## Overview

The application uses a **modular typography scale** based on the **Perfect Fourth ratio (1.25)** with a **14px base size**. This creates a harmonious visual hierarchy across all text elements.

## Modular Scale

### Font Sizes

| Level | Size (px) | Size (rem) | CSS Variable | Use Case |
|-------|-----------|------------|--------------|----------|
| Base  | 14.00     | 0.875      | `--font-size-base` | Body text, h6 |
| 1     | 17.50     | 1.094      | `--font-size-1` | Large body, h5 |
| 2     | 21.88     | 1.367      | `--font-size-2` | h4 |
| 3     | 27.34     | 1.709      | `--font-size-3` | h3 |
| 4     | 34.18     | 2.136      | `--font-size-4` | h2 |
| 5     | 42.72     | 2.670      | `--font-size-5` | h1 |

### Ratio Calculation

Each level is calculated by multiplying the previous level by **1.25**:

```
14px × 1.25 = 17.5px
17.5px × 1.25 = 21.875px
21.875px × 1.25 = 27.34375px
27.34375px × 1.25 = 34.1796875px
34.1796875px × 1.25 = 42.724609375px
```

## Line Heights

The system uses semantic line heights optimized for readability:

- **Headings**: `1.2` (var: `--line-height-heading`)
- **Body Text**: `1.6` (var: `--line-height-body`)

## Letter Spacing

Letter spacing is dynamically applied based on size:

- **Large Text** (≥27.4px): `-0.02em` (var: `--letter-spacing-tight`)
- **Body & Small Text**: `0em` (var: `--letter-spacing-normal`)

## Usage

### SCSS Mixins

Import the typography module and use heading mixins in your component styles:

```scss
@use 'src/styles/typography' as typography;

.page-title {
  @include typography.heading-1;
  // Output: 42.8px, line-height 1.2, letter-spacing -0.02em, weight 700
}

.section-title {
  @include typography.heading-3;
  // Output: 27.4px, line-height 1.2, letter-spacing -0.02em, weight 600
}

.body-text {
  @include typography.body-base;
  // Output: 14px, line-height 1.6, letter-spacing 0em, weight 400
}
```

Available mixins:
- `@include typography.heading-1`
- `@include typography.heading-2`
- `@include typography.heading-3`
- `@include typography.heading-4`
- `@include typography.heading-5`
- `@include typography.heading-6`
- `@include typography.body-large`
- `@include typography.body-base`
- `@include typography.body-small`

### HTML Elements

Standard HTML heading elements automatically use the modular scale:

```html
<h1>Main Heading</h1>        <!-- 42.8px -->
<h2>Section Heading</h2>     <!-- 34.2px -->
<h3>Subsection Heading</h3>  <!-- 27.4px -->
<h4>Article Heading</h4>     <!-- 21.9px -->
<h5>Small Heading</h5>       <!-- 17.5px -->
<h6>Tiny Heading</h6>        <!-- 14px -->
```

### CSS Utility Classes

Apply typography styles directly via utility classes:

```html
<!-- Heading classes -->
<div class="heading-1">Hero Title</div>
<div class="heading-2">Page Title</div>
<div class="heading-3">Section Title</div>

<!-- Body classes -->
<p class="body-large">Large body text</p>
<p class="body-base">Standard body text</p>
<p class="body-small">Small body text</p>

<!-- Font size only -->
<span class="text-1">17.5px text</span>
<span class="text-2">21.9px text</span>
<span class="text-3">27.4px text</span>

<!-- Line height modifiers -->
<p class="leading-heading">Tight line height (1.2)</p>
<p class="leading-body">Body line height (1.6)</p>

<!-- Letter spacing modifiers -->
<h1 class="tracking-tight">Tight letter spacing (-0.02em)</h1>
<p class="tracking-normal">Normal letter spacing (0em)</p>
```

### CSS Custom Properties

Access the scale directly via CSS variables:

```css
.custom-element {
  font-size: var(--font-size-3);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-tight);
  font-weight: var(--font-weight-semibold);
}
```

## Angular Material Integration

The modular scale is integrated into Angular Material's typography configuration:

```typescript
// theme.scss
$custom-typography: mat.define-typography-config(
  $headline-1: mat.define-typography-level(42.8px, 51.36px, 700, 'Roboto', -0.02em),
  $headline-2: mat.define-typography-level(34.2px, 41.04px, 700, 'Roboto', -0.02em),
  $headline-3: mat.define-typography-level(27.4px, 32.88px, 600, 'Roboto', -0.02em),
  $headline-4: mat.define-typography-level(21.9px, 26.28px, 600, 'Roboto', 0em),
  $headline-5: mat.define-typography-level(17.5px, 21px, 500, 'Roboto', 0em),
  $headline-6: mat.define-typography-level(14px, 16.8px, 500, 'Roboto', 0em),
  $body-1: mat.define-typography-level(17.5px, 28px, 400, 'Open Sans', 0em),
  $body-2: mat.define-typography-level(14px, 22.4px, 400, 'Open Sans', 0em),
  // ...
);
```

Material components automatically inherit these settings.

## Font Weights

| Weight | Value | CSS Variable | Use Case |
|--------|-------|--------------|----------|
| Light | 300 | `--font-weight-light` | Decorative |
| Normal | 400 | `--font-weight-normal` | Body text |
| Medium | 500 | `--font-weight-medium` | h5, h6 |
| Semibold | 600 | `--font-weight-semibold` | h3, h4 |
| Bold | 700 | `--font-weight-bold` | h1, h2 |

## Best Practices

1. **Use semantic HTML elements** (`h1`-`h6`) when possible for accessibility
2. **Apply heading classes** (`.heading-1`, `.heading-2`, etc.) when HTML semantics don't match visual hierarchy
3. **Use mixins in component styles** for type-safe, maintainable component styling
4. **Leverage CSS variables** for dynamic or theme-dependent typography
5. **Maintain visual hierarchy** by using consecutive heading levels (don't skip from h2 to h5)

## Examples

### Component with Multiple Typography Levels

```scss
@use 'src/styles/typography' as typography;

.card-component {
  .card-title {
    @include typography.heading-4;
    margin-bottom: 12px;
  }
  
  .card-subtitle {
    @include typography.heading-6;
    color: var(--color-neutral-600);
    margin-bottom: 16px;
  }
  
  .card-body {
    @include typography.body-base;
  }
}
```

### Responsive Typography

```scss
@use 'src/styles/typography' as typography;

.hero-title {
  @include typography.heading-3;
  
  @media (min-width: 768px) {
    @include typography.heading-2;
  }
  
  @media (min-width: 1440px) {
    @include typography.heading-1;
  }
}
```

## Migration from Legacy System

If you encounter old font size variables, here's the mapping:

| Old Variable | New Variable | Old Size | New Size |
|--------------|--------------|----------|----------|
| `--font-size-sm` | `--font-size-base` | 13px | 14px |
| `--font-size-lg` | `--font-size-1` | 16px | 17.5px |
| `--font-size-xl` | `--font-size-2` | 18px | 21.9px |
| `--font-size-2xl` | `--font-size-3` | 22px | 27.4px |
| N/A | `--font-size-4` | N/A | 34.2px |
| N/A | `--font-size-5` | N/A | 42.8px |

Legacy variables remain available for backward compatibility but should be migrated to the modular scale.

## References

- **Perfect Fourth Ratio**: 1.25 (musical interval)
- **Type Scale Generator**: [https://typescale.com](https://typescale.com)
- **Modular Scale**: [https://www.modularscale.com](https://www.modularscale.com)
