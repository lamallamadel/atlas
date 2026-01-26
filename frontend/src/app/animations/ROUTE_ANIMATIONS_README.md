# Route Animations System

This document describes the page transition animation system implemented in the Angular application.

## Features

### 1. Page Transitions

The application supports three types of page transitions:

- **Fade In**: Default smooth fade transition (200ms)
- **Slide Left**: For forward navigation (back button)
- **Slide Right**: For backward navigation (forward button)

### 2. Loading Indicators

#### Progress Bar
A linear progress bar appears at the top of the screen during navigation:
- Styled similar to NProgress
- Smooth gradient animation (blue to cyan to green)
- Auto-completes at 100% when navigation finishes
- Supports dark theme

#### Loading Overlay
For slow navigation (>300ms):
- Transparent overlay with blur backdrop
- Non-intrusive user experience
- Prevents interaction during loading

### 3. Scroll Position Management

The `NavigationService` maintains scroll positions across navigation:
- Saves scroll position before leaving a page
- Restores scroll position when returning to a page
- Automatically scrolls to top for new pages

### 4. Accessibility

#### Reduced Motion Support
All animations respect the `prefers-reduced-motion` media query:
- Animations are disabled when user prefers reduced motion
- Instant transitions without animation delays
- Maintains functionality without visual effects

## Usage

### Basic Setup

The route animations are automatically applied to the main router outlet in `app.component.html`:

```html
<app-progress-bar [isNavigating]="isNavigating"></app-progress-bar>
<div 
  *ngIf="showLoadingOverlay" 
  class="loading-overlay"
  [@fadeInOut]>
  <div class="loading-backdrop"></div>
</div>
<div [@routeFadeInAnimation]="getRouteAnimation()" class="page-transition-wrapper">
  <router-outlet #outlet="outlet"></router-outlet>
</div>
```

### Navigation Service

The `NavigationService` provides methods for programmatic navigation:

```typescript
import { NavigationService } from './services/navigation.service';

constructor(private navigationService: NavigationService) {}

// Navigate back with slide right animation
goBack() {
  this.navigationService.navigateBack();
}

// Navigate forward with slide left animation
goForward() {
  this.navigationService.navigateForward();
}

// Save current scroll position
saveScroll() {
  this.navigationService.saveScrollPosition();
}

// Restore saved scroll position
restoreScroll() {
  this.navigationService.restoreScrollPosition();
}
```

### Maintain Scroll Directive

Apply the `appMaintainScroll` directive to any scrollable container:

```html
<main appMaintainScroll>
  <router-outlet></router-outlet>
</main>
```

### Route Configuration

Configure animations per route in `app-routing.module.ts`:

```typescript
const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    data: { animation: 'DashboardPage' }
  },
  {
    path: 'reports',
    component: ReportsComponent,
    data: { animation: 'ReportsPage' }
  }
];
```

## Animation Types

### routeFadeInAnimation
Default fade-in animation for all page transitions.

```typescript
import { routeFadeInAnimation } from './animations/route-animations';

@Component({
  animations: [routeFadeInAnimation]
})
```

### routeSlideLeftAnimation
Slide from right to left (forward navigation).

```typescript
import { routeSlideLeftAnimation } from './animations/route-animations';

@Component({
  animations: [routeSlideLeftAnimation]
})
```

### routeSlideRightAnimation
Slide from left to right (backward navigation).

```typescript
import { routeSlideRightAnimation } from './animations/route-animations';

@Component({
  animations: [routeSlideRightAnimation]
})
```

## Components

### ProgressBarComponent

Top-screen linear progress indicator.

**Input Properties:**
- `isNavigating`: boolean - Shows/hides the progress bar

**Features:**
- Auto-increments progress from 0% to 90%
- Completes at 100% when navigation ends
- Gradient color animation
- Dark theme support
- Respects reduced motion preference

### LoadingOverlayComponent

Transparent overlay with blur backdrop for slow navigation.

**Behavior:**
- Appears after 300ms delay
- Blurred backdrop effect
- Non-blocking (pointer-events: none)
- Fades in/out smoothly

## Styling

### Progress Bar Customization

```css
/* Override progress bar colors */
.progress-bar {
  background: linear-gradient(90deg, #your-color-1, #your-color-2);
}

/* Override dark theme colors */
:host-context(.dark-theme) .progress-bar {
  background: linear-gradient(90deg, #your-dark-1, #your-dark-2);
}
```

### Loading Overlay Customization

```css
/* Override backdrop opacity */
.loading-backdrop {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(6px);
}
```

## Performance Considerations

### Optimizations
1. **Lazy animation detection**: Reduced motion check only happens once per animation
2. **CSS-based animations**: Hardware-accelerated transforms and opacity
3. **Debounced scroll saving**: Scroll position saved only when needed
4. **Smart loading overlay**: Only shows after 300ms delay

### Best Practices
1. Keep animation durations short (200ms recommended)
2. Use `will-change` sparingly on animated elements
3. Avoid animating layout properties (width, height, padding)
4. Prefer transform and opacity for smooth 60fps animations

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (including backdrop-filter)
- IE11: Graceful degradation (no blur effect)

## Accessibility

### ARIA Labels
Progress indicators are hidden from screen readers using `aria-hidden="true"` to avoid announcement spam.

### Keyboard Navigation
All navigation methods support keyboard shortcuts via the command palette.

### Focus Management
Focus is maintained during navigation transitions using the Angular Router's built-in focus restoration.

## Testing

### Unit Tests
```typescript
import { NavigationService } from './services/navigation.service';

describe('NavigationService', () => {
  it('should save scroll position', () => {
    service.saveScrollPosition();
    expect(service['scrollPositions'].size).toBeGreaterThan(0);
  });
  
  it('should detect back navigation', () => {
    service.navigateBack();
    expect(service.getRouteAnimation()).toBe('slideRight');
  });
});
```

### E2E Tests
```typescript
test('should show progress bar during navigation', async ({ page }) => {
  await page.goto('/dashboard');
  const progressBar = page.locator('.progress-bar-container');
  
  await page.click('a[href="/reports"]');
  await expect(progressBar).toBeVisible();
  
  await page.waitForURL('**/reports');
  await expect(progressBar).not.toBeVisible();
});
```

## Troubleshooting

### Animations not working
1. Check that `BrowserAnimationsModule` is imported in `app.module.ts`
2. Verify animation triggers are applied to components
3. Check browser console for animation errors

### Scroll position not restoring
1. Ensure `scrollPositionRestoration: 'disabled'` in router config
2. Verify `appMaintainScroll` directive is applied
3. Check that `NavigationService` is provided in root

### Progress bar not appearing
1. Verify `isNavigating` input is bound correctly
2. Check that navigation events are being captured
3. Ensure component is declared in module

## Migration from Old System

If migrating from the old `routeFadeSlideAnimation`:

**Before:**
```typescript
@Component({
  animations: [routeFadeSlideAnimation]
})
```

**After:**
```typescript
@Component({
  animations: [routeFadeInAnimation]
})
```

And add to template:
```html
<app-progress-bar [isNavigating]="isNavigating"></app-progress-bar>
```

## Future Enhancements

- [ ] Configurable animation durations
- [ ] Custom animation easing functions
- [ ] Page transition direction based on route hierarchy
- [ ] Swipe gesture navigation on mobile
- [ ] Animation presets (material, ios, fade, slide, etc.)
