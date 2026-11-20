import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { RelancesComponent, waitingLabel } from './relances.component';
import { BuyerInboxApiService, BuyerInboxItem, BuyerInboxResponse, toBuyerMatch } from '../../services/buyer-inbox-api.service';
import { AnnonceBuyerMatchesApiService } from '../../services/annonce-buyer-matches-api.service';
import { DsToastService } from '../../design-system';

function item(p: Partial<BuyerInboxItem> = {}): BuyerInboxItem {
  return {
    matchId: 1, section: 'FOLLOW_UP', annonceId: 5, annonceTitle: 'Villa Achakar', annonceCity: 'Tanger',
    dossierId: 10, leadName: 'Youssef', score: 88, replyIntent: 'VISITE', replyExcerpt: 'samedi 10h ?',
    replyAt: '2026-11-18T20:00:00', followUpKind: 'AGENT_REPLY_DUE', followUpSince: '2026-11-19T21:00:00',
    proposedStart: '2099-11-21T10:00:00', visitAppointmentId: null, visitStart: null,
    pitchedAt: '2026-11-17T10:00:00', pitchChannel: 'WHATSAPP', answered: false,
    ...p,
  };
}

function response(items: BuyerInboxItem[]): BuyerInboxResponse {
  const counts = { FOLLOW_UP: 0, VISIT_TO_PLAN: 0, RECENT_REPLY: 0, UPCOMING_VISIT: 0 };
  items.forEach((i) => counts[i.section]++);
  return { items, counts };
}

describe('utilitaires', () => {
  it('temps d’attente', () => {
    const now = new Date('2026-11-20T10:00:00');
    expect(waitingLabel(null, now)).toBeNull();
    expect(waitingLabel('2026-11-20T09:30:00', now)).toBe("depuis moins d'une heure");
    expect(waitingLabel('2026-11-19T08:00:00', now)).toBe('depuis 26 h');
    expect(waitingLabel('2026-11-17T10:00:00', now)).toBe('depuis 3 j');
  });

  it('ligne → correspondance (créneau de 45 min)', () => {
    const m = toBuyerMatch(item());
    expect(m.id).toBe(1);
    expect(m.proposedEnd).toBe('2099-11-21T10:45:00');
    expect(m.followUpKind).toBe('AGENT_REPLY_DUE');
    expect(toBuyerMatch(item({ proposedStart: null })).proposedEnd).toBeNull();
  });
});

describe('RelancesComponent', () => {
  let fixture: ComponentFixture<RelancesComponent>;
  let api: { inbox: ReturnType<typeof vi.fn> };
  let matchesApi: { followUpDone: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };

  function create(items: BuyerInboxItem[]) {
    api.inbox.mockReturnValue(of(response(items)));
    fixture = TestBed.createComponent(RelancesComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    api = { inbox: vi.fn() };
    matchesApi = { followUpDone: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RelancesComponent],
      providers: [
        provideRouter([]),
        { provide: BuyerInboxApiService, useValue: api },
        { provide: AnnonceBuyerMatchesApiService, useValue: matchesApi },
        { provide: DsToastService, useValue: toast },
      ],
    });
  });

  it('sections dans l’ordre, compteurs et liens', () => {
    const el = create([
      item(),
      item({ matchId: 2, section: 'VISIT_TO_PLAN', followUpKind: null, leadName: 'Salma' }),
      item({ matchId: 3, section: 'UPCOMING_VISIT', followUpKind: null, visitAppointmentId: 9, visitStart: '2099-11-22T11:00:00', leadName: 'Karim' }),
    ]);
    expect(api.inbox).toHaveBeenCalledWith(true); // « Mes clients » par défaut
    const sections = Array.from(el.querySelectorAll('[data-testid^="section-"]')).map((s) => s.getAttribute('data-testid'));
    expect(sections).toEqual(['section-FOLLOW_UP', 'section-VISIT_TO_PLAN', 'section-UPCOMING_VISIT']);
    expect(el.querySelector('[data-testid="relances-summary"]')?.textContent).toContain('2 client(s)');
    const first = el.querySelector('[data-testid="item-1"]')!;
    expect(first.textContent).toContain('Veut visiter');
    expect(first.textContent).toContain('samedi 10h ?');
    expect(first.querySelector('a')?.getAttribute('href')).toBe('/dossiers/10');
    expect(first.querySelector('[data-testid="reply-1"]')?.textContent).toContain('Répondre');
    expect(first.querySelector('[data-testid="plan-1"]')).not.toBeNull(); // veut visiter : planifiable
    expect(el.querySelector('[data-testid="item-3"]')?.textContent).toContain('Visite le');
  });

  it('client silencieux : « Relancer », pas de planification', () => {
    const el = create([item({ followUpKind: 'CLIENT_SILENT', replyIntent: null, replyAt: null, replyExcerpt: null })]);
    expect(el.querySelector('[data-testid="reply-1"]')?.textContent).toContain('Relancer');
    expect(el.querySelector('[data-testid="plan-1"]')).toBeNull();
    expect(el.textContent).toContain('sans réponse');
  });

  it('réponse récente déjà traitée : badge, pas de bouton', () => {
    const el = create([item({ section: 'RECENT_REPLY', followUpKind: null, replyIntent: 'QUESTION', answered: true })]);
    expect(el.textContent).toContain('Répondu');
    expect(el.querySelector('[data-testid="reply-1"]')).toBeNull();
  });

  it('ouvre l’éditeur de relance ou la planification, un seul panneau à la fois', () => {
    create([item()]);
    const c = fixture.componentInstance;
    const i = c.items()[0];
    c.toggle(i, 'follow-up');
    expect(c.isOpen(i, 'follow-up')).toBe(true);
    c.toggle(i, 'plan');
    expect(c.isOpen(i, 'follow-up')).toBe(false);
    expect(c.isOpen(i, 'plan')).toBe(true);
    c.done();
    expect(c.open()).toBeNull();
    expect(api.inbox).toHaveBeenCalledTimes(2); // rechargé après l’action
  });

  it("« C'est fait » puis rechargement ; toute l'agence", () => {
    create([item()]);
    matchesApi.followUpDone.mockReturnValue(of(undefined));
    const c = fixture.componentInstance;
    c.followUpDone(c.items()[0]);
    expect(matchesApi.followUpDone).toHaveBeenCalledWith(5, 1);
    expect(api.inbox).toHaveBeenCalledTimes(2);
    c.setMine(false);
    expect(api.inbox).toHaveBeenLastCalledWith(false);
    c.setMine(false); // déjà sélectionné : pas de rechargement
    expect(api.inbox).toHaveBeenCalledTimes(3);
  });

  it('vide et erreur', () => {
    let el = create([]);
    expect(el.querySelector('[data-testid="relances-empty"]')).not.toBeNull();
    api.inbox.mockReturnValue(throwError(() => new Error('x')));
    fixture.componentInstance.load();
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Impossible de charger les relances');
  });
});
