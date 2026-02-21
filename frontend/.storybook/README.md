# Atlas Immobilier Design System - Storybook

Comprehensive design system documentation for the Atlas Immobilier real estate management platform.

## 📚 What's Inside

This Storybook contains comprehensive documentation for:

### Design Tokens
- **Colors**: Primary, secondary, semantic (success, warning, error, info), and neutral palettes with WCAG AA compliance
- **Typography**: Modular scale using Perfect Fourth ratio (1.25), font weights, line heights, and letter spacing
- **Spacing**: 4px-based grid system with consistent spacing scale
- **Shadows**: 6 elevation levels for depth and hierarchy
- **Border Radius**: Consistent rounded corners from subtle to fully rounded
- **Animations**: Duration scale and easing functions for smooth transitions

### Components (50+ documented)
- **Buttons**: Primary, secondary, outlined, text, icon buttons, and FABs
- **Forms**: Inputs, selects, textareas, checkboxes, radio buttons with validation
- **Cards**: Various card layouts and styles
- **Badges**: Status indicators and labels
- **Dialogs**: Modals, confirmations, and form dialogs
- **Charts**: Line, bar, pie/doughnut charts with Chart.js
- **Icons**: Real estate icon system and Material Icons
- **Loading States**: Spinners, skeleton loaders, and progress bars
- **Empty States**: No data, no results, error states
- **Illustrations**: Lottie animations and SVG illustrations

### Guidelines
- **Accessibility**: WCAG AA compliance guidelines and keyboard navigation
- **Best Practices**: Do's and don'ts for each component
- **Code Examples**: Copy-paste ready code snippets

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Angular 16.2.0
- All frontend dependencies installed

### Running Storybook Locally

```bash
cd frontend
npm install
npm run storybook
```

Storybook will start on http://localhost:6006

### Building Static Storybook

```bash
cd frontend
npm run build-storybook
```

This creates a static build in `frontend/storybook-static/` that can be deployed anywhere.

## 📦 Deployment Options

### Option 1: GitHub Pages

```bash
# Build storybook
npm run build-storybook

# Deploy to GitHub Pages (from frontend directory)
# Requires gh-pages package: npm install --save-dev gh-pages
npx gh-pages -d storybook-static
```

### Option 2: Netlify

1. Connect your repository to Netlify
2. Set build command: `cd frontend && npm install && npm run build-storybook`
3. Set publish directory: `frontend/storybook-static`
4. Deploy!

### Option 3: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
npm run build-storybook
vercel --prod storybook-static
```

### Option 4: AWS S3 + CloudFront

```bash
# Build storybook
npm run build-storybook

# Upload to S3
aws s3 sync storybook-static/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### Option 5: Azure Static Web Apps

```bash
# Build storybook
npm run build-storybook

# Deploy using Azure CLI
az staticwebapp create \
  --name atlas-storybook \
  --resource-group your-resource-group \
  --source storybook-static \
  --location "westus2"
```

### Option 6: Self-Hosted (Docker)

Create `Dockerfile` in frontend directory:

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build-storybook

FROM nginx:alpine
COPY --from=builder /app/storybook-static /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t atlas-storybook .
docker run -p 8080:80 atlas-storybook
```

## 🎨 Customization

### Adding New Stories

Create a new story file in `frontend/src/stories/`:

```typescript
import { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Components/YourComponent',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Description of your component',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `<your-component></your-component>`,
  }),
};
```

### Modifying Theme

Edit `.storybook/preview.js` to customize:
- Background colors
- Viewport sizes
- Global decorators
- Theme toggle behavior

### Adding Addons

Install addon:
```bash
npm install --save-dev @storybook/addon-example
```

Add to `.storybook/main.js`:
```javascript
module.exports = {
  addons: [
    // ... existing addons
    '@storybook/addon-example',
  ],
};
```

## 🔧 Configuration

### Storybook Configuration Files

- **`.storybook/main.js`**: Main Storybook configuration
  - Story locations
  - Addon registration
  - Framework settings
  - Static directories

- **`.storybook/preview.js`**: Preview configuration
  - Global parameters
  - Decorators
  - Theme configuration
  - Accessibility settings

### Accessibility Testing

The Storybook includes automated WCAG validation via `@storybook/addon-a11y`:

1. Run Storybook locally
2. Navigate to any component story
3. Click the "Accessibility" tab in the addons panel
4. Review violations and warnings
5. Fix issues and verify

### Interactive Controls

All component stories include interactive controls (Knobs addon):

1. View any component story
2. Click the "Controls" tab in the addons panel
3. Modify component props in real-time
4. See changes immediately
5. Copy code snippets with modified values

## 📖 Documentation Structure

```
Design Tokens/
├── Overview (Introduction to design tokens)
├── Colors (Color palette with WCAG AA compliance)
├── Typography (Font system and modular scale)
├── Spacing (4px grid system)
├── Shadows (Elevation levels)
├── Border Radius (Rounded corners)
└── Animations (Timing and easing)

Guidelines/
├── Accessibility (WCAG AA guidelines)
├── Best Practices (Do's and don'ts)
└── Do and Don't (Visual examples)

Components/
├── Buttons
├── Forms
├── Cards
├── Badges
├── Dialogs
├── Charts
├── Icons
├── Loading States
├── Empty States
└── Illustrations
```

## 🌗 Dark Theme Support

All components support dark theme:

1. Use the theme toggle in the Storybook toolbar
2. Switch between "light" and "dark" themes
3. All components automatically adapt
4. Design tokens are overridden for dark theme
5. Maintains WCAG AA contrast ratios

## 🔍 Search and Navigation

- **Sidebar**: Browse all stories by category
- **Search**: Press `/` to search stories
- **Keyboard Navigation**: 
  - `←` `→` Navigate between stories
  - `/` Focus search
  - `ESC` Clear search

## 📱 Responsive Testing

Use viewport addon to test components at different screen sizes:

- Mobile (375px)
- Tablet (768px)
- Desktop (1280px)
- Wide (1920px)

## 🤝 Contributing

1. Create new story files in `frontend/src/stories/`
2. Follow existing naming conventions
3. Include comprehensive examples
4. Add accessibility guidelines
5. Document code snippets
6. Test in both light and dark themes

## 📝 Code Snippet Format

All component stories include copy-paste ready code:

```typescript
// TypeScript
import { Component } from '@angular/core';

// HTML
<component-name [prop]="value"></component-name>

// CSS
.component-name {
  property: value;
}
```

## 🎯 Best Practices

1. **Consistency**: Use design tokens instead of hardcoded values
2. **Accessibility**: All components meet WCAG AA standards
3. **Responsiveness**: Test on multiple screen sizes
4. **Dark Theme**: Ensure components work in both themes
5. **Documentation**: Include clear descriptions and examples
6. **Code Quality**: Follow Angular best practices

## 🐛 Troubleshooting

### Storybook Won't Start

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run storybook
```

### Build Errors

```bash
# Ensure all peer dependencies are installed
npm install --legacy-peer-deps

# Rebuild
npm run build-storybook
```

### Dark Theme Not Working

Check that:
1. Global decorator is applied in `.storybook/preview.js`
2. CSS variables are defined in `styles.css`
3. Dark theme class is applied to body

## 📧 Support

For questions or issues:
- Open an issue in the repository
- Contact the development team
- Review existing documentation

## 🔗 Links

- [Storybook Documentation](https://storybook.js.org/docs/angular/get-started/introduction)
- [Angular Material](https://material.angular.io/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Chart.js](https://www.chartjs.org/)

## 📄 License

This design system is part of the Atlas Immobilier project.
