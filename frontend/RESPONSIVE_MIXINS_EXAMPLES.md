# Responsive Mixins Examples

This document provides practical examples of using responsive mixins in component SCSS files.

## Import Statement

Always import utilities at the top of your SCSS file:

```scss
@import '../../../styles/utilities.scss';
```

## Basic Responsive Patterns

### 1. Mobile-First Layout

```scss
.content {
  // Mobile styles (default - no media query needed)
  padding: var(--spacing-4);
  font-size: var(--font-size-sm);
  
  // Tablet and up (768px+)
  @include tablet {
    padding: var(--spacing-6);
    font-size: var(--font-size-base);
    display: flex;
    gap: var(--spacing-6);
  }
  
  // Desktop and up (1440px+)
  @include desktop {
    padding: var(--spacing-8);
    font-size: var(--font-size-lg);
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### 2. Responsive Grid

```scss
.card-grid {
  display: grid;
  gap: var(--spacing-4);
  
  // Mobile: 1 column (default)
  grid-template-columns: 1fr;
  
  // Tablet: 2 columns
  @include tablet {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-6);
  }
  
  // Desktop: 3 or 4 columns
  @include desktop {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-8);
  }
}
```

### 3. Flexible Container

```scss
.sidebar-layout {
  display: flex;
  
  // Mobile: stack vertically
  flex-direction: column;
  gap: var(--spacing-4);
  
  // Tablet+: side-by-side
  @include tablet {
    flex-direction: row;
    gap: var(--spacing-6);
  }
  
  .sidebar {
    // Mobile: full width
    width: 100%;
    
    // Tablet+: fixed width
    @include tablet {
      width: 240px;
      flex-shrink: 0;
    }
    
    // Desktop: wider
    @include desktop {
      width: 280px;
    }
  }
  
  .main-content {
    flex: 1;
    min-width: 0; // Prevent flex item overflow
  }
}
```

## Component-Specific Patterns

### 4. Responsive Card

```scss
.card {
  background: var(--color-neutral-0);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-base);
  
  // Mobile: smaller padding
  padding: var(--spacing-4);
  
  // Tablet: medium padding
  @include tablet {
    padding: var(--spacing-5);
  }
  
  // Desktop: larger padding
  @include desktop {
    padding: var(--spacing-6);
  }
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.card-header {
  margin-bottom: var(--spacing-4);
  
  @include tablet {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-6);
  }
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  
  @include tablet {
    font-size: var(--font-size-xl);
  }
  
  @include desktop {
    font-size: var(--font-size-2xl);
  }
}
```

### 5. Responsive Navigation

```scss
.navbar {
  padding: var(--spacing-4);
  background: var(--color-primary-500);
  
  @include tablet {
    padding: var(--spacing-4) var(--spacing-6);
  }
  
  @include desktop {
    padding: var(--spacing-4) var(--spacing-8);
  }
}

.nav-menu {
  // Mobile: hidden by default (hamburger menu)
  display: none;
  
  // Tablet+: horizontal flex
  @include tablet {
    display: flex;
    gap: var(--spacing-6);
    align-items: center;
  }
  
  // Mobile when open
  &.mobile-open {
    @include mobile-only {
      display: flex;
      flex-direction: column;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--color-neutral-0);
      padding: var(--spacing-4);
      box-shadow: var(--shadow-lg);
    }
  }
}

.hamburger-button {
  display: block;
  
  // Hide on tablet+
  @include tablet {
    display: none;
  }
}
```

### 6. Responsive Form

```scss
.form-container {
  padding: var(--spacing-4);
  
  @include tablet {
    padding: var(--spacing-6);
    max-width: 800px;
    margin: 0 auto;
  }
  
  @include desktop {
    max-width: 1000px;
  }
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
  
  @include tablet {
    flex-direction: row;
    gap: var(--spacing-6);
    
    > * {
      flex: 1;
    }
  }
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-top: var(--spacing-6);
  
  @include tablet {
    flex-direction: row;
    justify-content: flex-end;
    
    button {
      min-width: 120px;
    }
  }
}
```

### 7. Data Table with Mobile Cards

```scss
.data-table {
  // Desktop: show table
  display: table;
  width: 100%;
  
  // Mobile: hide table, show cards
  @include mobile-only {
    display: none;
  }
}

