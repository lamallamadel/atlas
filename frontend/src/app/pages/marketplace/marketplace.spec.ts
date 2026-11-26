import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { MarketplaceRequestComponent } from './marketplace-request.component';
import { OwnerRequestComponent } from '../owner/owner-request.component';
import { OwnerAcceptDialogComponent } from '../owner/owner-accept-dialog.component';
import { OwnerLinkComponent } from '../owner/owner-link.component';
import type { AgencyRequest } from '../../services/marketplace-api.service';
import type { OwnerProposal, OwnerRequest } from '../../services/mandate-api.service';
import { commissionLabel } from '../../services/mandate-api.service';

const text = (el: HTMLElement) => el.textContent!.replace(/\s+/g, ' ');

const PROPOSAL: OwnerProposal = {
  id: 31, agencyOrgId: 'ORG-A', agencyName: 'Agence du Détroit', agentName: 'Karim', mandateType: 'EXCLUSIVE',
  durationMonths: 3, commissionKind: 'PERCENT', commissionValue: 2.5, commissionPayer: 'SELLER', services: ['PHOTOS'],
  estimateMin: 1350000, estimateMax: 1500000, message: null, status: 'MPROP_SENT', unread: 2, createdAt: '2026-11-25T10:00:00',
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
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(text(el)).toContain('Agence du Détroit');
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
    for (const [ref, target] of [['c12', ['/proprietaire/contacts', '12']], ['d5', ['/proprietaire/demandes', '5']], ['x', ['/proprietaire']]] as const) {
      TestBed.resetTestingModule();
      setup({ ref });
      const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      TestBed.createComponent(OwnerLinkComponent).detectChanges();
      expect(nav).toHaveBeenCalledWith(target, { replaceUrl: true });
    }
  });
});
