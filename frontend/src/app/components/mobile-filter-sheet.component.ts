import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/autocomplete';

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
        @for (filter of config; track filter) {
          <div class="filter-group">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ filter.label }}</mat-label>
              @if (filter.type === 'text') {
                <input
                  matInput
                  [placeholder]="filter.placeholder || ''"
                  [(ngModel)]="filters[filter.key]"
                  />
              }
              @if (filter.type === 'select') {
                <mat-select
                  [(ngModel)]="filters[filter.key]"
                  >
                  <mat-option [value]="''">Tous</mat-option>
                  @for (option of filter.options; track option) {
                    <mat-option
                      [value]="option.value"
                      >
                      {{ option.label }}
                    </mat-option>
                  }
                </mat-select>
              }
            </mat-form-field>
          </div>
        }
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
      border-top: 1px solid var(--ds-divider);
    }
    
    .sheet-actions button {
      flex: 1;
    }
  `],
    imports: [MatIconButton, MatIcon, MatFormField, MatLabel, MatInput, FormsModule, MatSelect, MatOption, MatButton]
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
