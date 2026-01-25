import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnnonceApiService, AnnonceResponse, AnnonceStatus } from '../../services/annonce-api.service';
import { RecentNavigationService } from '../../services/recent-navigation.service';

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
    private router: Router,
    private recentNavigationService: RecentNavigationService
  ) {}

  ngOnInit(): void {
    this.loadAnnonce();
  }

  loadAnnonce(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID d\'annonce invalide';
      return;
    }

    const annonceId = parseInt(id, 10);
    if (isNaN(annonceId)) {
      this.error = 'ID d\'annonce invalide';
      return;
    }

    this.loading = true;
    this.error = null;

    this.annonceApiService.getById(annonceId).subscribe({
      next: (response) => {
        this.annonce = response;
        this.loading = false;
        
        // Add to recent navigation
        this.recentNavigationService.addRecentItem({
          id: String(response.id),
          type: 'annonce',
          title: response.title,
          subtitle: response.city ? `${response.city} - ${response.price ? response.price + '€' : ''}` : undefined,
          route: `/annonces/${response.id}`
        });
      },
      error: (err) => {
        if (err.status === 404) {
          this.error = 'Annonce introuvable';
        } else {
          this.error = 'Échec du chargement de l\'annonce. Veuillez réessayer.';
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
}
