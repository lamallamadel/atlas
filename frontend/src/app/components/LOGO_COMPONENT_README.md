# Logo Components - Usage Guide

Complete guide for using Atlas Immobilier logo components in Angular.

## 🎯 Overview

Two logo components are available:

1. **LogoComponent** - External SVG reference (recommended for most use cases)
2. **LogoInlineComponent** - Inline SVG with advanced path drawing animation (for special effects)

## 📦 Components

### LogoComponent

Simple, lightweight logo component that references external SVG files.

**Features:**
- ✅ Small footprint (references external SVG)
- ✅ Cached by browser
- ✅ Simple fade-in animation
- ✅ Responsive sizing
- ✅ Theme-aware

**When to use:**
- Headers, footers, navigation
- Repeated logo instances
- General purpose logo display
- Performance-critical contexts

### LogoInlineComponent

Advanced logo component with inline SVG and path drawing animation.

**Features:**
- ✅ SVG path drawing effect
- ✅ Staggered element animation
- ✅ Building shape fade-in
- ✅ Window flicker effect
- ✅ Text slide-in animation
- ⚠️ Larger footprint (inline SVG)

**When to use:**
- Splash screens
- Hero sections
- Landing pages
- Special marketing sections
- One-time animated logo displays

## 🚀 Basic Usage

### Simple Logo (LogoComponent)

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <app-logo></app-logo>
  `
})
export class HeaderComponent {}
```

### Animated Logo (LogoInlineComponent)

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-splash',
  template: `
    <app-logo-inline [animate]="true"></app-logo-inline>
  `
})
export class SplashComponent {}
```

## 🎨 Variants

### Horizontal Logo

```html
<!-- Default horizontal logo -->
<app-logo variant="horizontal"></app-logo>

<!-- With custom size -->
<app-logo 
  variant="horizontal" 
  width="300px">
</app-logo>
```

### Vertical Logo

```html
<!-- Vertical logo for narrow spaces -->
<app-logo variant="vertical"></app-logo>

<!-- Mobile sidebar -->
<app-logo 
  variant="vertical" 
  width="100px">
</app-logo>
```

### Icon Only

```html
<!-- Icon for profile, favicon-like uses -->
<app-logo variant="icon"></app-logo>

<!-- Custom sized icon -->
<app-logo 
  variant="icon" 
  width="64px" 
  height="64px">
</app-logo>
```

## 🌓 Themes

### Auto Theme (Recommended)

Automatically adapts to user's system preference.

```html
<app-logo theme="auto"></app-logo>
```

### Light Theme

For light backgrounds.

```html
<app-logo theme="light"></app-logo>
```

### Dark Theme

For dark backgrounds and dark mode.

```html
<app-logo theme="dark"></app-logo>
```

### Monochrome

For print, limited color, or special contexts.

```html
<app-logo theme="mono"></app-logo>
```

## 📐 Sizing

### Using Width/Height Props

```html
<!-- Fixed width -->
<app-logo width="240px"></app-logo>

<!-- Fixed width and height -->
<app-logo 
  width="300px" 
  height="75px">
</app-logo>

<!-- Using CSS units -->
<app-logo width="20vw"></app-logo>
<app-logo width="15rem"></app-logo>
```

### Using CSS Classes

```html
<app-logo class="header-logo"></app-logo>
```

```css
.header-logo {
  width: 240px;
  height: auto;
}

@media (max-width: 768px) {
  .header-logo {
    width: 180px;
  }
}
```

## 🎬 Animations

### Simple Animation (LogoComponent)

```html
<!-- Enable fade-in animation -->
<app-logo [animate]="true"></app-logo>
```

### Advanced Animation (LogoInlineComponent)

```html
<!-- Path drawing animation -->
<app-logo-inline 
  [animate]="true"
  variant="horizontal">
</app-logo-inline>
```

### Conditional Animation

```typescript
@Component({
  template: `
    <app-logo-inline 
      [animate]="isFirstLoad"
      variant="horizontal">
    </app-logo-inline>
  `
})
export class AppComponent {
  isFirstLoad = !sessionStorage.getItem('visited');
  
