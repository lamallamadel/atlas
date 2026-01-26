# Route Animations - Usage Examples

This guide provides practical examples for using the route animation system.

## Quick Start

### 1. Basic Implementation (Already Done)

The main app component has been configured with:
- Progress bar for navigation feedback
- Loading overlay for slow navigations
- Fade-in page transitions
- Scroll position management

### 2. Using in Your Components

#### Example 1: Adding Back/Forward Navigation Buttons

```typescript
import { Component } from '@angular/core';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-my-page',
  template: `
    <div class="navigation-controls">
      <button 
        mat-icon-button 
        [disabled]="!canGoBack()"
        (click)="goBack()"
        matTooltip="Retour">
        <mat-icon>arrow_back</mat-icon>
      </button>
      
      <button 
        mat-icon-button 
        [disabled]="!canGoForward()"
        (click)="goForward()"
        matTooltip="Suivant">
        <mat-icon>arrow_forward</mat-icon>
      </button>
    </div>
    
    <div class="content">
      <!-- Your page content -->
    </div>
  `
})
export class MyPageComponent {
  constructor(private navigationService: NavigationService) {}
  
  goBack() {
    this.navigationService.navigateBack();
  }
  
  goForward() {
    this.navigationService.navigateForward();
  }
  
  canGoBack(): boolean {
    return this.navigationService.canGoBack();
  }
  
  canGoForward(): boolean {
    return this.navigationService.canGoForward();
  }
}
```

#### Example 2: Saving Scroll Before Navigation

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-list-page',
  template: `
    <div class="list-container" (scroll)="onScroll()">
      <div *ngFor="let item of items">
        <a (click)="navigateToDetail(item.id)">
          {{ item.name }}
        </a>
      </div>
    </div>
  `
})
export class ListPageComponent {
  items = [];
  
  constructor(
    private router: Router,
    private navigationService: NavigationService
  ) {}
  
  onScroll() {
    // Optionally save scroll position on scroll events
    // (already handled automatically by the directive)
  }
  
  navigateToDetail(id: number) {
    // Save scroll position before navigating away
    this.navigationService.saveScrollPosition();
    this.router.navigate(['/details', id]);
  }
}
```

#### Example 3: Custom Page Transitions Per Route

If you want different animations for specific routes, you can extend the NavigationService:

```typescript
// In your component
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { routeSlideLeftAnimation, routeFadeInAnimation } from '../animations/route-animations';

@Component({
  selector: 'app-dashboard',
  template: `
    <div [@routeAnimation]="getAnimationState()">
      <router-outlet></router-outlet>
    </div>
  `,
  animations: [routeSlideLeftAnimation, routeFadeInAnimation]
})
export class DashboardComponent {
  constructor(private router: Router) {}
  
  getAnimationState() {
    // Return different states based on route
    const url = this.router.url;
    if (url.includes('/reports')) {
      return 'slideLeft';
    }
    return 'fadeIn';
  }
}
```

## Advanced Usage

### Creating a Page with Smooth Transitions

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationService } from '../services/navigation.service';
import { fadeAnimation } from '../animations/animation-utils';

@Component({
  selector: 'app-smooth-page',
  template: `
    <div class="page-wrapper" @fadeIn>
      <header>
        <button (click)="goBack()">Retour</button>
      </header>
      
      <main appMaintainScroll>
        <div class="content">
          <!-- Your content here -->
        </div>
      </main>
    </div>
  `,
  animations: [fadeAnimation('fadeIn', 300)]
})
export class SmoothPageComponent implements OnInit, OnDestroy {
  constructor(private navigationService: NavigationService) {}
  
  ngOnInit() {
    // Restore scroll position when page loads
    this.navigationService.restoreScrollPosition();
  }
  
  ngOnDestroy() {
    // Save scroll position before leaving
    this.navigationService.saveScrollPosition();
  }
  
  goBack() {
    this.navigationService.navigateBack();
  }
}
```

### Programmatic Progress Bar Control

If you need to manually control the progress bar (e.g., for async operations):

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-custom-loader',
  template: `
    <app-progress-bar [isNavigating]="isLoading"></app-progress-bar>
    
    <div class="content">
      <button (click)="loadData()">Load Data</button>
    </div>
  `
})
export class CustomLoaderComponent {
  isLoading = false;
  
  async loadData() {
    this.isLoading = true;
    
    try {
      await this.fetchDataFromApi();
    } finally {
      this.isLoading = false;
    }
  }
  
  private async fetchDataFromApi() {
    // Your API call here
    return new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

### Customizing Animation Timing

```typescript
// Create a custom animation with different timing
import { trigger, transition, style, animate, query, group } from '@angular/animations';

export const customFadeAnimation = trigger('customFadeAnimation', [
  transition('* => *', [
    query(':enter, :leave', [
      style({ position: 'absolute', width: '100%' })
    ], { optional: true }),
    group([
      query(':leave', [
        style({ opacity: 1 }),
        animate('300ms ease-out', style({ opacity: 0 }))
      ], { optional: true }),
      query(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-in', style({ opacity: 1 }))
      ], { optional: true })
    ])
  ])
]);

// Use in component
@Component({
  animations: [customFadeAnimation]
})
export class MyComponent {}
```

## Testing Examples

### Unit Test for Navigation Service Usage

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationService } from '../services/navigation.service';
import { MyComponent } from './my.component';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;
  let navigationService: jasmine.SpyObj<NavigationService>;

