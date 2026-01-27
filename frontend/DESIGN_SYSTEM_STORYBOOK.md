# Atlas Immobilier Design System - Storybook Documentation

Comprehensive design system with interactive components, design tokens, accessibility guidelines, and team collaboration tools.

## 📚 Overview

This Storybook implementation provides:

### Design Tokens
- **Colors**: WCAG AA compliant color system with primary, secondary, neutral, and semantic colors
- **Typography**: Modular scale (Perfect Fourth 1.25 ratio) with font weights, line heights, and letter spacing
- **Spacing**: 4px grid system with consistent spacing tokens
- **Shadows**: 5-level elevation system for depth and hierarchy
- **Border Radius**: Consistent corner rounding values

### Components
- **Buttons**: All variants (primary, secondary, outlined, text, icon, FAB) with states and sizes
- **Forms**: Inputs, selects, checkboxes, radios with validation states and error messages
- **Cards**: Property cards, stats cards, interactive cards with hover effects
- **Badges**: Status badges, count badges, tags with semantic colors
- **Illustrations**: Empty states, error states, success states, loading states, onboarding

### Guidelines
- **Accessibility Checklist**: Comprehensive WCAG 2.1 AA compliance guide
- **Do and Don't**: Visual examples of correct and incorrect usage patterns
- **Best Practices**: Component usage patterns and anti-patterns

## 🚀 Quick Start

### Running Storybook

```bash
cd frontend
npm install
npm run storybook
```

Storybook runs at `http://localhost:6006`

### Building Static Site

```bash
npm run build-storybook
```

Generates `storybook-static/` folder ready for deployment.

## ✨ Key Features

### 1. Dark Mode Toggle
- Test all components in light and dark themes
- Toggle using the backgrounds toolbar
- Automatic theme switching with `.dark-theme` class
- All components adapt via CSS custom properties

### 2. Responsive Preview
- Test components on different screen sizes
- Viewport toolbar with presets:
  - Mobile (375px)
  - Tablet (768px)
  - Desktop (1280px)
  - Wide (1920px)

### 3. Accessibility Testing
- Built-in axe-core accessibility checker
- Violations and warnings displayed per story
- WCAG 2.1 Level AA compliance
- Interactive keyboard navigation testing

### 4. Interactive Controls
- Modify component props in real-time
- Controls tab for dynamic property changes
- Live preview of component variations
- Args table documentation

### 5. Code Snippets
- Copy-ready HTML examples
- CSS styling examples
- TypeScript usage examples
- SCSS patterns and mixins

### 6. Static Export
- Generate standalone HTML site
- No server required
- Share with design team
- Deploy to any static hosting

## 📖 Documentation Structure

```
src/stories/
├── Introduction.mdx                          # Welcome page
├── DesignTokens-Overview.mdx                 # Token system overview
├── DesignTokens-Colors.stories.ts            # Color palette
├── DesignTokens-Typography.stories.ts        # Type scale
├── DesignTokens-Spacing.stories.ts           # Spacing system
├── DesignTokens-Shadows.stories.ts           # Shadows & borders
├── Components-Buttons.stories.ts             # Button components
├── Components-Forms.stories.ts               # Form components
├── Components-Cards.stories.ts               # Card components
├── Components-Badges.stories.ts              # Badge components
├── Components-Illustrations.stories.ts       # Illustration patterns
├── Guidelines-Accessibility.mdx              # A11y checklist
└── Guidelines-DosDonts.stories.ts            # Usage examples
```

## 🎨 Using Design Tokens

### CSS Custom Properties

All design tokens are available as CSS variables:

```css
.my-component {
  /* Colors */
  background-color: var(--color-primary-500);
  color: var(--color-neutral-800);
  
  /* Spacing */
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-4);
  gap: var(--spacing-3);
  
  /* Typography */
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-body);
  
  /* Shadows & Borders */
  box-shadow: var(--shadow-2);
  border-radius: var(--radius-xl);
  
  /* Transitions */
  transition: var(--transition-base);
}

.my-component:hover {
  box-shadow: var(--shadow-4);
  transform: translateY(-2px);
}
```

### Most Common Tokens

