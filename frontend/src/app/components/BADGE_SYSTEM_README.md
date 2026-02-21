# Badge Component System

A comprehensive, accessible badge system with variants, sizes, colors, and animations for the Atlas Immobilier application.

## Features

- **3 Variants**: Solid, Outline, Soft
- **3 Sizes**: Small (sm), Medium (md), Large (lg)
- **14 Semantic Colors**: Including real estate-specific colors
- **Pill Shape**: Fully rounded badges with `pill` prop
- **Pulse Animation**: Attention-grabbing animation for active states
- **Dot Indicator**: Optional notification dot
- **Icon Support**: Left or right positioned Material Icons
- **Dark Mode**: Automatic adaptation to dark theme
- **WCAG Compliant**: Accessible color contrasts
- **Smooth Transitions**: Professional animations

## Basic Usage

```typescript
import { BadgeComponent } from './components/badge.component';
```

```html
<!-- Basic badge -->
<app-badge>Default</app-badge>

<!-- With variant, color, and size -->
<app-badge variant="solid" color="success" size="lg">
  Success
</app-badge>

<!-- With icon -->
<app-badge variant="soft" color="primary" icon="check" iconPosition="left">
  Verified
</app-badge>

<!-- Pill badge with pulse -->
<app-badge variant="solid" color="danger" size="sm" [pill]="true" [pulse]="true">
  3
</app-badge>

<!-- Badge with notification dot -->
<app-badge variant="soft" color="info" [dot]="true">
  Nouveau message
</app-badge>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'solid' \| 'outline' \| 'soft'` | `'soft'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `color` | `BadgeColor` | `'neutral'` | Semantic color (see colors below) |
| `pill` | `boolean` | `false` | Fully rounded edges (border-radius: 9999px) |
| `pulse` | `boolean` | `false` | Enable pulse animation |
| `dot` | `boolean` | `false` | Show notification dot indicator |
| `icon` | `string` | `undefined` | Material icon name |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon placement |
| `ariaLabel` | `string` | `undefined` | Accessibility label |

## Available Colors

### Standard Colors
- `primary` - Primary brand color
- `success` - General success state
- `warning` - General warning state
- `danger` - Critical error/danger state
- `info` - Informational state
- `neutral` - Neutral gray
- `neutral-warmth` - Warm gray tones

### Real Estate Semantic Colors
- `success-sold` - Property sold (Green)
- `success-rented` - Property rented (Teal)
- `success-signed` - Contract signed (Blue-Green)
- `warning-attention` - Mild warning (Yellow-Orange)
- `warning-urgent` - Important warning (Orange)
- `warning-critical` - Critical warning (Red-Orange)
- `danger-soft` - Non-blocking error (Soft Red)

## Variants Explained

### Solid
- Filled background with white text
- High contrast, most prominent
- Best for: Primary actions, critical status

```html
<app-badge variant="solid" color="success">Vendu</app-badge>
```

### Outline
- Transparent background with colored border and text
- Medium contrast, balanced
- Best for: Secondary information, tags

```html
<app-badge variant="outline" color="primary">Premium</app-badge>
```

### Soft (Default)
- Subtle background with colored text
- Low contrast, non-intrusive
- Best for: Inline status, metadata

```html
<app-badge variant="soft" color="info">Nouveau</app-badge>
```

## Size Guide

### Small (sm)
- Padding: `4px 10px`
- Font size: `11px`
- Icon size: `14px`
- Best for: Compact spaces, counts, inline text

### Medium (md) - Default
- Padding: `6px 12px`
- Font size: `12px`
- Icon size: `16px`
- Best for: General usage, cards, lists

### Large (lg)
- Padding: `8px 16px`
- Font size: `14px`
- Icon size: `18px`
- Best for: Headers, prominent displays

## Real Estate Examples

### Property Status Badges

```html
<!-- Sold property -->
<app-badge variant="soft" color="success-sold" icon="sell">
  Vendu
</app-badge>

<!-- Rented property -->
<app-badge variant="soft" color="success-rented" icon="key">
  Loué
</app-badge>

