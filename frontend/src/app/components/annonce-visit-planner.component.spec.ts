import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AnnonceVisitPlannerComponent, addMinutesLocal, defaultStart, toLocalInput } from './annonce-visit-planner.component';
import { AnnonceBuyerMatchesApiService, BuyerMatch } from '../services/annonce-buyer-matches-api.service';
import { DsToastService } from '../design-system';

const FUTURE = '2099-11-21T10:00:00';

function match(p: Partial<BuyerMatch> = {}): BuyerMatch {
  return {
    id: 3, dossierId: 10, leadName: 'Youssef', dossierStatus: 'QUALIFIED', score: 88, reasons: [], alerts: [],
    status: 'SEEN', createdAt: null, pitchedAt: null, pitchChannel: null,
    replyIntent: 'VISITE', replyExcerpt: 'samedi 10h', replyAt: null,
    proposedStart: FUTURE, proposedEnd: '2099-11-21T10:45:00', visitAppointmentId: null, followUpKind: null,
    ...p,
  };
}

describe('dates locales', () => {
  it('conversions sans fuseau', () => {
    expect(toLocalInput('2026-11-21T10:00:00')).toBe('2026-11-21T10:00');
    expect(toLocalInput(null)).toBe('');
    expect(addMinutesLocal('2026-11-21T10:30', 45)).toBe('2026-11-21T11:15');
    expect(addMinutesLocal('2026-11-30T23:30', 60)).toBe('2026-12-01T00:30');
    expect(defaultStart(new Date(2026, 10, 19, 8, 20))).toBe('2026-11-19T10:00');
  });
});

describe('AnnonceVisitPlannerComponent', () => {
  let fixture: ComponentFixture<AnnonceVisitPlannerComponent>;
  let api: { planVisit: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };

  function create(m: BuyerMatch = match()) {
    fixture = TestBed.createComponent(AnnonceVisitPlannerComponent);
    fixture.componentRef.setInput('annonceId', 5);
    fixture.componentRef.setInput('match', m);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    api = { planVisit: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    TestBed.configureTestingModule({
      imports: [AnnonceVisitPlannerComponent],
      providers: [
        { provide: AnnonceBuyerMatchesApiService, useValue: api },
        { provide: DsToastService, useValue: toast },
      ],
    });
  });

  it('prérempli avec le créneau proposé et sa durée', () => {
    const c = create();
    expect(c.start()).toBe('2099-11-21T10:00');
    expect(c.duration()).toBe(45);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Créneau libre dans votre agenda');
  });

  it('crée le rendez-vous avec la durée choisie et signale les chevauchements', () => {
    const c = create();
    const planned = vi.fn();
    c.planned.subscribe(planned);
    c.duration.set(60);
    api.planVisit.mockReturnValue(of({ appointmentId: 9, startTime: FUTURE, endTime: '2099-11-21T11:00:00', warnings: ['Chevauche un autre rendez-vous'] }));
    c.save();
    expect(api.planVisit).toHaveBeenCalledWith(5, 3, { startTime: '2099-11-21T10:00:00', endTime: '2099-11-21T11:00:00' });
    expect(toast.success).toHaveBeenCalledWith('Visite planifiée');
    expect(toast.info).toHaveBeenCalledWith('Chevauche un autre rendez-vous');
    expect(planned).toHaveBeenCalled();
  });

  it('date passée : envoi impossible', () => {
    const c = create();
    c.start.set('2020-01-01T10:00');
    expect(c.startError()).toBe('Cette date est passée');
    expect(c.canSave()).toBe(false);
  });

  it('sans créneau proposé : prochaine heure pleine', () => {
    const c = create(match({ proposedStart: null, proposedEnd: null }));
    expect(c.start()).toMatch(/T\d{2}:00$/);
    expect(c.duration()).toBe(45);
  });

  it('refus du serveur affiché', () => {
    const c = create();
    api.planVisit.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Une visite est déjà planifiée' } })));
    c.save();
    expect(toast.error).toHaveBeenCalledWith('Une visite est déjà planifiée');
    expect(c.saving()).toBe(false);
  });
});
