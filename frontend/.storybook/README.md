# Storybook Setup for Real Estate Icons

## Installation

To use Storybook with the custom icon system, you need to install Storybook and its dependencies.

### Quick Installation

```bash
cd frontend
npx storybook@latest init
```

This will automatically detect Angular and install the appropriate packages.

### Manual Installation

If you prefer manual installation:

```bash
cd frontend
npm install --save-dev @storybook/angular @storybook/addon-essentials @storybook/addon-links @storybook/addon-interactions @storybook/addon-a11y
```

## Running Storybook

```bash
cd frontend
npm run storybook
```

This will start Storybook on http://localhost:6006

## Configuration

The Storybook configuration is already set up in `.storybook/main.js` and `.storybook/preview.js`.

### main.js

Configures:
- Story file locations
- Addons (essentials, links, interactions, a11y)
- Framework (Angular)
- Auto-documentation

### preview.js

Configures:
- Global parameters
- Background options
- Control matchers
- Actions

## Available Stories

### Real Estate Icons

**Path**: Design System > Real Estate Icons

Showcases individual icons with interactive controls for:
- Icon selection (dropdown with all 38 icons)
- Size (small, medium, large, xlarge)
- Color (color picker)

**Sub-stories**:
- **Default**: Single icon with controls
- **All Sizes**: Shows all size variants
- **With Colors**: Shows color variations
- **House Types**: Category showcase
- **Rooms**: Category showcase
- **Amenities**: Category showcase
- **Documents**: Category showcase
- **Actions**: Category showcase
- **Measurements**: Category showcase

### Icon Gallery

**Path**: Design System > Icon Gallery

Interactive gallery with:
- **Search**: Full-text search across icon names, tags, and descriptions
- **Category Filter**: Filter by 6 categories
- **Copy to Clipboard**: Click "Copier" to copy component markup
- **Visual Preview**: All icons displayed with metadata

## Package.json Scripts

Add these scripts to `frontend/package.json`:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## Dependencies

### Required

```json
{
  "devDependencies": {
    "@storybook/angular": "^7.6.0",
    "@storybook/addon-essentials": "^7.6.0",
    "@storybook/addon-links": "^7.6.0",
    "@storybook/addon-interactions": "^7.6.0",
    "@storybook/addon-a11y": "^7.6.0"
  }
}
```

### Optional but Recommended

```json
{
  "devDependencies": {
    "@storybook/addon-viewport": "^7.6.0",
    "@storybook/addon-backgrounds": "^7.6.0",
    "@storybook/addon-measure": "^7.6.0",
    "@storybook/addon-outline": "^7.6.0"
  }
}
```

## Building for Production

To build a static version of Storybook:

```bash
cd frontend
npm run build-storybook
```

This creates a static build in `storybook-static/` that can be deployed to any web server.

## Deployment

### Deploy to Netlify/Vercel

1. Build Storybook: `npm run build-storybook`
2. Point deployment to `storybook-static/` directory

### Deploy to GitHub Pages

```bash
npm run build-storybook
npx http-server storybook-static
```

Or use a GitHub Action for automatic deployment.

## Customization

### Adding Custom Themes

Edit `.storybook/preview.js`:

```javascript
export const parameters = {
  backgrounds: {
    values: [
      { name: 'Light', value: '#ffffff' },
      { name: 'Dark', value: '#1a1a1a' },
      { name: 'Brand Blue', value: '#1976d2' }
    ]
  }
};
```

### Custom Decorators

Add global decorators in `.storybook/preview.js`:

```javascript
import { moduleMetadata } from '@storybook/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export const decorators = [
  moduleMetadata({
    imports: [BrowserAnimationsModule]
  })
];
```

## Troubleshooting

### Icons Not Loading

If icons don't appear in Storybook:

1. Ensure `assets/icons/real-estate-icons.svg` exists
2. Check that HttpClientModule is imported in story decorators
3. Verify the IconRegistryService is provided

### Module Not Found Errors

If you see module not found errors:

```bash
cd frontend
npm install
```

### Build Errors

If build fails:

1. Clear cache: `rm -rf node_modules/.cache`
2. Reinstall: `npm install`
3. Rebuild: `npm run build-storybook`

## Best Practices

1. **Keep Stories Updated**: Update stories when adding new icons
2. **Document Usage**: Include usage examples in story descriptions
3. **Accessibility**: Test with the a11y addon
4. **Mobile Testing**: Use viewport addon to test responsive behavior
5. **Performance**: Keep stories simple and focused

## Resources

- [Storybook Documentation](https://storybook.js.org/docs/angular/get-started/introduction)
- [Storybook Angular](https://storybook.js.org/docs/angular/api/frameworks-options)
- [Custom Icons Documentation](../REAL_ESTATE_ICONS.md)
- [Implementation Examples](../ICON_IMPLEMENTATION_EXAMPLES.md)