<!-- Signed contract -->
<app-badge variant="soft" color="success-signed" icon="done_all">
  Signé
</app-badge>

<!-- Available property -->
<app-badge variant="soft" color="success" icon="home">
  Disponible
</app-badge>

<!-- Pending property -->
<app-badge variant="soft" color="warning-attention" icon="pending">
  En attente
</app-badge>

<!-- Reserved property -->
<app-badge variant="soft" color="warning-urgent" icon="lock_clock">
  Réservé
</app-badge>

<!-- Withdrawn property -->
<app-badge variant="outline" color="neutral-warmth" icon="block">
  Retiré
</app-badge>
```

### Lead/Dossier Urgency

```html
<!-- Normal attention -->
<app-badge variant="soft" color="warning-attention" icon="schedule">
  À suivre
</app-badge>

<!-- Urgent follow-up -->
<app-badge variant="solid" color="warning-urgent" icon="warning" [pulse]="true">
  Urgent
</app-badge>

<!-- Critical action required -->
<app-badge variant="solid" color="warning-critical" icon="error" [pulse]="true">
  Critique
</app-badge>
```

### Notification Badges

```html
<!-- Unread count -->
<app-badge variant="solid" color="danger" size="sm" [pill]="true" [pulse]="true">
  5
</app-badge>

<!-- New item indicator -->
<app-badge variant="soft" color="info" size="sm" [dot]="true">
  Nouveau
</app-badge>

<!-- Online status -->
<app-badge variant="soft" color="success" size="sm" [dot]="true" [pulse]="true">
  En ligne
</app-badge>
```

## Advanced Usage

### Pill Badges for Tags

```html
<app-badge variant="solid" color="primary" [pill]="true">
  Premium
</app-badge>

<app-badge variant="soft" color="success" [pill]="true" icon="verified">
  Vérifié
</app-badge>

<app-badge variant="outline" color="info" size="sm" [pill]="true">
  Beta
</app-badge>
```

### Pulse Animation for Active States

```html
<!-- Pulsing notification -->
<app-badge variant="solid" color="danger" [pulse]="true">
  Action requise
</app-badge>

<!-- Live indicator -->
<app-badge variant="soft" color="danger" [dot]="true" [pulse]="true">
  En direct
</app-badge>

<!-- New item -->
<app-badge variant="solid" color="info" [pulse]="true" icon="fiber_new">
  Nouveau
</app-badge>
```

### Icon Positioning

```html
<!-- Icon on left (default) -->
<app-badge variant="soft" color="success" icon="check" iconPosition="left">
  Validé
</app-badge>

<!-- Icon on right -->
<app-badge variant="soft" color="warning" icon="arrow_forward" iconPosition="right">
  Suivant
</app-badge>
```

## Context Examples

### Property Card

```html
<div class="property-card">
  <div class="property-header">
    <h3>Villa Moderne - Paris 16ème</h3>
    <app-badge variant="soft" color="success-sold" size="md" icon="sell">
      Vendu
    </app-badge>
  </div>
  <p>3 chambres • 150m² • Jardin</p>
  <div class="property-footer">
    <app-badge variant="soft" color="primary" size="sm" [pill]="true">
      Premium
    </app-badge>
    <app-badge variant="outline" color="neutral-warmth" size="sm">
      Vente
    </app-badge>
  </div>
</div>
```

### Lead Management

```html
<div class="lead-card">
  <div class="lead-header">
    <span>Jean Dupont</span>
    <app-badge variant="soft" color="warning-critical" icon="warning" [pulse]="true">
      Urgent
    </app-badge>
  </div>
  <div class="lead-meta">
    <app-badge variant="soft" color="info" size="sm" [dot]="true">
      Nouveau
    </app-badge>
    <app-badge variant="soft" color="success" size="sm" icon="phone">
      À rappeler
    </app-badge>
  </div>
