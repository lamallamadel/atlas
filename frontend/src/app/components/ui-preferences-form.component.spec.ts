import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { UiPreferencesFormComponent } from './ui-preferences-form.component';
import { UserPreferencesService } from '../services/user-preferences.service';
import { ThemeService } from '../services/theme.service';
import { NotificationService } from '../services/notification.service';

describe('UiPreferencesFormComponent', () => {
  let component: UiPreferencesFormComponent;
  let fixture: ComponentFixture<UiPreferencesFormComponent>;
  let userPreferencesService: AngularVitestPartialMock<UserPreferencesService>;
  let themeService: AngularVitestPartialMock<ThemeService>;
  let notificationService: AngularVitestPartialMock<NotificationService>;

  const mockPreferences: any = {
    ui: {
      theme: 'light',
      language: 'fr',
      density: 'comfortable',
      defaultRoute: '/dashboard',
      syncDevices: true}};

  beforeEach(async () => {
    const userPreferencesServiceSpy = {
      getPreferences: vi.fn().mockName('UserPreferencesService.getPreferences'),
      updatePreferences: vi
        .fn()
        .mockName('UserPreferencesService.updatePreferences')};
    const themeServiceSpy = {
      setTheme: vi.fn().mockName('ThemeService.setTheme')};
    const notificationServiceSpy = {
      success: vi.fn().mockName('NotificationService.success'),
      error: vi.fn().mockName('NotificationService.error'),
      warning: vi.fn().mockName('NotificationService.warning'),
      info: vi.fn().mockName('NotificationService.info')};

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
        UiPreferencesFormComponent],
      providers: [
        {
          provide: UserPreferencesService,
          useValue: userPreferencesServiceSpy},
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }]}).compileComponents();

    userPreferencesService = TestBed.inject(
      UserPreferencesService
    ) as AngularVitestPartialMock<UserPreferencesService>;
    themeService = TestBed.inject(ThemeService) as AngularVitestPartialMock<ThemeService>;
    notificationService = TestBed.inject(
      NotificationService
    ) as AngularVitestPartialMock<NotificationService>;

    userPreferencesService.getPreferences.mockReturnValue(of(mockPreferences));
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
    expect(component.preferencesForm.get('syncDevices')?.value).toBe(true);
  });

  it('should load preferences on init', () => {
    expect(userPreferencesService.getPreferences).toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should update preview values when form changes', async () => {
    component.preferencesForm.patchValue({
      theme: 'dark',
      language: 'en',
      density: 'compact'});

    await new Promise<void>((resolve) => setTimeout(resolve, 200));
    expect(component.previewTheme).toBe('dark');
    expect(component.previewLanguage).toBe('en');
    expect(component.previewDensity).toBe('compact');
  });

  it('should save preferences successfully', () => {
    userPreferencesService.updatePreferences.mockReturnValue(
      of({ category: 'ui', preferences: {} })
    );

    component.preferencesForm.patchValue({
      theme: 'dark',
      language: 'en'});

    component.onSave();

    expect(userPreferencesService.updatePreferences).toHaveBeenCalledWith(
      'ui',
      expect.objectContaining({
        theme: 'dark',
        language: 'en'})
    );
    expect(themeService.setTheme).toHaveBeenCalledWith('dark');
    expect(notificationService.success).toHaveBeenCalled();
  });

  it('should handle save error', () => {
    userPreferencesService.updatePreferences.mockReturnValue(
      throwError({ error: 'Error' })
    );

    component.onSave();

    expect(notificationService.error).toHaveBeenCalled();
    expect(component.saving).toBe(false);
  });

  it('should cancel changes', () => {
    const originalValues = { ...component.preferencesForm.value };

    component.preferencesForm.patchValue({
      theme: 'dark'});

    component.onCancel();

    expect(notificationService.info).toHaveBeenCalled();
  });

  it('should detect unsaved changes', () => {
    expect(component.hasUnsavedChanges()).toBe(false);

    component.preferencesForm.patchValue({
      theme: 'dark'});

    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('should get correct preview texts based on language', () => {
    component.previewLanguage = 'fr';
    let text = component.getPreviewTexts();
    expect(text.welcome).toBe('Bienvenue');

    component.previewLanguage = 'en';
    text = component.getPreviewTexts();
    expect(text.welcome).toBe('Welcome');

    component.previewLanguage = 'es';
    text = component.getPreviewTexts();
    expect(text.welcome).toBe('Bienvenido');
  });

  it('should show success notification when saving', () => {
    userPreferencesService.updatePreferences.mockReturnValue(
      of({ category: 'ui', preferences: {} })
    );

    component.preferencesForm.patchValue({
      syncDevices: true});

    component.onSave();

    expect(notificationService.success).toHaveBeenCalledWith(
      'Préférences enregistrées avec succès'
    );
  });
});
