import { Component, Input } from '@angular/core';

import { WidgetConfig } from '../services/dashboard-customization.service';
import { KpiWidgetComponent } from './kpi-widget.component';
import { RecentDossiersWidgetComponent } from './recent-dossiers-widget.component';
import { MyTasksWidgetComponent } from './my-tasks-widget.component';

@Component({
  selector: 'app-dashboard-mobile-view',
  standalone: true,
  imports: [
    KpiWidgetComponent,
    RecentDossiersWidgetComponent,
    MyTasksWidgetComponent
],
  template: `
    <div class="mobile-dashboard">
      @for (widget of widgets; track widget) {
        <div class="mobile-widget">
          @switch (widget.type) {
            @case ('kpi-conversion') {
              <app-kpi-widget
                [config]="widget">
              </app-kpi-widget>
            }
            @case ('kpi-response-time') {
              <app-kpi-widget
                [config]="widget">
              </app-kpi-widget>
            }
            @case ('kpi-revenue') {
              <app-kpi-widget
                [config]="widget">
              </app-kpi-widget>
            }
            @case ('recent-dossiers') {
              <app-recent-dossiers-widget
                [config]="widget">
              </app-recent-dossiers-widget>
            }
            @case ('my-tasks') {
              <app-my-tasks-widget
                [config]="widget">
              </app-my-tasks-widget>
            }
            @default {
              <div class="widget-placeholder">
                <p>Widget: {{ widget.type }}</p>
              </div>
            }
          }
        </div>
      }
    </div>
    `,
  styles: [`
    .mobile-dashboard {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }

    .mobile-widget {
      width: 100%;
      min-height: 200px;
    }

    .widget-placeholder {
      background: white;
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      color: #999;
    }

    @media (min-width: 768px) {
      .mobile-dashboard {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class DashboardMobileViewComponent {
  @Input() widgets: WidgetConfig[] = [];
}