.mobile-card-list {
  // Desktop: hide cards
  display: none;
  
  // Mobile: show cards
  @include mobile-only {
    display: block;
  }
}

.mobile-card {
  background: var(--color-neutral-0);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-3);
  box-shadow: var(--shadow-sm);
  
  .card-row {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-2) 0;
    border-bottom: 1px solid var(--color-neutral-200);
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .label {
    font-weight: var(--font-weight-semibold);
    color: var(--color-neutral-600);
    font-size: var(--font-size-sm);
  }
  
  .value {
    color: var(--color-neutral-900);
    font-size: var(--font-size-sm);
  }
}
```

### 8. Modal/Dialog

```scss
.dialog-overlay {
  @include mobile-only {
    // Mobile: full screen
    padding: 0;
  }
  
  @include tablet {
    // Tablet+: centered with padding
    padding: var(--spacing-8);
  }
}

.dialog-container {
  background: var(--color-neutral-0);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2xl);
  
  // Mobile: full width
  width: 100%;
  height: 100%;
  border-radius: 0;
  
  @include tablet {
    width: auto;
    min-width: 500px;
    max-width: 90vw;
    height: auto;
    border-radius: var(--radius-lg);
  }
  
  @include desktop {
    min-width: 600px;
  }
}

.dialog-header {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-neutral-200);
  
  @include tablet {
    padding: var(--spacing-6);
  }
}

.dialog-body {
  padding: var(--spacing-4);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  
  @include tablet {
    padding: var(--spacing-6);
    max-height: 60vh;
  }
}
```

## Range-Based Mixins

### 9. Mobile-Only Styles

```scss
.mobile-menu {
  @include mobile-only {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-neutral-0);
    padding: var(--spacing-3);
    box-shadow: var(--shadow-lg);
    z-index: var(--z-index-fixed);
  }
}

.mobile-fab {
  @include mobile-only {
    position: fixed;
    bottom: var(--spacing-4);
    right: var(--spacing-4);
    z-index: var(--z-index-fixed);
  }
  
  // Hide on tablet+
  @include tablet {
    display: none;
  }
}
```

### 10. Tablet-Only Styles

```scss
.tablet-sidebar {
  @include tablet-only {
    width: 240px;
    flex-shrink: 0;
  }
  
  // Hide on mobile
  @include mobile-only {
    display: none;
  }
  
  // Wider on desktop
  @include desktop {
    width: 280px;
  }
}
```

## Advanced Patterns

### 11. Custom Breakpoint

```scss
.custom-layout {
  // Default mobile styles
  padding: var(--spacing-4);
  
  // Custom breakpoint at 900px
  @include breakpoint(900px) {
    padding: var(--spacing-6);
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
  
  // Another custom at 1600px
  @include breakpoint(1600px) {
    max-width: 1400px;
    margin: 0 auto;
  }
}
```

### 12. Responsive Typography Scale

```scss
.heading-primary {
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--spacing-4);
  
  // Mobile: 24px
  font-size: var(--font-size-2xl);
  
  // Tablet: 30px
  @include tablet {
    font-size: var(--font-size-3xl);
    margin-bottom: var(--spacing-6);
  }
  
  // Desktop: 36px
  @include desktop {
    font-size: var(--font-size-4xl);
  }
}

.heading-secondary {
  font-weight: var(--font-weight-semibold);
  
  font-size: var(--font-size-lg);
  
  @include tablet {
    font-size: var(--font-size-xl);
  }
  
  @include desktop {
    font-size: var(--font-size-2xl);
  }
}

