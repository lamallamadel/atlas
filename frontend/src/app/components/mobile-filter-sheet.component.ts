import { Component, Inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsInputComponent,
  DsSelectComponent,
  DsSelectOption,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';

export interface MobileFilterData {
  filters: Record<string, unknown>;
  config: FilterConfig[];
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'autocomplete';
  options?: DsSelectOption[];
  placeholder?: string;
}

@Component({
    selector: 'app-mobile-filter-sheet',
    standalone: true,
    template: `
    <ds-dialog-header (close)="close()">
      <div style="display: flex; align-items: center; gap: 12px;">
        <ds-icon name="filter" [size]="24" aria-hidden="true"></ds-icon>
        <span>Filtres</span>
      </div>
    </ds-dialog-header>

    <ds-dialog-content>
      <div class="ds-form-stack">
        @for (filter of config; track filter.key) {
          <div class="filter-group">
            @if (filter.type === 'text') {
              <ds-input
                [label]="filter.label"
                [placeholder]="filter.placeholder || ''"
                [(ngModel)]="filters[filter.key]">
              </ds-input>
            }
            @if (filter.type === 'select') {
              <ds-select
                [label]="filter.label"
                [options]="filter.options || []"
                [(ngModel)]="filters[filter.key]">
              </ds-select>
            }
          </div>
        }
      </div>
    </ds-dialog-content>

    <ds-dialog-actions align="between">
      <ds-button variant="ghost" size="md" (dsClick)="reset()">
        Réinitialiser
      </ds-button>
      <ds-button variant="marine" size="md" (dsClick)="apply()">
        Appliquer
      </ds-button>
    </ds-dialog-actions>
    `,
    styles: [`
    .filter-group {
      margin-bottom: var(--ds-space-4);
    }
    `],
    imports: [
      CommonModule,
      FormsModule,
      DsButtonComponent,
      DsIconComponent,
      DsInputComponent,
      DsSelectComponent,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent
    ]
})
export class MobileFilterSheetComponent {
  filters: Record<string, any>;
  config: FilterConfig[];

  constructor(
    @Inject(DIALOG_DATA) public data: MobileFilterData,
    private dialogRef: DialogRef<any>
  ) {
    this.filters = { ...data.filters };
    this.config = data.config;
  }

  apply(): void {
    this.dialogRef.close({ action: 'apply', filters: this.filters });
  }

  reset(): void {
    this.dialogRef.close({ action: 'reset' });
  }

  close(): void {
    this.dialogRef.close({ action: 'cancel' });
  }
}
