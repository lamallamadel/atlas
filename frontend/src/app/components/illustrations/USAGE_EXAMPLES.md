# Illustration Library - Usage Examples

Complete examples of how to use the illustration library in different scenarios.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Empty State Integration](#empty-state-integration)
3. [Standalone Display](#standalone-display)
4. [Custom Implementations](#custom-implementations)
5. [Advanced Scenarios](#advanced-scenarios)

## Basic Usage

### Getting an Illustration

```typescript
import { Component } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { IllustrationLibraryService } from '../components/illustrations';

@Component({
  selector: 'app-example',
  template: `
    <div class="illustration-container">
      <div [innerHTML]="illustration"></div>
    </div>
  `
})
export class ExampleComponent {
  illustration: SafeHtml;

  constructor(private illustrationService: IllustrationLibraryService) {
    // Get by name
    this.illustration = this.illustrationService.getIllustration('dossier');
  }
}
```

### Get by Context

```typescript
constructor(private illustrationService: IllustrationLibraryService) {
  // Get by context enum
  this.illustration = this.illustrationService.getIllustrationByContext('NO_DOSSIERS');
}
```

### List All Available Illustrations

```typescript
import { IllustrationLibraryItem } from '../components/illustrations';

@Component({
  selector: 'app-illustration-gallery',
  template: `
    <div class="gallery">
      <div *ngFor="let item of illustrations" class="gallery-item">
        <div [innerHTML]="getIllustration(item.name)"></div>
        <h3>{{ item.name }}</h3>
        <p>{{ item.description }}</p>
      </div>
    </div>
  `
})
export class IllustrationGalleryComponent {
  illustrations: IllustrationLibraryItem[];

  constructor(private illustrationService: IllustrationLibraryService) {
    this.illustrations = this.illustrationService.getAllIllustrations();
  }

  getIllustration(name: string): SafeHtml {
    return this.illustrationService.getIllustration(name)!;
  }
}
```

## Empty State Integration

### Simple Empty State

```typescript
import { Component } from '@angular/core';
import { EmptyStateContext } from '../services/empty-state-illustrations.service';

@Component({
  selector: 'app-dossier-list',
  template: `
    <div *ngIf="dossiers.length === 0">
      <app-empty-state 
        [context]="EmptyStateContext.NO_DOSSIERS"
        [isNewUser]="isNewUser"
        [primaryAction]="primaryAction">
      </app-empty-state>
    </div>

    <div *ngIf="dossiers.length > 0">
      <!-- List content -->
    </div>
  `
})
export class DossierListComponent {
  EmptyStateContext = EmptyStateContext;
  dossiers: any[] = [];
  isNewUser = false;

  primaryAction = {
    label: 'Nouveau dossier',
    icon: 'add_circle',
    handler: () => this.createDossier()
  };

  createDossier() {
    // Handle creation
  }
}
```

### Empty State with Filter Detection

```typescript
@Component({
  selector: 'app-filtered-list',
  template: `
    <app-empty-state 
      [context]="hasFilters ? EmptyStateContext.NO_DOSSIERS_FILTERED : EmptyStateContext.NO_DOSSIERS"
      [primaryAction]="primaryAction"
      [secondaryAction]="secondaryAction">
    </app-empty-state>
  `
})
export class FilteredListComponent {
  EmptyStateContext = EmptyStateContext;
  hasFilters = false;

  primaryAction = {
    label: this.hasFilters ? 'Réinitialiser les filtres' : 'Nouveau dossier',
    icon: this.hasFilters ? 'filter_alt_off' : 'add_circle',
    handler: () => this.hasFilters ? this.resetFilters() : this.create()
  };

  secondaryAction = {
    label: 'Nouveau dossier',
    icon: 'add',
    handler: () => this.create()
  };

  resetFilters() {
    this.hasFilters = false;
    // Reset filter logic
  }

  create() {
    // Create logic
  }
}
```

### Empty State with Help Link

```typescript
@Component({
  selector: 'app-documents-list',
  template: `
    <app-empty-state 
      [context]="EmptyStateContext.NO_DOCUMENTS"
      [primaryAction]="primaryAction"
      [helpLink]="helpLink">
    </app-empty-state>
  `
})
export class DocumentsListComponent {
  EmptyStateContext = EmptyStateContext;

  primaryAction = {
    label: 'Ajouter un document',
    icon: 'upload_file',
    handler: () => this.uploadDocument()
  };

  helpLink = {
    label: 'Types de documents acceptés',
    url: '/aide/documents'
  };

  uploadDocument() {
    // Upload logic
  }
}
```

## Standalone Display

### Loading Error State

```typescript
@Component({
  selector: 'app-data-loader',
  template: `
    <div *ngIf="isLoading">
      <app-loading-skeleton></app-loading-skeleton>
    </div>

    <div *ngIf="error">
      <app-empty-state 
        [context]="EmptyStateContext.NETWORK_ERROR"
        [primaryAction]="retryAction">
      </app-empty-state>
    </div>

    <div *ngIf="!isLoading && !error && data">
      <!-- Success content -->
    </div>
  `
})
export class DataLoaderComponent {
  EmptyStateContext = EmptyStateContext;
  isLoading = false;
  error = false;
  data: any = null;

  retryAction = {
    label: 'Réessayer',
    icon: 'refresh',
    handler: () => this.loadData()
  };

  loadData() {
    this.isLoading = true;
    this.error = false;
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.error = Math.random() > 0.5; // 50% error rate for demo
      if (!this.error) {
        this.data = { /* loaded data */ };
      }
    }, 2000);
  }
}
```

### Success Feedback

```typescript
@Component({
  selector: 'app-import-wizard',
  template: `
    <div *ngIf="!isImporting && !importSuccess">
      <!-- Import form -->
    </div>

    <div *ngIf="isImporting">
      <app-loading-skeleton></app-loading-skeleton>
    </div>

    <div *ngIf="importSuccess">
      <app-empty-state 
        [context]="EmptyStateContext.IMPORT_SUCCESS"
        [primaryAction]="viewAction">
      </app-empty-state>
    </div>
  `
})
export class ImportWizardComponent {
  EmptyStateContext = EmptyStateContext;
  isImporting = false;
  importSuccess = false;

  viewAction = {
    label: 'Voir les données importées',
    icon: 'visibility',
    handler: () => this.viewImportedData()
  };

  async importData(file: File) {
    this.isImporting = true;
    
    try {
      // Import logic
      await this.uploadService.import(file);
      this.isImporting = false;
      this.importSuccess = true;
    } catch (error) {
      this.isImporting = false;
      // Show error
    }
  }

  viewImportedData() {
    this.router.navigate(['/data']);
  }
}
```

### Maintenance Mode

```typescript
@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="maintenanceMode">
      <app-empty-state 
        [context]="EmptyStateContext.MAINTENANCE"
        [helpLink]="statusLink">
      </app-empty-state>
    </div>

    <div *ngIf="!maintenanceMode">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent {
  EmptyStateContext = EmptyStateContext;
  maintenanceMode = false;

  statusLink = {
    label: 'État du service',
    url: 'https://status.example.com'
  };

  ngOnInit() {
    // Check maintenance mode from API
    this.checkMaintenanceMode();
  }

  checkMaintenanceMode() {
    this.apiService.getStatus().subscribe(
      status => this.maintenanceMode = status.maintenance
    );
  }
}
```

## Custom Implementations

### Custom Size

```typescript
@Component({
  selector: 'app-small-empty-state',
  template: `
    <div class="small-empty-state">
      <div [innerHTML]="illustration" class="small-illustration"></div>
      <p>{{ message }}</p>
    </div>
  `,
  styles: [`
    .small-illustration {
      width: 120px;
      height: 120px;
      margin: 0 auto;
    }

    .small-illustration ::ng-deep svg {
      width: 100%;
      height: 100%;
    }
  `]
})
export class SmallEmptyStateComponent {
  @Input() illustrationName: string = 'dossier';
  @Input() message: string = '';

  illustration: SafeHtml;

  constructor(private illustrationService: IllustrationLibraryService) {}

  ngOnInit() {
    this.illustration = this.illustrationService.getIllustration(this.illustrationName)!;
  }
}
```

### Disable Animations

```typescript
@Component({
  selector: 'app-static-empty-state',
  template: `
    <div class="no-animation" [innerHTML]="illustration"></div>
  `,
  styles: [`
    .no-animation ::ng-deep * {
      animation: none !important;
    }
  `]
})
export class StaticEmptyStateComponent {
  illustration: SafeHtml;

  constructor(private illustrationService: IllustrationLibraryService) {
    this.illustration = this.illustrationService.getIllustration('message')!;
  }
}
```

### Custom Colors (Override)

```typescript
@Component({
  selector: 'app-branded-empty-state',
  template: `
    <div [innerHTML]="illustration" class="branded-illustration"></div>
  `,
  styles: [`
    .branded-illustration ::ng-deep svg stop[style*="#667eea"] {
      stop-color: #your-brand-color !important;
    }

    .branded-illustration ::ng-deep svg [fill="#48bb78"] {
      fill: #your-accent-color !important;
    }
  `]
})
export class BrandedEmptyStateComponent {
  // Custom color implementation
}
```

## Advanced Scenarios

### Conditional Illustration Selection

```typescript
@Component({
  selector: 'app-smart-empty-state',
  template: `
    <app-empty-state 
      [context]="getContext()"
      [primaryAction]="getPrimaryAction()">
    </app-empty-state>
  `
})
export class SmartEmptyStateComponent {
  @Input() items: any[] = [];
  @Input() isFiltered: boolean = false;
  @Input() hasError: boolean = false;
  @Input() isNewUser: boolean = false;

  EmptyStateContext = EmptyStateContext;

  getContext(): EmptyStateContext {
    if (this.hasError) {
      return EmptyStateContext.NETWORK_ERROR;
    }
    
    if (this.items.length === 0) {
      return this.isFiltered 
        ? EmptyStateContext.NO_DOSSIERS_FILTERED 
        : EmptyStateContext.NO_DOSSIERS;
    }

    return EmptyStateContext.NO_DATA;
  }

  getPrimaryAction() {
    if (this.hasError) {
      return { label: 'Réessayer', icon: 'refresh', handler: () => this.retry() };
    }

    if (this.isFiltered) {
      return { label: 'Réinitialiser', icon: 'filter_alt_off', handler: () => this.reset() };
    }

    return { label: 'Créer', icon: 'add', handler: () => this.create() };
  }

  retry() { /* retry logic */ }
  reset() { /* reset logic */ }
  create() { /* create logic */ }
}
```

### Animation on State Change

```typescript
@Component({
  selector: 'app-animated-transition',
  template: `
    <div [@fadeInOut]="state">
      <app-empty-state 
        *ngIf="isEmpty"
        [context]="context"
        [primaryAction]="action">
      </app-empty-state>

      <div *ngIf="!isEmpty">
        <!-- Content -->
      </div>
    </div>
  `,
  animations: [
    trigger('fadeInOut', [
      state('void', style({ opacity: 0, transform: 'translateY(20px)' })),
      state('*', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void <=> *', animate('400ms ease-out'))
    ])
  ]
})
export class AnimatedTransitionComponent {
  isEmpty = true;
  context = EmptyStateContext.NO_DOSSIERS;

  state = 'visible';

  toggleState() {
    this.state = this.state === 'visible' ? 'void' : 'visible';
  }
}
```

### Illustration in Dialog

```typescript
@Component({
  selector: 'app-delete-confirmation-dialog',
  template: `
    <h2 mat-dialog-title>Confirmer la suppression</h2>
    
    <mat-dialog-content>
      <div class="dialog-illustration" [innerHTML]="illustration"></div>
      <p>Êtes-vous sûr de vouloir supprimer cet élément ?</p>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-button (click)="onCancel()">Annuler</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">Supprimer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-illustration {
      width: 100px;
      height: 100px;
      margin: 0 auto 16px;
    }
  `]
})
export class DeleteConfirmationDialogComponent {
  illustration: SafeHtml;

  constructor(
    private dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>,
    private illustrationService: IllustrationLibraryService
  ) {
    this.illustration = this.illustrationService.getIllustration('document')!;
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  onConfirm() {
    this.dialogRef.close(true);
  }
}
```

### Responsive Illustration Size

```typescript
@Component({
  selector: 'app-responsive-empty-state',
  template: `
    <div class="responsive-empty-state" [innerHTML]="illustration"></div>
  `,
  styles: [`
    .responsive-empty-state ::ng-deep svg {
      width: 200px;
      height: 200px;
    }

    @media (max-width: 768px) {
      .responsive-empty-state ::ng-deep svg {
        width: 150px;
        height: 150px;
      }
    }

    @media (max-width: 480px) {
      .responsive-empty-state ::ng-deep svg {
        width: 120px;
        height: 120px;
      }
    }
  `]
})
export class ResponsiveEmptyStateComponent {
  illustration: SafeHtml;

  constructor(private illustrationService: IllustrationLibraryService) {
    this.illustration = this.illustrationService.getIllustration('annonce')!;
  }
}
```

## Tips and Best Practices

1. **Always use DomSanitizer**: The service already handles this, but if you're working with raw SVG, always sanitize.

2. **Respect reduced motion**: The illustrations automatically disable animations for users who prefer reduced motion.

3. **Choose the right context**: Use specific contexts (e.g., `NO_DOSSIERS_FILTERED`) instead of generic ones for better UX.

4. **Provide actions**: Empty states should always have at least one action to help users proceed.

5. **Keep it simple**: Don't overuse illustrations - they should enhance, not overwhelm.

6. **Test accessibility**: Ensure screen readers can access the title and message, not just the illustration.

7. **Consider loading states**: Show a skeleton or spinner before showing an empty state.

8. **Maintain consistency**: Use the same illustration for the same context throughout your app.

## Related Documentation

- [Illustration Library README](./ILLUSTRATION_LIBRARY_README.md)
- [Empty State Component](../EMPTY_STATE_README.md)
- [Empty State Illustrations Service](../../services/empty-state-illustrations.service.ts)
