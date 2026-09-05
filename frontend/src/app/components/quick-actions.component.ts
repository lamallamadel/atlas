import { Component, OnInit, OnDestroy, HostListener, input, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DsDialogService } from '../design-system';
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
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsCardComponent, 
  DsToastService
} from '../design-system';

@Component({
    selector: 'app-quick-actions',
    standalone: true,
    templateUrl: './quick-actions.component.html',
    styleUrls: ['./quick-actions.component.css'],
    imports: [
      CommonModule, 
      DsButtonComponent, 
      DsIconComponent, 
      DsCardComponent
    ]
})
export class QuickActionsComponent implements OnInit, OnDestroy {
  private dialog = inject(DsDialogService);
  private toastService = inject(DsToastService);
  private keyboardShortcutService = inject(KeyboardShortcutService);
  private quickActionsService = inject(QuickActionsService);
  private voipService = inject(VoipService);
  private messageApiService = inject(MessageApiService);
  private appointmentApiService = inject(AppointmentApiService);
  private dossierApiService = inject(DossierApiService);

  readonly dossier = input<DossierResponse | null>(null);
  
  menuOpen = false;
  recentActions: RecentAction[] = [];
  voipConfigured = false;
  
  private destroy$ = new Subject<void>();
  
  actions: QuickAction[] = [];

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
      { id: 'call-client', icon: 'phone', label: 'Appeler le client', shortcut: 'Alt+C', color: 'primary', disabled: !this.canCallClient(), action: () => this.callClient() },
      { id: 'send-message', icon: 'mail', label: 'Envoyer un message', shortcut: 'Alt+M', color: 'accent', action: () => this.sendMessage() },
      { id: 'schedule-appointment', icon: 'calendar', label: 'Planifier un rendez-vous', shortcut: 'Alt+R', color: 'primary', action: () => this.scheduleAppointment() },
      { id: 'change-status', icon: 'refresh', label: 'Changer le statut', shortcut: 'Alt+S', color: 'warn', disabled: this.isStatusChangeDisabled(), action: () => this.changeStatus() }
    ];
  }

  private registerKeyboardShortcuts(): void {
    this.keyboardShortcutService.registerShortcut({ key: 'Alt+C', description: 'Appeler le client', category: 'actions', action: () => this.callClient() });
    this.keyboardShortcutService.registerShortcut({ key: 'Alt+M', description: 'Envoyer un message', category: 'actions', action: () => this.sendMessage() });
    this.keyboardShortcutService.registerShortcut({ key: 'Alt+R', description: 'Planifier un rendez-vous', category: 'actions', action: () => this.scheduleAppointment() });
    this.keyboardShortcutService.registerShortcut({ key: 'Alt+S', description: 'Changer le statut', category: 'actions', action: () => this.changeStatus() });
    this.keyboardShortcutService.registerShortcut({ key: 'Alt+Q', description: 'Ouvrir les actions rapides', category: 'actions', action: () => this.toggleMenu() });
  }

  private unregisterKeyboardShortcuts(): void {}

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.altKey && event.key === 'q') {
      event.preventDefault();
      this.toggleMenu();
    }
  }

  toggleMenu(): void { this.menuOpen = !this.menuOpen; }
  closeMenu(): void { this.menuOpen = false; }

  private loadRecentActions(): void {
    const d = this.dossier();
    if (d) this.recentActions = this.quickActionsService.getRecentActions(d.id);
  }

  private canCallClient(): boolean { return this.voipConfigured && !!this.dossier()?.leadPhone; }
  private isStatusChangeDisabled(): boolean {
    const d = this.dossier();
    return !d || d.status === DossierStatus.WON || d.status === DossierStatus.LOST;
  }

  callClient(): void {
    const d = this.dossier();
    if (!d || !d.leadPhone) { this.toastService.warning('Aucun numéro disponible'); return; }
    if (!this.voipConfigured) { this.toastService.warning('Système VoIP non configuré'); return; }

    this.voipService.initiateCall(d.leadPhone, d.leadName || 'Client');
    this.quickActionsService.addRecentAction({ dossierId: d.id, actionId: 'call-client', actionLabel: 'Appel client', timestamp: new Date().toISOString() });
    this.toastService.success(`Appel en cours vers ${d.leadName || d.leadPhone}`);
    this.closeMenu();
  }

  sendMessage(): void {
    const d = this.dossier();
    if (!d) return;
    const dialogRef = this.dialog.open(MessageFormDialogComponent, { width: '500px', data: { dossierId: d.id } });
    dialogRef.closed.subscribe((result: MessageCreateRequest) => {
      if (result) {
        this.messageApiService.create(result).subscribe({
          next: () => {
            this.toastService.success('Message créé avec succès');
            this.quickActionsService.addRecentAction({ dossierId: d.id, actionId: 'send-message', actionLabel: 'Message envoyé', timestamp: new Date().toISOString() });
          },
          error: (err) => this.toastService.error(err.error?.message || 'Échec création message')
        });
      }
    });
    this.closeMenu();
  }

  scheduleAppointment(): void {
    const d = this.dossier();
    if (!d) return;
    const dialogRef = this.dialog.open(AppointmentFormDialogComponent, { width: '600px', data: { dossierId: d.id } });
    dialogRef.closed.subscribe((result: AppointmentFormData) => {
      if (result && result.startTime && result.endTime) {
        const request: AppointmentCreateRequest = { dossierId: result.dossierId, startTime: result.startTime, endTime: result.endTime, location: result.location, assignedTo: result.assignedTo, notes: result.notes, status: result.status };
        this.appointmentApiService.create(request).subscribe({
          next: () => {
            this.toastService.success('Rendez-vous créé avec succès');
            this.quickActionsService.addRecentAction({ dossierId: d.id, actionId: 'schedule-appointment', actionLabel: 'Rendez-vous planifié', timestamp: new Date().toISOString() });
          },
          error: (err) => this.toastService.error(err.error?.message || 'Échec création rdv')
        });
      }
    });
    this.closeMenu();
  }

  changeStatus(): void {
    if (!this.dossier() || this.isStatusChangeDisabled()) return;
    this.toastService.info('Veuillez utiliser le formulaire de statut dans les détails');
    this.closeMenu();
  }

  getActionIcon(actionId: string): string {
    switch (actionId) {
      case 'call-client': return 'phone';
      case 'send-message': return 'mail';
      case 'schedule-appointment': return 'calendar';
      case 'change-status': return 'refresh';
      default: return 'clock';
    }
  }

  formatActionTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
}
