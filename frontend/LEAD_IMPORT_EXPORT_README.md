# Lead Import/Export Functionality

## Overview

The Lead Import/Export functionality provides a comprehensive solution for bulk importing leads from CSV files and exporting leads with advanced filtering and column selection capabilities.

## Features

### Lead Import

#### CSV Format
The CSV file must include the following columns:
- **name** (required): Full name of the lead
- **phone** (required): Phone number (used for duplicate detection)
- **source** (required): Lead source (web, mobile, phone, email, referral, walk_in, social_media)
- **email** (optional): Email address
- **lead_source** (optional): Detailed source description
- **notes** (optional): Additional notes
- **score** (optional): Lead score (0-100)

#### Example CSV
```csv
name,phone,email,source,lead_source,notes,score
John Doe,+33612345678,john@example.com,web,Website Campaign,VIP client,85
Jane Smith,+33698765432,jane@example.com,phone,Cold call,Follow up needed,60
```

#### Duplicate Detection
The system detects duplicates by phone number and provides three merge strategies:

1. **SKIP**: Ignore duplicates and count them separately
2. **OVERWRITE**: Update existing records with new data
3. **CREATE_NEW**: Create new records even if duplicates exist

#### Validation Rules
- **Name**: Required, non-empty string
- **Phone**: Required, non-empty string
- **Source**: Required, must be one of: web, mobile, phone, email, referral, walk_in, social_media
- **Score**: Optional, must be between 0 and 100 if provided

#### Import Process
1. User selects CSV file via drag-and-drop or file picker
2. User chooses duplicate handling strategy
3. File is validated (CSV format, max 10 MB)
4. Import starts with real-time progress tracking
5. Results displayed with statistics:
   - Total rows processed
   - Successful imports
   - Errors with detailed reasons
   - Skipped duplicates

#### Error Reporting
Errors are displayed in a detailed table showing:
- Row number
- Field with error
- Error message/reason

Common errors:
- Missing required fields (name, phone, source)
- Invalid source value
- Score out of range (0-100)
- Invalid data format

### Lead Export

#### Column Selection
Users can select from the following columns:
- **id**: Lead ID
- **name**: Lead name
- **phone**: Phone number
- **email**: Email address
- **source**: Lead source (web, mobile, etc.)
- **lead_source**: Detailed source description
- **status**: Lead status (NEW, QUALIFIED, etc.)
- **score**: Lead score
- **notes**: Additional notes
- **annonce_id**: Associated property ID
- **case_type**: Case type
- **status_code**: Status code
- **loss_reason**: Reason for lost lead
- **won_reason**: Reason for won lead
- **created_at**: Creation date
- **updated_at**: Last update date
- **created_by**: Creator user
- **updated_by**: Last modifier user

#### Filters
Apply filters to export only specific leads:
- **Status**: Filter by lead status
- **Source**: Filter by lead source
- **Date Range**: Filter by creation date (start and end dates)

#### Export Process
1. User selects desired columns (select all/deselect all available)
2. User applies optional filters
3. Click export to generate CSV file
4. File downloads automatically with timestamp

#### Export File Format
- CSV format with UTF-8 encoding
- Filename pattern: `leads_export_YYYYMMDD_HHMMSS.csv`
- First row contains column headers
- Empty values represented as empty strings

## Usage

### Opening Import Dialog

```typescript
import { MatDialog } from '@angular/material/dialog';
import { LeadImportDialogComponent } from './components/lead-import-dialog.component';

constructor(private dialog: MatDialog) {}

openImportDialog(): void {
  const dialogRef = this.dialog.open(LeadImportDialogComponent, {
    width: '700px',
    disableClose: true
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('Import completed successfully');
      // Refresh lead list
    }
  });
}
```

### Opening Export Dialog

```typescript
import { MatDialog } from '@angular/material/dialog';
import { LeadExportDialogComponent } from './components/lead-export-dialog.component';

constructor(private dialog: MatDialog) {}

openExportDialog(): void {
  const dialogRef = this.dialog.open(LeadExportDialogComponent, {
    width: '700px'
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      console.log('Export completed successfully');
    }
  });
}
```

## API Endpoints

### Import Leads
**POST** `/api/v1/leads/import`

**Request:**
- Content-Type: `multipart/form-data`
- Parameters:
  - `file`: CSV file (required)
  - `mergeStrategy`: SKIP | OVERWRITE | CREATE_NEW (default: SKIP)

**Response:**
```json
{
  "importJobId": 123,
  "totalRows": 100,
  "successCount": 95,
  "errorCount": 3,
  "skippedCount": 2,
  "validationErrors": [
    {
      "row": 5,
      "field": "phone",
      "message": "Phone is required"
    }
  ]
}
```

### Get Import History
**GET** `/api/v1/leads/import/history`

**Response:**
```json
[
  {
    "id": 123,
    "filename": "leads.csv",
    "status": "COMPLETED",
    "totalRows": 100,
    "successCount": 95,
    "errorCount": 3,
    "skippedCount": 2,
    "errorReport": "Row 5: Phone is required\nRow 7: Invalid source\n",
    "createdAt": "2024-01-15T10:30:00",
    "createdBy": "user@example.com"
  }
]
```

### Get Import Job Details
**GET** `/api/v1/leads/import/history/{id}`

