import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DossierApiService, DossierResponse, DossierStatus, PartiePrenanteResponse, PartiePrenanteRole } from '../../services/dossier-api.service';
import { PartiePrenanteApiService, PartiePrenanteCreateRequest, PartiePrenanteUpdateRequest } from '../../services/partie-prenante-api.service';
import { MessageApiService, MessageResponse, MessageCreateRequest } from '../../services/message-api.service';
import { AppointmentApiService, AppointmentResponse, AppointmentCreateRequest, AppointmentUpdateRequest, AppointmentStatus } from '../../services/appointment-api.service';
import { PartiePrenanteFormDialogComponent, PartiePrenanteFormData } from '../../components/partie-prenante-form-dialog.component';
import { MessageFormDialogComponent, MessageFormData } from '../../components/message-form-dialog.component';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog.component';
import { AppointmentFormDialogComponent, AppointmentFormData } from '../../components/appointment-form-dialog.component';



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

  messages: MessageResponse[] = [];
  loadingMessages = false;
  appointments: AppointmentResponse[] = [];
  loadingAppointments = false;
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
    private messageApiService: MessageApiService,
    private appointmentApiService: AppointmentApiService,
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
    this.loadMessages();
    this.loadAppointments();
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
      default: return role;
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
}
