import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AnnoncePublicationPanelComponent, qualityVariant, serverMessage } from './annonce-publication-panel.component';
import { AuthService } from '../services/auth.service';
import { AnnoncePublication, AnnonceStatus } from '../services/annonce-api.service';

function publication(overrides: Partial<AnnoncePublication> = {}): AnnoncePublication {
  return {
    annonceId: 7,
    status: AnnonceStatus.DRAFT,
    quality: { score: 80, photoCount: 1, minPhotos: 3, missing: [{ code: 'PHOTOS', label: 'Au moins 3 photos', blocking: true }] },
    trust: { blocking: false },
    transitions: [
      { code: 'ANN_T_PUBLISH', label: 'Publier', targetStatus: AnnonceStatus.PUBLISHED, requiresReason: false,
        allowed: false, blockers: [{ code: 'MISSING_PHOTOS', message: 'Manque : Au moins 3 photos' }] },
      { code: 'ANN_T_ARCHIVE', label: 'Archiver', targetStatus: AnnonceStatus.ARCHIVED, requiresReason: false,
        allowed: true, blockers: [] },
    ],
    suspension: null,
    openReports: 0,
    ...overrides,
  };
}

describe('AnnoncePublicationPanelComponent', () => {
  let httpMock: HttpTestingController;
  let roles: string[];

  function create() {
    const fixture = TestBed.createComponent(AnnoncePublicationPanelComponent);
    fixture.componentRef.setInput('annonceId', 7);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    roles = ['PRO'];
    TestBed.configureTestingModule({
      imports: [AnnoncePublicationPanelComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { hasRole: (r: string) => roles.includes(r) } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('shows the quality score and why publishing is blocked', () => {
    const fixture = create();
    httpMock.expectOne('/api/v1/annonces/7/publication').flush(publication());
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('80/100');
    expect(text).toContain('1 photo(s) sur 3');
    expect(text).toContain('Pour publier : Manque : Au moins 3 photos');
  });

  it('publishes through the transitions endpoint and reloads', () => {
    const fixture = create();
    const allowed = publication();
    allowed.transitions[0] = { ...allowed.transitions[0], allowed: true, blockers: [] };
    httpMock.expectOne('/api/v1/annonces/7/publication').flush(allowed);
    fixture.detectChanges();

    let changed = false;
    fixture.componentInstance.changed.subscribe(() => (changed = true));
    fixture.componentInstance.apply(allowed.transitions[0]);

    const req = httpMock.expectOne('/api/v1/annonces/7/transitions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ transitionCode: 'ANN_T_PUBLISH', reasonCode: null, comment: null });
    req.flush({ id: 7, status: 'PUBLISHED' });

    httpMock.expectOne('/api/v1/annonces/7/publication').flush(publication({ status: AnnonceStatus.PUBLISHED }));
    expect(changed).toBe(true);
  });

  it('asks for a reason before suspending', () => {
    const fixture = create();
    const published = publication({
      status: AnnonceStatus.PUBLISHED,
      transitions: [{ code: 'ANN_T_SUSPEND', label: 'Suspendre', targetStatus: AnnonceStatus.SUSPENDED,
        requiresReason: true, allowed: true, blockers: [] }],
    });
    httpMock.expectOne('/api/v1/annonces/7/publication').flush(published);
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    cmp.start(published.transitions[0]);
    expect(cmp.suspending()).toBe(true);
    httpMock.expectNone('/api/v1/annonces/7/transitions');

    cmp.suspendReason = 'OWNER_PAUSE';
    cmp.suspendComment = 'Sous compromis';
    cmp.apply(published.transitions[0]);
    const req = httpMock.expectOne('/api/v1/annonces/7/transitions');
    expect(req.request.body).toEqual({ transitionCode: 'ANN_T_SUSPEND', reasonCode: 'OWNER_PAUSE', comment: 'Sous compromis' });
    req.flush({ id: 7, status: 'SUSPENDED' });
    httpMock.expectOne('/api/v1/annonces/7/publication').flush(published);
  });

  it('offers the override only to managers', () => {
    const blocked = publication({ trust: { blocking: true, duplicateStatut: 'DOUBLON_CERTAIN', duplicateOfId: 3 } });

    let fixture = create();
    httpMock.expectOne('/api/v1/annonces/7/publication').flush(blocked);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Un manager doit valider la publication');
    expect(fixture.nativeElement.textContent).not.toContain('Autoriser la publication');
    fixture.destroy();

    roles = ['ADMIN'];
    fixture = create();
    httpMock.expectOne('/api/v1/annonces/7/publication').flush(blocked);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Autoriser la publication');
  });

  it('maps scores to colours and strips server codes', () => {
    expect(qualityVariant(90)).toBe('success');
    expect(qualityVariant(60)).toBe('warning');
    expect(qualityVariant(10)).toBe('error');
    expect(serverMessage({ error: { detail: 'PUBLICATION_BLOCKED: Manque : Ville' } }, 'x')).toBe('Manque : Ville');
    expect(serverMessage({}, 'Erreur')).toBe('Erreur');
  });
});
