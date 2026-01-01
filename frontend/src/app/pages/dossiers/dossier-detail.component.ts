import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDossier();
  }

  loadDossier(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Invalid dossier ID';
      return;
    }

    const dossierId = parseInt(id, 10);
    if (isNaN(dossierId)) {
      this.error = 'Invalid dossier ID';
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
          this.error = 'Dossier not found';
        } else {
          this.error = 'Failed to load dossier. Please try again.';
        }
        this.loading = false;
        console.error('Error loading dossier:', err);
      }
    });
  }

  updateStatus(): void {
    if (!this.dossier || !this.selectedStatus) {
      return;
    }

    if (this.selectedStatus === this.dossier.status) {
      this.statusError = 'Status is already set to this value';
      return;
    }

    this.updatingStatus = true;
    this.statusError = null;
    this.successMessage = null;

    this.dossierApiService.patchStatus(this.dossier.id, this.selectedStatus).subscribe({
      next: (response) => {
        this.dossier = response;
        this.selectedStatus = response.status;
        this.successMessage = 'Status updated successfully!';
        this.updatingStatus = false;
        
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
      },
      error: (err) => {
        this.statusError = 'Failed to update status. Please try again.';
        this.updatingStatus = false;
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}
