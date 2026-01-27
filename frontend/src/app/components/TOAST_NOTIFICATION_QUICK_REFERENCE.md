# Toast Notification - Quick Reference

## Quick Start

```typescript
import { ToastNotificationService } from '../services/toast-notification.service';

constructor(private toast: ToastNotificationService) {}

// Basic usage
this.toast.success('Opération réussie !');
this.toast.error('Une erreur est survenue');
this.toast.warning('Attention');
this.toast.info('Nouveau message');
```

## API Reference

### Methods

#### `success(message, action?, duration?, position?)`
```typescript
this.toast.success('Sauvegarde réussie', 'Voir', 5000, 'top-right');
// Returns: toast ID (string)
```

#### `error(message, action?, duration?, position?)`
```typescript
this.toast.error('Échec', 'Réessayer', 7000, 'top-right');
// Returns: toast ID (string)
```

#### `warning(message, action?, duration?, position?)`
```typescript
this.toast.warning('Action irréversible', undefined, 6000, 'top-right');
// Returns: toast ID (string)
```

#### `info(message, action?, duration?, position?)`
```typescript
this.toast.info('Téléchargement terminé', undefined, 5000, 'top-right');
// Returns: toast ID (string)
```

#### `show(config)`
```typescript
const id = this.toast.show({
  message: 'Message',
  type: 'info',
  action: { label: 'Action', handler: () => {} },
  duration: 5000,
  dismissible: true,
  position: 'top-right',
  showProgress: true
});
// Returns: toast ID (string)
```

#### `dismiss(id)`
```typescript
this.toast.dismiss('toast-123');
```

#### `dismissAll()`
```typescript
this.toast.dismissAll();
```

#### `clearQueue()`
```typescript
this.toast.clearQueue();
```

### Types

```typescript
type ToastPosition = 
  | 'top-right'    // Default
  | 'top-left' 
  | 'top-center' 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'bottom-center';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
  label: string;
  handler: () => void;
}

interface ToastNotification {
  id?: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  duration?: number;          // milliseconds (0 = no auto-dismiss)
  dismissible?: boolean;      // show close button (default: true)
  position?: ToastPosition;   // default: 'top-right'
  showProgress?: boolean;     // show progress bar (default: true)
}
```

## Common Patterns

### With Action Button

```typescript
// String action (no handler)
this.toast.error('Échec', 'Réessayer');

// Object action (with handler)
this.toast.error('Échec', {
  label: 'Réessayer',
  handler: () => this.retry()
});
```

### Undo Pattern

```typescript
const toastId = this.toast.success('Supprimé', {
  label: 'Annuler',
  handler: () => {
    this.undo();
    this.toast.dismiss(toastId);
  }
}, 5000);
```

### Custom Position

```typescript
// Bottom-center for network status
this.toast.warning('Mode hors ligne', undefined, 0, 'bottom-center');

// Top-left for secondary notifications
this.toast.info('Sync en cours', undefined, 3000, 'top-left');
```

### No Auto-Dismiss

```typescript
// Duration = 0 means no auto-dismiss
this.toast.warning('Connexion perdue', undefined, 0);
```

## Features at a Glance

| Feature | Supported |
|---------|-----------|
| 6 Positions | ✅ |
| 4 Types with Icons | ✅ |
| Progress Bar | ✅ |
| Action Button | ✅ |
| Swipe-to-Dismiss | ✅ |
| Max 3 Simultaneous | ✅ |
| Queue Management | ✅ |
| ARIA Announcements | ✅ |
| Enter/Exit Animations | ✅ |
| Dark Mode | ✅ |
| Mobile Responsive | ✅ |

## Default Durations

| Type | Duration |
|------|----------|
| Success | 5000ms (5s) |
| Error | 7000ms (7s) |
| Warning | 6000ms (6s) |
| Info | 5000ms (5s) |

## Icons

| Type | Material Icon | Symbol |
|------|--------------|--------|
| Success | `check_circle` | ✓ |
| Error | `cancel` | ✗ |
| Warning | `warning` | ⚠ |
| Info | `info` | ℹ |

## Animations

- **Enter**: slideInRight (300ms, translateX(100%) → 0)
- **Exit**: fadeOut (200ms, opacity 1 → 0, translateX 0 → 100%)

## Queue Behavior

- Maximum 3 toasts visible simultaneously
- FIFO (First In, First Out) queue processing
- Automatic processing when space available
- Can be cleared with `clearQueue()`

## Accessibility

- ARIA live regions (polite/assertive)
- Role attributes (alert/status)
- Progress bar with aria attributes
- Screen reader announcements in French
- 44px minimum touch targets on mobile
- Focus visible on interactive elements

## CSS Variables

```css
--z-index-notification: 1080
--shadow-4, --shadow-5
--spacing-1 to --spacing-4
--color-success-600, --color-error-600, etc.
--radius-base, --radius-lg
--transition-colors, --transition-transform
```

## Examples

```typescript
// Form submission success
this.toast.success('Formulaire envoyé');

// API error with retry
this.toast.error('Échec de chargement', {
  label: 'Réessayer',
  handler: () => this.loadData()
}, 7000);

// Offline warning (persistent)
this.toast.warning('Mode hors ligne', undefined, 0, 'bottom-center');

// Multiple toasts (queued)
for (let i = 0; i < 5; i++) {
  this.toast.info(`Message ${i + 1}`);
}

// Dismiss all toasts
this.toast.dismissAll();
```

## Component Integration

The component is globally available and automatically renders toasts:

```html
<!-- Already in app.component.html -->
<app-notification-toast></app-notification-toast>
```

No additional setup required - just inject and use the service!
