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
  /** Nombre de pièces connu ; null si l'annonce ne le dit pas (jamais « 0 pièces »). */
  pieces: number | null;
  /** Type de bien (appartement, villa, riad…). */
  category: string;
  desc: string;
  agent: { name: string; agency: string; initials: string };
  verified: boolean;
  /** Cas d'usage n°1 : annonce publiée par le propriétaire lui-même. */
  privateSeller: boolean;
  /** Lot B : annonceurs d'un même bien (mandats simples) ; vide s'il n'y en a qu'un. */
  publishers: ListingPublisher[];
  /** Lot C : titre foncier contrôlé par Atlas (fiche détaillée uniquement). */
  propertyVerified: boolean;
  date: string;
  imgs: string[];
}

export interface ListingPublisher {
  annonceId: string;
  kind: 'OWNER' | 'AGENCY';
  name: string;
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
  /** Type de bien (catégorie de l'annonce), vide = tous. */
  categorie?: string;
  /** Quartier, dans la ville choisie ; vide = tous. */
  quartier?: string;
}

/** Valeurs des filtres présentes parmi les annonces publiées (`GET /api/v1/portal/facets`). */
export interface PortalFacets {
  cities: string[];
  categories: string[];
  districts: string[];
}

/** Motifs de signalement (codes REPORT_* du serveur). */
export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'REPORT_FRAUD', label: 'Arnaque ou annonce suspecte' },
  { value: 'REPORT_INCORRECT_INFO', label: 'Informations fausses (prix, surface, photos…)' },
  { value: 'REPORT_DUPLICATE', label: 'Annonce en double' },
  { value: 'REPORT_SPAM', label: 'Contenu inapproprié ou publicité' },
  { value: 'REPORT_OTHER', label: 'Autre' },
];

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
      category: annonce.category || '',
      desc: annonce.description || '',
      agent: annonce.publisherKind === 'OWNER'
        ? { name: 'Particulier', agency: 'Annonce publiée par le propriétaire', initials: 'P' }
        : annonce.meta?.agent || {
            name: annonce.agencyName || 'Agence',
            agency: annonce.agencyName || 'Agence',
            initials: PortailService.initials(annonce.agencyName) || 'AG',
          },
      verified: annonce.meta?.verified || false,
      privateSeller: annonce.publisherKind === 'OWNER',
      publishers: (annonce.publishers ?? []).map((p: { annonceId: number; kind: 'OWNER' | 'AGENCY'; name: string }) => ({
        annonceId: String(p.annonceId), kind: p.kind, name: p.name,
      })),
      propertyVerified: annonce.propertyVerified === true,
      pieces: annonce.rooms ?? (Number(annonce.meta?.pieces || annonce.meta?.rooms) || null),
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
    if (state.categorie) params = params.set('category', state.categorie);
    if (state.ville && state.quartier) params = params.set('district', state.quartier);
    // Tous les critères partent au serveur, qui filtre avant de paginer : le total et les pages
    // correspondent toujours à la recherche.
    if (state.prixMin != null) params = params.set('priceMin', String(state.prixMin));
    if (state.prixMax != null) params = params.set('priceMax', String(state.prixMax));
    if (state.surfMin != null) params = params.set('surfaceMin', String(state.surfMin));
    if (state.surfMax != null) params = params.set('surfaceMax', String(state.surfMax));
    if (state.pieces) params = params.set('rooms', String(state.pieces));
    params = params.set('sort', PortailService.SORTS[state.sort] ?? 'id,desc');

    return this.http.get<any>('/api/v1/portal/annonces', { params }).pipe(
      map((res: any) => ({
        content: (res.content ?? []).map((item: any) => this.mapToListing(item)),
        totalElements: res.totalElements ?? 0,
      }))
    );
  }

  /** Tri demandé → paramètre `sort` de l'API. */
  static readonly SORTS: Record<FilterState['sort'], string> = {
    'recent': 'id,desc',
    'prix-asc': 'price,asc',
    'prix-desc': 'price,desc',
    'surface-desc': 'surface,desc',
  };

  /** Villes, types de bien et quartiers (de la ville donnée) réellement publiés. */
  getFacets(city?: string): Observable<PortalFacets> {
    let params = new HttpParams();
    if (city) params = params.set('city', city);
    return this.http.get<PortalFacets>('/api/v1/portal/facets', { params });
  }

  static initials(name?: string | null): string {
    return (name ?? '')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  /** Signalement anonyme, transmis à l'agence qui publie l'annonce. */
  reportListing(id: string, body: { reasonCode: string; comment?: string | null; email?: string | null }): Observable<unknown> {
    return this.http.post(`/api/v1/portal/annonces/${id}/reports`, body);
  }

  getListingById(id: string): Observable<Listing> {
    // Endpoint public : annonce publiée de n'importe quelle agence, 404 sinon.
    return this.http.get<any>(`/api/v1/portal/annonces/${id}`).pipe(
      map(res => this.mapToListing(res))
    );
  }

  formatPrice(price: number, tx: 'vente' | 'location'): string {
    if (tx === 'location') return price.toLocaleString('fr-MA') + ' MAD/mois';
    if (price >= 1000000)  return (price / 1000000).toFixed(price % 1000000 === 0 ? 0 : 2) + ' M MAD';
    return price.toLocaleString('fr-MA') + ' MAD';
  }
}
