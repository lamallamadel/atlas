import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PortailService, Listing } from '../../../services/portail.service';

@Component({
  selector: 'app-annonce-detail',
  templateUrl: './annonce-detail.component.html',
  styleUrls: ['./annonce-detail.component.scss']
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.listing = this.portailService.getListingById(params['id']) || null;
      if (!this.listing) { this.router.navigate(['/']); return; }
      this.similarListings = this.portailService.getSimilarListings(this.listing);
      this.galleryIndex = 0;
    });
  }

  get currentImage(): string {
    if (!this.listing) return '';
    return this.portailService.getImageUrl(this.listing.imgs[this.galleryIndex]);
  }

  get images(): string[] {
    if (!this.listing) return [];
    return this.listing.imgs.map(i => this.portailService.getImageUrl(i));
  }

  galleryPrev(): void { if (this.listing) this.galleryIndex = (this.galleryIndex - 1 + this.listing.imgs.length) % this.listing.imgs.length; }
  galleryNext(): void { if (this.listing) this.galleryIndex = (this.galleryIndex + 1) % this.listing.imgs.length; }
  setGalleryIndex(i: number): void { this.galleryIndex = i; }

  openLeadModal(type: 'visite' | 'message'): void { this.leadModalType = type; this.leadModalOpen = true; this.leadSubmitted = false; }
  closeLeadModal(): void { this.leadModalOpen = false; }

  submitLead(): void {
    if (!this.leadForm.nom || !this.leadForm.tel || !this.leadForm.consent) return;
    console.log('[Lead]', this.leadForm, this.listing?.id);
    this.leadSubmitted = true;
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
    const agent = this.listing.agent;
    const msg = encodeURIComponent(`Bonjour, je suis intéressé(e) par l'annonce : ${this.listing.title}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  formatPrice(p: number, tx: 'vente' | 'location'): string { return this.portailService.formatPrice(p, tx); }
  getImageUrl(idx: number): string { return this.portailService.getImageUrl(idx); }
  navigateToDetail(l: Listing): void { this.router.navigate(['/annonces', l.id]); }
}
