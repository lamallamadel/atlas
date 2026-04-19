# Responsive Utilities Guide

This guide demonstrates how to use the responsive utility classes and mixins in the application.

## Breakpoints

The application uses a mobile-first approach with three main breakpoints:

- **Mobile**: 375px (default, no media query needed)
- **Tablet**: 768px and above
- **Desktop**: 1440px and above

## SCSS Mixins

Import the utilities in your component SCSS:

```scss
@import '../../../styles/utilities.scss';

.my-component {
  padding: var(--spacing-4);
  
  @include tablet {
    padding: var(--spacing-6);
  }
  
  @include desktop {
    padding: var(--spacing-8);
  }
}
```

### Available Mixins

- `@mixin mobile` - No media query (mobile-first default)
- `@mixin tablet` - Min-width: 768px
- `@mixin desktop` - Min-width: 1440px
- `@mixin mobile-only` - Max-width: 767px
- `@mixin tablet-only` - Between 768px and 1439px
- `@mixin breakpoint($size)` - Custom breakpoint

## Utility Classes

### Flex Layout

```html
<!-- Basic flex container -->
<div class="flex items-center justify-between gap-4">
  <span>Left</span>
  <span>Right</span>
</div>

<!-- Responsive flex direction -->
<div class="flex flex-col tablet:flex-row gap-4">
  <!-- Stacks on mobile, horizontal on tablet+ -->
</div>

<!-- Common flex patterns -->
<div class="flex flex-col gap-4">...</div>
<div class="flex items-center gap-2">...</div>
<div class="flex justify-center">...</div>
<div class="flex flex-wrap gap-3">...</div>
```

### Grid Layout

```html
<!-- Responsive grid -->
<div class="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>

<!-- Auto-fit columns -->
<div class="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-6">
  <!-- Cards that adapt to screen size -->
</div>
```

### Spacing

```html
<!-- Margin utilities -->
<div class="m-4 mt-8 mb-6">...</div>
<div class="mx-auto my-4">...</div>

<!-- Padding utilities -->
<div class="p-4 tablet:p-6 desktop:p-8">...</div>
<div class="px-4 py-6">...</div>

<!-- Gap utilities -->
<div class="flex gap-4 tablet:gap-6 desktop:gap-8">...</div>
```

### Text Utilities

```html
<!-- Text alignment -->
<p class="text-center tablet:text-left">Centered on mobile, left on tablet+</p>

<!-- Font size -->
<h1 class="text-2xl tablet:text-3xl desktop:text-4xl">Responsive heading</h1>

<!-- Font weight -->
<span class="font-normal tablet:font-semibold">Responsive weight</span>

<!-- Text truncation -->
<p class="truncate">This text will be truncated with ellipsis...</p>

<!-- Word break -->
<p class="break-words">LongURLorTextWithoutSpacesWillBreakNaturally</p>
```

### Visibility

```html
<!-- Show/hide based on viewport -->
<div class="show-mobile">Mobile only</div>
<div class="hide-mobile">Hidden on mobile</div>
<div class="show-tablet-up">Tablet and desktop</div>
<div class="show-desktop">Desktop only</div>

<!-- Responsive display -->
<div class="hidden tablet:block">Hidden on mobile, visible on tablet+</div>
<div class="block tablet:hidden">Visible on mobile, hidden on tablet+</div>
```

### Width & Height

```html
<!-- Responsive widths -->
<div class="w-full tablet:w-1/2 desktop:w-1/3">
  Responsive width container
</div>

<!-- Fixed dimensions -->
<div class="w-full max-w-screen">
  Full width with max constraint
</div>

<!-- Height utilities -->
<div class="h-screen tablet:h-auto">
  Full height on mobile, auto on tablet+
</div>
```

### Container

```html
<!-- Responsive container with auto margins and padding -->
<div class="container">
  <!-- Max-width adapts to breakpoints -->
  <h1>Page Title</h1>
  <p>Content goes here</p>
</div>

<!-- Full-width container with responsive padding -->
<div class="container-fluid">
  <!-- No max-width constraint -->
</div>
```

## Complete Example Component

```html
<!-- Responsive Page Layout -->
<div class="container">
  <!-- Page Header -->
  <div class="flex flex-col tablet:flex-row items-start tablet:items-center justify-between gap-4 mb-6">
    <h1 class="text-2xl tablet:text-3xl desktop:text-4xl font-bold">
      Page Title
    </h1>
    <button class="w-full tablet:w-auto">
      Action Button
    </button>
  </div>

  <!-- Content Grid -->
  <div class="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4 tablet:gap-6">
    <!-- Card 1 -->
    <div class="p-4 tablet:p-6 rounded-lg shadow">
      <h3 class="text-lg font-semibold mb-2">Card Title</h3>
      <p class="text-sm text-neutral-600">Card content goes here</p>
    </div>
    
    <!-- More cards... -->
  </div>

  <!-- Mobile Actions -->
  <div class="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg tablet:hidden">
    <button class="w-full">Mobile Action</button>
  </div>
</div>
```

