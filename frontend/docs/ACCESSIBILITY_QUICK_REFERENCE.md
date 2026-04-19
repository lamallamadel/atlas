# Accessibility Quick Reference Guide

## 🚀 Quick Start

### Testing Your Changes
```bash
# Show accessibility testing guide
npm run a11y

# Run Lighthouse accessibility audit
npm run a11y:lighthouse
```

### Common Patterns

#### 1. Adding Focus Trap to Dialogs
```html
<div appFocusTrap 
     role="dialog" 
     aria-labelledby="dialog-title" 
     aria-describedby="dialog-description" 
     aria-modal="true">
  <h2 id="dialog-title">Dialog Title</h2>
  <p id="dialog-description" class="sr-only">Description for screen readers</p>
  <!-- Content -->
</div>
```

#### 2. Announcing Dynamic Content
```typescript
constructor(private liveAnnouncer: LiveAnnouncerService) {}

// Success messages (polite - non-interrupting)
this.liveAnnouncer.announce('Data loaded successfully', 'polite');

// Errors (assertive - interrupting)
this.liveAnnouncer.announce('Error: Failed to save', 'assertive');
```

#### 3. Form Fields with Validation
```html
<mat-form-field>
  <mat-label>Email <span class="required" aria-label="required">*</span></mat-label>
  <input matInput 
         formControlName="email" 
         aria-required="true"
         [attr.aria-invalid]="emailControl.invalid && emailControl.touched">
  <mat-error *ngIf="emailControl.hasError('required')" role="alert">
    Email is required
  </mat-error>
</mat-form-field>
```

#### 4. Buttons with Loading States
```html
<button mat-raised-button
        [disabled]="isLoading"
        [attr.aria-busy]="isLoading"
        [attr.aria-label]="isLoading ? 'Saving...' : 'Save'">
  <mat-spinner *ngIf="isLoading" diameter="20" aria-hidden="true"></mat-spinner>
  <span *ngIf="!isLoading">Save</span>
  <span *ngIf="isLoading" class="sr-only" role="status" aria-live="polite">Saving...</span>
</button>
```

#### 5. Lists with Proper Structure
```html
<div role="list" aria-label="Notifications">
  <div *ngFor="let item of items" 
       role="listitem"
       tabindex="0"
       [attr.aria-label]="item.description">
    <!-- Item content -->
  </div>
</div>
```

#### 6. Icon Buttons
```html
<button mat-icon-button 
        aria-label="Delete item"
        matTooltip="Delete">
  <mat-icon aria-hidden="true">delete</mat-icon>
</button>
```

## 📋 Checklist for New Components

- [ ] All interactive elements have labels (`aria-label` or visible text)
- [ ] Form fields have associated labels
- [ ] Icons are `aria-hidden="true"` (decorative)
- [ ] Loading spinners have `aria-label`
- [ ] Buttons meet 40x40px minimum size
- [ ] Color contrast is 4.5:1 minimum
- [ ] Focus indicators are visible
- [ ] Keyboard navigation works (Tab, Enter, Escape, Arrows)
- [ ] Modals/dialogs trap focus
- [ ] Error messages use `role="alert"` and `aria-live="assertive"`
- [ ] Dynamic content updates announced via live regions
- [ ] Proper heading hierarchy (h1 → h2 → h3)

## 🎨 Required ARIA Attributes

### Dialogs/Modals
```html
role="dialog"
aria-modal="true"
aria-labelledby="dialog-title-id"
aria-describedby="dialog-description-id"
```

### Forms
```html
aria-required="true"           <!-- Required fields -->
aria-invalid="true|false"      <!-- Validation state -->
aria-describedby="error-id"    <!-- Associate error messages -->
```

### Buttons
```html
aria-label="Descriptive action"  <!-- Icon buttons -->
aria-busy="true|false"           <!-- Loading state -->
aria-disabled="true|false"       <!-- Disabled state -->
```

### Live Regions
```html
role="status"            <!-- Non-urgent updates -->
role="alert"             <!-- Urgent updates -->
aria-live="polite"       <!-- Polite announcements -->
aria-live="assertive"    <!-- Urgent announcements -->
aria-atomic="true"       <!-- Read entire region -->
```

### Lists
```html
role="list"              <!-- Container -->
role="listitem"          <!-- Items -->
```

### Regions
```html
role="region"            <!-- Landmark region -->
role="navigation"        <!-- Navigation -->
role="main"              <!-- Main content -->
role="banner"            <!-- Site header -->
```

## 🔍 Common Mistakes to Avoid

❌ **Don't**: Remove focus outlines
```css
*:focus { outline: none; } /* BAD */
```

✅ **Do**: Use styled focus indicators
```css
*:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

---

❌ **Don't**: Use color alone for information
```html
<span style="color: red;">Error</span> <!-- BAD -->
```

✅ **Do**: Use text + color + icons
```html
<span style="color: red;" role="alert">
  <mat-icon aria-hidden="true">error</mat-icon>
  Error: Invalid input
</span>
```

---

❌ **Don't**: Forget labels on icon buttons
```html
<button><mat-icon>delete</mat-icon></button> <!-- BAD -->
```

✅ **Do**: Add aria-label
```html
<button aria-label="Delete item">
  <mat-icon aria-hidden="true">delete</mat-icon>
</button>
```

---

❌ **Don't**: Use placeholder as label
```html
<input placeholder="Email"> <!-- BAD -->
```

✅ **Do**: Use proper label
```html
<mat-form-field>
  <mat-label>Email</mat-label>
  <input matInput placeholder="example@domain.com">
</mat-form-field>
```

## 🎯 Testing Commands

```bash
# Display testing guide
npm run a11y

# Run Lighthouse audit (requires running app)
npm start
# In another terminal:
npm run a11y:lighthouse

# Keyboard testing
# - Tab through all elements
# - Shift+Tab to go backwards
# - Enter/Space to activate
# - Escape to close modals
# - Arrow keys for navigation

# Screen reader testing (NVDA on Windows)
# - Start: Ctrl + Alt + N
# - Stop: NVDA + Q
# - Navigate headings: H
# - Navigate landmarks: D
# - Navigate forms: F
# - Read next: Down Arrow
```

## 📱 Mobile Accessibility

```html
<!-- Touch target minimum 40x40px -->
<button style="min-width: 40px; min-height: 40px;">...</button>

<!-- Spacing between targets -->
<div style="gap: 8px;">
  <button>Action 1</button>
  <button>Action 2</button>
</div>

<!-- Mobile screen reader testing -->
<!-- iOS VoiceOver: Settings → Accessibility → VoiceOver -->
<!-- Android TalkBack: Settings → Accessibility → TalkBack -->
```

## 🎨 Color Contrast Requirements

- **Normal text**: 4.5:1 minimum (WCAG AA)
- **Large text** (18pt+): 3:1 minimum
- **UI components**: 3:1 minimum

Use online checkers:
- https://webaim.org/resources/contrastchecker/
- https://contrast-ratio.com/

## 📚 More Information

- **Full Guide**: See `ACCESSIBILITY.md`
- **Implementation Summary**: See `ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md`
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices**: https://www.w3.org/WAI/ARIA/apg/
