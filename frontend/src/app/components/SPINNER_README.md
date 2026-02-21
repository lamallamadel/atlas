# SpinnerComponent - Elegant Loading States

## Overview

`SpinnerComponent` is a versatile, elegant loading indicator component with multiple variants, sizes, colors, and advanced features including timeout handling, optional messages, and cancel buttons. It integrates seamlessly with the `LoadingSkeletonComponent` for comprehensive loading state management.

## Features

- ✅ **3 Variants**: Circular, Linear, and Dots spinners
- ✅ **3 Sizes**: Small (16px), Medium (24px), Large (48px)
- ✅ **3 Color Themes**: Primary, White, Neutral
- ✅ **Optional Messages**: Display loading text below spinner
- ✅ **Timeout Handling**: Show fallback message after configurable delay (default 5s)
- ✅ **Cancel Button**: Optional cancellable long operations
- ✅ **CSS Optimized**: Uses only `transform` and `opacity` for 60fps animations
- ✅ **GPU Accelerated**: Hardware-accelerated animations
- ✅ **Accessibility**: Full ARIA support and reduced-motion compliance
- ✅ **Skeleton Integration**: Works with LoadingSkeletonComponent

## Installation

The component is already registered in `app.module.ts`. Import and use directly in your templates.

## Basic Usage

### Circular Spinner (Default)

```html
<app-spinner></app-spinner>
```

### With Message

```html
<app-spinner 
  message="Chargement en cours...">
</app-spinner>
```

### Different Variants

```html
<!-- Circular -->
<app-spinner variant="circular"></app-spinner>

<!-- Linear -->
<app-spinner variant="linear"></app-spinner>

<!-- Dots -->
<app-spinner variant="dots"></app-spinner>
```

### Size Variants

```html
<!-- Small: 16px -->
<app-spinner size="sm"></app-spinner>

<!-- Medium: 24px (default) -->
<app-spinner size="md"></app-spinner>

<!-- Large: 48px -->
<app-spinner size="lg"></app-spinner>
```

### Color Variants

```html
<!-- Primary (blue) -->
<app-spinner color="primary"></app-spinner>

<!-- White (for dark backgrounds) -->
<app-spinner color="white"></app-spinner>

<!-- Neutral (gray) -->
<app-spinner color="neutral"></app-spinner>
```

## Advanced Features

### Timeout with Fallback Message

Show a different message after a specified timeout (in milliseconds):

```html
<app-spinner
  message="Chargement en cours..."
  [timeout]="5000"
  timeoutMessage="Cette opération prend plus de temps que prévu..."
  (timeoutReached)="onTimeoutReached()">
</app-spinner>
```

```typescript
onTimeoutReached(): void {
  console.log('Operation timeout reached');
  // Optional: Show additional UI or retry logic
}
```

### Cancellable Operations

Enable a cancel button for long-running operations:

```html
<app-spinner
  message="Téléchargement en cours..."
  [showCancelButton]="true"
  cancelButtonLabel="Annuler"
  (cancel)="onCancel()">
</app-spinner>
```

```typescript
onCancel(): void {
  // Cancel the ongoing operation
  this.httpSubscription?.unsubscribe();
  this.dialogRef.close();
}
```

### Disable Timeout

Set `timeout` to 0 to disable timeout behavior:

```html
<app-spinner [timeout]="0"></app-spinner>
```

## Skeleton Integration

Use the spinner through `LoadingSkeletonComponent`:

```html
<app-loading-skeleton
  variant="spinner"
  spinnerVariant="circular"
  spinnerSize="lg"
  spinnerColor="primary"
  spinnerMessage="Chargement des données...">
</app-loading-skeleton>
```

## Complete Examples

### Example 1: Loading Data with Timeout

```typescript
// Component
export class DataTableComponent {
  isLoading = true;
  showTimeoutMessage = false;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.dataService.fetchData().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.data = data;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onTimeoutReached(): void {
    this.showTimeoutMessage = true;
  }
}
```

```html
<!-- Template -->
<div *ngIf="isLoading; else content">
  <app-spinner
    variant="circular"
    size="lg"
    color="primary"
    message="Chargement des données..."
    [timeout]="5000"
    timeoutMessage="Le serveur met du temps à répondre..."
    (timeoutReached)="onTimeoutReached()">
  </app-spinner>
</div>

<ng-template #content>
  <!-- Your data table here -->
</ng-template>
```

### Example 2: Cancellable File Upload

```typescript
// Component
export class FileUploadComponent {
  isUploading = false;
  uploadSubscription?: Subscription;

  uploadFile(file: File): void {
    this.isUploading = true;
    this.uploadSubscription = this.fileService.upload(file).subscribe({
      next: () => {
        this.isUploading = false;
        this.snackBar.open('Upload terminé', 'OK', { duration: 3000 });
      },
      error: () => {
        this.isUploading = false;
        this.snackBar.open('Erreur lors du téléchargement', 'OK', { duration: 3000 });
      }
    });
  }

  cancelUpload(): void {
    this.uploadSubscription?.unsubscribe();
    this.isUploading = false;
    this.snackBar.open('Téléchargement annulé', 'OK', { duration: 2000 });
  }
}
```

```html
<!-- Template -->
<div *ngIf="isUploading" class="upload-overlay">
  <app-spinner
    variant="circular"
    size="lg"
    color="white"
    message="Téléchargement en cours..."
    [showCancelButton]="true"
    cancelButtonLabel="Annuler le téléchargement"
    [timeout]="10000"
    timeoutMessage="Le fichier est volumineux, veuillez patienter..."
    (cancel)="cancelUpload()">
  </app-spinner>
</div>
```