  beforeEach(() => {
    const navSpy = jasmine.createSpyObj('NavigationService', [
      'navigateBack',
      'navigateForward',
      'canGoBack',
      'canGoForward'
    ]);

    TestBed.configureTestingModule({
      declarations: [ MyComponent ],
      providers: [
        { provide: NavigationService, useValue: navSpy }
      ]
    });

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
    navigationService = TestBed.inject(NavigationService) as jasmine.SpyObj<NavigationService>;
  });

  it('should call navigateBack on goBack()', () => {
    component.goBack();
    expect(navigationService.navigateBack).toHaveBeenCalled();
  });

  it('should disable back button when canGoBack returns false', () => {
    navigationService.canGoBack.and.returnValue(false);
    expect(component.canGoBack()).toBeFalsy();
  });
});
```

### E2E Test for Page Transitions

```typescript
import { test, expect } from '@playwright/test';

test.describe('Page Transitions', () => {
  test('should show progress bar during navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Start navigation
    const navigationPromise = page.click('a[href="/reports"]');
    
    // Progress bar should be visible
    await expect(page.locator('.progress-bar-container')).toBeVisible();
    
    // Wait for navigation to complete
    await navigationPromise;
    await page.waitForURL('**/reports');
    
    // Progress bar should be hidden
    await expect(page.locator('.progress-bar-container')).not.toBeVisible();
  });

  test('should maintain scroll position on back navigation', async ({ page }) => {
    await page.goto('/dossiers');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(100);
    
    // Navigate to detail page
    await page.click('a[href="/dossiers/1"]');
    await page.waitForURL('**/dossiers/1');
    
    // Navigate back
    await page.goBack();
    await page.waitForURL('**/dossiers');
    
    // Check scroll position is restored
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(400);
  });

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/dashboard');
    
    // Navigation should still work but without animations
    await page.click('a[href="/reports"]');
    await page.waitForURL('**/reports');
    
    // Verify page loaded correctly
    await expect(page.locator('h1')).toContainText('Rapports');
  });
});
```

## Common Patterns

### Pattern 1: Breadcrumb Navigation with Back Support

```typescript
@Component({
  selector: 'app-breadcrumb',
  template: `
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li>
          <a (click)="navigateHome()">Accueil</a>
        </li>
        <li>
          <a (click)="goBack()" *ngIf="canGoBack()">
            <mat-icon>arrow_back</mat-icon>
            Retour
          </a>
        </li>
        <li class="active">{{ currentPage }}</li>
      </ol>
    </nav>
  `
})
export class BreadcrumbComponent {
  currentPage = 'Current Page';
  
  constructor(
    private router: Router,
    private navigationService: NavigationService
  ) {}
  
  navigateHome() {
    this.router.navigate(['/']);
  }
  
  goBack() {
    this.navigationService.navigateBack();
  }
  
  canGoBack(): boolean {
    return this.navigationService.canGoBack();
  }
}
```

### Pattern 2: Loading State Management

```typescript
@Component({
  selector: 'app-data-page',
  template: `
    <app-progress-bar [isNavigating]="isLoading"></app-progress-bar>
    
    <div *ngIf="!isLoading" class="content">
      {{ data }}
    </div>
    
    <div *ngIf="isLoading" class="skeleton">
      <app-loading-skeleton></app-loading-skeleton>
    </div>
  `
})
export class DataPageComponent implements OnInit {
  isLoading = true;
  data: any;
  
  async ngOnInit() {
    await this.loadData();
  }
  
  async loadData() {
    this.isLoading = true;
    try {
      this.data = await this.apiService.fetchData();
    } finally {
      this.isLoading = false;
    }
  }
}
```

## Styling Tips

### Custom Progress Bar Theme

```css
/* In your component or global styles */
::ng-deep .progress-bar {
  background: linear-gradient(90deg, #ff6b6b, #f06595, #cc5de8);
}

::ng-deep .dark-theme .progress-bar {
  background: linear-gradient(90deg, #ff8787, #f783ac, #da77f2);
}
```

### Page Transition Wrapper Customization

```css
.page-transition-wrapper {
  position: relative;
  min-height: 100vh;
  padding: 1rem;
}

@media (prefers-reduced-motion: reduce) {
  .page-transition-wrapper * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Tips

1. **Lazy Load Heavy Components**: Use Angular's lazy loading for routes with heavy components
2. **Optimize Animations**: Keep animation durations under 300ms for best UX
3. **Debounce Scroll Saving**: Don't save scroll position on every scroll event
4. **Use CSS Transforms**: Prefer `transform` and `opacity` over `left`, `top`, `width`, `height`
5. **Enable Production Mode**: Always test animations in production mode

## Troubleshooting

### Issue: Animations jerky or laggy
**Solution**: Check if you're animating layout properties. Use `transform` instead.

### Issue: Scroll position not restored
**Solution**: Ensure `appMaintainScroll` directive is applied to scrollable container.

### Issue: Progress bar appears briefly on fast navigations
**Solution**: This is by design. Adjust the delay in `app.component.ts` (currently 300ms).

### Issue: Loading overlay blocks content
**Solution**: Check z-index values. The overlay should have `pointer-events: none`.

## Next Steps

- Implement swipe gestures for mobile navigation
- Add page transition sounds (with user preference)
- Create custom animation presets for different app sections
- Implement predictive prefetching based on navigation history
