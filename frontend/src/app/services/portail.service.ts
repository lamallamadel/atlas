import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Listing {
  id: string;
  slug: string;
  title: string;
  tx: 'vente' | 'location';
  price: number;
  city: string;
  zone: string;
  surface: number;
  pieces: number;
  desc: string;
  agent: { name: string; agency: string; initials: string };
  verified: boolean;
  date: string;
  imgs: number[];
}

export interface City {
  name: string;
  count: number;
  icon: string;
}

export interface FilterState {
  tx: string;
  ville: string;
  prixMin: number | null;
  prixMax: number | null;
  surfMin: number | null;
  surfMax: number | null;
  pieces: number;
  sort: 'recent' | 'prix-asc' | 'prix-desc' | 'surface-desc';
  page: number;
}

@Injectable({ providedIn: 'root' })
export class PortailService {

  readonly PAGE_SIZE = 9;

  readonly IMAGES = [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
    'https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=800&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&q=80',
  ];

  readonly CITIES: City[] = [
    { name: 'Casablanca', count: 342, icon: '🏙️' },
    { name: 'Rabat',      count: 187, icon: '🏛️' },
    { name: 'Tanger',     count: 156, icon: '🌊' },
    { name: 'Marrakech',  count: 203, icon: '🌴' },
    { name: 'Fès',        count: 98,  icon: '🕌' },
    { name: 'Agadir',     count: 112, icon: '☀️' },
    { name: 'Meknès',     count: 67,  icon: '🏰' },
    { name: 'Tétouan',    count: 54,  icon: '🏔️' },
  ];

  readonly LISTINGS: Listing[] = [
    { id: '1', slug: 'villa-moderne-ain-diab', title: 'Villa moderne avec piscine', tx: 'vente', price: 4200000, city: 'Casablanca', zone: 'Aïn Diab', surface: 320, pieces: 5, desc: 'Magnifique villa de standing avec piscine privée, jardin paysager et finitions haut de gamme. Située dans un quartier résidentiel calme à 5 minutes de la plage.', agent: { name: 'Karim A.', agency: 'Prestige Immo', initials: 'KA' }, verified: true, date: '2026-04-08', imgs: [0, 2, 6, 3] },
    { id: '2', slug: 'appartement-maarif', title: 'Appartement 3 pièces vue mer', tx: 'vente', price: 1150000, city: 'Casablanca', zone: 'Maârif', surface: 95, pieces: 3, desc: 'Bel appartement lumineux avec grande terrasse et vue dégagée. Cuisine équipée, parking inclus. Copropriété sécurisée avec gardien.', agent: { name: 'Sara F.', agency: 'ImmoPlus', initials: 'SF' }, verified: true, date: '2026-04-07', imgs: [1, 4, 5, 7] },
    { id: '3', slug: 'villa-palmeraie-marrakech', title: 'Villa en palmeraie — Marrakech', tx: 'vente', price: 6800000, city: 'Marrakech', zone: 'Palmeraie', surface: 480, pieces: 6, desc: "Villa d'exception nichée dans la Palmeraie de Marrakech. Riad intérieur, piscine à débordement, espace détente. Un vrai havre de paix à quelques minutes du centre.", agent: { name: 'Ahmed B.', agency: 'Maroc Luxury', initials: 'AB' }, verified: true, date: '2026-04-06', imgs: [3, 0, 6, 2] },
    { id: '4', slug: 'appartement-tanger-malabata', title: 'Appt 2 pièces face mer — Tanger', tx: 'location', price: 7500, city: 'Tanger', zone: 'Malabata', surface: 68, pieces: 2, desc: 'Appartement meublé avec vue imprenable sur le détroit de Gibraltar. Idéal pour un professionnel ou expatrié. Disponible immédiatement.', agent: { name: 'Mehdi O.', agency: 'ImmoTanger', initials: 'MO' }, verified: true, date: '2026-04-05', imgs: [4, 1, 7, 5] },
    { id: '5', slug: 'villa-hay-riad-rabat', title: 'Villa 4ch avec jardin — Rabat', tx: 'vente', price: 2900000, city: 'Rabat', zone: 'Hay Riad', surface: 240, pieces: 5, desc: 'Villa familiale dans un quartier résidentiel prisé. Grande cuisine américaine, 4 chambres dont une suite parentale, jardin arborisé, 2 parkings couverts.', agent: { name: 'Nadia E.', agency: 'Capital Immo', initials: 'NE' }, verified: false, date: '2026-04-04', imgs: [6, 2, 0, 4] },
    { id: '6', slug: 'studio-agadir-centre', title: 'Studio meublé — centre Agadir', tx: 'location', price: 4200, city: 'Agadir', zone: 'Centre Ville', surface: 38, pieces: 1, desc: 'Studio entièrement rénové et meublé. Proche commerces, plage à 10 min à pied. Convient pour un séjour longue durée ou résidence principale.', agent: { name: 'Youssef K.', agency: 'Immo Sud', initials: 'YK' }, verified: true, date: '2026-04-03', imgs: [5, 7, 3, 1] },
    { id: '7', slug: 'duplex-hay-hassani-casa', title: 'Duplex 4 pièces — Hay Hassani', tx: 'vente', price: 1780000, city: 'Casablanca', zone: 'Hay Hassani', surface: 142, pieces: 4, desc: "Duplex en très bon état avec terrasse de 40m². Chambre parentale en suite, 2 chambres enfants, salon double. À deux pas du tramway.", agent: { name: 'Leila M.', agency: 'Immobilière Atlas', initials: 'LM' }, verified: true, date: '2026-04-02', imgs: [7, 5, 4, 2] },
    { id: '8', slug: 'appartement-fes-ville-nouvelle', title: 'Appartement F3 — Fès Ville Nouvelle', tx: 'location', price: 6000, city: 'Fès', zone: 'Ville Nouvelle', surface: 85, pieces: 3, desc: 'Grand appartement dans un immeuble récent. Balcon, parking, gardien. Idéal pour famille ou colocation.', agent: { name: 'Omar S.', agency: 'Fès Immo', initials: 'OS' }, verified: false, date: '2026-04-01', imgs: [2, 6, 0, 3] },
    { id: '9', slug: 'villa-tetouan-mdiq', title: "Villa de vacances — M'Diq Tétouan", tx: 'location', price: 18000, city: 'Tétouan', zone: "M'Diq", surface: 190, pieces: 5, desc: "Belle villa de vacances en bord de mer. Piscine chauffée, jardin clos, 4 suites. Location saisonnière. Disponible juillet-août.", agent: { name: 'Hassan R.', agency: 'TangerMed Immo', initials: 'HR' }, verified: true, date: '2026-03-30', imgs: [0, 3, 5, 7] },
    { id: '10', slug: 'appartement-meknes-hamria', title: 'Appartement F4 — Hamria Meknès', tx: 'vente', price: 920000, city: 'Meknès', zone: 'Hamria', surface: 110, pieces: 4, desc: 'Appartement spacieux dans immeuble sécurisé. Cuisine équipée, 3 chambres, salon-salle à manger séparés. Proche mosquée et commerces.', agent: { name: 'Amina T.', agency: 'Meknès Immo', initials: 'AT' }, verified: true, date: '2026-03-28', imgs: [4, 6, 1, 2] },
    { id: '11', slug: 'villa-casablanca-anfa', title: 'Villa standing — Anfa Casablanca', tx: 'vente', price: 8500000, city: 'Casablanca', zone: 'Anfa', surface: 520, pieces: 7, desc: "Propriété d'exception dans le quartier le plus prisé de Casablanca. Architecture contemporaine, domotique, cave à vins, hammam privé.", agent: { name: 'Karim A.', agency: 'Prestige Immo', initials: 'KA' }, verified: true, date: '2026-03-27', imgs: [6, 0, 3, 5] },
    { id: '12', slug: 'appartement-rabat-agdal', title: 'Appartement 2ch — Agdal Rabat', tx: 'location', price: 8500, city: 'Rabat', zone: 'Agdal', surface: 75, pieces: 2, desc: 'Appartement refait à neuf, meubles neufs. Proche ambassades et administrations. Connexion fibre, parking sécurisé.', agent: { name: 'Nadia E.', agency: 'Capital Immo', initials: 'NE' }, verified: true, date: '2026-03-25', imgs: [1, 7, 4, 6] },
  ];

