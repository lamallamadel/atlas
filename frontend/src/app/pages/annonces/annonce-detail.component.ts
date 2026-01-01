import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnnonceApiService, AnnonceResponse, AnnonceStatus } from '../../services/annonce-api.service';

@Component({
  selector: 'app-annonce-detail',
  templateUrl: './annonce-detail.component.html',
  styleUrls: ['./annonce-detail.component.css']
})
export class AnnonceDetailComponent implements OnInit {
  annonce: AnnonceResponse | null = null;
  loading = false;
  error: string | null = null;

  AnnonceStatus = AnnonceStatus;

  constructor(
    private annonceApiService: AnnonceApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAnnonce();
  }

  loadAnnonce(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Invalid annonce ID';
      return;
    }

    const annonceId = parseInt(id, 10);
    if (isNaN(annonceId)) {
      this.error = 'Invalid annonce ID';
      return;
    }

    this.loading = true;
    this.error = null;

    this.annonceApiService.getById(annonceId).subscribe({
      next: (response) => {
        this.annonce = response;
        this.loading = false;
      },
      error: (err) => {
        if (err.status === 404) {
          this.error = 'Annonce not found';
        } else {
          this.error = 'Failed to load annonce. Please try again.';
        }
        this.loading = false;
        console.error('Error loading annonce:', err);
      }
    });
  }

  editAnnonce(): void {
    if (this.annonce) {
      this.router.navigate(['/annonces', this.annonce.id, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/annonces']);
  }

  getStatusBadgeClass(status: AnnonceStatus): string {
    switch (status) {
      case AnnonceStatus.PUBLISHED:
        return 'status-badge status-published';
      case AnnonceStatus.DRAFT:
        return 'status-badge status-draft';
      case AnnonceStatus.ARCHIVED:
        return 'status-badge status-archived';
      default:
        return 'status-badge';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  formatPrice(price: number | undefined, currency: string | undefined): string {
    if (price === undefined) return 'N/A';
    const curr = currency || 'EUR';
    return `${price.toFixed(2)} ${curr}`;
  }
}
