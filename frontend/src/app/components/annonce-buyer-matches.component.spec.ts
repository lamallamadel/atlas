import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AnnonceBuyerMatchesComponent, canPlanVisit, sortMatches } from './annonce-buyer-matches.component';
import { AnnonceBuyerMatchesApiService, BuyerMatch } from '../services/annonce-buyer-matches-api.service';
import { DsToastService } from '../design-system';

function match(partial: Partial<BuyerMatch> = {}): BuyerMatch {
  return {
    id: 1, dossierId: 10, leadName: 'Youssef', dossierStatus: 'QUALIFIED', score: 90,
    reasons: ['Ville recherchée (Tanger)'], alerts: ['Piscine : non trouvé'], status: 'NEW', createdAt: null, pitchedAt: null, pitchChannel: null,
    replyIntent: null, replyExcerpt: null, replyAt: null, proposedStart: null, proposedEnd: null, visitAppointmentId: null, followUpKind: null,
    ...partial,
  };
}

describe('sortMatches', () => {
  it('met les écartés en dernier puis trie par score', () => {
    const out = sortMatches([
      match({ id: 1, score: 95, status: 'DISMISSED' }),
      match({ id: 2, score: 70 }),
      match({ id: 3, score: 85, status: 'SEEN' }),
    ]);
    expect(out.map((m) => m.id)).toEqual([3, 2, 1]);
  });
});

