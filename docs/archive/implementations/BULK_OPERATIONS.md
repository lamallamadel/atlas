# Bulk Operations API

This document describes the bulk operations API endpoints and their usage in both the backend and frontend.

## Backend API Endpoints

### 1. Bulk Update Annonces

**Endpoint:** `POST /api/v1/annonces/bulk-update`

**Description:** Updates multiple annonces with the provided changes (status and/or city).

**Request Body:**
```json
{
  "ids": [1, 2, 3, 4, 5],
  "updates": {
    "status": "ACTIVE",
    "city": "Paris"
  }
}
```

**Response:**
```json
{
  "successCount": 4,
  "failureCount": 1,
  "errors": [
    {
      "id": 3,
      "message": "Cannot update an archived annonce"
    }
  ]
}
```

**Validation:**
- `ids` cannot be empty
- Updates can include `status` (AnnonceStatus enum) and/or `city` (String)
- Archived annonces cannot be updated
- Organization ID is validated for each annonce

**Security:** Requires `ADMIN` or `PRO` role

---

### 2. Bulk Assign Dossier Status

**Endpoint:** `POST /api/v1/dossiers/bulk-assign`

**Description:** Updates the status of multiple dossiers with validation and status history tracking.

**Request Body:**
```json
{
  "ids": [10, 11, 12],
  "status": "QUALIFIED",
  "reason": "Bulk qualification after initial review",
  "userId": "user123"
}
```

**Response:**
```json
{
  "successCount": 2,
  "failureCount": 1,
  "errors": [
    {
      "id": 12,
      "message": "Invalid transition from WON to QUALIFIED"
    }
  ]
}
```

**Validation:**
- `ids` cannot be empty
- `status` is required (DossierStatus enum)
- Status transitions are validated using DossierStatusTransitionService
- Each successful status change is recorded in the status history
- Organization ID is validated for each dossier

**Security:** Requires `ADMIN` or `PRO` role

---

## Frontend Services

### AnnonceApiService

Direct API service methods:

```typescript
import { AnnonceApiService, AnnonceBulkUpdateRequest, AnnonceStatus } from './services/annonce-api.service';

// Inject the service
constructor(private annonceApi: AnnonceApiService) {}

// Call bulk update
const request: AnnonceBulkUpdateRequest = {
  ids: [1, 2, 3],
  updates: {
    status: AnnonceStatus.ACTIVE,
    city: 'Lyon'
  }
};

this.annonceApi.bulkUpdate(request).subscribe(response => {
  console.log(`Success: ${response.successCount}, Failures: ${response.failureCount}`);
  console.log('Errors:', response.errors);
});
```

### DossierApiService

Direct API service methods:

```typescript
import { DossierApiService, DossierBulkAssignRequest, DossierStatus } from './services/dossier-api.service';

// Inject the service
constructor(private dossierApi: DossierApiService) {}

// Call bulk assign
const request: DossierBulkAssignRequest = {
  ids: [10, 11, 12],
  status: DossierStatus.QUALIFIED,
  reason: 'Bulk qualification',
  userId: 'user123'
};

this.dossierApi.bulkAssign(request).subscribe(response => {
  console.log(`Success: ${response.successCount}, Failures: ${response.failureCount}`);
  console.log('Errors:', response.errors);
});
```

---

## Frontend Bulk Services with Progress Feedback

### AnnonceBulkService

High-level service with automatic progress dialog:

```typescript
import { AnnonceBulkService } from './services/annonce-bulk.service';
import { AnnonceStatus } from './services/annonce-api.service';

// Inject the service
constructor(private annonceBulk: AnnonceBulkService) {}

// Example 1: Update status only
updateSelectedAnnoncesStatus(selectedIds: number[], newStatus: AnnonceStatus) {
  this.annonceBulk.bulkUpdateStatus(selectedIds, newStatus)
    .subscribe(result => {
      // Result is shown in dialog automatically
      // Additional logic if needed
      this.refreshAnnoncesList();
    });
}

// Example 2: Update city only
updateSelectedAnnoncesCity(selectedIds: number[], newCity: string) {
  this.annonceBulk.bulkUpdateCity(selectedIds, newCity)
    .subscribe(result => {
      this.refreshAnnoncesList();
    });
}

// Example 3: Update both status and city
updateSelectedAnnonces(selectedIds: number[]) {
  this.annonceBulk.bulkUpdate(selectedIds, {
    status: AnnonceStatus.PUBLISHED,
    city: 'Marseille'
  }).subscribe(result => {
    this.refreshAnnoncesList();
  });
}
```

### DossierBulkService

High-level service with automatic progress dialog:

```typescript
import { DossierBulkService } from './services/dossier-bulk.service';
import { DossierStatus } from './services/dossier-api.service';

// Inject the service
constructor(private dossierBulk: DossierBulkService) {}

// Example: Bulk assign status with validation
assignStatusToSelectedDossiers(
  selectedIds: number[], 
  newStatus: DossierStatus,
  reason?: string
) {
  this.dossierBulk.bulkAssignStatus(selectedIds, newStatus, reason, 'currentUserId')
    .subscribe(result => {
      // Result is shown in dialog automatically with progress bar
      // Additional logic if needed
      this.refreshDossiersList();
    });
}
```

---

## Progress Dialog Component

The `BulkOperationDialogComponent` provides visual feedback:

1. **During Operation:**
   - Shows an indeterminate progress bar (MatProgressBar)
   - Displays the operation title and message
   - Close button is disabled

2. **After Completion:**
   - Progress bar disappears
   - Shows success count with green check icon
   - Shows failure count with red error icon (if any failures)
   - Lists detailed errors with IDs and messages
   - Close button becomes enabled

The dialog is automatically opened and updated by the `BulkOperationService`.

---

## Usage in Components

Example integration in a list component:

```typescript
import { Component } from '@angular/core';
import { AnnonceBulkService } from './services/annonce-bulk.service';
import { AnnonceStatus } from './services/annonce-api.service';

@Component({
  selector: 'app-annonces-list',
  template: `
    <div>
      <!-- Selection and bulk action buttons -->
      <button (click)="bulkActivate()" 
              [disabled]="selectedIds.length === 0">
        Activer la sélection
      </button>
      
      <!-- Your table/list here -->
    </div>
  `
})
export class AnnoncesListComponent {
  selectedIds: number[] = [];

  constructor(private annonceBulk: AnnonceBulkService) {}

  bulkActivate() {
    if (this.selectedIds.length === 0) return;
    
    this.annonceBulk.bulkUpdateStatus(this.selectedIds, AnnonceStatus.ACTIVE)
      .subscribe(() => {
        this.selectedIds = [];
        this.loadAnnonces();
      });
  }
}
```

---

## Error Handling

All bulk operations:
- Continue processing remaining items even if some fail
- Return detailed error information for each failed item
- Use transactions at the individual item level
- Validate organization ID for multi-tenant isolation
- Validate business rules (e.g., status transitions for dossiers)

Example error response:
```json
{
  "successCount": 7,
  "failureCount": 3,
  "errors": [
    {
      "id": 5,
      "message": "Annonce not found with id: 5"
    },
    {
      "id": 8,
      "message": "Cannot update an archived annonce"
    },
    {
      "id": 12,
      "message": "Invalid transition from WON to NEW"
    }
  ]
}
```
