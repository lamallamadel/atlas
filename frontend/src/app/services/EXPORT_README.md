# Export Service Documentation

## Overview

The ExportService provides comprehensive export functionality for the CRM application, enabling users to export filtered data lists (annonces, dossiers) to PDF, Excel (CSV), or print formats with customizable templates and progress feedback.

## Features

### ✅ Export Formats
- **PDF Export**: Generates professional PDF documents with custom branding, colors, and headers
- **Excel Export**: Creates CSV files compatible with Excel and other spreadsheet applications
- **Print**: Opens a print-optimized view with custom styling

### ✅ Customization
- **Logo Support**: Add company logo to exports
- **Custom Colors**: Configure primary and secondary brand colors
- **Orientation**: Choose portrait or landscape for PDFs
- **Date Stamping**: Optional inclusion of export date
- **Page Numbers**: Automatic page numbering in PDFs

### ✅ User Experience
- **Multiple Selection**: Export selected rows or all data
- **Progress Feedback**: Real-time progress dialog with stages
- **Async Operation**: Non-blocking UI with lazy-loaded dependencies
- **Error Handling**: Graceful error reporting with detailed messages

## Usage

### Basic Setup

#### 1. Enable Export in GenericTableComponent

```typescript
// In your component.html
<app-generic-table
  [columns]="columns"
  [data]="items"
  [enableRowSelection]="true"
  [enableExport]="true"
  [showTableHeader]="true"
  (exportRequest)="onExportRequest($event)">
</app-generic-table>
```

#### 2. Handle Export Requests

```typescript
import { ExportService, ColumnDef } from '../../services/export.service';
import { ExportProgressDialogComponent } from '../../components/export-progress-dialog.component';

export class MyComponent {
  constructor(
    private exportService: ExportService,
    private dialog: MatDialog
  ) {}

  onExportRequest(event: { format: 'pdf' | 'excel' | 'print'; data: unknown[] }): void {
    // Define export columns
    const exportColumns: ColumnDef[] = [
      { key: 'id', header: 'ID', width: 20 },
      { key: 'name', header: 'Name', width: 60 },
      { key: 'email', header: 'Email', width: 50 },
      { key: 'status', header: 'Status', width: 30 }
    ];

    // Transform data for export (clean HTML, format values)
    const dataToExport = event.data.map(item => ({
      id: item.id,
      name: item.name || '-',
      email: item.email || '-',
      status: this.getStatusLabel(item.status)
    }));

    // Configure export
    const exportConfig = {
      title: 'Customer List',
      filename: 'customers',
      primaryColor: '#2c5aa0',
      secondaryColor: '#e67e22',
      logo: '/assets/logo.png' // Optional
    };

    // Show progress dialog
    const dialogRef = this.dialog.open(ExportProgressDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { message: 'Preparing export...' }
    });

    // Execute export
    const exportPromise = event.format === 'pdf'
      ? this.exportService.exportToPDF(dataToExport, exportColumns, exportConfig)
      : event.format === 'excel'
      ? this.exportService.exportToExcel(dataToExport, exportColumns, exportConfig)
      : this.exportService.printTable(dataToExport, exportColumns, exportConfig);

    exportPromise.catch(error => {
      console.error('Export error:', error);
    });
  }
}
```

## API Reference

### ExportService

#### exportToPDF<T>(data, columns, config)
Generates a PDF document with custom styling and headers.

**Parameters:**
- `data: T[]` - Array of data objects to export
- `columns: ColumnDef[]` - Column definitions
- `config: Partial<ExportConfig>` - Export configuration

**Returns:** `Promise<void>`

#### exportToExcel<T>(data, columns, config)
Generates a CSV file with UTF-8 BOM for Excel compatibility.

**Parameters:**
- `data: T[]` - Array of data objects to export
- `columns: ColumnDef[]` - Column definitions
- `config: Partial<ExportConfig>` - Export configuration

**Returns:** `Promise<void>`

#### printTable<T>(data, columns, config)
Opens a print-optimized view in a new window.

