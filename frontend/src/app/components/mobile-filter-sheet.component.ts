import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';

export interface MobileFilterData {
  filters: Record<string, unknown>;
  config: FilterConfig[];
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'autocomplete';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

@Component({
  selector: 'app-mobile-filter-sheet',
  template: `
    <div class="mobile-filter-sheet">
      <div class="sheet-header">
        <h3>Filtres</h3>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="sheet-content">
        <div *ngFor="let filter of config" class="filter-group">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ filter.label }}</mat-label>
            
            <input
              *ngIf="filter.type === 'text'"
              matInput
              [placeholder]="filter.placeholder || ''"
              [(ngModel)]="filters[filter.key]"
            />
            
            <mat-select
              *ngIf="filter.type === 'select'"
              [(ngModel)]="filters[filter.key]"
            >
              <mat-option [value]="''">Tous</mat-option>
              <mat-option
                *ngFor="let option of filter.options"
                [value]="option.value"
              >
                {{ option.label }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>
      
      <div class="sheet-actions">
        <button mat-button (click)="reset()">Réinitialiser</button>
        <button mat-raised-button color="primary" (click)="apply()">
          Appliquer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .mobile-filter-sheet {
      padding: var(--spacing-4);
      min-height: 60vh;
      display: flex;
      flex-direction: column;
    }
    
    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-4);
    }
    
    .sheet-header h3 {
      margin: 0;
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
    }
    
    .sheet-content {
      flex: 1;
      overflow-y: auto;
    }
    
    .filter-group {
      margin-bottom: var(--spacing-3);
    }
    
    .full-width {
      width: 100%;
    }
    
    .sheet-actions {
      display: flex;
      gap: var(--spacing-3);
      margin-top: var(--spacing-4);
      padding-top: var(--spacing-4);
      border-top: 1px solid var(--color-neutral-200);
    }
    
    .sheet-actions button {
      flex: 1;
    }
  `]
})
export class MobileFilterSheetComponent {
  filters: Record<string, unknown>;
  config: FilterConfig[];

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: MobileFilterData,
    private bottomSheetRef: MatBottomSheetRef<MobileFilterSheetComponent>
  ) {
    this.filters = { ...data.filters };
    this.config = data.config;
  }

  apply(): void {
    this.bottomSheetRef.dismiss({ action: 'apply', filters: this.filters });
  }

  reset(): void {
    this.bottomSheetRef.dismiss({ action: 'reset' });
  }

  close(): void {
    this.bottomSheetRef.dismiss({ action: 'cancel' });
  }
}