## Component SCSS Example

```scss
@import '../../../styles/utilities.scss';

.page-header {
  padding: var(--spacing-4);
  
  @include tablet {
    padding: var(--spacing-6);
  }
  
  @include desktop {
    padding: var(--spacing-8);
  }
}

.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  
  @include tablet {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--spacing-6);
  }
  
  @include desktop {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.card {
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-base);
  
  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  
  @include mobile-only {
    padding: var(--spacing-3);
  }
  
  @include desktop {
    padding: var(--spacing-6);
  }
}

// Responsive font sizes
.title {
  font-size: var(--font-size-xl);
  
  @include tablet {
    font-size: var(--font-size-2xl);
  }
  
  @include desktop {
    font-size: var(--font-size-3xl);
  }
}

// Mobile-specific styles
@include mobile-only {
  .mobile-menu {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-neutral-0);
    box-shadow: var(--shadow-lg);
  }
}

// Tablet-only styles
@include tablet-only {
  .sidebar {
    width: 240px;
  }
}
```

## Best Practices

### 1. Mobile-First Approach

Always start with mobile styles and progressively enhance:

```scss
.component {
  // Mobile styles (default)
  padding: var(--spacing-4);
  font-size: var(--font-size-sm);
  
  // Tablet and up
  @include tablet {
    padding: var(--spacing-6);
    font-size: var(--font-size-base);
  }
  
  // Desktop and up
  @include desktop {
    padding: var(--spacing-8);
    font-size: var(--font-size-lg);
  }
}
```

### 2. Use Design Tokens

Always use CSS custom properties from variables.scss:

```scss
// Good
padding: var(--spacing-4);
color: var(--color-primary-500);
border-radius: var(--radius-lg);

// Avoid
padding: 16px;
color: #2c5aa0;
border-radius: 8px;
```

### 3. Responsive Typography

```html
<h1 class="text-2xl tablet:text-3xl desktop:text-4xl font-bold">
  Responsive Heading
</h1>

<p class="text-sm tablet:text-base">
  Responsive body text
</p>
```

### 4. Responsive Images

```html
<!-- Responsive image container -->
<div class="w-full aspect-video">
  <img src="..." alt="..." class="w-full h-full object-cover rounded-lg">
</div>

<!-- Adaptive image sizes -->
<div class="w-full tablet:w-1/2 desktop:w-1/3">
  <img src="..." alt="..." class="w-full h-auto">
</div>
```

### 5. Touch-Friendly Targets

Ensure interactive elements are at least 44x44px on mobile:

```scss
.button {
  min-height: 44px;
  min-width: 44px;
  padding: var(--spacing-3) var(--spacing-4);
  
  @include tablet {
    min-height: 36px;
    padding: var(--spacing-2) var(--spacing-4);
  }
}
```

### 6. Reduce Motion

Respect user preferences:

```scss
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    transition: none;
  }
}
```

## Testing Checklist

Test your responsive layouts at these breakpoints:

- ✅ Mobile: 375px (iPhone SE/X)
- ✅ Tablet: 768px (iPad portrait)
- ✅ Desktop: 1440px (Standard laptop)

Additional test points:
- 320px (very small phones)
- 1024px (iPad landscape)
- 1920px (Full HD desktop)

## Common Patterns

### Responsive Navigation

```html
<!-- Mobile: hamburger menu, Desktop: horizontal nav -->
<nav class="flex items-center justify-between p-4">
  <div class="font-bold">Logo</div>
  
  <!-- Mobile menu button -->
  <button class="tablet:hidden">
    <mat-icon>menu</mat-icon>
  </button>
  
  <!-- Desktop nav links -->
  <div class="hidden tablet:flex gap-6">
    <a href="#">Link 1</a>
    <a href="#">Link 2</a>
    <a href="#">Link 3</a>
  </div>
</nav>
```

### Responsive Card Grid

```html
<div class="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4 tablet:gap-6">
  <mat-card class="p-4">
    <h3 class="text-lg font-semibold mb-2">Card 1</h3>
    <p class="text-sm">Content</p>
  </mat-card>
  <!-- More cards... -->
</div>
```

### Responsive Form Layout

```html
<form class="flex flex-col gap-4">
  <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
    <mat-form-field class="w-full">
      <mat-label>First Name</mat-label>
      <input matInput>
    </mat-form-field>
    
    <mat-form-field class="w-full">
      <mat-label>Last Name</mat-label>
      <input matInput>
    </mat-form-field>
  </div>
  
  <mat-form-field class="w-full">
    <mat-label>Email</mat-label>
    <input matInput type="email">
  </mat-form-field>
  
  <div class="flex flex-col tablet:flex-row gap-2 justify-end">
    <button mat-button type="button" class="w-full tablet:w-auto">Cancel</button>
    <button mat-raised-button color="primary" class="w-full tablet:w-auto">Submit</button>
  </div>
</form>
```

## Browser Support

These utilities use modern CSS features and are supported in:

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

For older browsers, consider polyfills or fallbacks.
