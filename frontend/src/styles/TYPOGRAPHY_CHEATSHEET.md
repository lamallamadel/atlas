# Typography Quick Reference

## Modular Scale (Perfect Fourth Ratio: 1.25)

| Level | Size (px) | CSS Variable | Mixin | HTML Element | Utility Class |
|-------|-----------|--------------|-------|--------------|---------------|
| 5 | 42.8 | `--font-size-5` | `heading-1` | `<h1>` | `.heading-1` |
| 4 | 34.2 | `--font-size-4` | `heading-2` | `<h2>` | `.heading-2` |
| 3 | 27.4 | `--font-size-3` | `heading-3` | `<h3>` | `.heading-3` |
| 2 | 21.9 | `--font-size-2` | `heading-4` | `<h4>` | `.heading-4` |
| 1 | 17.5 | `--font-size-1` | `heading-5` | `<h5>` | `.heading-5` |
| base | 14.0 | `--font-size-base` | `heading-6` / `body-base` | `<h6>` / `<p>` | `.heading-6` / `.body-base` |

## Line Heights

| Type | Value | CSS Variable | Utility Class |
|------|-------|--------------|---------------|
| Headings | 1.2 | `--line-height-heading` | `.leading-heading` |
| Body | 1.6 | `--line-height-body` | `.leading-body` |

## Letter Spacing

| Type | Value | CSS Variable | When to Use | Utility Class |
|------|-------|--------------|-------------|---------------|
| Tight | -0.02em | `--letter-spacing-tight` | Large text (≥27.4px) | `.tracking-tight` |
| Normal | 0em | `--letter-spacing-normal` | Body & small text | `.tracking-normal` |

## Font Weights

| Weight | Value | CSS Variable | Use Case | Utility Class |
|--------|-------|--------------|----------|---------------|
| Light | 300 | `--font-weight-light` | Decorative | `.font-light` |
| Normal | 400 | `--font-weight-normal` | Body text | `.font-normal` |
| Medium | 500 | `--font-weight-medium` | h5, h6 | `.font-medium` |
| Semibold | 600 | `--font-weight-semibold` | h3, h4 | `.font-semibold` |
| Bold | 700 | `--font-weight-bold` | h1, h2 | `.font-bold` |

## SCSS Usage

```scss
@use 'src/styles/typography' as typography;

.component {
  // Apply complete heading style
  @include typography.heading-2;
  
  // Apply complete body style
  @include typography.body-large;
  
  // Custom combination
  font-size: var(--font-size-3);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-tight);
  font-weight: var(--font-weight-semibold);
}
```

## HTML/CSS Usage

```html
<!-- Direct HTML elements (automatic styling) -->
<h1>Largest Heading (42.8px)</h1>
<h2>Large Heading (34.2px)</h2>
<h3>Medium Heading (27.4px)</h3>
<p>Body text (14px)</p>

<!-- Utility classes (when HTML semantics differ from visual) -->
<div class="heading-1">Hero Title</div>
<div class="heading-3 tracking-tight">Section Title</div>
<p class="body-large leading-body">Large paragraph</p>

<!-- Font size only -->
<span class="text-5">42.8px text</span>
<span class="text-3">27.4px text</span>
<span class="text-1">17.5px text</span>

<!-- Combined utilities -->
<div class="text-4 font-bold leading-heading tracking-tight">
  Custom styled text
</div>
```

## Complete Style Specifications

### heading-1 (h1)
- Font Size: 42.8px (2.670rem)
- Line Height: 1.2 (51.36px)
- Font Weight: 700 (Bold)
- Letter Spacing: -0.02em
- Font Family: Roboto

### heading-2 (h2)
- Font Size: 34.2px (2.136rem)
- Line Height: 1.2 (41.04px)
- Font Weight: 700 (Bold)
- Letter Spacing: -0.02em
- Font Family: Roboto

### heading-3 (h3)
- Font Size: 27.4px (1.709rem)
- Line Height: 1.2 (32.88px)
- Font Weight: 600 (Semibold)
- Letter Spacing: -0.02em
- Font Family: Roboto

### heading-4 (h4)
- Font Size: 21.9px (1.367rem)
- Line Height: 1.2 (26.28px)
- Font Weight: 600 (Semibold)
- Letter Spacing: 0em
- Font Family: Roboto

### heading-5 (h5)
- Font Size: 17.5px (1.094rem)
- Line Height: 1.2 (21px)
- Font Weight: 500 (Medium)
- Letter Spacing: 0em
- Font Family: Roboto

### heading-6 (h6)
- Font Size: 14px (0.875rem)
- Line Height: 1.2 (16.8px)
- Font Weight: 500 (Medium)
- Letter Spacing: 0em
- Font Family: Roboto

### body-large
- Font Size: 17.5px (1.094rem)
- Line Height: 1.6 (28px)
- Font Weight: 400 (Normal)
- Letter Spacing: 0em
- Font Family: Open Sans

### body-base (default body text)
- Font Size: 14px (0.875rem)
- Line Height: 1.6 (22.4px)
- Font Weight: 400 (Normal)
- Letter Spacing: 0em
- Font Family: Open Sans

### body-small
- Font Size: 11.2px (0.7rem)
- Line Height: 1.6 (17.92px)
- Font Weight: 400 (Normal)
- Letter Spacing: 0em
- Font Family: Open Sans

## Common Patterns

### Page Title
```html
<h1>Page Title</h1>
<!-- or -->
<h2 class="heading-1">Visual h1 but semantic h2</h2>
```

### Card Title
```scss
.card-title {
  @include typography.heading-4;
  margin-bottom: 12px;
}
```

### Intro Paragraph
```html
<p class="body-large">
  Large introductory text for better readability.
</p>
```

### Fine Print
```html
<small class="body-small">Small helper text or footnotes</small>
```

### Responsive Title
```scss
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

## Angular Material Components

Material components automatically use the modular scale:

```typescript
// In theme.scss
$custom-typography: mat.define-typography-config(
  $headline-1: 42.8px (heading-1 equivalent)
  $headline-2: 34.2px (heading-2 equivalent)
  $body-1: 17.5px (body-large equivalent)
  $body-2: 14px (body-base equivalent)
  // ...
);
```

Material typography classes:
- `.mat-headline-1` → heading-1 styles
- `.mat-headline-2` → heading-2 styles
- `.mat-body-1` → body-large styles
- `.mat-body-2` → body-base styles

## Accessibility

- Always use semantic HTML (`<h1>`-`<h6>`, `<p>`)
- Don't skip heading levels (h1 → h3 ❌, h1 → h2 → h3 ✅)
- Use utility classes only when visual hierarchy differs from semantic hierarchy
- Maintain sufficient color contrast (WCAG AA: 4.5:1 for body, 3:1 for large text)

## Quick Checklist

When implementing typography:

- [ ] Use semantic HTML elements when possible
- [ ] Apply appropriate heading level (h1-h6)
- [ ] Use SCSS mixins in component styles for maintainability
- [ ] Use utility classes in templates for quick styling
- [ ] Test in both light and dark themes
- [ ] Verify accessibility with screen readers
- [ ] Check responsive scaling on mobile/tablet/desktop
- [ ] Ensure proper color contrast

## See Also

- [TYPOGRAPHY.md](./TYPOGRAPHY.md) - Complete documentation
- [TYPOGRAPHY_EXAMPLES.scss](./TYPOGRAPHY_EXAMPLES.scss) - Code examples
- [README.md](./README.md) - Styles directory overview