describe('AnnonceBuyerMatchesComponent', () => {
  let fixture: ComponentFixture<AnnonceBuyerMatchesComponent>;
  let api: Record<'list' | 'refresh' | 'dismiss' | 'undismiss' | 'followUpDone', ReturnType<typeof vi.fn>>;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };

  function create(list: BuyerMatch[] = [match()]) {
    api.list.mockReturnValue(of(list));
    fixture = TestBed.createComponent(AnnonceBuyerMatchesComponent);
    fixture.componentRef.setInput('annonceId', 5);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    api = { list: vi.fn(), refresh: vi.fn(), dismiss: vi.fn(), undismiss: vi.fn(), followUpDone: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    TestBed.configureTestingModule({
      imports: [AnnonceBuyerMatchesComponent],
      providers: [
        provideRouter([]),
        { provide: AnnonceBuyerMatchesApiService, useValue: api },
        { provide: DsToastService, useValue: toast },
      ],
    });
  });

  it('affiche les acheteurs avec score, raisons, alertes et lien vers le dossier', () => {
    const el = create();
    expect(api.list).toHaveBeenCalledWith(5);
    const text = el.textContent ?? '';
    expect(text).toContain('Youssef');
    expect(text).toContain('90/100');
    expect(text).toContain('Ville recherchée (Tanger)');
    expect(text).toContain('Piscine : non trouvé');
    expect(el.querySelector('[data-testid="bm-new-count"]')?.textContent).toContain('1');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/dossiers/10');
  });

  it('état vide', () => {
    const el = create([]);
    expect(el.querySelector('[data-testid="bm-empty"]')).not.toBeNull();
  });

  it('écarter puis rétablir', () => {
    create();
    api.dismiss.mockReturnValue(of(undefined));
    api.undismiss.mockReturnValue(of(undefined));
    const c = fixture.componentInstance;

    c.toggleDismiss(c.matches()[0]);
    expect(api.dismiss).toHaveBeenCalledWith(5, 1);
    expect(c.dismissed().length).toBe(1);
    expect(c.active().length).toBe(0);

    c.toggleDismiss(c.matches()[0]);
    expect(api.undismiss).toHaveBeenCalledWith(5, 1);
    expect(c.matches()[0].status).toBe('SEEN');
  });

  it('actualiser remplace la liste', () => {
    create([]);
    api.refresh.mockReturnValue(of([match({ id: 2, score: 75, leadName: 'Salma' })]));
    fixture.componentInstance.refresh();
    fixture.detectChanges();
    expect(api.refresh).toHaveBeenCalledWith(5);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Salma');
    expect(toast.success).toHaveBeenCalled();
  });

  it('IA indisponible : message dédié', () => {
    create();
    api.refresh.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    fixture.componentInstance.refresh();
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('indisponible'));
    expect(fixture.componentInstance.refreshing()).toBe(false);
  });

  it('ouvre l\'éditeur puis affiche la proposition envoyée', () => {
    create();
    const c = fixture.componentInstance;
    c.toggleComposer(c.matches()[0]);
    expect(c.composerFor()).toBe(1);
    c.onPitchSent(c.matches()[0], { outboundMessageId: 4, status: 'QUEUED', channel: 'SMS', pitchedAt: '2026-11-18T23:00:00', photosQueued: 0 });
    fixture.detectChanges();
    expect(c.composerFor()).toBeNull();
    expect(c.matches()[0].pitchChannel).toBe('SMS');
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="bm-pitched-1"]')?.textContent).toContain('par SMS');
  });

  it('affiche la réponse du client et le créneau proposé', () => {
    const el = create([match({ replyIntent: 'VISITE', replyExcerpt: 'samedi 10h ?', replyAt: '2026-11-19T20:00:00',
      proposedStart: '2026-11-21T10:00:00', proposedEnd: '2026-11-21T10:45:00' })]);
    const reply = el.querySelector('[data-testid="bm-reply-1"]')?.textContent ?? '';
    expect(reply).toContain('Veut visiter');
    expect(reply).toContain('samedi 10h ?');
    expect(el.textContent).toContain('Créneau libre proposé');
    expect(el.querySelector('[data-testid="bm-plan-1"]')).not.toBeNull();
  });

  it('visite planifiée : plus de bouton, lien vers le dossier', () => {
    create([match({ replyIntent: 'VISITE', proposedStart: '2026-11-21T10:00:00' })]);
    const c = fixture.componentInstance;
    c.togglePlanner(c.matches()[0]);
    expect(c.plannerFor()).toBe(1);
    c.onVisitPlanned(c.matches()[0], { appointmentId: 77, startTime: '2026-11-21T11:00:00', endTime: '2026-11-21T11:45:00', warnings: [] });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(c.plannerFor()).toBeNull();
    expect(el.querySelector('[data-testid="bm-visit-1"]')?.textContent).toContain('21/11/2026 à 11:00');
    expect(el.querySelector('[data-testid="bm-plan-1"]')).toBeNull();
  });

  it('relance en attente : bandeau, compteur, éditeur en mode relance', () => {
    const el = create([match({ followUpKind: 'AGENT_REPLY_DUE', replyIntent: 'QUESTION' })]);
    expect(el.querySelector('[data-testid="bm-follow-up-count"]')?.textContent).toContain('1 à relancer');
    expect(el.querySelector('[data-testid="bm-follow-up-1"]')?.textContent).toContain('attend votre réponse');
    const c = fixture.componentInstance;
    c.toggleComposer(c.matches()[0], 'FOLLOW_UP');
    expect(c.composerFor()).toBe(1);
    expect(c.composerPurpose()).toBe('FOLLOW_UP');
    c.toggleComposer(c.matches()[0], 'PITCH'); // autre mode : reste ouvert, change de mode
    expect(c.composerFor()).toBe(1);
    expect(c.composerPurpose()).toBe('PITCH');
    c.onPitchSent(c.matches()[0], { outboundMessageId: 1, status: 'QUEUED', channel: 'WHATSAPP', pitchedAt: 'x', photosQueued: 0 });
    expect(c.matches()[0].followUpKind).toBeNull();
  });

  it("« C'est fait » ferme le rappel", () => {
    create([match({ followUpKind: 'CLIENT_SILENT' })]);
    api.followUpDone.mockReturnValue(of(undefined));
    const c = fixture.componentInstance;
    c.followUpDone(c.matches()[0]);
    fixture.detectChanges();
    expect(api.followUpDone).toHaveBeenCalledWith(5, 1);
    expect(c.followUpCount()).toBe(0);
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-testid="bm-follow-up-1"]')).toBeNull();
  });
});

describe('canPlanVisit', () => {
  const m = (p: Partial<BuyerMatch>) => ({ id: 1, visitAppointmentId: null, replyIntent: null, ...p }) as BuyerMatch;
  it('selon la réponse', () => {
    expect(canPlanVisit(m({}))).toBe(false);
    expect(canPlanVisit(m({ replyIntent: 'VISITE' }))).toBe(true);
    expect(canPlanVisit(m({ replyIntent: 'NEGOCIATION' }))).toBe(true);
    expect(canPlanVisit(m({ replyIntent: 'PAS_INTERESSE' }))).toBe(false);
    expect(canPlanVisit(m({ replyIntent: 'VISITE', visitAppointmentId: 3 }))).toBe(false);
  });
});
