import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { MarketplaceRequestComponent } from './marketplace-request.component';
import { OwnerRequestComponent } from '../owner/owner-request.component';
import { OwnerAcceptDialogComponent } from '../owner/owner-accept-dialog.component';
import { OwnerLinkComponent } from '../owner/owner-link.component';
import { OwnerMandateComponent } from '../owner/owner-mandate.component';
import { MarketplaceMandateDialogComponent } from './marketplace-mandate-dialog.component';
import { DsDialogService } from '../../design-system';
import { OwnerOfferDialogComponent } from '../owner/owner-offer-dialog.component';
import { AgencyMarketplaceProfileComponent } from './agency-marketplace-profile.component';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';
import type { AgencyRequest } from '../../services/marketplace-api.service';
import type { MandateFollowUp, MandateOffer, MandateView, OwnerProposal, OwnerRequest, RecommendedAgency } from '../../services/mandate-api.service';
import { commissionLabel, ratingLabel } from '../../services/mandate-api.service';

const MANDATE: MandateView = {
  id: 9, propertyId: 1, agencyOrgId: 'ORG-A', agencyName: 'Agence du Détroit', mandateType: 'EXCLUSIVE', durationMonths: 3,
  commissionKind: 'PERCENT', commissionValue: 2.5, commissionPayer: 'SELLER', status: 'MANDATE_ACTIVE',
  startsAt: '2026-11-20T10:00:00', endsAt: '2027-02-20T10:00:00', signedAt: '2026-11-22T10:00:00', dossierId: 40, annonceId: 55,
  owner: null, endReason: null, endedBy: null, endedAt: null,
};

const FOLLOW_UP: MandateFollowUp = {
  mandate: MANDATE, requestId: 7, proposalId: 31, propertyTitle: 'Appartement Malabata',
  listings: [{ annonceId: 55, title: 'Appartement Malabata vue mer', status: 'PUBLISHED', contacts: 4 }],
  events: [{ id: 1, type: 'APPOINTMENT_COMPLETED', content: 'Visite faite samedi, retour positif.', createdAt: '2026-11-24T16:00:00' }],
  offers: [],
  canEnd: true, endReasons: ['SOLD_BY_OWNER', 'SOLD_THIRD_PARTY', 'WITHDRAWN_OWNER'], canReview: false, review: null,
};

const OFFER: MandateOffer = {
  id: 3, amount: 1300000, currency: 'MAD', buyerSummary: 'Couple, prêt accordé', conditions: 'Signature sous 30 jours',
  validUntil: null, status: 'OFFER_PENDING', counterAmount: null, ownerComment: null, createdAt: '2026-11-26T10:00:00', decidedAt: null,
};

const RECOMMENDED: RecommendedAgency[] = [
  { orgId: 'ORG-A', name: 'Agence du Détroit', description: null, districts: ['Malabata'], rating: 4.6, reviews: 12, invited: false, proposed: true },
  { orgId: 'ORG-C', name: 'Agence Iberia', description: null, districts: [], rating: null, reviews: 0, invited: false, proposed: false },
];

const text = (el: HTMLElement) => el.textContent!.replace(/\s+/g, ' ');

const PROPOSAL: OwnerProposal = {
  id: 31, agencyOrgId: 'ORG-A', agencyName: 'Agence du Détroit', agentName: 'Karim', mandateType: 'EXCLUSIVE',
  durationMonths: 3, commissionKind: 'PERCENT', commissionValue: 2.5, commissionPayer: 'SELLER', services: ['PHOTOS'],
  estimateMin: 1350000, estimateMax: 1500000, message: null, status: 'MPROP_SENT', unread: 2, createdAt: '2026-11-25T10:00:00',
  agencyRating: 4.64, agencyReviews: 12,
};

