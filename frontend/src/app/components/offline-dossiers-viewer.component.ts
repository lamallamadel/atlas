import { Component, OnInit } from '@angular/core';
import { OfflineStorageService } from '../services/offline-storage.service';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { SwipeableCardComponent } from './swipeable-card.component';
import { MatButton } from '@angular/material/button';
import { DS_CHART_FALLBACK_HEX } from '../design-system/chart-ds-colors';

interface CachedDossier {
  id: number;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  annonceId?: number;
  cached: boolean;
}

@Component({
    selector: 'app-offline-dossiers-viewer',
    template: `
    <div class="offline-viewer">
      <div class="viewer-header">
        <h3>
          <mat-icon>folder_off</mat-icon>
          Dossiers disponibles hors ligne
        </h3>
        <p class="subtitle">Ces dossiers sont consultables même sans connexion internet</p>
      </div>
    
      @if (dossiers.length > 0) {
        <div class="dossiers-list">
          @for (dossier of dossiers; track dossier) {
            <app-swipeable-card
          [rightAction]="{
            icon: 'visibility',
            label: 'Voir',
            color: swipeActionColor,
            action: 'view'
          }"
              (swipeRight)="viewDossier(dossier.id)"
              class="dossier-card-wrapper">
              <div class="dossier-card" role="button" tabindex="0" (click)="viewDossier(dossier.id)" (keydown.enter)="viewDossier(dossier.id)" (keydown.space)="$event.preventDefault(); viewDossier(dossier.id)">
                <div class="dossier-header">
                  <div class="dossier-avatar">
                    {{ getInitials(dossier.leadName) }}
                  </div>
                  <div class="dossier-info">
                    <h4>{{ dossier.leadName }}</h4>
                    <p class="dossier-contact">
                      <mat-icon class="small-icon">phone</mat-icon>
                      {{ dossier.leadPhone }}
                    </p>
                    @if (dossier.leadEmail) {
                      <p class="dossier-contact">
                        <mat-icon class="small-icon">email</mat-icon>
                        {{ dossier.leadEmail }}
                      </p>
                    }
                  </div>
                  <div class="dossier-status">
                    <span class="status-badge" [class]="'status-' + dossier.status.toLowerCase()">
                      {{ getStatusLabel(dossier.status) }}
                    </span>
                  </div>
                </div>
                <div class="dossier-footer">
                  <span class="cache-badge">
                    <mat-icon class="tiny-icon">offline_pin</mat-icon>
                    Disponible hors ligne
                  </span>
                  <span class="date-info">
                    {{ formatDate(dossier.updatedAt) }}
                  </span>
                </div>
              </div>
            </app-swipeable-card>
          }
        </div>
      }
    
      @if (dossiers.length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">cloud_off</mat-icon>
          <h4>Aucun dossier hors ligne</h4>
          <p>Les dossiers consultés récemment seront automatiquement disponibles hors ligne</p>
        </div>
      }
    
      <div class="viewer-actions">
        <button mat-stroked-button (click)="clearCache()" [disabled]="dossiers.length === 0">
          <mat-icon>delete_sweep</mat-icon>
          Vider le cache
        </button>
        <button mat-raised-button color="primary" (click)="refresh()">
          <mat-icon>refresh</mat-icon>
          Actualiser
        </button>
      </div>
    </div>
    `,
    styles: [`
    .offline-viewer {
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }

    .viewer-header {
      margin-bottom: 24px;
    }

    .viewer-header h3 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--ds-text);
    }

    .viewer-header h3 mat-icon {
      color: var(--ds-warning);
    }

    .subtitle {
      color: var(--ds-text-muted);
      font-size: 14px;
      margin: 0;
    }

    .dossiers-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .dossier-card-wrapper {
      display: block;
    }

    .dossier-card {
      background: var(--ds-surface);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .dossier-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .dossier-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .dossier-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--ds-marine) 0%, var(--ds-marine-light) 100%);
      color: var(--ds-text-inverse);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
      flex-shrink: 0;
    }

    .dossier-info {
      flex: 1;
      min-width: 0;
    }

    .dossier-info h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--ds-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dossier-contact {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 4px 0;
      font-size: 13px;
      color: var(--ds-text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .small-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .dossier-status {
      flex-shrink: 0;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-new {
      background: var(--ds-marine-hl);
      color: var(--ds-marine);
    }

    .status-in_progress {
      background: var(--ds-warning-hl);
      color: var(--ds-warning);
    }

    .status-completed {
      background: var(--ds-success-hl);
      color: var(--ds-success);
    }

    .status-archived {
      background: var(--ds-surface-dynamic);
      color: var(--ds-text-muted);
    }

    .dossier-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid var(--ds-divider);
    }

    .cache-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--ds-success);
      font-weight: 500;
    }

    .tiny-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .date-info {
      font-size: 12px;
      color: var(--ds-text-faint);
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      background: var(--ds-surface);
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--ds-text-faint);
      margin-bottom: 16px;
    }

    .empty-state h4 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--ds-text-muted);
    }

    .empty-state p {
      margin: 0;
      color: var(--ds-text-muted);
      font-size: 14px;
    }

    .viewer-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .viewer-actions button {
      min-width: 48px;
      min-height: 48px;
    }

    /* Dark theme */
    .dark-theme .dossier-card,
    .dark-theme .empty-state {
      background: var(--ds-surface);
    }

    .dark-theme .viewer-header h3,
    .dark-theme .dossier-info h4 {
      color: var(--ds-text);
    }

    .dark-theme .subtitle,
    .dark-theme .dossier-contact,
    .dark-theme .empty-state h4,
    .dark-theme .empty-state p {
      color: var(--ds-text-muted);
    }

    .dark-theme .dossier-footer {
      border-top-color: var(--ds-divider);
    }

    /* Mobile adjustments */
    @media (max-width: 599px) {
      .offline-viewer {
        padding: 12px 8px;
      }

      .viewer-actions {
        flex-direction: column;
      }

      .viewer-actions button {
        width: 100%;
      }
    }
  `],
    imports: [MatIcon, SwipeableCardComponent, MatButton]
})
export class OfflineDossiersViewerComponent implements OnInit {
  readonly swipeActionColor = DS_CHART_FALLBACK_HEX['--ds-marine'];

  dossiers: CachedDossier[] = [];

  constructor(
    private offlineStorage: OfflineStorageService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadDossiers();
  }

  async loadDossiers(): Promise<void> {
    try {
      const cached = await this.offlineStorage.getCachedDossiers();
      this.dossiers = cached.map(d => ({ ...d, cached: true }));
    } catch (error) {
      console.error('Error loading cached dossiers:', error);
    }
  }

  viewDossier(id: number): void {
    this.router.navigate(['/dossiers', id]);
  }

  async clearCache(): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir vider le cache des dossiers ?')) {
      try {
        await this.offlineStorage.clearDossierCache();
        this.dossiers = [];
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
    }
  }

  async refresh(): Promise<void> {
    await this.loadDossiers();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'NEW': 'Nouveau',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminé',
      'ARCHIVED': 'Archivé'
    };
    return labels[status] || status;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
  }
}
