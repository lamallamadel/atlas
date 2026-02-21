import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { DossierApiService, DossierResponse, DossierStatus, PartiePrenanteResponse, PartiePrenanteRole } from '../../services/dossier-api.service';
import { PartiePrenanteApiService, PartiePrenanteCreateRequest, PartiePrenanteUpdateRequest } from '../../services/partie-prenante-api.service';
import { MessageApiService, MessageResponse, MessageCreateRequest, MessageChannel, MessageDirection, MessageDeliveryStatus } from '../../services/message-api.service';
import { AppointmentApiService, AppointmentResponse, AppointmentCreateRequest, AppointmentUpdateRequest, AppointmentStatus } from '../../services/appointment-api.service';
import { ConsentementApiService, ConsentementResponse, ConsentementChannel, ConsentementStatus, ConsentementUpdateRequest, ConsentementCreateRequest } from '../../services/consentement-api.service';
import { AuditEventApiService, AuditEventResponse, AuditEntityType, AuditAction, Page } from '../../services/audit-event-api.service';
import { PartiePrenanteFormDialogComponent, PartiePrenanteFormData } from '../../components/partie-prenante-form-dialog.component';
import { MessageFormDialogComponent, MessageFormData } from '../../components/message-form-dialog.component';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog.component';
import { AppointmentFormDialogComponent, AppointmentFormData } from '../../components/appointment-form-dialog.component';
import { RecentNavigationService } from '../../services/recent-navigation.service';
import { CollaborationService, CollaborationEdit } from '../../services/collaboration.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';



export interface RendezVous {
  id: number;
  date: Date;
  time: string;
  location: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface ConsentementGroup {
  channel: ConsentementChannel;
  current: ConsentementResponse | null;
}

export interface DiffChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  description: string;
}

@Component({
  selector: 'app-dossier-detail',
  templateUrl: './dossier-detail.component.html',
  styleUrls: ['./dossier-detail.component.css']
})
export class DossierDetailComponent implements OnInit, OnDestroy {
  dossier: DossierResponse | null = null;
  loading = false;
  error: string | null = null;

  
  collaborationEnabled = false;
  currentUserId = 'user-' + Math.random().toString(36).substr(2, 9);
  currentUsername = 'Current User';
  private collaborationSubscriptions: Subscription[] = [];
  private noteEditTimeout: any;
  



  selectedStatus: DossierStatus | null = null;
  updatingStatus = false;
  successMessage: string | null = null;
  statusError: string | null = null;
  showStatusChange = false;

  showLeadForm = false;
  updatingLead = false;
  leadFormName = '';
  leadFormPhone = '';
  leadError: string | null = null;
  leadSuccessMessage: string | null = null;

  DossierStatus = DossierStatus;
  PartiePrenanteRole = PartiePrenanteRole;
  statusOptions = [
    DossierStatus.NEW,
    DossierStatus.QUALIFYING,
    DossierStatus.QUALIFIED,
    DossierStatus.APPOINTMENT,
    DossierStatus.WON,
    DossierStatus.LOST
  ];

  messages: MessageResponse[] = [];
  loadingMessages = false;
  appointments: AppointmentResponse[] = [];
  loadingAppointments = false;
  rendezVous: RendezVous[] = [];
  consentements: ConsentementResponse[] = [];
  consentementsLoading = false;
  consentementGroups: ConsentementGroup[] = [];
  auditEvents: AuditEventResponse[] = [];
  auditEventsLoading = false;
  auditTotalElements = 0;
  auditPageSize = 10;
  auditPageIndex = 0;
  auditFilterEntityType: AuditEntityType | '' = '';
  auditFilterAction: AuditAction | '' = '';
  ConsentementChannel = ConsentementChannel;
  ConsentementStatus = ConsentementStatus;
  AuditEntityType = AuditEntityType;
  AuditAction = AuditAction;

  whatsappMessages: MessageResponse[] = [];
  loadingWhatsAppMessages = false;
  selectedTemplate: WhatsAppTemplate | null = null;
  templateVariables: Record<string, string> = {};
  whatsappMessageContent = '';
  sendingWhatsAppMessage = false;
  whatsappConsentStatus: ConsentementStatus | null = null;
  MessageDeliveryStatus = MessageDeliveryStatus;

  generatingContract = false;
  contractGeneratedSuccess: string | null = null;
  contractGeneratedError: string | null = null;
  contractText: string | null = null;

  whatsappTemplates: WhatsAppTemplate[] = [
    {
      id: 'greeting',
      name: 'Salutation',
      content: 'Bonjour {{name}}, merci de votre intérêt pour notre propriété.',
      variables: ['name'],
      description: 'Message de bienvenue personnalisé'
    },
    {
      id: 'appointment_confirmation',
      name: 'Confirmation de rendez-vous',
      content: 'Bonjour {{name}}, votre rendez-vous est confirmé pour le {{date}} à {{time}} au {{location}}.',
      variables: ['name', 'date', 'time', 'location'],
      description: 'Confirmation de rendez-vous avec détails'
    },
    {
      id: 'followup',
      name: 'Suivi',
      content: 'Bonjour {{name}}, je reviens vers vous concernant le bien {{property}}. Êtes-vous toujours intéressé(e) ?',
      variables: ['name', 'property'],
      description: 'Message de suivi pour relancer le prospect'
    },
    {
      id: 'document_request',
      name: 'Demande de documents',
      content: 'Bonjour {{name}}, pourriez-vous nous transmettre les documents suivants : {{documents}} ?',
      variables: ['name', 'documents'],
      description: 'Demande de documents au client'
    }
  ];

