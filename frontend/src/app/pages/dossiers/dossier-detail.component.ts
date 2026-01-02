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

  getStatusBadgeClass(status: DossierStatus): string {
    switch (status) {
      case DossierStatus.NEW:
        return 'status-badge status-new';
      case DossierStatus.QUALIFIED:
        return 'status-badge status-qualified';
      case DossierStatus.APPOINTMENT:
        return 'status-badge status-appointment';
      case DossierStatus.WON:
        return 'status-badge status-won';
      case DossierStatus.LOST:
        return 'status-badge status-lost';
      default:
        return 'status-badge';
    }
  }
}
