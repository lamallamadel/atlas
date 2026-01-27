# SpinnerComponent - Quick Reference

## Import

Already registered in `app.module.ts` - use directly in templates.

## Basic Syntax

```html
<app-spinner
  [variant]="'circular' | 'linear' | 'dots'"
  [size]="'sm' | 'md' | 'lg'"
  [color]="'primary' | 'white' | 'neutral'"
  [message]="'Optional message'"
  [timeout]="5000"
  [showCancelButton]="false"
  [cancelButtonLabel]="'Annuler'"
  [timeoutMessage]="'Timeout message...'"
  (cancel)="handleCancel()"
  (timeoutReached)="handleTimeout()">
</app-spinner>
```

## Common Patterns

### 1. Simple Loading
```html
<app-spinner></app-spinner>
```

### 2. With Message
```html
<app-spinner message="Chargement en cours..."></app-spinner>
```

### 3. Different Sizes
```html
<app-spinner size="sm"></app-spinner>  <!-- 16px -->
<app-spinner size="md"></app-spinner>  <!-- 24px - default -->
<app-spinner size="lg"></app-spinner>  <!-- 48px -->
```

### 4. Variants
```html
<app-spinner variant="circular"></app-spinner>  <!-- Default -->
<app-spinner variant="linear"></app-spinner>    <!-- Progress bar style -->
<app-spinner variant="dots"></app-spinner>      <!-- Three bouncing dots -->
```

### 5. Colors
```html
<app-spinner color="primary"></app-spinner>   <!-- Blue - default -->
<app-spinner color="white"></app-spinner>     <!-- For dark backgrounds -->
<app-spinner color="neutral"></app-spinner>   <!-- Gray -->
```

### 6. Cancellable Operation
```html
<app-spinner
  message="Processing..."
  [showCancelButton]="true"
  (cancel)="onCancel()">
</app-spinner>
```

### 7. Timeout Warning
```html
<app-spinner
  message="Loading..."
  [timeout]="5000"
  timeoutMessage="This is taking longer than expected..."
  (timeoutReached)="onTimeout()">
</app-spinner>
```

### 8. Skeleton Integration
```html
<app-loading-skeleton
  variant="spinner"
  spinnerVariant="circular"
  spinnerSize="lg"
  spinnerMessage="Loading data...">
</app-loading-skeleton>
```

## Size Reference

| Size | Pixels | Use Case |
|------|--------|----------|
| `sm` | 16px | Inline, buttons, small UI elements |
| `md` | 24px | Default, general purpose |
| `lg` | 48px | Page loading, dialogs, hero sections |

## Variant Use Cases

| Variant | Best For |
|---------|----------|
| `circular` | General loading, page loads, data fetching |
| `linear` | Top-of-page loading, progress indication |
| `dots` | Inline text loading, subtle indicators |

## Color Usage

| Color | Background | Use Case |
|-------|------------|----------|
| `primary` | Light backgrounds | Default, most common |
| `white` | Dark backgrounds | Overlays, dark themes |
| `neutral` | Any | Subtle, less prominent |

## TypeScript Types

```typescript
import { SpinnerVariant, SpinnerSize, SpinnerColor } from './components/spinner.component';

// Component properties
variant: SpinnerVariant = 'circular';
size: SpinnerSize = 'md';
color: SpinnerColor = 'primary';
```

## CSS Classes

```css
/* Container */
.spinner-container

/* Size classes */
.spinner-sm
.spinner-md
.spinner-lg

/* Color classes */
.spinner-primary
.spinner-white
.spinner-neutral

/* Variant classes */
.spinner-circular
.spinner-linear
.spinner-dots

/* Elements */
.spinner-message
.spinner-timeout-message
.spinner-cancel-btn
```

## Performance Tips

✅ **Do:**
- Uses GPU-accelerated `transform` and `opacity`
- All animations are CSS-only
- OnPush change detection
- Hardware compositing with `will-change`

❌ **Avoid:**
- Multiple large spinners on same page
- Nested spinners
- Very short timeouts (<1s)

## Accessibility

- ✅ ARIA compliant
- ✅ Keyboard navigable
- ✅ Respects `prefers-reduced-motion`
- ✅ WCAG 2.1 Level AA focus indicators

## Browser Support

Chrome 90+, Firefox 88+, Safari 14+, iOS 14+

---

**Full Documentation**: See `SPINNER_README.md` for complete guide with examples.