  ngOnInit() {
    sessionStorage.setItem('visited', 'true');
  }
}
```

## ♿ Accessibility

### Custom ARIA Label

```html
<app-logo ariaLabel="Atlas Immobilier - Plateforme Immobilière"></app-logo>
```

### Decorative Logo

```html
<app-logo ariaLabel="" role="presentation"></app-logo>
```

## 💡 Common Use Cases

### Header Logo

```typescript
@Component({
  selector: 'app-header',
  template: `
    <mat-toolbar>
      <app-logo 
        variant="horizontal"
        theme="auto"
        width="200px"
        routerLink="/">
      </app-logo>
    </mat-toolbar>
  `
})
export class HeaderComponent {}
```

### Mobile Sidebar

```typescript
@Component({
  selector: 'app-sidenav',
  template: `
    <mat-sidenav>
      <div class="sidebar-logo">
        <app-logo 
          variant="vertical"
          theme="auto"
          width="100px">
        </app-logo>
      </div>
    </mat-sidenav>
  `
})
export class SidenavComponent {}
```

### Splash Screen

```typescript
@Component({
  selector: 'app-splash',
  template: `
    <div class="splash-screen">
      <app-logo-inline 
        variant="horizontal"
        [animate]="true"
        width="400px">
      </app-logo-inline>
      <p>Chargement...</p>
    </div>
  `,
  styles: [`
    .splash-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  `]
})
export class SplashScreenComponent {}
```

### Profile Icon

```typescript
@Component({
  selector: 'app-user-menu',
  template: `
    <button mat-button [matMenuTriggerFor]="menu">
      <app-logo 
        variant="icon"
        width="32px"
        height="32px">
      </app-logo>
    </button>
  `
})
export class UserMenuComponent {}
```

### Login Page

```typescript
@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <app-logo-inline 
        variant="vertical"
        [animate]="true"
        width="160px">
      </app-logo-inline>
      
      <mat-card>
        <mat-card-title>Connexion</mat-card-title>
        <!-- Login form -->
      </mat-card>
    </div>
  `
})
export class LoginComponent {}
```

### Email Template (Angular Service)

```typescript
@Injectable({ providedIn: 'root' })
export class EmailService {
  generateEmailHtml(): string {
    return `
      <table>
        <tr>
          <td>
            <img 
              src="${environment.baseUrl}/assets/brand/email/logo-400x100.png" 
              alt="Atlas Immobilier" 
              width="200" 
              height="50"
              style="display:block;">
          </td>
        </tr>
      </table>
    `;
  }
}
```

## 🎨 Styling & Customization

### CSS Overrides

```html
<app-logo class="custom-logo"></app-logo>
```

```css
.custom-logo {
  /* Custom width */
  width: 280px;
  
  /* Add margin */
  margin: 20px 0;
  
  /* Custom hover effect */
  transition: opacity 0.3s;
}

.custom-logo:hover {
  opacity: 0.8;
}
```

### Wrapper for Layout

```html
<div class="logo-wrapper">
  <app-logo variant="horizontal"></app-logo>
</div>
```

```css
.logo-wrapper {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

## 🔧 Advanced Usage

### Dynamic Variant Selection

```typescript
@Component({
  template: `
    <app-logo 
      [variant]="logoVariant"
      [theme]="logoTheme">
    </app-logo>
  `
})
export class DynamicLogoComponent {
  @HostListener('window:resize')
  onResize() {
    this.updateLogoVariant();
  }
  
  logoVariant: 'horizontal' | 'vertical' | 'icon' = 'horizontal';
  logoTheme: 'auto' | 'light' | 'dark' = 'auto';
  
  ngOnInit() {
    this.updateLogoVariant();
  }
  
