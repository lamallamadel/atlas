import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SettingsPageComponent } from './settings-page.component';
import { UserPreferencesService } from '../services/user-preferences.service';
import { ThemeService } from '../services/theme.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { DEFAULT_PREFERENCES } from '../models/user-preferences.model';

describe('SettingsPageComponent', () => {
  let component: SettingsPageComponent;
  let fixture: ComponentFixture<SettingsPageComponent>;
  let mockUserPreferencesService: AngularVitestPartialMock<UserPreferencesService>;
  let mockThemeService: AngularVitestPartialMock<ThemeService>;
  let mockNotificationService: AngularVitestPartialMock<NotificationService>;
  let mockAuthService: AngularVitestPartialMock<AuthService>;

  beforeEach(async () => {
    mockUserPreferencesService = {
      getPreferences: vi.fn().mockName('UserPreferencesService.getPreferences'),
      updatePreferences: vi
        .fn()
        .mockName('UserPreferencesService.updatePreferences'),
      resetToDefaults: vi
        .fn()
        .mockName('UserPreferencesService.resetToDefaults'),
    };
    mockThemeService = {
      setTheme: vi.fn().mockName('ThemeService.setTheme'),
    };
    mockNotificationService = {
      success: vi.fn().mockName('NotificationService.success'),
      error: vi.fn().mockName('NotificationService.error'),
      warning: vi.fn().mockName('NotificationService.warning'),
      info: vi.fn().mockName('NotificationService.info'),
    };
    mockAuthService = {
      getUserRoles: vi.fn().mockName('AuthService.getUserRoles'),
    };

    mockUserPreferencesService.getPreferences.mockReturnValue(
      of(DEFAULT_PREFERENCES)
    );
    mockUserPreferencesService.updatePreferences.mockReturnValue(
      of({ category: 'ui', preferences: {} })
    );
    mockUserPreferencesService.resetToDefaults.mockReturnValue(
      of(DEFAULT_PREFERENCES)
    );
    mockAuthService.getUserRoles.mockReturnValue([]);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatTabsModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatButtonToggleModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatDividerModule,
        SettingsPageComponent,
      ],
      providers: [
        {
          provide: UserPreferencesService,
          useValue: mockUserPreferencesService,
        },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms on init', () => {
    fixture.detectChanges();

    expect(component.preferencesForm).toBeDefined();
    expect(component.notificationsForm).toBeDefined();
    expect(component.appearanceForm).toBeDefined();
    expect(component.shortcutsForm).toBeDefined();
  });

  it('should load preferences on init', () => {
    fixture.detectChanges();

    expect(mockUserPreferencesService.getPreferences).toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should check user roles and show appropriate tabs', () => {
    mockAuthService.getUserRoles.mockReturnValue(['ROLE_ADMIN']);
    fixture.detectChanges();

    expect(component.isAdmin).toBe(true);
    expect(component.tabs.length).toBeGreaterThan(4);
  });

  it('should save all preferences', async () => {
    fixture.detectChanges();

    component.onSave();

    await fixture.whenStable();

    expect(mockUserPreferencesService.updatePreferences).toHaveBeenCalled();
    expect(mockNotificationService.success).toHaveBeenCalledWith(
      'Préférences enregistrées avec succès'
    );
  });

  it('should handle save errors', async () => {
    fixture.detectChanges();

    mockUserPreferencesService.updatePreferences.mockReturnValue(
      throwError(() => new Error('Save error'))
    );

    component.onSave();

    await fixture.whenStable();

    expect(mockNotificationService.error).toHaveBeenCalledWith(
      "Erreur lors de l'enregistrement des préférences"
    );
  });

  it('should cancel changes and restore original values', () => {
    fixture.detectChanges();

    component.preferencesForm.patchValue({ language: 'en' });

    component.onCancel();

    expect(mockNotificationService.info).toHaveBeenCalledWith(
      'Modifications annulées'
    );
  });

  it('should restore default preferences', async () => {
    fixture.detectChanges();

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.onRestoreDefaults();

    await fixture.whenStable();

    expect(mockUserPreferencesService.resetToDefaults).toHaveBeenCalled();
    expect(mockNotificationService.success).toHaveBeenCalledWith(
      'Paramètres par défaut restaurés'
    );
  });

  it('should detect unsaved changes', () => {
    fixture.detectChanges();

    expect(component.hasUnsavedChanges()).toBe(false);

    component.preferencesForm.patchValue({ language: 'en' });

    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('should validate forms correctly', () => {
    fixture.detectChanges();

    expect(component.areFormsValid()).toBe(true);

    component.preferencesForm.patchValue({ language: '' });

    expect(component.areFormsValid()).toBe(false);
  });

  it('should update theme preview on theme change', async () => {
    fixture.detectChanges();

    component.appearanceForm.patchValue({ theme: 'dark' });
    await new Promise<void>((resolve) => setTimeout(resolve, 160));

    expect(component.previewTheme).toBe('dark');
  });

  it('should format preview date correctly', () => {
    fixture.detectChanges();

    component.previewDateFormat = 'dd/MM/yyyy';
    const formatted = component.getFormattedPreviewDate();

    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('should format preview time correctly', () => {
    fixture.detectChanges();

    component.previewTimeFormat = 'HH:mm';
    const formatted = component.getFormattedPreviewTime();

    expect(formatted).toMatch(/\d{2}:\d{2}/);
  });

  it('should handle tab changes', () => {
    fixture.detectChanges();

    component.onTabChange(1);

    expect(component.selectedTabIndex).toBe(1);
  });

  it('should not save if forms are invalid', () => {
    fixture.detectChanges();

    component.preferencesForm.patchValue({ language: '' });

    component.onSave();

    expect(mockNotificationService.warning).toHaveBeenCalledWith(
      'Veuillez corriger les erreurs dans le formulaire'
    );
    expect(mockUserPreferencesService.updatePreferences).not.toHaveBeenCalled();
  });

  it('should handle loading preferences error', () => {
    mockUserPreferencesService.getPreferences.mockReturnValue(
      throwError(() => new Error('Load error'))
    );

    fixture.detectChanges();

    expect(mockNotificationService.error).toHaveBeenCalledWith(
      'Erreur lors du chargement des préférences'
    );
  });
});
