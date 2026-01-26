# Atlas Immobilier - Visual Identity System

Complete branding package for Atlas Immobilier including vector logos, raster exports, and Angular components.

## 📁 Directory Structure

```
brand/
├── logo-horizontal.svg          # Main horizontal logo (default)
├── logo-horizontal-light.svg    # Light theme variant
├── logo-horizontal-dark.svg     # Dark theme variant
├── logo-horizontal-mono.svg     # Monochrome variant
├── logo-vertical.svg            # Vertical logo
├── logo-icon.svg                # Icon only (default)
├── logo-icon-mono.svg           # Icon monochrome
├── logo-guidelines.md           # Complete usage guidelines
├── README.md                    # This file
├── favicons/                    # Browser favicons
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon-48x48.png
│   ├── favicon.ico
│   └── README.md
├── pwa/                         # PWA icons
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   ├── icon-512x512.png
│   └── README.md
└── email/                       # Email template images
    ├── logo-200x50.png
    ├── logo-400x100.png
    ├── logo-600x150.png
    └── README.md
```

## 🎨 Logo Variants

### Horizontal Logo (Primary)
**File**: `logo-horizontal.svg`
- **Use case**: Headers, footers, wide layouts, desktop navigation
- **Dimensions**: 400x100 viewBox
- **Minimum width**: 160px digital, 40mm print
- **Recommended**: 240px or larger

### Vertical Logo
**File**: `logo-vertical.svg`
- **Use case**: Narrow spaces, mobile headers, sidebar, profile cards
- **Dimensions**: 160x200 viewBox
- **Minimum width**: 80px digital, 25mm print
- **Recommended**: 120px or larger

### Icon Only
**File**: `logo-icon.svg`
- **Use case**: Favicons, app icons, profile pictures, small spaces
- **Dimensions**: 80x80 viewBox
- **Minimum size**: 32x32px
- **Recommended**: 48x48px or larger

## 🌓 Theme Variants

