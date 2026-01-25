# Quick Start: Enhanced Form Validation

## 5-Minute Integration Guide

### 1. Email Suggestions (Simplest)

```typescript
// component.ts
import { FormValidationService, ValidationSuggestion } from './services/form-validation.service';

emailSuggestions: ValidationSuggestion[] = [];

constructor(private validationService: FormValidationService) {}

ngOnInit() {
  this.form.get('email')?.valueChanges.pipe(
    debounceTime(800)
  ).subscribe(value => {
    this.validationService.getEmailSuggestions(value).subscribe(
      suggestions => this.emailSuggestions = suggestions
    );
  });
}

onAcceptSuggestion(suggestion: ValidationSuggestion) {
  this.form.patchValue({ email: suggestion.suggestedValue });
  this.emailSuggestions = [];
}
```

```html
<!-- component.html -->
<mat-form-field>
  <input matInput formControlName="email">
</mat-form-field>

<app-inline-validation-suggestion
  *ngIf="emailSuggestions.length > 0"
  [suggestion]="emailSuggestions[0]"
  (accept)="onAcceptSuggestion($event)"
  (dismiss)="emailSuggestions = []">
</app-inline-validation-suggestion>
```

### 2. Phone Formatting

```typescript
onPhoneBlur() {
  const phone = this.form.get('phone')?.value;
  const formatted = this.validationService.formatPhoneNumber(phone);
  this.form.patchValue({ phone: formatted });
}
```

```html
<input matInput formControlName="phone" (blur)="onPhoneBlur()">
```

### 3. Auto-Save

```typescript
import { FormDraftService } from './services/form-draft.service';

constructor(private draftService: FormDraftService) {}

ngOnInit() {
  // Load draft
  const draft = this.draftService.loadDraft('my-form');
  if (draft) this.form.patchValue(draft.data);
  
  // Setup auto-save
  this.draftService.setupAutoSave('my-form', this.form.valueChanges);
}

ngOnDestroy() {
  this.draftService.stopAutoSave('my-form');
}

onSubmit() {
  this.draftService.deleteDraft('my-form');
}
```

### 4. Unsaved Changes Guard

```typescript
// component.ts
import { ComponentCanDeactivate } from './guards/form-unsaved-changes.guard';

export class MyFormComponent implements ComponentCanDeactivate {
  private initialFormValue: any;
  
  ngOnInit() {
    this.initialFormValue = this.form.value;
  }
  
  canDeactivate() { return !this.hasUnsavedChanges(); }
  hasUnsavedChanges() {
    return JSON.stringify(this.form.value) !== JSON.stringify(this.initialFormValue);
  }
}

// routing.module.ts
{
  path: 'form',
  component: MyFormComponent,
  canDeactivate: [FormUnsavedChangesGuard]
}
```

### 5. Progress Indicator

```typescript
// component.ts
import { FormStep } from './components/form-progress-indicator.component';

formSteps: FormStep[] = [
  { label: 'Step 1', completed: false },
  { label: 'Step 2', completed: false }
];
currentStep = 0;

nextStep() {
  this.formSteps[this.currentStep].completed = true;
  this.currentStep++;
}
```

```html
<app-form-progress-indicator
  [steps]="formSteps"
  [currentStep]="currentStep">
</app-form-progress-indicator>
```

### 6. Contextual Hints

```typescript
// component.ts
emailHints = {
  default: 'Enter your email',
  focused: 'Format: user@domain.com',
  valid: 'Email looks good ✓',
  invalid: 'Invalid email format'
};
```

```html
<input 
  matInput 
  formControlName="email"
  [appContextualHint]="emailHints"
  [hintControl]="form.get('email')!">
```

## Complete Example

See `frontend/src/app/components/enhanced-form-example.component.ts` for a working implementation with all features.

## Common Patterns

### Validate on Blur

```typescript
emailControl.valueChanges.pipe(
  debounceTime(800),
  takeUntil(this.destroy$)
).subscribe(/* validation */);
```

### Show Loading Spinner

```typescript
validatingEmail = false;

validateEmail() {
  this.validatingEmail = true;
  this.validationService.getEmailSuggestions(email).subscribe(
    suggestions => {
      this.emailSuggestions = suggestions;
      this.validatingEmail = false;
    }
  );
}
```

```html
<mat-icon matSuffix *ngIf="validatingEmail">
  <mat-spinner diameter="20"></mat-spinner>
</mat-icon>
```

## Documentation

- Full docs: `frontend/src/app/components/FORM_VALIDATION_README.md`
- Implementation summary: `FORM_VALIDATION_IMPLEMENTATION.md`
