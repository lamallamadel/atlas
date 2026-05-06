import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntil } from 'rxjs/operators';
import { DsCardComponent } from '../design-system/primitives/ds-card/ds-card.component';
import { DashboardWidgetBase } from './dashboard-widget-base';
import { DashboardKpiService } from '../services/dashboard-kpi.service';

@Component({
  standalone: true,
  selector: 'app-kpi-widget',
  imports: [CommonModule, DsCardComponent],
  template: `
    <div class="widget-shell">
      <ds-card [pad]="false" [elevation]="'sm'">
        <div class="widget-body" [class.edit-mode]="editMode">
          <div class="widget-header">
            <h3>{{ config.title || 'KPI' }}</h3>
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
              <div class="kpi-value">{{ kpiData.value | number: '1.0-0' }}</div>
              <div class="kpi-label">{{ kpiData.label }}</div>
              <div
                class="kpi-change"
                [class.positive]="kpiData.change >= 0"
                [class.negative]="kpiData.change < 0">
                <span class="material-icons">{{ kpiData.change >= 0 ? 'trending_up' : 'trending_down' }}</span>
                {{ kpiData.change >= 0 ? '+' : '' }}{{ kpiData.change | number: '1.1-1' }}%
              </div>
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
  styleUrls: ['./dashboard-widget-shared.scss', './kpi-widget.component.scss'],
})
export class KpiWidgetComponent extends DashboardWidgetBase {
  kpiData = {
    value: 0,
    label: '',
    change: 0,
  };

  constructor(private kpiService: DashboardKpiService) {
    super();
  }

  override loadData(): void {
    this.setLoading(true);
    this.setError(null);

    const kpiType = (this.config.settings?.['kpiType'] as string) || 'conversion';

    this.kpiService
      .getKPI(kpiType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.kpiData = {
            value: data.value,
            label: data.label,
            change: data.changePercent || 0,
          };
          this.setLoading(false);
        },
        error: () => {
          this.setError('Erreur de chargement des données');
          this.setLoading(false);
        },
      });
  }
}
