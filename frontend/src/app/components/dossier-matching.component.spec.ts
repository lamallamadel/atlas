import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import {
  DossierMatchingComponent,
  criteriaToForm,
  emptyForm,
  exclusionSummary,
  formToCriteria,
  scoreStatus,
  validateCriteria,
} from './dossier-matching.component';
import {
  DossierMatchesResponse,
  DossierMatchingApiService,
  DossierSearchCriteria,
} from '../services/dossier-matching-api.service';
import { DsToastService } from '../design-system';

const CRITERIA: DossierSearchCriteria = {
  transactionTypes: ['SALE'], categories: ['APARTMENT'], cities: ['Tanger', 'Tétouan'],
  budgetMin: 800000, budgetMax: 1200000, surfaceMin: 80, surfaceMax: null,
  furnished: true, equipments: ['piscine'], acceptedConditions: ['neuf'],
};

const RESULT: DossierMatchesResponse = {
  scope: 'ALL',
  totalCandidates: 12,
  excluded: { ville: 3, budget: 2, 'catégorie': 0 },
  criteriaUpdatedAt: null,
  matches: [{
    annonceId: 42, title: 'Appartement vue mer', city: 'Tanger', price: 1000000, currency: 'MAD',
    surface: 95, status: 'DRAFT', photoUrl: 'https://cdn.ma/a.jpg', score: 85,
    reasons: ['Dans le budget (1 000 000 MAD)'], alerts: ['Piscine : non trouvé'], photosAnalyzed: false,
  }],
};

describe('conversion des critères', () => {
  it('formulaire -> critères', () => {
    const f = emptyForm();
    f.cities = ' Tanger, , Tétouan ';
    f.budgetMax = '1 200 000';
    f.surfaceMin = '80,5';
    f.furnished = 'no';
    expect(formToCriteria(f)).toEqual({
      transactionTypes: [], categories: [], cities: ['Tanger', 'Tétouan'], budgetMin: null,
      budgetMax: 1200000, surfaceMin: 80.5, surfaceMax: null, furnished: false, equipments: [],
      acceptedConditions: [],
    });
  });

  it('aller-retour', () => {
    expect(formToCriteria(criteriaToForm(CRITERIA))).toEqual(CRITERIA);
    expect(criteriaToForm({ ...CRITERIA, furnished: null }).furnished).toBe('any');
  });

  it('validation', () => {
    expect(validateCriteria(formToCriteria(emptyForm()))).toBe('Renseignez au moins un critère.');
    expect(validateCriteria({ ...CRITERIA, budgetMin: 2000000 })).toContain('budget minimum');
    expect(validateCriteria({ ...CRITERIA, surfaceMax: 50 })).toContain('surface minimum');
    expect(validateCriteria({ ...CRITERIA, budgetMax: -1, budgetMin: null })).toContain('positifs');
    expect(validateCriteria(CRITERIA)).toBeNull();
  });

  it('score et exclusions', () => {
    expect(scoreStatus(85)).toBe('success');
    expect(scoreStatus(65)).toBe('info');
    expect(scoreStatus(40)).toBe('warning');
    expect(exclusionSummary({ ville: 3, budget: 0 })).toBe('Écartés : 3 (ville)');
    expect(exclusionSummary({})).toBeNull();
  });
});

describe('DossierMatchingComponent', () => {
  let fixture: ComponentFixture<DossierMatchingComponent>;
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let toast: Record<string, ReturnType<typeof vi.fn>>;

  async function create(criteria: DossierSearchCriteria | null) {
    api = {
      getCriteria: vi.fn().mockReturnValue(of(criteria)),
      saveCriteria: vi.fn().mockImplementation((_id, c) => of(c)),
      matches: vi.fn().mockReturnValue(of(RESULT)),
    };
    toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [DossierMatchingComponent],
      providers: [
        provideRouter([]),
        { provide: DossierMatchingApiService, useValue: api },
        { provide: DsToastService, useValue: toast },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DossierMatchingComponent);
    fixture.componentRef.setInput('dossierId', 5);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('sans critère : formulaire vide, pas de recherche', async () => {
    const el = await create(null);
    expect(api['matches']).not.toHaveBeenCalled();
    expect(el.querySelector('[data-testid="dm-matches"]')).toBeNull();
  });

  it('avec critères : recherche et affiche les biens avec raisons et alertes', async () => {
    const el = await create(CRITERIA);
    expect(api['matches']).toHaveBeenCalledWith(5, 'ALL');
    expect(fixture.componentInstance.form.cities).toBe('Tanger, Tétouan');
    const list = el.querySelector('[data-testid="dm-matches"]')?.textContent ?? '';
    expect(list).toContain('Appartement vue mer');
    expect(list).toContain('85/100');
    expect(list).toContain('Dans le budget');
    expect(list).toContain('Piscine : non trouvé');
    expect(list).toContain('hors marché');
    expect(list).toContain('Photos non analysées');
    expect(el.querySelector('[data-testid="dm-matches"] a')?.getAttribute('href')).toBe('/annonces/42');
    expect(el.querySelector('[data-testid="dm-summary"]')?.textContent).toContain('Écartés : 3 (ville), 2 (budget)');
  });

  it('refuse un formulaire vide sans appeler le serveur', async () => {
    await create(null);
    fixture.componentInstance.saveAndSearch();
    expect(fixture.componentInstance.formError()).toBe('Renseignez au moins un critère.');
    expect(api['saveCriteria']).not.toHaveBeenCalled();
  });

  it('enregistre puis recherche', async () => {
    await create(null);
    const c = fixture.componentInstance;
    c.toggle(c.form.categories, 'HOUSE');
    c.form.budgetMax = '900000';
    c.saveAndSearch();
    expect(api['saveCriteria']).toHaveBeenCalledWith(5, expect.objectContaining({ categories: ['HOUSE'], budgetMax: 900000 }));
    expect(api['matches']).toHaveBeenCalledWith(5, 'ALL');
    expect(c.hasCriteria()).toBe(true);
  });

  it('changer de périmètre relance la recherche', async () => {
    await create(CRITERIA);
    fixture.componentInstance.setScope('OFF_MARKET');
    expect(api['matches']).toHaveBeenLastCalledWith(5, 'OFF_MARKET');
  });

  it('service indisponible', async () => {
    await create(null);
    api['matches'].mockReturnValue(throwError(() => ({ status: 503 })));
    fixture.componentInstance.hasCriteria.set(true);
    fixture.componentInstance.search();
    fixture.detectChanges();
    expect(fixture.componentInstance.unavailable()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="dm-unavailable"]')).not.toBeNull();
  });
});
