import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { trigger, style, transition, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserPreferencesService } from '../services/user-preferences.service';
import { NotificationService } from '../services/notification.service';
import { CommonModule } from '@angular/common';
import { 
  DsCardComponent, 
  DsSkeletonComponent, 
  DsButtonComponent, 
  DsIconComponent, 
  DsRadioGroupComponent, 
  DsRadioOption,
  DsBadgeComponent,
  DsProgressBarComponent,
  DsSwitchComponent,
  DsSelectComponent,
  DsSelectOption,
  DsInputComponent
} from '../design-system';

interface NotificationChannel {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

interface NotificationType {
  id: string;
  label: string;
  description: string;
  icon: string;
  enabled: boolean;
}

@Component({
    selector: 'app-notification-preferences-form',
    standalone: true,
    templateUrl: './notification-preferences-form.component.html',
    styleUrls: ['./notification-preferences-form.component.css'],
    animations: [
        trigger('slideDown', [
            transition(':enter', [
                style({ height: '0', opacity: '0', overflow: 'hidden' }),
                animate('300ms ease-out', style({ height: '*', opacity: '1' }))
            ]),
            transition(':leave', [
                style({ height: '*', opacity: '1', overflow: 'hidden' }),
                animate('300ms ease-in', style({ height: '0', opacity: '0' }))
            ])
        ])
    ],
    imports: [
      CommonModule,
      FormsModule, 
      ReactiveFormsModule, 
      DsCardComponent, 
      DsSkeletonComponent, 
      DsIconComponent, 
      DsButtonComponent, 
      DsRadioGroupComponent, 
      DsBadgeComponent,
      DsProgressBarComponent,
      DsSwitchComponent,
      DsSelectComponent,
      DsInputComponent
    ]
})
export class NotificationPreferencesFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private userPreferencesService = inject(UserPreferencesService);
  private notificationService = inject(NotificationService);

  preferencesForm!: FormGroup;
  loading = false;
  saving = false;

  originalValues: Record<string, unknown> = {};

  channels: NotificationChannel[] = [
    { id: 'email', label: 'Email', description: 'Recevez des notifications par email', icon: 'mail', enabled: true },
    { id: 'sms', label: 'SMS', description: 'Recevez des alertes par SMS', icon: 'phone', enabled: false },
    { id: 'inApp', label: 'Dans l\'application', description: 'Notifications dans l\'interface', icon: 'bell', enabled: true },
    { id: 'push', label: 'Push', description: 'Notifications push dans le navigateur', icon: 'megaphone', enabled: true }
  ];

  notificationTypes: NotificationType[] = [
    { id: 'newDossier', label: 'Nouveau dossier', description: 'Notification lors de la création d\'un nouveau dossier', icon: 'folder', enabled: true },
    { id: 'newMessage', label: 'Nouveau message', description: 'Notification lors de la réception d\'un message', icon: 'mail', enabled: true },
    { id: 'appointment', label: 'Rendez-vous', description: 'Rappels de rendez-vous à venir', icon: 'calendar', enabled: true },
    { id: 'statusChange', label: 'Changement de statut', description: 'Notification lors du changement de statut d\'un dossier', icon: 'refresh', enabled: true }
  ];

  readonly frequencyOptions: DsRadioOption[] = [
    { value: 'instant', label: 'Instantané', description: 'Recevoir les notifications immédiatement' },
    { value: 'hourly', label: 'Horaire', description: 'Grouper les notifications par heure' },
    { value: 'daily', label: 'Quotidien', description: 'Recevoir un résumé quotidien' }
  ];

