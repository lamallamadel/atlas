# Frontend Application

This Angular 16 application implements best practices for code splitting and lazy loading of third-party dependencies.

## Export Functionality with Lazy Loading

This application implements lazy loading for export dependencies (jsPDF and PapaParse) to reduce initial bundle size and improve performance.

### Configuration

The `angular.json` file includes `allowedCommonJsDependencies` to suppress CommonJS warnings for libraries that don't provide ES modules:

```json
{
  "allowedCommonJsDependencies": [
    "jspdf",
    "jspdf-autotable",
    "papaparse",
    "canvg",
    "raf",
    "rgbcolor"
  ]
}
```

### Lazy Loading Pattern

Export dependencies are loaded dynamically only when needed:

#### PDF Export Example

```typescript
async exportToPDF(): Promise<void> {
  // Load jsPDF and jspdf-autotable only when user triggers export
  const [jsPDFModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  
  const { jsPDF: JsPDFClass } = jsPDFModule;
  const doc = new JsPDFClass();
  
  // Generate PDF content...
  doc.save('report.pdf');
}
```

#### CSV Export Example

```typescript
async exportToCSV(): Promise<void> {
  // Load PapaParse only when user triggers export
  const Papa = await import('papaparse');
  
  const csv = Papa.unparse(data);
  
  // Download CSV file...
}
```

### Benefits

1. **Reduced Initial Bundle Size**: Export libraries (jsPDF ~500KB, PapaParse ~100KB) are not included in the main bundle
2. **Faster Initial Load**: Users who don't use export features don't pay the cost
3. **Better Performance**: Code splitting creates separate chunks loaded on-demand
4. **No CommonJS Warnings**: Configuration suppresses build warnings for CommonJS dependencies

### Usage Examples

See the following files for implementation examples:

- `src/app/pages/dashboard/dashboard.component.ts` - Dashboard export functionality
- `src/app/services/reporting-api.service.ts` - Reporting service with PDF/CSV export methods

### Bundle Analysis

To analyze bundle sizes and verify lazy loading:

```bash
npm run analyze
```

This generates a bundle visualization showing:
- Main bundle size
- Lazy-loaded chunks for jsPDF and PapaParse
- Individual chunk sizes

### Build Commands

```bash
# Development build
npm run build

# Production build
npm run build -- --configuration production

# Analyze bundle
npm run analyze
```

### Verification Steps

After implementing lazy loading, verify the changes:

1. **Build the application:**
   ```bash
   cd frontend
   npm run build
   ```
   
   Look for output showing no CommonJS warnings for jsPDF and PapaParse.

2. **Analyze bundle sizes:**
   ```bash
   npm run analyze
   ```
   
   This opens a browser with an interactive visualization showing:
   - Main bundle should NOT contain jsPDF (~500KB) or PapaParse (~100KB)
   - Separate lazy chunks for jsPDF and PapaParse
   - These chunks are loaded only when export functions are called

3. **Test in development:**
   ```bash
   npm start
   ```
   
   - Navigate to the dashboard
   - Open browser DevTools Network tab
   - Click "Export to PDF" or "Export to CSV"
   - Observe that jsPDF/PapaParse chunks are loaded on-demand

4. **Test in production:**
   ```bash
   npm run build -- --configuration production
   # Serve the dist folder with a static server
   ```
   
   Verify that export functionality works correctly in production build.

### Implementation Details

#### Dynamic Import Pattern

The key pattern for lazy loading is using dynamic imports:

```typescript
// Instead of static import (loads immediately):
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Use dynamic import (loads on-demand):
const [jsPDFModule] = await Promise.all([
  import('jspdf'),
  import('jspdf-autotable')
]);
```

#### Benefits Summary

- **Initial Bundle Reduction**: ~600KB saved from main bundle
- **Faster Time-to-Interactive**: Smaller initial bundle loads faster
- **Better UX**: Only users who export data pay the cost
- **Code Splitting**: Automatic chunk generation by Angular CLI
- **Tree Shaking**: Unused code from libraries is eliminated

### Files Modified

1. **angular.json** - Added `jspdf` to `allowedCommonJsDependencies`
2. **dashboard.component.ts** - Added `exportToPDF()` with lazy loading
3. **dashboard.component.html** - Added export buttons
4. **dashboard.component.scss** - Added export button styles
5. **reporting-api.service.ts** - Added comprehensive export methods with lazy loading

### Testing Checklist

- [ ] Build completes without CommonJS warnings
- [ ] Bundle analyzer shows jsPDF/PapaParse in separate chunks
- [ ] PDF export works in development mode
- [ ] CSV export works in development mode
- [ ] PDF export works in production build
- [ ] CSV export works in production build
- [ ] Export buttons are disabled when no data available
- [ ] Loading states prevent multiple concurrent exports
- [ ] Files download with correct names and timestamps
- [ ] Error handling works for failed exports