#### Colors
- `--color-primary-500` - Main brand blue (#2c5aa0)
- `--color-secondary-500` - Accent orange (#e67e22)
- `--color-success-700` - Success text (WCAG AA)
- `--color-error-700` - Error text (WCAG AA)
- `--color-neutral-800` - Body text (#424242)

#### Spacing (4px Grid)
- `--spacing-2` (8px) - Tight spacing
- `--spacing-4` (16px) - Default spacing
- `--spacing-6` (24px) - Card padding
- `--spacing-8` (32px) - Section spacing

#### Typography
- `--font-size-base` (14px) - Body text
- `--font-size-1` (17.5px) - Large body
- `--font-size-2` (21.9px) - Small headings
- `--font-weight-medium` (500) - Buttons, labels
- `--font-weight-semibold` (600) - Headings

#### Shadows
- `--shadow-2` - Default card shadow
- `--shadow-4` - Hover/elevated state
- `--shadow-5` - Modals, overlays

## 🧪 Accessibility Standards

All components meet WCAG 2.1 Level AA:

### Color Contrast
- Normal text: **4.5:1** minimum
- Large text: **3:1** minimum
- UI components: **3:1** minimum
- All text colors tested and compliant

### Keyboard Navigation
- All interactive elements keyboard accessible
- Logical tab order
- Visible focus indicators (2px outline, 3:1 contrast)
- No keyboard traps

### Screen Reader Support
- Semantic HTML elements
- Proper ARIA labels and descriptions
- Dynamic content announced with aria-live
- All images have alt text

### Touch Targets
- Minimum **44×44px** on mobile
- Adequate spacing between targets
- No hover-only interactions

## 📤 Deployment Options

### Netlify

```bash
npm run build-storybook
netlify deploy --dir=storybook-static --prod
```

### Vercel

```bash
npm run build-storybook
cd storybook-static
vercel --prod
```

### GitHub Pages

```bash
npm run build-storybook
npx gh-pages -d storybook-static
```

### AWS S3

```bash
npm run build-storybook
aws s3 sync storybook-static s3://your-bucket --acl public-read
```

### Docker

```dockerfile
FROM nginx:alpine
COPY storybook-static /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t atlas-design-system .
docker run -p 8080:80 atlas-design-system
```

## 🤝 Contributing

### Adding New Components

1. Create story file:
```typescript
// src/stories/Components-NewComponent.stories.ts
import { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Components/NewComponent',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `<your-component></your-component>`,
  }),
};
```

2. Add all variants (sizes, states, colors)
3. Include accessibility notes
4. Provide code examples
5. Test with axe DevTools

### Adding Documentation Pages

Create `.mdx` files for long-form documentation:

```mdx
import { Meta } from '@storybook/blocks';

<Meta title="Category/Page Title" />

# Page Title

Content here...
```

## 🛠️ Configuration

### Storybook Files

- `.storybook/main.js` - Addons, story paths
- `.storybook/preview.js` - Global settings, decorators
- `.storybook/README.md` - This documentation

### Addons Installed

- `@storybook/addon-links` - Navigation between stories
- `@storybook/addon-essentials` - Controls, docs, actions
- `@storybook/addon-interactions` - Interaction testing
- `@storybook/addon-a11y` - Accessibility testing
- `@storybook/addon-viewport` - Responsive preview
- `@storybook/addon-measure` - Measure tool
- `@storybook/addon-outline` - Layout helper

## 📊 Bundle Analysis

Storybook can help identify bundle issues:

```bash
# Build with stats
npm run build-storybook -- --webpack-stats-json

# Analyze bundle
npx webpack-bundle-analyzer storybook-static/stats.json
```

## 🔍 Testing Checklist

Before adding new components:

### Design Tokens
- [ ] Uses CSS custom properties (not hard-coded values)
- [ ] Follows spacing scale (4px grid)
- [ ] Uses semantic color tokens
- [ ] Respects typography scale

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] ARIA labels for icon-only elements
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader tested
- [ ] Touch targets ≥44×44px

### Documentation
- [ ] All variants documented
- [ ] Code examples provided
- [ ] Accessibility notes included
- [ ] Do/Don't examples added
- [ ] Props documented in Controls

### Quality
- [ ] Works in light and dark mode
- [ ] Responsive on all viewports
- [ ] No console errors
- [ ] Passes axe accessibility audit
- [ ] Follows existing patterns

## 📚 Resources

### Internal
- [Atlas Immobilier Backend](../backend/README.md)
- [E2E Testing Guide](../AGENTS.md)
- [Accessibility Guide](./ACCESSIBILITY.md)

### External
- [Storybook Documentation](https://storybook.js.org/docs)
- [Angular Material](https://material.angular.io/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## 🎯 Goals

This design system aims to:

1. **Accelerate Development**: Reusable components and patterns
2. **Ensure Consistency**: Same look and feel across the app
3. **Improve Accessibility**: WCAG AA compliance by default
4. **Enable Collaboration**: Shared language between design and engineering
5. **Facilitate Maintenance**: Change once, update everywhere
6. **Support Theming**: Easy dark mode and brand variations

## 📝 Changelog

### v1.0.0 (Initial Release)

**Design Tokens**
- Colors: Primary, secondary, neutral, semantic (WCAG AA)
- Typography: Modular scale (1.25 ratio)
- Spacing: 4px grid system
- Shadows: 5-level elevation
- Border radius: Consistent rounding

**Components**
- Buttons: All variants with states
- Forms: Inputs, selects, validation
- Cards: Property, stats, interactive
- Badges: Status, count, tags
- Illustrations: Empty, error, success states

**Guidelines**
- Accessibility checklist (WCAG 2.1 AA)
- Do/Don't visual examples
- Code snippets for all components

**Features**
- Dark mode support
- Responsive preview
- Accessibility testing
- Interactive controls
- Static export

## 🐛 Troubleshooting

### Storybook Won't Start

```bash
# Clear cache
rm -rf node_modules/.cache

# Reinstall
npm ci

# Retry
npm run storybook
```

### Build Fails

```bash
# Check Node version (requires 16+)
node --version

# Clean build
npm run build-storybook -- --loglevel debug
```

### Components Not Rendering

1. Check imports in `moduleMetadata`
2. Verify Angular modules loaded
3. Check browser console for errors
4. Clear Storybook cache: `rm -rf node_modules/.cache`

### Dark Mode Not Working

1. Ensure `.dark-theme` class toggled
2. Check CSS custom properties defined
3. Verify background toolbar setting
4. Test with manual class toggle

## 📧 Support

For questions or issues:
- Review existing stories and documentation
- Check accessibility checklist
- Consult Angular Material docs
- Open issue in project repository

## 📄 License

Part of the Atlas Immobilier project.

---

**Last Updated**: 2024
**Maintained By**: Atlas Immobilier Development Team
**Version**: 1.0.0
