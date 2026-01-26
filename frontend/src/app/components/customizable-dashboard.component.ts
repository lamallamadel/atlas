import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DashboardCustomizationService, WidgetConfig, DashboardLayout } from '../services/dashboard-customization.service';
import { KpiWidgetComponent } from './kpi-widget.component';
import { RecentDossiersWidgetComponent } from './recent-dossiers-widget.component';
import { MyTasksWidgetComponent } from './my-tasks-widget.component';

@Component({
  selector: 'app-customizable-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    KpiWidgetComponent,
    RecentDossiersWidgetComponent,
    MyTasksWidgetComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Dashboard Header -->
      <div class="dashboard-header">
        <h1>Tableau de bord</h1>
        <div class="dashboard-actions">
          <button 
            class="btn-secondary" 
            (click)="toggleEditMode()"
            [class.active]="editMode">
            <span class="material-icons">{{ editMode ? 'done' : 'edit' }}</span>
            {{ editMode ? 'Terminer' : 'Personnaliser' }}
          </button>
          <button 
            class="btn-secondary" 
            (click)="showTemplateSelector = true"
            *ngIf="editMode">
            <span class="material-icons">dashboard_customize</span>
            Templates
          </button>
          <button 
            class="btn-secondary" 
            (click)="exportConfig()"
            *ngIf="editMode">
            <span class="material-icons">download</span>
            Exporter
          </button>
          <button 
            class="btn-secondary" 
            (click)="showImportDialog = true"
            *ngIf="editMode">
            <span class="material-icons">upload</span>
            Importer
          </button>
          <button 
            class="btn-secondary" 
            (click)="showWidgetLibrary = true"
            *ngIf="editMode">
            <span class="material-icons">add</span>
            Ajouter widget
          </button>
        </div>
      </div>

      <!-- Dashboard Grid -->
      <div 
        class="dashboard-grid"
        cdkDropList
        [cdkDropListDisabled]="!editMode"
        (cdkDropListDropped)="onWidgetDrop($event)">
        <div 
          *ngFor="let widget of widgets; trackBy: trackByWidgetId"
          class="widget-container"
          cdkDrag
          [cdkDragDisabled]="!editMode"
          [style.grid-column]="'span ' + widget.cols"
          [style.grid-row]="'span ' + widget.rows">
          
          <div class="widget-wrapper" [class.dragging]="editMode">
            <!-- Widget Type Selector -->
            <ng-container [ngSwitch]="widget.type">
              <app-kpi-widget 
                *ngSwitchCase="'kpi-conversion'"
                [config]="getWidgetConfig(widget, 'Taux de conversion')"
                [editMode]="editMode"
                (remove)="removeWidget($event)"
                (settingsChange)="updateWidgetSettings($event, widget)">
              </app-kpi-widget>

              <app-kpi-widget 
                *ngSwitchCase="'kpi-response-time'"
                [config]="getWidgetConfig(widget, 'Temps de réponse')"
                [editMode]="editMode"
                (remove)="removeWidget($event)"
                (settingsChange)="updateWidgetSettings($event, widget)">
              </app-kpi-widget>

              <app-kpi-widget 
                *ngSwitchCase="'kpi-revenue'"
                [config]="getWidgetConfig(widget, 'Chiffre affaires')"
                [editMode]="editMode"
                (remove)="removeWidget($event)"
                (settingsChange)="updateWidgetSettings($event, widget)">
              </app-kpi-widget>

              <app-recent-dossiers-widget 
                *ngSwitchCase="'recent-dossiers'"
                [config]="getWidgetConfig(widget, 'Dossiers récents')"
                [editMode]="editMode"
                (remove)="removeWidget($event)"
                (settingsChange)="updateWidgetSettings($event, widget)">
              </app-recent-dossiers-widget>

              <app-my-tasks-widget 
                *ngSwitchCase="'my-tasks'"
                [config]="getWidgetConfig(widget, 'Mes tâches')"
                [editMode]="editMode"
                (remove)="removeWidget($event)"
                (settingsChange)="updateWidgetSettings($event, widget)">
              </app-my-tasks-widget>

              <div *ngSwitchDefault class="widget-placeholder">
                <span class="material-icons">widgets</span>
                <p>Widget: {{ widget.type }}</p>
              </div>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="widgets.length === 0">
        <span class="material-icons">dashboard</span>
        <h3>Tableau de bord vide</h3>
        <p>Commencez par ajouter des widgets ou appliquer un template</p>
        <button class="btn-primary" (click)="showTemplateSelector = true">
          Choisir un template
        </button>
      </div>

      <!-- Template Selector Modal -->
      <div class="modal-overlay" *ngIf="showTemplateSelector" role="dialog" aria-modal="true" (click)="showTemplateSelector = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Choisir un template</h2>
            <button class="btn-icon" (click)="showTemplateSelector = false">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="template-grid">
              <div 
                *ngFor="let template of availableTemplates"
                class="template-card"
                role="button"
                tabindex="0"
                (click)="applyTemplate(template.id)"
                (keydown.enter)="applyTemplate(template.id)"
                (keydown.space)="applyTemplate(template.id)">
                <div class="template-icon">
                  <span class="material-icons">dashboard</span>
                </div>
                <h3>{{ template.name }}</h3>
                <p>{{ template.description }}</p>
                <div class="template-meta">
                  <span class="badge">{{ template.layout.widgets.length }} widgets</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Widget Library Modal -->
      <div class="modal-overlay" *ngIf="showWidgetLibrary" role="dialog" aria-modal="true" (click)="showWidgetLibrary = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Bibliothèque de widgets</h2>
            <button class="btn-icon" (click)="showWidgetLibrary = false">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <div class="widget-library-grid">
              <div 
                *ngFor="let widgetType of availableWidgetTypes"
                class="widget-type-card"
                role="button"
                tabindex="0"
                (click)="addWidgetToGrid(widgetType)"
                (keydown.enter)="addWidgetToGrid(widgetType)"
                (keydown.space)="addWidgetToGrid(widgetType)">
                <span class="material-icons">{{ widgetType.icon }}</span>
                <h3>{{ widgetType.name }}</h3>
                <p>{{ widgetType.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Import Dialog -->
      <div class="modal-overlay" *ngIf="showImportDialog" role="dialog" aria-modal="true" (click)="showImportDialog = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Importer configuration</h2>
            <button class="btn-icon" (click)="showImportDialog = false">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="modal-body">
            <textarea 
              [(ngModel)]="importJson"
              class="import-textarea"
              placeholder="Collez la configuration JSON ici..."></textarea>
            <div class="modal-actions">
              <button class="btn-secondary" (click)="showImportDialog = false">
                Annuler
              </button>
              <button class="btn-primary" (click)="importConfig()">
                Importer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #333;
    }

    .dashboard-actions {
      display: flex;
      gap: 12px;
    }

    .btn-primary,
    .btn-secondary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 4px;
      border: none;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #1976d2;
      color: white;
    }

    .btn-primary:hover {
      background: #1565c0;
    }

    .btn-secondary {
      background: white;
      color: #666;
      border: 1px solid #ddd;
    }

    .btn-secondary:hover {
      background: #f5f5f5;
    }

    .btn-secondary.active {
      background: #1976d2;
      color: white;
      border-color: #1976d2;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      color: #666;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 16px;
      min-height: 400px;
    }

    .widget-container {
      position: relative;
    }

    .widget-wrapper {
      height: 100%;
      transition: all 0.3s;
    }

    .widget-wrapper.dragging {
      cursor: move;
    }

    .widget-placeholder {
      background: white;
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
    }

    .widget-placeholder .material-icons {
      font-size: 48px;
      margin-bottom: 8px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #999;
      text-align: center;
    }

    .empty-state .material-icons {
      font-size: 72px;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      font-size: 24px;
      color: #666;
    }

    .empty-state p {
      margin: 0 0 24px;
      color: #999;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 800px;
      width: 90%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
    }

    .template-grid,
    .widget-library-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .template-card,
    .widget-type-card {
      padding: 20px;
      border: 2px solid #eee;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .template-card:hover,
    .widget-type-card:hover {
      border-color: #1976d2;
      background: #f5f9ff;
      transform: translateY(-2px);
    }

    .template-icon {
      margin-bottom: 12px;
    }

    .template-icon .material-icons,
    .widget-type-card .material-icons {
      font-size: 48px;
      color: #1976d2;
    }

    .template-card h3,
    .widget-type-card h3 {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 600;
    }

    .template-card p,
    .widget-type-card p {
      margin: 0 0 12px;
      font-size: 13px;
      color: #666;
    }

    .template-meta {
      display: flex;
      justify-content: center;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      background: #e3f2fd;
      color: #1976d2;
    }

    .import-textarea {
      width: 100%;
      min-height: 300px;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
      resize: vertical;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }

    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: repeat(6, 1fr);
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 16px;
      }

      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .dashboard-actions {
        width: 100%;
        flex-wrap: wrap;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }

      .widget-container {
        grid-column: span 1 !important;
      }

      .template-grid,
      .widget-library-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CustomizableDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  widgets: WidgetConfig[] = [];
  editMode = false;
  showTemplateSelector = false;
  showWidgetLibrary = false;
  showImportDialog = false;
  importJson = '';
  
  availableTemplates = this.customizationService.getAvailableTemplates();
  
  availableWidgetTypes = [
    { id: 'kpi-conversion', name: 'KPI Conversion', icon: 'insights', description: 'Affiche le taux de conversion' },
    { id: 'kpi-response-time', name: 'KPI Temps réponse', icon: 'schedule', description: 'Temps de réponse moyen' },
    { id: 'kpi-revenue', name: 'KPI CA', icon: 'attach_money', description: 'Chiffre d\'affaires' },
    { id: 'recent-dossiers', name: 'Dossiers récents', icon: 'folder', description: 'Liste des dossiers récents' },
    { id: 'my-tasks', name: 'Mes tâches', icon: 'task_alt', description: 'Tâches en cours' }
  ];

  constructor(private customizationService: DashboardCustomizationService) {}

  ngOnInit(): void {
    this.loadUserDashboard();
    
    this.customizationService.layout$
      .pipe(takeUntil(this.destroy$))
      .subscribe(layout => {
        this.widgets = layout.widgets;
      });

    this.customizationService.editMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(editMode => {
        this.editMode = editMode;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserDashboard(): void {
    const userId = 'current-user';
    this.customizationService.getUserPreferences(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.customizationService.setEditMode(this.editMode);
    
    if (!this.editMode) {
      this.saveDashboard();
    }
  }

  onWidgetDrop(event: CdkDragDrop<WidgetConfig[]>): void {
    moveItemInArray(this.widgets, event.previousIndex, event.currentIndex);
  }

  removeWidget(widgetId: string): void {
    this.customizationService.removeWidget(widgetId);
  }

  updateWidgetSettings(settings: Record<string, unknown>, widget: WidgetConfig): void {
    this.customizationService.updateWidget(widget.id, { settings });
  }

  applyTemplate(templateId: string): void {
    const userId = 'current-user';
    this.customizationService.applyRoleTemplate(userId, templateId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showTemplateSelector = false;
      });
  }

  addWidgetToGrid(widgetType: { id: string }): void {
    const newWidget: WidgetConfig = {
      id: '',
      type: widgetType.id,
      x: 0,
      y: 0,
      cols: 4,
      rows: 3,
      settings: {}
    };
    this.customizationService.addWidget(newWidget);
    this.showWidgetLibrary = false;
  }

  exportConfig(): void {
    const userId = 'current-user';
    this.customizationService.exportConfiguration(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-config-${new Date().toISOString()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  importConfig(): void {
    try {
      const config = JSON.parse(this.importJson);
      const userId = 'current-user';
      this.customizationService.importConfiguration(userId, config)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.showImportDialog = false;
          this.importJson = '';
        });
    } catch (error) {
      alert('Configuration JSON invalide');
    }
  }

  saveDashboard(): void {
    const userId = 'current-user';
    const layout: DashboardLayout = { widgets: this.widgets };
    this.customizationService.updateDashboardLayout(userId, layout)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  getWidgetConfig(widget: WidgetConfig, title: string): WidgetConfig {
    return {
      ...widget,
      title: widget.title || title
    };
  }

  trackByWidgetId(index: number, widget: WidgetConfig): string {
    return widget.id;
  }
}
