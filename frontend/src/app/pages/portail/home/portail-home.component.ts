import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PortailService, City, Listing } from '../../../services/portail.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsSelectComponent, 
  DsSelectOption
} from '../../../design-system';

@Component({
    selector: 'app-portail-home',
    standalone: true,
    templateUrl: './portail-home.component.html',
    styleUrls: ['./portail-home.component.scss'],
    imports: [
      CommonModule,
      FormsModule, 
      RouterLink,
      DsButtonComponent,
      DsIconComponent,
      DsSelectComponent
    ]
})
export class PortailHomeComponent implements OnInit, AfterViewInit {
  cities: City[] = [];
  recentListings: Listing[] = [];
  heroTab: 'vente' | 'location' = 'vente';
  heroVille = '';
  heroBudget = '';

  readonly villeOptions: DsSelectOption[] = [
    { value: '', label: 'Toutes les villes' },
    { value: 'Casablanca', label: 'Casablanca' },
    { value: 'Rabat', label: 'Rabat' },
    { value: 'Tanger', label: 'Tanger' },
    { value: 'Marrakech', label: 'Marrakech' },
    { value: 'Fès', label: 'Fès' },
    { value: 'Agadir', label: 'Agadir' }
  ];

  constructor(public portailService: PortailService, private router: Router) {}

  ngOnInit(): void {
    this.cities = this.portailService.CITIES;
    this.portailService.searchAnnonces({
      tx: '', ville: '', prixMin: null, prixMax: null,
      surfMin: null, surfMax: null, pieces: 0, sort: 'recent', page: 1
    }).subscribe(res => {
      this.recentListings = res.content.slice(0, 8);
    });
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

  formatPrice(p: number, tx: 'vente' | 'location'): string { return this.portailService.formatPrice(p, tx); }
}
