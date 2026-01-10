# Accessibility Features

This document outlines the comprehensive accessibility features implemented in the Atlas Immobilier application.

## Overview

The application follows WCAG 2.1 Level AA standards and implements modern accessibility best practices to ensure the application is usable by everyone, including people with disabilities.

## Key Accessibility Features

### 1. Keyboard Navigation

- **Full keyboard support**: All interactive elements are keyboard accessible using Tab, Enter, Space, and Arrow keys
- **Visible focus indicators**: 2px solid outline (#1976d2) with 2px offset on all focusable elements
- **Skip-to-content link**: Allows keyboard users to skip navigation and jump directly to main content
- **Logical tab order**: Focus moves in a predictable order through the page

### 2. ARIA Labels and Roles

All interactive elements have appropriate ARIA labels:

- **Buttons**: Descriptive `aria-label` attributes (e.g., "Créer une nouvelle annonce")
- **Links**: Clear labels indicating destination (e.g., "Accéder au tableau de bord")
- **Form inputs**: Properly associated with `<label>` elements using `id` and `for` attributes
- **Icons**: Marked with `aria-hidden="true"` when decorative
- **Dynamic regions**: `aria-live` regions for screen reader announcements

### 3. Semantic HTML and Heading Hierarchy

- **Proper heading structure**: H1 for page titles, H2 for sections, H3 for subsections
- **Semantic elements**: `<header>`, `<main>`, `<nav>`, `<section>`, `<article>` used appropriately
- **Lists**: Proper `<ul>`, `<ol>`, and `role="list"` where needed

### 4. Screen Reader Support

#### AriaLiveAnnouncer Service

Location: `frontend/src/app/services/aria-live-announcer.service.ts`

A custom service that provides screen reader announcements for dynamic content changes:

```typescript
// Usage example
this.ariaAnnouncer.announcePolite('5 annonces actives chargées');
this.ariaAnnouncer.announceAssertive('Erreur lors du chargement');
```

**Methods:**
- `announcePolite(message: string)`: For non-critical updates
- `announceAssertive(message: string)`: For important/urgent updates
- `announce(message: string, mode: 'polite' | 'assertive', clearDelay: number)`: Full control
- `clear(mode?: AnnounceMode)`: Clear announcement regions

**Integrated in:**
- Dashboard component: Announces KPI loads and API status
- Form submissions: Success/error messages
- Data loading: Announces when content is loaded
- Pagination: Announces page changes

### 5. Form Accessibility

All forms include:

- **Associated labels**: Every input has a `<label>` with matching `id` and `for`
- **Required field indicators**: Visual `*` with `aria-label="obligatoire"`
- **Error messages**: `role="alert"` with descriptive error text
- **aria-invalid**: Set to `true` on invalid fields
- **aria-describedby**: Links fields to help text and errors
- **Fieldsets and legends**: Group related fields logically

### 6. Color and Contrast

- **Sufficient contrast ratios**: All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- **Not relying on color alone**: Status indicators use icons + text + color
- **Focus indicators**: High contrast 2px solid outline

### 7. Loading States and Feedback

- **Loading skeletons**: `role="status"` with `aria-live="polite"`
- **Screen reader announcements**: Hidden text "Chargement des données en cours..."
- **Progress indicators**: Spinners marked with `aria-hidden="true"` with text alternatives

### 8. Error Handling

All errors include:
- `role="alert"` for immediate attention
- `aria-live="assertive"` for critical errors
- Clear, descriptive error messages
- Visual icons + text (not color alone)

### 9. Responsive Design

- **Mobile-friendly**: Touch targets minimum 44x44px
- **Text scaling**: Supports browser zoom up to 200%
- **Flexible layouts**: Content reflows without horizontal scrolling

### 10. Motion Preferences

Respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Component-Specific Accessibility

### Navigation (app-layout)

- Skip-to-content link
- Proper `<nav>` element with `aria-label="Navigation principale"`
- Menu toggle button with `aria-expanded` state
- All links have descriptive labels

### Tables (generic-table)

- Proper `<table>` semantics with `role="table"`
- Column headers with `role="columnheader"`
- Sortable columns with `aria-sort` attribute
- Row selection checkboxes with descriptive labels
- Keyboard navigation for rows (Enter/Space to activate)

### Dialogs

- `role="dialog"` or `role="alertdialog"` for confirmations
- `aria-modal="true"` to indicate modal behavior
- `aria-labelledby` pointing to dialog title
- Focus trapped within dialog when open
- Escape key to close

### Search

- `role="search"` on search containers
- `aria-autocomplete="list"` on search inputs
- `aria-expanded` indicates dropdown state
- `aria-controls` links input to results
- Search results with `role="listbox"` and `role="option"`

### Pagination

- `<nav>` element with `aria-label="Pagination"`
- Current page with `aria-current="page"`
- Disabled states with `aria-disabled="true"`
- Page info with `role="status"` and `aria-live="polite"`

## Testing Accessibility

### Manual Testing

1. **Keyboard navigation**: Navigate entire app using only keyboard
2. **Screen reader**: Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
3. **Browser zoom**: Test at 200% zoom
4. **Color contrast**: Verify with browser DevTools

### Automated Testing Tools

- **axe DevTools**: Browser extension for automated scanning
- **Lighthouse**: Run accessibility audit in Chrome DevTools
- **WAVE**: Web accessibility evaluation tool

### Key Areas to Test

- [ ] All forms can be completed with keyboard only
- [ ] All buttons and links have descriptive labels
- [ ] Error messages are announced by screen readers
- [ ] Loading states are announced
- [ ] Modal dialogs trap focus correctly
- [ ] Skip-to-content link works
- [ ] Heading hierarchy is logical

## Browser Support

Accessibility features tested in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Improvements

- [ ] Add high contrast theme option
- [ ] Implement custom keyboard shortcuts
- [ ] Add voice control support
- [ ] Enhance screen reader-only content
- [ ] Add live region for table sorting

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

## Contact

For accessibility issues or suggestions, please contact the development team or file an issue in the project repository.
