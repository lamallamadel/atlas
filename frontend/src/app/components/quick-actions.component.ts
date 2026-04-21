import { Component, OnInit, OnDestroy, HostListener, input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DossierResponse, DossierStatus } from '../services/dossier-api.service';
import { MessageFormDialogComponent, MessageFormData } from './message-form-dialog.component';
import { AppointmentFormDialogComponent, AppointmentFormData } from './appointment-form-dialog.component';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { QuickActionsService, QuickAction, RecentAction } from '../services/quick-actions.service';
import { VoipService } from '../services/voip.service';
import { MessageCreateRequest } from '../services/message-api.service';
import { MessageApiService } from '../services/message-api.service';
import { AppointmentApiService, AppointmentCreateRequest } from '../services/appointment-api.service';
import { DossierApiService } from '../services/dossier-api.service';
import { MatFabButton, MatIconButton, MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-quick-actions',
    templateUrl: './quick-actions.component.html',
    styleUrls: ['./quick-actions.component.css'],
    imports: [MatFabButton, MatTooltip, MatIcon, MatIconButton, MatButton]
})
export class QuickActionsComponent implements OnInit, OnDestroy {
  readonly dossier = input<DossierResponse | null>(null);
  
  menuOpen = false;
  recentActions: RecentAction[] = [];
  voipConfigured = false;
  
  private destroy$ = new Subject<void>();
  