const OWNER_REQUEST: OwnerRequest = {
  id: 7, propertyId: 1, propertyTitle: 'Appartement Malabata', visibility: 'MREQ_OPEN_MARKET', targetAgencyOrgId: null,
  targetAgencyName: null, objective: 'SALE', city: 'Tanger', district: 'Malabata', expectedPrice: 1450000, deadline: '3_MONTHS',
  mandateTypes: ['SIMPLE', 'EXCLUSIVE'], services: [], commissionNote: null, availability: null, languages: null, message: null,
  status: 'MREQ_OPEN', maxProposals: 5, openedAt: '2026-11-24T09:00:00', expiresAt: '2026-12-08T09:00:00', canOpenToMarket: false,
  proposals: [PROPOSAL, { ...PROPOSAL, id: 32, agencyName: 'Tanger Immo', mandateType: 'SIMPLE', status: 'MPROP_DECLINED', unread: 0 }],
  mandates: [],
};

const AGENCY_REQUEST: AgencyRequest = {
  id: 7, direct: false, objective: 'SALE', propertyType: 'Appartement', city: 'Tanger', district: 'Malabata', surface: 92, rooms: 3,
  expectedPrice: 1450000, deadline: '3_MONTHS', mandateTypes: ['EXCLUSIVE'], services: [], commissionNote: null, availability: null,
  languages: null, message: 'Joignable au [coordonnées masquées].', ownerName: 'Nadia I.', status: 'MREQ_OPEN', openedAt: null,
  expiresAt: '2026-12-08T09:00:00', canPropose: true, cannotProposeReason: null, myProposal: null,
  relevance: 78, compatibleBuyers: 3, invited: true, ownerVerified: true, propertyVerified: false,
};

let current: HttpTestingController | null = null;

function setup(params: Record<string, string>, extra: unknown[] = []) {
  const closed: unknown[] = [];
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
      { provide: DialogRef, useValue: { close: (v: unknown) => closed.push(v) } },
      ...extra as never[],
    ],
  });
  current = TestBed.inject(HttpTestingController);
  return { http: current, closed };
}

