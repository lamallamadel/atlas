/**
 * Grille dashboard personnalisable (12 colonnes) — même forme que `DashboardCustomizationService` et l’API `/dashboard-layout`.
 */
export interface DashboardWidgetConfig {
  id: string;
  type: string;
  title?: string;
  x: number;
  y: number;
  cols: number;
  rows: number;
  /** secondes ; utilisé par `DashboardWidgetBase` pour l’auto-refresh */
  refreshInterval?: number;
  settings?: Record<string, unknown>;
}

/** Corps envoyé/reçu pour persister toute la grille */
export interface DashboardGridLayout {
  widgets: DashboardWidgetConfig[];
}

/**
 * Champ `ui.dashboardLayout` dans les préférences utilisateur (sync locale / serveur).
 * `widgets` optionnel tant que la grille n’a pas été configurée.
 */
export interface UiDashboardLayout {
  widgets?: DashboardWidgetConfig[];
  columns?: number;
}

/** Alias historique — préférer `DashboardWidgetConfig` */
export type WidgetConfig = DashboardWidgetConfig;

/** Alias historique — préférer `DashboardGridLayout` */
export type DashboardLayout = DashboardGridLayout;