  actions: QuickAction[] = [];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private keyboardShortcutService: KeyboardShortcutService,
    private quickActionsService: QuickActionsService,
    private voipService: VoipService,
    private messageApiService: MessageApiService,
    private appointmentApiService: AppointmentApiService,
    private dossierApiService: DossierApiService
  ) {}

  ngOnInit(): void {
    this.voipConfigured = this.voipService.isConfigured();
    this.loadRecentActions();
    this.setupActions();
    this.registerKeyboardShortcuts();
    
    this.quickActionsService.recentActions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(actions => {
        this.recentActions = actions;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unregisterKeyboardShortcuts();
  }

  private setupActions(): void {
    this.actions = [
      {
        id: 'call-client',
        icon: 'phone',
        label: 'Appeler le client',
        shortcut: 'Alt+C',
        color: 'primary',
        disabled: !this.canCallClient(),
        action: () => this.callClient()
      },
      {
        id: 'send-message',
        icon: 'message',
        label: 'Envoyer un message',
        shortcut: 'Alt+M',
        color: 'accent',
        action: () => this.sendMessage()
      },
      {
        id: 'schedule-appointment',
        icon: 'event',
        label: 'Planifier un rendez-vous',
        shortcut: 'Alt+R',
        color: 'primary',
        action: () => this.scheduleAppointment()
      },
      {
        id: 'change-status',
        icon: 'swap_horiz',
        label: 'Changer le statut',
        shortcut: 'Alt+S',
        color: 'warn',
        disabled: this.isStatusChangeDisabled(),
        action: () => this.changeStatus()
      }
    ];
  }

  private registerKeyboardShortcuts(): void {
    this.keyboardShortcutService.registerShortcut({
      key: 'Alt+C',
      description: 'Appeler le client',
      category: 'actions',
      action: () => this.callClient()
    });

    this.keyboardShortcutService.registerShortcut({
      key: 'Alt+M',
      description: 'Envoyer un message',
      category: 'actions',
      action: () => this.sendMessage()
    });

    this.keyboardShortcutService.registerShortcut({
      key: 'Alt+R',
      description: 'Planifier un rendez-vous',
      category: 'actions',
      action: () => this.scheduleAppointment()
    });

    this.keyboardShortcutService.registerShortcut({
      key: 'Alt+S',
      description: 'Changer le statut',
      category: 'actions',
      action: () => this.changeStatus()
    });

    this.keyboardShortcutService.registerShortcut({
      key: 'Alt+Q',
      description: 'Ouvrir les actions rapides',
      category: 'actions',
      action: () => this.toggleMenu()
    });
  }

  private unregisterKeyboardShortcuts(): void {
    // Note: In a production app, we'd want to add an unregister method to KeyboardShortcutService
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.altKey && event.key === 'q') {
      event.preventDefault();
      this.toggleMenu();
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  private loadRecentActions(): void {
    const dossier = this.dossier();
    if (dossier) {
      this.recentActions = this.quickActionsService.getRecentActions(dossier.id);
    }
  }

  private canCallClient(): boolean {
    return this.voipConfigured && !!this.dossier()?.leadPhone;
  }

  private isStatusChangeDisabled(): boolean {
    const dossier = this.dossier();
    if (!dossier) {
      return true;
    }
    return dossier.status === DossierStatus.WON || 
           dossier.status === DossierStatus.LOST;
  }

  callClient(): void {
    const dossier = this.dossier();
    if (!dossier || !dossier.leadPhone) {
      this.snackBar.open('Aucun numéro de téléphone disponible', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      });
      return;
    }

    if (!this.voipConfigured) {
      this.snackBar.open('Le système VoIP n\'est pas configuré', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.voipService.initiateCall(dossier.leadPhone, dossier.leadName || 'Client');
    this.quickActionsService.addRecentAction({
      dossierId: dossier.id,
      actionId: 'call-client',
      actionLabel: 'Appel client',
      timestamp: new Date().toISOString()
    });
    
    this.snackBar.open(`Appel en cours vers ${dossier.leadName || dossier.leadPhone}`, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
    
    this.closeMenu();
  }

  sendMessage(): void {
    const dossier = this.dossier();
    if (!dossier) {
      return;
    }

    const dialogData: MessageFormData = {
      dossierId: dossier.id
    };

    const dialogRef = this.dialog.open(MessageFormDialogComponent, {
      width: '500px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'responsive-dialog',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: MessageCreateRequest) => {
      if (result) {
        this.messageApiService.create(result).subscribe({
          next: () => {
            this.snackBar.open('Message créé avec succès', 'Fermer', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            
            const dossierValue = this.dossier();
            if (dossierValue) {
              this.quickActionsService.addRecentAction({
                dossierId: dossierValue.id,
                actionId: 'send-message',
                actionLabel: 'Message envoyé',
                timestamp: new Date().toISOString()
              });
            }
          },
          error: (err) => {
            const errorMessage = err.error?.message || 'Échec de la création du message';
            this.snackBar.open(errorMessage, 'Fermer', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });

    this.closeMenu();
  }

  scheduleAppointment(): void {
    const dossier = this.dossier();
    if (!dossier) {
      return;
    }

    const dialogData: AppointmentFormData = {
      dossierId: dossier.id
    };

    const dialogRef = this.dialog.open(AppointmentFormDialogComponent, {
      width: '600px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'responsive-dialog',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: AppointmentFormData) => {
      if (result && result.startTime && result.endTime) {
        const request: AppointmentCreateRequest = {
          dossierId: result.dossierId,
          startTime: result.startTime,
          endTime: result.endTime,
          location: result.location,
          assignedTo: result.assignedTo,
          notes: result.notes,
          status: result.status
        };

        this.appointmentApiService.create(request).subscribe({
          next: () => {
            this.snackBar.open('Rendez-vous créé avec succès', 'Fermer', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            
            const dossierValue = this.dossier();
            if (dossierValue) {
              this.quickActionsService.addRecentAction({
                dossierId: dossierValue.id,
                actionId: 'schedule-appointment',
                actionLabel: 'Rendez-vous planifié',
                timestamp: new Date().toISOString()
              });
            }
          },
          error: (err) => {
            const errorMessage = err.error?.message || 'Échec de la création du rendez-vous';
            this.snackBar.open(errorMessage, 'Fermer', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });

    this.closeMenu();
  }

  changeStatus(): void {
    if (!this.dossier() || this.isStatusChangeDisabled()) {
      return;
    }
    
    this.snackBar.open('Veuillez utiliser le formulaire de changement de statut dans la section détails', 'Fermer', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });

    this.closeMenu();
  }

  private getAvailableStatusOptions(): DossierStatus[] {
    const dossier = this.dossier();
    if (!dossier) {
      return [];
    }

    const currentStatus = dossier.status;

    switch (currentStatus) {
      case DossierStatus.WON:
      case DossierStatus.LOST:
        return [currentStatus];
      
      case DossierStatus.NEW:
        return [
          DossierStatus.NEW,
          DossierStatus.QUALIFYING,
          DossierStatus.LOST
        ];
      
      case DossierStatus.QUALIFYING:
        return [
          DossierStatus.QUALIFYING,
          DossierStatus.QUALIFIED,
          DossierStatus.LOST
        ];
      
      case DossierStatus.QUALIFIED:
        return [
          DossierStatus.QUALIFIED,
          DossierStatus.APPOINTMENT,
          DossierStatus.LOST
        ];
      
      case DossierStatus.APPOINTMENT:
        return [
          DossierStatus.APPOINTMENT,
          DossierStatus.WON,
          DossierStatus.LOST
        ];
      
      default:
        return [];
    }
  }

  getActionIcon(actionId: string): string {
    switch (actionId) {
      case 'call-client': return 'phone';
      case 'send-message': return 'message';
      case 'schedule-appointment': return 'event';
      case 'change-status': return 'swap_horiz';
      default: return 'history';
    }
  }

  formatActionTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}
