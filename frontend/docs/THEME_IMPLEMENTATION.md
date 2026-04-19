# Angular Material Custom Theme Implementation

## Overview

A custom Angular Material theme has been implemented with a real estate CRM color palette, custom typography, and density options.

## Files Created/Modified

### 1. `src/styles/theme.scss` (New)
Custom Angular Material theme with:
- **Primary Color**: `#2c5aa0` (Professional blue for real estate)
- **Accent Color**: `#e67e22` (Orange for call-to-action elements)
- **Warn Color**: `#e74c3c` (Red for warnings and errors)

### 2. `src/styles.css` (Modified)
- Added Google Fonts import for Roboto and Open Sans
- Imports the custom theme
- Updated body font-family to use Roboto and Open Sans

### 3. `angular.json` (Modified)
- Updated `build` and `test` configurations to include `src/styles/theme.scss`
- Removed dependency on the default indigo-pink theme

## Theme Features

### Color Palettes

Complete Material Design color palettes with all required shades (50-900, A100-A700) and contrast colors:

- **Primary** (`#2c5aa0`): Used for primary actions, app bars, and key UI elements
- **Accent** (`#e67e22`): Used for floating action buttons and interactive elements
- **Warn** (`#e74c3c`): Used for warnings, errors, and destructive actions

### Typography Scale

Custom typography configuration using:
- **Roboto**: For headlines, subtitles, and buttons (clean, modern look)
- **Open Sans**: For body text and captions (excellent readability)

Typography levels include:
- Headline 1-6 (112px to 20px)
- Subtitle 1-2
- Body 1-2
- Caption
- Button text

### Density Options

Three density levels for flexible UI layouts:

1. **Default** (density: 0): Standard spacing for general use
2. **Compact** (density: -1): Reduced spacing for tables and data-heavy views
   - Apply with CSS class: `.compact-density`
3. **Maximum Compact** (density: -2): Minimal spacing for maximum information density
   - Apply with CSS class: `.compact-density-max`

## Usage Examples

### Using Density Classes

For compact tables:
```html
<div class="compact-density">
  <table mat-table [dataSource]="dataSource">
    <!-- table content -->
  </table>
</div>
```

For maximum density:
```html
<div class="compact-density-max">
  <mat-form-field>
    <input matInput placeholder="Compact input">
  </mat-form-field>
</div>
```

### Color Usage in Components

The theme colors are automatically applied to all Angular Material components. You can also reference them in custom styles:

```scss
.custom-element {
  background-color: mat.get-color-from-palette($primary-palette, 500);
  color: mat.get-color-from-palette($primary-palette, '500-contrast');
}
```

## Benefits

1. **Brand Consistency**: Professional real estate CRM color scheme throughout the application
2. **Improved Readability**: Custom typography with Roboto and Open Sans font families
3. **Flexible Layouts**: Three density levels for different use cases (dashboards, data tables, forms)
4. **Accessibility**: Proper contrast ratios defined for all color combinations
5. **Material Design Compliance**: Full Material Design palette structure for all theme colors

## Font Loading

Fonts are loaded via Google Fonts CDN in `styles.css`:
- Roboto: weights 300, 400, 500, 700
- Open Sans: weights 300, 400, 600, 700

## Next Steps

To use the theme effectively:

1. Apply density classes to tables and data-heavy components
2. Use Material Design color utilities for custom components
3. Leverage the typography scale for consistent text styling
4. Consider adding a dark theme variant if needed
