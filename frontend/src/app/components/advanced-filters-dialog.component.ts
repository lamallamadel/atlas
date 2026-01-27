import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdvancedFilter, FilterField } from './advanced-filters.component';
import { FilterPreset, FilterPresetRequest, FilterPresetService } from '../services/filter-preset.service';
import { DossierFilterApiService, DossierFilterRequest } from '../services/dossier-filter-api.service';
import { DossierStatus } from '../services/dossier-api.service';

export interface AdvancedFiltersDialogData {
  filterType: string;
  fields: FilterField[];
  initialFilter?: AdvancedFilter;
}

@Component({
  selector: 'app-advanced-filters-dialog',
  templateUrl: './advanced-filters-dialog.component.html',
  styleUrls: ['./advanced-filters-dialog.component.css']
})
export class AdvancedFiltersDialogComponent implements OnInit {
  predefinedPresets: FilterPreset[] = [];
  userPresets: FilterPreset[] = [];
  currentFilter?: AdvancedFilter;
  resultCount: number | null = null;
  countLoading = false;
  showSaveDialog = false;
  presetName = '';
  presetDescription = '';
  sharePreset = false;

  constructor(
    public dialogRef: MatDialogRef<AdvancedFiltersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AdvancedFiltersDialogData,
    private filterPresetService: FilterPresetService,
    private dossierFilterApi: DossierFilterApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

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
        this.snackBar.open('Erreur lors du comptage des résultats', 'Fermer', { duration: 3000 });
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
      this.snackBar.open('Veuillez entrer un nom pour le preset', 'Fermer', { duration: 3000 });
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
      next: (preset) => {
        this.snackBar.open('Preset sauvegardé avec succès', 'Fermer', { duration: 3000 });
        this.closeSaveDialog();
        this.loadPresets();
      },
      error: (err) => {
        console.error('Error saving preset:', err);
        this.snackBar.open('Erreur lors de la sauvegarde du preset', 'Fermer', { duration: 3000 });
      }
    });
  }

  deletePreset(preset: FilterPreset): void {
    if (!preset.id) return;

    if (confirm(`Supprimer le preset "${preset.name}" ?`)) {
      this.filterPresetService.delete(preset.id).subscribe({
        next: () => {
          this.snackBar.open('Preset supprimé avec succès', 'Fermer', { duration: 3000 });
          this.loadPresets();
        },
        error: (err) => {
          console.error('Error deleting preset:', err);
          this.snackBar.open('Erreur lors de la suppression du preset', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
