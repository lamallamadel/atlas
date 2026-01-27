# SpinnerComponent - Usage Examples

## Real-World Scenarios

### 1. Page-Level Loading State

**Scenario**: Show a loading spinner while fetching initial page data.

```typescript
// page.component.ts
export class MyPageComponent implements OnInit {
  isLoading = true;
  data: any[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.dataService.getData().subscribe({
      next: (data) => {
        this.data = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
```

```html
<!-- page.component.html -->
<div class="page-container">
  <div *ngIf="isLoading" class="loading-overlay">
    <app-spinner
      variant="circular"
      size="lg"
      color="primary"
      message="Chargement des données..."
      [timeout]="5000"
      timeoutMessage="Le chargement prend plus de temps que prévu...">
    </app-spinner>
  </div>

  <div *ngIf="!isLoading">
    <!-- Your content here -->
  </div>
</div>
```

```css
/* page.component.css */
.loading-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 2rem;
}
```

---

### 2. Button Loading State

**Scenario**: Show inline spinner in a submit button.

```typescript
// form.component.ts
export class MyFormComponent {
  isSubmitting = false;

  onSubmit(): void {
    this.isSubmitting = true;
    
    this.formService.submit(this.form.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.snackBar.open('Formulaire envoyé avec succès', 'OK', { duration: 3000 });
      },
      error: () => {
        this.isSubmitting = false;
        this.snackBar.open('Erreur lors de l\'envoi', 'OK', { duration: 3000 });
      }
    });
  }
}
```

```html
<!-- form.component.html -->
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <!-- Form fields -->
  
  <button 
    type="submit" 
    class="submit-button" 
    [disabled]="isSubmitting || form.invalid">
    <app-spinner 
      *ngIf="isSubmitting"
      variant="circular" 
      size="sm" 
      color="white">
    </app-spinner>
    <span [style.margin-left]="isSubmitting ? '8px' : '0'">
      {{ isSubmitting ? 'Envoi...' : 'Envoyer' }}
    </span>
  </button>
</form>
```

```css
/* form.component.css */
.submit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  background-color: var(--color-primary-500);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

### 3. File Upload with Cancel

**Scenario**: Upload a file with ability to cancel.

```typescript
// upload.component.ts
export class UploadComponent {
  isUploading = false;
  uploadProgress = 0;
  private uploadSubscription?: Subscription;

  onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  uploadFile(file: File): void {
    this.isUploading = true;
    this.uploadProgress = 0;

    this.uploadSubscription = this.fileService
      .upload(file)
      .pipe(
        finalize(() => {
          this.isUploading = false;
        })
      )
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total!);
          } else if (event.type === HttpEventType.Response) {
            this.snackBar.open('Fichier téléchargé avec succès', 'OK', { duration: 3000 });
          }
        },
        error: () => {
          this.snackBar.open('Erreur lors du téléchargement', 'OK', { duration: 3000 });
        }
      });
  }

  cancelUpload(): void {
    if (this.uploadSubscription) {
      this.uploadSubscription.unsubscribe();
      this.isUploading = false;
      this.snackBar.open('Téléchargement annulé', 'OK', { duration: 2000 });
    }
  }
}
```

```html
<!-- upload.component.html -->
<input 
  type="file" 
  (change)="onFileSelect($event)" 
  [disabled]="isUploading">

<div *ngIf="isUploading" class="upload-overlay">
  <app-spinner
    variant="circular"
    size="lg"
    color="primary"
    [message]="'Téléchargement en cours... ' + uploadProgress + '%'"
    [showCancelButton]="true"
    cancelButtonLabel="Annuler le téléchargement"
    [timeout]="10000"
    timeoutMessage="Le fichier est volumineux, cela peut prendre du temps..."
    (cancel)="cancelUpload()">
  </app-spinner>
