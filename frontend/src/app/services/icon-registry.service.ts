import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';

export interface IconMetadata {
  id: string;
  name: string;
  category: 'house-types' | 'rooms' | 'amenities' | 'documents' | 'actions' | 'measurements';
  tags: string[];
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class IconRegistryService {
  private iconCache = new Map<string, SafeHtml>();
  private svgSprite$?: Observable<string>;
  private metadata: IconMetadata[] = [
    { id: 're-house', name: 'Maison', category: 'house-types', tags: ['maison', 'house', 'home', 'propriété'], description: 'Maison individuelle' },
    { id: 're-apartment', name: 'Appartement', category: 'house-types', tags: ['appartement', 'apartment', 'immeuble'], description: 'Appartement en immeuble' },
    { id: 're-villa', name: 'Villa', category: 'house-types', tags: ['villa', 'luxe', 'luxury'], description: 'Villa de standing' },
    { id: 're-office', name: 'Bureau', category: 'house-types', tags: ['bureau', 'office', 'commercial'], description: 'Espace de bureau' },
    { id: 're-warehouse', name: 'Entrepôt', category: 'house-types', tags: ['entrepôt', 'warehouse', 'stockage'], description: 'Entrepôt industriel' },
    { id: 're-land', name: 'Terrain', category: 'house-types', tags: ['terrain', 'land', 'parcelle'], description: 'Terrain à bâtir' },
    
    { id: 're-bedroom', name: 'Chambre', category: 'rooms', tags: ['chambre', 'bedroom', 'pièce'], description: 'Chambre à coucher' },
    { id: 're-bathroom', name: 'Salle de bain', category: 'rooms', tags: ['salle de bain', 'bathroom', 'toilettes'], description: 'Salle de bain' },
    { id: 're-kitchen', name: 'Cuisine', category: 'rooms', tags: ['cuisine', 'kitchen'], description: 'Cuisine équipée' },
    { id: 're-living-room', name: 'Salon', category: 'rooms', tags: ['salon', 'living room', 'séjour'], description: 'Salon / Séjour' },
    { id: 're-garage', name: 'Garage', category: 'rooms', tags: ['garage', 'parking couvert'], description: 'Garage fermé' },
    { id: 're-balcony', name: 'Balcon', category: 'rooms', tags: ['balcon', 'balcony', 'terrasse'], description: 'Balcon ou terrasse' },
    
    { id: 're-pool', name: 'Piscine', category: 'amenities', tags: ['piscine', 'pool', 'swimming'], description: 'Piscine' },
    { id: 're-garden', name: 'Jardin', category: 'amenities', tags: ['jardin', 'garden', 'extérieur'], description: 'Jardin' },
    { id: 're-parking', name: 'Parking', category: 'amenities', tags: ['parking', 'stationnement'], description: 'Place de parking' },
    { id: 're-elevator', name: 'Ascenseur', category: 'amenities', tags: ['ascenseur', 'elevator', 'lift'], description: 'Ascenseur' },
    { id: 're-security', name: 'Sécurité', category: 'amenities', tags: ['sécurité', 'security', 'alarme'], description: 'Système de sécurité' },
    { id: 're-heating', name: 'Chauffage', category: 'amenities', tags: ['chauffage', 'heating'], description: 'Chauffage' },
    { id: 're-ac', name: 'Climatisation', category: 'amenities', tags: ['climatisation', 'ac', 'air conditioning'], description: 'Climatisation' },
    
    { id: 're-contract', name: 'Contrat', category: 'documents', tags: ['contrat', 'contract', 'document'], description: 'Contrat de vente/location' },
    { id: 're-deed', name: 'Acte', category: 'documents', tags: ['acte', 'deed', 'notaire'], description: 'Acte de propriété' },
    { id: 're-inspection', name: 'Inspection', category: 'documents', tags: ['inspection', 'diagnostic', 'expertise'], description: 'Rapport d\'inspection' },
    { id: 're-blueprint', name: 'Plan', category: 'documents', tags: ['plan', 'blueprint', 'architecture'], description: 'Plan architectural' },
    { id: 're-certificate', name: 'Certificat', category: 'documents', tags: ['certificat', 'certificate', 'attestation'], description: 'Certificat/Attestation' },
    
    { id: 're-visit', name: 'Visite', category: 'actions', tags: ['visite', 'visit', 'rendez-vous'], description: 'Visite de bien' },
    { id: 're-keys', name: 'Clés', category: 'actions', tags: ['clés', 'keys', 'remise'], description: 'Remise de clés' },
    { id: 're-sold', name: 'Vendu', category: 'actions', tags: ['vendu', 'sold', 'vente'], description: 'Bien vendu' },
    { id: 're-rent', name: 'Loué', category: 'actions', tags: ['loué', 'rent', 'location'], description: 'Bien loué' },
    { id: 're-price', name: 'Prix', category: 'actions', tags: ['prix', 'price', 'montant'], description: 'Prix/Montant' },
    { id: 're-offer', name: 'Offre', category: 'actions', tags: ['offre', 'offer', 'proposition'], description: 'Offre d\'achat' },
    
    { id: 're-area', name: 'Surface', category: 'measurements', tags: ['surface', 'area', 'm²'], description: 'Surface habitable' },
    { id: 're-floor-plan', name: 'Plan d\'étage', category: 'measurements', tags: ['plan', 'floor plan', 'étage'], description: 'Plan d\'étage' },
    { id: 're-location', name: 'Localisation', category: 'measurements', tags: ['localisation', 'location', 'adresse'], description: 'Localisation géographique' },
    { id: 're-compass', name: 'Orientation', category: 'measurements', tags: ['orientation', 'compass', 'exposition'], description: 'Orientation du bien' },
    { id: 're-energy', name: 'Énergie', category: 'measurements', tags: ['énergie', 'energy', 'dpe'], description: 'Performance énergétique' },
    { id: 're-calendar-visit', name: 'Calendrier visite', category: 'actions', tags: ['calendrier', 'calendar', 'rendez-vous'], description: 'Planifier une visite' },
    { id: 're-photo', name: 'Photo', category: 'measurements', tags: ['photo', 'image', 'galerie'], description: 'Photographie' },
    { id: 're-virtual-tour', name: 'Visite virtuelle', category: 'measurements', tags: ['visite virtuelle', 'virtual tour', '360'], description: 'Visite virtuelle 360°' },
  ];

  constructor(
    private sanitizer: DomSanitizer,
    private http: HttpClient
  ) {}

  loadIcons(): Observable<void> {
    if (!this.svgSprite$) {
      this.svgSprite$ = this.http.get('/assets/icons/real-estate-icons.svg', { responseType: 'text' }).pipe(
        tap(svgContent => {
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
          const symbols = svgDoc.querySelectorAll('symbol');
          
          symbols.forEach(symbol => {
            const id = symbol.getAttribute('id');
            if (id) {
              const viewBox = symbol.getAttribute('viewBox') || '0 0 24 24';
              const content = symbol.innerHTML;
              const svgElement = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="24" height="24">${content}</svg>`;
              this.iconCache.set(id, this.sanitizer.bypassSecurityTrustHtml(svgElement));
            }
          });
        }),
        map(() => void 0),
        shareReplay(1),
        catchError(error => {
          console.error('Failed to load icon sprite:', error);
          return throwError(() => error);
        })
      );
    }
    
    return this.svgSprite$;
  }

  getIcon(iconId: string): Observable<SafeHtml | null> {
    if (this.iconCache.has(iconId)) {
      return of(this.iconCache.get(iconId)!);
    }
    
    return this.loadIcons().pipe(
      map(() => this.iconCache.get(iconId) || null)
    );
  }

  getIconSync(iconId: string): SafeHtml | null {
    return this.iconCache.get(iconId) || null;
  }

  isLoaded(): boolean {
    return this.iconCache.size > 0;
  }

  getMetadata(iconId?: string): IconMetadata[] {
    if (iconId) {
      return this.metadata.filter(m => m.id === iconId);
    }
    return this.metadata;
  }

  searchIcons(query: string): IconMetadata[] {
    const lowerQuery = query.toLowerCase();
    return this.metadata.filter(meta => 
      meta.name.toLowerCase().includes(lowerQuery) ||
      meta.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      meta.description.toLowerCase().includes(lowerQuery)
    );
  }

  getIconsByCategory(category: IconMetadata['category']): IconMetadata[] {
    return this.metadata.filter(meta => meta.category === category);
  }

  getAllCategories(): Array<{ key: IconMetadata['category']; label: string }> {
    return [
      { key: 'house-types', label: 'Types de biens' },
      { key: 'rooms', label: 'Pièces' },
      { key: 'amenities', label: 'Équipements' },
      { key: 'documents', label: 'Documents' },
      { key: 'actions', label: 'Actions' },
      { key: 'measurements', label: 'Mesures & Infos' }
    ];
  }
}
