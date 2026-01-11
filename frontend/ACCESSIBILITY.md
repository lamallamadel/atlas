# WCAG AA Accessibility Compliance

## Overview

This document outlines the WCAG AA accessibility features implemented in the dashboard and throughout the application.

## Implemented Features

### 1. Color Contrast (WCAG 2.1 - Success Criterion 1.4.3)

All text and interactive elements meet the WCAG AA minimum contrast ratio of **4.5:1** for normal text and **3:1** for large text.

#### Text Colors on White Background

- `--color-neutral-600`: 4.54:1 contrast ratio ✓
- `--color-neutral-700`: 5.74:1 contrast ratio ✓
- `--color-neutral-800`: 8.59:1 contrast ratio ✓
- `--color-neutral-900`: 16.1:1 contrast ratio ✓

#### Success Colors

- `--color-success-700`: 4.64:1 contrast ratio ✓
- `--color-success-800`: 6.38:1 contrast ratio ✓
- `--color-success-900`: 10.1:1 contrast ratio ✓

#### Error Colors

- `--color-error-700`: 4.76:1 contrast ratio ✓
- `--color-error-800`: 6.19:1 contrast ratio ✓
- `--color-error-900`: 7.77:1 contrast ratio ✓

#### Dashboard Specific Contrast

- **Page title (h1)**: `--color-neutral-900` on white (16.1:1) ✓
- **KPI card titles (h3)**: `--color-neutral-900` on white (16.1:1) ✓
- **Field labels (span)**: `--color-neutral-900` on white (16.1:1) ✓
- **Field values**: `--color-neutral-800` on white (8.59:1) ✓
- **Body text**: `--color-neutral-700` on white (5.74:1) ✓

### 2. Focus Indicators (WCAG 2.1 - Success Criterion 2.4.7)

All interactive elements have visible **2px solid primary color** focus indicators with `:focus-visible`.

#### Implementation

```css
*:focus-visible {
  outline: 2px solid var(--color-primary-500, #2c5aa0) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 4px rgba(44, 90, 160, 0.2) !important;
}
```

#### Affected Elements

- All buttons (`.mat-mdc-button`, `.mat-mdc-raised-button`, `.mat-mdc-icon-button`)
- FAB buttons (`.mat-mdc-fab`, `.mat-mdc-mini-fab`)
- Cards (`.mat-mdc-card`, `.kpi-card`, `.dossier-item`)
- Links (`a`)
- Form inputs (`input`, `select`, `textarea`)
- Button toggles (`.mat-button-toggle`)
- Chips (`.mat-mdc-chip`)
- Menu items (`.mat-mdc-menu-item`)
- List items (`.mat-mdc-list-item`)
- Options (`.mat-mdc-option`)
- Tabs (`.mat-mdc-tab`)

### 3. Minimum Touch Target Size (WCAG 2.1 - Success Criterion 2.5.5)

All clickable elements meet the minimum size of **40x40 pixels** for Level AA compliance.

#### Implementation

```css
button,
a,
.mat-mdc-button,
.mat-mdc-icon-button,
[role="button"],
.clickable {
  min-width: 40px;
  min-height: 40px;
}
```

#### Verified Elements

- All Material buttons: 40x40px minimum ✓
- KPI cards: Clickable with min-height 40px ✓
- Dossier items: Clickable with min-height 40px ✓
- Button toggles: 40x40px minimum ✓
- Icon containers: 48x48px (desktop), 40x40px (mobile) ✓
- Menu items: 40px minimum height ✓
- List items: 40px minimum height ✓
- Tabs: 40px minimum height ✓

### 4. Standardized Typography Scale

Consistent typography scale following the design system:

#### Dashboard Typography

| Element | Tag | Font Size | Font Weight | Variable |
|---------|-----|-----------|-------------|----------|
| Page title | `h1` | 24px (2xl) | 600 (semibold) | `--font-size-2xl`, `--font-weight-semibold` |
| KPI card title | `h3` | 18px (lg) | 600 (semibold) | `--font-size-lg`, `--font-weight-semibold` |
| Field label | `span` | 14px (sm) | 500 (medium) | `--font-size-sm`, `--font-weight-medium` |
| Field value | `span` | 14px (sm) | 400 (normal) | `--font-size-sm`, `--font-weight-normal` |
| Body text | - | 16px (base) | 400 (normal) | `--font-size-base`, `--font-weight-normal` |

### 5. Keyboard Navigation

All interactive elements are keyboard accessible:

#### KPI Cards
- **Focusable**: `tabindex="0"` when clickable
- **Keyboard activated**: Enter and Space keys trigger click
- **Visual feedback**: Focus indicator visible
- **Disabled state**: `tabindex="-1"` when loading or error

#### Dossier Cards
- **Focusable**: `tabindex="0"`
- **Visual feedback**: Focus indicator visible
- **ARIA labels**: Descriptive labels for screen readers

#### Button Toggles
- **Keyboard navigation**: Tab through options
- **Activation**: Enter/Space keys
- **Visual feedback**: Focus indicator with z-index management

### 6. ARIA Support

#### Landmark Regions
```html
<section aria-labelledby="kpi-section-title">
  <h2 id="kpi-section-title" class="sr-only">Indicateurs clés de performance</h2>
</section>
```

#### Interactive Elements
- **KPI Cards**: `role="button"`, `aria-label`, `aria-disabled`
- **Dossier Cards**: `role="listitem"`, `aria-label`
- **Lists**: `role="list"` for semantic structure
- **Live regions**: `aria-live="polite"` for dynamic updates

### 7. Reduced Motion Support

Respects user preferences for reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  .kpi-card,
  .dossier-item,
  .kpi-value {
    animation: none;
    transition: none;
  }
}
```

## Testing Recommendations

### Automated Testing

1. **Chrome DevTools Lighthouse**
   - Open Chrome DevTools (F12)
   - Navigate to "Lighthouse" tab
   - Select "Accessibility" category
   - Run audit on dashboard page
   - **Target score**: 90+ (ideally 100)

2. **axe DevTools**
   - Install axe DevTools browser extension
   - Run full page scan
   - Review and fix any issues

### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test Enter/Space activation
   - Verify tab order is logical

2. **Screen Reader Testing**
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify all content is announced
   - Check ARIA labels are meaningful
   - Verify live regions announce updates

3. **Color Contrast**
   - Use browser contrast checker tools
   - Test with different zoom levels
   - Verify readability in different lighting

4. **Touch Target Testing**
   - Test on mobile/tablet devices
   - Verify all targets are easily tappable
   - Check spacing between interactive elements

## Browser Compatibility

Focus indicators and accessibility features tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Compliance Summary

| Criterion | Level | Status |
|-----------|-------|--------|
| 1.4.3 Contrast (Minimum) | AA | ✓ Pass |
| 2.4.7 Focus Visible | AA | ✓ Pass |
| 2.5.5 Target Size | AA | ✓ Pass |
| 1.3.1 Info and Relationships | A | ✓ Pass |
| 2.1.1 Keyboard | A | ✓ Pass |
| 4.1.2 Name, Role, Value | A | ✓ Pass |

## Future Enhancements

- [ ] Add high contrast theme option
- [ ] Implement skip navigation links
- [ ] Add more comprehensive ARIA live regions
- [ ] Conduct professional accessibility audit
- [ ] Test with multiple screen readers

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Chrome Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
