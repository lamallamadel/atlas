# Lead Import/Export Integration Guide

## Overview

This guide shows how to integrate the lead import/export functionality into your Angular application.

## Prerequisites

Ensure the following are already configured:
- Angular Material modules imported
- FormsModule imported
- HttpClientModule configured
- Authentication interceptors set up

## Integration Steps

### 1. Import Components

The `LeadImportDialogComponent` and `LeadExportDialogComponent` are already declared in `app.module.ts`.

### 2. Add Import/Export Buttons

Add buttons to your toolbar or page to trigger the dialogs:

```typescript
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { LeadImportDialogComponent } from './components/lead-import-dialog.component';
import { LeadExportDialogComponent } from './components/lead-export-dialog.component';

@Component({
  selector: 'app-dossiers',
  template: `
    <div class="toolbar">
      <button mat-raised-button color="primary" (click)="openImportDialog()">
        <mat-icon>upload_file</mat-icon>
        Importer
      </button>
      <button mat-raised-button (click)="openExportDialog()">
        <mat-icon>download</mat-icon>
        Exporter
      </button>
    </div>
  `
})
export class DossiersComponent {
  constructor(private dialog: MatDialog) {}

  openImportDialog(): void {
    const dialogRef = this.dialog.open(LeadImportDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(success => {
      if (success) {
        // Refresh your data
        this.loadDossiers();
      }
    });
  }

  openExportDialog(): void {
    this.dialog.open(LeadExportDialogComponent, {
      width: '700px',
      maxWidth: '95vw'
    });
  }

  loadDossiers(): void {
    // Reload your dossier list
  }
}
```

### 3. Add Role-Based Access Control

Restrict access to import/export based on user roles:

```typescript
import { AuthService } from './services/auth.service';

export class DossiersComponent {
  canImportExport = false;

  constructor(
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.canImportExport = this.authService.hasRole(['ADMIN', 'PRO']);
  }
}
```

Template:
```html
<button 
  mat-raised-button 
  color="primary" 
  (click)="openImportDialog()"
  *ngIf="canImportExport">
  <mat-icon>upload_file</mat-icon>
  Importer
</button>
```

### 4. Add Menu Items

Add import/export to your application menu:

```html
<mat-menu #leadMenu="matMenu">
  <button mat-menu-item (click)="openImportDialog()">
    <mat-icon>upload_file</mat-icon>
    <span>Importer des prospects</span>
  </button>
  <button mat-menu-item (click)="openExportDialog()">
    <mat-icon>download</mat-icon>
    <span>Exporter des prospects</span>
  </button>
  <mat-divider></mat-divider>
  <button mat-menu-item (click)="downloadTemplate()">
    <mat-icon>description</mat-icon>
    <span>Télécharger modèle CSV</span>
  </button>
</mat-menu>
```

### 5. Download CSV Template

Provide a template for users:

```typescript
downloadTemplate(): void {
  const templateUrl = '/assets/lead_import_template.csv';
  const link = document.createElement('a');
  link.href = templateUrl;
  link.download = 'lead_import_template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

### 6. Add to Routing (Optional)

If you want dedicated routes:

```typescript
const routes: Routes = [
  {
    path: 'leads/import',
    component: LeadImportPageComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'PRO'] }
  }
];
```

### 7. Customize Dialog Appearance

Add custom styles in your global styles or component:

```css
/* styles.css or component styles */
.lead-import-dialog-container .mat-dialog-container,
.lead-export-dialog-container .mat-dialog-container {
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
}

/* Custom snackbar styles */
.success-snackbar {
  background-color: #4caf50 !important;
  color: white !important;
}

.error-snackbar {
  background-color: #f44336 !important;
  color: white !important;
}

.warning-snackbar {
  background-color: #ff9800 !important;
  color: white !important;
}
```

### 8. Handle Import Success

Reload data after successful import:

```typescript
openImportDialog(): void {
  const dialogRef = this.dialog.open(LeadImportDialogComponent, {
    width: '700px',
    maxWidth: '95vw',
    disableClose: true
  });

  dialogRef.afterClosed().subscribe((success: boolean) => {
    if (success) {
      // Show success message
      this.snackBar.open(
        'Import terminé. Données actualisées.',
        'OK',
        { duration: 3000, panelClass: ['success-snackbar'] }
      );

      // Refresh data
      this.loadDossiers();

      // Optional: Navigate or scroll to new items
      // this.scrollToTop();
    }
  });
}
```

### 9. Add Keyboard Shortcuts (Optional)

```typescript
@HostListener('document:keydown.control.i', ['$event'])
handleImportShortcut(event: KeyboardEvent): void {
  event.preventDefault();
  if (this.canImportExport) {
    this.openImportDialog();
  }
}

@HostListener('document:keydown.control.e', ['$event'])
handleExportShortcut(event: KeyboardEvent): void {
  event.preventDefault();
  if (this.canImportExport) {
    this.openExportDialog();
  }
}
```

### 10. Add Import History View

Create a page to view import history:

```typescript
import { Component, OnInit } from '@angular/core';
import { LeadApiService, ImportJobResponse } from './services/lead-api.service';

