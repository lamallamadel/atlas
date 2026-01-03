import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DossierApiService, DossierResponse, DossierStatus } from '../../services/dossier-api.service';

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
  statusOptions = [
    DossierStatus.NEW,
    DossierStatus.QUALIFIED,
    DossierStatus.APPOINTMENT,
    DossierStatus.WON,
    DossierStatus.LOST
  ];

  constructor(
    private dossierApiService: DossierApiService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
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
}
