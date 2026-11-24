import { DossierAssigneeCardComponent } from '../../components/dossier-assignee-card.component';
import { DossierStatusCardComponent } from '../../components/dossier-status-card.component';
import { ChangeDetectorRef, Component, OnInit, OnDestroy, viewChild, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DossierApiService, DossierResponse, DossierStatus, PartiePrenanteResponse, PartiePrenanteRole } from '../../services/dossier-api.service';
import { PartiePrenanteApiService } from '../../services/partie-prenante-api.service';
import { MessageApiService, MessageResponse, MessageChannel, MessageDirection, MessageDeliveryStatus } from '../../services/message-api.service';
import { AppointmentApiService, AppointmentResponse, AppointmentStatus } from '../../services/appointment-api.service';
import { ConsentementApiService, ConsentementResponse, ConsentementChannel, ConsentementStatus } from '../../services/consentement-api.service';
import { AuditEventApiService, AuditEventResponse, AuditEntityType, AuditAction } from '../../services/audit-event-api.service';
import { PartiePrenanteFormDialogComponent, PartiePrenanteFormData } from '../../components/partie-prenante-form-dialog.component';
import { MessageFormDialogComponent } from '../../components/message-form-dialog.component';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog.component';
import { DossierMatchingComponent } from '../../components/dossier-matching.component';
import { AppointmentFormDialogComponent, AppointmentFormData } from '../../components/appointment-form-dialog.component';
import { RecentNavigationService } from '../../services/recent-navigation.service';
import { CollaborationService, CollaborationEdit } from '../../services/collaboration.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { 
  DsTabsComponent, 
  DsTab,
  DsCardComponent, 
  EntityDetailLayoutComponent, 
  DsSelectComponent, 
  DsSelectOption, 
  DsToastService,
  DsDialogService,
  DsButtonComponent,
  DsIconComponent,
  DsBadgeComponent,
  DsEmptyStateComponent,
  DsProgressBarComponent,
  DsSkeletonComponent,
  DsTableComponent,
  DsColumn,
  DsCellDirective,
  DsBadgeStatus,
  DsFilterChipComponent
} from '../../design-system';
import { QuickActionsComponent } from '../../components/quick-actions.component';
import { ActivityTimelineComponent } from '../../components/activity-timeline.component';
import { DocumentListComponent } from '../../components/document-list.component';
import { WhatsappMessagingContainerComponent } from '../../components/whatsapp-messaging-container.component';
import { OutboundMessageApiService, DossierOutboundMessage } from '../../services/outbound-message-api.service';
import { ConsentLinkApiService, ConsentLinkResponse, ConsentPurpose } from '../../services/consent-link-api.service';
import { DossierWhatsAppApiService } from '../../services/dossier-whatsapp-api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';

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
    standalone: true,
    templateUrl: './dossier-detail.component.html',
    styleUrls: ['./dossier-detail.component.css'],
    imports: [
        DossierAssigneeCardComponent,
        DossierStatusCardComponent,
      CommonModule,
      DossierMatchingComponent,
      FormsModule, 
      DsTabsComponent, 
      DsCardComponent, 
      EntityDetailLayoutComponent, 
      DsEmptyStateComponent, 
      QuickActionsComponent, 
      ActivityTimelineComponent,
      DsFilterChipComponent,
      DocumentListComponent,
      WhatsappMessagingContainerComponent,
      DsSelectComponent,
      DsButtonComponent,
      DsIconComponent,
      DsBadgeComponent,
      DsProgressBarComponent,
      DsSkeletonComponent,
      DsTableComponent,
      DsCellDirective,
      DatePipe
    ]
})
export class DossierDetailComponent implements OnInit, OnDestroy {
  private dossierApiService = inject(DossierApiService);
  private partiePrenanteApiService = inject(PartiePrenanteApiService);
  private messageApiService = inject(MessageApiService);
  private appointmentApiService = inject(AppointmentApiService);
  private consentementApiService = inject(ConsentementApiService);
  private auditEventApiService = inject(AuditEventApiService);
  private outboundMessageApiService = inject(OutboundMessageApiService);
  private consentLinkApi = inject(ConsentLinkApiService);
  private dossierWhatsAppApi = inject(DossierWhatsAppApiService);
  // Application sans zone : une réponse HTTP ne redessine pas la vue d'elle-même.
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(DsToastService);
  private dsDialogService = inject(DsDialogService);
  private recentNavigationService = inject(RecentNavigationService);
  private collaborationService = inject(CollaborationService);

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

  activeTab = 'informations';
  /** 8 onglets : les messages (3 vues) et l'activité (2 vues) sont regroupés. */
  dossierTabs: DsTab[] = [
    { value: 'informations',    label: 'Informations' },
    { value: 'matching',        label: 'Biens correspondants' },
    { value: 'parties',         label: 'Parties prenantes' },
    { value: 'echanges',        label: 'Échanges' },
    { value: 'rendezvous',      label: 'Rendez-vous' },
    { value: 'consentements',   label: 'Consentements' },
    { value: 'documents',       label: 'Documents' },
    { value: 'activite',        label: 'Activité' },
  ];

  /** Vue de l'onglet Échanges : conversation WhatsApp, tous les canaux, ou envois et leur statut. */
  exchangeView: 'whatsapp' | 'messages' | 'messages-sortants' = 'whatsapp';
  /** Vue de l'onglet Activité : chronologie lisible ou journal d'audit filtrable. */
  activityView: 'chronologie' | 'historique' = 'chronologie';

  /** Accepte aussi les anciens noms d'onglets (liens, raccourcis, visite guidée). */
  selectTab(tab: string): void {
    switch (tab) {
      case 'whatsapp':
      case 'messages':
      case 'messages-sortants':
        this.exchangeView = tab;
        this.activeTab = 'echanges';
        break;
      case 'chronologie':
      case 'historique':
        this.activityView = tab;
        this.activeTab = 'activite';
        break;
      default:
        this.activeTab = tab;
    }
  }

