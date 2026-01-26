import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardWidgetBaseComponent } from './card-widget-base.component';
import { DashboardKpiService } from '../services/dashboard-kpi.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-kpi-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kpi-widget" [class.edit-mode]="editMode">
      <div class="widget-header">
        <h3>{{ config.title || 'KPI' }}</h3>
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
        <div class="kpi-value">{{ kpiData.value | number:'1.0-0' }}</div>
        <div class="kpi-label">{{ kpiData.label }}</div>
        <div class="kpi-change" [class.positive]="kpiData.change >= 0" [class.negative]="kpiData.change < 0">
          <span class="material-icons">{{ kpiData.change >= 0 ? 'trending_up' : 'trending_down' }}</span>
          {{ kpiData.change >= 0 ? '+' : '' }}{{ kpiData.change | number:'1.1-1' }}%
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
    .kpi-widget {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .kpi-widget.edit-mode {
      border: 2px dashed #ccc;
      cursor: move;
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
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
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .kpi-value {
      font-size: 48px;
      font-weight: 700;
      color: #1976d2;
      line-height: 1;
      margin-bottom: 8px;
    }

    .kpi-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 16px;
    }

    .kpi-change {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 16px;
      font-weight: 600;
    }

    .kpi-change.positive {
      color: #4caf50;
    }

    .kpi-change.negative {
      color: #f44336;
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
      .kpi-widget {
        padding: 16px;
      }

      .kpi-value {
        font-size: 36px;
      }

      .widget-header h3 {
        font-size: 14px;
      }
    }
  `]
})
export class KpiWidgetComponent extends CardWidgetBaseComponent {
  kpiData = {
    value: 0,
    label: '',
    change: 0
  };

  constructor(private kpiService: DashboardKpiService) {
    super();
  }

  override loadData(): void {
    this.setLoading(true);
    this.setError(null);

    const kpiType = this.config.settings?.['kpiType'] as string || 'conversion';

    this.kpiService.getKPI(kpiType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.kpiData = {
            value: data.value,
            label: data.label,
            change: data.changePercent || 0
          };
          this.setLoading(false);
        },
        error: () => {
          this.setError('Erreur de chargement des données');
          this.setLoading(false);
        }
      });
  }
}