  readonly hourOptions: DsSelectOption[] = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`
  }));

  quietHoursStart = 22;
  quietHoursEnd = 8;
  quietHoursEnabled = false;

  ngOnInit(): void {
    this.initializeForm();
    this.loadPreferences();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.preferencesForm = this.fb.group({
      emailEnabled: [true],
      smsEnabled: [false],
      inAppEnabled: [true],
      pushEnabled: [true],
      newDossierEnabled: [true],
      newMessageEnabled: [true],
      appointmentEnabled: [true],
      statusChangeEnabled: [true],
      quietHoursEnabled: [false],
      quietHoursStart: [22, [Validators.required, Validators.min(0), Validators.max(23)]],
      quietHoursEnd: [8, [Validators.required, Validators.min(0), Validators.max(23)]],
      digestFrequency: ['instant', Validators.required]
    });
  }

  private loadPreferences(): void {
    this.loading = true;

    this.userPreferencesService.getPreferences()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (preferences) => {
          if (preferences.notifications) {
            const notifPrefs = preferences.notifications as any;

            this.preferencesForm.patchValue({
              emailEnabled: notifPrefs.emailEnabled !== false,
              smsEnabled: notifPrefs.smsEnabled || false,
              inAppEnabled: notifPrefs.inAppEnabled !== false,
              pushEnabled: notifPrefs.pushEnabled !== false,
              newDossierEnabled: notifPrefs.newDossierEnabled !== false,
              newMessageEnabled: notifPrefs.newMessageEnabled !== false,
              appointmentEnabled: notifPrefs.appointmentEnabled !== false,
              statusChangeEnabled: notifPrefs.statusChangeEnabled !== false,
              quietHoursEnabled: notifPrefs.quietHoursEnabled || false,
              quietHoursStart: notifPrefs.quietHoursStart || 22,
              quietHoursEnd: notifPrefs.quietHoursEnd || 8,
              digestFrequency: notifPrefs.digestFrequency || 'instant'
            });

            this.updateChannelsFromForm();
            this.updateTypesFromForm();
            this.updateQuietHoursFromForm();
          }
          this.originalValues = { ...this.preferencesForm.getRawValue() };
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading notification preferences:', error);
          this.notificationService.error('Erreur lors du chargement des préférences de notification');
          this.loading = false;
        }
      });
  }

  private setupFormListeners(): void {
    this.preferencesForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateChannelsFromForm();
        this.updateTypesFromForm();
        this.updateQuietHoursFromForm();
      });
  }

  private updateChannelsFromForm(): void {
    const formValue = this.preferencesForm.getRawValue();
    this.channels.forEach(channel => {
      channel.enabled = formValue[`${channel.id}Enabled`] || false;
    });
  }

  private updateTypesFromForm(): void {
    const formValue = this.preferencesForm.getRawValue();
    this.notificationTypes.forEach(type => {
      type.enabled = formValue[`${type.id}Enabled`] || false;
    });
  }

  private updateQuietHoursFromForm(): void {
    const formValue = this.preferencesForm.getRawValue();
    this.quietHoursEnabled = formValue.quietHoursEnabled || false;
    this.quietHoursStart = formValue.quietHoursStart ?? 22;
    this.quietHoursEnd = formValue.quietHoursEnd ?? 8;
  }

  onSave(): void {
    if (!this.preferencesForm.valid) {
      this.notificationService.warning('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.saving = true;
    this.userPreferencesService.updatePreferences('notifications', this.preferencesForm.getRawValue())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.originalValues = { ...this.preferencesForm.getRawValue() };
          this.saving = false;
          this.notificationService.success('Préférences enregistrées avec succès');
        },
        error: (error) => {
          console.error('Error saving notification preferences:', error);
          this.saving = false;
          this.notificationService.error('Erreur lors de l\'enregistrement');
        }
      });
  }

  onCancel(): void {
    if (this.hasUnsavedChanges()) {
      this.preferencesForm.patchValue(this.originalValues);
      this.notificationService.info('Modifications annulées');
    }
  }

  hasUnsavedChanges(): boolean {
    return JSON.stringify(this.preferencesForm.getRawValue()) !== JSON.stringify(this.originalValues);
  }

  formatQuietHoursLabel(value: number): string {
    return `${value.toString().padStart(2, '0')}:00`;
  }

  getQuietHoursDisplay(): string {
    return `${this.formatQuietHoursLabel(this.quietHoursStart)} - ${this.formatQuietHoursLabel(this.quietHoursEnd)}`;
  }

  getEnabledChannelsCount(): number {
    return this.channels.filter(c => c.enabled).length;
  }

  getEnabledTypesCount(): number {
    return this.notificationTypes.filter(t => t.enabled).length;
  }

  isQuietHoursActive(): boolean {
    if (!this.quietHoursEnabled) return false;
    const currentHour = new Date().getHours();
    if (this.quietHoursStart < this.quietHoursEnd) {
      return currentHour >= this.quietHoursStart && currentHour < this.quietHoursEnd;
    } else {
      return currentHour >= this.quietHoursStart || currentHour < this.quietHoursEnd;
    }
  }
}
