# UX Feedback Enhancement Guide

This guide explains how to use the enhanced error and success feedback features in the application.

## Table of Contents

- [Toast Notification Service](#toast-notification-service)
- [Enhanced Snackbars](#enhanced-snackbars)
- [Form Validation Animations](#form-validation-animations)
- [Success Animation Component](#success-animation-component)
- [Enhanced Error Pages](#enhanced-error-pages)
- [HTTP Error Handling](#http-error-handling)

## Toast Notification Service

The `ToastNotificationService` provides a queuing system for notifications with Material Design snackbars.

### Basic Usage

```typescript
import { ToastNotificationService } from './services/toast-notification.service';

constructor(private toastService: ToastNotificationService) {}

// Success notification
this.toastService.success('Données enregistrées avec succès!');

// Error notification
this.toastService.error('Une erreur est survenue');

// Warning notification
this.toastService.warning('Attention: cette action est irréversible');

// Info notification
this.toastService.info('Nouvelle fonctionnalité disponible');
```

### With Action Buttons

```typescript
// With action callback
this.toastService.error(
  'Échec de la sauvegarde',
  'Réessayer',
  () => {
    this.saveData();
  }
);

// With custom duration
this.toastService.success(
  'Fichier téléchargé',
  'Ouvrir',
  () => {
    this.openFile();
  },
  3000 // 3 seconds
);
```

### Advanced Features

- **Automatic Queuing**: Multiple notifications are queued and shown sequentially
- **Auto-dismiss**: Notifications auto-dismiss after the specified duration
- **Dismissible**: Users can manually dismiss notifications
- **Material Icons**: Automatic icon based on notification type

## Enhanced Snackbars

The `EnhancedSnackbarComponent` provides rich snackbar UI with icons and actions.

### Features

- Material icons (check_circle, error, warning, info)
- Action buttons
- Close button
- Slide-in animation
- Responsive design
- ARIA accessibility

### Styling

Snackbars are automatically styled based on type:
- Success: Green (#27ae60)
- Error: Red (#e74c3c)
- Warning: Orange (#f39c12)
- Info: Blue (#2196f3)

## Form Validation Animations

Use the `FormValidationAnimationDirective` for smooth validation feedback.

### Usage

```html
<mat-form-field appearance="outline">
  <mat-label>Email</mat-label>
  <input 
    matInput 
    formControlName="email"
    appFormValidationAnimation
    type="email"
    placeholder="email@example.com">
</mat-form-field>
```

### Features

- **Smooth Height Transition**: Error messages slide down smoothly
- **Shake Animation**: Invalid fields shake on error
- **Auto-error Messages**: Common validation errors have default messages
- **Accessibility**: Maintains ARIA attributes

### Supported Validators

- `required`: "Ce champ est requis"
- `email`: "Email invalide"
- `minlength`: "Minimum X caractères requis"
- `maxlength`: "Maximum X caractères autorisés"
- `pattern`: "Format invalide"
- `min`: "La valeur minimum est X"
- `max`: "La valeur maximum est X"

## Success Animation Component

Display animated success feedback with checkmark.

### Usage

```html
<app-success-animation 
  message="Opération réussie!"
  size="medium">
</app-success-animation>
```

### Props

- `message` (optional): Success message to display
- `size`: 'small' | 'medium' | 'large' (default: 'medium')

### Example in Dialog

```typescript
import { MatDialog } from '@angular/material/dialog';
import { SuccessAnimationComponent } from './components/success-animation.component';

saveData() {
  this.api.save(this.data).subscribe(() => {
    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      width: '400px',
      data: { message: 'Données enregistrées avec succès!' }
    });
    
    setTimeout(() => dialogRef.close(), 2000);
  });
}
```

## Enhanced Error Pages

Error pages now include:
- SVG illustrations with animations
- Gradient backgrounds
- Clear action buttons
- Floating animations
- Responsive design

### Pages

1. **Access Denied** (`/access-denied`)
   - Lock icon illustration
   - Options to return to dashboard or logout

2. **Session Expired** (`/session-expired`)
   - Animated clock illustration
   - Reconnection action

### Customization

Styles use CSS variables from `variables.scss`:

```css
.error-page-container {
  background: linear-gradient(135deg, 
    var(--color-neutral-50) 0%, 
    var(--color-primary-50) 50%,
    var(--color-neutral-50) 100%);
}
```

## HTTP Error Handling

The `CorrelationIdInterceptor` automatically handles HTTP errors with toast notifications.

### Automatic Handling

- **401 Unauthorized**: Session expired notification with reconnect action
- **403 Forbidden**: Access denied notification
- **400 Bad Request**: Invalid request notification
- **404 Not Found**: Resource not found notification
- **409 Conflict**: Conflict notification with retry action
- **500 Server Error**: Server error notification with retry action
- **0/503/504**: Connection error notification with retry action

### Retry Functionality

Network errors automatically include a retry action:

```typescript
case 500:
  this.toastService.error(
    'Une erreur interne est survenue.',
    'Réessayer',
    () => this.retryRequest(originalRequest, correlationId)
  );
  break;
```

### Correlation IDs

All API requests include a correlation ID for tracking:
- Format: `{timestamp}-{random}`
- Logged to console for debugging
- Included in error messages

## Form Animations

Use predefined animations for consistent form feedback.

### Available Animations

```typescript
import { 
  formFieldErrorAnimation,
  errorMessageAnimation,
  successFeedbackAnimation,
  formSubmitAnimation,
  loadingSpinnerAnimation
} from './animations/form-animations';

@Component({
  animations: [
    formFieldErrorAnimation,
    errorMessageAnimation,
    successFeedbackAnimation
  ]
})
```

### Example: Form with Animations

```typescript
@Component({
  template: `
    <form [formGroup]="myForm" [@formSubmit]="formState">
      <mat-form-field [@errorState]="emailError ? 'error' : 'valid'">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email">
        <mat-error *ngIf="emailError" @errorMessage>
          {{ emailError }}
        </mat-error>
      </mat-form-field>
      
      <button mat-raised-button (click)="submit()">
        <mat-spinner *ngIf="isSubmitting" @loadingSpinner></mat-spinner>
        <span *ngIf="!isSubmitting">Envoyer</span>
      </button>
      
      <app-success-animation 
        *ngIf="showSuccess" 
        @successFeedback
        message="Formulaire envoyé!">
      </app-success-animation>
    </form>
  `,
  animations: [
    formFieldErrorAnimation,
    errorMessageAnimation,
    successFeedbackAnimation,
    formSubmitAnimation,
    loadingSpinnerAnimation
  ]
})
export class MyFormComponent {
  formState: 'idle' | 'submitting' | 'success' | 'error' = 'idle';
  
  submit() {
    this.formState = 'submitting';
    this.api.submit(this.myForm.value).subscribe({
      next: () => {
        this.formState = 'success';
        this.toastService.success('Formulaire envoyé avec succès!');
      },
      error: () => {
        this.formState = 'error';
        this.toastService.error('Erreur lors de l\'envoi');
      }
    });
  }
}
```

## Best Practices

### 1. Use Appropriate Notification Types

- **Success**: Completed actions (save, delete, update)
- **Error**: Failed operations, validation errors
- **Warning**: Potentially dangerous actions, deprecation notices
- **Info**: General information, feature announcements

### 2. Provide Clear Actions

```typescript
// Good
this.toastService.error('Connexion perdue', 'Réessayer', () => this.reconnect());

// Avoid
this.toastService.error('Erreur');
```

### 3. Keep Messages Concise

```typescript
// Good
this.toastService.success('Données enregistrées');

// Too verbose
this.toastService.success('Vos données ont été enregistrées avec succès dans la base de données');
```

### 4. Use Form Validation Directive

Always add `appFormValidationAnimation` to form inputs for consistent UX:

```html
<input matInput formControlName="name" appFormValidationAnimation>
```

### 5. Combine Feedback Methods

```typescript
saveData() {
  this.api.save(this.data).subscribe({
    next: () => {
      // 1. Show success toast
      this.toastService.success('Données enregistrées');
      
      // 2. Show success animation in form
      this.showSuccessAnimation = true;
      
      // 3. Navigate after delay
      setTimeout(() => this.router.navigate(['/dashboard']), 1500);
    }
  });
}
```

## Accessibility

All components include proper ARIA attributes:

```html
<button 
  aria-label="Fermer la notification"
  (click)="dismiss()">
  <mat-icon>close</mat-icon>
</button>
```

Form errors are announced to screen readers:

```html
<mat-error role="alert" aria-live="polite">
  Ce champ est requis
</mat-error>
```

## Responsive Design

All components are responsive:

- Snackbars adjust width on mobile
- Error pages stack vertically on small screens
- Form animations work on touch devices
- Reduced motion support via `prefers-reduced-motion`

## Performance

- Animations use CSS transforms for GPU acceleration
- Toast queue prevents notification overflow
- Lazy loading of success animations
- Efficient change detection

## Testing

Mock the toast service in tests:

```typescript
const mockToastService = jasmine.createSpyObj('ToastNotificationService', [
  'success', 'error', 'warning', 'info'
]);

TestBed.configureTestingModule({
  providers: [
    { provide: ToastNotificationService, useValue: mockToastService }
  ]
});

// Verify notification was shown
expect(mockToastService.success).toHaveBeenCalledWith('Success message');
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE11 with polyfills
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 5+)