  DossierStatus = DossierStatus;
  PartiePrenanteRole = PartiePrenanteRole;
  
  get statusOptions(): DsSelectOption[] {
    return [
      { value: DossierStatus.NEW, label: 'Nouveau' },
      { value: DossierStatus.QUALIFYING, label: 'Qualification' },
      { value: DossierStatus.QUALIFIED, label: 'Qualifié' },
      { value: DossierStatus.APPOINTMENT, label: 'Rendez-vous' },
      { value: DossierStatus.WON, label: 'Gagné' },
      { value: DossierStatus.LOST, label: 'Perdu' }
    ];
  }

  get availableStatusOptions(): DsSelectOption[] {
    const all = this.statusOptions;
    if (!this.dossier) return all;
    
    const allowed = this.getAvailableStatusKeys();
    return all.map(opt => ({
      ...opt,
      disabled: !allowed.includes(opt.value as DossierStatus)
    }));
  }

  private getAvailableStatusKeys(): DossierStatus[] {
    if (!this.dossier) return [DossierStatus.NEW];
    const current = this.dossier.status;
    switch (current) {
      case DossierStatus.WON:
      case DossierStatus.LOST: return [current];
      case DossierStatus.NEW: return [DossierStatus.NEW, DossierStatus.QUALIFYING, DossierStatus.LOST];
      case DossierStatus.QUALIFYING: return [DossierStatus.QUALIFYING, DossierStatus.QUALIFIED, DossierStatus.LOST];
      case DossierStatus.QUALIFIED: return [DossierStatus.QUALIFIED, DossierStatus.APPOINTMENT, DossierStatus.LOST];
      case DossierStatus.APPOINTMENT: return [DossierStatus.APPOINTMENT, DossierStatus.WON, DossierStatus.LOST];
      default: return Object.values(DossierStatus);
    }
  }

  messages: MessageResponse[] = [];
  loadingMessages = false;
  outboundMessages: DossierOutboundMessage[] = [];
  loadingOutbound = false;
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
  
  dsAuditColumns: DsColumn<AuditEventResponse>[] = [
    { key: 'createdAt',  header: 'Date' },
    { key: 'action',     header: 'Action' },
    { key: 'entityType', header: 'Type d\'entité' },
    { key: 'updatedBy',  header: 'Utilisateur' },
    { key: 'diff',       header: 'Changements' }
  ];

