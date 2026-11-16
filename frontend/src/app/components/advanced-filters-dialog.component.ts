import { Component, Inject, OnInit, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { AdvancedFilter, FilterField, AdvancedFiltersComponent } from './advanced-filters.component';
import { FilterPreset, FilterPresetRequest, FilterPresetService } from '../services/filter-preset.service';
import { DossierFilterApiService, DossierFilterRequest } from '../services/dossier-filter-api.service';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsToastService,
  DsInputComponent,
  DsCardComponent,
  DsCheckboxComponent,
  DsBadgeComponent,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface AdvancedFiltersDialogData {
  filterType: string;
  fields: FilterField[];
  initialFilter?: AdvancedFilter;
}

@Component({
    selector: 'app-advanced-filters-dialog',
    standalone: true,
    templateUrl: './advanced-filters-dialog.component.html',
    styleUrls: ['./advanced-filters-dialog.component.css'],
    imports: [
      CommonModule,
      FormsModule, 
      DsButtonComponent, 
      DsIconComponent, 
      AdvancedFiltersComponent, 
      DsInputComponent,
      DsCardComponent,
      DsCheckboxComponent,
      DsBadgeComponent,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent
    ]
})
export class AdvancedFiltersDialogComponent implements OnInit {
  private filterPresetService = inject(FilterPresetService);
  private dossierFilterApi = inject(DossierFilterApiService);
  private toastService = inject(DsToastService);
  
  public dialogRef = inject(DialogRef<any>);
  public data: AdvancedFiltersDialogData = inject(DIALOG_DATA);

  predefinedPresets: FilterPreset[] = [];
  userPresets: FilterPreset[] = [];
  currentFilter?: AdvancedFilter;
  resultCount: number | null = null;
  countLoading = false;
  showSaveDialog = false;
  presetName = '';
  presetDescription = '';
  sharePreset = false;

  ngOnInit(): void {
    this.loadPresets();
    if (this.data.initialFilter) {
      this.currentFilter = this.data.initialFilter;
    }
  }

  loadPresets(): void {
    this.filterPresetService.getPredefinedPresets(this.data.filterType).subscribe({
      next: (presets) => {
        this.predefinedPresets = presets;
      },
      error: (err) => {
        console.error('Error loading predefined presets:', err);
      }
    });

    this.filterPresetService.getUserPresets(this.data.filterType).subscribe({
      next: (presets) => {
        this.userPresets = presets;
      },
      error: (err) => {
        console.error('Error loading user presets:', err);
      }
    });
  }

  onFilterChange(filter: AdvancedFilter): void {
    this.currentFilter = filter;
  }

  onCountRequest(filter: AdvancedFilter): void {
    this.countLoading = true;
    const request: DossierFilterRequest = {
      conditions: filter.conditions,
      logicOperator: filter.logicOperator
    };

    this.dossierFilterApi.countAdvancedFilter(request).subscribe({
      next: (count) => {
        this.resultCount = count;
        this.countLoading = false;
      },
      error: (err) => {
        console.error('Error counting dossiers:', err);
        this.countLoading = false;
        this.toastService.error('Erreur lors du comptage des résultats');
      }
    });
  }

  onFilterApplied(filter: AdvancedFilter): void {
    this.dialogRef.close({ filter });
  }

  loadPreset(preset: FilterPreset): void {
    if (preset.filterConfig && preset.filterConfig['conditions']) {
      this.currentFilter = {
        conditions: preset.filterConfig['conditions'] as any[],
        logicOperator: (preset.filterConfig['logicOperator'] as 'AND' | 'OR') || 'AND'
      };
    }
  }

  openSaveDialog(): void {
    this.showSaveDialog = true;
    this.presetName = '';
    this.presetDescription = '';
    this.sharePreset = false;
  }

  closeSaveDialog(): void {
    this.showSaveDialog = false;
  }

  savePreset(): void {
    if (!this.presetName.trim() || !this.currentFilter) {
      this.toastService.warning('Veuillez entrer un nom pour le preset');
      return;
    }

    const request: FilterPresetRequest = {
      name: this.presetName,
      filterType: this.data.filterType,
      description: this.presetDescription || undefined,
      filterConfig: {
        conditions: this.currentFilter.conditions,
        logicOperator: this.currentFilter.logicOperator
      },
      isShared: this.sharePreset
    };

    this.filterPresetService.create(request).subscribe({
      next: () => {
        this.toastService.success('Preset sauvegardé avec succès');
        this.closeSaveDialog();
        this.loadPresets();
      },
      error: (err) => {
        console.error('Error saving preset:', err);
        this.toastService.error('Erreur lors de la sauvegarde du preset');
      }
    });
  }

  deletePreset(preset: FilterPreset): void {
    if (!preset.id) return;

    if (confirm(`Supprimer le preset "${preset.name}" ?`)) {
      this.filterPresetService.delete(preset.id).subscribe({
        next: () => {
          this.toastService.success('Preset supprimé avec succès');
          this.loadPresets();
        },
        error: (err) => {
          console.error('Error deleting preset:', err);
          this.toastService.error('Erreur lors de la suppression du preset');
        }
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
