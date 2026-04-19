# Print Styles Documentation

## Overview

The application includes comprehensive print-optimized styles in `src/styles/print.scss` that provide professional, print-friendly layouts for annonce detail and dossier detail pages.

## Features

### 1. Hidden Navigation & Interactive Elements
- **Navigation**: All sidebars, toolbars, and navigation menus are hidden
- **Buttons**: All interactive buttons (edit, delete, add, etc.) are hidden
- **Forms**: Form inputs, selects, and textareas are hidden
- **Dialogs**: Modals, overlays, and dialogs are hidden
- **UI Components**: Tab navigation headers, paginators, and loading skeletons are hidden

### 2. Optimized Page Layout
- **Full width**: Content expands to use full page width
- **Proper margins**: 2cm top/bottom, 1.5cm left/right margins on A4 paper
- **Clean header**: Page titles are clearly displayed without navigation clutter

### 3. Table Formatting for Page Breaks
- **Page break control**: Tables avoid breaking in the middle of rows
- **Header repetition**: Table headers repeat on each printed page
- **Proper borders**: Clean 1pt borders around cells
- **Readable sizing**: Font size adjusted to 10pt for optimal readability

### 4. Full URLs for Links
- External links show their full URL in parentheses after the link text
- Internal routing links (starting with `/`) don't show URLs to reduce clutter
- Anchor links and JavaScript links are excluded

### 5. Monochrome-Friendly Badge Colors
- **Border styles**: Different border styles (solid, dashed, double) distinguish statuses
- **Text decoration**: Strike-through for cancelled/revoked items
- **Prefix labels**: Badges include text prefixes (e.g., "STATUS:", "CH:", "DIR:")
- **Background shading**: Subtle grayscale backgrounds for differentiation

### 6. Page Break Optimization
- **Avoid breaking**: Cards, sections, and important content blocks stay together
- **Headers with content**: Headings stay with their following content
- **Table rows**: Individual table rows don't break across pages

### 7. Additional Features
- **Print-only section headers**: Tab content displays with clear section titles
- **Expansion panels**: All collapsed panels expand automatically for print
- **Timestamp formatting**: Date/time displays in readable format
- **Color printing support**: Optional color styles when printing to color printers

## Testing Print Preview

### Chrome/Edge
1. Navigate to annonce detail or dossier detail page
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
3. In print preview, verify:
   - Navigation and buttons are hidden
   - Content is properly formatted
   - Tables have borders and headers
   - Badges are readable in monochrome
   - Links show URLs (for external links)
   - Page breaks are appropriate

### Firefox
1. Navigate to annonce detail or dossier detail page
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (Mac)
3. Firefox shows a more accurate print preview
4. Verify the same elements as above

### Print Settings Recommendations
- **Paper size**: A4 (default in Europe) or Letter (US)
- **Orientation**: Portrait
- **Margins**: Default or Custom (2cm top/bottom, 1.5cm sides)
- **Background graphics**: Optional (minimal impact)
- **Headers/Footers**: Browser default or disabled

## Print-Specific Test Cases

### Annonce Detail Page
Test printing an annonce with:
- ✓ Long description text (verify wrapping)
- ✓ Multiple detail fields (verify layout)
- ✓ Status badge (verify monochrome readability)

### Dossier Detail Page
Test printing a dossier with:
- ✓ Multiple tabs (verify all content prints)
- ✓ Parties prenantes table (verify headers repeat)
- ✓ Messages timeline (verify readable layout)
- ✓ Appointments table (verify page breaks)
- ✓ Consentements cards (verify stay together)
- ✓ Audit history table (verify long tables paginate correctly)

## Customization

### Adjusting Margins
Edit the `@page` rule in `print.scss`:
```scss
@page {
  margin: 2cm 1.5cm; /* Top/Bottom Left/Right */
}
```

### Changing Font Sizes
Global print font size is set in the body rule:
```scss
body {
  font-size: 12pt; /* Adjust as needed */
}
```

### Table Font Sizes
```scss
table, .data-table {
  font-size: 10pt; /* Adjust for readability */
}
```

### Adding Print-Specific Content
Use CSS pseudo-elements with `content`:
```scss
.my-element:before {
  content: "Printed on: [date]";
}
```

## Browser Support

Print styles are supported in:
- ✓ Chrome 90+
- ✓ Firefox 88+
- ✓ Edge 90+
- ✓ Safari 14+

## Known Limitations

1. **@page rules**: Header/footer content in `@page` rules (e.g., page numbers) may not work in all browsers
2. **Color printing**: Color styles in `@media print and (color)` only apply to color printers
3. **Tab content**: All tabs print sequentially; cannot select individual tabs
4. **Expansion panels**: All panels expand; cannot selectively print collapsed panels

## Troubleshooting

### Issue: Navigation still visible in print
**Solution**: Clear browser cache and reload the page

### Issue: Tables breaking mid-row
**Solution**: Check if table has many columns; consider reducing column count or using landscape orientation

### Issue: Badges not readable in monochrome
**Solution**: Ensure `print.scss` is properly loaded in `angular.json`

### Issue: Blank pages between sections
**Solution**: This is normal browser behavior for page breaks; can be minimized by adjusting `page-break-before` rules

### Issue: Print preview looks different from actual print
**Solution**: Different browsers render print differently; test with actual print to PDF for accuracy

## Print to PDF Workflow

For best results when creating PDFs:
1. Use Chrome or Edge browser
2. Navigate to the detail page
3. Press `Ctrl+P` or `Cmd+P`
4. Choose "Save as PDF" as destination
5. Set orientation to Portrait
6. Set margins to Default
7. Enable "Background graphics" if you want subtle shading
8. Click "Save"

The resulting PDF will have:
- Professional layout
- Proper page breaks
- Readable badges and status indicators
- All data tables with headers
- No interactive elements
- Full URLs for external links

## Maintenance

When adding new components or pages that should be printable:
1. Add new component selectors to appropriate sections in `print.scss`
2. Test print preview to ensure proper layout
3. Add specific print styles if default styles don't work well
4. Update this README with any new print features or test cases
