# Badge Component - Design Specification

## Visual Design System

### Typography

| Size | Font Size | Line Height | Letter Spacing | Font Weight |
|------|-----------|-------------|----------------|-------------|
| Small | 11px | 1 | 0.02em | 500 (Medium) |
| Medium | 12px | 1 | 0.01em | 500 (Medium) |
| Large | 14px | 1 | 0.01em | 500 (Medium) |

**Font Family**: `'Roboto', sans-serif`

### Spacing

| Size | Padding (vertical × horizontal) | Gap (icon/dot) |
|------|--------------------------------|----------------|
| Small | 4px × 10px | 6px |
| Medium | 6px × 12px | 6px |
| Large | 8px × 16px | 6px |

### Border Radius

| Shape | Border Radius |
|-------|---------------|
| Default | 6px |
| Pill | 9999px (fully rounded) |

### Icon Sizing

| Badge Size | Icon Size |
|------------|-----------|
| Small | 14px × 14px |
| Medium | 16px × 16px |
| Large | 18px × 18px |

### Dot Indicator

| Badge Size | Dot Size |
|------------|----------|
| Small | 6px × 6px |
| Medium | 8px × 8px |
| Large | 10px × 10px |

**Dot Position**: 8px from left edge (sm: 6px, lg: 10px)

## Color Specifications

### Light Mode

#### Solid Variant
```css
background-color: [color]-600
color: white
border: 1px solid transparent
hover: [color]-700
```

#### Outline Variant
```css
background-color: transparent
color: [color]-700
border: 1px solid [color]-600
hover: [color]-50 background
```

#### Soft Variant (Default)
```css
background-color: rgba([color]-600, 0.1)
color: [color]-700
border: 1px solid transparent
hover: rgba([color]-600, 0.15)
```

### Dark Mode

#### Solid Variant
```css
background-color: [color]-500
color: white
border: 1px solid transparent
hover: [color]-600
```

#### Outline Variant
```css
background-color: transparent
color: [color]-400
border: 1px solid [color]-500
hover: rgba([color]-500, 0.1) background
```

#### Soft Variant
```css
background-color: rgba([color]-500, 0.15)
color: [color]-400
border: 1px solid transparent
hover: rgba([color]-500, 0.25)
```

## Semantic Color Mapping

### Success Colors

| Variant | Light Mode Text | Light Mode Background | Dark Mode Text | Dark Mode Background |
|---------|----------------|----------------------|----------------|---------------------|
| success | `#1e8449` (700) | `rgba(39, 174, 96, 0.1)` | `#52c27a` (400) | `rgba(39, 174, 96, 0.15)` |
| success-sold | `#047857` (700) | `rgba(4, 120, 87, 0.1)` | `#34d399` (400) | `rgba(16, 185, 129, 0.15)` |
| success-rented | `#0f766e` (700) | `rgba(15, 118, 110, 0.1)` | `#2dd4bf` (400) | `rgba(20, 184, 166, 0.15)` |
| success-signed | `#0e7490` (700) | `rgba(14, 116, 144, 0.1)` | `#22d3ee` (400) | `rgba(6, 182, 212, 0.15)` |

### Warning Colors

| Variant | Light Mode Text | Light Mode Background | Dark Mode Text | Dark Mode Background |
|---------|----------------|----------------------|----------------|---------------------|
| warning-attention | `#a16207` (700) | `rgba(161, 98, 7, 0.1)` | `#facc15` (400) | `rgba(234, 179, 8, 0.15)` |
| warning-urgent | `#c2410c` (700) | `rgba(194, 65, 12, 0.1)` | `#fb923c` (400) | `rgba(249, 115, 22, 0.15)` |
| warning-critical | `#b91c1c` (700) | `rgba(185, 28, 28, 0.1)` | `#f87171` (400) | `rgba(239, 68, 68, 0.15)` |

### Other Colors

| Color | Light Mode Text | Light Mode Background | Dark Mode Text | Dark Mode Background |
|-------|----------------|----------------------|----------------|---------------------|
| primary | `#1f4782` (700) | `rgba(38, 81, 146, 0.1)` | `#476da8` (400) | `rgba(44, 90, 160, 0.15)` |
| danger | `#c0392b` (700) | `rgba(231, 76, 60, 0.1)` | `#ed7f7f` (400) | `rgba(231, 76, 60, 0.15)` |
| danger-soft | `#be123c` (700) | `rgba(190, 18, 60, 0.1)` | `#fb7185` (400) | `rgba(244, 63, 94, 0.15)` |
| info | `#1976d2` (700) | `rgba(33, 150, 243, 0.1)` | `#42a5f5` (400) | `rgba(33, 150, 243, 0.15)` |
| neutral | `#616161` (700) | `rgba(117, 117, 117, 0.1)` | `#bdbdbd` (400) | `rgba(158, 158, 158, 0.15)` |
| neutral-warmth | `#44403c` (700) | `rgba(87, 83, 78, 0.1)` | `#a8a29e` (400) | `rgba(120, 113, 108, 0.15)` |

