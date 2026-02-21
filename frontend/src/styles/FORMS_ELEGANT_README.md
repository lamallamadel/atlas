# Elegant Form Design System

A comprehensive form styling system that provides visually elegant forms with enhanced user experience through animations, validation feedback, and clear visual hierarchy.

## 🎨 Features

### 1. **Increased Vertical Spacing (24px)**
All form fields have 24px vertical spacing for better readability and touch targets.

```html
<form class="elegant-form">
  <!-- Fields automatically get 24px spacing -->
  <div class="elegant-form-field">...</div>
  <div class="elegant-form-field">...</div>
</form>
```

### 2. **Floating Labels with Smooth Animation**
Labels float up when field is focused or has value, with smooth transitions.

```html
<div class="elegant-form-field">
  <input type="text" id="email" placeholder=" ">
  <label for="email">Email</label>
</div>
```

Key features:
- Smooth transition (300ms cubic-bezier)
- Changes color to primary on focus
- Scales down and moves up when active
- Background color for label overlay

### 3. **Helper Text (Secondary)**
Contextual helper text below fields provides guidance.

```html
<div class="elegant-form-field">
  <input type="text" id="phone" placeholder=" ">
  <label for="phone">Phone</label>
  <div class="field-helper">
    <mat-icon>info</mat-icon>
    <span>Format: +33 6 12 34 56 78</span>
  </div>
</div>
```

### 4. **Prefix & Suffix Icons**
Icons can be placed at the start or end of inputs.

```html
<div class="elegant-form-field">
  <input type="email" id="email" placeholder=" " class="has-prefix has-suffix">
  <label for="email">Email</label>
  <div class="field-prefix">
    <mat-icon>email</mat-icon>
  </div>
  <div class="field-suffix">
    <mat-icon>check</mat-icon>
  </div>
</div>
```

Features:
- Auto-adjusts input padding
- Color changes on focus
- Positioned absolutely for perfect alignment

### 5. **Inline Validation with Animated Icons**
Real-time validation feedback with animated success/error icons.

```html
<div class="elegant-form-field field-valid">
  <input type="text" id="name" placeholder=" ">
  <label for="name">Name</label>
  <div class="validation-icon">
    <mat-icon>check_circle</mat-icon>
  </div>
</div>
```

States:
- `field-validating` - Spinner animation
- `field-valid` - Green checkmark with scale-in animation
- `field-error` - Red error icon with shake animation

Animations:
```scss
// Validating: Spin
@keyframes spin {
  from { transform: translateY(-50%) rotate(0deg); }
  to { transform: translateY(-50%) rotate(360deg); }
}

// Valid: Scale in with bounce
@keyframes scaleIn {
  0% { opacity: 0; transform: translateY(-50%) scale(0.5); }
  50% { transform: translateY(-50%) scale(1.1); }
  100% { opacity: 1; transform: translateY(-50%) scale(1); }
}

// Error: Shake
@keyframes shake {
  0%, 100% { transform: translateY(-50%) translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateY(-50%) translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateY(-50%) translateX(4px); }
}
```

### 6. **Progress Stepper with Connecting Lines**
Horizontal stepper with animated progress lines.

```html
<div class="elegant-stepper">
  <div class="stepper-line">
    <div class="stepper-line-progress" [style.width.%]="50"></div>
  </div>
  
  <div class="stepper-step step-completed">
    <div class="step-circle">
      <mat-icon>check</mat-icon>
    </div>
    <div class="step-label">Step 1</div>
  </div>
  
  <div class="stepper-step step-active">
    <div class="step-circle">2</div>
    <div class="step-label">Step 2</div>
  </div>
  
  <div class="stepper-step step-pending">
    <div class="step-circle">3</div>
    <div class="step-label">Step 3</div>
  </div>
</div>
```

Features:
- Connecting lines between steps
- Animated progress indicator
- Step states: pending, active, completed, error
- Pulsing animation on active step
- Responsive (vertical on mobile)

### 7. **Pronounced Focus States**
Strong visual feedback on focus with 2px solid border + glow effect.

```scss
.elegant-form-field input:focus {
  border: 2px solid var(--color-primary-500) !important;
  box-shadow: 0 0 0 4px var(--color-primary-alpha-20),
              0 2px 8px rgba(44, 90, 160, 0.15) !important;
}
```