**Parameters:**
- `data: T[]` - Array of data objects to export
- `columns: ColumnDef[]` - Column definitions
- `config: Partial<ExportConfig>` - Export configuration

**Returns:** `Promise<void>`

### Interfaces

#### ColumnDef
```typescript
interface ColumnDef {
  key: string;        // Property key in data object
  header: string;     // Column header text
  width?: number;     // Column width in mm (PDF only)
}
```

#### ExportConfig
```typescript
interface ExportConfig {
  title: string;              // Export title/header
  filename: string;           // Output filename (without extension)
  orientation?: 'portrait' | 'landscape';
  logo?: string;              // Logo URL or base64 data URI
  primaryColor?: string;      // Hex color for headers/accents
  secondaryColor?: string;    // Hex color for secondary elements
  includeDate?: boolean;      // Include export date (default: true)
  includePageNumbers?: boolean; // Include page numbers (default: true)
}
```

#### ExportProgress
```typescript
interface ExportProgress {
  stage: 'preparing' | 'generating' | 'complete' | 'error';
  progress: number;    // 0-100
  message: string;     // Status message
  error?: string;      // Error details if stage is 'error'
}
```

## Progress Stages

### 1. Preparing (0-30%)
- Validates input data
- Lazy loads export libraries (jspdf, jspdf-autotable)
- Initializes export configuration

### 2. Generating (30-90%)
- Formats data
- Builds export document
- Applies styling and branding

### 3. Complete (100%)
- Triggers download
- Auto-closes progress dialog after 2 seconds

### 4. Error
- Displays error message
- Allows user to close dialog manually

## Data Cleaning

The ExportService automatically cleans data for export:

### HTML Stripping
```typescript
// Input: "<strong>John Doe</strong>"
// Output: "John Doe"
```

### Object Serialization
```typescript
// Input: { name: "John", age: 30 }
// Output: '{"name":"John","age":30}'
```

### Null Handling
```typescript
// Input: null, undefined
// Output: ""
```

### CSV Escaping
```typescript
// Input: 'Value with "quotes"'
// Output: '"Value with ""quotes"""'
```

## Print Styles

The application includes optimized print styles in `src/styles/print.scss`:

### Features
- Hides navigation, buttons, and interactive elements
- Optimizes table layout for printing
- Adds page break controls
- Repeats table headers on each page
- Monochrome-friendly status badges
- Custom page margins and headers/footers

### Usage
Print styles are automatically applied when users:
1. Click the print button in GenericTableComponent
2. Use browser print (Ctrl+P)
3. Export to PDF

## Performance Considerations

### Lazy Loading
Export libraries (jspdf, jspdf-autotable) are lazy-loaded using dynamic imports:

```typescript
const { default: jsPDF } = await import('jspdf');
const { default: autoTable } = await import('jspdf-autotable');
```

**Benefits:**
- Reduces initial bundle size by ~200KB
- Loads dependencies only when export is triggered
- Non-blocking UI during library loading

### Large Datasets
For optimal performance with large datasets:

- **PDF**: Handles up to ~10,000 rows efficiently
- **Excel/CSV**: No practical limit, pure string concatenation
- **Print**: Automatically paginates long tables

**Recommendations:**
- For datasets > 10,000 rows, consider server-side export
- Use pagination or filters to reduce export size
- Show progress dialog for user feedback

## Error Handling

### Common Errors

#### 1. Popup Blocker (Print)
```
Error: Impossible d'ouvrir la fenêtre d'impression
```
**Solution:** Instruct user to allow popups for the application

#### 2. Library Load Failure
```
Error: Failed to load export library
```
**Solution:** Check network connection, CDN availability

#### 3. Invalid Data
```
Error: Export data is empty or invalid
```
**Solution:** Validate data before calling export

### Custom Error Handling
```typescript
exportPromise.catch(error => {
  console.error('Export error:', error);
  this.toastService.showError('Export failed. Please try again.');
});
```

## Accessibility

### ARIA Labels
All export buttons include descriptive ARIA labels:
```html
<button aria-label="Exporter en PDF">
  <mat-icon>picture_as_pdf</mat-icon>
</button>
```