### Example 3: Multiple Spinners in Dialog

```html
<mat-dialog-content>
  <h2>Génération du rapport</h2>
  
  <!-- Step 1: Fetching data -->
  <div *ngIf="step === 1">
    <app-spinner
      variant="linear"
      size="md"
      color="primary"
      message="Récupération des données...">
    </app-spinner>
  </div>
  
  <!-- Step 2: Processing -->
  <div *ngIf="step === 2">
    <app-spinner
      variant="dots"
      size="md"
      color="primary"
      message="Traitement des données...">
    </app-spinner>
  </div>
  
  <!-- Step 3: Generating PDF -->
  <div *ngIf="step === 3">
    <app-spinner
      variant="circular"
      size="lg"
      color="primary"
      message="Génération du PDF..."
      [showCancelButton]="true"
      (cancel)="cancelGeneration()">
    </app-spinner>
  </div>
</mat-dialog-content>
```

### Example 4: Dark Background Spinner

```html
<div class="dark-background">
  <app-spinner
    variant="circular"
    size="lg"
    color="white"
    message="Chargement...">
  </app-spinner>
</div>
```

```css
.dark-background {
  background-color: rgba(0, 0, 0, 0.8);
  padding: 2rem;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}
```

### Example 5: Inline Spinner in Button

```html
<button class="submit-btn" [disabled]="isSubmitting">
  <app-spinner 
    *ngIf="isSubmitting"
    variant="circular" 
    size="sm" 
    color="white"
    style="margin-right: 8px;">
  </app-spinner>
  {{ isSubmitting ? 'Envoi en cours...' : 'Envoyer' }}
</button>
```

## API Reference

### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `variant` | `'circular' \| 'linear' \| 'dots'` | `'circular'` | Spinner visual variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Spinner size (sm: 16px, md: 24px, lg: 48px) |
| `color` | `'primary' \| 'white' \| 'neutral'` | `'primary'` | Color theme |
| `message` | `string \| undefined` | `undefined` | Optional message displayed below spinner |
| `timeout` | `number` | `5000` | Timeout in ms before showing timeout message (0 to disable) |
| `showCancelButton` | `boolean` | `false` | Show cancel button |
| `cancelButtonLabel` | `string` | `'Annuler'` | Label for cancel button |
| `timeoutMessage` | `string` | `'Cette opération prend plus de temps que prévu...'` | Message shown after timeout |

### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `cancel` | `EventEmitter<void>` | Emitted when cancel button is clicked |
| `timeoutReached` | `EventEmitter<void>` | Emitted when timeout is reached |

### Methods

None - Component is fully declarative via inputs/outputs.

## Performance

### Optimizations

1. **GPU Acceleration**: All animations use `transform` and `opacity` for 60fps performance
2. **Hardware Compositing**: `will-change` hints for optimal browser optimization
3. **ChangeDetection**: Uses `OnPush` strategy for minimal change detection cycles
4. **CSS-Only Animations**: No JavaScript-based animations

### Animation Properties

All animations exclusively use:
- `transform: rotate()` - Circular rotation
- `transform: translateX()` - Linear bar movement
- `transform: scale()` - Dots bounce effect
- `opacity` - Fade in/out effects

These properties are GPU-accelerated and don't trigger layout or paint, ensuring smooth 60fps animations.

## Accessibility

### ARIA Support

- Container has implicit `role="status"` for live updates
- Cancel button has proper `aria-label`
- All interactive elements are keyboard accessible

### Reduced Motion

Respects `prefers-reduced-motion` media query:
- Disables animations for users with motion sensitivity
- Shows static states instead

```css
@media (prefers-reduced-motion: reduce) {
  .spinner-svg,
  .spinner-linear-bar,
  .spinner-dot {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

### Keyboard Navigation

- Cancel button is fully keyboard accessible (Tab, Enter, Space)
- Focus indicators meet WCAG 2.1 Level AA requirements

## CSS Custom Properties

Override default styles using CSS variables:

```css
app-spinner {
  /* Colors */
  --color-primary-500: #custom-color;
  --color-neutral-0: #ffffff;
  
  /* Spacing */
  --spacing-3: 12px;
  
  /* Animation duration */
  --duration-normal: 200ms;
}
```

## Best Practices

### ✅ Do

- Use `circular` variant for general loading states
- Use `linear` variant for progress bars or header loading
- Use `dots` variant for inline loading in text
- Set appropriate `timeout` for network operations
- Provide `showCancelButton` for long operations (>10s)
- Use `white` color on dark backgrounds
- Combine with skeleton screens for better UX

### ❌ Don't

- Don't use multiple large spinners on the same screen
- Don't set timeout too short (<3s) or too long (>15s)
- Don't forget to handle `cancel` event when `showCancelButton` is true
- Don't use spinners for instant operations (<200ms)
- Don't nest spinners inside each other

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Chrome Android 90+

**Note**: Uses modern CSS features like `will-change`, CSS Grid, and CSS variables.

## Migration from CustomSpinnerComponent

If migrating from the old `CustomSpinnerComponent`:

**Before:**
```html
<app-custom-spinner [size]="24" color="#3b82f6"></app-custom-spinner>
```

**After:**
```html
<app-spinner variant="circular" size="md" color="primary"></app-spinner>
```

## Related Components

- **LoadingSkeletonComponent**: Contextual skeleton screens for different layouts
- **ProgressBarComponent**: Determinate progress indicator
- **CustomSpinnerComponent**: Legacy spinner (deprecated, use SpinnerComponent)

## Examples Repository

See `frontend/src/stories/` for Storybook examples (if Storybook is configured).

## Support

For issues or feature requests, contact the development team or create a ticket in the project management system.