Features:
- 2px solid primary color border
- 4px glow (20% opacity primary)
- Additional shadow for depth
- WCAG AA compliant contrast
- Adjusts padding to compensate for thicker border

### 8. **Grouped Sections with Cards**
Organize form fields into logical sections with cards.

```html
<div class="form-section-card">
  <div class="section-header">
    <mat-icon>person</mat-icon>
    <div>
      <h2 class="section-title">Personal Information</h2>
      <p class="section-subtitle">Enter your personal details</p>
    </div>
  </div>
  
  <div class="section-body">
    <!-- Form fields here -->
  </div>
</div>
```

Features:
- Card elevation with hover effect
- Icon + title + subtitle header
- Bottom border separator
- Consistent spacing
- Shadow transitions

## 📋 Usage Examples

### Basic Form with All Features

```html
<form class="elegant-form">
  <!-- Section 1: Personal Info -->
  <div class="form-section-card">
    <div class="section-header">
      <mat-icon>person</mat-icon>
      <div>
        <h2 class="section-title">Personal Information</h2>
        <p class="section-subtitle">Tell us about yourself</p>
      </div>
    </div>
    
    <div class="section-body">
      <!-- Name field with validation -->
      <div class="elegant-form-field" 
           [ngClass]="{
             'has-value': form.get('name')?.value,
             'field-valid': form.get('name')?.valid && form.get('name')?.touched,
             'field-error': form.get('name')?.invalid && form.get('name')?.touched
           }">
        <input 
          type="text" 
          id="name" 
          formControlName="name"
          placeholder=" "
          class="has-prefix">
        <label for="name">Full Name <span class="required-indicator">*</span></label>
        <div class="field-prefix">
          <mat-icon>person</mat-icon>
        </div>
        <div class="validation-icon" *ngIf="form.get('name')?.touched">
          <mat-icon *ngIf="form.get('name')?.valid">check_circle</mat-icon>
          <mat-icon *ngIf="form.get('name')?.invalid">error</mat-icon>
        </div>
        <div class="field-helper" *ngIf="!form.get('name')?.touched || form.get('name')?.valid">
          <mat-icon>info</mat-icon>
          <span>Enter your full legal name</span>
        </div>
        <div class="error-message" *ngIf="form.get('name')?.invalid && form.get('name')?.touched">
          <mat-icon>error</mat-icon>
          <span>Name is required</span>
        </div>
      </div>
      
      <!-- Email field with validation -->
      <div class="elegant-form-field"
           [ngClass]="{
             'has-value': form.get('email')?.value,
             'field-valid': form.get('email')?.valid && form.get('email')?.touched,
             'field-error': form.get('email')?.invalid && form.get('email')?.touched,
             'field-validating': validatingEmail
           }">
        <input 
          type="email" 
          id="email" 
          formControlName="email"
          placeholder=" "
          class="has-prefix has-suffix">
        <label for="email">Email <span class="required-indicator">*</span></label>
        <div class="field-prefix">
          <mat-icon>email</mat-icon>
        </div>
        <div class="validation-icon">
          <mat-spinner *ngIf="validatingEmail" diameter="20"></mat-spinner>
          <mat-icon *ngIf="!validatingEmail && form.get('email')?.valid">check_circle</mat-icon>
          <mat-icon *ngIf="!validatingEmail && form.get('email')?.invalid">error</mat-icon>
        </div>
        <div class="field-helper" *ngIf="!form.get('email')?.touched || form.get('email')?.valid">
          <mat-icon>info</mat-icon>
          <span>We'll send confirmation to this email</span>
        </div>
        <div class="error-message" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
          <mat-icon>error</mat-icon>
          <span>Please enter a valid email address</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Form Actions -->
  <div class="form-actions">
    <button mat-button type="button">Cancel</button>
    <div class="spacer"></div>
    <button mat-raised-button color="primary" type="submit">Submit</button>
  </div>
</form>
```

### Multi-Step Form with Stepper

