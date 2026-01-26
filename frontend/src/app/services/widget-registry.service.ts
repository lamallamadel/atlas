import { Injectable, Type } from '@angular/core';
import { CardWidgetBaseComponent } from '../components/card-widget-base.component';
import { KpiWidgetComponent } from '../components/kpi-widget.component';
import { RecentDossiersWidgetComponent } from '../components/recent-dossiers-widget.component';
import { MyTasksWidgetComponent } from '../components/my-tasks-widget.component';

export interface WidgetMetadata {
  id: string;
  name: string;
  description: string;
  icon: string;
  component: Type<CardWidgetBaseComponent>;
  defaultCols: number;
  defaultRows: number;
  minCols: number;
  minRows: number;
  maxCols?: number;
  maxRows?: number;
  category: 'kpi' | 'list' | 'chart' | 'table' | 'custom';
}

@Injectable({
  providedIn: 'root'
})
export class WidgetRegistryService {
  private widgets = new Map<string, WidgetMetadata>();

  constructor() {
    this.registerDefaultWidgets();
  }

  private registerDefaultWidgets(): void {
    this.register({
      id: 'kpi-conversion',
      name: 'Taux de conversion',
      description: 'Affiche le taux de conversion des leads',
      icon: 'insights',
      component: KpiWidgetComponent,
      defaultCols: 3,
      defaultRows: 3,
      minCols: 2,
      minRows: 2,
      maxCols: 6,
      maxRows: 4,
      category: 'kpi'
    });

    this.register({
      id: 'kpi-response-time',
      name: 'Temps de réponse',
      description: 'Temps de réponse moyen aux leads',
      icon: 'schedule',
      component: KpiWidgetComponent,
      defaultCols: 3,
      defaultRows: 3,
      minCols: 2,
      minRows: 2,
      maxCols: 6,
      maxRows: 4,
      category: 'kpi'
    });

    this.register({
      id: 'kpi-revenue',
      name: 'Chiffre d\'affaires',
      description: 'Chiffre d\'affaires du mois',
      icon: 'attach_money',
      component: KpiWidgetComponent,
      defaultCols: 3,
      defaultRows: 3,
      minCols: 2,
      minRows: 2,
      maxCols: 6,
      maxRows: 4,
      category: 'kpi'
    });

    this.register({
      id: 'recent-dossiers',
      name: 'Dossiers récents',
      description: 'Liste des derniers dossiers créés',
      icon: 'folder',
      component: RecentDossiersWidgetComponent,
      defaultCols: 6,
      defaultRows: 4,
      minCols: 4,
      minRows: 3,
      maxCols: 12,
      maxRows: 8,
      category: 'list'
    });

    this.register({
      id: 'my-tasks',
      name: 'Mes tâches',
      description: 'Tâches en cours et à venir',
      icon: 'task_alt',
      component: MyTasksWidgetComponent,
      defaultCols: 6,
      defaultRows: 4,
      minCols: 4,
      minRows: 3,
      maxCols: 12,
      maxRows: 8,
      category: 'list'
    });
  }

  register(metadata: WidgetMetadata): void {
    this.widgets.set(metadata.id, metadata);
  }

  unregister(widgetId: string): void {
    this.widgets.delete(widgetId);
  }

  getMetadata(widgetId: string): WidgetMetadata | undefined {
    return this.widgets.get(widgetId);
  }

  getAllWidgets(): WidgetMetadata[] {
    return Array.from(this.widgets.values());
  }

  getWidgetsByCategory(category: WidgetMetadata['category']): WidgetMetadata[] {
    return this.getAllWidgets().filter(w => w.category === category);
  }

  isRegistered(widgetId: string): boolean {
    return this.widgets.has(widgetId);
  }

  getDefaultDimensions(widgetId: string): { cols: number; rows: number } {
    const metadata = this.getMetadata(widgetId);
    return metadata 
      ? { cols: metadata.defaultCols, rows: metadata.defaultRows }
      : { cols: 4, rows: 3 };
  }
}
