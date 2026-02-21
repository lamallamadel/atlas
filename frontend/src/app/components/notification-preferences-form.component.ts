import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, style, transition, animate } from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserPreferencesService } from '../services/user-preferences.service';
import { NotificationService } from '../services/notification.service';

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

interface DigestFrequency {
  value: string;
  label: string;
  description: string;
  icon: string;
}

interface NotificationExample {
  title: string;
  message: string;
  timestamp: Date;
  type: string;
  icon: string;
}

@Component({
  selector: 'app-notification-preferences-form',
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
  ]
})
export class NotificationPreferencesFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  preferencesForm!: FormGroup;
  loading = false;
  saving = false;
  
  // Original values for dirty check
  private originalValues: Record<string, unknown> = {};
  
  // Notification channels
  channels: NotificationChannel[] = [
    { 
      id: 'email', 
      label: 'Email', 
      description: 'Recevez des notifications par email',
      icon: 'email',
      enabled: true 
    },
    { 
      id: 'sms', 
      label: 'SMS', 
      description: 'Recevez des alertes par SMS',
      icon: 'sms',
      enabled: false 
    },
    { 
      id: 'inApp', 
      label: 'Dans l\'application', 
      description: 'Notifications dans l\'interface',
      icon: 'notifications',
      enabled: true 
    },
    { 
      id: 'push', 
      label: 'Push', 
      description: 'Notifications push dans le navigateur',
      icon: 'notifications_active',
      enabled: true 
    }
  ];
  
  // Notification types
  notificationTypes: NotificationType[] = [
    { 
      id: 'newDossier', 
      label: 'Nouveau dossier', 
      description: 'Notification lors de la création d\'un nouveau dossier',
      icon: 'folder',
      enabled: true 
    },
    { 
      id: 'newMessage', 
      label: 'Nouveau message', 
      description: 'Notification lors de la réception d\'un message',
      icon: 'message',
      enabled: true 
    },
    { 
      id: 'appointment', 
      label: 'Rendez-vous', 
      description: 'Rappels de rendez-vous à venir',
      icon: 'event',
      enabled: true 
    },
    { 
      id: 'statusChange', 
      label: 'Changement de statut', 
      description: 'Notification lors du changement de statut d\'un dossier',
      icon: 'update',
      enabled: true 
    }
  ];
  
  // Digest frequencies
  digestFrequencies: DigestFrequency[] = [
    { 
      value: 'instant', 
      label: 'Instantané', 
      description: 'Recevoir les notifications immédiatement',
      icon: 'flash_on' 
    },
    { 
      value: 'hourly', 
      label: 'Horaire', 
      description: 'Grouper les notifications par heure',
      icon: 'schedule' 
    },
    { 
      value: 'daily', 
      label: 'Quotidien', 
      description: 'Recevoir un résumé quotidien',
      icon: 'today' 
    }
  ];
  
  // Preview examples
  exampleNotifications: NotificationExample[] = [];
  
  // Quiet hours range (default: 22h-8h)
  quietHoursStart = 22;
  quietHoursEnd = 8;
  quietHoursEnabled = false;
  
  constructor(
    private fb: FormBuilder,
    private userPreferencesService: UserPreferencesService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPreferences();
    this.setupFormListeners();
    this.updateExampleNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.preferencesForm = this.fb.group({
      // Channels
      emailEnabled: [true],
      smsEnabled: [false],
      inAppEnabled: [true],
      pushEnabled: [true],
      
      // Notification types
      newDossierEnabled: [true],
      newMessageEnabled: [true],
      appointmentEnabled: [true],
      statusChangeEnabled: [true],
      
      // Quiet hours
      quietHoursEnabled: [false],
      quietHoursStart: [22, [Validators.min(0), Validators.max(23)]],
      quietHoursEnd: [8, [Validators.min(0), Validators.max(23)]],
      
      // Digest frequency
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
            const notifPrefs = preferences.notifications;
            const notifPrefsExtended = notifPrefs as Record<string, unknown>;
            
            this.preferencesForm.patchValue({
              emailEnabled: notifPrefs.emailEnabled !== false,
              smsEnabled: notifPrefs.smsEnabled || false,
              inAppEnabled: notifPrefs.inAppEnabled !== false,
              pushEnabled: notifPrefs.pushEnabled !== false,
              
              newDossierEnabled: (notifPrefsExtended.newDossierEnabled as boolean) !== false,
              newMessageEnabled: (notifPrefsExtended.newMessageEnabled as boolean) !== false,
              appointmentEnabled: (notifPrefsExtended.appointmentEnabled as boolean) !== false,
              statusChangeEnabled: (notifPrefsExtended.statusChangeEnabled as boolean) !== false,
              
              quietHoursEnabled: (notifPrefsExtended.quietHoursEnabled as boolean) || false,
              quietHoursStart: (notifPrefsExtended.quietHoursStart as number) || 22,
              quietHoursEnd: (notifPrefsExtended.quietHoursEnd as number) || 8,
              
              digestFrequency: (notifPrefsExtended.digestFrequency as string) || 'instant'
            });
            
            this.updateChannelsFromForm();
            this.updateTypesFromForm();
            this.updateQuietHoursFromForm();
          }
          this.originalValues = this.preferencesForm.value as Record<string, unknown>;
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
    // Update preview on form changes
    this.preferencesForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateChannelsFromForm();
        this.updateTypesFromForm();
        this.updateQuietHoursFromForm();
        this.updateExampleNotifications();
      });
  }

  private updateChannelsFromForm(): void {
    const formValue = this.preferencesForm.value;
    this.channels.forEach(channel => {
      channel.enabled = formValue[`${channel.id}Enabled`] || false;
    });
  }

  private updateTypesFromForm(): void {
    const formValue = this.preferencesForm.value;
    this.notificationTypes.forEach(type => {
      type.enabled = formValue[`${type.id}Enabled`] || false;
    });
  }

  private updateQuietHoursFromForm(): void {
    const formValue = this.preferencesForm.value;
    this.quietHoursEnabled = formValue.quietHoursEnabled || false;
    this.quietHoursStart = formValue.quietHoursStart || 22;
    this.quietHoursEnd = formValue.quietHoursEnd || 8;
  }

  private updateExampleNotifications(): void {
    const formValue = this.preferencesForm.value;
    const now = new Date();
    
    this.exampleNotifications = [];
    
    if (formValue.newDossierEnabled) {
      this.exampleNotifications.push({
        title: 'Nouveau dossier',
        message: 'Le dossier "Appartement 3 pièces Paris 15e" a été créé',
        timestamp: new Date(now.getTime() - 5 * 60000),
        type: 'newDossier',
        icon: 'folder'
      });
    }
    
    if (formValue.newMessageEnabled) {
      this.exampleNotifications.push({
        title: 'Nouveau message',
        message: 'Jean Dupont vous a envoyé un message',
        timestamp: new Date(now.getTime() - 15 * 60000),
        type: 'newMessage',
        icon: 'message'
      });
    }
    
    if (formValue.appointmentEnabled) {
      this.exampleNotifications.push({
        title: 'Rendez-vous à venir',
        message: 'Visite prévue dans 1 heure - 25 Rue de la Paix',
        timestamp: new Date(now.getTime() + 60 * 60000),
        type: 'appointment',
        icon: 'event'
      });
    }
    
    if (formValue.statusChangeEnabled) {
      this.exampleNotifications.push({
        title: 'Changement de statut',
        message: 'Le dossier "Villa Nice" est passé en "En cours"',
        timestamp: new Date(now.getTime() - 30 * 60000),
        type: 'statusChange',
        icon: 'update'
      });
    }
  }

  onSave(): void {
    if (!this.preferencesForm.valid) {
      this.notificationService.warning('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.saving = true;
    const formValue = this.preferencesForm.value;

    const notificationPreferences = {
      emailEnabled: formValue.emailEnabled,
      smsEnabled: formValue.smsEnabled,
      inAppEnabled: formValue.inAppEnabled,
      pushEnabled: formValue.pushEnabled,
      
      newDossierEnabled: formValue.newDossierEnabled,
      newMessageEnabled: formValue.newMessageEnabled,
      appointmentEnabled: formValue.appointmentEnabled,
      statusChangeEnabled: formValue.statusChangeEnabled,
      
      quietHoursEnabled: formValue.quietHoursEnabled,
      quietHoursStart: formValue.quietHoursStart,
      quietHoursEnd: formValue.quietHoursEnd,
      
      digestFrequency: formValue.digestFrequency
    };

    this.userPreferencesService.updatePreferences('notifications', notificationPreferences)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.originalValues = this.preferencesForm.value as Record<string, unknown>;
          this.saving = false;
          this.notificationService.success('Préférences de notification enregistrées avec succès');
        },
        error: (error) => {
          console.error('Error saving notification preferences:', error);
          this.saving = false;
          this.notificationService.error('Erreur lors de l\'enregistrement des préférences');
        }
      });
  }

  onCancel(): void {
    if (this.hasUnsavedChanges()) {
      this.preferencesForm.patchValue(this.originalValues);
      this.updateChannelsFromForm();
      this.updateTypesFromForm();
      this.updateQuietHoursFromForm();
      this.updateExampleNotifications();
      this.notificationService.info('Modifications annulées');
    }
  }

  hasUnsavedChanges(): boolean {
    return JSON.stringify(this.preferencesForm.value) !== JSON.stringify(this.originalValues);
  }

  formatQuietHoursLabel(value: number): string {
    return `${value.toString().padStart(2, '0')}:00`;
  }

  getQuietHoursDisplay(): string {
    return `${this.formatQuietHoursLabel(this.quietHoursStart)} - ${this.formatQuietHoursLabel(this.quietHoursEnd)}`;
  }

  getDigestFrequencyLabel(): string {
    const freq = this.digestFrequencies.find(f => f.value === this.preferencesForm.get('digestFrequency')?.value);
    return freq ? freq.label : '';
  }

  getDigestFrequencyDescription(): string {
    const freq = this.digestFrequencies.find(f => f.value === this.preferencesForm.get('digestFrequency')?.value);
    return freq ? freq.description : '';
  }

  getEnabledChannelsCount(): number {
    return this.channels.filter(c => c.enabled).length;
  }

  getEnabledTypesCount(): number {
    return this.notificationTypes.filter(t => t.enabled).length;
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 0) {
      const absMins = Math.abs(diffMins);
      if (absMins < 60) {
        return `Il y a ${absMins} min`;
      }
      const hours = Math.floor(absMins / 60);
      return `Il y a ${hours}h`;
    } else {
      if (diffMins < 60) {
        return `Dans ${diffMins} min`;
      }
      const hours = Math.floor(diffMins / 60);
      return `Dans ${hours}h`;
    }
  }

  isQuietHoursActive(): boolean {
    if (!this.quietHoursEnabled) {
      return false;
    }
    
    const now = new Date();
    const currentHour = now.getHours();
    
    if (this.quietHoursStart < this.quietHoursEnd) {
      // Normal range (e.g., 1h-5h)
      return currentHour >= this.quietHoursStart && currentHour < this.quietHoursEnd;
    } else {
      // Overnight range (e.g., 22h-8h)
      return currentHour >= this.quietHoursStart || currentHour < this.quietHoursEnd;
    }
  }

  getActiveChannelIcons(): string[] {
    return this.channels.filter(c => c.enabled).map(c => c.icon);
  }

  getDigestFrequencyIcon(): string {
    const freq = this.digestFrequencies.find(f => f.value === this.preferencesForm.get('digestFrequency')?.value);
    return freq ? freq.icon : '';
  }
}