  get auditPaginationData(): any {
    return {
      number: this.auditPageIndex,
      size: this.auditPageSize,
      totalElements: this.auditTotalElements,
      totalPages: Math.ceil(this.auditTotalElements / this.auditPageSize),
      first: this.auditPageIndex === 0,
      last: (this.auditPageIndex + 1) * this.auditPageSize >= this.auditTotalElements
    };
  }

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
    { id: 'greeting', name: 'Salutation', content: 'Bonjour {{name}}, merci de votre intérêt pour notre propriété.', variables: ['name'], description: 'Message de bienvenue personnalisé' },
    { id: 'appointment_confirmation', name: 'Confirmation de rendez-vous', content: 'Bonjour {{name}}, votre rendez-vous est confirmé pour le {{date}} à {{time}} au {{location}}.', variables: ['name', 'date', 'time', 'location'], description: 'Confirmation de rendez-vous avec détails' },
    { id: 'followup', name: 'Suivi', content: 'Bonjour {{name}}, je reviens vers vous concernant le bien {{property}}. Êtes-vous toujours intéressé(e) ?', variables: ['name', 'property'], description: 'Message de suivi pour relancer le prospect' },
    { id: 'document_request', name: 'Demande de documents', content: 'Bonjour {{name}}, pourriez-vous nous transmettre les documents suivants : {{documents}} ?', variables: ['name', 'documents'], description: 'Demande de documents au client' }
  ];

  readonly auditPaginator = viewChild<HTMLElement>('auditPaginator');

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

  isStatusChangeDisabled(): boolean {
    if (!this.dossier) return false;
    return this.dossier.status === DossierStatus.WON || this.dossier.status === DossierStatus.LOST;
  }

  getStatusChangeTooltip(): string {
    if (!this.dossier) return '';
    if (this.dossier.status === DossierStatus.WON) return 'Le statut GAGNÉ est terminal';
    if (this.dossier.status === DossierStatus.LOST) return 'Le statut PERDU est terminal';
    return 'Sélectionnez un nouveau statut';
  }

  ngOnInit(): void {
    this.loadDossier();
    this.loadMockData();
    this.initializeCollaboration();
  }

  async initializeCollaboration(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const dossierId = parseInt(id, 10);
    if (isNaN(dossierId)) return;
    try {
      await this.collaborationService.initializeForDossier(dossierId, this.currentUserId, this.currentUsername);
      this.collaborationEnabled = true;
      this.subscribeToCollaborationUpdates();
    } catch (error) {
      console.error('Failed to initialize collaboration:', error);
    }
  }

  private subscribeToCollaborationUpdates(): void {
    this.collaborationSubscriptions.push(this.collaborationService.getEditUpdates().subscribe(edit => this.handleRemoteEdit(edit)));
    this.collaborationSubscriptions.push(this.collaborationService.getActivityUpdates().subscribe(() => this.loadAuditEvents()));
  }

  private handleRemoteEdit(edit: CollaborationEdit): void {
    if (!this.dossier) return;
    if (edit.fieldName === 'notes' && this.dossier.id === edit.dossierId) {
      this.dossier.notes = edit.newValue as string;
      this.toastService.info(`${edit.username} a mis à jour les notes`);
    } else if (edit.fieldName === 'status' && this.dossier.id === edit.dossierId) {
      this.loadDossier();
      this.toastService.info(`${edit.username} a changé le statut vers ${edit.newValue}`);
    }
  }

  onNotesInput(event: any): void {
    if (!this.collaborationEnabled || !this.dossier) return;
    const cursorPosition = event.target.selectionStart;
    this.collaborationService.updateCursor('notes', cursorPosition);
    if (this.noteEditTimeout) clearTimeout(this.noteEditTimeout);
    this.noteEditTimeout = setTimeout(() => this.broadcastNotesEdit(), 1000);
  }

  private broadcastNotesEdit(): void {
    if (!this.collaborationEnabled || !this.dossier) return;
    this.collaborationService.broadcastEdit('notes', this.dossier.notes, this.dossier.notes);
  }

  ngOnDestroy(): void {
    this.collaborationSubscriptions.forEach(sub => sub.unsubscribe());
    this.collaborationService.leaveDossier();
    if (this.noteEditTimeout) clearTimeout(this.noteEditTimeout);
  }

  loadDossier(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const dossierId = parseInt(id || '', 10);
    if (isNaN(dossierId)) { this.error = 'ID invalide'; return; }
    this.loading = true;
    this.error = null;
    this.dossierApiService.getById(dossierId).subscribe({
      next: (response) => {
        this.dossier = response;
        this.selectedStatus = response.status;
        this.loading = false;
        // Les onglets dépendent de l'id du dossier : on les charge une fois le dossier connu.
        this.loadRelatedData();
        this.recentNavigationService.addRecentItem({
          id: String(response.id),
          type: 'dossier',
          title: response.leadName || `Dossier #${response.id}`,
          subtitle: response.leadPhone || undefined,
          route: `/dossiers/${response.id}`
        });
      },
      error: (err) => {
        this.error = err.status === 404 ? 'Dossier introuvable' : 'Erreur de chargement';
        this.loading = false;
      }
    });
  }

  loadMessages(): void {
    const dossierId = this.dossier?.id;
    if (!dossierId) return;
    this.loadingMessages = true;
    this.messageApiService.list({ dossierId, size: 100, sort: 'timestamp,desc' }).subscribe({
      next: (response) => { this.cdr.markForCheck(); this.messages = response.content; this.loadingMessages = false; },
      error: () => { this.cdr.markForCheck(); this.loadingMessages = false; }
    });
  }

  // ---------- Consentements : saisie par l'agent et lien de confirmation ----------

  readonly consentChannels: ConsentementChannel[] = [ConsentementChannel.WHATSAPP, ConsentementChannel.SMS, ConsentementChannel.EMAIL];
  readonly consentPurposes: ConsentPurpose[] = ['TRANSACTIONNEL', 'MARKETING'];
  readonly channelOptions: DsSelectOption[] = [
    { value: ConsentementChannel.WHATSAPP, label: 'WhatsApp' },
    { value: ConsentementChannel.SMS, label: 'SMS' },
    { value: ConsentementChannel.EMAIL, label: 'E-mail' },
  ];
  readonly purposeOptions: DsSelectOption[] = [
    { value: 'TRANSACTIONNEL', label: 'Suivi du dossier (réponses, visites, documents)' },
    { value: 'MARKETING', label: 'Prospection (propositions de biens)' },
  ];
  readonly decisionOptions: DsSelectOption[] = [
    { value: ConsentementStatus.GRANTED, label: 'Le client est d\'accord' },
    { value: ConsentementStatus.DENIED, label: 'Le client refuse' },
    { value: ConsentementStatus.REVOKED, label: 'Le client retire son accord' },
  ];
  readonly methodOptions: DsSelectOption[] = [
    { value: 'PHONE_CALL', label: 'Au téléphone' },
    { value: 'IN_PERSON', label: 'En agence ou en visite' },
    { value: 'WRITTEN', label: 'Par écrit (document signé)' },
    { value: 'MESSAGE', label: 'Par message (WhatsApp, SMS, e-mail)' },
    { value: 'OTHER', label: 'Autre' },
  ];

  consentPanel: 'none' | 'record' | 'link' = 'none';
  recordForm = { channel: ConsentementChannel.WHATSAPP as ConsentementChannel, purpose: 'TRANSACTIONNEL' as ConsentPurpose,
    decision: ConsentementStatus.GRANTED as ConsentementStatus, method: 'PHONE_CALL', note: '' };
  savingConsent = false;
  linkForm = { channel: ConsentementChannel.WHATSAPP as ConsentementChannel, purpose: 'MARKETING' as ConsentPurpose };
  generatedLink: ConsentLinkResponse | null = null;
  generatingLink = false;
  sendingLink = false;

  openConsentPanel(panel: 'record' | 'link'): void {
    this.consentPanel = this.consentPanel === panel ? 'none' : panel;
    if (panel === 'link') this.generatedLink = null;
  }

  /** Dernier consentement pour un canal et une finalité (liste triée du plus récent au plus ancien). */
  latestConsent(channel: ConsentementChannel, purpose: ConsentPurpose): ConsentementResponse | undefined {
    return this.consentements
      .filter(c => c.channel === channel && (c.consentType || '').toUpperCase() === purpose)
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0];
  }

  /** Accord confirmé par le client lui-même (double opt-in), exigé pour la prospection. */
  isClientConfirmed(c: ConsentementResponse | undefined): boolean {
    const m = c?.meta || {};
    return c?.status === ConsentementStatus.GRANTED && (m['doubleOptInConfirmed'] === true || m['doubleOptInConfirmed'] === 'true');
  }

  consentSourceLabel(c: ConsentementResponse | undefined): string {
    if (!c) return '';
    const m = c.meta || {};
    if (m['source'] === 'CLIENT_LINK') return 'confirmé par le client';
    if (m['source'] === 'AGENT') {
      const how = this.methodOptions.find(o => o.value === m['method'])?.label?.toLowerCase();
      return `noté par ${m['recordedBy'] || 'un agent'}${how ? ' — ' + how : ''}`;
    }
    return this.isClientConfirmed(c) ? 'confirmé par le client' : '';
  }

  /** La prospection est bloquée tant que le client n'a pas confirmé lui-même. */
  needsClientConfirmation(channel: ConsentementChannel): boolean {
    const c = this.latestConsent(channel, 'MARKETING');
    return c?.status === ConsentementStatus.GRANTED && !this.isClientConfirmed(c);
  }

  /**
   * Dans la fenêtre de 24 h ouverte par un message du client, WhatsApp n'exige pas d'opt-in pour
   * lui répondre : seul un refus ou un retrait explicite de l'accord « suivi » bloque l'écriture.
   * (Le serveur vérifie la fenêtre et renvoie un message clair si elle est fermée.)
   */
  canReplyOnWhatsApp(): boolean {
    const status = this.latestConsent(ConsentementChannel.WHATSAPP, 'TRANSACTIONNEL')?.status;
    return status !== ConsentementStatus.DENIED && status !== ConsentementStatus.REVOKED;
  }

  saveAgentConsent(): void {
    if (!this.dossier || this.savingConsent) return;
    const f = this.recordForm;
    this.savingConsent = true;
    this.consentementApiService.create({
      dossierId: this.dossier.id,
      channel: f.channel,
      consentType: f.purpose,
      status: f.decision,
      meta: { source: 'AGENT', method: f.method, ...(f.note.trim() ? { note: f.note.trim() } : {}) }
    }).subscribe({
      next: () => { this.cdr.markForCheck(); this.cdr.markForCheck();
        this.savingConsent = false;
        this.consentPanel = 'none';
        this.recordForm.note = '';
        this.toastService.success('Consentement enregistré');
        this.loadConsentements();
      },
      error: (err: HttpErrorResponse) => { this.cdr.markForCheck();
        this.savingConsent = false;
        this.toastService.error(this.apiError(err, 'Impossible d\'enregistrer le consentement'));
      }
    });
  }

  generateConsentLink(): void {
    if (!this.dossier || this.generatingLink) return;
    this.generatingLink = true;
    this.consentLinkApi.createLink(this.dossier.id, this.linkForm.channel, this.linkForm.purpose).subscribe({
      next: (link) => { this.cdr.markForCheck(); this.generatedLink = link; this.generatingLink = false; },
      error: (err: HttpErrorResponse) => { this.cdr.markForCheck();
        this.generatingLink = false;
        this.toastService.error(this.apiError(err, 'Impossible de générer le lien'));
      }
    });
  }

  copyConsentLink(): void {
    const url = this.generatedLink?.url;
    if (!url) return;
    navigator.clipboard?.writeText(url).then(
      () => this.toastService.success('Lien copié'),
      () => this.toastService.info(url)
    );
  }

  consentLinkMessage(): string {
    const first = (this.dossier?.leadName || '').trim().split(/\s+/)[0];
    const purpose = this.generatedLink?.consentType === 'MARKETING'
      ? 'recevoir nos propositions de biens par WhatsApp'
      : 'que nous suivions votre dossier par WhatsApp';
    return `Bonjour${first ? ' ' + first : ''}, pour ${purpose}, merci de confirmer votre accord ici : ${this.generatedLink?.url}`;
  }

  sendConsentLinkOnWhatsApp(): void {
    if (!this.dossier || !this.generatedLink || this.sendingLink) return;
    this.sendingLink = true;
    this.dossierWhatsAppApi.reply(this.dossier.id, this.consentLinkMessage()).subscribe({
      next: () => { this.cdr.markForCheck(); this.cdr.markForCheck();
        this.sendingLink = false;
        this.toastService.success('Lien envoyé sur WhatsApp');
        this.loadOutboundMessages();
        this.loadWhatsAppMessages();
      },
      error: (err: HttpErrorResponse) => { this.cdr.markForCheck();
        this.sendingLink = false;
        this.toastService.error(this.apiError(err, 'Envoi impossible : copiez le lien et transmettez-le autrement.'));
      }
    });
  }

  private apiError(err: HttpErrorResponse, fallback: string): string {
    const detail = err?.error?.detail;
    return typeof detail === 'string' && detail && detail !== 'An unexpected error occurred' ? detail : fallback;
  }

  loadRelatedData(): void {
    this.loadMessages();
    this.loadWhatsAppMessages();
    this.loadOutboundMessages();
    this.loadAppointments();
    this.loadConsentements();
    this.loadAuditEvents();
  }

  loadOutboundMessages(): void {
    const dossierId = this.dossier?.id ?? parseInt(this.route.snapshot.paramMap.get('id') || '', 10);
    if (!dossierId || isNaN(dossierId)) return;
    this.loadingOutbound = true;
    this.outboundMessageApiService.listForDossier(dossierId).subscribe({
      next: (list) => { this.cdr.markForCheck();
        this.outboundMessages = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        this.loadingOutbound = false;
      },
      error: () => { this.cdr.markForCheck(); this.outboundMessages = []; this.loadingOutbound = false; }
    });
  }

  outboundText(m: DossierOutboundMessage): string {
    const p = m.payloadJson || {};
    return p['body'] || p['text'] || p['content'] || m.subject || (m.templateCode ? `Modèle « ${m.templateCode} »` : '—');
  }

  outboundStatusLabel(status: DossierOutboundMessage['status']): string {
    switch (status) {
      case 'QUEUED': return 'En attente';
      case 'SENDING': return 'Envoi en cours';
      case 'SENT': return 'Envoyé';
      case 'DELIVERED': return 'Livré';
      case 'FAILED': return 'Échec';
      case 'CANCELLED': return 'Annulé';
      case 'THROTTLED': return 'Quota atteint';
      default: return status;
    }
  }

  outboundStatusBadge(status: DossierOutboundMessage['status']): DsBadgeStatus {
    switch (status) {
      case 'SENT': case 'DELIVERED': return 'success';
      case 'FAILED': return 'error';
      case 'QUEUED': case 'SENDING': case 'THROTTLED': return 'warning';
      default: return 'neutral';
    }
  }

  appointmentBadge(status: AppointmentStatus): DsBadgeStatus {
    switch (status) {
      case AppointmentStatus.COMPLETED: return 'success';
      case AppointmentStatus.CANCELLED: return 'neutral';
      default: return 'info';
    }
  }

  consentBadge(status: ConsentementStatus | undefined): DsBadgeStatus {
    switch (status) {
      case ConsentementStatus.GRANTED: return 'success';
      case ConsentementStatus.DENIED:
      case ConsentementStatus.REVOKED: return 'error';
      case ConsentementStatus.PENDING: return 'warning';
      default: return 'neutral';
    }
  }

  consentTypeLabel(type: string | undefined): string {
    switch ((type || '').toUpperCase()) {
      case 'MARKETING': return 'Prospection';
      case 'TRANSACTIONNEL': return 'Suivi du dossier';
      case 'PROFILING': return 'Profilage';
      case 'GESTIONNEL': return 'Gestion';
      case 'RECHERCHE': return 'Recherche';
      default: return type || '—';
    }
  }

  loadAppointments(): void {
    const dossierId = this.dossier?.id;
    if (!dossierId) return;
    this.loadingAppointments = true;
    this.appointmentApiService.list({ dossierId, size: 100, sort: 'startTime,desc' }).subscribe({
      next: (response) => { this.cdr.markForCheck(); this.appointments = response.content; this.loadingAppointments = false; },
      error: () => { this.cdr.markForCheck(); this.loadingAppointments = false; }
    });
  }

  loadConsentements(): void {
    const dossierId = this.dossier?.id;
    if (!dossierId) return;
    this.consentementsLoading = true;
    this.consentementApiService.list({ dossierId, size: 100, sort: 'updatedAt,desc' }).subscribe({
      next: (response) => { this.cdr.markForCheck(); 
        this.consentements = response.content; 
        this.buildConsentementGroups();
        this.consentementsLoading = false; 
      },
      error: () => { this.cdr.markForCheck(); this.consentementsLoading = false; }
    });
  }

  buildConsentementGroups(): void {
    const channels = [ConsentementChannel.EMAIL, ConsentementChannel.SMS, ConsentementChannel.WHATSAPP];
    this.consentementGroups = channels.map(channel => ({
      channel, current: this.consentements.find(c => c.channel === channel) || null
    }));
  }

  loadMockData(): void {
    this.rendezVous = [
      { id: 1, date: new Date('2024-01-20T14:00:00'), time: '14:00', location: '123 Rue de la Paix, Paris', status: 'CONFIRMED', notes: 'Visite de l\'appartement' },
      { id: 2, date: new Date('2024-01-25T10:30:00'), time: '10:30', location: 'Bureau de l\'agence', status: 'SCHEDULED', notes: 'Signature du compromis' }
    ];
  }

  loadAuditEvents(): void {
    const dossierId = this.dossier?.id;
    if (!dossierId) return;
    this.auditEventsLoading = true;
    const params: any = { page: this.auditPageIndex, size: this.auditPageSize, sort: 'createdAt,desc' };
    if (this.auditFilterAction) params.action = this.auditFilterAction;
    if (this.auditFilterEntityType) {
      params.entityType = this.auditFilterEntityType;
      if (this.auditFilterEntityType === AuditEntityType.DOSSIER) params.entityId = dossierId;
      this.auditEventApiService.list(params).subscribe({
        next: (response) => { this.cdr.markForCheck(); this.auditEvents = response.content; this.auditTotalElements = response.totalElements; this.auditEventsLoading = false; },
        error: () => { this.cdr.markForCheck(); this.auditEventsLoading = false; }
      });
    } else {
      this.auditEventApiService.listByDossier(dossierId, params).subscribe({
        next: (response) => { this.cdr.markForCheck(); this.auditEvents = response.content; this.auditTotalElements = response.totalElements; this.auditEventsLoading = false; },
        error: () => { this.cdr.markForCheck(); this.auditEventsLoading = false; }
      });
    }
  }

  onAuditPageChange(direction: 'next' | 'previous'): void {
    if (direction === 'next' && (this.auditPageIndex + 1) * this.auditPageSize < this.auditTotalElements) {
      this.auditPageIndex++;
    } else if (direction === 'previous' && this.auditPageIndex > 0) {
      this.auditPageIndex--;
    }
    this.loadAuditEvents();
  }

  onAuditFilterChange(): void {
    this.auditPageIndex = 0;
    this.loadAuditEvents();
  }

  updateStatus(): void {
    if (!this.dossier || !this.selectedStatus || this.selectedStatus === this.dossier.status) return;
    this.updatingStatus = true;
    this.dossierApiService.patchStatus(this.dossier.id, this.selectedStatus).subscribe({
      next: () => {
        this.updatingStatus = false;
        this.toastService.success('Statut mis à jour avec succès');
        this.loadDossier();
        this.showStatusChange = false;
      },
      error: (err) => {
        this.updatingStatus = false;
        this.toastService.error(err.error?.message || 'Erreur lors de la mise à jour');
      }
    });
  }

  updateLead(): void {
    if (!this.dossier || !this.leadFormName?.trim() || !this.leadFormPhone?.trim()) {
      this.leadError = 'Nom et téléphone requis';
      return;
    }
    this.updatingLead = true;
    this.dossierApiService.patchLead(this.dossier.id, this.leadFormName, this.leadFormPhone).subscribe({
      next: () => {
        this.updatingLead = false;
        this.toastService.success('Prospect mis à jour');
        this.loadDossier();
        this.showLeadForm = false;
      },
      error: (err) => {
        this.updatingLead = false;
        this.toastService.error(err.error?.message || 'Erreur de mise à jour');
      }
    });
  }

  generateContract(): void {
    if (!this.dossier) return;
    this.generatingContract = true;
    this.dossierApiService.generateContract(this.dossier.id).subscribe({
      next: (response) => {
        this.generatingContract = false;
        this.contractText = response.contractText;
        this.toastService.success('Compromis généré par l\'IA Atlas');
      },
      error: () => {
        this.generatingContract = false;
        this.toastService.error('Erreur de génération');
      }
    });
  }

  openPartiePrenanteDialog(partie?: PartiePrenanteResponse): void {
    const dialogData = partie ? { id: partie.id, role: partie.role, firstName: partie.firstName || '', lastName: partie.lastName || '', phone: partie.phone || '', email: partie.email || '' } : null;
    const dialogRef = this.dsDialogService.open<PartiePrenanteFormData>(PartiePrenanteFormDialogComponent, { width: '500px', data: dialogData });
    dialogRef.closed.subscribe((result: PartiePrenanteFormData | undefined) => {
      if (result) {
        if (result.id) this.updatePartie(result.id, result);
        else this.addPartie(result);
      }
    });
  }

  addPartie(data: PartiePrenanteFormData): void {
    if (!this.dossier) return;
    this.partiePrenanteApiService.create({ dossierId: this.dossier.id, ...data }).subscribe({
      next: () => { this.toastService.success('Partie prenante ajoutée'); this.loadDossier(); },
      error: (err) => this.toastService.error(err.error?.message || 'Échec de l\'ajout')
    });
  }

  updatePartie(id: number, data: PartiePrenanteFormData): void {
    this.partiePrenanteApiService.update(id, data).subscribe({
      next: () => { this.toastService.success('Partie prenante modifiée'); this.loadDossier(); },
      error: (err) => this.toastService.error(err.error?.message || 'Échec de la modification')
    });
  }

  deletePartie(partie: PartiePrenanteResponse): void {
    const dialogRef = this.dsDialogService.open<boolean>(ConfirmDeleteDialogComponent, {
      data: {
        title: 'Supprimer la partie prenante',
        message: `Voulez-vous vraiment supprimer ${partie.firstName} ${partie.lastName} ?`
      }
    });

    dialogRef.closed.subscribe(confirmed => {
      if (confirmed) {
        this.partiePrenanteApiService.delete(partie.id).subscribe({
          next: () => {
            this.toastService.success('Partie prenante supprimée');
            this.loadDossier();
          },
          error: (err) => {
            this.toastService.error(err.error?.message || 'Échec de la suppression');
          }
        });
      }
    });
  }

  openAppointmentDialog(appointment?: AppointmentResponse): void {
    if (!this.dossier) return;
    const dialogData = appointment ? { id: appointment.id, dossierId: this.dossier.id, startTime: appointment.startTime, endTime: appointment.endTime, location: appointment.location, assignedTo: appointment.assignedTo, notes: appointment.notes, status: appointment.status } : { dossierId: this.dossier.id };
    const dialogRef = this.dsDialogService.open<AppointmentFormData>(AppointmentFormDialogComponent, { width: '600px', data: dialogData });
    dialogRef.closed.subscribe((result: AppointmentFormData | undefined) => {
      if (result) {
        if (result.id) this.updateAppointment(result.id, result);
        else this.createAppointment(result);
      }
    });
  }

  createAppointment(data: AppointmentFormData): void {
    if (!data.startTime || !data.endTime) return;
    this.appointmentApiService.create({ 
      dossierId: data.dossierId, 
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      assignedTo: data.assignedTo,
      notes: data.notes,
      status: data.status || AppointmentStatus.SCHEDULED
    }).subscribe({
      next: (resp) => {
        resp.warnings?.forEach(w => this.toastService.warning(w));
        this.toastService.success('Rendez-vous créé');
        this.loadAppointments();
      },
      error: (err: any) => this.toastService.error(err.error?.message || 'Échec création')
    });
  }

  updateAppointment(id: number, data: AppointmentFormData): void {
    if (!data.startTime || !data.endTime) return;
    this.appointmentApiService.update(id, {
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      assignedTo: data.assignedTo,
      notes: data.notes,
      status: data.status || AppointmentStatus.SCHEDULED
    }).subscribe({
      next: (resp) => {
        resp.warnings?.forEach(w => this.toastService.warning(w));
        this.toastService.success('Rendez-vous modifié');
        this.loadAppointments();
      },
      error: (err: any) => this.toastService.error(err.error?.message || 'Échec modification')
    });
  }

  deleteAppointment(appointment: AppointmentResponse): void {
    const dialogRef = this.dsDialogService.open<boolean>(ConfirmDeleteDialogComponent, {
      data: { title: 'Supprimer le rendez-vous', message: 'Voulez-vous vraiment supprimer ce rendez-vous ?' }
    });
    dialogRef.closed.subscribe(confirmed => {
      if (confirmed) {
        this.appointmentApiService.delete(appointment.id).subscribe({
          next: () => {
            this.toastService.success('Rendez-vous supprimé');
            this.loadAppointments();
          },
          error: (err) => {
            this.toastService.error(err.error?.message || 'Échec de la suppression');
          }
        });
      }
    });
  }

  toggleConsentement(group: ConsentementGroup, newStatus: ConsentementStatus): void {
    if (!this.dossier) return;
    if (group.current) {
      if (group.current.status === newStatus) return;
      this.consentementApiService.update(group.current.id, { channel: group.channel, status: newStatus }).subscribe({
        next: () => { this.toastService.success('Consentement mis à jour'); this.loadConsentements(); },
        error: () => this.toastService.error('Échec mise à jour')
      });
    } else {
      this.consentementApiService.create({ dossierId: this.dossier.id, channel: group.channel, status: newStatus }).subscribe({
        next: () => { this.toastService.success('Consentement créé'); this.loadConsentements(); },
        error: () => this.toastService.error('Échec création')
      });
    }
  }

  openMessageDialog(): void {
    if (!this.dossier) return;
    const dialogRef = this.dsDialogService.open<MessageResponse>(MessageFormDialogComponent, { width: '500px', data: { dossierId: this.dossier.id } });
    dialogRef.closed.subscribe((result: MessageResponse | undefined) => {
      if (result) {
        this.messageApiService.create(result as any).subscribe({
          next: (m) => { this.toastService.success('Message créé'); this.messages = [m, ...this.messages]; },
          error: (err: any) => this.toastService.error(err.error?.message || 'Échec création')
        });
      }
    });
  }

  sendWhatsAppMessage(): void {
    if (!this.dossier || !this.canSendWhatsAppMessage()) return;
    if (!this.isWhatsAppConsentGranted()) { this.toastService.warning('Consentement WhatsApp requis'); return; }
    this.sendingWhatsAppMessage = true;
    this.messageApiService.create({ 
      dossierId: this.dossier.id, 
      channel: MessageChannel.WHATSAPP, 
      direction: MessageDirection.OUTBOUND, 
      content: this.whatsappMessageContent, 
      timestamp: new Date().toISOString(),
      templateId: this.selectedTemplate?.id, 
      templateVariables: this.selectedTemplate ? this.templateVariables : undefined 
    }).subscribe({
      next: (m) => { this.toastService.success('Message WhatsApp envoyé'); this.whatsappMessages.push(m); this.resetWhatsAppForm(); this.sendingWhatsAppMessage = false; },
      error: (err: any) => { this.toastService.error(err.error?.message || 'Échec envoi'); this.sendingWhatsAppMessage = false; }
    });
  }

  retryWhatsAppMessage(message: MessageResponse): void {
    if (message.deliveryStatus !== MessageDeliveryStatus.FAILED) return;
    this.messageApiService.retry(message.id).subscribe({
      next: (updated) => { this.toastService.info('Renvoi en cours...'); const idx = this.whatsappMessages.findIndex(m => m.id === message.id); if (idx !== -1) this.whatsappMessages[idx] = updated; },
      error: (err: any) => this.toastService.error(err.error?.message || 'Échec renvoi')
    });
  }

  formatDate(dateString: string): string { if (!dateString) return '—'; return new Date(dateString).toLocaleString('fr-FR'); }
  formatMessageTimestamp(ts: string): string { return new Date(ts).toLocaleString('fr-FR'); }
  truncateContent(c: string, max = 200): string { return c.length <= max ? c : c.substring(0, max) + '...'; }
  isWhatsAppConsentGranted(): boolean { return this.consentements.find(c => c.channel === ConsentementChannel.WHATSAPP)?.status === ConsentementStatus.GRANTED; }
  resetWhatsAppForm(): void { this.selectedTemplate = null; this.templateVariables = {}; this.whatsappMessageContent = ''; }
  canSendWhatsAppMessage(): boolean { return !!this.whatsappMessageContent?.trim(); }

  loadWhatsAppMessages(): void {
    const dossierId = this.dossier?.id || parseInt(this.route.snapshot.paramMap.get('id') || '', 10);
    if (isNaN(dossierId)) return;
    this.loadingWhatsAppMessages = true;
    this.messageApiService.list({ dossierId, channel: MessageChannel.WHATSAPP, size: 50, sort: 'timestamp,asc' }).subscribe({
      next: (response) => { this.cdr.markForCheck(); this.whatsappMessages = response.content; this.loadingWhatsAppMessages = false; },
      error: () => { this.cdr.markForCheck(); this.loadingWhatsAppMessages = false; }
    });
  }

  /** Agent changé depuis la carte « Agent » : on garde le reste du dossier affiché. */
  /** Libellé du statut dans l'en-tête (l'enum, projection du code de statut). */
  get statusLabel(): string {
    if (!this.dossier) return '';
    return this.statusOptions.find(o => o.value === this.dossier!.status)?.label ?? String(this.dossier.status);
  }

  /** Statut changé depuis la carte « Statut » : tout le dossier est rechargé (historique, activité). */
  onStatusChanged(updated: DossierResponse): void {
    if (!this.dossier) return;
    this.dossier = {
      ...this.dossier,
      status: updated.status,
      statusCode: updated.statusCode ?? null,
      lossReason: updated.lossReason ?? null,
      wonReason: updated.wonReason ?? null,
    };
    this.cdr.markForCheck();
    this.loadDossier();
  }

  onAssigneeChanged(updated: DossierResponse): void {
    if (!this.dossier) return;
    this.dossier = {
      ...this.dossier,
      assignedTo: updated.assignedTo ?? null,
      assignedToName: updated.assignedToName ?? null,
      assignedAt: updated.assignedAt ?? null,
    };
    this.cdr.markForCheck();
  }

  goBack(): void {
    this.router.navigate(['/dossiers']);
  }

  toggleStatusChange(): void {
    this.showStatusChange = !this.showStatusChange;
    if (this.showStatusChange && this.dossier) {
      this.selectedStatus = this.dossier.status;
    }
  }

  getVirtualCoachNudge(): string {
    if (!this.dossier) return '';
    if (this.dossier.status === DossierStatus.NEW) return 'Pensez à qualifier ce prospect rapidement.';
    if (this.dossier.status === DossierStatus.QUALIFYING && !this.dossier.leadPhone) return 'Le numéro de téléphone est manquant pour ce prospect.';
    return 'Continuez le bon travail sur ce dossier !';
  }

  getScoreDisplay(): string {
    return '85%';
  }

  hasEmptyFields(): boolean {
    return !this.dossier?.leadPhone || !this.dossier?.leadSource;
  }

  getEmptyFieldsList(): string {
    const fields = [];
    if (!this.dossier?.leadPhone) fields.push('Téléphone');
    if (!this.dossier?.leadSource) fields.push('Source');
    return fields.join(', ');
  }

  isLeadEmpty(): boolean {
    return !this.dossier?.leadName && !this.dossier?.leadPhone;
  }

  toggleLeadForm(): void {
    this.showLeadForm = !this.showLeadForm;
    if (this.showLeadForm && this.dossier) {
      this.leadFormName = this.dossier.leadName || '';
      this.leadFormPhone = this.dossier.leadPhone || '';
    }
  }

  togglePartieForm(): void {
    this.showPartieForm = !this.showPartieForm;
  }

  getRoleBadgeClass(role: PartiePrenanteRole): string {
    switch (role) {
      case PartiePrenanteRole.BUYER: return 'role-buyer';
      case PartiePrenanteRole.SELLER: return 'role-seller';
      case PartiePrenanteRole.NOTARY: return 'role-notary';
      default: return 'role-other';
    }
  }

  getRoleLabel(role: PartiePrenanteRole): string {
    switch (role) {
      case PartiePrenanteRole.BUYER: return 'Acheteur';
      case PartiePrenanteRole.SELLER: return 'Vendeur';
      case PartiePrenanteRole.NOTARY: return 'Notaire';
      default: return role;
    }
  }

  editPartie(partie: PartiePrenanteResponse): void {
    this.openPartiePrenanteDialog(partie);
  }

  getMessagesSorted(): MessageResponse[] {
    return [...this.messages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getMessagesForDsThread(): any[] {
    return this.getMessagesSorted();
  }

  formatAppointmentDateTime(date: string): string {
    return this.formatDate(date);
  }

  getAppointmentStatusBadgeClass(status: AppointmentStatus): string {
    return `badge-apt-${status.toLowerCase()}`;
  }

  getAppointmentStatusLabel(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.SCHEDULED: return 'Planifié';
      case AppointmentStatus.COMPLETED: return 'Terminé';
      case AppointmentStatus.CANCELLED: return 'Annulé';
      default: return status;
    }
  }

  editAppointment(appointment: AppointmentResponse): void {
    this.openAppointmentDialog(appointment);
  }

  completeAppointment(appointment: AppointmentResponse): void {
    this.updateAppointment(appointment.id, { 
      dossierId: appointment.dossierId,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: AppointmentStatus.COMPLETED 
    });
  }

  getChannelLabel(channel: MessageChannel | ConsentementChannel): string {
    switch (channel) {
      case MessageChannel.WHATSAPP:
      case ConsentementChannel.WHATSAPP: return 'WhatsApp';
      case MessageChannel.EMAIL:
      case ConsentementChannel.EMAIL: return 'Email';
      case MessageChannel.SMS:
      case ConsentementChannel.SMS: return 'SMS';
      default: return channel;
    }
  }

  getConsentementStatusBadgeClass(status: ConsentementStatus): string {
    return `badge-consent-${status.toLowerCase()}`;
  }

  getConsentementStatusLabel(status: ConsentementStatus): string {
    switch (status) {
      case ConsentementStatus.GRANTED: return 'Accordé';
      case ConsentementStatus.REVOKED: return 'Révoqué';
      case ConsentementStatus.DENIED: return 'Refusé';
      case ConsentementStatus.PENDING: return 'En attente';
      default: return status;
    }
  }

  getConsentDate(consent: ConsentementResponse): string {
    return this.formatDate(consent.updatedAt);
  }

  getConsentementsHistory(): ConsentementResponse[] {
    return this.consentements;
  }

  getChannelBadgeClass(channel: ConsentementChannel): string {
    return `badge-channel-${channel.toLowerCase()}`;
  }

  getUserFromMeta(meta: any): string {
    return meta.updatedBy || 'Système';
  }

  getAuditActionLabel(action: AuditAction): string {
    switch (action) {
      case AuditAction.CREATED: return 'Création';
      case AuditAction.UPDATED: return 'Mise à jour';
      case AuditAction.DELETED: return 'Suppression';
      default: return action;
    }
  }

  getAuditEntityTypeLabel(entityType: AuditEntityType): string {
    switch (entityType) {
      case AuditEntityType.DOSSIER: return 'Dossier';
      case AuditEntityType.ANNONCE: return 'Annonce';
      case AuditEntityType.MESSAGE: return 'Message';
      case AuditEntityType.PARTIE_PRENANTE: return 'Partie Prenante';
      case AuditEntityType.CONSENTEMENT: return 'Consentement';
      default: return entityType;
    }
  }

  parseDiffChanges(diff: any): DiffChange[] {
    try {
      if (!diff) return [];
      const parsed = typeof diff === 'string' ? JSON.parse(diff) : diff;
      return Object.keys(parsed).map(key => ({
        field: key,
        oldValue: parsed[key].old,
        newValue: parsed[key].new
      }));
    } catch (e) {
      return [];
    }
  }

  formatDiffValue(value: any): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    return String(value);
  }
}