  private filterState$ = new BehaviorSubject<FilterState>({
    tx: '', ville: '', prixMin: null, prixMax: null,
    surfMin: null, surfMax: null, pieces: 0, sort: 'recent', page: 1
  });

  getFilters() { return this.filterState$.asObservable(); }
  getFiltersSnapshot() { return this.filterState$.value; }

  updateFilters(partial: Partial<FilterState>): void {
    this.filterState$.next({ ...this.filterState$.value, ...partial, page: 1 });
  }

  setPage(page: number): void {
    this.filterState$.next({ ...this.filterState$.value, page });
  }

  getListingById(id: string): Listing | undefined {
    return this.LISTINGS.find(l => l.id === id);
  }

  getListingBySlug(slug: string): Listing | undefined {
    return this.LISTINGS.find(l => l.slug === slug);
  }

  getSimilarListings(listing: Listing, count = 4): Listing[] {
    return this.LISTINGS
      .filter(l => l.id !== listing.id && l.city === listing.city)
      .slice(0, count);
  }

  applyFilters(state: FilterState): Listing[] {
    let results = [...this.LISTINGS];

    if (state.tx)      results = results.filter(l => l.tx === state.tx);
    if (state.ville)   results = results.filter(l => l.city === state.ville);
    if (state.prixMin) results = results.filter(l => l.price >= state.prixMin!);
    if (state.prixMax) results = results.filter(l => l.price <= state.prixMax!);
    if (state.surfMin) results = results.filter(l => l.surface >= state.surfMin!);
    if (state.surfMax) results = results.filter(l => l.surface <= state.surfMax!);
    if (state.pieces)  results = results.filter(l =>
      state.pieces >= 4 ? l.pieces >= 4 : l.pieces === state.pieces
    );

    switch (state.sort) {
      case 'prix-asc':      results.sort((a, b) => a.price - b.price); break;
      case 'prix-desc':     results.sort((a, b) => b.price - a.price); break;
      case 'surface-desc':  results.sort((a, b) => b.surface - a.surface); break;
      default:              results.sort((a, b) => b.date.localeCompare(a.date));
    }

    return results;
  }

  paginate(listings: Listing[], page: number): Listing[] {
    const start = (page - 1) * this.PAGE_SIZE;
    return listings.slice(start, start + this.PAGE_SIZE);
  }

  formatPrice(price: number, tx: 'vente' | 'location'): string {
    if (tx === 'location') return price.toLocaleString('fr-MA') + ' MAD/mois';
    if (price >= 1000000)  return (price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 2) + ' M MAD';
    return price.toLocaleString('fr-MA') + ' MAD';
  }

  getImageUrl(index: number): string {
    return this.IMAGES[index % this.IMAGES.length];
  }
}
