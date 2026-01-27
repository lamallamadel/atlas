# Badge Component - Quick Reference

## Import

```typescript
import { BadgeComponent } from './components/badge.component';
```

## Basic Syntax

```html
<app-badge [variant]="variant" [color]="color" [size]="size" [pill]="boolean" [pulse]="boolean" [dot]="boolean" [icon]="iconName" [iconPosition]="'left'|'right'">
  Content
</app-badge>
```

## Quick Examples

```html
<!-- Default -->
<app-badge>Default Badge</app-badge>

<!-- Solid Primary -->
<app-badge variant="solid" color="primary">Primary</app-badge>

<!-- Soft Success with Icon -->
<app-badge variant="soft" color="success" icon="check">Approved</app-badge>

<!-- Pill Danger with Pulse -->
<app-badge variant="solid" color="danger" size="sm" [pill]="true" [pulse]="true">3</app-badge>

<!-- With Notification Dot -->
<app-badge variant="soft" color="info" [dot]="true">New Message</app-badge>
```

## Variants (3)

| Variant | Use Case | Example |
|---------|----------|---------|
| `solid` | High prominence, primary actions | Status indicators, counts |
| `outline` | Medium prominence, secondary info | Tags, categories |
| `soft` | Low prominence, subtle indicators | Metadata, inline status |

## Sizes (3)

| Size | Padding | Font | Icon | Use Case |
|------|---------|------|------|----------|
| `sm` | 4px 10px | 11px | 14px | Compact spaces, inline |
| `md` | 6px 12px | 12px | 16px | General usage (default) |
| `lg` | 8px 16px | 14px | 18px | Headers, prominent |

## Colors (14)

### Standard
- `primary` - Brand color
- `success` - Success state
- `warning` - Warning state
- `danger` - Error/danger
- `info` - Information
- `neutral` - Neutral gray
- `neutral-warmth` - Warm gray

### Real Estate Semantic
- `success-sold` - Vendu (Green)
- `success-rented` - Loué (Teal)
- `success-signed` - Signé (Blue-Green)
- `warning-attention` - Mild warning
- `warning-urgent` - Important warning
- `warning-critical` - Critical warning
- `danger-soft` - Non-blocking error

## Common Patterns

### Property Status
```html
<app-badge variant="soft" color="success-sold" icon="sell">Vendu</app-badge>
<app-badge variant="soft" color="success-rented" icon="key">Loué</app-badge>
<app-badge variant="soft" color="success-signed" icon="done_all">Signé</app-badge>
```

### Notification Counts
```html
<app-badge variant="solid" color="danger" size="sm" [pill]="true" [pulse]="true">5</app-badge>
```

### Tags
```html
<app-badge variant="soft" color="primary" size="sm" [pill]="true">Premium</app-badge>
```

### Status Indicators
```html
<app-badge variant="soft" color="success" size="sm" [dot]="true" [pulse]="true">En ligne</app-badge>
```

### Urgent Alerts
```html
<app-badge variant="solid" color="warning-critical" icon="warning" [pulse]="true">Urgent</app-badge>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'solid'\|'outline'\|'soft'` | `'soft'` | Visual style |
| `size` | `'sm'\|'md'\|'lg'` | `'md'` | Size |
| `color` | See colors above | `'neutral'` | Color |
| `pill` | `boolean` | `false` | Rounded edges |
| `pulse` | `boolean` | `false` | Animation |
| `dot` | `boolean` | `false` | Dot indicator |
| `icon` | `string` | - | Material icon |
| `iconPosition` | `'left'\|'right'` | `'left'` | Icon position |
| `ariaLabel` | `string` | - | Accessibility |

## Cheat Sheet

```html
<!-- REAL ESTATE -->
Vendu: variant="soft" color="success-sold" icon="sell"
Loué: variant="soft" color="success-rented" icon="key"
Signé: variant="soft" color="success-signed" icon="done_all"
Disponible: variant="soft" color="success" icon="home"
En attente: variant="soft" color="warning-attention" icon="pending"
Réservé: variant="soft" color="warning-urgent" icon="lock_clock"
Retiré: variant="outline" color="neutral-warmth" icon="block"

<!-- URGENCY -->
Normal: variant="soft" color="warning-attention"
Urgent: variant="solid" color="warning-urgent" [pulse]="true"
Critique: variant="solid" color="warning-critical" [pulse]="true"

<!-- NOTIFICATIONS -->
Count: variant="solid" color="danger" size="sm" [pill]="true"
New: variant="soft" color="info" size="sm" [dot]="true"
Online: variant="soft" color="success" size="sm" [dot]="true" [pulse]="true"

<!-- TAGS -->
Category: variant="soft" color="primary" size="sm" [pill]="true"
Feature: variant="outline" color="info" size="sm" [pill]="true"
Premium: variant="solid" color="warning-attention" size="sm" [pill]="true"
```

## Accessibility

- Always use semantic colors
- Add `ariaLabel` for counts and icons
- Test with screen readers
- Ensure sufficient contrast

```html
<app-badge 
  variant="solid" 
  color="danger" 
  size="sm"
  [pill]="true"
  ariaLabel="5 messages non lus">
  5
</app-badge>
```

## Dark Mode

Automatic - no configuration needed.

## Do's and Don'ts

### ✅ Do
- Use semantic colors based on meaning
- Keep text short (1-3 words)
- Use pulse for urgent states only
- Combine variant, color, and icon logically
- Test in both light and dark modes

### ❌ Don't
- Don't overuse pulse animation
- Don't use decorative colors
- Don't make text too long
- Don't combine too many features (pill+icon+pulse+dot)
- Don't use multiple pulsing badges in one view