### Keyboard Support
- Export buttons are keyboard accessible (Tab, Enter, Space)
- Progress dialog can be dismissed with Escape key
- Print preview supports browser keyboard shortcuts

### Screen Reader Support
- Progress messages announced via `role="status"`
- Selection count announced (e.g., "3 items selected")
- Export completion announced

## Examples

### Export with Custom Logo
```typescript
const exportConfig = {
  title: 'Monthly Report',
  filename: 'report_january_2024',
  orientation: 'landscape',
  logo: 'data:image/png;base64,iVBORw0KGgoAAAANSU...',
  primaryColor: '#1e3a8a',
  secondaryColor: '#f59e0b'
};
```

### Export Selected Rows Only
GenericTableComponent automatically handles selection:
- If rows are selected: exports only selected rows
- If no selection: exports all visible rows

### Custom Column Widths (PDF)
```typescript
const exportColumns: ColumnDef[] = [
  { key: 'id', header: 'ID', width: 15 },           // Narrow
  { key: 'description', header: 'Description', width: 100 }, // Wide
  { key: 'status', header: 'Status', width: 25 }    // Medium
];
```

## Testing

### Unit Tests
```typescript
// export.service.spec.ts
describe('ExportService', () => {
  it('should emit progress events', (done) => {
    service.progress$.subscribe(progress => {
      expect(progress.stage).toBeDefined();
      expect(progress.progress).toBeGreaterThanOrEqual(0);
      done();
    });
    service.exportToPDF([], [], {});
  });
});
```

### E2E Tests
```typescript
// annonces.e2e-spec.ts
test('should export to PDF', async ({ page }) => {
  await page.click('[aria-label="Exporter en PDF"]');
  await expect(page.locator('app-export-progress-dialog')).toBeVisible();
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain('.pdf');
});
```

## Browser Compatibility

| Browser | PDF | Excel | Print |
|---------|-----|-------|-------|
| Chrome 90+ | ✅ | ✅ | ✅ |
| Firefox 88+ | ✅ | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ | ✅ |
| Edge 90+ | ✅ | ✅ | ✅ |

## Dependencies

- **jspdf** (^2.5.1): PDF generation
- **jspdf-autotable** (^3.8.2): Table formatting in PDFs
- **Angular Material**: UI components and dialogs

## Migration from Legacy Export

If migrating from `LeadExportDialogComponent`:

### Before
```typescript
openExportDialog(): void {
  this.dialog.open(LeadExportDialogComponent, {
    width: '800px',
    data: { leads: this.leads }
  });
}
```

### After
```typescript
// Enable export in template
<app-generic-table
  [enableExport]="true"
  (exportRequest)="onExportRequest($event)">
</app-generic-table>

// Handle in component
onExportRequest(event): void {
  // Use ExportService as documented above
}
```

## Troubleshooting

### Export button disabled
**Cause:** No data to export  
**Solution:** Ensure `data` array is not empty

### PDF has overlapping text
**Cause:** Column widths too narrow  
**Solution:** Adjust `width` in `ColumnDef`

### CSV opens incorrectly in Excel
**Cause:** Missing UTF-8 BOM  
**Solution:** ExportService automatically adds BOM, but ensure Excel locale is correct

### Print styles not applied
**Cause:** Missing print.scss import  
**Solution:** Verify `styles` array in angular.json includes `src/styles/print.scss`

## Best Practices

1. **Clean HTML before export**: Strip HTML tags from formatted values
2. **Format dates consistently**: Use DateFormatPipe for all date fields
3. **Provide meaningful column headers**: Use user-friendly labels, not database field names
4. **Test with large datasets**: Verify performance with production-sized data
5. **Handle errors gracefully**: Show user-friendly error messages
6. **Optimize column widths**: Balance readability with space efficiency in PDFs
7. **Use descriptive filenames**: Include date, entity type, filter info

## Support

For issues or questions:
- Check console for error logs
- Verify network tab for library loading issues
- Review browser compatibility table
- Check `ExportProgress` events for detailed status
