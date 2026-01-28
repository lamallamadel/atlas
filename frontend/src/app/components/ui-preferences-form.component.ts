import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserPreferencesService } from '../services/user-preferences.service';
import { ThemeService } from '../services/theme.service';
import { NotificationService } from '../services/notification.service';

interface Route {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-ui-preferences-form',
  templateUrl: './ui-preferences-form.component.html',
  styleUrls: ['./ui-preferences-form.component.css']
})
export class UiPreferencesFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  preferencesForm!: FormGroup;
  loading = false;
  saving = false;
  
  // Preview state
  previewTheme: 'light' | 'dark' | 'auto' = 'light';
  previewLanguage = 'fr';
  previewDensity: 'compact' | 'comfortable' | 'spacious' = 'comfortable';
  previewDefaultRoute = '/dashboard';
  syncDevices = true;
  
  // Original values for dirty check
  private originalValues: any = {};
  
  // Available options
  themes = [
    { value: 'light', label: 'Clair', icon: 'light_mode' },
    { value: 'dark', label: 'Sombre', icon: 'dark_mode' },
    { value: 'auto', label: 'Auto', icon: 'brightness_auto' }
  ];
  
  languages = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'es', label: 'Español', flag: '🇪🇸' }
  ];
  
  densities = [
    { 
      value: 'compact', 
      label: 'Compact', 
      description: 'Maximum de contenu sur l\'écran',
      icon: 'view_compact'
    },
    { 
      value: 'comfortable', 
      label: 'Confortable', 
      description: 'Équilibre entre contenu et espacement',
      icon: 'view_comfortable'
    },
    { 
      value: 'spacious', 
      label: 'Spacieux', 
      description: 'Plus d\'espace, moins de contenu',
      icon: 'view_cozy'
    }
  ];
  
  availableRoutes: Route[] = [
    { path: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { path: '/dossiers', label: 'Dossiers', icon: 'folder' },
    { path: '/annonces', label: 'Annonces', icon: 'home' },
    { path: '/tasks', label: 'Tâches', icon: 'task' },
    { path: '/calendar', label: 'Calendrier', icon: 'calendar_today' },
    { path: '/search', label: 'Recherche', icon: 'search' },
    { path: '/reports', label: 'Rapports', icon: 'assessment' }
  ];
  
  filteredRoutes: Route[] = [];

  constructor(
    private fb: FormBuilder,
    private userPreferencesService: UserPreferencesService,
    private themeService: ThemeService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPreferences();
    this.setupFormListeners();
    this.filteredRoutes = [...this.availableRoutes];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.preferencesForm = this.fb.group({
      theme: ['light', Validators.required],
      language: ['fr', Validators.required],
      density: ['comfortable', Validators.required],
      defaultRoute: ['/dashboard', Validators.required],
      syncDevices: [true],
      defaultRouteInput: ['']
    });
  }

  private loadPreferences(): void {
    this.loading = true;
    
    this.userPreferencesService.getPreferences()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (preferences) => {
          if (preferences.ui) {
            this.preferencesForm.patchValue({
              theme: preferences.ui.theme || 'light',
              language: preferences.ui.language || 'fr',
              density: preferences.ui.density || 'comfortable',
              defaultRoute: preferences.ui.defaultRoute || '/dashboard',
              syncDevices: preferences.ui.syncDevices !== false
            });
            
            this.updatePreviewValues();
          }
          this.originalValues = this.preferencesForm.value;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading UI preferences:', error);
          this.notificationService.error('Erreur lors du chargement des préférences');
          this.loading = false;
        }
      });
  }

  private setupFormListeners(): void {
    // Update preview on form changes
    this.preferencesForm.valueChanges
      .pipe(debounceTime(100), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updatePreviewValues();
      });
    
    // Autocomplete filter for routes
    this.preferencesForm.get('defaultRouteInput')?.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(value => {
        this.filterRoutes(value);
      });
  }

  private updatePreviewValues(): void {
    const formValue = this.preferencesForm.value;
    this.previewTheme = formValue.theme;
    this.previewLanguage = formValue.language;
    this.previewDensity = formValue.density;
    this.previewDefaultRoute = formValue.defaultRoute;
    this.syncDevices = formValue.syncDevices;
  }

  private filterRoutes(searchValue: string): void {
    if (!searchValue) {
      this.filteredRoutes = [...this.availableRoutes];
      return;
    }
    
    const filterValue = searchValue.toLowerCase();
    this.filteredRoutes = this.availableRoutes.filter(route =>
      route.label.toLowerCase().includes(filterValue) ||
      route.path.toLowerCase().includes(filterValue)
    );
  }

  onRouteSelected(route: Route): void {
    this.preferencesForm.patchValue({
      defaultRoute: route.path,
      defaultRouteInput: route.label
    });
  }

  displayRouteFn(path: string): string {
    const route = this.availableRoutes.find(r => r.path === path);
    return route ? route.label : path;
  }

  onSave(): void {
    if (!this.preferencesForm.valid) {
      this.notificationService.warning('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.saving = true;
    const formValue = this.preferencesForm.value;

    const uiPreferences = {
      theme: formValue.theme,
      language: formValue.language,
      density: formValue.density,
      defaultRoute: formValue.defaultRoute,
      syncDevices: formValue.syncDevices
    };

    this.userPreferencesService.updatePreferences('ui', uiPreferences)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.themeService.setTheme(formValue.theme);
          this.originalValues = this.preferencesForm.value;
          this.saving = false;
          
          if (formValue.syncDevices) {
            this.notificationService.success('Préférences enregistrées et synchronisées sur tous vos appareils');
          } else {
            this.notificationService.success('Préférences enregistrées avec succès');
          }
        },
        error: (error) => {
          console.error('Error saving UI preferences:', error);
          this.saving = false;
          this.notificationService.error('Erreur lors de l\'enregistrement des préférences');
        }
      });
  }

  onCancel(): void {
    if (this.hasUnsavedChanges()) {
      this.preferencesForm.patchValue(this.originalValues);
      this.updatePreviewValues();
      this.notificationService.info('Modifications annulées');
    }
  }

  hasUnsavedChanges(): boolean {
    return JSON.stringify(this.preferencesForm.value) !== JSON.stringify(this.originalValues);
  }

  getPreviewClasses(): string {
    const classes = ['preview-zone'];
    classes.push(`theme-${this.previewTheme}`);
    classes.push(`density-${this.previewDensity}`);
    classes.push(`lang-${this.previewLanguage}`);
    return classes.join(' ');
  }

  getSelectedRoute(): Route | undefined {
    return this.availableRoutes.find(r => r.path === this.previewDefaultRoute);
  }

  getThemeLabel(): string {
    const theme = this.themes.find(t => t.value === this.previewTheme);
    return theme ? theme.label : '';
  }

  getLanguageLabel(): string {
    const language = this.languages.find(l => l.value === this.previewLanguage);
    return language ? language.label : '';
  }

  getDensityLabel(): string {
    const density = this.densities.find(d => d.value === this.previewDensity);
    return density ? density.label : '';
  }

  getPreviewText(): { welcome: string; description: string; button: string } {
    const texts = {
      fr: {
        welcome: 'Bienvenue',
        description: 'Ceci est un aperçu de vos préférences d\'interface',
        button: 'Action d\'exemple'
      },
      en: {
        welcome: 'Welcome',
        description: 'This is a preview of your interface preferences',
        button: 'Example action'
      },
      es: {
        welcome: 'Bienvenido',
        description: 'Esta es una vista previa de sus preferencias de interfaz',
        button: 'Acción de ejemplo'
      }
    };
    
    return texts[this.previewLanguage as keyof typeof texts] || texts.fr;
  }
}
