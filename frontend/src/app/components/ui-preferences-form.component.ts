import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserPreferencesService } from '../services/user-preferences.service';
import { ThemeService } from '../services/theme.service';
import { NotificationService } from '../services/notification.service';
import { CommonModule } from '@angular/common';
import {
  DsCardComponent,
  DsButtonComponent,
  DsIconComponent,
  DsSelectComponent,
  DsSelectOption,
  DsInputComponent,
  DsCheckboxComponent,
  DsProgressBarComponent,
  DsSkeletonComponent
} from '../design-system';

@Component({
    selector: 'app-ui-preferences-form',
    standalone: true,
    templateUrl: './ui-preferences-form.component.html',
    styleUrls: ['./ui-preferences-form.component.css'],
    imports: [
      CommonModule,
      FormsModule, 
      ReactiveFormsModule, 
      DsCardComponent, 
      DsButtonComponent,
      DsIconComponent,
      DsSelectComponent,
      DsInputComponent,
      DsCheckboxComponent,
      DsProgressBarComponent,
      DsSkeletonComponent
    ]
})
export class UiPreferencesFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private userPreferencesService = inject(UserPreferencesService);
  private themeService = inject(ThemeService);
  private notificationService = inject(NotificationService);

  preferencesForm!: FormGroup;
  loading = false;
  saving = false;
  
  originalValues: any = {};
  
  readonly densities: Array<DsSelectOption & { description: string }> = [
    { value: 'compact', label: 'Compact', description: 'Maximum d\'informations, idéal pour les experts' },
    { value: 'comfortable', label: 'Confortable', description: 'Espacement équilibré pour une lecture facile' },
    { value: 'spacious', label: 'Aéré', description: 'Grand espacement pour une concentration maximale' }
  ];

  readonly languages: DsSelectOption[] = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'Anglais' },
    { value: 'es', label: 'Espagnol' },
    { value: 'de', label: 'Allemand' }
  ];

  previewTheme = 'light';
  previewDensity = 'comfortable';
  previewLanguage = 'fr';

  ngOnInit(): void {
    this.initializeForm();
    this.loadPreferences();
    this.setupPreviewSync();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.preferencesForm = this.fb.group({
      theme: ['light'],
      density: ['comfortable'],
      language: ['fr'],
      animationsEnabled: [true],
      sidebarCollapsed: [false],
      syncDevices: [true],
      defaultRoute: ['/dashboard']
    });
  }

  private loadPreferences(): void {
    this.loading = true;
    this.userPreferencesService.getPreferences()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (prefs) => {
          const ui = (prefs['ui'] as any) ?? prefs;
          this.preferencesForm.patchValue({
            theme: ui['theme'] || 'light',
            density: ui['density'] || 'comfortable',
            language: ui['language'] || 'fr',
            animationsEnabled: ui['animationsEnabled'] !== false,
            sidebarCollapsed: ui['sidebarCollapsed'] || false,
            syncDevices: ui['syncDevices'] !== false
          });
          this.originalValues = this.preferencesForm.value;
          this.updatePreviews(this.originalValues);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading preferences:', err);
          this.notificationService.error('Erreur lors du chargement des préférences');
          this.loading = false;
        }
      });
  }

  private setupPreviewSync(): void {
    this.preferencesForm.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(values => {
        this.updatePreviews(values);
      });
  }

  private updatePreviews(values: any): void {
    this.previewTheme = values.theme;
    this.previewDensity = values.density;
    this.previewLanguage = values.language;
  }

  onSave(): void {
    if (this.preferencesForm.invalid) return;

    this.saving = true;
    const values = this.preferencesForm.value;

    this.userPreferencesService.updatePreferences('ui', values)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.originalValues = { ...values };
          this.saving = false;
          this.notificationService.success('Préférences enregistrées avec succès');
          
          if (values.theme) {
            this.themeService.setTheme(values.theme);
          }
        },
        error: (err) => {
          console.error('Error saving preferences:', err);
          this.saving = false;
          this.notificationService.error('Erreur lors de l\'enregistrement');
        }
      });
  }

  onCancel(): void {
    this.preferencesForm.patchValue(this.originalValues);
    this.notificationService.info('Modifications annulées');
  }

  hasUnsavedChanges(): boolean {
    return JSON.stringify(this.preferencesForm.value) !== JSON.stringify(this.originalValues);
  }

  getDensityDescription(): string {
    const densityValue = this.preferencesForm.get('density')?.value;
    const density = this.densities.find(d => d.value === densityValue);
    return density?.description || '';
  }

  readonly themes: DsSelectOption[] = [
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
    { value: 'auto', label: 'Automatique' }
  ];

  readonly routeOptions: DsSelectOption[] = [
    { value: '/dashboard', label: 'Tableau de bord' },
    { value: '/dossiers', label: 'Dossiers' },
    { value: '/annonces', label: 'Annonces' },
    { value: '/tasks', label: 'Tâches' }
  ];

  getPreviewClasses(): string {
    return `theme-${this.previewTheme} density-${this.previewDensity} lang-${this.previewLanguage}`;
  }

  getThemeLabel(): string {
    const map: Record<string, string> = { light: 'Clair', dark: 'Sombre', auto: 'Automatique' };
    return map[this.previewTheme] ?? this.previewTheme;
  }

  getLanguageLabel(): string {
    return this.languages.find(l => l.value === this.previewLanguage)?.label ?? this.previewLanguage;
  }

  getDensityLabel(): string {
    return this.densities.find(d => d.value === this.previewDensity)?.label ?? this.previewDensity;
  }

  getPreviewTexts(): any {
    const texts: any = {
      fr: {
        welcome: 'Bienvenue',
        description: 'Ceci est un aperçu de vos préférences d\'interface',
        button: 'Action d\'exemple'
      },
      en: {
        welcome: 'Welcome',
        description: 'This is a preview of your interface preferences',
        button: 'Example Action'
      },
      es: {
        welcome: 'Bienvenido',
        description: 'Esta est una vista previa de sus preferencias de interfaz',
        button: 'Acción de exemple'
      }
    };
    
    return texts[this.previewLanguage as keyof typeof texts] || texts.fr;
  }
}
