import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ConversationThreadComponent } from './conversation-thread.component';
import { OwnerLeadComponent } from './owner-lead.component';
import { OwnerVisitDialogComponent, addMinutes } from './owner-visit-dialog.component';
import { ContactConversationComponent } from '../portail/contact-conversation/contact-conversation.component';
import type { OwnerConversation } from '../../services/owner-api.service';
import type { ProspectConversation } from '../../services/portal-conversation-api.service';

const text = (el: HTMLElement) => el.textContent!.replace(/\s+/g, ' ');

const MESSAGES = [
  { id: 1, author: 'OWNER' as const, body: 'Bonjour <b>Yasmine</b>', at: '2026-11-25T10:00:00' },
  { id: 2, author: 'PROSPECT' as const, body: 'Samedi 10h ?', at: '2026-11-25T10:05:00' },
];

const OWNER_CONV: OwnerConversation = {
  leadId: 7,
  prospectName: 'Yasmine B.',
  prospectPhone: '+212611223344',
  prospectEmail: null,
  initialMessage: '[Demande de visite]\nDisponible samedi.',
  statusCode: 'CRM_QUALIFYING',
  statusLabel: 'En contact',
  next: [{ code: 'CRM_CLOSED_LOST', label: 'Sans suite' }],
  annonceTitle: 'Appartement Malabata',
  closed: false,
  messages: MESSAGES,
  proposals: [{ id: 3, start: '2026-11-28T10:00:00', end: '2026-11-28T10:45:00' }],
  visits: [],
};

describe('Échanges propriétaire ↔ prospect', () => {
  let http: HttpTestingController;
  let closed: unknown[] = [];

  beforeEach(() => {
    closed = [];
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '7', token: '' }) } } },
        { provide: DIALOG_DATA, useValue: { leadId: 7, prospectName: 'Yasmine B.' } },
        { provide: DialogRef, useValue: { close: (v: unknown) => closed.push(v) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('le fil affiche les messages en texte et place les miens à droite', () => {
    const fixture = TestBed.createComponent(ConversationThreadComponent);
    fixture.componentInstance.messages = MESSAGES;
    fixture.componentInstance.me = 'PROSPECT';
    fixture.componentInstance.otherName = 'Nadia';
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('.ct-item');
    expect(items.length).toBe(2);
    expect(items[1].classList.contains('ct-item--mine')).toBe(true);
    // Jamais interprété comme du HTML.
    expect(el.querySelector('.ct-bubble b')).toBeNull();
    expect(text(el)).toContain('Bonjour <b>Yasmine</b>');
  });

  it('la fiche contact envoie la réponse et affiche les créneaux en attente', () => {
    const fixture = TestBed.createComponent(OwnerLeadComponent);
    fixture.detectChanges();
    http.expectOne('/api/v1/owner/leads/7/conversation').flush(OWNER_CONV);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(text(el)).toContain('Yasmine B.');
    expect(text(el)).toContain('En attente de son choix');

    fixture.componentInstance.send('Oui, samedi 10h.');
    const req = http.expectOne('/api/v1/owner/leads/7/messages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ body: 'Oui, samedi 10h.' });
    req.flush({ ...OWNER_CONV, messages: [...MESSAGES, { id: 4, author: 'OWNER', body: 'Oui, samedi 10h.', at: '2026-11-25T10:06:00' }] });
    fixture.detectChanges();
    expect(el.querySelectorAll('.ct-item').length).toBe(4);
  });

  it('la boîte de créneaux calcule la fin à partir de la durée', () => {
    expect(addMinutes('2026-11-28T10:00', 45)).toBe('2026-11-28T10:45');
    const fixture = TestBed.createComponent(OwnerVisitDialogComponent);
    fixture.detectChanges();
    const dialog = fixture.componentInstance;
    dialog.slots = [{ start: '2026-11-28T10:00', minutes: '60' }];
    dialog.submit({ invalid: false } as never);
    const req = http.expectOne('/api/v1/owner/leads/7/visit-proposals');
    expect(req.request.body).toEqual({ slots: [{ start: '2026-11-28T10:00', end: '2026-11-28T11:00' }] });
    req.flush(OWNER_CONV);
    expect(closed).toEqual([OWNER_CONV]);
  });
});

describe('Page du prospect', () => {
  let http: HttpTestingController;

  const PROSPECT_CONV: ProspectConversation = {
    ownerName: 'Nadia',
    prospectName: 'Yasmine B.',
    annonceId: 12,
    annonceTitle: 'Appartement Malabata',
    annonceCity: 'Tanger',
    initialMessage: 'Disponible samedi.',
    closed: false,
    messages: MESSAGES,
    proposals: [{ id: 3, start: '2026-11-28T10:00:00', end: '2026-11-28T10:45:00' }],
    visits: [],
  };

  function setup(tokenValue: string) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ token: tokenValue }) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ContactConversationComponent);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => http.verify());

  it('envoie le jeton dans un en-tête et confirme le créneau choisi', () => {
    const fixture = setup('jeton-abc');
    const req = http.expectOne('/api/v1/portal/conversation');
    expect(req.request.headers.get('X-Conversation-Token')).toBe('jeton-abc');
    req.flush(PROSPECT_CONV);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(text(el)).toContain('Choisissez un créneau de visite');

    fixture.componentInstance.accept(3);
    const accept = http.expectOne('/api/v1/portal/conversation/visit-proposals/3/accept');
    expect(accept.request.headers.get('X-Conversation-Token')).toBe('jeton-abc');
    accept.flush({ ...PROSPECT_CONV, proposals: [], visits: [{ id: 9, start: '2026-11-28T10:00:00', end: '2026-11-28T10:45:00', status: 'SCHEDULED' }] });
    fixture.detectChanges();
    expect(text(el)).toContain('Visite prévue le');
    expect(text(el)).not.toContain('Choisissez un créneau');
  });

  it('affiche un message clair pour un lien périmé', () => {
    const fixture = setup('perime');
    http.expectOne('/api/v1/portal/conversation').flush({ message: 'LINK_INVALID' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(text(fixture.nativeElement as HTMLElement)).toContain("Ce lien n'est plus valable");
  });
});