</div>
```

---

### 4. Search with Debounce

**Scenario**: Show spinner during search with debounced input.

```typescript
// search.component.ts
export class SearchComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  isSearching = false;
  results: any[] = [];
  private destroy$ = new Subject<void>();

  constructor(private searchService: SearchService) {}

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => {
          this.isSearching = true;
        }),
        switchMap(query => 
          this.searchService.search(query).pipe(
            catchError(() => of([]))
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(results => {
        this.results = results;
        this.isSearching = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

```html
<!-- search.component.html -->
<div class="search-container">
  <input 
    type="text" 
    [formControl]="searchControl" 
    placeholder="Rechercher...">
  
  <div class="search-spinner">
    <app-spinner 
      *ngIf="isSearching"
      variant="dots" 
      size="sm" 
      color="primary">
    </app-spinner>
  </div>
</div>

<div class="results">
  <div *ngFor="let result of results">
    {{ result.name }}
  </div>
</div>
```

---

### 5. Dialog Loading State

**Scenario**: Show spinner in Material Dialog while loading data.

```typescript
// dialog.component.ts
@Component({
  selector: 'app-detail-dialog',
  template: `
    <h2 mat-dialog-title>Détails</h2>
    <mat-dialog-content>
      <div *ngIf="isLoading; else content">
        <app-spinner
          variant="circular"
          size="md"
          color="primary"
          message="Chargement des détails...">
        </app-spinner>
      </div>
      
      <ng-template #content>
        <div>{{ data | json }}</div>
      </ng-template>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `
})
export class DetailDialogComponent implements OnInit {
  isLoading = true;
  data: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) private id: number,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.dataService.getDetails(this.id).subscribe({
      next: (data) => {
        this.data = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
```

---

### 6. Full-Screen Overlay

**Scenario**: Block entire screen during critical operation.

```typescript
// critical-operation.component.ts
export class CriticalOperationComponent {
  isProcessing = false;

  startCriticalOperation(): void {
    this.isProcessing = true;

    this.operationService.performCriticalTask()
      .pipe(
        timeout(30000),
        catchError(error => {
          this.snackBar.open('Opération échouée', 'OK', { duration: 3000 });
          return throwError(() => error);
        }),
        finalize(() => {
          this.isProcessing = false;
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Opération réussie', 'OK', { duration: 3000 });
        }
      });
  }
}
```

```html
<!-- critical-operation.component.html -->
<button (click)="startCriticalOperation()">Démarrer</button>

<div *ngIf="isProcessing" class="fullscreen-overlay">
  <app-spinner
    variant="circular"
    size="lg"
    color="white"
    message="Traitement en cours..."
    [timeout]="15000"
    timeoutMessage="Cette opération prend plus de temps que prévu. Veuillez patienter...">
  </app-spinner>
</div>
```

```css
/* critical-operation.component.css */
.fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
```

---

### 7. Lazy-Loaded Module

**Scenario**: Show spinner while lazy-loading a module.

```typescript
// app-routing.module.ts
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  }
];

// app.component.ts
export class AppComponent {
  isLoadingModule = false;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof RouteConfigLoadStart) {
        this.isLoadingModule = true;
      } else if (
        event instanceof RouteConfigLoadEnd ||
        event instanceof NavigationError
      ) {
        this.isLoadingModule = false;
      }
    });
  }
}
```

```html
<!-- app.component.html -->
<div *ngIf="isLoadingModule" class="module-loading">
  <app-spinner
    variant="linear"
    size="md"
    color="primary"
    message="Chargement du module...">
  </app-spinner>
</div>

<router-outlet></router-outlet>
```

---

### 8. Multi-Step Process

**Scenario**: Show different spinner variants for different steps.

```typescript
// multi-step.component.ts
export class MultiStepComponent {
  currentStep = 0;
  steps = [
    { name: 'Validation', variant: 'circular', message: 'Validation des données...' },
    { name: 'Processing', variant: 'linear', message: 'Traitement...' },
    { name: 'Finalizing', variant: 'dots', message: 'Finalisation...' }
  ];

  startProcess(): void {
    this.processStep(0);
  }

  private processStep(step: number): void {
    this.currentStep = step;

    this.stepService.execute(step).subscribe({
      next: () => {
        if (step < this.steps.length - 1) {
          this.processStep(step + 1);
        } else {
          this.currentStep = -1;
          this.snackBar.open('Processus terminé', 'OK', { duration: 3000 });
        }
      },
      error: () => {
        this.currentStep = -1;
        this.snackBar.open('Erreur', 'OK', { duration: 3000 });
      }
    });
  }
}
```

```html
<!-- multi-step.component.html -->
<div *ngIf="currentStep >= 0" class="process-container">
  <app-spinner
    [variant]="steps[currentStep].variant"
    size="lg"
    color="primary"
    [message]="steps[currentStep].message">
  </app-spinner>
</div>
```

---

### 9. Table Row Loading

**Scenario**: Show inline spinner while loading specific table row data.

```typescript
// table.component.ts
export class TableComponent {
  loadingRows = new Set<number>();

  loadRowDetails(rowId: number): void {
    this.loadingRows.add(rowId);

    this.dataService.getRowDetails(rowId).subscribe({
      next: (details) => {
        this.loadingRows.delete(rowId);
        // Update row data
      },
      error: () => {
        this.loadingRows.delete(rowId);
      }
    });
  }

  isRowLoading(rowId: number): boolean {
    return this.loadingRows.has(rowId);
  }
}
```

```html
<!-- table.component.html -->
<table>
  <tr *ngFor="let row of rows">
    <td>{{ row.name }}</td>
    <td>
      <button (click)="loadRowDetails(row.id)">
        <app-spinner 
          *ngIf="isRowLoading(row.id)"
          variant="circular"
          size="sm"
          color="primary">
        </app-spinner>
        <span *ngIf="!isRowLoading(row.id)">Charger</span>
      </button>
    </td>
  </tr>
</table>
```

---

### 10. Infinite Scroll Loading

**Scenario**: Show spinner at bottom while loading more items.

```typescript
// infinite-scroll.component.ts
export class InfiniteScrollComponent implements OnInit {
  items: any[] = [];
  isLoadingMore = false;
  page = 0;
  hasMore = true;

  ngOnInit(): void {
    this.loadMore();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= documentHeight - 100 && !this.isLoadingMore && this.hasMore) {
      this.loadMore();
    }
  }

  loadMore(): void {
    this.isLoadingMore = true;

    this.dataService.getItems(this.page).subscribe({
      next: (newItems) => {
        this.items = [...this.items, ...newItems];
        this.page++;
        this.hasMore = newItems.length > 0;
        this.isLoadingMore = false;
      },
      error: () => {
        this.isLoadingMore = false;
      }
    });
  }
}
```

```html
<!-- infinite-scroll.component.html -->
<div class="items-container">
  <div *ngFor="let item of items" class="item">
    {{ item.name }}
  </div>

  <div *ngIf="isLoadingMore" class="loading-more">
    <app-spinner
      variant="dots"
      size="md"
      color="primary"
      message="Chargement...">
    </app-spinner>
  </div>

  <div *ngIf="!hasMore" class="end-message">
    Toutes les données ont été chargées
  </div>
</div>
```

---

## Summary

These examples demonstrate:

1. ✅ Page-level loading states
2. ✅ Button loading states
3. ✅ Cancellable operations
4. ✅ Debounced search
5. ✅ Dialog loading
6. ✅ Full-screen overlays
7. ✅ Lazy-loaded modules
8. ✅ Multi-step processes
9. ✅ Table row loading
10. ✅ Infinite scroll

**Key Takeaways:**
- Use appropriate variant for context
- Choose size based on UI importance
- Add messages for better UX
- Use timeout for long operations
- Enable cancel for user control
- Match color to background