  @ViewChild('auditPaginator') auditPaginator: MatPaginator | undefined;

  showPartieForm = false;
  partieFormRole: PartiePrenanteRole = PartiePrenanteRole.BUYER;
  partieFormFirstName = '';
  partieFormLastName = '';
  partieFormEmail = '';
  partieFormPhone = '';

  showRendezVousForm = false;
  rdvFormDate = '';
  rdvFormTime = '';
  rdvFormLocation = '';
  rdvFormStatus: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' = 'SCHEDULED';
  rdvFormNotes = '';

  constructor(
    private dossierApiService: DossierApiService,
    private partiePrenanteApiService: PartiePrenanteApiService,
    private messageApiService: MessageApiService,
    private appointmentApiService: AppointmentApiService,
    private consentementApiService: ConsentementApiService,
    private auditEventApiService: AuditEventApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,

    private recentNavigationService: RecentNavigationService,
    private collaborationService: CollaborationService
  ) {}

    private recentNavigationService: RecentNavigationService
  ) { }


  getAvailableStatusOptions(): DossierStatus[] {
    if (!this.dossier) {
      return this.statusOptions;
    }

    const currentStatus = this.dossier.status;

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
        return this.statusOptions;
    }
  }

  isStatusChangeDisabled(): boolean {
    if (!this.dossier) {
      return false;
    }
    return this.dossier.status === DossierStatus.WON ||
      this.dossier.status === DossierStatus.LOST;
  }

  getStatusChangeTooltip(): string {
    if (!this.dossier) {
      return '';
    }

    if (this.dossier.status === DossierStatus.WON) {
      return 'Le statut GAGNÉ est terminal et ne peut pas être modifié';
    }

    if (this.dossier.status === DossierStatus.LOST) {
      return 'Le statut PERDU est terminal et ne peut pas être modifié';
    }

    if (this.dossier.status === DossierStatus.NEW) {
      return 'Transitions autorisées: QUALIFICATION ou PERDU';
    }

    if (this.dossier.status === DossierStatus.QUALIFYING) {
      return 'Transitions autorisées: QUALIFIÉ ou PERDU';
    }

    if (this.dossier.status === DossierStatus.QUALIFIED) {
      return 'Transitions autorisées: RENDEZ-VOUS ou PERDU';
    }

    if (this.dossier.status === DossierStatus.APPOINTMENT) {
      return 'Transitions autorisées: GAGNÉ ou PERDU';
    }

    return 'Sélectionnez un nouveau statut';
  }

  ngOnInit(): void {
    this.loadDossier();
    this.loadMessages();
    this.loadAppointments();
    this.loadConsentements();
    this.loadAuditEvents();
    this.loadMockData();
    this.loadWhatsAppMessages();
    this.initializeCollaboration();
  }

  async initializeCollaboration(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const dossierId = parseInt(id, 10);
    if (isNaN(dossierId)) return;

    try {
      await this.collaborationService.initializeForDossier(
        dossierId,
        this.currentUserId,
        this.currentUsername
      );
      this.collaborationEnabled = true;
      this.subscribeToCollaborationUpdates();
    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
    }
  }

  private subscribeToCollaborationUpdates(): void {
    this.collaborationSubscriptions.push(
      this.collaborationService.getEditUpdates().subscribe(edit => {
        this.handleRemoteEdit(edit);
      })
    );

    this.collaborationSubscriptions.push(
      this.collaborationService.getActivityUpdates().subscribe(activity => {
        this.loadAuditEvents();
      })
    );
  }

  private handleRemoteEdit(edit: CollaborationEdit): void {
    if (!this.dossier) return;

    if (edit.fieldName === 'notes' && this.dossier.id === edit.dossierId) {
      this.dossier.notes = edit.newValue as string;
      this.snackBar.open(
        `${edit.username} updated notes`,
        'Close',
        { duration: 3000, horizontalPosition: 'right', verticalPosition: 'top' }
      );
    } else if (edit.fieldName === 'status' && this.dossier.id === edit.dossierId) {
      this.loadDossier();
      this.snackBar.open(
        `${edit.username} changed status to ${edit.newValue}`,
        'Close',
        { duration: 3000, horizontalPosition: 'right', verticalPosition: 'top' }
      );
    }
  }

  onNotesInput(event: any): void {
    if (!this.collaborationEnabled || !this.dossier) return;

    const fieldName = 'notes';
    const cursorPosition = event.target.selectionStart;
    
    this.collaborationService.updateCursor(fieldName, cursorPosition);

    if (this.noteEditTimeout) {
      clearTimeout(this.noteEditTimeout);
    }

    this.noteEditTimeout = setTimeout(() => {
      this.broadcastNotesEdit();
    }, 1000);
  }

  private broadcastNotesEdit(): void {
    if (!this.collaborationEnabled || !this.dossier) return;

    const oldValue = this.dossier.notes;
    this.collaborationService.broadcastEdit('notes', this.dossier.notes, oldValue);
  }

  ngOnDestroy(): void {
    this.collaborationSubscriptions.forEach(sub => sub.unsubscribe());
    this.collaborationService.leaveDossier();
    if (this.noteEditTimeout) {
      clearTimeout(this.noteEditTimeout);
    }
  }

  loadDossier(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID de dossier invalide';
      return;
    }

    const dossierId = parseInt(id, 10);
    if (isNaN(dossierId)) {
      this.error = 'ID de dossier invalide';
      return;
    }

    this.loading = true;
    this.error = null;

    this.dossierApiService.getById(dossierId).subscribe({
      next: (response) => {
        this.dossier = response;
        this.selectedStatus = response.status;
        this.loading = false;

        // Add to recent navigation
        this.recentNavigationService.addRecentItem({
          id: String(response.id),
          type: 'dossier',
          title: response.leadName || `Dossier #${response.id}`,
          subtitle: response.leadPhone || undefined,
          route: `/dossiers/${response.id}`
        });
      },
      error: (err) => {
        if (err.status === 404) {
          this.error = 'Dossier introuvable';
        } else {
          this.error = 'Échec du chargement du dossier. Veuillez réessayer.';
        }
        this.loading = false;
        console.error('Error loading dossier:', err);
      }
    });
  }

  loadMessages(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    const dossierId = parseInt(id, 10);
    if (isNaN(dossierId)) {
      return;
    }

    this.loadingMessages = true;
    this.messageApiService.list({ dossierId, size: 100, sort: 'timestamp,desc' }).subscribe({
      next: (response) => {
        this.messages = response.content;
        this.loadingMessages = false;
      },
      error: (err) => {
        console.error('Error loading messages:', err);
        this.loadingMessages = false;
      }
    });
  }

  loadAppointments(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    const dossierId = parseInt(id, 10);
    if (isNaN(dossierId)) {
      return;
    }

    this.loadingAppointments = true;
    this.appointmentApiService.list({ dossierId, size: 100, sort: 'startTime,desc' }).subscribe({
      next: (response) => {
        this.appointments = response.content;
        this.loadingAppointments = false;
      },
      error: (err) => {
        console.error('Error loading appointments:', err);
        this.loadingAppointments = false;
      }
    });
  }

  loadConsentements(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    const dossierId = parseInt(id, 10);
    if (isNaN(dossierId)) {
      return;
    }

    this.consentementsLoading = true;
    this.consentementApiService.list({ dossierId, size: 100, sort: 'updatedAt,desc' }).subscribe({
      next: (response) => {
        this.consentements = response.content;
        this.buildConsentementGroups();
        this.consentementsLoading = false;
      },
      error: (err) => {
        console.error('Error loading consentements:', err);
        this.consentementsLoading = false;
      }
    });
  }

  buildConsentementGroups(): void {
    const channelsToShow = [ConsentementChannel.EMAIL, ConsentementChannel.SMS, ConsentementChannel.WHATSAPP];
    this.consentementGroups = channelsToShow.map(channel => {
      const channelConsents = this.consentements.filter(c => c.channel === channel);
      const current = channelConsents.length > 0 ? channelConsents[0] : null;
      return { channel, current };
    });
  }

  loadMockData(): void {
    this.rendezVous = [
      {
        id: 1,
        date: new Date('2024-01-20T14:00:00'),
        time: '14:00',
        location: '123 Rue de la Paix, Paris',
        status: 'CONFIRMED',
        notes: 'Visite de l\'appartement'
      },
      {
        id: 2,
        date: new Date('2024-01-25T10:30:00'),
        time: '10:30',
        location: 'Bureau de l\'agence',
        status: 'SCHEDULED',
        notes: 'Signature du compromis'
      }
    ];
  }

  loadAuditEvents(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    const dossierId = parseInt(id, 10);
    if (isNaN(dossierId)) {
      return;
    }

    this.auditEventsLoading = true;

    const params: any = {
      page: this.auditPageIndex,
      size: this.auditPageSize,
      sort: 'createdAt,desc'
    };

    if (this.auditFilterAction) {
      params.action = this.auditFilterAction;
    }

    if (this.auditFilterEntityType) {
      params.entityType = this.auditFilterEntityType;
      if (this.auditFilterEntityType === AuditEntityType.DOSSIER) {
        params.entityId = dossierId;
      }
      this.auditEventApiService.list(params).subscribe({
        next: (response: Page<AuditEventResponse>) => {
          this.auditEvents = response.content;
          this.auditTotalElements = response.totalElements;
          this.auditEventsLoading = false;
        },
        error: (err) => {
          console.error('Error loading audit events:', err);
          this.auditEventsLoading = false;
        }
      });
    } else {
      this.auditEventApiService.listByDossier(dossierId, params).subscribe({
        next: (response: Page<AuditEventResponse>) => {
          this.auditEvents = response.content;
          this.auditTotalElements = response.totalElements;
          this.auditEventsLoading = false;
        },
        error: (err) => {
          console.error('Error loading audit events:', err);
          this.auditEventsLoading = false;
        }
      });
    }
  }

  onAuditPageChange(event: PageEvent): void {
    this.auditPageIndex = event.pageIndex;
    this.auditPageSize = event.pageSize;
    this.loadAuditEvents();
  }

  onAuditFilterChange(): void {
    this.auditPageIndex = 0;
    if (this.auditPaginator) {
      this.auditPaginator.firstPage();
    }
    this.loadAuditEvents();
  }

  getAuditActionLabel(action: AuditAction): string {
    switch (action) {
      case AuditAction.CREATED: return 'Création';
      case AuditAction.UPDATED: return 'Modification';
      case AuditAction.DELETED: return 'Suppression';
      case AuditAction.VIEWED: return 'Consultation';
      case AuditAction.EXPORTED: return 'Export';
      case AuditAction.IMPORTED: return 'Import';
      case AuditAction.APPROVED: return 'Approbation';
      case AuditAction.REJECTED: return 'Rejet';
      case AuditAction.ARCHIVED: return 'Archivage';
      case AuditAction.RESTORED: return 'Restauration';
      default: return action;
    }
  }

  getAuditEntityTypeLabel(entityType: AuditEntityType): string {
    switch (entityType) {
      case AuditEntityType.ANNONCE: return 'Annonce';
      case AuditEntityType.DOSSIER: return 'Dossier';
      case AuditEntityType.PARTIE_PRENANTE: return 'PartiePrenante';
      case AuditEntityType.CONSENTEMENT: return 'Consentement';
      case AuditEntityType.MESSAGE: return 'Message';
      case AuditEntityType.USER: return 'Utilisateur';
      case AuditEntityType.ORGANIZATION: return 'Organisation';
      default: return entityType;
    }
  }

  parseDiffChanges(diff: Record<string, any> | undefined): DiffChange[] {
    if (!diff) {
      return [];
    }

    const changes: DiffChange[] = [];
    for (const [field, value] of Object.entries(diff)) {
      if (typeof value === 'object' && value !== null && 'old' in value && 'new' in value) {
        changes.push({
          field,
          oldValue: value.old,
          newValue: value.new
        });
      } else {
        changes.push({
          field,
          oldValue: null,
          newValue: value
        });
      }
    }
    return changes;
  }

  formatDiffValue(value: any): string {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  toggleStatusChange(): void {
    this.showStatusChange = !this.showStatusChange;
    this.statusError = null;
    this.successMessage = null;
    if (this.showStatusChange && this.dossier) {
      this.selectedStatus = this.dossier.status;
    }
  }

  updateStatus(): void {
    if (!this.dossier || !this.selectedStatus) {
      return;
    }

    if (this.selectedStatus === this.dossier.status) {
      this.statusError = 'Le statut est déjà défini à cette valeur';
      return;
    }

    this.updatingStatus = true;
    this.statusError = null;
    this.successMessage = null;

    this.dossierApiService.patchStatus(this.dossier.id, this.selectedStatus).subscribe({
      next: () => {
        this.updatingStatus = false;
        this.snackBar.open('Statut mis à jour avec succès !', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadDossier();

        setTimeout(() => {
          this.successMessage = null;
          this.showStatusChange = false;
        }, 2000);
      },
      error: (err) => {
        this.updatingStatus = false;
        const errorMessage = err.error?.message || 'Échec de la mise à jour du statut. Veuillez réessayer.';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error updating status:', err);
      }
    });
  }

  getVirtualCoachNudge(): string | null {
    if (!this.dossier) return null;

    const acts = this.dossier.recentActivities || [];
    const views = acts.filter(a => a.activityType === 'PROPERTY_VIEW' || a.activityType === 'VIEW_PROPERTY');
    const score = this.dossier.score || 0;

    // Behavioral Nudge Logic
    if (views.length >= 3 && score >= 20 && this.dossier.status === DossierStatus.NEW) {
      return `Ce prospect a consulté l'annonce ${views.length} fois récemment et a un score d'intérêt élevé (${score}). Il est extrêmement actif : appelez-le immédiatement pour le qualifier !`;
    }

    if (score >= 50 && (this.dossier.status === DossierStatus.QUALIFYING || this.dossier.status === DossierStatus.QUALIFIED)) {
      return `Le prospect est très chaud (Score: ${score}). Ne perdez pas l'élan, proposez-lui une visite dès maintenant.`;
    }

    return null;
  }

  goBack(): void {
    this.router.navigate(['/dossiers']);
  }

  formatDate(dateString: string): string {
    if (!dateString) {
      return '—';
    }
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateOnly(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  isLeadEmpty(): boolean {
    if (!this.dossier) {
      return false;
    }
    const nameEmpty = !this.dossier.leadName || this.dossier.leadName.trim() === '';
    const phoneEmpty = !this.dossier.leadPhone || this.dossier.leadPhone.trim() === '';
    return nameEmpty && phoneEmpty;
  }

  toggleLeadForm(): void {
    this.showLeadForm = !this.showLeadForm;
    this.leadError = null;
    this.leadSuccessMessage = null;
    if (this.showLeadForm) {
      this.leadFormName = '';
      this.leadFormPhone = '';
    }
  }

  updateLead(): void {
    if (!this.dossier) {
      return;
    }

    if (!this.leadFormName || this.leadFormName.trim() === '') {
      this.leadError = 'Le nom du prospect est requis';
      return;
    }

    if (!this.leadFormPhone || this.leadFormPhone.trim() === '') {
      this.leadError = 'Le téléphone du prospect est requis';
      return;
    }

    this.updatingLead = true;
    this.leadError = null;
    this.leadSuccessMessage = null;

    this.dossierApiService.patchLead(this.dossier.id, this.leadFormName, this.leadFormPhone).subscribe({
      next: () => {
        this.updatingLead = false;
        this.snackBar.open('Informations du prospect mises à jour avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadDossier();

        setTimeout(() => {
          this.leadSuccessMessage = null;
          this.showLeadForm = false;
        }, 2000);
      },
      error: (err) => {
        this.updatingLead = false;
        const errorMessage = err.error?.message || 'Échec de la mise à jour des informations du prospect. Veuillez réessayer.';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error updating lead:', err);
      }
    });
  }

  generateContract(): void {
    if (!this.dossier) return;
    this.generatingContract = true;
    this.contractGeneratedSuccess = null;
    this.contractGeneratedError = null;
    this.contractText = null;

    this.dossierApiService.generateContract(this.dossier.id).subscribe({
      next: (response) => {
        this.generatingContract = false;
        this.contractText = response.contractText;
        this.contractGeneratedSuccess = `Compromis généré avec succès par l'IA Atlas (Indice de confiance : ${response.confidence}%)`;
        this.snackBar.open('Compromis généré avec succès !', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        this.generatingContract = false;
        this.contractGeneratedError = "Erreur lors de la génération du compromis de vente.";
        console.error('Error generating contract:', err);
      }
    });
  }

  togglePartieForm(): void {
    this.openPartiePrenanteDialog();
  }

  resetPartieForm(): void {
    this.partieFormRole = PartiePrenanteRole.BUYER;
    this.partieFormFirstName = '';
    this.partieFormLastName = '';
    this.partieFormEmail = '';
    this.partieFormPhone = '';
  }

  openPartiePrenanteDialog(partie?: PartiePrenanteResponse): void {
    const dialogData: PartiePrenanteFormData | null = partie ? {
      id: partie.id,
      role: partie.role,
      firstName: partie.firstName || '',
      lastName: partie.lastName || '',
      phone: partie.phone || '',
      email: partie.email || ''
    } : null;

    const dialogRef = this.dialog.open(PartiePrenanteFormDialogComponent, {
      width: '500px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'responsive-dialog',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: PartiePrenanteFormData) => {
      if (result) {
        if (result.id) {
          this.updatePartie(result.id, result);
        } else {
          this.addPartie(result);
        }
      }
    });
  }

  addPartie(data: PartiePrenanteFormData): void {
    if (!this.dossier) {
      return;
    }

    const request: PartiePrenanteCreateRequest = {
      dossierId: this.dossier.id,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email
    };

    this.partiePrenanteApiService.create(request).subscribe({
      next: () => {
        this.snackBar.open('Partie prenante ajoutée avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadDossier();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec de l\'ajout de la partie prenante';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error adding partie prenante:', err);
      }
    });
  }

  updatePartie(id: number, data: PartiePrenanteFormData): void {
    const request: PartiePrenanteUpdateRequest = {
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email
    };

    this.partiePrenanteApiService.update(id, request).subscribe({
      next: () => {
        this.snackBar.open('Partie prenante modifiée avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadDossier();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec de la modification de la partie prenante';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error updating partie prenante:', err);
      }
    });
  }

  editPartie(partie: PartiePrenanteResponse): void {
    this.openPartiePrenanteDialog(partie);
  }

  deletePartie(partie: PartiePrenanteResponse): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'responsive-dialog',
      data: {
        title: 'Supprimer la partie prenante',
        message: `Êtes-vous sûr de vouloir supprimer ${partie.firstName} ${partie.lastName} ?`
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.partiePrenanteApiService.delete(partie.id).subscribe({
          next: () => {
            this.snackBar.open('Partie prenante supprimée avec succès', 'Fermer', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.loadDossier();
          },
          error: (err) => {
            const errorMessage = err.error?.message || 'Échec de la suppression de la partie prenante';
            this.snackBar.open(errorMessage, 'Fermer', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            console.error('Error deleting partie prenante:', err);
          }
        });
      }
    });
  }

  toggleRendezVousForm(): void {
    this.showRendezVousForm = !this.showRendezVousForm;
    if (!this.showRendezVousForm) {
      this.resetRendezVousForm();
    }
  }

  resetRendezVousForm(): void {
    this.rdvFormDate = '';
    this.rdvFormTime = '';
    this.rdvFormLocation = '';
    this.rdvFormStatus = 'SCHEDULED';
    this.rdvFormNotes = '';
  }

  addRendezVous(): void {
    this.snackBar.open('Ajout de rendez-vous non implémenté (mock data)', 'Fermer', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    this.showRendezVousForm = false;
    this.resetRendezVousForm();
  }

  editRendezVous(rdv: RendezVous): void {
    console.log('Mock rendez-vous edit:', rdv);
    this.snackBar.open('Édition de rendez-vous non implémentée (mock data)', 'Fermer', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  openAppointmentDialog(appointment?: AppointmentResponse): void {
    if (!this.dossier) {
      return;
    }

    const dialogData: AppointmentFormData = appointment ? {
      id: appointment.id,
      dossierId: this.dossier.id,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      location: appointment.location,
      assignedTo: appointment.assignedTo,
      notes: appointment.notes,
      status: appointment.status
    } : {
      dossierId: this.dossier.id
    };

    const dialogRef = this.dialog.open(AppointmentFormDialogComponent, {
      width: '600px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'responsive-dialog',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe((result: AppointmentFormData) => {
      if (result) {
        if (result.id) {
          this.updateAppointment(result.id, result);
        } else {
          this.createAppointment(result);
        }
      }
    });
  }

  createAppointment(data: AppointmentFormData): void {
    if (!data.startTime || !data.endTime) {
      return;
    }

    const request: AppointmentCreateRequest = {
      dossierId: data.dossierId,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      assignedTo: data.assignedTo,
      notes: data.notes,
      status: data.status
    };

    this.appointmentApiService.create(request).subscribe({
      next: (response) => {
        if (response.warnings && response.warnings.length > 0) {
          response.warnings.forEach(warning => {
            this.snackBar.open(`⚠️ ${warning}`, 'Fermer', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['warning-snackbar']
            });
          });
        }
        this.snackBar.open('Rendez-vous créé avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadAppointments();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec de la création du rendez-vous';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error creating appointment:', err);
      }
    });
  }

  updateAppointment(id: number, data: AppointmentFormData): void {
    if (!data.startTime || !data.endTime) {
      return;
    }

    const request: AppointmentUpdateRequest = {
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      assignedTo: data.assignedTo,
      notes: data.notes,
      status: data.status
    };

    this.appointmentApiService.update(id, request).subscribe({
      next: (response) => {
        if (response.warnings && response.warnings.length > 0) {
          response.warnings.forEach(warning => {
            this.snackBar.open(`⚠️ ${warning}`, 'Fermer', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['warning-snackbar']
            });
          });
        }
        this.snackBar.open('Rendez-vous modifié avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadAppointments();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec de la modification du rendez-vous';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error updating appointment:', err);
      }
    });
  }

  editAppointment(appointment: AppointmentResponse): void {
    this.openAppointmentDialog(appointment);
  }

  deleteAppointment(appointment: AppointmentResponse): void {
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'responsive-dialog',
      data: {
        title: 'Supprimer le rendez-vous',
        message: `Êtes-vous sûr de vouloir supprimer ce rendez-vous ?`
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.appointmentApiService.delete(appointment.id).subscribe({
          next: () => {
            this.snackBar.open('Rendez-vous supprimé avec succès', 'Fermer', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });
            this.loadAppointments();
          },
          error: (err) => {
            const errorMessage = err.error?.message || 'Échec de la suppression du rendez-vous';
            this.snackBar.open(errorMessage, 'Fermer', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
            console.error('Error deleting appointment:', err);
          }
        });
      }
    });
  }

  completeAppointment(appointment: AppointmentResponse): void {
    const request: AppointmentUpdateRequest = {
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      location: appointment.location,
      assignedTo: appointment.assignedTo,
      notes: appointment.notes,
      status: AppointmentStatus.COMPLETED
    };

    this.appointmentApiService.update(appointment.id, request).subscribe({
      next: () => {
        this.snackBar.open('Rendez-vous marqué comme terminé', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadAppointments();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec de la mise à jour du rendez-vous';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error completing appointment:', err);
      }
    });
  }

  toggleConsentement(group: ConsentementGroup, newStatus: ConsentementStatus): void {
    if (!this.dossier) {
      return;
    }

    if (group.current) {
      if (group.current.status === newStatus) {
        return;
      }
      this.updateConsentement(group.current.id, group.channel, newStatus);
    } else {
      this.createConsentement(group.channel, newStatus);
    }
  }

  createConsentement(channel: ConsentementChannel, status: ConsentementStatus): void {
    if (!this.dossier) {
      return;
    }

    const request: ConsentementCreateRequest = {
      dossierId: this.dossier.id,
      channel,
      status
    };

    this.consentementApiService.create(request).subscribe({
      next: () => {
        this.snackBar.open('Consentement créé avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadConsentements();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec de la création du consentement';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error creating consentement:', err);
      }
    });
  }

  updateConsentement(id: number, channel: ConsentementChannel, status: ConsentementStatus): void {
    const request: ConsentementUpdateRequest = {
      channel,
      status
    };

    this.consentementApiService.update(id, request).subscribe({
      next: () => {
        this.snackBar.open('Consentement mis à jour avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadConsentements();
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec de la mise à jour du consentement';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error updating consentement:', err);
      }
    });
  }

  getMessagesSorted(): MessageResponse[] {
    return this.messages.slice().sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
  }

  openMessageDialog(): void {
    if (!this.dossier) {
      return;
    }

    const dialogData: MessageFormData = {
      dossierId: this.dossier.id
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
        this.createMessage(result);
      }
    });
  }

  createMessage(request: MessageCreateRequest): void {
    this.messageApiService.create(request).subscribe({
      next: (newMessage) => {
        this.snackBar.open('Message créé avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.messages = [newMessage, ...this.messages];
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec de la création du message';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error creating message:', err);
      }
    });
  }

  formatMessageTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  truncateContent(content: string, maxLength = 200): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  shouldShowVoirPlus(content: string, maxLength = 200): boolean {
    return content.length > maxLength;
  }

  getChannelBadgeClass(channel: string): string {
    switch (channel) {
      case 'EMAIL': return 'channel-badge channel-email';
      case 'SMS': return 'channel-badge channel-sms';
      case 'PHONE': return 'channel-badge channel-phone';
      case 'WHATSAPP': return 'channel-badge channel-whatsapp';
      case 'CHAT': return 'channel-badge channel-chat';
      case 'IN_APP': return 'channel-badge channel-inapp';
      case 'WEB': return 'channel-badge channel-web';
      default: return 'channel-badge';
    }
  }

  getDirectionBadgeClass(direction: string): string {
    return direction === 'INBOUND' ? 'direction-badge direction-inbound' : 'direction-badge direction-outbound';
  }

  getRdvStatusBadgeClass(status: string): string {
    switch (status) {
      case 'SCHEDULED': return 'status-badge status-scheduled';
      case 'CONFIRMED': return 'status-badge status-confirmed';
      case 'COMPLETED': return 'status-badge status-completed';
      case 'CANCELLED': return 'status-badge status-cancelled';
      default: return 'status-badge';
    }
  }

  getRdvStatusLabel(status: string): string {
    switch (status) {
      case 'SCHEDULED': return 'Planifié';
      case 'CONFIRMED': return 'Confirmé';
      case 'COMPLETED': return 'Terminé';
      case 'CANCELLED': return 'Annulé';
      default: return status;
    }
  }

  getRoleLabel(role: PartiePrenanteRole): string {
    switch (role) {
      case PartiePrenanteRole.LEAD: return 'Lead';
      case PartiePrenanteRole.BUYER: return 'Acheteur';
      case PartiePrenanteRole.SELLER: return 'Vendeur';
      case PartiePrenanteRole.AGENT: return 'Agent';
      case PartiePrenanteRole.OWNER: return 'Propriétaire';
      case PartiePrenanteRole.TENANT: return 'Locataire';
      case PartiePrenanteRole.LANDLORD: return 'Bailleur';
      case PartiePrenanteRole.NOTARY: return 'Notaire';
      case PartiePrenanteRole.BANK: return 'Banque';
      case PartiePrenanteRole.ATTORNEY: return 'Avocat';
      default: return role;
    }
  }

  getRoleBadgeClass(role: PartiePrenanteRole): string {
    switch (role) {
      case PartiePrenanteRole.BUYER: return 'role-badge-buyer';
      case PartiePrenanteRole.SELLER: return 'role-badge-seller';
      case PartiePrenanteRole.AGENT: return 'role-badge-agent';
      case PartiePrenanteRole.OWNER: return 'role-badge-owner';
      case PartiePrenanteRole.TENANT: return 'role-badge-tenant';
      case PartiePrenanteRole.LANDLORD: return 'role-badge-landlord';
      case PartiePrenanteRole.NOTARY: return 'role-badge-notary';
      case PartiePrenanteRole.BANK: return 'role-badge-bank';
      case PartiePrenanteRole.ATTORNEY: return 'role-badge-attorney';
      case PartiePrenanteRole.LEAD: return 'role-badge-lead';
      default: return 'role-badge-default';
    }
  }

  getAppointmentStatusBadgeClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.SCHEDULED: return 'status-badge status-scheduled';
      case AppointmentStatus.COMPLETED: return 'status-badge status-completed';
      case AppointmentStatus.CANCELLED: return 'status-badge status-cancelled';
      default: return 'status-badge';
    }
  }

  getAppointmentStatusLabel(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.SCHEDULED: return 'Planifié';
      case AppointmentStatus.COMPLETED: return 'Terminé';
      case AppointmentStatus.CANCELLED: return 'Annulé';
      default: return status;
    }
  }

  formatAppointmentDateTime(dateTime: string): string {
    if (!dateTime) {
      return '—';
    }
    const date = new Date(dateTime);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getConsentementStatusLabel(status: ConsentementStatus): string {
    switch (status) {
      case ConsentementStatus.GRANTED: return 'Accordé';
      case ConsentementStatus.DENIED: return 'Refusé';
      case ConsentementStatus.REVOKED: return 'Révoqué';
      case ConsentementStatus.PENDING: return 'En attente';
      case ConsentementStatus.EXPIRED: return 'Expiré';
      default: return status;
    }
  }

  getConsentementStatusBadgeClass(status: ConsentementStatus): string {
    switch (status) {
      case ConsentementStatus.GRANTED: return 'consent-badge consent-granted';
      case ConsentementStatus.DENIED: return 'consent-badge consent-denied';
      case ConsentementStatus.REVOKED: return 'consent-badge consent-revoked';
      case ConsentementStatus.PENDING: return 'consent-badge consent-pending';
      case ConsentementStatus.EXPIRED: return 'consent-badge consent-expired';
      default: return 'consent-badge';
    }
  }

  getChannelLabel(channel: ConsentementChannel): string {
    switch (channel) {
      case ConsentementChannel.EMAIL: return 'Email';
      case ConsentementChannel.SMS: return 'SMS';
      case ConsentementChannel.PHONE: return 'Téléphone';
      case ConsentementChannel.WHATSAPP: return 'WhatsApp';
      case ConsentementChannel.POSTAL_MAIL: return 'Courrier postal';
      case ConsentementChannel.IN_PERSON: return 'En personne';
      default: return channel;
    }
  }

  getConsentementsHistory(): ConsentementResponse[] {
    return this.consentements.slice().sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });
  }

  getUserFromMeta(consent: ConsentementResponse): string {
    if (consent.meta && consent.meta['user']) {
      return consent.meta['user'];
    }
    return '—';
  }

  getConsentDate(consent: ConsentementResponse): string {
    if (consent.status === ConsentementStatus.GRANTED && consent.createdAt) {
      return this.formatDate(consent.createdAt);
    }
    if (consent.status === ConsentementStatus.REVOKED && consent.updatedAt) {
      return this.formatDate(consent.updatedAt);
    }
    return this.formatDate(consent.updatedAt);
  }

  getScoreDisplay(): string {
    if (!this.dossier) {
      return '—';
    }
    if (this.dossier.score !== undefined && this.dossier.score !== null) {
      return String(this.dossier.score);
    }
    return '—';
  }

  hasEmptyFields(): boolean {
    if (!this.dossier) {
      return false;
    }
    const emptyFields = [];

    if (!this.dossier.leadName) {
      emptyFields.push('leadName');
    }
    if (!this.dossier.leadSource) {
      emptyFields.push('leadSource');
    }

    return emptyFields.length > 0;
  }

  getEmptyFieldsList(): string {
    if (!this.dossier) {
      return '';
    }
    const emptyFields = [];

    if (!this.dossier.leadName) {
      emptyFields.push('Nom du prospect');
    }
    if (!this.dossier.leadSource) {
      emptyFields.push('Source du prospect');
    }

    return emptyFields.join(', ');
  }

  loadWhatsAppMessages(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    const dossierId = parseInt(id, 10);
    if (isNaN(dossierId)) {
      return;
    }

    this.loadingWhatsAppMessages = true;
    this.messageApiService.list({
      dossierId,
      channel: MessageChannel.WHATSAPP,
      size: 100,
      sort: 'timestamp,asc'
    }).subscribe({
      next: (response) => {
        this.whatsappMessages = response.content;
        this.loadingWhatsAppMessages = false;
      },
      error: (err) => {
        console.error('Error loading WhatsApp messages:', err);
        this.loadingWhatsAppMessages = false;
      }
    });
  }

  onTemplateSelect(): void {
    if (this.selectedTemplate) {
      this.initializeTemplateVariables();
      this.updateWhatsAppPreview();
    } else {
      this.templateVariables = {};
      this.whatsappMessageContent = '';
    }
  }

  initializeTemplateVariables(): void {
    if (!this.selectedTemplate) {
      return;
    }

    this.templateVariables = {};
    this.selectedTemplate.variables.forEach(variable => {
      if (variable === 'name' && this.dossier?.leadName) {
        this.templateVariables[variable] = this.dossier.leadName;
      } else {
        this.templateVariables[variable] = '';
      }
    });
  }

  updateWhatsAppPreview(): void {
    if (!this.selectedTemplate) {
      this.whatsappMessageContent = '';
      return;
    }

    let preview = this.selectedTemplate.content;
    this.selectedTemplate.variables.forEach(variable => {
      const value = this.templateVariables[variable] || `{{${variable}}}`;
      preview = preview.replace(`{{${variable}}}`, value);
    });
    this.whatsappMessageContent = preview;
  }

  onVariableChange(): void {
    this.updateWhatsAppPreview();
  }

  canSendWhatsAppMessage(): boolean {
    if (!this.whatsappMessageContent || this.whatsappMessageContent.trim() === '') {
      return false;
    }

    if (this.selectedTemplate) {
      const hasEmptyVariables = this.selectedTemplate.variables.some(
        variable => !this.templateVariables[variable] || this.templateVariables[variable].trim() === ''
      );
      if (hasEmptyVariables) {
        return false;
      }
    }

    return true;
  }

  getWhatsAppConsentStatus(): ConsentementStatus | null {
    const whatsappConsent = this.consentements.find(
      c => c.channel === ConsentementChannel.WHATSAPP
    );
    return whatsappConsent?.status || null;
  }

  isWhatsAppConsentGranted(): boolean {
    return this.getWhatsAppConsentStatus() === ConsentementStatus.GRANTED;
  }

  sendWhatsAppMessage(): void {
    if (!this.dossier || !this.canSendWhatsAppMessage()) {
      return;
    }

    if (!this.isWhatsAppConsentGranted()) {
      this.snackBar.open(
        '⚠️ Le consentement WhatsApp n\'est pas accordé. Veuillez obtenir le consentement avant d\'envoyer un message.',
        'Fermer',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['warning-snackbar']
        }
      );
      return;
    }

    this.sendingWhatsAppMessage = true;

    const request: MessageCreateRequest = {
      dossierId: this.dossier.id,
      channel: MessageChannel.WHATSAPP,
      direction: MessageDirection.OUTBOUND,
      content: this.whatsappMessageContent,
      timestamp: new Date().toISOString(),
      templateId: this.selectedTemplate?.id,
      templateVariables: this.selectedTemplate ? this.templateVariables : undefined
    };

    this.messageApiService.create(request).subscribe({
      next: (newMessage) => {
        this.snackBar.open('Message WhatsApp envoyé avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.whatsappMessages.push(newMessage);
        this.resetWhatsAppForm();
        this.sendingWhatsAppMessage = false;
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec de l\'envoi du message WhatsApp';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error sending WhatsApp message:', err);
        this.sendingWhatsAppMessage = false;
      }
    });
  }

  resetWhatsAppForm(): void {
    this.selectedTemplate = null;
    this.templateVariables = {};
    this.whatsappMessageContent = '';
  }

  retryWhatsAppMessage(message: MessageResponse): void {
    if (message.deliveryStatus !== MessageDeliveryStatus.FAILED) {
      return;
    }

    this.messageApiService.retry(message.id).subscribe({
      next: (updatedMessage) => {
        this.snackBar.open('Message en cours de renvoi...', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        const index = this.whatsappMessages.findIndex(m => m.id === message.id);
        if (index !== -1) {
          this.whatsappMessages[index] = updatedMessage;
        }
      },
      error: (err) => {
        const errorMessage = err.error?.message || 'Échec du renvoi du message';
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        console.error('Error retrying message:', err);
      }
    });
  }

  getDeliveryStatusLabel(status: MessageDeliveryStatus): string {
    switch (status) {
      case MessageDeliveryStatus.PENDING: return 'En attente';
      case MessageDeliveryStatus.SENT: return 'Envoyé';
      case MessageDeliveryStatus.DELIVERED: return 'Délivré';
      case MessageDeliveryStatus.FAILED: return 'Échec';
      case MessageDeliveryStatus.READ: return 'Lu';
      default: return 'Inconnu';
    }
  }

  getDeliveryStatusClass(status: MessageDeliveryStatus): string {
    switch (status) {
      case MessageDeliveryStatus.PENDING: return 'delivery-status-pending';
      case MessageDeliveryStatus.SENT: return 'delivery-status-sent';
      case MessageDeliveryStatus.DELIVERED: return 'delivery-status-delivered';
      case MessageDeliveryStatus.FAILED: return 'delivery-status-failed';
      case MessageDeliveryStatus.READ: return 'delivery-status-read';
      default: return '';
    }
  }

  getDeliveryStatusIcon(status: MessageDeliveryStatus): string {
    switch (status) {
      case MessageDeliveryStatus.PENDING: return '⏳';
      case MessageDeliveryStatus.SENT: return '✓';
      case MessageDeliveryStatus.DELIVERED: return '✓✓';
      case MessageDeliveryStatus.FAILED: return '✗';
      case MessageDeliveryStatus.READ: return '✓✓';
      default: return '';
    }
  }

  formatWhatsAppTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }
}
