import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnnonceApiService, AnnonceResponse, AnnonceStatus } from '../../services/annonce-api.service';
import { RecentNavigationService } from '../../services/recent-navigation.service';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { PriceFormatPipe } from '../../pipes/price-format.pipe';
import {
  DsButtonComponent,
  DsBadgeComponent,
  DsCardComponent,
  DsSkeletonComponent,
  DsEmptyStateComponent,
} from '../../design-system/index';

@Component({
  selector: 'app-annonce-detail',
  templateUrl: './annonce-detail.component.html',
  styleUrls: ['./annonce-detail.component.css'],
  imports: [
    DateFormatPipe,
    PriceFormatPipe,
    DsButtonComponent,
    DsBadgeComponent,
    DsCardComponent,
    DsSkeletonComponent,
    DsEmptyStateComponent,
  ],
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
    private recentNavigationService: RecentNavigationService,
  ) {}

  ngOnInit(): void {
    this.loadAnnonce();
  }

  loadAnnonce(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error = 'ID d\'annonce invalide'; return; }
    const annonceId = parseInt(id, 10);
    if (isNaN(annonceId)) { this.error = 'ID d\'annonce invalide'; return; }

    this.loading = true;
    this.error = null;

    this.annonceApiService.getById(annonceId).subscribe({
      next: (response) => {
        this.annonce = response;
        this.loading = false;
        this.recentNavigationService.addRecentItem({
          id: String(response.id),
          type: 'annonce',
          title: response.title,
          subtitle: response.city
            ? `${response.city} - ${response.price ? response.price + '€' : ''}`
            : undefined,
          route: `/annonces/${response.id}`,
        });
      },
      error: (err) => {
        this.error = err.status === 404
          ? 'Annonce introuvable'
          : 'Échec du chargement de l\'annonce. Veuillez réessayer.';
        this.loading = false;
      },
    });
  }

  editAnnonce(): void {
    if (this.annonce) this.router.navigate(['/annonces', this.annonce.id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/annonces']);
  }
}
