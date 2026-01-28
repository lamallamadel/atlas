import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { UiPreferencesFormComponent } from './ui-preferences-form.component';
import { UserPreferencesService } from '../services/user-preferences.service';
import { ThemeService } from '../services/theme.service';
import { NotificationService } from '../services/notification.service';

describe('UiPreferencesFormComponent', () => {
  let component: UiPreferencesFormComponent;
  let fixture: ComponentFixture<UiPreferencesFormComponent>;
  let userPreferencesService: jasmine.SpyObj<UserPreferencesService>;
  let themeService: jasmine.SpyObj<ThemeService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockPreferences = {
    ui: {
      theme: 'light',
      language: 'fr',
      density: 'comfortable',
      defaultRoute: '/dashboard',
      syncDevices: true
    }
  };

  beforeEach(async () => {
    const userPreferencesServiceSpy = jasmine.createSpyObj('UserPreferencesService', [
      'getPreferences',
      'updatePreferences'
    ]);
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', ['setTheme']);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'warning',
      'info'
    ]);

    await TestBed.configureTestingModule({
      declarations: [UiPreferencesFormComponent],
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatRadioModule,
        MatButtonToggleModule,
        MatAutocompleteModule,
        MatCheckboxModule,
        MatIconModule,
        MatButtonModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatDividerModule
      ],
      providers: [
        { provide: UserPreferencesService, useValue: userPreferencesServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    userPreferencesService = TestBed.inject(UserPreferencesService) as jasmine.SpyObj<UserPreferencesService>;
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    userPreferencesService.getPreferences.and.returnValue(of(mockPreferences));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UiPreferencesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.preferencesForm).toBeDefined();
    expect(component.preferencesForm.get('theme')?.value).toBe('light');
    expect(component.preferencesForm.get('language')?.value).toBe('fr');
    expect(component.preferencesForm.get('density')?.value).toBe('comfortable');
    expect(component.preferencesForm.get('defaultRoute')?.value).toBe('/dashboard');
    expect(component.preferencesForm.get('syncDevices')?.value).toBe(true);
  });

  it('should load preferences on init', () => {
    expect(userPreferencesService.getPreferences).toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should update preview values when form changes', (done) => {
    component.preferencesForm.patchValue({
      theme: 'dark',
      language: 'en',
      density: 'compact'
    });

    setTimeout(() => {
      expect(component.previewTheme).toBe('dark');
      expect(component.previewLanguage).toBe('en');
      expect(component.previewDensity).toBe('compact');
      done();
    }, 200);
  });

  it('should filter routes based on search input', (done) => {
    component.preferencesForm.patchValue({
      defaultRouteInput: 'dash'
    });

    setTimeout(() => {
      expect(component.filteredRoutes.length).toBeGreaterThan(0);
      expect(component.filteredRoutes[0].path).toBe('/dashboard');
      done();
    }, 300);
  });

  it('should save preferences successfully', () => {
    userPreferencesService.updatePreferences.and.returnValue(of({ category: 'ui', preferences: {} }));
    
    component.preferencesForm.patchValue({
      theme: 'dark',
      language: 'en'
    });

    component.onSave();

    expect(userPreferencesService.updatePreferences).toHaveBeenCalledWith('ui', jasmine.objectContaining({
      theme: 'dark',
      language: 'en'
    }));
    expect(themeService.setTheme).toHaveBeenCalledWith('dark');
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('should handle save error', () => {
    userPreferencesService.updatePreferences.and.returnValue(throwError({ error: 'Error' }));
    
    component.onSave();

    expect(notificationService.error).toHaveBeenCalled();
    expect(component.saving).toBe(false);
  });

  it('should cancel changes', () => {
    const originalValues = { ...component.preferencesForm.value };
    
    component.preferencesForm.patchValue({
      theme: 'dark'
    });

    component.onCancel();

    expect(notificationService.info).toHaveBeenCalled();
  });

  it('should detect unsaved changes', () => {
    expect(component.hasUnsavedChanges()).toBe(false);
    
    component.preferencesForm.patchValue({
      theme: 'dark'
    });

    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('should generate correct preview classes', () => {
    component.previewTheme = 'dark';
    component.previewDensity = 'compact';
    component.previewLanguage = 'en';

    const classes = component.getPreviewClasses();

    expect(classes).toContain('theme-dark');
    expect(classes).toContain('density-compact');
    expect(classes).toContain('lang-en');
  });

  it('should get correct preview text based on language', () => {
    component.previewLanguage = 'fr';
    let text = component.getPreviewText();
    expect(text.welcome).toBe('Bienvenue');

    component.previewLanguage = 'en';
    text = component.getPreviewText();
    expect(text.welcome).toBe('Welcome');

    component.previewLanguage = 'es';
    text = component.getPreviewText();
    expect(text.welcome).toBe('Bienvenido');
  });

  it('should handle route selection', () => {
    const route = { path: '/tasks', label: 'Tâches', icon: 'task' };
    
    component.onRouteSelected(route);

    expect(component.preferencesForm.get('defaultRoute')?.value).toBe('/tasks');
    expect(component.preferencesForm.get('defaultRouteInput')?.value).toBe('Tâches');
  });

  it('should display route function correctly', () => {
    const label = component.displayRouteFn('/dashboard');
    expect(label).toBe('Tableau de bord');

    const unknownLabel = component.displayRouteFn('/unknown');
    expect(unknownLabel).toBe('/unknown');
  });

  it('should show sync notification when sync is enabled', () => {
    userPreferencesService.updatePreferences.and.returnValue(of({ category: 'ui', preferences: {} }));
    
    component.preferencesForm.patchValue({
      syncDevices: true
    });

    component.onSave();

    expect(notificationService.success).toHaveBeenCalledWith(
      jasmine.stringContaining('synchronisées')
    );
  });

  it('should validate required fields', () => {
    component.preferencesForm.patchValue({
      theme: '',
      language: '',
      density: '',
      defaultRoute: ''
    });

    expect(component.preferencesForm.valid).toBe(false);
    
    component.onSave();
    
    expect(notificationService.warning).toHaveBeenCalled();
    expect(userPreferencesService.updatePreferences).not.toHaveBeenCalled();
  });
});
