# Atlas Immobilier Logo - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Use in Component (Most Common)

```html
<!-- Header logo -->
<app-logo variant="horizontal" theme="auto"></app-logo>

<!-- Mobile sidebar -->
<app-logo variant="vertical" width="100px"></app-logo>

<!-- Profile icon -->
<app-logo variant="icon" width="32px" height="32px"></app-logo>
```

### 2. Splash Screen with Animation

```html
<app-logo-inline 
  variant="horizontal" 
  [animate]="true"
  width="400px">
</app-logo-inline>
```

### 3. Direct HTML (Email Templates)

```html
<img src="/assets/brand/logo-horizontal.svg" 
     alt="Atlas Immobilier" 
     width="240" 
     height="60">
```

## 📦 Available Variants

| Variant | Use Case | Size |
|---------|----------|------|
| `horizontal` | Headers, footers | 240px default |
| `vertical` | Sidebars, mobile | 100-120px default |
| `icon` | Favicons, profiles | 32-64px default |

## 🌓 Theme Options

| Theme | When to Use |
|-------|-------------|
| `auto` | ✅ **Recommended** - Auto-detects dark/light mode |
| `default` | Light backgrounds |
| `light` | Colored backgrounds |
| `dark` | Dark mode (#212121 backgrounds) |
| `mono` | Print, limited color |

## 🎬 Animation Types

### Simple (LogoComponent)
- Fade-in effect
- Lightweight
- Use everywhere

### Advanced (LogoInlineComponent)
- Path drawing animation
- Use once per page (splash screens)
- More performance intensive

## 📂 File Locations

```
frontend/src/assets/brand/
├── logo-horizontal.svg      ← Use this for headers
├── logo-vertical.svg        ← Use this for sidebars
├── logo-icon.svg            ← Use this for icons
├── logo-horizontal-dark.svg ← Dark mode variant
└── logo-horizontal-mono.svg ← Print variant
```

## 💡 Common Use Cases

### Header
```typescript
<mat-toolbar>
  <app-logo variant="horizontal" width="200px"></app-logo>
</mat-toolbar>
```

### Login Page
```typescript
<app-logo-inline 
  variant="vertical" 
  [animate]="true"
  width="160px">
</app-logo-inline>
```

### Profile Menu
```typescript
<button mat-button>
  <app-logo variant="icon" width="32px" height="32px"></app-logo>
  Mon Compte
</button>
```

## 🔧 Generate PNG Exports (Optional)

```bash
# Install ImageMagick first
cd frontend
node generate-logo-exports.js
```

This creates:
- Favicons (16x16, 32x32, 48x48)
- PWA icons (192x192, 512x512, etc.)
- Email logos (200x50, 400x100, 600x150)

## 📚 Full Documentation

- **Complete Guide**: `LOGO_VISUAL_IDENTITY_IMPLEMENTATION.md`
- **Component Docs**: `src/app/components/LOGO_COMPONENT_README.md`
- **Brand Guidelines**: `src/assets/brand/logo-guidelines.md`
- **Asset Guide**: `src/assets/brand/README.md`

## ✅ Quick Checklist

- [ ] Logo displays in header
- [ ] Responsive across devices
- [ ] Theme matches background
- [ ] Animation (if needed) works
- [ ] Accessible (has alt text)

## 🎨 Color Reference

```css
/* Primary Colors */
--brand-primary: #1976D2;      /* Primary Blue */
--brand-dark: #0D47A1;         /* Dark Blue */

/* Dark Mode */
--brand-light: #90CAF9;        /* Light Blue (dark mode) */

/* Monochrome */
--brand-black: #212121;        /* Print/Mono */
```

## 🆘 Troubleshooting

**Logo not showing?**
- Check SVG files exist in `/assets/brand/`
- Verify components declared in `app.module.ts`

**Animation not working?**
- Use `LogoInlineComponent` (not `LogoComponent`)
- Set `[animate]="true"`

**Wrong colors?**
- Set `theme="auto"` or appropriate theme
- Check background color contrast

## 📞 Need Help?

See full documentation files above or contact design team.

---

**Quick Tip**: Use `LogoComponent` for repeated instances (header, footer). Use `LogoInlineComponent` only once (splash screen).
