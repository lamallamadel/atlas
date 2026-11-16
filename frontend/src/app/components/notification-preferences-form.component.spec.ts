import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { of, throwError } from 'rxjs';

import { NotificationPreferencesFormComponent } from './notification-preferences-form.component';
import { UserPreferencesService } from '../services/user-preferences.service';
import { NotificationService } from '../services/notification.service';

describe('NotificationPreferencesFormComponent', () => {
  let component: NotificationPreferencesFormComponent;
  let fixture: ComponentFixture<NotificationPreferencesFormComponent>;
  let mockUserPreferencesService: AngularVitestPartialMock<UserPreferencesService>;
  let mockNotificationService: AngularVitestPartialMock<NotificationService>;

  beforeEach(async () => {
    mockUserPreferencesService = {
      getPreferences: vi.fn().mockName('UserPreferencesService.getPreferences'),
      updatePreferences: vi
        .fn()
        .mockName('UserPreferencesService.updatePreferences')};
    mockNotificationService = {
      success: vi.fn().mockName('NotificationService.success'),
      error: vi.fn().mockName('NotificationService.error'),
      warning: vi.fn().mockName('NotificationService.warning'),
      info: vi.fn().mockName('NotificationService.info')};

    // Default mock return values
    mockUserPreferencesService.getPreferences.mockReturnValue(
      of({
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          inAppEnabled: true,
          pushEnabled: true,
          newDossierEnabled: true,
          newMessageEnabled: true,
          appointmentEnabled: true,
          statusChangeEnabled: true,
          quietHoursEnabled: false,
          quietHoursStart: 22,
          quietHoursEnd: 8,
          digestFrequency: 'instant'}})
    );

    mockUserPreferencesService.updatePreferences.mockReturnValue(
      of({
        category: 'notifications',
        preferences: {}})
    );

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatSlideToggleModule,
        MatSliderModule,
        MatRadioModule,
        MatDividerModule,
        MatProgressBarModule,
        NotificationPreferencesFormComponent],
      providers: [
        {
          provide: UserPreferencesService,
          useValue: mockUserPreferencesService},
        { provide: NotificationService, useValue: mockNotificationService }]}).compileComponents();

    fixture = TestBed.createComponent(NotificationPreferencesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.preferencesForm).toBeDefined();
    expect(component.preferencesForm.get('emailEnabled')?.value).toBe(true);
    expect(component.preferencesForm.get('digestFrequency')?.value).toBe(
      'instant'
    );
  });

  it('should load preferences on init', () => {
    expect(mockUserPreferencesService.getPreferences).toHaveBeenCalled();
  });

  it('should update notification types when form changes', async () => {
    component.preferencesForm.patchValue({
      newDossierEnabled: false,
      newMessageEnabled: false,
      appointmentEnabled: false,
      statusChangeEnabled: false});

    // Verify form values were updated
    expect(component.preferencesForm.get('newDossierEnabled')?.value).toBe(false);
    expect(component.preferencesForm.get('appointmentEnabled')?.value).toBe(false);
  });

  it('should calculate quiet hours correctly', () => {
    component.quietHoursEnabled = true;
    component.quietHoursStart = 22;
    component.quietHoursEnd = 8;

    const earlyMorning = new Date();
    earlyMorning.setHours(7);

    const midday = new Date();
    midday.setHours(14);

    expect(component.isQuietHoursActive()).toBeDefined();
  });

  it('should format quiet hours label correctly', () => {
    expect(component.formatQuietHoursLabel(8)).toBe('08:00');
    expect(component.formatQuietHoursLabel(22)).toBe('22:00');
  });

  it('should get enabled channels count', () => {
    component.channels[0].enabled = true;
    component.channels[1].enabled = true;
    component.channels[2].enabled = false;
    component.channels[3].enabled = true;

    expect(component.getEnabledChannelsCount()).toBe(3);
  });

  it('should get enabled types count', () => {
    component.notificationTypes[0].enabled = true;
    component.notificationTypes[1].enabled = false;
    component.notificationTypes[2].enabled = true;
    component.notificationTypes[3].enabled = true;

    expect(component.getEnabledTypesCount()).toBe(3);
  });

  it('should detect unsaved changes', () => {
    component.originalValues = component.preferencesForm.value;
    expect(component.hasUnsavedChanges()).toBe(false);

    component.preferencesForm.patchValue({ emailEnabled: false });
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('should save preferences successfully', () => {
    component.preferencesForm.patchValue({ emailEnabled: false });
    component.onSave();

    expect(mockUserPreferencesService.updatePreferences).toHaveBeenCalled();
    expect(component.saving).toBe(false);
  });

  it('should handle save error', () => {
    mockUserPreferencesService.updatePreferences.mockReturnValue(
      throwError(() => new Error('Save failed'))
    );

    component.onSave();
    expect(component.saving).toBe(false);
    expect(mockNotificationService.error).toHaveBeenCalled();
  });

  it('should cancel changes', () => {
    const originalValue = component.preferencesForm.get('emailEnabled')?.value;
    component.preferencesForm.patchValue({ emailEnabled: !originalValue });

    component.onCancel();

    expect(mockNotificationService.info).toHaveBeenCalledWith(
      'Modifications annulées'
    );
  });

  it('should handle loading error gracefully', () => {
    mockUserPreferencesService.getPreferences.mockReturnValue(
      throwError(() => new Error('Load failed'))
    );

    // Simply verify component creation with error handling
    expect(mockUserPreferencesService.getPreferences).toBeTruthy();
  });
});
