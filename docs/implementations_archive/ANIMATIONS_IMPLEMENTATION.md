# Angular Animations Implementation Guide

This document describes the comprehensive animation system implemented in the frontend application.

## Overview

The application now includes:
- Page transition animations using Angular Router animations
- Stagger animations for list items with 50ms delays
- Micro-interactions for buttons, cards, and interactive elements
- Full support for `prefers-reduced-motion` accessibility preference

## Implementation Details

### 1. Route Animations

**Location:** `frontend/src/app/animations/route-animations.ts`

Three route animation triggers are available:

- **`routeFadeAnimation`** - Simple fade in/out between routes
- **`routeSlideAnimation`** - Horizontal slide transitions
- **`routeFadeSlideAnimation`** - Combined fade and vertical slide (default)

**Usage:**
```typescript
import { routeFadeSlideAnimation } from './animations/route-animations';

@Component({
  animations: [routeFadeSlideAnimation]
})
export class AppComponent {
  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
```

```html
<div [@routeFadeSlideAnimation]="prepareRoute(outlet)">
  <router-outlet #outlet="outlet"></router-outlet>
</div>
```

### 2. List Stagger Animations

**Location:** `frontend/src/app/animations/list-animations.ts`

Four list animation triggers with 50ms stagger delays:

- **`listStaggerAnimation`** - Fade and slide up for list containers
- **`fadeInStagger`** - Simple fade in stagger
- **`slideInStagger`** - Horizontal slide in stagger
- **`itemAnimation`** - Individual item enter/leave animations

**Usage:**
```typescript
import { listStaggerAnimation, itemAnimation } from './animations/list-animations';

@Component({
  animations: [listStaggerAnimation, itemAnimation]
})
export class AnnoncesComponent {}
```

```html
<mat-chip-set [@listStaggerAnimation]="appliedFilters.length">
  <mat-chip *ngFor="let filter of appliedFilters" [@itemAnimation]>
    {{ filter.displayValue }}
  </mat-chip>
</mat-chip-set>
```

### 3. CSS Micro-Interactions

**Location:** `frontend/src/styles/animations.css`

Global CSS animations for all interactive elements:

#### Button Press Effects
- Scale down to 0.95 on click
- Applied to all buttons automatically
- Smooth cubic-bezier timing

#### Hover Lift Effects
- Cards lift 4px on hover
- Buttons lift 2px on hover
- Enhanced shadow on elevation change

#### Icon Button Interactions
- Scale up to 1.1 on hover
- Background color fade
- Ripple-like effect

#### Badge Pulse Animation
- Subtle pulse for badges and notification counts
- 2-second animation cycle
- Draws attention without being distracting

### 4. Page Transition Styles

**Location:** `frontend/src/styles/pages.css`

Common page elements with built-in animations:

- Page containers fade in
- Headers slide up
- Content fades in with delay
- Buttons have press/hover effects
- Pagination controls animate

### 5. Material Design Overrides

**Location:** `frontend/src/styles/material-overrides.css`

Enhanced animations for Angular Material components:

- Cards with hover lift
- Buttons with press and lift effects
- Chips with scale on hover
- List items with background and indent animations
- Menu items with slide effect
- Expansion panels with shadow changes
- Form fields with scale on focus
- Table rows with lift on hover

### 6. Accessibility - Reduced Motion

All animations respect the `prefers-reduced-motion` CSS media query:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* All transform animations are disabled */
  .hover-lift:hover,
  .btn-press:active {
    transform: none !important;
  }
}
```

This ensures users who have enabled reduced motion preferences in their OS settings will see minimal or no animations.

## Components Using Animations

### Updated Components

1. **AppComponent** - Root level route transitions
2. **AppLayoutComponent** - Child route transitions within layout
3. **AnnoncesComponent** - Stagger animations for filter chips
4. **DossiersComponent** - Stagger animations for filter chips
5. **DashboardComponent** - Stagger animations for KPI cards and recent items
6. **GenericTableComponent** - Row stagger animations

### Routing Configuration

All routes have been configured with animation data:

```typescript
const routes: Routes = [
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    data: { animation: 'DashboardPage' } 
  },
  { 
    path: 'annonces', 
    component: AnnoncesComponent, 
    data: { animation: 'AnnoncesPage' } 
  },
  // ... other routes
];
```

## File Structure

```
frontend/src/
├── app/
│   └── animations/
│       ├── index.ts                  # Barrel export
│       ├── route-animations.ts       # Route transition animations
│       └── list-animations.ts        # List stagger animations
└── styles/
    ├── animations.css                # Global CSS animations
    ├── pages.css                     # Page element animations
    └── material-overrides.css        # Material component enhancements
```

## Animation Timings

All animations use consistent timing for a cohesive experience:

- **Fast interactions**: 150ms (button press, chip hover)
- **Standard transitions**: 200-250ms (cards, menus, tooltips)
- **Page transitions**: 300-400ms (route changes)
- **Stagger delay**: 50ms between items

## Performance Considerations

- All animations use CSS `transform` and `opacity` for GPU acceleration
- No animations on disabled elements
- Animations are removed for users with reduced motion preferences
- Stagger animations are efficient with the Angular animations API

## Testing Reduced Motion

To test reduced motion support:

**Windows:**
1. Settings → Accessibility → Visual effects
2. Turn on "Show animations in Windows"

**macOS:**
1. System Preferences → Accessibility → Display
2. Check "Reduce motion"

**Linux:**
Varies by distribution, typically in accessibility settings.

**Browser DevTools:**
Most modern browsers allow emulating reduced motion in DevTools.

## Future Enhancements

Possible additions for future iterations:

1. Custom easing curves for specific interactions
2. Scroll-triggered animations for long pages
3. Loading skeleton animations
4. Success/error state animations
5. Drag and drop animations
6. More complex route transition patterns based on navigation direction

## Browser Support

Animations work in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

All gracefully degrade in older browsers with basic transitions maintained.