```html
<div class="elegant-form">
  <!-- Progress Stepper -->
  <div class="elegant-stepper">
    <div class="stepper-line">
      <div class="stepper-line-progress" [style.width.%]="progressWidth"></div>
    </div>
    
    <div *ngFor="let step of steps; let i = index" 
         class="stepper-step"
         [ngClass]="{
           'step-active': i === currentStep,
           'step-completed': step.completed,
           'step-error': step.error
         }">
      <div class="step-circle">
        <mat-icon *ngIf="step.completed">check</mat-icon>
        <mat-icon *ngIf="step.error">error</mat-icon>
        <span *ngIf="!step.completed && !step.error">{{ i + 1 }}</span>
      </div>
      <div class="step-label">{{ step.label }}</div>
    </div>
  </div>
  
  <!-- Step Content -->
  <div class="form-step" *ngIf="currentStep === 0">
    <!-- Step 1 fields -->
  </div>
  
  <div class="form-step" *ngIf="currentStep === 1">
    <!-- Step 2 fields -->
  </div>
</div>
```

## 🎨 CSS Variables Used

The system uses design tokens from `variables.scss`:

```scss
// Colors
--color-primary-500        // Focus border, active states
--color-primary-alpha-20   // Focus glow
--color-success-600        // Valid state
--color-error-600          // Error state
--color-neutral-300        // Default borders
--color-neutral-600        // Helper text, labels

// Spacing
--spacing-6: 24px         // Vertical field spacing

// Transitions
--duration-moderate: 300ms // Smooth animations
--ease-out                // Easing function

// Typography
--font-size-base          // Input text
--font-weight-medium      // Labels
--font-weight-semibold    // Section titles

// Borders & Shadows
--radius-lg: 8px          // Input border radius
--shadow-sm               // Card shadows
```

## 🔧 Integration with Angular Material

The system works alongside Angular Material forms:

```html
<!-- Material form field with elegant enhancements -->
<form class="elegant-form">
  <mat-form-field appearance="outline" class="full-width">
    <mat-label>Email</mat-label>
    <input matInput type="email" formControlName="email">
    <mat-icon matPrefix>email</mat-icon>
    <mat-error>Invalid email</mat-error>
  </mat-form-field>
</form>
```

Overrides for Material components are included:
- Enhanced focus states (2px border + glow)
- Icon color transitions
- Consistent spacing

## 📱 Responsive Design

Mobile optimizations (< 768px):
- Stepper becomes vertical
- Form rows stack vertically
- Card padding reduced
- Section headers simplified
- Touch-friendly 40px minimum targets

## ♿ Accessibility

- WCAG AA compliant contrast ratios
- Pronounced focus indicators (2px solid)
- Proper label associations
- ARIA attributes supported
- Keyboard navigation friendly
- Screen reader compatible helper text
- Error announcements with `aria-live`

## 🎯 Best Practices

1. **Always use labels**: Associate labels with inputs using `for` and `id`
2. **Mark required fields**: Use `<span class="required-indicator">*</span>`
3. **Provide helper text**: Guide users with contextual hints
4. **Show validation on blur**: Wait for user to finish before showing errors
5. **Group related fields**: Use section cards for logical grouping
6. **Use appropriate icons**: Match icon to field purpose
7. **Handle loading states**: Show spinner for async validation

## 📦 Import

Add to your global styles:

```css
@import './styles/forms-elegant.scss';
```

Or import in component:

```scss
@import '../../styles/forms-elegant.scss';
```

## 🎬 Animations Reference

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| `fadeIn` | 400ms | ease-in-out | Form step transitions |
| `scaleIn` | 300ms | bounce | Success icon appear |
| `shake` | 400ms | ease-out | Error icon appear |
| `slideDown` | 300ms | ease-out | Error message appear |
| `pulse` | 2s | ease-in-out | Active step indicator |
| `spin` | 1s | linear | Validating spinner |

## 🛠️ Troubleshooting

**Labels not floating:**
- Ensure input has `placeholder=" "` (space)
- Check `.has-value` class is applied when input has value

**Validation icons not showing:**
- Verify `.validation-icon` div is present
- Check field state classes are applied correctly

**Focus glow not visible:**
- Ensure no conflicting z-index
- Check focus state is not overridden

**Stepper line not connecting:**
- Verify stepper steps are direct children
- Check line progress width calculation

## 📚 Related Documentation

- [Typography System](./TYPOGRAPHY.md)
- [Color System](./COLOR_SYSTEM_EXTENDED_README.md)
- [Design Variables](./variables.scss)
- [Form Validation](../app/components/FORM_VALIDATION_README.md)
