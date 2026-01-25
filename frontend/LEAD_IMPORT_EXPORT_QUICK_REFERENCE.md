# Lead Import/Export Quick Reference

## Quick Start

### Open Import Dialog
```typescript
import { MatDialog } from '@angular/material/dialog';
import { LeadImportDialogComponent } from './components/lead-import-dialog.component';

constructor(private dialog: MatDialog) {}

openImport(): void {
  this.dialog.open(LeadImportDialogComponent, {
    width: '700px',
    disableClose: true
  }).afterClosed().subscribe(success => {
    if (success) this.reloadData();
  });
}
```

### Open Export Dialog
```typescript
import { LeadExportDialogComponent } from './components/lead-export-dialog.component';

openExport(): void {
  this.dialog.open(LeadExportDialogComponent, {
    width: '700px'
  });
}
```

## CSV Format

### Required Columns
- `name` - Lead name (required)
- `phone` - Phone number (required, used for duplicate detection)
- `source` - Lead source: web, mobile, phone, email, referral, walk_in, social_media (required)

### Optional Columns
- `email` - Email address
- `lead_source` - Detailed source description
- `notes` - Additional notes
- `score` - Lead score (0-100)

### Example CSV
```csv
name,phone,email,source,lead_source,notes,score
John Doe,+33612345678,john@example.com,web,Website,VIP client,85
```

## Duplicate Strategies

- **SKIP**: Ignore duplicates, count them
- **OVERWRITE**: Update existing records
- **CREATE_NEW**: Always create new records

## API Endpoints

### Import
```
POST /api/v1/leads/import
Content-Type: multipart/form-data
Parameters: file (CSV), mergeStrategy (SKIP|OVERWRITE|CREATE_NEW)
```

### Export
```
GET /api/v1/leads/export?columns=id,name,phone&status=NEW&source=WEB
Response: CSV file download
```

### Import History
```
GET /api/v1/leads/import/history
Response: Array of ImportJobResponse
```

## Export Columns

### Standard Columns
- `id`, `name`, `phone`, `email`
- `source`, `lead_source`, `status`
- `score`, `notes`

### Extended Columns
- `annonce_id`, `case_type`, `status_code`
- `loss_reason`, `won_reason`
- `created_at`, `updated_at`
- `created_by`, `updated_by`

## Response Objects

### Import Response
```typescript
{
  importJobId: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  validationErrors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}
```

### Import Job
```typescript
{
  id: number;
  filename: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errorReport: string;
  createdAt: string;
  createdBy: string;
}
```

## Validation Rules

- **Name**: Required, non-empty
- **Phone**: Required, non-empty
- **Source**: Required, must be valid enum value
- **Score**: Optional, 0-100 if provided
- **File**: CSV only, max 10 MB

## Common Patterns

### With Refresh
```typescript
openImport(): void {
  this.dialog.open(LeadImportDialogComponent, {
    width: '700px',
    disableClose: true
  }).afterClosed().subscribe(success => {
    if (success) {
      this.snackBar.open('Import terminé', 'OK');
      this.loadLeads();
    }
  });
}
```

### With Error Handling
```typescript
this.leadApi.importLeads(file, strategy).subscribe({
  next: (response) => console.log('Success', response),
  error: (err) => console.error('Error', err)
});
```

### Download Template
```typescript
downloadTemplate(): void {
  const link = document.createElement('a');
  link.href = '/assets/lead_import_template.csv';
  link.download = 'lead_import_template.csv';
  link.click();
}
```

## Keyboard Shortcuts

```typescript
@HostListener('document:keydown.control.i')
openImport() { /* ... */ }

@HostListener('document:keydown.control.e')
openExport() { /* ... */ }
```

## Role-Based Access

```typescript
canImportExport = this.auth.hasRole(['ADMIN', 'PRO']);
```

## Testing Snippets

### Mock Import
```typescript
const mockResponse: LeadImportResponse = {
  importJobId: 1,
  totalRows: 10,
  successCount: 9,
  errorCount: 1,
  skippedCount: 0,
  validationErrors: []
};
```

### Mock File
```typescript
const file = new File(
  ['name,phone,source\nJohn,+33612345678,web'],
  'test.csv',
  { type: 'text/csv' }
);
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Dialog not opening | Check MatDialogModule imported |
| Upload fails | Verify file size < 10 MB, CSV format |
| No permissions | Check user has ADMIN or PRO role |
| Invalid source | Use: web, mobile, phone, email, referral, walk_in, social_media |
| Score error | Must be 0-100 |

## File Locations

- Import Dialog: `src/app/components/lead-import-dialog.component.ts`
- Export Dialog: `src/app/components/lead-export-dialog.component.ts`
- API Service: `src/app/services/lead-api.service.ts`
- Backend Service: `backend/src/main/java/com/example/backend/service/LeadImportService.java`
- CSV Template: `frontend/src/assets/lead_import_template.csv`

## Backend Service Methods

```java
// Import leads
LeadImportResponse importLeads(MultipartFile file, MergeStrategy strategy)

// Export leads
void exportLeads(Writer writer, DossierStatus status, 
                LocalDateTime startDate, LocalDateTime endDate, 
                DossierSource source, List<String> columns)
```

## Quick Reference URLs

- Full Documentation: `LEAD_IMPORT_EXPORT_README.md`
- Integration Guide: `LEAD_IMPORT_EXPORT_INTEGRATION.md`
- Backend Migration: `backend/src/main/resources/db/migration/V21__Add_import_job_table.sql`
