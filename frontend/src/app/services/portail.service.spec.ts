import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FilterState, PortailService } from './portail.service';

describe('PortailService', () => {
  let service: PortailService;
  let http: HttpTestingController;

  const base: FilterState = {
    tx: '', ville: '', prixMin: null, prixMax: null, surfMin: null, surfMax: null,
    pieces: 0, sort: 'recent', page: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PortailService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends every criterion to the server and keeps its total (no filtering after pagination)', () => {
    let result: { content: unknown[]; totalElements: number } | undefined;
    service.searchAnnonces({
      ...base, tx: 'vente', ville: 'Tanger', quartier: 'Malabata', categorie: 'Appartement',
      prixMin: 500000, prixMax: 2000000, surfMin: 40, surfMax: 120, pieces: 3, sort: 'prix-asc', page: 2,
    }).subscribe(r => (result = r));

    const req = http.expectOne(r => r.url === '/api/v1/portal/annonces');
    const p = req.request.params;
    expect(p.get('page')).toBe('1');
    expect(p.get('type')).toBe('SALE');
    expect(p.get('city')).toBe('Tanger');
    expect(p.get('district')).toBe('Malabata');
    expect(p.get('category')).toBe('Appartement');
    expect(p.get('priceMin')).toBe('500000');
    expect(p.get('priceMax')).toBe('2000000');
    expect(p.get('surfaceMin')).toBe('40');
    expect(p.get('surfaceMax')).toBe('120');
    expect(p.get('rooms')).toBe('3');
    expect(p.get('sort')).toBe('price,asc');

    req.flush({ content: [{ id: 1, title: 'Cher', type: 'SALE', price: 9000000, publisherKind: 'AGENCY' }], totalElements: 12 });
    expect(result?.content.length).toBe(1);
    expect(result?.totalElements).toBe(12);
  });

  it('ignores a district without a city', () => {
    service.searchAnnonces({ ...base, quartier: 'Malabata' }).subscribe();
    const req = http.expectOne(r => r.url === '/api/v1/portal/annonces');
    expect(req.request.params.has('district')).toBe(false);
    req.flush({ content: [], totalElements: 0 });
  });

  it('names the agency and leaves unknown rooms empty', () => {
    let listings: { agent: { agency: string; initials: string }; pieces: number | null }[] = [];
    service.searchAnnonces(base).subscribe(r => (listings = r.content));
    http.expectOne(r => r.url === '/api/v1/portal/annonces').flush({
      content: [
        { id: 1, title: 'A', type: 'SALE', price: 1, publisherKind: 'AGENCY', agencyName: 'Agence du Détroit', rooms: 3 },
        { id: 2, title: 'B', type: 'RENT', price: 1, publisherKind: 'AGENCY', agencyName: null, rooms: null, meta: {} },
      ],
      totalElements: 2,
    });
    expect(listings[0].agent.agency).toBe('Agence du Détroit');
    expect(listings[0].agent.initials).toBe('AD');
    expect(listings[0].pieces).toBe(3);
    expect(listings[1].pieces).toBeNull();
  });
});