**Response:**
```json
{
  "id": 123,
  "filename": "leads.csv",
  "status": "COMPLETED",
  "totalRows": 100,
  "successCount": 95,
  "errorCount": 3,
  "skippedCount": 2,
  "errorReport": "Row 5: Phone is required\n",
  "createdAt": "2024-01-15T10:30:00",
  "createdBy": "user@example.com"
}
```

### Export Leads
**GET** `/api/v1/leads/export`

**Parameters:**
- `columns`: Comma-separated list of column names (optional)
- `status`: Filter by status (optional)
- `source`: Filter by source (optional)
- `startDate`: Start date in ISO format (optional)
- `endDate`: End date in ISO format (optional)

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="leads_export_20240115_103000.csv"`

**Example:**
```
GET /api/v1/leads/export?columns=id,name,phone,email&status=NEW&source=WEB
```

## Backend Architecture

### Service Layer

#### LeadImportService
- Handles CSV parsing using OpenCSV library
- Validates required fields (name, phone, source)
- Detects duplicates by phone number
- Applies merge strategy (skip, overwrite, create new)
- Tracks import progress in ImportJobEntity
- Generates detailed error reports

#### LeadExportService
- Builds dynamic JPA specifications for filtering
- Supports configurable column selection
- Generates CSV with CSVWriter
- Handles date formatting and null values

### Entity Layer

#### ImportJobEntity
Tracks import job execution:
- `id`: Primary key
- `orgId`: Organization ID (multi-tenant)
- `filename`: Original CSV filename
- `status`: IN_PROGRESS | COMPLETED | FAILED
- `totalRows`: Total rows in CSV
- `successCount`: Successfully imported
- `errorCount`: Rows with errors
- `skippedCount`: Duplicate rows skipped
- `errorReport`: Detailed error messages
- Audit fields: createdAt, updatedAt, createdBy, updatedBy

### Repository Layer

#### ImportJobRepository
```java
List<ImportJobEntity> findByOrgIdOrderByCreatedAtDesc(String orgId);
```

#### DossierRepository
```java
List<Dossier> findByLeadPhoneAndOrgIdAndStatusNotIn(
    String phone, 
    String orgId, 
    List<DossierStatus> excludedStatuses
);
```

## Frontend Architecture

### Components

#### LeadImportDialogComponent
Features:
- Drag-and-drop file upload
- File validation (CSV, max 10 MB)
- Duplicate strategy selector
- Real-time progress display
- Error report table with filtering
- Success/error statistics

#### LeadExportDialogComponent
Features:
- Column selector with select all/deselect all
- Filter panel (status, source, date range)
- Export progress indicator
- Automatic file download

### Services

#### LeadApiService
Provides methods for:
- `importLeads(file, strategy)`: Upload and import CSV
- `getImportHistory()`: Fetch import job history
- `getImportJobById(id)`: Get specific job details
- `exportLeads(request)`: Export leads with filters

## Database Schema

### import_job Table
```sql
CREATE TABLE import_job (
    id BIGSERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    error_report TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX idx_import_job_org_id ON import_job(org_id);
CREATE INDEX idx_import_job_status ON import_job(status);
CREATE INDEX idx_import_job_created_at ON import_job(created_at);
```

## Testing

### Unit Tests

#### Backend
- `LeadImportServiceTest`: Tests CSV parsing, validation, duplicate handling
- `LeadExportServiceTest`: Tests column selection, filtering, CSV generation

#### Frontend
- `LeadImportDialogComponent.spec.ts`: Tests file validation, progress tracking
- `LeadExportDialogComponent.spec.ts`: Tests column selection, export flow

### E2E Tests
Create E2E tests for:
1. Import flow with valid CSV
2. Import with validation errors
3. Import with duplicates (all strategies)
4. Export with various column selections
5. Export with filters

## Security Considerations

1. **File Validation**: Only CSV files accepted, max 10 MB
2. **Multi-tenancy**: All operations scoped to organization ID
3. **Authentication**: Requires ADMIN or PRO role
4. **Input Sanitization**: All CSV data validated and sanitized
5. **Rate Limiting**: Consider adding rate limits for large imports

## Performance Considerations

1. **Batch Processing**: Import processes rows in batches
2. **Streaming Export**: Large exports stream to client
3. **Indexes**: Database indexes on org_id, status, created_at
4. **Pagination**: Consider paginating import history for large datasets

## Future Enhancements

1. **Background Jobs**: Async processing for large files (>10k rows)
2. **Progress Websockets**: Real-time progress updates via WebSocket
3. **Excel Support**: Import/export Excel files (.xlsx)
4. **Column Mapping**: Allow users to map CSV columns to fields
5. **Import Templates**: Downloadable CSV templates
6. **Scheduled Exports**: Schedule recurring exports
7. **Export Formats**: Support JSON, XML formats
8. **Import Validation Preview**: Preview and validate before import
9. **Rollback**: Ability to rollback imports
10. **Import Queue**: Queue system for handling multiple imports

## Troubleshooting

### Common Issues

**Import fails with "File is empty"**
- Ensure CSV file has content beyond headers

**Import fails with "Invalid source value"**
- Source must be one of: web, mobile, phone, email, referral, walk_in, social_media

**Export returns empty file**
- Check that filters match existing data
- Verify user has access to leads in organization

**Upload timeout**
- Increase server timeout for large files
- Consider splitting large files into smaller batches

## Support

For issues or questions:
1. Check error messages in import/export dialogs
2. Review import job history for detailed error reports
3. Check browser console for frontend errors
4. Review backend logs for server-side issues
