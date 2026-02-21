# Premium Toast Notification System

A fully-featured, accessible toast notification system with configurable positions, types with icons, progress bars, action buttons, swipe-to-dismiss gestures, queue management, and ARIA live announcements.

## Features

### ✅ Core Features
- **6 Configurable Positions**: top-right (default), top-left, top-center, bottom-right, bottom-left, bottom-center
- **4 Toast Types with Icons**:
  - Success: ✓ checkmark (`check_circle`)
  - Error: ✗ X mark (`cancel`)
  - Warning: ⚠ exclamation (`warning`)
  - Info: ℹ info (`info`)
- **Progress Bar Countdown**: Visual indicator of remaining time
- **Inline Action Button**: "Annuler", "Réessayer", or custom actions
- **Swipe-to-Dismiss**: Mobile gesture support (left/right swipe)
- **Queue Management**: Maximum 3 simultaneous toasts
- **Enter/Exit Animations**: slideInRight (300ms) / fadeOut (200ms)
- **ARIA Live Announcements**: Screen reader support (polite/assertive)

### 🎨 Design
- Material Design elevation (shadow-4, shadow-5 on hover)
- Color-coded borders (4px left border)
- Responsive design (mobile-optimized)
- Dark mode support
- High contrast mode support
- Reduced motion support

### ♿ Accessibility
- ARIA live regions (`polite` for info/success/warning, `assertive` for errors)
- Role attributes (`alert` for errors, `status` for others)
- Focus management for action buttons
- Keyboard navigation support
- Screen reader announcements in French
- Minimum 44px touch targets on mobile

## Usage

### Basic Examples

```typescript
import { Component } from '@angular/core';
import { ToastNotificationService } from '../services/toast-notification.service';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html'
})
export class ExampleComponent {
  constructor(private toast: ToastNotificationService) {}

  // Success toast (5 seconds, top-right)
  showSuccess(): void {
    this.toast.success('Opération réussie !');
  }

  // Error toast (7 seconds, top-right)
  showError(): void {
    this.toast.error('Une erreur est survenue');
  }

  // Warning toast (6 seconds, top-right)
  showWarning(): void {
    this.toast.warning('Attention : action irréversible');
  }

  // Info toast (5 seconds, top-right)
  showInfo(): void {
    this.toast.info('Nouveau message reçu');
  }
}
```

### Custom Position

```typescript
// Top-left position
this.toast.success('Sauvegarde réussie', undefined, 5000, 'top-left');

// Bottom-right position
this.toast.error('Échec de connexion', undefined, 7000, 'bottom-right');

// Bottom-center position
this.toast.info('Téléchargement terminé', undefined, 5000, 'bottom-center');
```

### With Action Button

```typescript
// Simple action (string label)
this.toast.error(
  'Échec de sauvegarde',
  'Réessayer',
  5000,
  'top-right'
);

// Advanced action with handler
this.toast.error(
  'Connexion perdue',
  {
    label: 'Reconnecter',
    handler: () => {
      this.reconnect();
    }
  },
  7000,
  'top-right'
);

// Undo action
const toastId = this.toast.success(
  'Élément supprimé',
  {
    label: 'Annuler',
    handler: () => {
      this.undoDelete();
    }
  },
  5000,
  'top-right'
);
```

### Advanced Configuration

```typescript
// Custom toast with all options
const toastId = this.toast.show({
  message: 'Traitement en cours...',
  type: 'info',
  action: {
    label: 'Annuler',
    handler: () => this.cancelOperation()
  },
  duration: 10000, // 10 seconds
  dismissible: true, // Show close button
  position: 'top-right',
  showProgress: true // Show progress bar
});

// Manually dismiss a specific toast
this.toast.dismiss(toastId);

// Dismiss all toasts
this.toast.dismissAll();

// Clear the queue
this.toast.clearQueue();
```

### Toast Positions

```typescript
export type ToastPosition = 
  | 'top-right'    // Default
  | 'top-left' 
  | 'top-center' 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'bottom-center';
```

## Queue Management

The toast system automatically manages a queue with the following behavior:
- **Maximum 3 simultaneous toasts** displayed at once
- Additional toasts are queued and shown when space becomes available
- Queue processes automatically as toasts are dismissed
- FIFO (First In, First Out) queue processing

```typescript
// All 5 toasts will be queued
// Only 3 will show simultaneously
// The remaining 2 will appear as the first 3 are dismissed
for (let i = 0; i < 5; i++) {
  this.toast.info(`Message ${i + 1}`);
}
```

## Swipe Gestures (Mobile)

On mobile devices, users can swipe left or right to dismiss toasts:
- **Swipe Left**: Dismiss toast
- **Swipe Right**: Dismiss toast
- Swipe threshold: 50px
- Velocity threshold: 0.3

The swipe gesture is handled by the existing `SwipeGestureDirective`.

## Animations

### Enter Animation (slideInRight)
- Duration: 300ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design standard easing)
- Transform: `translateX(100%)` → `translateX(0)`
- Opacity: 0 → 1

### Exit Animation (fadeOut)
- Duration: 200ms
- Easing: `cubic-bezier(0.4, 0, 1, 1)` (Material Design acceleration)
- Transform: `translateX(0)` → `translateX(100%)`
- Opacity: 1 → 0

## Progress Bar

Each toast displays an animated progress bar that counts down from 0% to 100%:
- Updates smoothly with 100ms linear transitions
- Color-coded by toast type
- Accessible with `role="progressbar"` and aria attributes
- Hidden when duration is 0 or not set

