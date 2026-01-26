# Angular Micro-Animations System

This document describes the comprehensive micro-animations system implemented for the Angular application.

## Overview

The animations system provides smooth, performant animations for various UI interactions including:
- Element entrance/exit animations
- Card and list stagger effects
- Button hover and focus states
- Dialog transitions
- Success/error feedback animations
- Loading states with custom spinners

## Animation Triggers

### Core Entrance Animations

#### `fadeIn`
Simple opacity fade-in animation for element entrance.
- **Duration**: 300ms ease-out
- **Use case**: General element appearance

```typescript
import { fadeIn } from '../animations';

@Component({
  animations: [fadeIn]
})
```

```html
<div @fadeIn>Content</div>
```

#### `slideUp`
Slides element up from bottom with fade effect.
- **Duration**: 300ms ease-out
- **Use case**: Dialogs, modals, bottom sheets

```typescript
import { slideUp } from '../animations';

@Component({
  animations: [slideUp]
})
```

```html
<div @slideUp>Content</div>
```

#### `scaleIn`
Scales element from 0.9 to 1 with fade.
- **Duration**: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- **Use case**: Cards, items appearing

```typescript
import { scaleIn } from '../animations';

@Component({
  animations: [scaleIn]
})
```

```html
<mat-card @scaleIn>Card content</mat-card>
```

### List Animations

#### `staggerList`
Animates list items with 50ms delay between each.
- **Stagger delay**: 50ms
- **Duration**: 300ms ease-out per item
- **Use case**: List item appearances

```typescript
import { staggerList } from '../animations';

@Component({
  animations: [staggerList]
})
export class MyComponent {
  items = [];
}
```

```html
<div [@staggerList]="items.length">
  <div *ngFor="let item of items">{{ item }}</div>
</div>
```

#### `cardStagger`
Enhanced stagger animation for cards with scale and fade.
- **Stagger delay**: 50ms
- **Duration**: 400ms cubic-bezier
- **Use case**: Card grid appearances

```typescript
import { cardStagger } from '../animations';

@Component({
  animations: [cardStagger]
})
export class MyComponent {
  cards = [];
}
```

```html
<div class="cards-grid" [@cardStagger]="cards.length">
  <mat-card *ngFor="let card of cards" @scaleIn>
    {{ card.title }}
  </mat-card>
</div>
```

### Feedback Animations

#### `bounceIn`
Playful bounce effect for success feedback.
- **Duration**: 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)
- **Use case**: Success messages, confirmations

```typescript
import { bounceIn } from '../animations';

@Component({
  animations: [bounceIn]
})
```

```html
<div *ngIf="successVisible" @bounceIn class="success-message">
  <mat-icon>check_circle</mat-icon>
  Success!
</div>
```

#### `shakeX`
Horizontal shake for error feedback.
- **Duration**: 500ms
- **Trigger**: State change to 'error'
- **Use case**: Error messages, validation failures

```typescript
import { shakeX } from '../animations';

@Component({
  animations: [shakeX]
})
export class MyComponent {
  errorState = 'idle';
  
  showError() {
    this.errorState = 'error';
    setTimeout(() => this.errorState = 'idle', 500);
  }
}
```

```html
<div [@shakeX]="errorState" class="error-message">
  Error occurred!
</div>
```

### Dialog Animations

#### `dialogSlideUp`
Optimized slide-up animation for Material Dialogs.
- **Duration**: 300ms ease-out (entrance), 200ms ease-in (exit)
- **Use case**: All dialog components

```typescript
import { dialogSlideUp } from '../animations';

@Component({
  animations: [dialogSlideUp]
})
export class MyDialogComponent {}
```

```html
<div @dialogSlideUp>
  <h2 mat-dialog-title>Dialog Title</h2>
  <mat-dialog-content>Content</mat-dialog-content>
</div>
```

### Interactive Animations

