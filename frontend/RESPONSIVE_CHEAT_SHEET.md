# Responsive Utilities Cheat Sheet

Quick reference for responsive utilities and mixins.

## Breakpoints

```
Mobile:  375px  (default)
Tablet:  768px  (min-width)
Desktop: 1440px (min-width)
```

## SCSS Mixins

```scss
@import '../../../styles/utilities.scss';

.component {
  // Mobile (default)
  padding: var(--spacing-4);
  
  @include tablet {
    // 768px+
    padding: var(--spacing-6);
  }
  
  @include desktop {
    // 1440px+
    padding: var(--spacing-8);
  }
  
  @include mobile-only {
    // max-width: 767px
  }
  
  @include tablet-only {
    // 768px - 1439px
  }
}
```

## Layout

### Flexbox
```html
<div class="flex flex-col tablet:flex-row gap-4">
<div class="flex items-center justify-between">
<div class="flex flex-wrap gap-3">
```

### Grid
```html
<div class="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4 gap-4">
<div class="grid grid-cols-2 tablet:grid-cols-3 gap-6">
```

### Container
```html
<div class="container">
  <!-- max-width adapts to breakpoints -->
</div>
```

## Spacing

### Margin
```html
<div class="m-4 mt-6 mb-8">
<div class="mx-auto my-4">
<div class="ml-2 mr-4">
```

### Padding
```html
<div class="p-4 tablet:p-6 desktop:p-8">
<div class="px-4 py-6">
<div class="pt-4 pb-6">
```

### Gap
```html
<div class="flex gap-4 tablet:gap-6">
<div class="grid gap-3 desktop:gap-8">
```

## Typography

### Size
```html
<h1 class="text-2xl tablet:text-3xl desktop:text-4xl">
<p class="text-sm tablet:text-base">
```

### Weight
```html
<span class="font-normal tablet:font-semibold">
<span class="font-bold">
```

### Alignment
```html
<p class="text-center tablet:text-left">
<p class="text-right">
```

### Utilities
```html
<p class="truncate">
<p class="break-words">
<p class="whitespace-nowrap">
```

## Visibility

```html
<!-- Show/Hide -->
<div class="show-mobile">Mobile only</div>
<div class="hide-mobile">Hidden on mobile</div>
<div class="show-tablet-up">Tablet+</div>
<div class="show-desktop">Desktop only</div>

<!-- Responsive Display -->
<div class="hidden tablet:block">
<div class="block tablet:hidden">
```

## Sizing

### Width
```html
<div class="w-full tablet:w-1/2 desktop:w-1/3">
<div class="w-auto">
<div class="w-screen">
```

### Height
```html
<div class="h-full">
<div class="h-screen">
<div class="h-auto">
```

## Common Patterns

### Responsive Card Grid
```html
<div class="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4 tablet:gap-6">
  <mat-card class="p-4 tablet:p-6">...</mat-card>
</div>
```

### Responsive Form
```html
<form class="flex flex-col gap-4">
  <div class="grid grid-cols-1 tablet:grid-cols-2 gap-4">
    <mat-form-field>...</mat-form-field>
    <mat-form-field>...</mat-form-field>
  </div>
  <div class="flex flex-col tablet:flex-row gap-2 justify-end">
    <button class="w-full tablet:w-auto">Cancel</button>
    <button class="w-full tablet:w-auto">Submit</button>
  </div>
</form>
```

### Responsive Header
```html
<div class="flex flex-col tablet:flex-row items-start tablet:items-center justify-between gap-4 mb-6">
  <h1 class="text-2xl tablet:text-3xl font-bold">Title</h1>
  <button class="w-full tablet:w-auto">Action</button>
</div>
```

### Responsive Navigation
```html
<nav class="flex items-center justify-between p-4">
  <div class="font-bold">Logo</div>
  <button class="tablet:hidden">Menu</button>
  <div class="hidden tablet:flex gap-6">
    <a href="#">Link 1</a>
    <a href="#">Link 2</a>
  </div>
</nav>
```

## Design Tokens (Most Used)

### Spacing
```scss
--spacing-1: 0.25rem;   // 4px
--spacing-2: 0.5rem;    // 8px
--spacing-3: 0.75rem;   // 12px
--spacing-4: 1rem;      // 16px
--spacing-6: 1.5rem;    // 24px
--spacing-8: 2rem;      // 32px
--spacing-12: 3rem;     // 48px
--spacing-16: 4rem;     // 64px
```

### Font Sizes
```scss
--font-size-xs: 0.75rem;   // 12px
--font-size-sm: 0.875rem;  // 14px
--font-size-base: 1rem;    // 16px
--font-size-lg: 1.125rem;  // 18px
--font-size-xl: 1.25rem;   // 20px
--font-size-2xl: 1.5rem;   // 24px
--font-size-3xl: 1.875rem; // 30px
--font-size-4xl: 2.25rem;  // 36px
```

### Colors
```scss
--color-primary-500: #2c5aa0;
--color-neutral-0: #ffffff;
--color-neutral-700: #616161;
--color-neutral-900: #212121;
--color-error-500: #e74c3c;
--color-success-500: #4caf50;
```

### Shadows
```scss
--shadow-sm: small shadow
--shadow-md: medium shadow
--shadow-lg: large shadow
--shadow-xl: extra large shadow
```

### Border Radius
```scss
--radius-sm: 0.125rem;  // 2px
--radius-md: 0.375rem;  // 6px
--radius-lg: 0.5rem;    // 8px
--radius-xl: 0.75rem;   // 12px
--radius-full: 9999px;  // pill/circle
```

## Responsive Class Modifiers

Add breakpoint prefix to any utility:

```html
<!-- Padding -->
<div class="p-4 tablet:p-6 desktop:p-8">

<!-- Display -->
<div class="block tablet:flex desktop:grid">

<!-- Width -->
<div class="w-full tablet:w-1/2 desktop:w-1/3">

<!-- Text Alignment -->
<p class="text-center tablet:text-left">

<!-- Grid Columns -->
<div class="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-4">
```

## SCSS Example Template

```scss
@import '../../../styles/utilities.scss';

.my-component {
  // Base mobile styles
  padding: var(--spacing-4);
  background: var(--color-neutral-0);
  border-radius: var(--radius-lg);
  
  // Tablet styles
  @include tablet {
    padding: var(--spacing-6);
    display: flex;
    gap: var(--spacing-6);
  }
  
  // Desktop styles
  @include desktop {
    padding: var(--spacing-8);
    max-width: 1200px;
    margin: 0 auto;
  }
}

.card-grid {
  display: grid;
  gap: var(--spacing-4);
  grid-template-columns: 1fr;
  
  @include tablet {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-6);
  }
  
  @include desktop {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Quick Testing

Test at these widths:
- **375px** - iPhone (mobile)
- **768px** - iPad portrait (tablet)
- **1440px** - Laptop (desktop)

## Tips

✅ Start with mobile styles (no media query)  
✅ Use design tokens (var(--spacing-4))  
✅ Test at all 3 breakpoints  
✅ Min 44x44px touch targets on mobile  
✅ Use semantic HTML  

❌ Don't use max-width first  
❌ Don't hardcode pixel values  
❌ Don't forget to test mobile  

## Quick Links

- Full Guide: `frontend/RESPONSIVE_UTILITIES_GUIDE.md`
- Examples: `frontend/RESPONSIVE_MIXINS_EXAMPLES.md`
- Implementation: `RESPONSIVE_IMPLEMENTATION_SUMMARY.md`
