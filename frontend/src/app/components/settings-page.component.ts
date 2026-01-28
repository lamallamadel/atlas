import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserPreferencesService } from '../services/user-preferences.service';
import { ThemeService } from '../services/theme.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { DEFAULT_PREFERENCES } from '../models/user-preferences.model';

interface TabConfig {
  label: string;
  value: string;
  icon: string;
  visible: boolean;
}

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.css']
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  selectedTabIndex = 0;
  tabs: TabConfig[] = [];
  
  // Forms for each category
  preferencesForm!: FormGroup;
  notificationsForm!: FormGroup;
  appearanceForm!: FormGroup;
  shortcutsForm!: FormGroup;
  integrationsForm!: FormGroup;
  systemForm!: FormGroup;
  
  // Loading states
  loading = false;
  saving = false;
  
  // User role checks
  isAdmin = false;
  isSuperAdmin = false;
  
  // Preview state
  previewTheme: 'light' | 'dark' = 'light';
  previewDateFormat = 'dd/MM/yyyy';
  previewTimeFormat = 'HH:mm';
  previewSampleDate = new Date();
  
  // Original values for reset
  private originalValues: any = {};
  
  // Available options
  themes = [
    { value: 'light', label: 'Clair', icon: 'light_mode' },
    { value: 'dark', label: 'Sombre', icon: 'dark_mode' }
  ];
  
  languages = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' }
  ];
  
  densities = [
    { value: 'compact', label: 'Compact', description: 'Maximum de contenu à l\'écran' },
    { value: 'normal', label: 'Normal', description: 'Équilibre entre contenu et espacement' },
    { value: 'comfortable', label: 'Confortable', description: 'Plus d\'espacement, moins de contenu' }
  ];
  
  dateFormats = [
    { value: 'dd/MM/yyyy', label: '31/12/2024', example: '31/12/2024' },
    { value: 'MM/dd/yyyy', label: '12/31/2024', example: '12/31/2024' },
    { value: 'yyyy-MM-dd', label: '2024-12-31', example: '2024-12-31' },
    { value: 'd MMMM yyyy', label: '31 décembre 2024', example: '31 décembre 2024' }
  ];
  
  timeFormats = [
    { value: 'HH:mm', label: '23:59 (24h)', example: '23:59' },
    { value: 'hh:mm a', label: '11:59 PM (12h)', example: '11:59 PM' }
  ];
  
  timezones = [
    { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
    { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
    { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (GMT-8)' }
  ];
  
  currencies = [
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'USD', label: 'Dollar ($)', symbol: '$' },
    { value: 'GBP', label: 'Livre (£)', symbol: '£' }
  ];

  constructor(
    private fb: FormBuilder,
    private userPreferencesService: UserPreferencesService,
    private themeService: ThemeService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkUserRoles();
    this.initializeTabs();
    this.initializeForms();
    this.loadPreferences();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkUserRoles(): void {
    const roles = this.authService.getUserRoles();
    this.isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('admin');
    this.isSuperAdmin = roles.includes('ROLE_SUPER_ADMIN') || roles.includes('super-admin');
  }

  private initializeTabs(): void {
    this.tabs = [
      { label: 'Préférences', value: 'preferences', icon: 'tune', visible: true },
      { label: 'Notifications', value: 'notifications', icon: 'notifications', visible: true },
      { label: 'Apparence', value: 'appearance', icon: 'palette', visible: true },
      { label: 'Raccourcis', value: 'shortcuts', icon: 'keyboard', visible: true },
      { label: 'Intégrations', value: 'integrations', icon: 'extension', visible: this.isAdmin },
      { label: 'Système', value: 'system', icon: 'settings', visible: this.isSuperAdmin }
    ].filter(tab => tab.visible);
  }

  private initializeForms(): void {
    this.preferencesForm = this.fb.group({
      language: ['fr', Validators.required],
      dossierViewMode: ['list', Validators.required],
      sidebarCollapsed: [false],
      density: ['normal', Validators.required],
      animationsEnabled: [true]
    });

    this.notificationsForm = this.fb.group({
      emailEnabled: [true],
      pushEnabled: [true],
      smsEnabled: [false],
      inAppEnabled: [true],
      soundEnabled: [true],
      desktopEnabled: [true],
      dossierUpdates: [true],
      taskReminders: [true],
      appointmentReminders: [true],
      systemAlerts: [true]
    });

    this.appearanceForm = this.fb.group({
      theme: ['light', Validators.required],
      dateFormat: ['dd/MM/yyyy', Validators.required],
      timeFormat: ['HH:mm', Validators.required],
      numberFormat: ['fr-FR', Validators.required],
      currency: ['EUR', Validators.required],
      timezone: ['Europe/Paris', Validators.required],
      firstDayOfWeek: [1, [Validators.required, Validators.min(0), Validators.max(6)]]
    });

    this.shortcutsForm = this.fb.group({
      keyboardShortcutsEnabled: [true],
      showShortcutHints: [true],
      searchShortcut: ['/', Validators.required],
      commandPaletteShortcut: ['Ctrl+K', Validators.required],
      navigateAnnouncesShortcut: ['g+a', Validators.required],
      navigateDossiersShortcut: ['g+d', Validators.required]
    });

    if (this.isAdmin) {
      this.integrationsForm = this.fb.group({
        calendarSyncEnabled: [false],
        calendarProvider: ['google'],
        emailIntegrationEnabled: [false],
        emailProvider: ['outlook'],
        whatsappEnabled: [true],
        voipEnabled: [false]
      });
    }

    if (this.isSuperAdmin) {
      this.systemForm = this.fb.group({
        debugMode: [false],
        performanceMonitoring: [true],
        errorReporting: [true],
        analyticsEnabled: [true],
        maintenanceMode: [false]
      });
    }
  }

  private loadPreferences(): void {
    this.loading = true;
    
    this.userPreferencesService.getPreferences()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (preferences) => {
          this.populateFormValues(preferences);
          this.originalValues = this.getAllFormValues();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading preferences:', error);
          this.notificationService.error('Erreur lors du chargement des préférences');
          this.loading = false;
        }
      });
  }

  private populateFormValues(preferences: any): void {
    if (preferences.ui) {
      this.preferencesForm.patchValue({
        language: preferences.ui.language || 'fr',
        dossierViewMode: preferences.ui.dossierViewMode || 'list',
        sidebarCollapsed: preferences.ui.sidebarCollapsed || false,
        density: preferences.ui.density || 'normal',
        animationsEnabled: preferences.ui.animationsEnabled !== false
      });
    }

    if (preferences.notifications) {
      this.notificationsForm.patchValue({
        emailEnabled: preferences.notifications.emailEnabled !== false,
        pushEnabled: preferences.notifications.pushEnabled !== false,
        smsEnabled: preferences.notifications.smsEnabled || false,
        inAppEnabled: preferences.notifications.inAppEnabled !== false,
        soundEnabled: preferences.notifications.soundEnabled !== false,
        desktopEnabled: preferences.notifications.desktopEnabled !== false,
        dossierUpdates: preferences.notifications.channels?.dossierUpdates !== false,
        taskReminders: preferences.notifications.channels?.taskReminders !== false,
        appointmentReminders: preferences.notifications.channels?.appointmentReminders !== false,
        systemAlerts: preferences.notifications.channels?.systemAlerts !== false
      });
    }

    if (preferences.ui || preferences.formats) {
      this.appearanceForm.patchValue({
        theme: preferences.ui?.theme || 'light',
        dateFormat: preferences.formats?.dateFormat || 'dd/MM/yyyy',
        timeFormat: preferences.formats?.timeFormat || 'HH:mm',
        numberFormat: preferences.formats?.numberFormat || 'fr-FR',
        currency: preferences.formats?.currency || 'EUR',
        timezone: preferences.formats?.timezone || 'Europe/Paris',
        firstDayOfWeek: preferences.formats?.firstDayOfWeek || 1
      });
      
      this.previewTheme = this.appearanceForm.get('theme')?.value || 'light';
      this.previewDateFormat = this.appearanceForm.get('dateFormat')?.value || 'dd/MM/yyyy';
      this.previewTimeFormat = this.appearanceForm.get('timeFormat')?.value || 'HH:mm';
    }

    if (preferences.shortcuts) {
      this.shortcutsForm.patchValue({
        keyboardShortcutsEnabled: preferences.shortcuts.keyboardShortcutsEnabled !== false,
        showShortcutHints: preferences.shortcuts.showShortcutHints !== false,
        searchShortcut: preferences.shortcuts.searchShortcut || '/',
        commandPaletteShortcut: preferences.shortcuts.commandPaletteShortcut || 'Ctrl+K',
        navigateAnnouncesShortcut: preferences.shortcuts.navigateAnnouncesShortcut || 'g+a',
        navigateDossiersShortcut: preferences.shortcuts.navigateDossiersShortcut || 'g+d'
      });
    }

    if (this.isAdmin && this.integrationsForm && preferences.integrations) {
      this.integrationsForm.patchValue({
        calendarSyncEnabled: preferences.integrations.calendarSyncEnabled || false,
        calendarProvider: preferences.integrations.calendarProvider || 'google',
        emailIntegrationEnabled: preferences.integrations.emailIntegrationEnabled || false,
        emailProvider: preferences.integrations.emailProvider || 'outlook',
        whatsappEnabled: preferences.integrations.whatsappEnabled !== false,
        voipEnabled: preferences.integrations.voipEnabled || false
      });
    }

    if (this.isSuperAdmin && this.systemForm && preferences.system) {
      this.systemForm.patchValue({
        debugMode: preferences.system.debugMode || false,
        performanceMonitoring: preferences.system.performanceMonitoring !== false,
        errorReporting: preferences.system.errorReporting !== false,
        analyticsEnabled: preferences.system.analyticsEnabled !== false,
        maintenanceMode: preferences.system.maintenanceMode || false
      });
    }
  }

  private setupFormListeners(): void {
    this.appearanceForm.get('theme')?.valueChanges
      .pipe(debounceTime(100), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(theme => this.previewTheme = theme);

    this.appearanceForm.get('dateFormat')?.valueChanges
      .pipe(debounceTime(100), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(format => this.previewDateFormat = format);

    this.appearanceForm.get('timeFormat')?.valueChanges
      .pipe(debounceTime(100), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(format => this.previewTimeFormat = format);
  }

  onSave(): void {
    if (!this.areFormsValid()) {
      this.notificationService.warning('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.saving = true;
    const allValues = this.getAllFormValues();

    const saveOperations: Promise<any>[] = [];

    const uiPrefs = {
      theme: allValues.appearance.theme,
      language: allValues.preferences.language,
      dossierViewMode: allValues.preferences.dossierViewMode,
      sidebarCollapsed: allValues.preferences.sidebarCollapsed,
      density: allValues.preferences.density,
      animationsEnabled: allValues.preferences.animationsEnabled
    };
    saveOperations.push(this.userPreferencesService.updatePreferences('ui', uiPrefs).toPromise());

    const notificationPrefs = {
      emailEnabled: allValues.notifications.emailEnabled,
      pushEnabled: allValues.notifications.pushEnabled,
      smsEnabled: allValues.notifications.smsEnabled,
      inAppEnabled: allValues.notifications.inAppEnabled,
      soundEnabled: allValues.notifications.soundEnabled,
      desktopEnabled: allValues.notifications.desktopEnabled,
      channels: {
        dossierUpdates: allValues.notifications.dossierUpdates,
        taskReminders: allValues.notifications.taskReminders,
        appointmentReminders: allValues.notifications.appointmentReminders,
        systemAlerts: allValues.notifications.systemAlerts
      }
    };
    saveOperations.push(this.userPreferencesService.updatePreferences('notifications', notificationPrefs).toPromise());

    const formatPrefs = {
      dateFormat: allValues.appearance.dateFormat,
      timeFormat: allValues.appearance.timeFormat,
      numberFormat: allValues.appearance.numberFormat,
      currency: allValues.appearance.currency,
      timezone: allValues.appearance.timezone,
      firstDayOfWeek: allValues.appearance.firstDayOfWeek
    };
    saveOperations.push(this.userPreferencesService.updatePreferences('formats', formatPrefs).toPromise());

    const shortcutPrefs = {
      keyboardShortcutsEnabled: allValues.shortcuts.keyboardShortcutsEnabled,
      showShortcutHints: allValues.shortcuts.showShortcutHints,
      searchShortcut: allValues.shortcuts.searchShortcut,
      commandPaletteShortcut: allValues.shortcuts.commandPaletteShortcut,
      navigateAnnouncesShortcut: allValues.shortcuts.navigateAnnouncesShortcut,
      navigateDossiersShortcut: allValues.shortcuts.navigateDossiersShortcut
    };
    saveOperations.push(this.userPreferencesService.updatePreferences('shortcuts', shortcutPrefs).toPromise());

    if (this.isAdmin && this.integrationsForm) {
      saveOperations.push(this.userPreferencesService.updatePreferences('integrations', allValues.integrations).toPromise());
    }

    if (this.isSuperAdmin && this.systemForm) {
      saveOperations.push(this.userPreferencesService.updatePreferences('system', allValues.system).toPromise());
    }

    Promise.all(saveOperations)
      .then(() => {
        this.themeService.setTheme(allValues.appearance.theme);
        this.originalValues = allValues;
        this.saving = false;
        this.notificationService.success('Préférences enregistrées avec succès');
      })
      .catch((error) => {
        console.error('Error saving preferences:', error);
        this.saving = false;
        this.notificationService.error('Erreur lors de l\'enregistrement des préférences');
      });
  }

  onCancel(): void {
    if (this.hasUnsavedChanges()) {
      this.populateFormValues(this.originalValues);
      this.notificationService.info('Modifications annulées');
    }
  }

  onRestoreDefaults(): void {
    if (confirm('Êtes-vous sûr de vouloir restaurer les paramètres par défaut ? Cette action est irréversible.')) {
      this.loading = true;
      
      this.userPreferencesService.resetToDefaults()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.populateFormValues(DEFAULT_PREFERENCES);
            this.originalValues = this.getAllFormValues();
            this.loading = false;
            this.notificationService.success('Paramètres par défaut restaurés');
          },
          error: (error) => {
            console.error('Error resetting preferences:', error);
            this.loading = false;
            this.notificationService.error('Erreur lors de la restauration des paramètres par défaut');
          }
        });
    }
  }

  hasUnsavedChanges(): boolean {
    const currentValues = this.getAllFormValues();
    return JSON.stringify(currentValues) !== JSON.stringify(this.originalValues);
  }

  areFormsValid(): boolean {
    const forms = [this.preferencesForm, this.notificationsForm, this.appearanceForm, this.shortcutsForm];
    if (this.isAdmin && this.integrationsForm) forms.push(this.integrationsForm);
    if (this.isSuperAdmin && this.systemForm) forms.push(this.systemForm);
    return forms.every(form => form.valid);
  }

  private getAllFormValues(): any {
    const values: any = {
      preferences: this.preferencesForm.value,
      notifications: this.notificationsForm.value,
      appearance: this.appearanceForm.value,
      shortcuts: this.shortcutsForm.value
    };
    if (this.isAdmin && this.integrationsForm) values.integrations = this.integrationsForm.value;
    if (this.isSuperAdmin && this.systemForm) values.system = this.systemForm.value;
    return values;
  }

  getFormattedPreviewDate(): string {
    try {
      const date = this.previewSampleDate;
      const format = this.previewDateFormat;
      
      if (format === 'dd/MM/yyyy') {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      } else if (format === 'MM/dd/yyyy') {
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      } else if (format === 'yyyy-MM-dd') {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      } else if (format === 'd MMMM yyyy') {
        const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
      }
      
      return date.toLocaleDateString('fr-FR');
    } catch (e) {
      return 'Format invalide';
    }
  }

  getFormattedPreviewTime(): string {
    try {
      const date = this.previewSampleDate;
      const format = this.previewTimeFormat;
      
      if (format === 'HH:mm') {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else if (format === 'hh:mm a') {
        const hours = date.getHours();
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const period = hours >= 12 ? 'PM' : 'AM';
        return `${displayHours.toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} ${period}`;
      }
      
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Format invalide';
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  getDensityDescription(): string {
    const densityValue = this.preferencesForm.get('density')?.value;
    const density = this.densities.find(d => d.value === densityValue);
    return density?.description || '';
  }

  getFormControlValue(form: FormGroup, controlName: string): boolean {
    return form?.get(controlName)?.value || false;
  }
}
