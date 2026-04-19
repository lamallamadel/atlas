import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map } from 'rxjs';

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
  imgs: string[];
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

  private filterState$ = new BehaviorSubject<FilterState>({
    tx: '', ville: '', prixMin: null, prixMax: null,
    surfMin: null, surfMax: null, pieces: 0, sort: 'recent', page: 1
  });

  constructor(private http: HttpClient) {}

  getFilters() { return this.filterState$.asObservable(); }
  getFiltersSnapshot() { return this.filterState$.value; }

  updateFilters(partial: Partial<FilterState>): void {
    this.filterState$.next({ ...this.filterState$.value, ...partial, page: 1 });
  }

  setPage(page: number): void {
    this.filterState$.next({ ...this.filterState$.value, page });
  }

  // Maps Backend AnnonceResponse to Frontend Listing interface
  private mapToListing(annonce: any): Listing {
    return {
      id: annonce.id.toString(),
      slug: annonce.meta?.slug || `annonce-${annonce.id}`,
      title: annonce.title,
      tx: annonce.type === 'SALE' ? 'vente' : 'location',
      price: annonce.price || 0,
      city: annonce.city || '',
      zone: annonce.address || '',
      surface: annonce.surface || 0,
      pieces: annonce.meta?.pieces || 0,
      desc: annonce.description || '',
      agent: annonce.meta?.agent || { name: 'Agent', agency: 'Agence', initials: 'AG' },
      verified: annonce.meta?.verified || false,
      date: annonce.createdAt || new Date().toISOString(),
      imgs: annonce.photos && annonce.photos.length > 0 
        ? annonce.photos 
        : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80']
    };
  }

  searchAnnonces(state: FilterState): Observable<{ content: Listing[], totalElements: number }> {
    let params = new HttpParams()
      .set('page', (state.page - 1).toString())
      .set('size', this.PAGE_SIZE.toString());

    if (state.tx) {
      params = params.set('type', state.tx === 'vente' ? 'SALE' : 'RENT');
    }
    if (state.ville) {
      params = params.set('city', state.ville);
    }
    
    // Sort mapping
    let sortStr = 'id,desc';
    if (state.sort === 'prix-asc') sortStr = 'price,asc';
    if (state.sort === 'prix-desc') sortStr = 'price,desc';
    if (state.sort === 'surface-desc') sortStr = 'surface,desc';
    params = params.set('sort', sortStr);

    return this.http.get<any>('/api/v1/portal/annonces', { params }).pipe(
      map((res: any) => {
        const content = res.content ? res.content.map((item: any) => this.mapToListing(item)) : [];
        // Optional client-side filtering if API misses some filters (like pieces or surface)
        // Since the current controller search endpoint in MVP is limited, we might filter further here
        let filtered = content;
        if (state.prixMin) filtered = filtered.filter((l: Listing) => l.price >= state.prixMin!);
        if (state.prixMax) filtered = filtered.filter((l: Listing) => l.price <= state.prixMax!);
        if (state.surfMin) filtered = filtered.filter((l: Listing) => l.surface >= state.surfMin!);
        if (state.surfMax) filtered = filtered.filter((l: Listing) => l.surface <= state.surfMax!);
        if (state.pieces)  filtered = filtered.filter((l: Listing) => state.pieces >= 4 ? l.pieces >= 4 : l.pieces === state.pieces);

        return { content: filtered, totalElements: res.totalElements || filtered.length };
      })
    );
  }

  getListingById(id: string): Observable<Listing> {
    // Technically should call /api/v1/annonces/{id} but since Portal is public, 
    // it's easier to just search and find it. Or add a getById endpoint to PortalPublicController.
    // For now, doing a basic authenticated fetch bypass or we just add it later.
    return this.http.get<any>(`/api/v1/annonces/${id}`).pipe(
      map(res => this.mapToListing(res))
    );
  }

  formatPrice(price: number, tx: 'vente' | 'location'): string {
    if (tx === 'location') return price.toLocaleString('fr-MA') + ' MAD/mois';
    if (price >= 1000000)  return (price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 2) + ' M MAD';
    return price.toLocaleString('fr-MA') + ' MAD';
  }
}
