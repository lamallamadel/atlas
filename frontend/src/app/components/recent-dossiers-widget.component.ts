import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardWidgetBaseComponent } from './card-widget-base.component';
import { DossierApiService } from '../services/dossier-api.service';
import { takeUntil } from 'rxjs/operators';

interface Dossier {
  id: number;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-recent-dossiers-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="widget" [class.edit-mode]="editMode">
      <div class="widget-header">
        <h3>{{ config.title || 'Dossiers récents' }}</h3>
        <div class="widget-actions" *ngIf="editMode">
          <button (click)="onRefresh()" class="btn-icon" title="Rafraîchir">
            <span class="material-icons">refresh</span>
          </button>
          <button (click)="onRemove()" class="btn-icon" title="Supprimer">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
      
      <div class="widget-content" *ngIf="!loading && !error">
        <div class="dossier-list" *ngIf="dossiers.length > 0">
          <a *ngFor="let dossier of dossiers" 
             [routerLink]="['/dossiers', dossier.id]"
             class="dossier-item">
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
        </div>
        <div class="empty-state" *ngIf="dossiers.length === 0">
          <span class="material-icons">folder_open</span>
          <p>Aucun dossier récent</p>
        </div>
      </div>

      <div class="widget-loading" *ngIf="loading">
        <div class="spinner"></div>
      </div>

      <div class="widget-error" *ngIf="error">
        <span class="material-icons">error</span>
        <p>{{ error }}</p>
      </div>
    </div>
  `,
  styles: [`
    .widget {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .widget.edit-mode {
      border: 2px dashed #ccc;
      cursor: move;
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }

    .widget-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .widget-actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #666;
      transition: color 0.2s;
    }

    .btn-icon:hover {
      color: #333;
    }

    .widget-content {
      flex: 1;
      overflow-y: auto;
    }

    .dossier-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .dossier-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border: 1px solid #eee;
      border-radius: 4px;
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
    }

    .dossier-item:hover {
      border-color: #1976d2;
      background: #f5f9ff;
      transform: translateX(4px);
    }

    .dossier-info {
      flex: 1;
    }

    .dossier-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .dossier-contact {
      font-size: 13px;
      color: #666;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background: #e3f2fd;
      color: #1976d2;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #999;
      gap: 8px;
    }

    .empty-state .material-icons {
      font-size: 48px;
    }

    .widget-loading,
    .widget-error {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 8px;
      color: #666;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #1976d2;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .widget {
        padding: 16px;
      }

      .dossier-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class RecentDossiersWidgetComponent extends CardWidgetBaseComponent {
  dossiers: Dossier[] = [];

  constructor(private dossierService: DossierApiService) {
    super();
  }

  override loadData(): void {
    this.setLoading(true);
    this.setError(null);

    const limit = this.config.settings?.['limit'] as number || 5;

    this.dossierService.searchDossiers('', { sort: '-createdAt', limit })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dossiers = response.content || [];
          this.setLoading(false);
        },
        error: () => {
          this.setError('Erreur de chargement des dossiers');
          this.setLoading(false);
        }
      });
  }
}