## Animation Specifications

### Transitions

```css
/* Default smooth transition */
transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);

/* Color-only transition */
transition: 
  background-color 250ms cubic-bezier(0.4, 0, 0.2, 1),
  color 250ms cubic-bezier(0.4, 0, 0.2, 1),
  border-color 250ms cubic-bezier(0.4, 0, 0.2, 1);

/* Transform transition */
transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Shadow transition */
transition: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Pulse Animation

**Badge Pulse** (2s infinite):
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
```

**Ring Pulse** (2s infinite):
```css
@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
```

**Timing**: `cubic-bezier(0.4, 0, 0.6, 1)` (ease-in-out)

**Ring**: 
- Position: `inset: -4px` (4px outside badge)
- Border: `2px solid currentColor`
- Border-radius: inherits from badge

### Hover States

**Solid Variant**:
- Background: Darken by one shade (600 → 700)
- Smooth transition (250ms)

**Outline Variant**:
- Background: Add 50-shade of color
- Border: No change
- Smooth transition (250ms)

**Soft Variant**:
- Background: Increase opacity (0.1 → 0.15)
- Text: No change
- Smooth transition (250ms)

## Accessibility Specifications

### WCAG Compliance

#### Text Contrast Ratios

| Variant | Minimum Ratio | WCAG Level |
|---------|--------------|------------|
| Solid (white text on color-600) | 4.5:1 | AA |
| Outline (color-700 text on white) | 7:1 | AAA |
| Soft (color-700 text on color-50) | 4.5:1 | AA |

#### Color Variants Meeting AAA (7:1)

All `*-700` colors meet WCAG AAA for text:
- success-sold-700: 7.09:1
- success-rented-700: 7.05:1
- success-signed-700: 7.03:1
- warning-attention-700: 6.45:1 (use 800 for AAA)
- warning-urgent-700: 6.38:1 (use 800 for AAA)
- warning-critical-700: 7.41:1
- danger-soft-700: 7.42:1
- neutral-warmth-700: 9.73:1

### Semantic HTML

```html
<span role="status" aria-label="[descriptive label]">
  [Badge content]
</span>
```

### Screen Reader Support

- `role="status"` for dynamic badges (counts, status)
- `aria-label` for icon-only or numeric badges
- `aria-hidden="true"` for decorative icons
- `aria-live="polite"` for updating counts

### Focus Indicators

**Not focusable by default** - badges are not interactive elements

If badge is inside focusable element:
```css
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(44, 90, 160, 0.2);
}
```

### Touch Target Size

**Not applicable** - badges are not interactive

