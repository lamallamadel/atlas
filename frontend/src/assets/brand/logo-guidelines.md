# Atlas Immobilier - Logo Guidelines

## Logo Variants

### Primary Logos
- **logo-horizontal.svg** - Main horizontal logo for headers, footers, and wide spaces
- **logo-vertical.svg** - Vertical logo for narrow spaces, mobile apps, and social media
- **logo-icon.svg** - Icon-only version for favicons, app icons, and small spaces

### Theme Variants
- **logo-horizontal-light.svg** - Optimized for light backgrounds (default)
- **logo-horizontal-dark.svg** - Optimized for dark backgrounds/dark mode
- **logo-horizontal-mono.svg** - Monochrome version for print and limited color contexts

### Raster Exports
- **favicons/** - Multiple resolutions for browser favicons (16x16, 32x32, 48x48)
- **pwa/** - PWA icon sizes (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512)
- **email/** - Email-safe PNG versions (200x50, 400x100, 600x150)

## Clear Space

### Horizontal Logo
- **Minimum clear space**: Height of the globe icon (28px in original SVG)
- No other elements should appear within this boundary
- Applies to all sides: top, bottom, left, right

### Vertical Logo  
- **Minimum clear space**: Width of the globe icon (70px in original SVG)
- Maintain this space around the entire logo

### Icon Only
- **Minimum clear space**: 10% of icon height on all sides
- Example: For 80px icon, maintain 8px clear space

## Minimum Sizes

### Digital/Screen
- **Horizontal Logo**: 
  - Minimum width: 160px
  - Minimum height: 40px
  - Recommended: 240px width or larger

- **Vertical Logo**: 
  - Minimum width: 80px
  - Minimum height: 100px
  - Recommended: 120px width or larger

- **Icon Only**: 
  - Minimum: 32x32px
  - Recommended: 48x48px or larger
  - Ideal for favicons: 64x64px

### Print
- **Horizontal Logo**: Minimum 40mm (1.57 inches) width
- **Vertical Logo**: Minimum 25mm (0.98 inches) width
- **Icon Only**: Minimum 10mm (0.39 inches) width

## Color Specifications

### Primary Brand Colors
- **Primary Blue**: `#1976D2` (RGB: 25, 118, 210)
- **Dark Blue**: `#0D47A1` (RGB: 13, 71, 161)
- **Secondary Gray**: `#546E7A` (RGB: 84, 110, 122)

### Light Theme
- **Light Blue**: `#42A5F5` (RGB: 66, 165, 245)
- **Secondary Light Gray**: `#78909C` (RGB: 120, 144, 156)

### Dark Theme
- **Lighter Blue**: `#90CAF9` (RGB: 144, 202, 249)
- **Secondary Light Gray**: `#B0BEC5` (RGB: 176, 190, 197)

### Monochrome
- **Primary Black**: `#212121` (RGB: 33, 33, 33)
- **Secondary Gray**: `#424242` (RGB: 66, 66, 66)

## Usage Guidelines

### DO
✅ Use the appropriate variant for your background (light/dark/mono)
✅ Maintain the specified clear space around the logo
✅ Keep the logo at or above minimum sizes
✅ Use the horizontal logo for headers and wide layouts
✅ Use the vertical logo for mobile headers and narrow spaces
✅ Use the icon for favicons, app icons, and profile images
✅ Preserve the aspect ratio when scaling
✅ Use high-resolution versions for retina/HiDPI displays

### DON'T
❌ Don't alter the logo colors outside of approved variants
❌ Don't add effects (shadows, outlines, glows, etc.)
❌ Don't rotate or skew the logo
❌ Don't place the logo on busy or low-contrast backgrounds
❌ Don't stretch or distort the aspect ratio
❌ Don't use the logo below minimum sizes
❌ Don't crowd the logo with other elements
❌ Don't recreate or redraw the logo

## Background Recommendations

### Light Background
- Use **logo-horizontal.svg** or **logo-horizontal-light.svg**
- Ensure contrast ratio of at least 4.5:1
- Recommended backgrounds: White, light gray (#F5F5F5), light blue (#E3F2FD)

### Dark Background
- Use **logo-horizontal-dark.svg**
- Ensure contrast ratio of at least 4.5:1
- Recommended backgrounds: Dark gray (#212121, #303030), dark blue (#0D47A1)

### Colored Background
- Use **logo-horizontal-mono.svg** for maximum versatility
- Test contrast before finalizing

## File Format Selection

### When to Use SVG
- Web applications and responsive websites
- Email signatures (modern email clients)
- Digital presentations
- Scalable icons and graphics
- Any context requiring perfect scaling

### When to Use PNG
- Email templates (broad compatibility)
- Social media profile images
- App store listings
- Legacy email clients
- Contexts requiring specific pixel dimensions

### When to Use ICO
- Browser favicons (favicon.ico)
- Windows application icons
- Bookmark icons

## Accessibility

### Alt Text
- Horizontal/Vertical: "Atlas Immobilier"
- Icon: "Atlas Immobilier Icon"

### Semantic HTML
```html
<img src="logo-horizontal.svg" alt="Atlas Immobilier" role="img" />
```

### ARIA Labels
```html
<svg aria-labelledby="logo-title">
  <title id="logo-title">Atlas Immobilier</title>
  <!-- SVG content -->
</svg>
```

## Integration Examples

### HTML Header
```html
<header>
  <img src="/assets/brand/logo-horizontal.svg" 
       alt="Atlas Immobilier" 
       width="240" 
       height="60" />
</header>
```

### Angular Component
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  template: `
    <app-logo 
      variant="horizontal" 
      theme="auto" 
      [animate]="true">
    </app-logo>
  `
})
export class HeaderComponent {}
```

### Favicon Links
```html
<link rel="icon" type="image/svg+xml" href="/assets/brand/logo-icon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/brand/favicons/favicon-16x16.png">
```

### PWA Manifest
```json
{
  "name": "Atlas Immobilier",
  "short_name": "Atlas",
  "icons": [
    {
      "src": "/assets/brand/pwa/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/brand/pwa/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Contact

For questions about logo usage or to request custom variants, contact the design team.

**Last Updated**: 2024
**Version**: 1.0.0
