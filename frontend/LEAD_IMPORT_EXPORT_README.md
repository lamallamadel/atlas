# Lead Import/Export UI Implementation

## Overview

This implementation provides a complete frontend UI for bulk importing and exporting lead data (dossiers) in the application. The feature includes two dialog components with comprehensive file handling, validation, real-time progress tracking, and error reporting.

## Components Created

### 1. LeadApiService (`frontend/src/app/services/lead-api.service.ts`)

Service handling all API communication for lead import/export operations.

**Key Features:**
- Import leads from CSV files with duplicate strategy selection
- Poll import job status at regular intervals
- Export leads to CSV with customizable columns and filters
- Type-safe interfaces for all API requests and responses

**API Endpoints:**
- `POST /api/v1/leads/import` - Start import job
- `GET /api/v1/leads/import/{jobId}/status` - Get import status
- `GET /api/v1/leads/export` - Export leads to CSV

### 2. LeadImportDialogComponent (`frontend/src/app/components/lead-import-dialog.component.*`)

Dialog component for importing leads from CSV files.

**Key Features:**
- **File Upload**
  - Drag-and-drop zone for CSV files
  - File input with CSV validation
  - File size limit (10 MB)
  - Visual feedback for file selection

- **Duplicate Strategy Selection**
  - SKIP: Ignore duplicate entries
  - OVERWRITE: Update existing entries
  - CREATE_NEW: Create new entries regardless of duplicates
  - Radio button group with descriptions

- **Real-time Progress Tracking**
  - Polls `/api/v1/leads/import/{jobId}/status` every 2 seconds
  - Progress bar showing percentage completion
  - Statistics display (success count, failure count, processed/total rows)
  - Status messages (Pending, Processing, Completed, Failed)

- **Error Reporting**
  - Expandable error table
  - Displays failed rows with reasons
  - Columns: Row Number, Lead Name, Phone, Reason
  - Scrollable table for large error lists

- **User Experience**
  - Prevents closing dialog during import
  - Auto-refreshes parent data on successful completion
  - Success/error notifications via snackbar
  - Responsive design for mobile devices

### 3. LeadExportDialogComponent (`frontend/src/app/components/lead-export-dialog.component.*`)

Dialog component for exporting leads to CSV files.

**Key Features:**
- **Column Selection**
  - Checkboxes for 12 available columns (ID, name, phone, source, status, etc.)
  - "Select All" and "Deselect All" quick actions
  - Visual counter showing selected columns
  - Default selection of most common columns

- **Export Filters**
  - Status filter (dropdown with all status options)
  - Source filter (text input)
  - Date range filter (from/to date pickers)
  - All filters are optional

- **File Download**
  - Generates filename with timestamp: `leads_export_YYYY-MM-DDTHH-mm-ss.csv`
  - Auto-downloads file via browser
  - Progress indicator during export
  - Success/error notifications

- **Responsive Design**
  - Grid layout adapts to screen size
  - Mobile-friendly column selection
  - Touch-optimized controls

## Integration Points

### Updated Files

1. **`frontend/src/app/app.module.ts`**
   - Added `LeadImportDialogComponent` and `LeadExportDialogComponent` to declarations
   - Added `MatRadioModule` to imports
   - Added `LeadApiService` (auto-provided via `providedIn: 'root'`)

2. **`frontend/src/app/pages/dossiers/dossiers.component.ts`**
   - Imported dialog components
   - Added `openImportDialog()` method
   - Added `openExportDialog()` method
   - Refreshes dossier list after successful import

3. **`frontend/src/app/pages/dossiers/dossiers.component.html`**
   - Added import/export buttons to page header
   - Buttons positioned before "Create Dossier" button
   - Material icons for visual clarity

4. **`frontend/src/app/pages/dossiers/dossiers.component.css`**
   - Added `.page-header` styling
   - Added `.header-actions` styling for button group
   - Responsive layout with flex wrap

## Usage

### Opening Import Dialog

From the Dossiers page, users can:
1. Click the "Importer" button in the header
2. Drag-and-drop a CSV file or click to browse
3. Select duplicate handling strategy
4. Click "Démarrer l'import"
5. Monitor progress in real-time
6. View errors if any occur
7. Close dialog when complete

### Opening Export Dialog

From the Dossiers page, users can:
1. Click the "Exporter" button in the header
2. Select columns to include in export
3. Optionally apply filters (status, source, date range)
4. Click "Exporter"
5. File downloads automatically with timestamped filename

## CSV Format

### Import CSV Expected Format

The backend should expect CSV with headers:
- `leadName` (required)
- `leadPhone` (required)
- `leadSource` (optional)
- `annonceId` (optional)
- Additional fields as defined by backend

### Export CSV Format

The export includes selected columns in CSV format with proper headers and French labels.

## Error Handling

### Import Errors
- File validation errors (wrong format, too large)
- Upload errors (network, server issues)
- Processing errors (displayed in error table)
- Each error includes row number, lead info, and reason

### Export Errors
- No columns selected
- Network/server errors
- All errors displayed via snackbar notifications

## Styling

All components follow the application's Material Design theme:
- Primary color: `#1976d2`
- Success color: `#4caf50`
- Error color: `#f44336`
- Warning color: `#ff9800`

Components are fully responsive with breakpoints at:
- Mobile: `< 600px`
- Tablet: `600px - 768px`
- Desktop: `> 768px`

## Accessibility

Both dialogs include:
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader friendly error messages
- Focus management
- Disabled state handling

## Testing

Spec files created for:
- `lead-api.service.spec.ts`
- `lead-import-dialog.component.spec.ts`
- `lead-export-dialog.component.spec.ts`

Basic test setup provided. Full test coverage should include:
- File upload validation
- API integration tests
- Progress polling logic
- Export with various column/filter combinations
- Error handling scenarios

## Backend Requirements

The frontend expects the following backend endpoints:

### Import Endpoint
```
POST /api/v1/leads/import
Content-Type: multipart/form-data

Fields:
- file: CSV file
- duplicateStrategy: SKIP | OVERWRITE | CREATE_NEW

Response: LeadImportJobResponse
{
  jobId: string,
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  totalRows: number,
  processedRows: number,
  successCount: number,
  failureCount: number,
  errors: [
    {
      rowNumber: number,
      leadName?: string,
      leadPhone?: string,
      reason: string
    }
  ]
}
```

### Import Status Endpoint
```
GET /api/v1/leads/import/{jobId}/status

Response: Same as above (LeadImportJobResponse)
```

### Export Endpoint
```
GET /api/v1/leads/export

Query Parameters:
- columns[]: Array of column names (required, at least one)
- status?: Status filter (optional)
- source?: Source filter (optional)
- dateFrom?: ISO date string (optional)
- dateTo?: ISO date string (optional)

Response: CSV file (Content-Type: text/csv)
Headers: Content-Disposition: attachment; filename="leads_export.csv"
```

## Future Enhancements

Potential improvements:
1. Import template download button
2. Export preview before download
3. Scheduled exports
4. Import validation before processing
5. Resume failed imports
6. Export to multiple formats (Excel, JSON)
7. Column mapping for imports
8. Bulk edit via import
9. Import history/audit log
10. Progress percentage in browser tab title