If badge becomes interactive (rare), minimum size:
- Width: 40px
- Height: 40px
- Touch area: 44px × 44px (including padding)

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .badge {
    transition: none;
  }
  
  .badge-pulse {
    animation: none;
  }
  
  .badge-pulse::before {
    animation: none;
  }
}
```

## Layout Guidelines

### Alignment

**Vertical Alignment**:
```css
vertical-align: middle;
display: inline-flex;
align-items: center;
```

**Horizontal Alignment**:
- Icons and text: `gap: 6px`
- Dot and text: `gap: 6px`
- Multiple badges: `gap: 8px` (recommended)

### Spacing in Context

**In Cards**:
- Margin from title: 8px
- Margin between badges: 8px
- Padding in footer: 12px

**In Tables**:
- Vertical align: middle
- Cell padding: 8px
- Badge size: sm or md (not lg)

**In Lists**:
- Margin from text: 8px
- Badge size: sm
- Align: right side

**In Headers**:
- Margin from title: 12px
- Badge size: md or lg
- Align: inline with title

### Responsive Behavior

**Mobile (<768px)**:
- Prefer sm size
- Stack badges vertically if needed
- Reduce gap to 4px
- Use pill shape for space efficiency

**Tablet (768px-1024px)**:
- Use md size (default)
- Keep horizontal layout
- Standard 8px gap

**Desktop (>1024px)**:
- Use md or lg size
- Horizontal layout
- Standard 8px gap
- More generous spacing

## Z-Index Layers

Badges don't use z-index by default.

If overlapping is needed:
```css
.badge-overlay {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
}
```

## Shadow Specifications

**Default**: No shadow

**Elevated** (optional, not implemented):
```css
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
```

**Hover Elevated** (optional, not implemented):
```css
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
```

## Browser Support

### Required Features

- CSS Custom Properties (var())
- CSS Grid (for layout)
- Flexbox
- CSS Animations (@keyframes)
- RGBA colors
- Border-radius
- CSS Transitions
- Pseudo-elements (::before, ::after)

### Graceful Degradation

**No CSS Custom Properties**:
- Fallback to hard-coded colors
- Still functional, less themeable

**No Animations**:
- `prefers-reduced-motion` support
- Badge still visible and functional

**Old Browsers**:
- Border-radius may not work
- Square corners (acceptable)
- No pulse animation
- Still readable and functional

## Performance Considerations

### CSS Performance

- Use class-based styling (not inline styles)
- Minimize specificity
- Avoid complex selectors
- Use CSS containment where applicable

### Animation Performance

- GPU-accelerated properties only:
  - `transform`
  - `opacity`
- Avoid animating:
  - `width`, `height`
  - `margin`, `padding`
  - `box-shadow` (use sparingly)

### Rendering Performance

- `ChangeDetectionStrategy.OnPush`
- Pure component (no side effects)
- Minimal DOM footprint
- No JavaScript animations

## Testing Specifications

### Visual Regression Tests

Test each combination:
- 3 variants × 14 colors × 3 sizes = 126 combinations
- With/without icon: 2× = 252 combinations
- With/without pill: 2× = 504 combinations
- Light/dark mode: 2× = 1008 total combinations

**Recommended**: Test representative subset (20-30 combinations)

### Accessibility Tests

- [ ] Contrast ratios (all colors × all variants)
- [ ] Screen reader announcements
- [ ] Keyboard navigation (if interactive)
- [ ] Focus indicators (if interactive)
- [ ] ARIA labels
- [ ] Reduced motion support

### Browser Tests

- [ ] Chrome (latest, latest-1)
- [ ] Firefox (latest, latest-1)
- [ ] Safari (latest, latest-1)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS latest)
- [ ] Mobile Chrome (Android latest)

### Responsive Tests

- [ ] Mobile (375px, 390px, 414px)
- [ ] Tablet (768px, 834px)
- [ ] Desktop (1024px, 1366px, 1920px)
- [ ] Ultra-wide (2560px+)

## Design Tokens

```typescript
// Spacing tokens
--badge-padding-sm: 4px 10px;
--badge-padding-md: 6px 12px;
--badge-padding-lg: 8px 16px;
--badge-gap: 6px;

// Typography tokens
--badge-font-size-sm: 11px;
--badge-font-size-md: 12px;
--badge-font-size-lg: 14px;
--badge-font-weight: 500;
--badge-line-height: 1;

// Border radius tokens
--badge-border-radius: 6px;
--badge-border-radius-pill: 9999px;

// Icon size tokens
--badge-icon-size-sm: 14px;
--badge-icon-size-md: 16px;
--badge-icon-size-lg: 18px;

// Dot size tokens
--badge-dot-size-sm: 6px;
--badge-dot-size-md: 8px;
--badge-dot-size-lg: 10px;

// Transition tokens
--badge-transition-duration: 250ms;
--badge-transition-timing: cubic-bezier(0.4, 0, 0.2, 1);

// Animation tokens
--badge-pulse-duration: 2s;
--badge-pulse-timing: cubic-bezier(0.4, 0, 0.6, 1);
```

## Figma / Design Tool Specs

### Component Structure

```
Badge Component
├── Frame (Auto-layout horizontal)
│   ├── Dot (Optional, 8px circle)
│   ├── Icon (Optional, Material Icon)
│   ├── Text (Auto-width)
│   └── Icon Right (Optional, Material Icon)
└── States
    ├── Default
    ├── Hover
    ├── Pulse (animation)
    └── Dark mode
```

### Variants in Design Tool

1. **Variant** (3 options): Solid, Outline, Soft
2. **Color** (14 options): All semantic colors
3. **Size** (3 options): Small, Medium, Large
4. **Pill** (boolean): Off, On
5. **Icon** (boolean): Off, Left, Right
6. **Dot** (boolean): Off, On
7. **Pulse** (boolean): Off, On

**Total variants**: 3 × 14 × 3 × 2 × 3 × 2 × 2 = 3,024 possible combinations

**Recommended library**: Create ~30 commonly used variants

## Maintenance Guidelines

### When to Add New Colors

Only add colors that have:
1. Clear semantic meaning
2. Business requirement (not aesthetic)
3. WCAG AA/AAA compliance
4. Both light and dark mode variants

### When to Add New Sizes

Only if:
1. Existing sizes don't fit use case
2. Design system requires it
3. Consistent with overall typography scale

### When to Add New Features

Consider:
1. Is it semantically appropriate for a badge?
2. Can it be achieved with existing props?
3. Does it increase complexity significantly?
4. Will it be used frequently (not one-off)?

### Deprecation Strategy

1. Mark as deprecated in JSDoc
2. Add console warning in dev mode
3. Provide migration path in docs
4. Remove after 2 major versions