@Component({
  selector: 'app-import-history',
  template: `
    <div class="import-history">
      <h2>Historique des imports</h2>
      <table mat-table [dataSource]="importJobs">
        <ng-container matColumnDef="filename">
          <th mat-header-cell *matHeaderCellDef>Fichier</th>
          <td mat-cell *matCellDef="let job">{{ job.filename }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Statut</th>
          <td mat-cell *matCellDef="let job">
            <span [class]="'status-badge ' + job.status.toLowerCase()">
              {{ job.status }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="totalRows">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let job">{{ job.totalRows }}</td>
        </ng-container>

        <ng-container matColumnDef="successCount">
          <th mat-header-cell *matHeaderCellDef>Réussi</th>
          <td mat-cell *matCellDef="let job" class="success-count">
            {{ job.successCount }}
          </td>
        </ng-container>

        <ng-container matColumnDef="errorCount">
          <th mat-header-cell *matHeaderCellDef>Erreurs</th>
          <td mat-cell *matCellDef="let job" class="error-count">
            {{ job.errorCount }}
          </td>
        </ng-container>

        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Date</th>
          <td mat-cell *matCellDef="let job">
            {{ job.createdAt | date:'short' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let job">
            <button mat-icon-button (click)="viewDetails(job)">
              <mat-icon>visibility</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .import-history {
      padding: 24px;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.completed {
      background-color: #c8e6c9;
      color: #2e7d32;
    }

    .status-badge.failed {
      background-color: #ffcdd2;
      color: #c62828;
    }

    .status-badge.in_progress {
      background-color: #fff9c4;
      color: #f57f17;
    }

    .success-count {
      color: #4caf50;
      font-weight: 500;
    }

    .error-count {
      color: #f44336;
      font-weight: 500;
    }
  `]
})
export class ImportHistoryComponent implements OnInit {
  importJobs: ImportJobResponse[] = [];
  displayedColumns = ['filename', 'status', 'totalRows', 'successCount', 'errorCount', 'createdAt', 'actions'];

  constructor(
    private leadApiService: LeadApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadImportHistory();
  }

  loadImportHistory(): void {
    this.leadApiService.getImportHistory().subscribe({
      next: (jobs) => {
        this.importJobs = jobs;
      },
      error: (err) => {
        console.error('Failed to load import history', err);
      }
    });
  }

  viewDetails(job: ImportJobResponse): void {
    // Open dialog with job details
    this.dialog.open(ImportJobDetailsDialogComponent, {
      data: job,
      width: '600px'
    });
  }
}
```

## Common Customizations

### Change Dialog Size

```typescript
this.dialog.open(LeadImportDialogComponent, {
  width: '800px',  // Larger width
  height: '90vh',  // Fixed height
  maxWidth: '95vw' // Responsive
});
```

### Pre-select Export Columns

To pre-configure export columns, you can pass data to the dialog:

```typescript
// Note: Current implementation doesn't accept data, but you can modify it
this.dialog.open(LeadExportDialogComponent, {
  data: {
    preselectedColumns: ['id', 'name', 'phone', 'email'],
    defaultFilters: {
      status: 'NEW',
      source: 'WEB'
    }
  },
  width: '700px'
});
```

### Custom Success/Error Handling

```typescript
dialogRef.afterClosed().subscribe((success: boolean) => {
  if (success) {
    // Custom success action
    this.analyticsService.trackEvent('lead_import_success');
    this.notificationService.showSuccess('Import réussi');
    this.router.navigate(['/leads']);
  } else {
    // User cancelled
    this.notificationService.showInfo('Import annulé');
  }
});
```

## Testing

### Unit Tests

```typescript
describe('DossiersComponent', () => {
  let component: DossiersComponent;
  let fixture: ComponentFixture<DossiersComponent>;
  let dialog: MatDialog;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DossiersComponent ],
      imports: [ MatDialogModule, HttpClientTestingModule ],
      providers: [ MatDialog ]
    }).compileComponents();

    fixture = TestBed.createComponent(DossiersComponent);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
  });

  it('should open import dialog', () => {
    const dialogSpy = spyOn(dialog, 'open');
    component.openImportDialog();
    expect(dialogSpy).toHaveBeenCalledWith(
      LeadImportDialogComponent,
      jasmine.objectContaining({ width: '700px' })
    );
  });

  it('should reload data after successful import', fakeAsync(() => {
    spyOn(component, 'loadDossiers');
    const dialogRef = dialog.open(LeadImportDialogComponent);
    component.openImportDialog();
    
    // Simulate dialog close with success
    dialogRef.close(true);
    tick();
    
    expect(component.loadDossiers).toHaveBeenCalled();
  }));
});
```

## Troubleshooting

### Dialog Not Opening

Check that:
1. `MatDialogModule` is imported in your module
2. Component is declared in module
3. No console errors related to missing dependencies

### Import/Export Not Working

Check that:
1. Backend endpoints are accessible
2. Authentication token is valid
3. User has required roles (ADMIN or PRO)
4. CORS is configured correctly

### File Upload Fails

Check:
1. File size < 10 MB
2. File is valid CSV format
3. CSV has required columns (name, phone, source)
4. Backend multipart config allows file uploads

## Best Practices

1. **Always validate user permissions** before showing import/export buttons
2. **Refresh data** after successful import
3. **Provide clear feedback** using snackbars or notifications
4. **Handle errors gracefully** with user-friendly messages
5. **Offer CSV template** download for users
6. **Log import/export actions** for audit trail
7. **Consider large file handling** for production (async processing)

## Production Considerations

1. **File Size Limits**: Adjust based on server capacity
2. **Rate Limiting**: Prevent abuse with rate limits
3. **Background Processing**: Use job queues for large imports
4. **Progress Tracking**: Implement WebSocket for real-time progress
5. **Error Notifications**: Email admins for failed imports
6. **Audit Logging**: Log all import/export operations
7. **Data Validation**: Additional server-side validation
8. **Backup**: Backup data before bulk imports

## Support

For issues or questions:
- Check the LEAD_IMPORT_EXPORT_README.md
- Review browser console for errors
- Check network tab for API failures
- Contact development team for assistance
