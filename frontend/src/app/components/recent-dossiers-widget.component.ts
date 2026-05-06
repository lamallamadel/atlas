import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { DsCardComponent } from '../design-system/primitives/ds-card/ds-card.component';
import { DashboardWidgetBase } from './dashboard-widget-base';
import { DossierApiService } from '../services/dossier-api.service';

interface Dossier {
  id: number;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  status: string;
  createdAt: string;
}

@Component({
  standalone: true,
  selector: 'app-recent-dossiers-widget',
  imports: [RouterModule, DsCardComponent],
  template: `
    <div class="widget-shell">
      <ds-card [pad]="false" [elevation]="'sm'">
        <div class="widget-body" [class.edit-mode]="editMode">
          <div class="widget-header">
            <h3>{{ config.title || 'Dossiers récents' }}</h3>
            @if (editMode) {
              <div class="widget-actions">
                <button type="button" (click)="onRefresh()" class="btn-icon" title="Rafraîchir">
                  <span class="material-icons">refresh</span>
                </button>
                <button type="button" (click)="onRemove()" class="btn-icon" title="Supprimer">
                  <span class="material-icons">close</span>
                </button>
              </div>
            }
          </div>

          @if (!loading && !error) {
            <div class="widget-content">
              @if (dossiers.length > 0) {
                <div class="dossier-list">
                  @for (dossier of dossiers; track dossier.id) {
                    <a [routerLink]="['/dossiers', dossier.id]" class="dossier-item">
                      <div class="dossier-info">
                        <div class="dossier-name">{{ dossier.leadName }}</div>
                        <div class="dossier-contact">{{ dossier.leadPhone }}</div>
                      </div>
                      <div class="dossier-status">
                        <span class="badge" [attr.data-status]="dossier.status">
                          {{ dossier.status }}
                        </span>
                      </div>
                    </a>
                  }
                </div>
              }
              @if (dossiers.length === 0) {
                <div class="empty-state">
                  <span class="material-icons">folder_open</span>
                  <p>Aucun dossier récent</p>
                </div>
              }
            </div>
          }

          @if (loading) {
            <div class="widget-loading">
              <div class="spinner"></div>
            </div>
          }

          @if (error) {
            <div class="widget-error">
              <span class="material-icons">error</span>
              <p>{{ error }}</p>
            </div>
          }
        </div>
      </ds-card>
    </div>
  `,
  styleUrls: ['./dashboard-widget-shared.scss', './recent-dossiers-widget.component.scss'],
})
export class RecentDossiersWidgetComponent extends DashboardWidgetBase {
  dossiers: Dossier[] = [];

  constructor(private dossierService: DossierApiService) {
    super();
  }

  override loadData(): void {
    this.setLoading(true);
    this.setError(null);

    const limit = (this.config.settings?.['limit'] as number) || 5;

    this.dossierService
      .list({ size: limit, sort: 'createdAt,desc' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dossiers = (response.content || []).map(
            (d: {
              id: number;
              leadName?: string;
              leadPhone?: string;
              status: string;
              createdAt: string;
            }) => ({
              id: d.id,
              leadName: d.leadName || '',
              leadEmail: '',
              leadPhone: d.leadPhone || '',
              status: d.status,
              createdAt: d.createdAt,
            }),
          );
          this.setLoading(false);
        },
        error: () => {
          this.setError('Erreur de chargement des dossiers');
          this.setLoading(false);
        },
      });
  }
}
