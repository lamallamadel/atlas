import { DsBadgeComponent } from '../../../design-system';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PortailService, Listing, REPORT_REASONS } from '../../../services/portail.service';
import { VitrineService, PUBLIC_CONTACT_CONSENT_TEXT, publicLeadErrorMessage } from '../../../services/vitrine.service';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'app-annonce-detail',
    templateUrl: './annonce-detail.component.html',
    styleUrls: ['./annonce-detail.component.scss'],
    imports: [RouterLink, FormsModule, DecimalPipe, DsBadgeComponent]
})
export class AnnonceDetailComponent implements OnInit {

  listing: Listing | null = null;
  similarListings: Listing[] = [];
  galleryIndex = 0;
  leadModalOpen = false;
  leadModalType: 'visite' | 'message' = 'visite';
  reportModalOpen = false;
  leadSubmitted = false;
  leadSending = false;
  leadError = '';
  readonly consentText = PUBLIC_CONTACT_CONSENT_TEXT;
  reportSubmitted = false;
  leadForm = { nom: '', tel: '', email: '', message: '', consent: false };
  reportForm = { motif: '', commentaire: '', email: '' };
  reportSending = false;
  reportError = '';
  readonly reportReasons = REPORT_REASONS;

  constructor(
    public portailService: PortailService,
    private route: ActivatedRoute,
    private router: Router,
    private vitrineService: VitrineService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.portailService.getListingById(params['id']).subscribe({
        next: (res) => {
          // Annonce d'un particulier passée en exclusivité à une agence : le serveur redirige
          // vers l'annonce de l'agence ; l'adresse de la page suit.
          if (res.id !== String(params['id'])) {
            this.router.navigate(['/annonces', res.id], { replaceUrl: true });
          }
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

  openLeadModal(type: 'visite' | 'message'): void { this.leadModalType = type; this.leadModalOpen = true; this.leadSubmitted = false; this.leadError = ''; }
  closeLeadModal(): void { this.leadModalOpen = false; }

  submitLead(): void {
    if (!this.leadForm.nom || (!this.leadForm.tel && !this.leadForm.email) || !this.leadForm.consent || this.leadSending) return;
    this.leadSending = true;
    this.leadError = '';
    // Le serveur enregistre la demande dans l'agence de l'annonce (jamais celle du navigateur).
    this.vitrineService.submitPublicLead({
      annonceId: this.listing?.id ? Number(this.listing.id) : null,
      requestType: this.leadModalType === 'visite' ? 'VISIT' : 'INFO',
      name: this.leadForm.nom,
      phone: this.leadForm.tel || null,
      email: this.leadForm.email || null,
      message: this.leadForm.message || null,
      consent: this.leadForm.consent
    }).subscribe({
      next: () => {
        this.leadSending = false;
        this.leadSubmitted = true;
      },
      error: (err) => {
        this.leadSending = false;
        this.leadError = publicLeadErrorMessage(err);
      }
    });
  }

  openReportModal(): void {
    this.reportModalOpen = true;
    this.reportSubmitted = false;
    this.reportError = '';
    this.reportForm = { motif: '', commentaire: '', email: '' };
  }
  closeReportModal(): void { this.reportModalOpen = false; }

  submitReport(): void {
    if (!this.reportForm.motif || !this.listing || this.reportSending) return;
    this.reportSending = true;
    this.reportError = '';
    this.portailService.reportListing(this.listing.id, {
      reasonCode: this.reportForm.motif,
      comment: this.reportForm.commentaire || null,
      email: this.reportForm.email || null,
    }).subscribe({
      next: () => { this.reportSending = false; this.reportSubmitted = true; },
      error: (err) => { this.reportSending = false; this.reportError = publicLeadErrorMessage(err); },
    });
  }

  openWhatsApp(): void {
    if (!this.listing) return;
    const msg = encodeURIComponent(`Bonjour, je suis intéressé(e) par l'annonce : ${this.listing.title}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  formatPrice(p: number, tx: 'vente' | 'location'): string { return this.portailService.formatPrice(p, tx); }
  navigateToDetail(l: Listing): void { this.router.navigate(['/annonces', l.id]); }
}
