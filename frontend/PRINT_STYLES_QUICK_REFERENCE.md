# Print Styles Quick Reference

## Quick Test Guide

### Test Print Preview (5 minutes)

1. **Start the application**
   ```bash
   cd frontend
   npm start
   ```

2. **Navigate to test pages**
   - Annonce detail: `http://localhost:4200/annonces/[id]`
   - Dossier detail: `http://localhost:4200/dossiers/[id]`

3. **Open print preview**
   - Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)

4. **Verify checklist**
   - [ ] Navigation sidebar is hidden
   - [ ] Top toolbar is hidden
   - [ ] All buttons are hidden
   - [ ] Form inputs are hidden
   - [ ] Content fills the page width
   - [ ] Tables have visible borders
   - [ ] Table headers appear on each page
   - [ ] Badges are readable (with "STATUS:" prefix)
   - [ ] External links show URLs
   - [ ] No broken page breaks in cards/tables
   - [ ] All tabs content is visible (sequentially)
   - [ ] Expansion panels are expanded

## File Structure

```
frontend/
├── src/
│   ├── styles/
│   │   ├── print.scss          ← Main print styles
│   │   ├── variables.scss      ← Design tokens
│   │   └── ...
│   └── ...
├── angular.json                 ← Build config (includes print.scss)
├── PRINT_STYLES_README.md       ← Full documentation
└── PRINT_STYLES_QUICK_REFERENCE.md  ← This file
```

## Key CSS Classes for Print

### Hidden Elements
```scss
@media print {
  button,
  nav,
  mat-sidenav,
  mat-toolbar,
  select,
  input { display: none !important; }
}
```

### Tables
```scss
table {
  page-break-inside: auto;
  border-collapse: collapse;
}
tr { page-break-inside: avoid; }
thead { display: table-header-group; }
```

### Badges (Monochrome-friendly)
```scss
.status-badge {
  border: 1pt solid black;
  background: white;
  color: black;
}
.status-badge:before {
  content: "STATUS: ";
}
```

### Links
```scss
a[href]:after {
  content: " (" attr(href) ")";
}
a[href^="/"]:after {
  content: ""; /* Hide internal links */
}
```

## Common Print Issues & Fixes

| Issue | Fix |
|-------|-----|
| Buttons still visible | Add button selector to hidden elements in print.scss |
| Table breaks mid-row | Add `page-break-inside: avoid` to `tr` |
| Headers don't repeat | Ensure `thead { display: table-header-group; }` |
| Badge colors invisible | Use borders and prefixes (already implemented) |
| URLs showing for internal links | Add `a[href^="/"]:after { content: ""; }` |
| Content cut off | Check `@page { margin: ... }` settings |

## Print Workflow Commands

```bash
# Development with print styles
npm start

# Build with print styles included
npm run build

# Print styles are automatically included via angular.json
```

## Testing Matrix

| Page | Chrome | Firefox | Edge | Safari |
|------|--------|---------|------|--------|
| Annonce Detail | ✓ | ✓ | ✓ | ✓ |
| Dossier Detail | ✓ | ✓ | ✓ | ✓ |

## Print Media Query Structure

```scss
@media print {
  /* Hide navigation & interactive */
  nav, button { ... }
  
  /* Layout adjustments */
  .page-container { ... }
  
  /* Table formatting */
  table { ... }
  
  /* Badge styling */
  .status-badge { ... }
  
  /* Links */
  a[href]:after { ... }
}

@media print and (color) {
  /* Optional color printer styles */
  .status-badge { background: #f0f0f0; }
}
```

## Integration Points

### Angular Configuration
- **File**: `frontend/angular.json`
- **Section**: `projects.frontend.architect.build.options.styles`
- **Entry**: `"src/styles/print.scss"`

### Component Styles
Print styles override component styles using `!important` for print media.

### Material Design
Print styles hide Material components:
- `mat-sidenav`
- `mat-toolbar`
- `mat-dialog-container`
- `mat-paginator`
- `mat-tab-header`

## Debug Tips

1. **Check if print.scss is loaded**
   - Open browser DevTools
   - Go to Sources tab
   - Look for `print.scss` in the file list

2. **Inspect print media query**
   - Open DevTools
   - Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
   - Type "Rendering"
   - Enable "Emulate CSS media type: print"

3. **View computed styles**
   - Right-click element
   - Inspect
   - Check "Computed" tab
   - Verify print styles are applied

## Quick Customization

### Change page margins
```scss
@page {
  margin: 2cm 1.5cm; /* top/bottom left/right */
}
```

### Adjust font size
```scss
body {
  font-size: 12pt; /* 10pt-14pt recommended */
}
```

### Add print-only content
```scss
.element:after {
  content: "Printed version";
  display: block;
}
```

### Hide specific elements
```scss
@media print {
  .my-element {
    display: none !important;
  }
}
```

## Resources

- **Full Documentation**: `PRINT_STYLES_README.md`
- **MDN Print Styles**: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/print
- **CSS Paged Media**: https://www.w3.org/TR/css-page-3/

## Support

For issues or questions about print styles:
1. Check `PRINT_STYLES_README.md` for detailed documentation
2. Review browser console for CSS errors
3. Test in multiple browsers
4. Verify `print.scss` is in `angular.json`
