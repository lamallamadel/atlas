import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { PortailService, City, Listing } from '../../../services/portail.service';

@Component({
  selector: 'app-portail-home',
  templateUrl: './portail-home.component.html',
  styleUrls: ['./portail-home.component.scss']
})
export class PortailHomeComponent implements OnInit, AfterViewInit {
  cities: City[] = [];
  recentListings: Listing[] = [];
  heroTab: 'vente' | 'location' = 'vente';
  heroVille = '';
  heroBudget = '';

  readonly villes = ['Casablanca', 'Rabat', 'Tanger', 'Marrakech', 'Fès', 'Agadir', 'Meknès', 'Oujda', 'Tétouan', 'Salé'];

  constructor(public portailService: PortailService, private router: Router) {}

  ngOnInit(): void {
    this.cities = this.portailService.CITIES;
    this.recentListings = this.portailService.LISTINGS.slice(0, 8);
  }

  ngAfterViewInit(): void {
    // Animate elements on scroll
    setTimeout(() => this.initReveals(), 100);
  }

  private initReveals(): void {
    const els = document.querySelectorAll('.at-reveal');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
  }

  setHeroTab(tab: 'vente' | 'location'): void { this.heroTab = tab; }

  submitSearch(): void {
    const q: any = { tx: this.heroTab };
    if (this.heroVille)  q['ville'] = this.heroVille;
    if (this.heroBudget) q['prixMax'] = this.heroBudget;
    this.router.navigate(['/recherche'], { queryParams: q });
  }

  navigateToSearch(ville?: string): void {
    const q: any = {};
    if (ville) q['ville'] = ville;
    this.router.navigate(['/recherche'], { queryParams: q });
  }

  navigateToDetail(listing: Listing): void {
    this.router.navigate(['/annonces', listing.id]);
  }

  getImageUrl(idx: number): string { return this.portailService.getImageUrl(idx); }
  formatPrice(p: number, tx: 'vente' | 'location'): string { return this.portailService.formatPrice(p, tx); }
}