describe('Bourse aux mandats', () => {
  afterEach(() => { current?.verify(); current = null; });

  it('formate la commission', () => {
    expect(commissionLabel('PERCENT', 2.5, 'SELLER')).toBe('2,5 % · Propriétaire');
    expect(commissionLabel('FLAT', 25000)).toContain('MAD');
  });

  it('le propriétaire compare les propositions et lit les échanges', () => {
    const { http } = setup({ id: '7' });
    const fixture = TestBed.createComponent(OwnerRequestComponent);
    fixture.detectChanges();
    http.expectOne('/api/v1/owner/mandate-requests/7').flush(OWNER_REQUEST);
    http.expectOne('/api/v1/owner/mandate-requests/7/recommended').flush([]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(text(el)).toContain('Agence du Détroit');
    expect(text(el)).toContain('Karim · 4,6 / 5 · 12 avis');
    expect(text(el)).toContain('Échanger (2)');
    // Une proposition refusée ne propose plus d'action.
    expect(fixture.componentInstance.pending(OWNER_REQUEST.proposals[1])).toBe(false);
    expect(fixture.componentInstance.pending(PROPOSAL)).toBe(true);

    fixture.componentInstance.openThread(PROPOSAL);
    http.expectOne('/api/v1/owner/proposals/31/messages').flush({
      proposalId: 31, masked: true, closed: false,
      messages: [{ id: 1, side: 'AGENCY', authorName: 'Agence', body: 'Appelez [coordonnées masquées]', createdAt: '2026-11-25T10:05:00' }],
    });
    fixture.detectChanges();
    expect(text(el)).toContain('masqués');
    expect(fixture.componentInstance.items()[0].author).toBe('AGENCY');
    expect(fixture.componentInstance.req()!.proposals[0].unread).toBe(0);
  });

  it('accepter demande le code puis le confirme', () => {
    const { http, closed } = setup({}, [{ provide: DIALOG_DATA, useValue: PROPOSAL }]);
    const fixture = TestBed.createComponent(OwnerAcceptDialogComponent);
    fixture.detectChanges();
    expect(text(fixture.nativeElement)).toContain('et à elle seule');
    fixture.componentInstance.sendCode();
    http.expectOne('/api/v1/owner/proposals/31/accept/start').flush({ channel: 'WHATSAPP' });
    expect(fixture.componentInstance.step()).toBe('code');
    fixture.componentInstance.code = ' 123456 ';
    fixture.componentInstance.confirm();
    const req = http.expectOne('/api/v1/owner/proposals/31/accept');
    expect(req.request.body).toEqual({ code: '123456' });
    req.flush({ id: 9 });
    expect(closed).toEqual([{ id: 9 }]);
  });

  it("l'agence envoie sa proposition avec le type de mandat accepté", () => {
    const { http } = setup({ id: '7' });
    const fixture = TestBed.createComponent(MarketplaceRequestComponent);
    fixture.detectChanges();
    http.expectOne('/api/v1/marketplace/requests/7').flush(AGENCY_REQUEST);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    // Le propriétaire n'accepte que l'exclusif : le formulaire s'aligne.
    expect(c.form.mandateType).toBe('EXCLUSIVE');
    expect(text(fixture.nativeElement)).toContain('[coordonnées masquées]');
    expect(text(fixture.nativeElement)).toContain('3 acquéreurs compatibles dans votre portefeuille');
    expect(text(fixture.nativeElement)).toContain('78 / 100 pertinence');
    expect(text(fixture.nativeElement)).toContain('Le propriétaire vous invite');
    expect(text(fixture.nativeElement)).toContain('Propriétaire vérifié');
    expect(text(fixture.nativeElement)).toContain('Titre foncier non vérifié');
    c.commissionValue = 2;
    c.propose(AGENCY_REQUEST);
    const req = http.expectOne('/api/v1/marketplace/requests/7/proposals');
    expect(req.request.body).toMatchObject({ mandateType: 'EXCLUSIVE', durationMonths: 3, commissionKind: 'PERCENT', commissionValue: 2 });
    req.flush({ ...AGENCY_REQUEST, canPropose: false, myProposal: { id: 31, requestId: 7, status: 'MPROP_SENT', mandateType: 'EXCLUSIVE' } });
    http.expectOne('/api/v1/marketplace/proposals/31/messages').flush({ proposalId: 31, masked: true, closed: false, messages: [] });
  });

  it('un lien de notification de proposition ouvre la demande', () => {
    const { http } = setup({ proposalId: '31' });
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    TestBed.createComponent(MarketplaceRequestComponent).detectChanges();
    http.expectOne('/api/v1/marketplace/proposals/31').flush({ id: 31, requestId: 7 });
    expect(nav).toHaveBeenCalledWith(['/pro/mandats/demandes', 7], { replaceUrl: true });
  });

  it('les liens courts des alertes mènent au contact ou à la demande', () => {
    for (const [ref, target] of [['c12', ['/proprietaire/contacts', '12']], ['d5', ['/proprietaire/demandes', '5']], ['m9', ['/proprietaire/mandats', '9']], ['x', ['/proprietaire']]] as const) {
      TestBed.resetTestingModule();
      setup({ ref });
      const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      TestBed.createComponent(OwnerLinkComponent).detectChanges();
      expect(nav).toHaveBeenCalledWith(target, { replaceUrl: true });
    }
  });

  // ---------------------------------------------------------------- lot C

  it('note moyenne arrondie, et rien sans avis', () => {
    expect(ratingLabel(4.64, 12)).toBe('4,6 / 5 · 12 avis');
    expect(ratingLabel(null, 0)).toBeNull();
    expect(ratingLabel(5, 0)).toBeNull();
  });

  it('le propriétaire invite une agence recommandée', () => {
    const { http } = setup({ id: '7' });
    const fixture = TestBed.createComponent(OwnerRequestComponent);
    fixture.detectChanges();
    http.expectOne('/api/v1/owner/mandate-requests/7').flush({ ...OWNER_REQUEST, proposals: [] });
    http.expectOne('/api/v1/owner/mandate-requests/7/recommended').flush(RECOMMENDED);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(text(el)).toContain('Agences recommandées');
    expect(text(el)).toContain('A proposé');
    expect(text(el)).toContain('Toute la ville');
    fixture.componentInstance.invite(RECOMMENDED[1]);
    const req = http.expectOne('/api/v1/owner/mandate-requests/7/invitations');
    expect(req.request.body).toEqual({ agencyOrgId: 'ORG-C' });
    req.flush([RECOMMENDED[0], { ...RECOMMENDED[1], invited: true }]);
    fixture.detectChanges();
    expect(text(el)).toContain('Invitée');
  });

  it("pas de recommandations pour une demande adressée à une seule agence", () => {
    const { http } = setup({ id: '7' });
    TestBed.createComponent(OwnerRequestComponent).detectChanges();
    http.expectOne('/api/v1/owner/mandate-requests/7').flush({ ...OWNER_REQUEST, visibility: 'MREQ_DIRECT' });
    http.expectNone('/api/v1/owner/mandate-requests/7/recommended');
  });

  it('le propriétaire suit son mandat puis y met fin avec un motif', () => {
    const closed = { closed: of('SOLD_BY_OWNER') };
    const { http } = setup({ id: '9' }, [{ provide: DsDialogService, useValue: { open: () => closed } }]);
    const fixture = TestBed.createComponent(OwnerMandateComponent);
    fixture.detectChanges();
    http.expectOne('/api/v1/owner/mandates/9').flush(FOLLOW_UP);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(text(el)).toContain('Visite faite');
    expect(text(el)).toContain('Visite faite samedi, retour positif.');
    expect(text(el)).toContain('4 contacts reçus');
    expect(text(el)).toContain('Vous pourrez noter l');

    fixture.componentInstance.end();
    const req = http.expectOne('/api/v1/owner/mandates/9/end');
    expect(req.request.body).toEqual({ reason: 'SOLD_BY_OWNER' });
    req.flush({
      ...FOLLOW_UP, canEnd: false, endReasons: [], canReview: true,
      mandate: { ...MANDATE, status: 'MANDATE_TERMINATED', endReason: 'SOLD_BY_OWNER', endedBy: 'OWNER', endedAt: '2026-11-26T10:00:00' },
    });
    fixture.detectChanges();
    expect(text(el)).toContain('Vendu ou loué par le propriétaire');
    expect(text(el)).toContain('Publier mon avis');
  });

  it("l'avis part une seule fois, avec la note choisie", () => {
    const { http } = setup({ id: '9' });
    const fixture = TestBed.createComponent(OwnerMandateComponent);
    fixture.detectChanges();
    http.expectOne('/api/v1/owner/mandates/9').flush({ ...FOLLOW_UP, canEnd: false, canReview: true, mandate: { ...MANDATE, status: 'MANDATE_COMPLETED' } });
    const c = fixture.componentInstance;
    c.rating = 5;
    c.comment = '  Vendu en 6 semaines.  ';
    c.review();
    const req = http.expectOne('/api/v1/owner/mandates/9/review');
    expect(req.request.body).toEqual({ rating: 5, comment: 'Vendu en 6 semaines.' });
    req.flush({ ...FOLLOW_UP, canEnd: false, canReview: false, review: { rating: 5, comment: 'Vendu en 6 semaines.', createdAt: '2026-11-26T10:00:00' } });
    fixture.detectChanges();
    expect(text(fixture.nativeElement)).toContain('5 / 5');
    expect(text(fixture.nativeElement)).not.toContain('Publier mon avis');
  });

  it("l'agence termine le mandat avec un motif", () => {
    const { http } = setup({}, [{ provide: DIALOG_DATA, useValue: MANDATE }]);
    const fixture = TestBed.createComponent(MarketplaceMandateDialogComponent);
    http.expectOne('/api/v1/marketplace/mandates/9/offers').flush([]);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    c.ending.set(true);
    c.endReason.set('DEAL_CLOSED_AGENCY');
    c.end();
    const req = http.expectOne('/api/v1/marketplace/mandates/9/end');
    expect(req.request.body).toEqual({ reason: 'DEAL_CLOSED_AGENCY' });
    req.flush({ ...MANDATE, status: 'MANDATE_COMPLETED', endReason: 'DEAL_CLOSED_AGENCY', endedBy: 'AGENCY', endedAt: '2026-11-26T10:00:00' });
    fixture.detectChanges();
    expect(text(fixture.nativeElement)).toContain("Terminé par votre agence : transaction conclue par l'agence.");
  });

  it('le propriétaire répond à une offre depuis le suivi du mandat', () => {
    const answer = { decision: 'COUNTER', counterAmount: 1400000, comment: 'Prix ferme' };
    const { http } = setup({ id: '9' }, [{ provide: DsDialogService, useValue: { open: () => ({ closed: of(answer) }) } }]);
    const fixture = TestBed.createComponent(OwnerMandateComponent);
    fixture.detectChanges();
    http.expectOne('/api/v1/owner/mandates/9').flush({ ...FOLLOW_UP, offers: [OFFER] });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(text(el)).toContain('Offres reçues');
    expect(text(el)).toContain('1 offre à examiner');
    expect(text(el)).toContain('Couple, prêt accordé');
    fixture.componentInstance.answer(OFFER);
    const req = http.expectOne('/api/v1/owner/mandates/9/offers/3/decision');
    expect(req.request.body).toEqual(answer);
    req.flush({ ...FOLLOW_UP, offers: [{ ...OFFER, status: 'OFFER_COUNTERED', counterAmount: 1400000, ownerComment: 'Prix ferme' }] });
    fixture.detectChanges();
    expect(text(el)).toContain('Contre-proposition');
    expect(text(el)).not.toContain('Répondre');
  });

  it("la contre-proposition doit dépasser l'offre ; accepter est bloqué si une offre l'est déjà", () => {
    const { closed } = setup({}, [{ provide: DIALOG_DATA, useValue: { offer: OFFER, agencyName: 'Agence du Détroit', acceptBlocked: true } }]);
    const fixture = TestBed.createComponent(OwnerOfferDialogComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(c.options[0].disabled).toBe(true);
    c.decision.set('COUNTER');
    c.counter.set(1200000);
    expect(c.counterError()).toContain('supérieur');
    expect(c.valid()).toBe(false);
    c.counter.set('1450000');
    c.comment = '  Prix ferme ';
    expect(c.valid()).toBe(true);
    c.confirm();
    expect(closed).toEqual([{ decision: 'COUNTER', counterAmount: 1450000, comment: 'Prix ferme' }]);
  });

  it("l'agence transmet une offre puis la retire", () => {
    const { http } = setup({}, [{ provide: DIALOG_DATA, useValue: MANDATE }]);
    const fixture = TestBed.createComponent(MarketplaceMandateDialogComponent);
    http.expectOne('/api/v1/marketplace/mandates/9/offers').flush([]);
    fixture.detectChanges();
    expect(text(fixture.nativeElement)).toContain('Aucune offre transmise');
    const c = fixture.componentInstance;
    c.offering.set(true);
    c.offer = { amount: '1300000', buyerSummary: ' Couple ', conditions: '', validUntil: '' };
    c.submitOffer();
    const req = http.expectOne('/api/v1/marketplace/mandates/9/offers');
    expect(req.request.body).toEqual({ amount: 1300000, buyerSummary: 'Couple', conditions: null, validUntil: null });
    req.flush([OFFER]);
    fixture.detectChanges();
    expect(c.offering()).toBe(false);
    expect(text(fixture.nativeElement)).toContain('1 300 000 MAD · Couple, prêt accordé');
    c.withdraw(OFFER);
    http.expectOne('/api/v1/marketplace/mandates/9/offers/3/withdraw').flush([{ ...OFFER, status: 'OFFER_WITHDRAWN' }]);
    expect(c.offers()[0].status).toBe('OFFER_WITHDRAWN');
  });

  it("le profil de l'agence montre sa note et ses avis", () => {
    const { http } = setup({}, [{ provide: AuthService, useValue: { hasRole: () => true } }]);
    const fixture = TestBed.createComponent(AgencyMarketplaceProfileComponent);
    fixture.detectChanges();
    http.expectOne('/api/v1/agency/marketplace-profile').flush({
      orgId: 'ORG-A', verified: true, displayName: 'Agence du Détroit', description: null, languages: [], propertyTypes: [],
      transactions: ['SALE'], zones: [{ city: 'Tanger', district: null }], rating: 4.5, reviews: 2,
      recentReviews: [{ rating: 5, comment: 'Vendu en 6 semaines.', createdAt: '2027-01-12T10:00:00' }, { rating: 4, comment: null, createdAt: '2026-12-01T10:00:00' }],
    });
    fixture.detectChanges();
    const el = text(fixture.nativeElement);
    expect(el).toContain('4,5 / 5 · 2 avis');
    expect(el).toContain('Vendu en 6 semaines.');
  });
});