.body-text {
  line-height: var(--line-height-relaxed);
  
  font-size: var(--font-size-sm);
  
  @include tablet {
    font-size: var(--font-size-base);
  }
}
```

### 13. Responsive Images

```scss
.hero-image-container {
  position: relative;
  width: 100%;
  
  // Mobile: 16:9 aspect ratio
  aspect-ratio: 16 / 9;
  
  // Tablet+: wider aspect
  @include tablet {
    aspect-ratio: 21 / 9;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--radius-lg);
  }
}

.thumbnail-grid {
  display: grid;
  gap: var(--spacing-2);
  
  // Mobile: 2 columns
  grid-template-columns: repeat(2, 1fr);
  
  // Tablet: 3 columns
  @include tablet {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-3);
  }
  
  // Desktop: 4 columns
  @include desktop {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-4);
  }
}
```

### 14. Responsive Spacing System

```scss
.section {
  // Mobile: 32px vertical padding
  padding-top: var(--spacing-8);
  padding-bottom: var(--spacing-8);
  
  // Tablet: 48px
  @include tablet {
    padding-top: var(--spacing-12);
    padding-bottom: var(--spacing-12);
  }
  
  // Desktop: 64px
  @include desktop {
    padding-top: var(--spacing-16);
    padding-bottom: var(--spacing-16);
  }
}

.container-spacing {
  // Mobile: 16px horizontal padding
  padding-left: var(--spacing-4);
  padding-right: var(--spacing-4);
  
  // Tablet: 24px
  @include tablet {
    padding-left: var(--spacing-6);
    padding-right: var(--spacing-6);
  }
  
  // Desktop: 32px
  @include desktop {
    padding-left: var(--spacing-8);
    padding-right: var(--spacing-8);
  }
}
```

## Performance Optimizations

### 15. Conditional Loading

```scss
.heavy-animation {
  // Only apply expensive animations on larger screens
  @include tablet {
    transition: all var(--duration-normal) ease-in-out;
    
    &:hover {
      transform: scale(1.05) rotate(2deg);
      box-shadow: var(--shadow-xl);
    }
  }
}

.background-decoration {
  // Hide decorative elements on mobile to save resources
  display: none;
  
  @include tablet {
    display: block;
  }
}
```

### 16. Responsive Prefers-Reduced-Motion

```scss
.animated-element {
  transition: var(--transition-base);
  animation: slideIn 0.5s ease-out;
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Best Practices Summary

1. **Always start with mobile styles** (no media query)
2. **Use design tokens** from `variables.scss`
3. **Keep breakpoints consistent** (375px, 768px, 1440px)
4. **Test at all breakpoints** including edge cases
5. **Consider touch targets** (min 44x44px on mobile)
6. **Optimize images** for different screen sizes
7. **Respect user preferences** (reduced motion, etc.)
8. **Use semantic HTML** for better accessibility
9. **Keep specificity low** for easier overrides
10. **Document complex responsive logic** in comments

## Common Mistakes to Avoid

❌ **Don't use max-width first**
```scss
// Bad
@media (max-width: 767px) {
  .element { ... }
}
```

✅ **Do use mobile-first**
```scss
// Good
.element {
  // Mobile styles
  @include tablet {
    // Tablet+ styles
  }
}
```

❌ **Don't hardcode values**
```scss
// Bad
padding: 16px;
font-size: 14px;
```

✅ **Do use design tokens**
```scss
// Good
padding: var(--spacing-4);
font-size: var(--font-size-sm);
```

❌ **Don't forget touch targets on mobile**
```scss
// Bad
button {
  padding: 4px 8px;
}
```

✅ **Do ensure minimum 44x44px**
```scss
// Good
button {
  min-width: 44px;
  min-height: 44px;
  padding: var(--spacing-3) var(--spacing-4);
}
```
