# Animations Quick Reference

## Import Animations

```typescript
// Import from the animations module
import { 
  routeFadeSlideAnimation, 
  listStaggerAnimation, 
  itemAnimation 
} from './animations';

// Or import specific utilities
import { fadeAnimation, AnimationTimings } from './animations/animation-utils';
```

## Route Animations

### Setup in Component

```typescript
import { RouterOutlet } from '@angular/router';
import { routeFadeSlideAnimation } from './animations';

@Component({
  selector: 'app-root',
  animations: [routeFadeSlideAnimation]
})
export class AppComponent {
  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
```

### Setup in Template

```html
<div [@routeFadeSlideAnimation]="prepareRoute(outlet)">
  <router-outlet #outlet="outlet"></router-outlet>
</div>
```

### Add Animation Data to Routes

```typescript
const routes: Routes = [
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    data: { animation: 'DashboardPage' }  // Add this
  }
];
```

## List Stagger Animations

### For Filter Chips

```typescript
@Component({
  animations: [listStaggerAnimation, itemAnimation]
})
export class MyComponent {
  items = [];
}
```

```html
<mat-chip-set [@listStaggerAnimation]="items.length">
  <mat-chip *ngFor="let item of items" [@itemAnimation]>
    {{ item.name }}
  </mat-chip>
</mat-chip-set>
```

### For Lists

```html
<div class="list-container" [@listStaggerAnimation]="items.length">
  <div *ngFor="let item of items" [@itemAnimation] class="list-item">
    {{ item.name }}
  </div>
</div>
```

### For Cards

```html
<div class="card-grid" [@listStaggerAnimation]="cards.length">
  <mat-card *ngFor="let card of cards" [@itemAnimation]>
    <!-- Card content -->
  </mat-card>
</div>
```

## Micro-Interactions (CSS Classes)

### Automatic Button Effects

All buttons automatically have press/hover effects:
- Scale down on click
- Lift on hover (for raised buttons)
- No additional classes needed

### Hover Lift for Cards

```html
<div class="hover-lift my-card">
  <!-- Automatically lifts 4px on hover -->
</div>
```

### Badge Pulse

```html
<span class="badge-pulse notification-count">5</span>
```

### Stagger Items (CSS-only)

```html
<div class="stagger-item">Item 1</div>
<div class="stagger-item">Item 2</div>
<div class="stagger-item">Item 3</div>
<!-- Each fades in with 50ms delay -->
```

## Custom Animations with Utilities

### Simple Fade

```typescript
import { fadeAnimation } from './animations/animation-utils';

@Component({
  animations: [fadeAnimation('myFade', 400)]
})
export class MyComponent {}
```

```html
<div @myFade *ngIf="show">Content</div>
```

### Slide Animation

```typescript
import { slideAnimation } from './animations/animation-utils';

@Component({
  animations: [
    slideAnimation('slideLeft', 'left', 30, 300)
  ]
})
export class MyComponent {}
```

### Scale Animation

```typescript
import { scaleAnimation } from './animations/animation-utils';

@Component({
  animations: [scaleAnimation('scaleIn', 0.5, 400)]
})
export class MyComponent {}
```

### Bounce Animation

```typescript
import { bounceAnimation } from './animations/animation-utils';

@Component({
  animations: [bounceAnimation('bounce')]
})
export class MyComponent {}
```

### Expand/Collapse

```typescript
import { expandCollapseAnimation } from './animations/animation-utils';

@Component({
  animations: [expandCollapseAnimation('expandCollapse')]
})
export class MyComponent {
  isExpanded = false;
}
```

```html
<div [@expandCollapse]="isExpanded ? 'expanded' : 'collapsed'">
  Expandable content
</div>
```

## Animation Timings

```typescript
import { AnimationTimings, EasingFunctions } from './animations/animation-utils';

// Use preset timings
animate(AnimationTimings.FAST)      // 150ms ease
animate(AnimationTimings.NORMAL)    // 300ms ease-out
animate(AnimationTimings.SLOW)      // 500ms ease-out
animate(AnimationTimings.SPRING)    // 400ms spring
animate(AnimationTimings.SMOOTH)    // 300ms smooth

// Use preset easing functions
animate(`300ms ${EasingFunctions.EASE_OUT_BACK}`)
```

## Material Component Enhancements

### Cards

```html
<!-- Automatically has hover lift effect -->
<mat-card>
  <mat-card-content>
    Card automatically lifts on hover
  </mat-card-content>
</mat-card>
```

### Buttons

```html
<!-- All Material buttons have enhanced animations -->
<button mat-raised-button color="primary">
  Hover to see lift effect
</button>

<button mat-fab color="accent">
  <mat-icon>add</mat-icon>
</button>
```

### Chips

```html
<!-- Chips scale on hover -->
<mat-chip-set>
  <mat-chip>Chip 1</mat-chip>
  <mat-chip>Chip 2</mat-chip>
</mat-chip-set>
```

### List Items

```html
<mat-list>
  <mat-list-item>
    <!-- Background change and indent on hover -->
    Item 1
  </mat-list-item>
</mat-list>
```

## Accessibility - Reduced Motion

All animations automatically respect `prefers-reduced-motion`:

```css
/* Users with reduced motion preference see minimal animations */
@media (prefers-reduced-motion: reduce) {
  /* All animations are disabled or reduced to 0.01ms */
}
```

No additional code needed - it's automatic!

## Common Patterns

### Loading States

```html
<div class="loading-state">
  <mat-spinner></mat-spinner>
  <!-- Fades in automatically -->
</div>
```

### Error States

```html
<div class="error-state">
  <!-- Fades in automatically -->
  <p class="error-message">{{ error }}</p>
  <button class="btn-retry" (click)="retry()">
    Retry
  </button>
</div>
```

### Empty States

```html
<app-empty-state 
  message="No items found"
  [primaryAction]="createAction">
</app-empty-state>
<!-- Component already has fade animation -->
```

### Pagination

```html
<div class="pagination-section">
  <!-- Slides up automatically -->
  <div class="pagination-controls">
    <button class="btn-page">Previous</button>
    <button class="btn-page-num active">1</button>
    <button class="btn-page">Next</button>
  </div>
</div>
```

## Tips

1. **Keep it subtle** - Animations should enhance, not distract
2. **Be consistent** - Use the same animation patterns across similar interactions
3. **Performance** - Use `transform` and `opacity` for best performance
4. **Accessibility** - Always test with `prefers-reduced-motion` enabled
5. **Timing** - Fast for micro-interactions (150ms), normal for transitions (300ms)

## Debugging

### Check if animations are working

```typescript
// Add to component
ngAfterViewInit() {
  console.log('Animations enabled:', 
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
```

### Browser DevTools

1. Open DevTools
2. Press Cmd/Ctrl + Shift + P
3. Type "Emulate CSS prefers-reduced-motion"
4. Toggle to test both states

## Examples

See these components for working examples:
- `AnnoncesComponent` - Filter chip stagger
- `DossiersComponent` - Filter chip stagger
- `DashboardComponent` - KPI card stagger
- `AppLayoutComponent` - Route transitions
- `GenericTableComponent` - Table row animations