</div>
```

### Notification Center

```html
<div class="notification-list">
  <div class="notification-item">
    <span>Messages</span>
    <app-badge variant="solid" color="danger" size="sm" [pill]="true" [pulse]="true">
      8
    </app-badge>
  </div>
  <div class="notification-item">
    <span>Rendez-vous</span>
    <app-badge variant="soft" color="warning-attention" size="sm" [pill]="true">
      3
    </app-badge>
  </div>
  <div class="notification-item">
    <span>Tâches</span>
    <app-badge variant="soft" color="info" size="sm" [pill]="true">
      12
    </app-badge>
  </div>
</div>
```

## Dark Mode

All badges automatically adapt to dark theme. No additional configuration needed.

```html
<!-- Automatically adjusts colors in dark theme -->
<div class="dark-theme">
  <app-badge variant="solid" color="primary">Primary</app-badge>
  <app-badge variant="soft" color="success">Success</app-badge>
  <app-badge variant="outline" color="info">Info</app-badge>
</div>
```

## Accessibility

- Uses semantic `role="status"` for screen readers
- Supports custom `ariaLabel` prop for additional context
- WCAG AA/AAA compliant color contrasts
- Icons are marked with `aria-hidden="true"`
- Respects `prefers-reduced-motion` for animations

```html
<!-- With custom aria label -->
<app-badge 
  variant="solid" 
  color="danger" 
  [pulse]="true"
  ariaLabel="5 messages non lus">
  5
</app-badge>
```

## Showcase Component

View all badge variations in the showcase:

```typescript
import { BadgeShowcaseComponent } from './components/badge-showcase.component';
```

```html
<app-badge-showcase></app-badge-showcase>
```

## CSS Custom Properties

The badge system uses CSS custom properties for theming:

```css
/* Transition properties */
--transition-badge-smooth
--transition-badge-color
--transition-badge-transform
--transition-badge-shadow

/* Color properties (from _colors-extended.scss) */
--color-success-sold-600
--color-success-rented-600
--color-success-signed-600
--color-warning-attention-600
--color-warning-urgent-600
--color-warning-critical-600
--color-danger-soft-600
--color-neutral-warmth-600
```

## TypeScript Types

```typescript
import { BadgeVariant, BadgeSize, BadgeColor } from './badge.component';

// Available types
type BadgeVariant = 'solid' | 'outline' | 'soft';
type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeColor = 
  | 'primary' 
  | 'success' 
  | 'success-sold' 
  | 'success-rented' 
  | 'success-signed'
  | 'warning' 
  | 'warning-attention' 
  | 'warning-urgent' 
  | 'warning-critical'
  | 'danger' 
  | 'danger-soft'
  | 'info' 
  | 'neutral' 
  | 'neutral-warmth';
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Respects `prefers-reduced-motion` for accessibility
- Graceful degradation for older browsers

## Performance

- Uses `ChangeDetectionStrategy.OnPush` for optimal performance
- CSS-only animations (no JavaScript)
- Minimal DOM footprint
- Efficient class-based styling

## Migration from badge-status Component

If you're migrating from `app-badge-status`:

```html
<!-- Old -->
<app-badge-status status="SOLD" entityType="property"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="success-sold" icon="sell">
  Vendu
</app-badge>
```

## Best Practices

1. **Use semantic colors**: Choose colors based on meaning, not aesthetics
2. **Keep text short**: Badges work best with 1-3 words
3. **Use icons sparingly**: Only when they add clarity
4. **Reserve pulse for urgent**: Don't overuse pulse animation
5. **Consistent sizing**: Use one size per context (e.g., all list items use 'sm')
6. **Combine wisely**: Pill + icon + pulse can be overwhelming

## Related Components

- `BadgeStatusComponent` - Legacy status badge (use new BadgeComponent instead)
- `BadgeShowcaseComponent` - Visual showcase of all badge variations

## Files

- `badge.component.ts` - Component logic
- `badge.component.html` - Component template
- `badge.component.css` - Component styles
- `badge.component.spec.ts` - Unit tests
- `badge-showcase.component.ts` - Showcase component
- `badge-showcase.component.html` - Showcase template
- `badge-showcase.component.css` - Showcase styles

## Support

For questions or issues, refer to:
- Component source code
- Showcase component for visual examples
- Color system documentation in `_colors-extended.scss`
- Type definitions in `color-system.types.ts`