#### `buttonHover`
State-based button hover animation.
- **Scale**: 1.02 on hover
- **Duration**: 150ms cubic-bezier
- **Use case**: Stateful button animations

```typescript
import { buttonHover } from '../animations';

@Component({
  animations: [buttonHover]
})
export class MyComponent {
  hoverState = 'idle';
}
```

```html
<button [@buttonHover]="hoverState" 
        (mouseenter)="hoverState = 'hover'"
        (mouseleave)="hoverState = 'idle'">
  Hover Me
</button>
```

#### `focusPulse`
Pulse animation for focus states.
- **Box shadow**: 0 0 0 3px rgba(59, 130, 246, 0.5)
- **Duration**: 200ms ease-out
- **Use case**: Focus indicators

```typescript
import { focusPulse } from '../animations';

@Component({
  animations: [focusPulse]
})
export class MyComponent {
  focusState = 'unfocused';
}
```

```html
<input [@focusPulse]="focusState"
       (focus)="focusState = 'focused'"
       (blur)="focusState = 'unfocused'">
```

## Directives

### `appAnimatedButton`
Automatically adds hover animations to buttons.
- **Effect**: Scale 1.02 + shadow-lg on hover
- **Duration**: 150ms cubic-bezier(0.4, 0, 0.2, 1)

```html
<button mat-raised-button color="primary" appAnimatedButton>
  <mat-icon>save</mat-icon>
  Save
</button>
```

### `appAnimatedFocus`
Adds pulse animation to border on focus.
- **Effect**: Box shadow pulse with customizable color and size
- **Inputs**: `pulseColor`, `pulseSize`

```html
<input matInput appAnimatedFocus placeholder="Focus me">

<!-- Custom pulse color -->
<input matInput 
       appAnimatedFocus 
       [pulseColor]="'rgba(34, 197, 94, 0.5)'"
       [pulseSize]="'4px'">
```

## Components

### `app-custom-spinner`
Custom SVG spinner with smooth circular animation.
- **Inputs**: `size` (number), `color` (string), `trackColor` (string)
- **Animation**: 1.4s rotation with animated stroke

```html
<!-- Default spinner -->
<app-custom-spinner></app-custom-spinner>

<!-- Custom size and color -->
<app-custom-spinner 
  [size]="48" 
  [color]="'#10b981'"
  [trackColor]="'#e5e7eb'">
</app-custom-spinner>
```

### `app-loading-button`
Button with inline spinner that replaces text during loading.
- **Inputs**: `loading`, `type`, `disabled`, `buttonClass`, `spinnerSize`, `spinnerColor`
- **Outputs**: `clicked`
- **Animations**: Content fade + spinner scale

```html
<app-loading-button 
  [loading]="isSubmitting"
  buttonClass="mat-raised-button mat-primary"
  (clicked)="handleSubmit()">
  <mat-icon>send</mat-icon>
  Submit
</app-loading-button>
```

```typescript
export class MyComponent {
  isSubmitting = false;
  
  handleSubmit() {
    this.isSubmitting = true;
    this.apiService.submit().subscribe(() => {
      this.isSubmitting = false;
    });
  }
}
```

## CSS Utility Classes

The system includes utility classes in `styles/animations.css`:

### Shadow Utilities
```html
<div class="shadow-sm">Small shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-xl">Extra large shadow</div>
```

### Animation Classes
```html
<div class="animate-fade-in">Fades in</div>
<div class="animate-slide-up">Slides up</div>
<div class="animate-scale-in">Scales in</div>
<div class="animate-bounce-in">Bounces in</div>
<div class="animate-shake-x">Shakes horizontally</div>
<div class="animate-spin">Rotates continuously</div>
```

### Transition Utilities
```html
<div class="transition-all">Smooth transitions</div>
<div class="transition-transform">Transform transitions</div>
<div class="transition-shadow">Shadow transitions</div>
```

## Best Practices