### Default (Light Background)
- **Files**: `logo-horizontal.svg`, `logo-vertical.svg`, `logo-icon.svg`
- **Colors**: Primary Blue (#1976D2), Dark Blue (#0D47A1)
- **Best for**: White, light gray, light backgrounds

### Light Theme
- **Files**: `logo-horizontal-light.svg`
- **Colors**: Light Blue (#42A5F5), Secondary Gray (#78909C)
- **Best for**: Colored backgrounds, marketing materials

### Dark Theme
- **Files**: `logo-horizontal-dark.svg`
- **Colors**: Lighter Blue (#90CAF9), Light Gray (#B0BEC5)
- **Best for**: Dark mode UI, dark backgrounds (#212121, #303030)

### Monochrome
- **Files**: `logo-horizontal-mono.svg`, `logo-icon-mono.svg`
- **Colors**: Black (#212121), Gray (#424242)
- **Best for**: Print, fax, limited color contexts, watermarks

## 🚀 Quick Start

### Angular Components

#### Simple Logo Display
```typescript
import { Component } from '@angular/core';

@Component({
  template: `
    <app-logo 
      variant="horizontal" 
      theme="auto"
      width="240px">
    </app-logo>
  `
})
export class HeaderComponent {}
```

#### Animated Logo (Inline SVG)
```typescript
import { Component } from '@angular/core';

@Component({
  template: `
    <app-logo-inline 
      variant="horizontal" 
      theme="auto"
      [animate]="true"
      width="300px">
    </app-logo-inline>
  `
})
export class SplashScreenComponent {}
```

### HTML (Direct)
```html
<!-- Basic usage -->
<img src="/assets/brand/logo-horizontal.svg" 
     alt="Atlas Immobilier" 
     width="240" 
     height="60">

<!-- Dark mode aware -->
<picture>
  <source srcset="/assets/brand/logo-horizontal-dark.svg" 
          media="(prefers-color-scheme: dark)">
  <img src="/assets/brand/logo-horizontal.svg" 
       alt="Atlas Immobilier">
</picture>
```

## 📐 Clear Space & Sizing

### Clear Space Rules
- **Horizontal/Vertical**: Maintain clear space equal to the height of the globe icon
- **Icon**: 10% of icon height on all sides
- **No elements** should appear within this boundary

### Minimum Sizes

#### Digital/Screen
| Variant | Minimum | Recommended |
|---------|---------|-------------|
| Horizontal | 160px width | 240px width |
| Vertical | 80px width | 120px width |
| Icon | 32x32px | 48x48px |

#### Print
| Variant | Minimum |
|---------|---------|
| Horizontal | 40mm (1.57") width |
| Vertical | 25mm (0.98") width |
| Icon | 10mm (0.39") width |

## 🎯 Usage Guidelines

### ✅ DO
- Use appropriate variant for your background (light/dark/mono)
- Maintain specified clear space
- Keep logo at or above minimum sizes
- Preserve aspect ratio when scaling
- Use high-resolution versions for retina displays
- Choose horizontal for headers, vertical for narrow spaces

### ❌ DON'T
- Alter logo colors outside approved variants
- Add effects (shadows, outlines, glows)
- Rotate or skew the logo
- Place on busy or low-contrast backgrounds
- Stretch or distort aspect ratio
- Use below minimum sizes
- Crowd with other elements
- Recreate or redraw the logo

## 🖼️ Exporting Raster Files

### Generate PNG Files
```bash
# Navigate to frontend directory
cd frontend

# Run export script (requires ImageMagick)
node generate-logo-exports.js
```

This generates:
- Favicons: 16x16, 32x32, 48x48, favicon.ico
- PWA Icons: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
- Email Logos: 200x50, 400x100, 600x150

### Manual Export with ImageMagick
```bash
# Single PNG export
convert -background none logo-icon.svg -resize 192x192 icon-192.png

# Multiple sizes
for size in 16 32 48 64 128 192 256 512; do
  convert -background none logo-icon.svg -resize ${size}x${size} icon-${size}.png
done
```

### Online Tools (No Installation Required)
- **Favicon Generator**: https://realfavicongenerator.net/
- **SVG to PNG**: https://cloudconvert.com/svg-to-png
- **PWA Builder**: https://www.pwabuilder.com/

## 🌐 Integration Examples

### HTML Head (Favicons)
```html
<!-- SVG favicon (modern browsers) -->
<link rel="icon" type="image/svg+xml" href="/assets/brand/logo-icon.svg">

<!-- PNG fallbacks -->
<link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/brand/favicons/favicon-16x16.png">

<!-- Apple touch icon -->
<link rel="apple-touch-icon" sizes="192x192" href="/assets/brand/pwa/icon-192x192.png">

<!-- Legacy ICO -->
<link rel="shortcut icon" href="/assets/brand/favicons/favicon.ico">
```

### PWA Manifest (manifest.json)
```json
{
  "name": "Atlas Immobilier",
  "short_name": "Atlas",
  "description": "Plateforme de gestion immobilière",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976D2",
  "icons": [
    {
      "src": "/assets/brand/pwa/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/brand/pwa/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Email Template
```html
<table cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding: 20px 0;">
      <img 
        src="https://your-domain.com/assets/brand/email/logo-400x100.png" 
        alt="Atlas Immobilier" 
        width="200" 
        height="50"
        style="display:block; max-width:100%; height:auto;"
      />
    </td>
  </tr>
</table>
```

### Angular Service
```typescript
import { Injectable } from '@angular/core';

export type LogoVariant = 'horizontal' | 'vertical' | 'icon';
export type LogoTheme = 'default' | 'light' | 'dark' | 'mono';

@Injectable({ providedIn: 'root' })
export class BrandService {
  getLogoUrl(variant: LogoVariant, theme: LogoTheme = 'default'): string {
    const themeSuffix = theme !== 'default' ? `-${theme}` : '';
    return `/assets/brand/logo-${variant}${themeSuffix}.svg`;
  }

  getLogoForBackground(isDark: boolean): string {
    return this.getLogoUrl('horizontal', isDark ? 'dark' : 'default');
  }

  getLogoForPrint(): string {
    return this.getLogoUrl('horizontal', 'mono');
  }
}
```

## 🎬 Animation Features

### LogoComponent (Basic)
- Fade-in animation
- Scale-up effect
- No path drawing (uses external SVG file)
- Lighter performance footprint

### LogoInlineComponent (Advanced)
- SVG path drawing animation
- Staggered element animation
- Building shape fade-in
- Window flicker effect
- Text slide-in
- Hover pulse effect
- Heavier performance (inline SVG)

### Performance Considerations
- **LogoComponent**: Use for repeated logo instances (header, footer)
- **LogoInlineComponent**: Use for splash screens, hero sections
- **Disable animations**: Set `[animate]="false"` for static contexts
- **Respects**: `prefers-reduced-motion` media query

## 🎨 Color Palette

### Primary Colors
```css
--brand-primary: #1976D2;      /* Primary Blue */
--brand-primary-dark: #0D47A1; /* Dark Blue */
--brand-secondary: #546E7A;    /* Secondary Gray */
```

### Light Theme
```css
--brand-light: #42A5F5;        /* Light Blue */
--brand-light-gray: #78909C;   /* Secondary Light Gray */
```

### Dark Theme
```css
--brand-dark: #90CAF9;         /* Lighter Blue */
--brand-dark-gray: #B0BEC5;    /* Light Gray */
```

### Monochrome
```css
--brand-black: #212121;        /* Primary Black */
--brand-gray: #424242;         /* Secondary Gray */
```

## ♿ Accessibility

### Alt Text
- Horizontal/Vertical: "Atlas Immobilier"
- Icon: "Atlas Immobilier Icon"

### ARIA Labels
```html
<img src="logo.svg" alt="Atlas Immobilier" role="img" />
```

### SVG Accessibility
```html
<svg aria-labelledby="logo-title">
  <title id="logo-title">Atlas Immobilier</title>
  <!-- SVG content -->
</svg>
```

### Contrast Requirements
- Light backgrounds: ✅ WCAG AA (4.5:1 contrast)
- Dark backgrounds: ✅ WCAG AA (4.5:1 contrast)
- Monochrome: ✅ WCAG AAA (7:1 contrast)

### Reduced Motion
All animations respect `prefers-reduced-motion: reduce` media query.

## 📦 File Sizes (Approximate)

### SVG Files
- Horizontal logos: ~4-5 KB
- Vertical logos: ~4-5 KB
- Icon logos: ~2-3 KB

### PNG Files (Optimized)
- Favicons (16-48px): ~1-3 KB each
- PWA Icons (72-512px): ~3-25 KB each
- Email logos (200-600px): ~5-15 KB each

### Optimization Tips
- SVG: Already optimized, no further action needed
- PNG: Use TinyPNG, ImageOptim, or similar
- Target: < 50KB for email images

## 🔧 Troubleshooting

### SVG not displaying in email
- Use PNG versions from `/email/` directory
- Email clients have limited SVG support

### Animation not working
- Check if using `LogoInlineComponent` (not `LogoComponent`)
- Verify `[animate]="true"` is set
- Check browser console for errors

### Logo appears blurry
- Use SVG version for scalable graphics
- Ensure 2x resolution for retina displays
- Check minimum size requirements

### Wrong colors on dark background
- Use `-dark` theme variant
- Set `theme="dark"` or `theme="auto"`

## 📞 Support

For questions about logo usage or custom variants, contact the design team.

**Version**: 1.0.0  
**Last Updated**: 2024  
**License**: Proprietary - Atlas Immobilier