## Styling

### CSS Variables Used

```css
/* Spacing */
--spacing-1, --spacing-2, --spacing-3, --spacing-4

/* Colors */
--color-success-600, --color-error-600, 
--color-warning-600/700, --color-info-600
--color-neutral-0, --color-neutral-200, 
--color-neutral-600, --color-neutral-800, --color-neutral-900
--color-primary-500, --color-primary-600, --color-primary-700

/* Border Radius */
--radius-base, --radius-lg

/* Shadows */
--shadow-4, --shadow-5

/* Z-Index */
--z-index-notification (1080)

/* Typography */
--font-size-xs, --font-size-sm
--font-weight-medium
--line-height-body

/* Transitions */
--transition-colors, --transition-transform, --transition-shadow
```

### Custom Styling

```css
/* Override toast container max-width */
.toast-container {
  max-width: 500px;
}

/* Customize toast shadow */
.toast {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* Change success color */
.toast-success {
  border-left-color: #00c853;
}

/* Adjust mobile breakpoint */
@media (max-width: 768px) {
  .toast-container {
    max-width: 100%;
  }
}
```

## Accessibility

### ARIA Live Announcements

The system automatically announces toasts to screen readers:
- **Polite** mode: `info`, `success`, `warning` (does not interrupt)
- **Assertive** mode: `error` (interrupts current announcement)

### Role Attributes
- `role="alert"` for error toasts
- `role="status"` for other types
- `role="progressbar"` for progress bars

### Keyboard Navigation
- Close button: Focusable with visible focus outline
- Action button: Focusable with visible focus outline
- Tab order: Icon (skipped) → Message → Action → Close

### Screen Reader Announcements (French)
- Succès: "Succès: [message]"
- Erreur: "Erreur: [message]"
- Avertissement: "Avertissement: [message]"
- Information: "Information: [message]"

## Best Practices

### Do's ✅
- Use appropriate toast type for the message context
- Keep messages concise (under 100 characters)
- Provide action buttons for reversible operations
- Use longer durations for error messages (7s+)
- Use top-right for most notifications (default)

### Don'ts ❌
- Don't spam multiple toasts rapidly
- Don't use toasts for critical errors (use modals instead)
- Don't make toasts non-dismissible without good reason
- Don't use very short durations (< 3 seconds)
- Don't put lengthy content in toasts

## Examples

### Form Submission

```typescript
onSubmit(): void {
  this.loading = true;
  this.apiService.submitForm(this.formData).subscribe({
    next: () => {
      this.toast.success('Formulaire envoyé avec succès');
      this.router.navigate(['/success']);
    },
    error: (err) => {
      this.loading = false;
      this.toast.error(
        'Échec de l\'envoi du formulaire',
        {
          label: 'Réessayer',
          handler: () => this.onSubmit()
        },
        7000
      );
    }
  });
}
```

### Delete with Undo

```typescript
async deleteItem(id: string): Promise<void> {
  // Optimistic update
  const deleted = this.items.find(i => i.id === id);
  this.items = this.items.filter(i => i.id !== id);
  
  const toastId = this.toast.success(
    'Élément supprimé',
    {
      label: 'Annuler',
      handler: () => {
        this.items.push(deleted!);
        this.toast.dismiss(toastId);
        this.toast.info('Suppression annulée');
      }
    },
    5000
  );
  
  // Actual deletion
  setTimeout(() => {
    this.apiService.deleteItem(id).subscribe();
  }, 5000);
}
```

### Network Status

```typescript
constructor(
  private toast: ToastNotificationService,
  private offline: OfflineService
) {
  this.offline.online$.subscribe(online => {
    if (online) {
      this.toast.success('Connexion rétablie', undefined, 3000, 'bottom-center');
    } else {
      this.toast.warning(
        'Connexion perdue - Mode hors ligne',
        undefined,
        0, // Don't auto-dismiss
        'bottom-center'
      );
    }
  });
}
```

## Integration

The `NotificationToastComponent` is automatically included in `app.component.html` and will render toasts globally across the entire application.

```html
<!-- Already added to app.component.html -->
<app-notification-toast></app-notification-toast>
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari 14+
- Chrome Mobile 90+

## Performance

- **Change Detection**: OnPush strategy for optimal performance
- **Animations**: Hardware-accelerated transforms and opacity
- **Memory**: Automatic cleanup of dismissed toasts
- **Queue**: Efficient FIFO processing with minimal overhead

## Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { ToastNotificationService } from './toast-notification.service';

describe('ToastNotificationService', () => {
  let service: ToastNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastNotificationService);
  });

  it('should show success toast', (done) => {
    const id = service.success('Test message');
    
    service.activeToasts.subscribe(toasts => {
      expect(toasts.length).toBe(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('Test message');
      done();
    });
  });

  it('should respect max simultaneous limit', () => {
    for (let i = 0; i < 5; i++) {
      service.info(`Message ${i}`);
    }

    service.activeToasts.subscribe(toasts => {
      expect(toasts.length).toBeLessThanOrEqual(3);
    });
  });
});
```

## Roadmap

Future enhancements:
- [ ] Toast templates with custom HTML content
- [ ] Stacking vs. replacing behavior options
- [ ] Sound notifications (optional)
- [ ] Persistent toasts (survive navigation)
- [ ] Toast history panel
- [ ] Batch dismiss by type
- [ ] Custom animation presets
- [ ] Priority queue ordering

## License

Part of the AtlasImmo application.