### 1. Use Appropriate Animation for Context
- **Cards/Lists**: Use `cardStagger` or `staggerList` for smooth entrances
- **Dialogs**: Use `dialogSlideUp` for consistent modal behavior
- **Feedback**: Use `bounceIn` for success, `shakeX` for errors
- **Buttons**: Use `appAnimatedButton` directive for hover effects
- **Focus**: Use `appAnimatedFocus` directive for accessible focus states

### 2. Performance Considerations
- Stagger animations trigger on array length changes
- Use `@scaleIn` on individual cards within staggered containers
- Avoid animating many elements simultaneously (>50)
- Leverage CSS transforms (GPU-accelerated) over position/layout changes

### 3. Accessibility
- All animations respect `prefers-reduced-motion` media query
- Focus animations provide clear visual feedback
- Button animations maintain minimum touch target size (40x40px)
- Animations don't interfere with keyboard navigation

### 4. Timing Guidelines
- **Fast**: 150ms - Micro-interactions (hover, focus)
- **Normal**: 300ms - Standard entrances/exits
- **Slow**: 500-600ms - Emphasis animations (bounce, shake)

## Examples

### Card Grid with Stagger
```typescript
@Component({
  animations: [cardStagger, scaleIn]
})
export class CardListComponent {
  cards = [...];
}
```

```html
<div class="cards-grid" [@cardStagger]="cards.length">
  <mat-card *ngFor="let card of cards" @scaleIn>
    <mat-card-header>
      <mat-card-title>{{ card.title }}</mat-card-title>
    </mat-card-header>
    <mat-card-content>{{ card.content }}</mat-card-content>
    <mat-card-actions>
      <button mat-button appAnimatedButton>Action</button>
    </mat-card-actions>
  </mat-card>
</div>
```

### Dialog with Animation
```typescript
@Component({
  animations: [dialogSlideUp, shakeX]
})
export class MyDialogComponent {
  errorState = 'idle';
  
  showError() {
    this.errorState = 'error';
    setTimeout(() => this.errorState = 'idle', 500);
  }
}
```

```html
<div @dialogSlideUp>
  <h2 mat-dialog-title>Confirm Action</h2>
  <mat-dialog-content>
    <p>Are you sure?</p>
    <div *ngIf="error" [@shakeX]="errorState" class="error">
      {{ error }}
    </div>
  </mat-dialog-content>
  <mat-dialog-actions>
    <button mat-button appAnimatedButton>Cancel</button>
    <app-loading-button 
      [loading]="isSubmitting"
      buttonClass="mat-raised-button mat-primary">
      Confirm
    </app-loading-button>
  </mat-dialog-actions>
</div>
```

### Form with Focus States
```html
<form>
  <mat-form-field appearance="outline">
    <mat-label>Name</mat-label>
    <input matInput appAnimatedFocus>
  </mat-form-field>
  
  <mat-form-field appearance="outline">
    <mat-label>Email</mat-label>
    <input matInput type="email" appAnimatedFocus>
  </mat-form-field>
  
  <div class="actions">
    <app-loading-button 
      [loading]="isSubmitting"
      type="submit"
      buttonClass="mat-raised-button mat-primary">
      Submit
    </app-loading-button>
  </div>
</form>
```

## Demo Component

A comprehensive demo component is available at `app-animations-demo` showcasing all animations:

```typescript
import { AnimationsDemoComponent } from './components/animations-demo.component';
```

Add to routing to view:
```typescript
{ path: 'animations-demo', component: AnimationsDemoComponent }
```

## Animation Constants

```typescript
import { AnimationDurations, AnimationEasings } from '../animations';

// Usage
const duration = AnimationDurations.NORMAL; // 300
const easing = AnimationEasings.SMOOTH; // 'cubic-bezier(0.4, 0, 0.2, 1)'
```

## Browser Support

All animations use:
- CSS transforms (GPU-accelerated)
- Standard Angular animation system
- Fallbacks for `prefers-reduced-motion`

Supported browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)
