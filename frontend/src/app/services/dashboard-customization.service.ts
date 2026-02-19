import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface WidgetConfig {
  id: string;
  type: string;
  title?: string;
  x: number;
  y: number;
  cols: number;
  rows: number;
  settings?: Record<string, unknown>;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

export interface UserPreferences {
  userId: string;
  dashboardLayout?: Record<string, unknown>;
  widgetSettings?: Record<string, unknown>;
  generalPreferences?: Record<string, unknown>;
  theme?: string;
  language?: string;
  roleTemplate?: string;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  role: string;
  layout: DashboardLayout;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardCustomizationService {
  private readonly API_URL = '/api/v1/user-preferences';
  
  private layoutSubject = new BehaviorSubject<DashboardLayout>({ widgets: [] });
  public layout$ = this.layoutSubject.asObservable();

  private editModeSubject = new BehaviorSubject<boolean>(false);
  public editMode$ = this.editModeSubject.asObservable();

  constructor(private http: HttpClient) {}

  getUserPreferences(userId: string): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${this.API_URL}/${userId}`).pipe(
      tap(prefs => {
        if (prefs.dashboardLayout && prefs.dashboardLayout['widgets']) {
          this.layoutSubject.next({ widgets: prefs.dashboardLayout['widgets'] as WidgetConfig[] });
        }
      })
    );
  }

  updateDashboardLayout(userId: string, layout: DashboardLayout): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(
      `${this.API_URL}/${userId}/dashboard-layout`,
      layout
    ).pipe(
      tap(prefs => {
        if (prefs.dashboardLayout && prefs.dashboardLayout['widgets']) {
          this.layoutSubject.next({ widgets: prefs.dashboardLayout['widgets'] as WidgetConfig[] });
        }
      })
    );
  }

  updateWidgetSettings(userId: string, settings: Record<string, unknown>): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(
      `${this.API_URL}/${userId}/widget-settings`,
      settings
    );
  }

  applyRoleTemplate(userId: string, template: string): Observable<UserPreferences> {
    return this.http.post<UserPreferences>(
      `${this.API_URL}/${userId}/apply-template?template=${template}`,
      {}
    ).pipe(
      tap(prefs => {
        if (prefs.dashboardLayout && prefs.dashboardLayout['widgets']) {
          this.layoutSubject.next({ widgets: prefs.dashboardLayout['widgets'] as WidgetConfig[] });
        }
      })
    );
  }

  exportConfiguration(userId: string): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(
      `${this.API_URL}/${userId}/export`,
      {}
    );
  }

  importConfiguration(userId: string, config: Record<string, unknown>): Observable<UserPreferences> {
    return this.http.post<UserPreferences>(
      `${this.API_URL}/${userId}/import`,
      config
    ).pipe(
      tap(prefs => {
        if (prefs.dashboardLayout && prefs.dashboardLayout['widgets']) {
          this.layoutSubject.next({ widgets: prefs.dashboardLayout['widgets'] as WidgetConfig[] });
        }
      })
    );
  }

  setEditMode(enabled: boolean): void {
    this.editModeSubject.next(enabled);
  }

  addWidget(widget: WidgetConfig): void {
    const currentLayout = this.layoutSubject.value;
    const updatedLayout = {
      widgets: [...currentLayout.widgets, { ...widget, id: this.generateWidgetId() }]
    };
    this.layoutSubject.next(updatedLayout);
  }

  removeWidget(widgetId: string): void {
    const currentLayout = this.layoutSubject.value;
    const updatedLayout = {
      widgets: currentLayout.widgets.filter(w => w.id !== widgetId)
    };
    this.layoutSubject.next(updatedLayout);
  }

  updateWidget(widgetId: string, updates: Partial<WidgetConfig>): void {
    const currentLayout = this.layoutSubject.value;
    const updatedLayout = {
      widgets: currentLayout.widgets.map(w => 
        w.id === widgetId ? { ...w, ...updates } : w
      )
    };
    this.layoutSubject.next(updatedLayout);
  }

  getAvailableTemplates(): DashboardTemplate[] {
    return [
      {
        id: 'agent',
        name: 'Agent Dashboard',
        description: 'Optimisé pour les agents commerciaux avec tâches et rendez-vous',
        role: 'agent',
        layout: {
          widgets: [
            { id: '1', type: 'my-tasks', x: 0, y: 0, cols: 6, rows: 4 },
            { id: '2', type: 'recent-dossiers', x: 6, y: 0, cols: 6, rows: 4 },
            { id: '3', type: 'today-appointments', x: 0, y: 4, cols: 6, rows: 3 },
            { id: '4', type: 'kpi-conversion', x: 6, y: 4, cols: 3, rows: 3 },
            { id: '5', type: 'kpi-response-time', x: 9, y: 4, cols: 3, rows: 3 }
          ]
        }
      },
      {
        id: 'manager',
        name: 'Manager Dashboard',
        description: 'Vue d\'ensemble avec KPIs et performance d\'équipe',
        role: 'manager',
        layout: {
          widgets: [
            { id: '1', type: 'kpi-team-performance', x: 0, y: 0, cols: 4, rows: 3 },
            { id: '2', type: 'kpi-conversion-rate', x: 4, y: 0, cols: 4, rows: 3 },
            { id: '3', type: 'kpi-revenue', x: 8, y: 0, cols: 4, rows: 3 },
            { id: '4', type: 'team-activity', x: 0, y: 3, cols: 6, rows: 4 },
            { id: '5', type: 'pipeline-chart', x: 6, y: 3, cols: 6, rows: 4 },
            { id: '6', type: 'top-agents', x: 0, y: 7, cols: 4, rows: 3 },
            { id: '7', type: 'recent-deals', x: 4, y: 7, cols: 8, rows: 3 }
          ]
        }
      },
      {
        id: 'admin',
        name: 'Admin Dashboard',
        description: 'Monitoring système et activité utilisateurs',
        role: 'admin',
        layout: {
          widgets: [
            { id: '1', type: 'system-health', x: 0, y: 0, cols: 6, rows: 3 },
            { id: '2', type: 'user-activity', x: 6, y: 0, cols: 6, rows: 3 },
            { id: '3', type: 'kpi-overview', x: 0, y: 3, cols: 12, rows: 3 },
            { id: '4', type: 'recent-users', x: 0, y: 6, cols: 6, rows: 4 },
            { id: '5', type: 'audit-log', x: 6, y: 6, cols: 6, rows: 4 }
          ]
        }
      }
    ];
  }

  private generateWidgetId(): string {
    return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