  updateLogoVariant() {
    const width = window.innerWidth;
    if (width < 600) {
      this.logoVariant = 'icon';
    } else if (width < 960) {
      this.logoVariant = 'vertical';
    } else {
      this.logoVariant = 'horizontal';
    }
  }
}
```

### Theme Service Integration

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkMode.asObservable();
  
  getLogoTheme(): 'light' | 'dark' {
    return this.darkMode.value ? 'dark' : 'light';
  }
}

@Component({
  template: `
    <app-logo 
      variant="horizontal"
      [theme]="logoTheme$ | async">
    </app-logo>
  `
})
export class ThemedLogoComponent {
  logoTheme$ = this.themeService.darkMode$.pipe(
    map(isDark => isDark ? 'dark' : 'light')
  );
  
  constructor(private themeService: ThemeService) {}
}
```

### Loading State

```typescript
@Component({
  template: `
    <div *ngIf="loading" class="loading-logo">
      <app-logo-inline 
        [animate]="true"
        variant="icon"
        width="80px">
      </app-logo-inline>
      <mat-spinner diameter="60"></mat-spinner>
    </div>
  `
})
export class LoadingComponent {
  @Input() loading = false;
}
```

## 🐛 Troubleshooting

### Logo Not Displaying

**Issue:** Logo doesn't appear

**Solutions:**
1. Check that component is declared in `app.module.ts`
2. Verify SVG files exist in `/assets/brand/`
3. Check browser console for 404 errors
4. Ensure Angular asset configuration includes `src/assets`

### Animation Not Working

**Issue:** Path drawing animation doesn't play

**Solutions:**
1. Use `LogoInlineComponent` (not `LogoComponent`)
2. Set `[animate]="true"`
3. Check `prefers-reduced-motion` settings
4. Clear browser cache

### Wrong Colors

**Issue:** Logo has incorrect colors on dark/light background

**Solutions:**
1. Set appropriate `theme` prop
2. Use `theme="auto"` for automatic detection
3. Check CSS specificity conflicts
4. Verify correct SVG variant is loaded

### Blurry Logo

**Issue:** Logo appears pixelated or blurry

**Solutions:**
1. Use SVG variant (not PNG)
2. Don't set fixed `width` and `height` together
3. Use `width` or `height` alone, let auto-scale
4. Ensure minimum size requirements are met

## 📊 Performance Tips

1. **Use LogoComponent** for repeated instances (header, footer)
2. **Use LogoInlineComponent** sparingly (splash screen only)
3. **Lazy load** LogoInlineComponent if possible
4. **Disable animation** after first view with sessionStorage
5. **Set explicit dimensions** to avoid layout shift
6. **Preload** logo SVG files for critical rendering path

## 📝 API Reference

### LogoComponent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'horizontal' \| 'vertical' \| 'icon'` | `'horizontal'` | Logo layout variant |
| `theme` | `'default' \| 'light' \| 'dark' \| 'mono' \| 'auto'` | `'auto'` | Color theme |
| `animate` | `boolean` | `false` | Enable fade-in animation |
| `width` | `string` | `undefined` | Custom width (CSS value) |
| `height` | `string` | `undefined` | Custom height (CSS value) |
| `ariaLabel` | `string` | `'Atlas Immobilier'` | Accessibility label |

### LogoInlineComponent

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'horizontal' \| 'vertical' \| 'icon'` | `'horizontal'` | Logo layout variant |
| `theme` | `'default' \| 'light' \| 'dark' \| 'mono' \| 'auto'` | `'auto'` | Color theme |
| `animate` | `boolean` | `true` | Enable path drawing animation |
| `width` | `string` | `undefined` | Custom width (CSS value) |
| `height` | `string` | `undefined` | Custom height (CSS value) |
| `ariaLabel` | `string` | `'Atlas Immobilier'` | Accessibility label |

## 🔗 Related Documentation

- [Logo Guidelines](../../assets/brand/logo-guidelines.md) - Complete brand guidelines
- [Brand Assets](../../assets/brand/README.md) - All logo files and variants
- [Favicon Setup](../../assets/brand/favicons/README.md) - Browser favicon configuration
- [PWA Icons](../../assets/brand/pwa/README.md) - Progressive Web App icons
- [Email Logos](../../assets/brand/email/README.md) - Email template assets

## 📞 Support

For questions or custom logo requirements, contact the design team.

**Version**: 1.0.0  
**Last Updated**: 2024
