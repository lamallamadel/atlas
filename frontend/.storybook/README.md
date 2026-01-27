# Atlas Immobilier Design System - Storybook

Comprehensive design system documentation with interactive components, design tokens, and accessibility guidelines.

## 🚀 Quick Start

### Running Storybook Locally

```bash
cd frontend
npm install
npm run storybook
```

Storybook will open at `http://localhost:6006`

### Building Static Documentation

Generate a static site for sharing with your team:

```bash
npm run build-storybook
```

This creates a `storybook-static` folder that can be:
- Deployed to Netlify, Vercel, GitHub Pages, or S3
- Shared as a zip file
- Opened locally in any browser

## 📚 Documentation Structure

### Design Tokens
- **Colors**: Primary, secondary, semantic colors with WCAG AA compliance
- **Typography**: Modular scale, font weights, line heights, letter spacing
- **Spacing**: 4px grid system with consistent spacing tokens
- **Shadows**: 5-level elevation system for depth and hierarchy

### Components
- **Buttons**: All variants (primary, secondary, outlined, text, icon, FAB)
- **Forms**: Inputs, selects, checkboxes, radios with validation
- **Cards**: Property cards, stats cards, interactive cards
- **Badges**: Status badges, count badges, tags
- **Illustrations**: Empty states, error states, success states, loading

### Guidelines
- **Accessibility Checklist**: Comprehensive WCAG 2.1 AA compliance guide
- **Best Practices**: Component usage patterns and anti-patterns
- **Do and Don't**: Visual examples of correct and incorrect usage

## ✨ Features

### Dark Mode Toggle
Test all components in light and dark themes using the backgrounds toolbar.

### Responsive Preview
View components on different screen sizes using the viewport toolbar:
- Mobile (375px)
- Tablet (768px)
- Desktop (1280px)
- Wide (1920px)

### Accessibility Testing
Built-in accessibility checker using axe-core:
- Click the "Accessibility" tab in any story
- Review violations and passes
- Get guidance on fixes

### Interactive Controls
Modify component properties in real-time using the "Controls" tab.

### Code Snippets
Every story includes copy-ready code examples for HTML, CSS, and TypeScript.

## 🎨 Using the Design System

### Installing Dependencies

The design system uses Angular Material. Ensure it's installed:

```bash
npm install @angular/material @angular/cdk
```

### Importing Components

```typescript
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

@NgModule({
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule
  ]
})
export class YourModule { }
```

### Using Design Tokens

All design tokens are available as CSS custom properties:

```css
.my-component {
  color: var(--color-primary-500);
  padding: var(--spacing-6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2);
  font-size: var(--font-size-base);
  transition: var(--transition-base);
}
```

### Example Button

```html
<button mat-raised-button color="primary">
  <mat-icon>add</mat-icon>
  Create Dossier
</button>
```

### Example Form Field

```html
<mat-form-field appearance="outline">
  <mat-label>Email *</mat-label>
  <input matInput type="email" required>
  <mat-icon matPrefix>email</mat-icon>
  <mat-hint>We'll never share your email</mat-hint>
  <mat-error>Please enter a valid email</mat-error>
</mat-form-field>
```

### Example Badge

```html
<span class="badge badge--success">
  Active
</span>
```

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
}

.badge--success {
  background: var(--color-success-100);
  color: var(--color-success-800);
}
```

## 🧪 Testing

### Accessibility Testing

1. Run Storybook: `npm run storybook`
2. Navigate to any component story
3. Click the "Accessibility" tab
4. Review violations and warnings
5. Fix issues and re-test

### Visual Regression Testing

Storybook can be integrated with:
- Chromatic (automated visual testing)
- Percy (visual review platform)
- Playwright (E2E + visual testing)

## 🎯 Accessibility Standards

All components meet WCAG 2.1 Level AA standards:
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements keyboard accessible
- **Focus Indicators**: 2px solid outline with 3:1 contrast ratio
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Touch Targets**: 44×44px minimum on mobile

## 📤 Deployment

### Deploying to Netlify

1. Build static site: `npm run build-storybook`
2. Deploy `storybook-static` folder to Netlify
3. Configure custom domain if needed

```bash
# Using Netlify CLI
npm install -g netlify-cli
netlify deploy --dir=storybook-static --prod
```

### Deploying to Vercel

```bash
# Using Vercel CLI
npm install -g vercel
cd storybook-static
vercel --prod
```

### Deploying to GitHub Pages

```bash
# Build static site
npm run build-storybook

# Deploy to gh-pages branch
npx gh-pages -d storybook-static
```

### Deploying to AWS S3

```bash
# Build static site
npm run build-storybook

# Upload to S3
aws s3 sync storybook-static s3://your-bucket-name --acl public-read
```

## 🤝 Contributing

### Adding New Components

1. Create a new story file: `src/stories/ComponentName.stories.ts`
2. Follow the existing story structure
3. Include all component variants
4. Add code examples
5. Document accessibility considerations
6. Test with axe DevTools

### Story Template

```typescript
import { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

const meta: Meta = {
  title: 'Components/YourComponent',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [/* your imports */],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Component description here',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <!-- Your component HTML -->
    `,
  }),
};
```

### Adding Documentation Pages

Create `.mdx` files in `src/stories/` for documentation pages:

```mdx
import { Meta } from '@storybook/blocks';

<Meta title="Your Category/Page Title" />

# Your Page Title

Content here...
```

## 🛠️ Configuration

### Storybook Configuration Files

- `.storybook/main.js` - Addons and story locations
- `.storybook/preview.js` - Global decorators and parameters
- `.storybook/README.md` - This file

### Customizing Theme

Edit `.storybook/preview.js` to customize Storybook theme:

```javascript
export const parameters = {
  darkMode: {
    dark: { /* dark theme config */ },
    light: { /* light theme config */ }
  }
};
```

## 📚 Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Angular Material](https://material.angular.io/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## 🐛 Troubleshooting

### Storybook won't start

```bash
# Clear cache
rm -rf node_modules/.cache

# Reinstall dependencies
npm ci

# Try again
npm run storybook
```

### Build fails

```bash
# Check Node version (requires 16+)
node --version

# Update dependencies
npm update

# Try clean build
npm run build-storybook -- --loglevel debug
```

### Components not rendering

1. Check that all imports are correct
2. Verify Angular modules are imported in `moduleMetadata`
3. Check browser console for errors
4. Clear Storybook cache

## 📧 Support

For questions or issues:
- Check the accessibility checklist
- Review existing component stories
- Consult the Angular Material documentation
- Open an issue in the project repository

## 📝 License

This design system is part of the Atlas Immobilier project.
