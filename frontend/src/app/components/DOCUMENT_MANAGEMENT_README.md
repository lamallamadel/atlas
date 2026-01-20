# Document Management Feature

## Overview
Complete document management system for dossier files with drag-and-drop upload, file preview, and categorization.

## Components

### DocumentListComponent
Main component that displays all documents for a dossier.

**Features:**
- Document grid with cards showing file info
- File type icons (PDF, Word, Excel, Images)
- Category badges with color coding
- Download, preview, and delete actions
- Integrated upload component
- Empty state when no documents

**Usage:**
```html
<app-document-list [dossierId]="dossier.id"></app-document-list>
```

### DocumentUploadComponent
Upload component with drag-and-drop support and progress tracking.

**Features:**
- Drag-and-drop zone
- File selection button
- Category dropdown (Contract, Invoice, ID, Photo, Other)
- Multiple file upload
- Real-time progress bars using HttpEventType.UploadProgress
- File type validation
- File size display
- Remove files before upload

**Usage:**
```html
<app-document-upload 
  [dossierId]="dossierId"
  (uploadComplete)="onUploadComplete($event)"
  (uploadError)="onUploadError($event)">
</app-document-upload>
```

**Events:**
- `uploadComplete`: Emitted when upload succeeds with DocumentResponse
- `uploadError`: Emitted when upload fails with error message

### DocumentPreviewDialogComponent
Modal dialog for previewing images and PDFs.

**Features:**
- Full-screen image preview
- PDF iframe viewer
- Download button
- Loading state with spinner
- Error handling with retry

**Usage:**
```typescript
this.dialog.open(DocumentPreviewDialogComponent, {
  width: '90vw',
  maxWidth: '1200px',
  height: '90vh',
  panelClass: 'document-preview-dialog',
  data: { document }
});
```

## Service

### DocumentApiService
Service for all document-related API calls.

**Methods:**
- `upload(dossierId, file, category?)`: Upload with progress tracking
- `listByDossier(dossierId, page?, size?, sort?)`: List documents with pagination
- `getById(documentId)`: Get document metadata
- `download(documentId)`: Download document blob
- `delete(documentId)`: Delete document
- `getFileIcon(fileName, contentType?)`: Get Material icon name
- `formatFileSize(bytes)`: Format bytes to human-readable
- `isPreviewable(contentType)`: Check if file can be previewed

**Document Categories:**
- CONTRACT: 'Contract'
- INVOICE: 'Invoice'
- ID: 'ID'
- PHOTO: 'Photo'
- OTHER: 'Other'

## Backend Integration

### Entity Changes
- Added `category` column to `document` table
- Migration: `V19__Add_document_category.sql`

### API Endpoints
- `POST /api/v1/documents/upload` - Upload with category
- `GET /api/v1/documents/dossier/{dossierId}` - List documents
- `GET /api/v1/documents/{id}` - Get document metadata
- `GET /api/v1/documents/{id}/download` - Download file
- `DELETE /api/v1/documents/{id}` - Delete document

### Supported File Types
- PDF: application/pdf
- Images: image/jpeg, image/png, image/gif
- Word: .doc, .docx
- Excel: .xls, .xlsx
- Text: .txt, .csv

### File Size Limit
- Maximum: 10 MB (configurable via `storage.max-file-size`)

## Styling

### File Type Icons
- PDF: `picture_as_pdf` (red)
- Word: `description` (blue)
- Excel: `table_chart` (green)
- Images: `image` (purple)
- Other: `insert_drive_file` (grey)

### Category Badges
- Contract: Blue (#1976d2)
- Invoice: Orange (#f57c00)
- ID: Purple (#7b1fa2)
- Photo: Green (#388e3c)
- Other: Pink (#c2185b)

## Drag and Drop

### Angular CDK Integration
Uses Angular CDK DragDrop module for drag-and-drop functionality.

**Events:**
- `dragover`: Prevent default, show dragging state
- `dragleave`: Hide dragging state
- `drop`: Handle dropped files, add to upload queue

## Progress Tracking

### Upload Progress
Uses `HttpEventType.UploadProgress` to track upload progress:

```typescript
if (event.type === HttpEventType.UploadProgress && event.total) {
  progress.progress = Math.round((100 * event.loaded) / event.total);
}
```

### Progress States
- `uploading: true` - In progress
- `completed: true` - Success
- `error: string` - Failed with error message

## Mobile Responsive

### Breakpoints
- Desktop: Grid layout (300px cards)
- Tablet (768px): Single column grid
- Mobile (480px): Compact layout with adjusted spacing

## Security

### File Validation
- Content type checking
- File size limits
- Filename sanitization (no ".." path traversal)
- Virus scan placeholder (backend)

### Authentication
- All endpoints require `ADMIN` or `PRO` role
- Organization-level isolation (multi-tenant)
- Document access checks on download/delete

## Error Handling

### User-Friendly Messages
- Upload errors with retry option
- Download failures with notification
- Delete confirmations
- Preview loading errors

## Performance

### Optimizations
- Lazy loading of document list
- Progress tracking without blocking UI
- Blob URL management (cleanup after download)
- Pagination support for large document sets

## Accessibility

### ARIA Labels
- All buttons have `aria-label` attributes
- Dialog roles and descriptions
- Keyboard navigation support
- Screen reader announcements

## Testing

### Component Tests
- `document-list.component.spec.ts`
- `document-upload.component.spec.ts`
- `document-preview-dialog.component.spec.ts`
- `document-api.service.spec.ts`

## Integration with Dossier Detail

Added as a new tab in the dossier detail view:

```html
<mat-tab label="Documents" aria-label="Gestion des documents du dossier">
  <div class="tab-content">
    <app-document-list [dossierId]="dossier.id"></app-document-list>
  </div>
</mat-tab>
```

## Future Enhancements

Potential improvements:
- Bulk operations (multi-select, bulk delete)
- Document versioning
- Document templates
- OCR for scanned documents
- Document sharing links
- Document expiration dates
- Advanced search/filtering
- Document thumbnails generation
- Audit trail for document access
