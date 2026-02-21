export interface UserPreferences {
  ui?: UiPreferences;
  notifications?: NotificationPreferences;
  formats?: FormatPreferences;
  shortcuts?: ShortcutPreferences;
  [key: string]: unknown;
}

export interface UiPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  dossierViewMode?: 'list' | 'kanban';
  sidebarCollapsed?: boolean;
  dashboardLayout?: DashboardLayout;
  widgetSettings?: WidgetSettings;
  density?: 'compact' | 'comfortable' | 'spacious';
  animationsEnabled?: boolean;
  defaultRoute?: string;
  syncDevices?: boolean;
  [key: string]: unknown;
}

export interface DashboardLayout {
  widgets?: WidgetConfig[];
  columns?: number;
  [key: string]: unknown;
}

export interface WidgetConfig {
  id: string;
  type: string;
  position: { row: number; col: number };
  size: { width: number; height: number };
  settings?: Record<string, unknown>;
}

export interface WidgetSettings {
  [widgetId: string]: Record<string, unknown>;
}

export interface NotificationPreferences {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  smsEnabled?: boolean;
  inAppEnabled?: boolean;
  soundEnabled?: boolean;
  desktopEnabled?: boolean;
  channels?: NotificationChannelSettings;
  [key: string]: unknown;
}

export interface NotificationChannelSettings {
  dossierUpdates?: boolean;
  taskReminders?: boolean;
  appointmentReminders?: boolean;
  systemAlerts?: boolean;
  [key: string]: boolean | undefined;
}

export interface FormatPreferences {
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: string;
  currency?: string;
  timezone?: string;
  firstDayOfWeek?: number;
  [key: string]: unknown;
}

export interface ShortcutPreferences {
  [action: string]: string;
}

export interface PreferencesUpdateRequest {
  preferences: Record<string, unknown>;
}

export interface CategoryPreferencesResponse {
  category: string;
  preferences: Record<string, unknown>;
}

export interface PendingUpdate {
  category: string;
  values: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  ui: {
    theme: 'light',
    language: 'fr',
    dossierViewMode: 'list',
    sidebarCollapsed: false,
    density: 'comfortable',
    animationsEnabled: true,
    defaultRoute: '/dashboard',
    syncDevices: true
  },
  notifications: {
    emailEnabled: true,
    pushEnabled: true,
    smsEnabled: false,
    inAppEnabled: true,
    soundEnabled: true,
    desktopEnabled: true
  },
  formats: {
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    numberFormat: 'fr-FR',
    currency: 'EUR',
    timezone: 'Europe/Paris',
    firstDayOfWeek: 1
  },
  shortcuts: {}
};

export type PreferenceCategory = 'ui' | 'notifications' | 'formats' | 'shortcuts';

export const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  'ui',
  'notifications',
  'formats',
  'shortcuts'
];
