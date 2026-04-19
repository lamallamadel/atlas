# WCAG AA Dashboard Accessibility Checklist

## Quick Reference for Developers

### Color Contrast Requirements ✓

**Minimum Contrast Ratios:**
- Normal text (< 18px): 4.5:1
- Large text (≥ 18px): 3:1
- UI components: 3:1

**Approved Colors on White Background:**
```scss
// Body text & labels
--color-neutral-700: #616161;  // 5.74:1 ✓
--color-neutral-800: #424242;  // 8.59:1 ✓
--color-neutral-900: #212121;  // 16.1:1 ✓

// Success messages
--color-success-700: #388e3c;  // 4.64:1 ✓
--color-success-800: #2e7d32;  // 6.38:1 ✓

// Error messages
--color-error-700: #c0392b;    // 4.76:1 ✓
--color-error-800: #a93226;    // 6.19:1 ✓
```

### Focus Indicators ✓

**All interactive elements must have:**
```scss
element:focus-visible {
  outline: 2px solid var(--color-primary-500) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 4px rgba(44, 90, 160, 0.2) !important;
}
```

**Do NOT use:**
- `outline: none` without replacement
- Focus styles only on `:focus` (use `:focus-visible`)
- Insufficient contrast for focus indicators

### Touch Target Sizes ✓

**Minimum size: 40x40px**

```scss
// Apply to all interactive elements
button,
a,
[role="button"],
.clickable {
  min-width: 40px;
  min-height: 40px;
}
```

### Typography Scale ✓

**Dashboard Standard:**
```scss
// Page titles (h1)
font-size: var(--font-size-2xl);    // 24px
font-weight: var(--font-weight-semibold);  // 600

// Section titles (h2, h3)
font-size: var(--font-size-lg);     // 18px
font-weight: var(--font-weight-semibold);  // 600

// Field labels
font-size: var(--font-size-sm);     // 14px
font-weight: var(--font-weight-medium);    // 500

// Body text & values
font-size: var(--font-size-sm);     // 14px
font-weight: var(--font-weight-normal);    // 400
```

### Keyboard Navigation ✓

**Interactive cards must include:**
```html
<mat-card
  class="clickable"
  tabindex="0"
  role="button"
  (click)="onClick()"
  (keydown.enter)="onClick()"
  (keydown.space)="onClick()"
  [attr.aria-label]="'Descriptive label'"
  [attr.aria-disabled]="isDisabled ? 'true' : 'false'">
</mat-card>
```

**Key bindings:**
- `Tab` / `Shift+Tab`: Navigate between elements
- `Enter`: Activate buttons/links
- `Space`: Activate buttons/checkboxes
- `Escape`: Close dialogs/menus

### ARIA Labels ✓

**Required for interactive elements without visible text:**
```html
<!-- Icon buttons -->
<button mat-icon-button aria-label="Close dialog">
  <mat-icon>close</mat-icon>
</button>

<!-- Cards with complex content -->
<mat-card 
  role="button"
  [attr.aria-label]="'KPI: ' + title + ', Value: ' + value">
  <!-- Complex content -->
</mat-card>

<!-- Lists -->
<div class="list" role="list">
  <mat-card role="listitem">...</mat-card>
</div>
```

### Semantic HTML ✓

**Use proper heading hierarchy:**
```html
<h1 class="page-title">Dashboard</h1>
<section aria-labelledby="section-1">
  <h2 id="section-1">KPIs</h2>
  <h3>Active Listings</h3>
</section>
```

**Screen reader only content:**
```html
<h2 class="sr-only">Section title for screen readers</h2>
```

### Testing Checklist

#### Automated Testing
- [ ] Run Chrome Lighthouse (Accessibility score 90+)
- [ ] Run axe DevTools (0 violations)
- [ ] Check color contrast with browser tools

#### Manual Testing
- [ ] Navigate entire page with keyboard only
- [ ] Verify all focus indicators are visible
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Verify touch targets on mobile device
- [ ] Test in high contrast mode
- [ ] Test with 200% zoom

#### Code Review
- [ ] All interactive elements have focus indicators
- [ ] All colors meet contrast requirements
- [ ] All touch targets meet 40x40px minimum
- [ ] Typography follows standardized scale
- [ ] ARIA labels are descriptive
- [ ] Keyboard navigation works correctly

### Common Mistakes to Avoid

❌ **Don't:**
- Use low contrast colors (e.g., `color-neutral-500` on white)
- Remove focus outlines without replacement
- Create buttons smaller than 40x40px
- Use `role="button"` without keyboard handlers
- Skip heading levels (h1 → h3)
- Use color alone to convey information

✅ **Do:**
- Use CSS variables for consistent colors
- Test with keyboard and screen readers
- Provide descriptive ARIA labels
- Maintain logical tab order
- Include focus indicators on all interactive elements
- Follow the typography scale

### Resources

**Tools:**
- Chrome DevTools Lighthouse
- axe DevTools Browser Extension
- WAVE Browser Extension
- WebAIM Contrast Checker

**Documentation:**
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Material Design Accessibility](https://material.io/design/usability/accessibility.html)

**Testing:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessibility Insights](https://accessibilityinsights.io/)

### Quick Test Commands

```bash
# Run Lighthouse CLI (if installed)
lighthouse http://localhost:4200/dashboard --only-categories=accessibility

# Check specific element contrast
# Use browser DevTools → Elements → Accessibility pane
```

### Support

For accessibility questions or issues:
1. Check this checklist first
2. Review ACCESSIBILITY.md for detailed documentation
3. Test with automated tools
4. Consult WCAG 2.1 guidelines

---

**Last Updated:** 2024
**Compliance Level:** WCAG 2.1 Level AA ✓
