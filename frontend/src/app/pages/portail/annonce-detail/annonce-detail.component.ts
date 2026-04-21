import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PortailService, Listing } from '../../../services/portail.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-annonce-detail',
    templateUrl: './annonce-detail.component.html',
    styleUrls: ['./annonce-detail.component.scss'],
    imports: [RouterLink, FormsModule, DecimalPipe]
})
export class AnnonceDetailComponent implements OnInit {

  listing: Listing | null = null;
  similarListings: Listing[] = [];
  galleryIndex = 0;
  leadModalOpen = false;
  leadModalType: 'visite' | 'message' = 'visite';
  reportModalOpen = false;
  leadSubmitted = false;
  reportSubmitted = false;
  leadForm = { nom: '', tel: '', email: '', message: '', consent: false };
  reportForm = { motif: '', commentaire: '' };

  constructor(
    public portailService: PortailService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.portailService.getListingById(params['id']).subscribe({
        next: (res) => {
          this.listing = res;
          this.galleryIndex = 0;
          
          // Load similar listings
          this.portailService.searchAnnonces({
            tx: this.listing.tx, ville: this.listing.city, prixMin: null, prixMax: null,
            surfMin: null, surfMax: null, pieces: 0, sort: 'recent', page: 1
          }).subscribe(sim => {
             this.similarListings = sim.content.filter(l => l.id !== this.listing?.id).slice(0, 4);
          });
        },
        error: () => this.router.navigate(['/'])
      });
    });
  }

  get currentImage(): string {
    if (!this.listing || !this.listing.imgs || this.listing.imgs.length === 0) 
        return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80';
    return this.listing.imgs[this.galleryIndex];
  }

  get images(): string[] {
    if (!this.listing || !this.listing.imgs || this.listing.imgs.length === 0) {
        return ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'];
    }
    return this.listing.imgs;
  }

  galleryPrev(): void { if (this.listing) this.galleryIndex = (this.galleryIndex - 1 + this.images.length) % this.images.length; }
  galleryNext(): void { if (this.listing) this.galleryIndex = (this.galleryIndex + 1) % this.images.length; }
  setGalleryIndex(i: number): void { this.galleryIndex = i; }

  openLeadModal(type: 'visite' | 'message'): void { this.leadModalType = type; this.leadModalOpen = true; this.leadSubmitted = false; }
  closeLeadModal(): void { this.leadModalOpen = false; }

  submitLead(): void {
    if (!this.leadForm.nom || !this.leadForm.tel || !this.leadForm.consent) return;
    
    // Connect to real backend
    this.http.post('/api/v1/portal/leads', {
        annonceId: this.listing?.id || null,
        leadName: this.leadForm.nom,
        leadPhone: this.leadForm.tel,
        leadSource: 'PORTAIL',
        notes: `[Type: ${this.leadModalType}] Email: ${this.leadForm.email} - Message: ${this.leadForm.message}`,
        caseType: this.leadModalType === 'visite' ? 'VISITE' : 'INFO'
    }).subscribe({
        next: () => {
            this.leadSubmitted = true;
        },
        error: (err) => {
            console.error('Failed to submit lead', err);
            this.leadSubmitted = true; // Still show success for UX fallback or handle error
        }
    });
  }

  openReportModal(): void { this.reportModalOpen = true; this.reportSubmitted = false; }
  closeReportModal(): void { this.reportModalOpen = false; }

  submitReport(): void {
    if (!this.reportForm.motif) return;
    console.log('[Report]', this.reportForm, this.listing?.id);
    this.reportSubmitted = true;
  }

  openWhatsApp(): void {
    if (!this.listing) return;
    const msg = encodeURIComponent(`Bonjour, je suis intéressé(e) par l'annonce : ${this.listing.title}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  formatPrice(p: number, tx: 'vente' | 'location'): string { return this.portailService.formatPrice(p, tx); }
  navigateToDetail(l: Listing): void { this.router.navigate(['/annonces', l.id]); }
}
