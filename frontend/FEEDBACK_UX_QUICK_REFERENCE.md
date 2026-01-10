# UX Feedback Quick Reference

## Toast Notifications

```typescript
// Import
import { ToastNotificationService } from './services/toast-notification.service';

// Inject
constructor(private toast: ToastNotificationService) {}

// Success
this.toast.success('Saved successfully!');
this.toast.success('Saved!', 'View', () => this.view());

// Error
this.toast.error('Save failed');
this.toast.error('Failed', 'Retry', () => this.retry());

// Warning
this.toast.warning('Warning message');

// Info
this.toast.info('Info message');
```

## Form Validation Animation

```html
<input matInput formControlName="email" appFormValidationAnimation>
```

Auto error messages for: required, email, minlength, maxlength, pattern, min, max

## Success Animation

```html
<app-success-animation 
  message="Success!" 
  size="medium">
</app-success-animation>
```

Sizes: 'small' | 'medium' | 'large'

## Form Animations

```typescript
import { 
  formFieldErrorAnimation,
  errorMessageAnimation,
  successFeedbackAnimation,
  formSubmitAnimation,
  loadingSpinnerAnimation
} from './animations';

@Component({
  animations: [formFieldErrorAnimation, errorMessageAnimation]
})
```

## HTTP Error Handling

Automatic via `CorrelationIdInterceptor`:
- 401: Session expired (reconnect action)
- 403: Access denied
- 400: Bad request
- 404: Not found
- 409: Conflict (retry action)
- 500: Server error (retry action)
- 0/503/504: Network error (retry action)

## Common Patterns

### Save with Feedback
```typescript
save() {
  this.api.save(data).subscribe({
    next: () => {
      this.toast.success('Saved!');
      this.showSuccess = true;
      setTimeout(() => this.router.navigate(['/list']), 1500);
    },
    error: () => this.toast.error('Save failed', 'Retry', () => this.save())
  });
}
```

### Delete with Confirmation
```typescript
delete() {
  const ref = this.dialog.open(ConfirmDialog);
  ref.afterClosed().subscribe(confirmed => {
    if (confirmed) {
      this.api.delete(id).subscribe({
        next: () => this.toast.success('Deleted'),
        error: () => this.toast.error('Delete failed', 'Retry', () => this.delete())
      });
    }
  });
}
```

### Form with Validation
```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <mat-form-field>
    <input matInput formControlName="name" appFormValidationAnimation>
  </mat-form-field>
  
  <button [disabled]="!form.valid">Submit</button>
  
  <app-success-animation 
    *ngIf="showSuccess"
    message="Submitted!">
  </app-success-animation>
</form>
```

## Testing

```typescript
const mockToast = jasmine.createSpyObj('ToastNotificationService', 
  ['success', 'error', 'warning', 'info']);

TestBed.configureTestingModule({
  providers: [{ provide: ToastNotificationService, useValue: mockToast }]
});

// Verify
expect(mockToast.success).toHaveBeenCalledWith('Message');
```

## Styling

CSS Variables (from `variables.scss`):
- `--color-success-500`: Success color
- `--color-error-500`: Error color
- `--color-warning-500`: Warning color
- `--color-info-500`: Info color
- `--transition-base`: Base transition
- `--shadow-lg`: Large shadow

## Accessibility

All components include:
- ARIA labels and roles
- Live regions for announcements
- Keyboard navigation
- Focus indicators
- Reduced motion support
