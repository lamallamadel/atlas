import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DossierApiService, DossierResponse, DossierStatus, PartiePrenanteResponse, PartiePrenanteRole } from '../../services/dossier-api.service';
import { PartiePrenanteApiService, PartiePrenanteCreateRequest, PartiePrenanteUpdateRequest } from '../../services/partie-prenante-api.service';
import { PartiePrenanteFormDialogComponent, PartiePrenanteFormData } from '../../components/partie-prenante-form-dialog.component';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog.component';

export interface Message {
  id: number;
  timestamp: Date;
  content: string;
  channel: 'EMAIL' | 'SMS' | 'PHONE' | 'WEB';
  direction: 'INBOUND' | 'OUTBOUND';
  author?: string;
}

export interface RendezVous {
  id: number;
  date: Date;
  time: string;
  location: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface Consentement {
  id: number;
  type: string;
  description: string;
  channel: 'EMAIL' | 'SMS' | 'PHONE';
  status: boolean;
  grantedAt?: Date;
}

export interface AuditEvent {
  id: number;
  timestamp: Date;
  action: string;
  actor: string;
  details: string;
}

@Component({
  selector: 'app-dossier-detail',
  templateUrl: './dossier-detail.component.html',
  styleUrls: ['./dossier-detail.component.css']
})
export class DossierDetailComponent implements OnInit {
  dossier: DossierResponse | null = null;
  loading = false;
  error: string | null = null;
  
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
    DossierStatus.QUALIFIED,
    DossierStatus.APPOINTMENT,
    DossierStatus.WON,
    DossierStatus.LOST
  ];

  messages: Message[] = [];
  rendezVous: RendezVous[] = [];
  consentements: Consentement[] = [];
  auditEvents: AuditEvent[] = [];

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
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  getAvailableStatusOptions(): DossierStatus[] {
    if (!this.dossier) {
      return this.statusOptions;
    }

    const currentStatus = this.dossier.status;

    switch (currentStatus) {
      case DossierStatus.WON:
      case DossierStatus.LOST:
        return [currentStatus];
      
      case DossierStatus.QUALIFIED:
        return [
          DossierStatus.QUALIFIED,
          DossierStatus.APPOINTMENT,
          DossierStatus.WON,
          DossierStatus.LOST
        ];
      
      case DossierStatus.NEW:
      case DossierStatus.APPOINTMENT:
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

    if (this.dossier.status === DossierStatus.QUALIFIED) {
      return 'Seules les transitions vers RENDEZ-VOUS, GAGNÉ ou PERDU sont autorisées';
    }

    return 'Sélectionnez un nouveau statut';
  }

  ngOnInit(): void {
    this.loadDossier();
    this.loadMockData();
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

  loadMockData(): void {
    this.messages = [
      {
        id: 1,
        timestamp: new Date('2024-01-15T10:30:00'),
        content: 'Bonjour, je suis intéressé par votre annonce.',
        channel: 'EMAIL',
        direction: 'INBOUND',
        author: 'Client'
      },
      {
        id: 2,
        timestamp: new Date('2024-01-15T11:00:00'),
        content: 'Merci pour votre message. Je vous recontacte rapidement.',
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        author: 'Agent'
      },
      {
        id: 3,
        timestamp: new Date('2024-01-16T14:20:00'),
        content: 'Appel téléphonique pour fixer un rendez-vous.',
        channel: 'PHONE',
        direction: 'OUTBOUND',
        author: 'Agent'
      }
    ];

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

    this.consentements = [
      {
        id: 1,
        type: 'marketing',
        description: 'Recevoir des offres commerciales',
        channel: 'EMAIL',
        status: true,
        grantedAt: new Date('2024-01-15T10:30:00')
      },
      {
        id: 2,
        type: 'marketing',
        description: 'Recevoir des offres commerciales',
        channel: 'SMS',
        status: false
      },
      {
        id: 3,
        type: 'contact',
        description: 'Être contacté par téléphone',
        channel: 'PHONE',
        status: true,
        grantedAt: new Date('2024-01-15T10:30:00')
      }
    ];

    this.auditEvents = [
      {
        id: 1,
        timestamp: new Date('2024-01-15T10:30:00'),
        action: 'Création',
        actor: 'system',
        details: 'Dossier créé depuis le formulaire web'
      },
      {
        id: 2,
        timestamp: new Date('2024-01-16T09:15:00'),
        action: 'Changement de statut',
        actor: 'agent@example.com',
        details: 'Statut modifié de NOUVEAU à QUALIFIÉ'
      },
      {
        id: 3,
        timestamp: new Date('2024-01-16T14:20:00'),
        action: 'Ajout de partie prenante',
        actor: 'agent@example.com',
        details: 'Ajout d\'un acheteur: Jean Dupont'
      }
    ];
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
      this.leadError = 'Le nom du lead est requis';
      return;
    }

    if (!this.leadFormPhone || this.leadFormPhone.trim() === '') {
      this.leadError = 'Le téléphone du lead est requis';
      return;
    }

    this.updatingLead = true;
    this.leadError = null;
    this.leadSuccessMessage = null;

    this.dossierApiService.patchLead(this.dossier.id, this.leadFormName, this.leadFormPhone).subscribe({
      next: () => {
        this.updatingLead = false;
        this.snackBar.open('Informations du lead mises à jour avec succès !', 'Fermer', {
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
        const errorMessage = err.error?.message || 'Échec de la mise à jour des informations du lead. Veuillez réessayer.';
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

  editRendezVous(_rdv: RendezVous): void {
    this.snackBar.open('Édition de rendez-vous non implémentée (mock data)', 'Fermer', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  toggleConsentement(consentement: Consentement): void {
    consentement.status = !consentement.status;
    if (consentement.status) {
      consentement.grantedAt = new Date();
    } else {
      consentement.grantedAt = undefined;
    }
    this.snackBar.open('Consentement mis à jour (mock data)', 'Fermer', {
      duration: 2000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  getMessagesSorted(): Message[] {
    return this.messages.slice().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getChannelBadgeClass(channel: string): string {
    switch (channel) {
      case 'EMAIL': return 'channel-badge channel-email';
      case 'SMS': return 'channel-badge channel-sms';
      case 'PHONE': return 'channel-badge channel-phone';
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
      default: return role;
    }
  }
}
