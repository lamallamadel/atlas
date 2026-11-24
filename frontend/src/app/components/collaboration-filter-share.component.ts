import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CollaborationService, SharedFilterPreset } from '../services/collaboration.service';
import { DsToastService, DsButtonComponent, DsIconComponent, DsInputComponent, DsCardComponent } from '../design-system';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-collaboration-filter-share',
    standalone: true,
    template: `
    <ds-card class="filter-share-container" [pad]="true" elevation="sm">
      <h3 class="section-header" style="display: flex; align-items: center; gap: 12px; margin: 0 0 24px 0; font-size: 16px; font-weight: 700; color: var(--ds-marine);">
        <ds-icon name="filter" [size]="20"></ds-icon>
        Presets de filtres partagés
      </h3>
    
      <div class="filter-list ds-form-stack" style="margin-bottom: 24px;">
        @for (filter of sharedFilters; track filter.id) {
          <div
            class="filter-item ds-card"
            role="button"
            tabindex="0"
            style="display: flex; gap: 16px; padding: 12px; border: 1px solid var(--ds-border); border-radius: var(--ds-radius-sm); align-items: center; cursor: pointer; transition: all 0.2s ease;"
            (click)="applyFilter(filter)"
            (keydown.enter)="applyFilter(filter)">
            <div class="filter-icon" style="width: 36px; height: 36px; background: var(--ds-bg-subtle); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--ds-marine);">
              <ds-icon name="chart" [size]="20"></ds-icon>
            </div>
            <div class="filter-content" style="flex: 1; min-width: 0;">
              <div class="filter-name" style="font-weight: 700; font-size: 14px;">{{ filter.name }}</div>
              <div class="filter-meta" style="display: flex; gap: 12px; font-size: 11px; color: var(--ds-text-faint);">
                <span class="shared-by">Par {{ filter.sharedByUsername }}</span>
                <span class="shared-time">{{ formatTimestamp(filter.sharedAt) }}</span>
              </div>
              @if (filter.description) {
                <div class="filter-description" style="font-size: 12px; color: var(--ds-text-muted); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  {{ filter.description }}
                </div>
              }
            </div>
            <ds-button variant="ghost" size="sm" (dsClick)="applyFilter(filter); $event.stopPropagation()">
              Appliquer
            </ds-button>
          </div>
        }
    
        @if (sharedFilters.length === 0) {
          <div class="no-filters" style="text-align: center; padding: 32px; color: var(--ds-text-faint);">
            <ds-icon name="search" [size]="24" style="opacity: 0.3; margin-bottom: 12px;"></ds-icon>
            <p style="font-size: 13px;">Aucun preset partagé</p>
          </div>
        }
      </div>
    
      <div class="share-section ds-form-stack" style="border-top: 1px solid var(--ds-divider); padding-top: 24px;">
        <h4 style="margin: 0 0 16px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; color: var(--ds-text-muted); letter-spacing: 0.5px;">Partager mes filtres</h4>
        <div class="share-form ds-form-stack">
          <ds-input
            label="Nom du preset"
            [(ngModel)]="newFilterName"
            placeholder="ex. Prospects chauds Paris">
          </ds-input>
          
          <div class="ds-field">
            <label for="collaboration-filter-share-field-66" class="ds-field__label">Description (optionnel)</label>
            <div class="ds-field__wrap">
              <textarea id="collaboration-filter-share-field-66" 
                [(ngModel)]="newFilterDescription"
                class="ds-field__input"
                placeholder="Description..."
                rows="2"
                style="height: auto; padding: 12px;"></textarea>
            </div>
          </div>

          <ds-button 
            variant="marine" 
            size="md"
            (dsClick)="shareCurrentFilters()"
            [disabled]="!newFilterName.trim()"
            style="width: 100%;">
            <ds-icon name="upload" [size]="20" style="margin-right: 8px;"></ds-icon>
            Partager avec l'équipe
          </ds-button>
        </div>
      </div>
    </ds-card>
    `,
    imports: [CommonModule, FormsModule, DsIconComponent, DsButtonComponent, DsInputComponent, DsCardComponent]
})
export class CollaborationFilterShareComponent implements OnInit, OnDestroy {
  private collaborationService = inject(CollaborationService);
  private toastService = inject(DsToastService);

  sharedFilters: SharedFilterPreset[] = [];
  newFilterName = '';
  newFilterDescription = '';

  private subscriptions: Subscription[] = [];
  private currentFilters: any = {};

  ngOnInit(): void {
    this.subscriptions.push(
      this.collaborationService.getFilterPresetUpdates().subscribe(filter => {
        this.addSharedFilter(filter);
      })
    );
  }

  private addSharedFilter(filter: SharedFilterPreset): void {
    const existingIndex = this.sharedFilters.findIndex(f => f.id === filter.id);
    if (existingIndex >= 0) {
      this.sharedFilters[existingIndex] = filter;
    } else {
      this.sharedFilters.unshift(filter);
    }

    this.toastService.info(`Nouveau preset partagé : ${filter.name}`, {
      label: 'Voir',
      handler: () => this.applyFilter(filter)
    });
  }

  applyFilter(filter: SharedFilterPreset): void {
    this.toastService.success(`Filtre "${filter.name}" appliqué`);
  }

  setCurrentFilters(filters: any): void {
    this.currentFilters = filters;
  }

  shareCurrentFilters(): void {
    if (!this.newFilterName.trim()) {
      this.toastService.warning('Veuillez entrer un nom pour le preset');
      return;
    }

    const filterPreset: SharedFilterPreset = {
      id: Date.now(),
      name: this.newFilterName,
      description: this.newFilterDescription,
      filters: this.currentFilters,
      sharedBy: 'current-user',
      sharedByUsername: 'Moi',
      sharedAt: new Date()
    };

    this.collaborationService.shareFilterPreset(filterPreset);
    this.toastService.success(`Preset "${this.newFilterName}" partagé`);

    this.newFilterName = '';
    this.newFilterDescription = '';
  }

  formatTimestamp(timestamp: Date): string {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return new Date(timestamp).toLocaleDateString('fr-FR');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
