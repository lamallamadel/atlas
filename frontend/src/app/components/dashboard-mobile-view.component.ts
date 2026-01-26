import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetConfig } from '../services/dashboard-customization.service';
import { KpiWidgetComponent } from './kpi-widget.component';
import { RecentDossiersWidgetComponent } from './recent-dossiers-widget.component';
import { MyTasksWidgetComponent } from './my-tasks-widget.component';

@Component({
  selector: 'app-dashboard-mobile-view',
  standalone: true,
  imports: [
    CommonModule,
    KpiWidgetComponent,
    RecentDossiersWidgetComponent,
    MyTasksWidgetComponent
  ],
  template: `
    <div class="mobile-dashboard">
      <div class="mobile-widget" *ngFor="let widget of widgets">
        <ng-container [ngSwitch]="widget.type">
          <app-kpi-widget 
            *ngSwitchCase="'kpi-conversion'"
            [config]="widget">
          </app-kpi-widget>

          <app-kpi-widget 
            *ngSwitchCase="'kpi-response-time'"
            [config]="widget">
          </app-kpi-widget>

          <app-kpi-widget 
            *ngSwitchCase="'kpi-revenue'"
            [config]="widget">
          </app-kpi-widget>

          <app-recent-dossiers-widget 
            *ngSwitchCase="'recent-dossiers'"
            [config]="widget">
          </app-recent-dossiers-widget>

          <app-my-tasks-widget 
            *ngSwitchCase="'my-tasks'"
            [config]="widget">
          </app-my-tasks-widget>

          <div *ngSwitchDefault class="widget-placeholder">
            <p>Widget: {{ widget.type }}</p>
          </div>
        </ng-container>
      </div>
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
