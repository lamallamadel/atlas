import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AnnoncePitchComposerComponent, apiErrorMessage, engineLabel } from './annonce-pitch-composer.component';
import { AnnonceBuyerMatchesApiService, BuyerMatch, PitchDraft } from '../services/annonce-buyer-matches-api.service';
import { DsToastService } from '../design-system';

const MATCH: BuyerMatch = {
  id: 3, dossierId: 10, leadName: 'Youssef', dossierStatus: 'QUALIFIED', score: 88, reasons: [], alerts: [],
  status: 'SEEN', createdAt: null, pitchedAt: null, pitchChannel: null,
};

function draft(partial: Partial<PitchDraft> = {}): PitchDraft {
  return {
    message: 'Bonjour Youssef, un appartement à Tanger. Une visite ?', engine: 'openai', aiRejection: null,
    language: 'fr', channel: 'WHATSAPP', to: '+212600000002', consentStatus: 'GRANTED',
    whatsappWindowOpen: true, blockers: [], warnings: [], maxLength: 1000, pitchedAt: null, pitchChannel: null,
    ...partial,
  };
}

describe('utilitaires', () => {
  it('libellé du moteur', () => {
    expect(engineLabel('modele')).toBe('modèle de texte, sans IA');
    expect(engineLabel('openai')).toBe('IA (openai)');
  });
  it("message d'erreur de l'API", () => {
    expect(apiErrorMessage(new HttpErrorResponse({ error: { detail: 'Consentement absent' } }), 'x')).toBe('Consentement absent');
    expect(apiErrorMessage(new HttpErrorResponse({ error: { detail: 'An unexpected error occurred' } }), 'x')).toBe('x');
    expect(apiErrorMessage(null, 'x')).toBe('x');
  });
});

describe('AnnoncePitchComposerComponent', () => {
  let fixture: ComponentFixture<AnnoncePitchComposerComponent>;
  let api: { draftPitch: ReturnType<typeof vi.fn>; sendPitch: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };

  function create(d: PitchDraft = draft(), match: BuyerMatch = MATCH) {
    api.draftPitch.mockReturnValue(of(d));
    fixture = TestBed.createComponent(AnnoncePitchComposerComponent);
    fixture.componentRef.setInput('annonceId', 5);
    fixture.componentRef.setInput('match', match);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    api = { draftPitch: vi.fn(), sendPitch: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    TestBed.configureTestingModule({
      imports: [AnnoncePitchComposerComponent],
      providers: [
        { provide: AnnonceBuyerMatchesApiService, useValue: api },
        { provide: DsToastService, useValue: toast },
      ],
    });
  });

  it('charge un brouillon WhatsApp en français et autorise l\'envoi', () => {
    const c = create();
    expect(api.draftPitch).toHaveBeenCalledWith(5, 3, 'fr', 'WHATSAPP');
    expect(c.message()).toContain('Youssef');
    expect(c.canSend()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('IA (openai)');
  });

  it('reprend le canal de la proposition précédente', () => {
    create(draft({ channel: 'SMS' }), { ...MATCH, pitchChannel: 'SMS' });
    expect(api.draftPitch).toHaveBeenCalledWith(5, 3, 'fr', 'SMS');
  });

  it('bloque l\'envoi et propose le SMS hors fenêtre WhatsApp', () => {
    const c = create(draft({ whatsappWindowOpen: false, blockers: ['Le client n\'a pas écrit depuis 24 h'] }));
    fixture.detectChanges();
    expect(c.canSend()).toBe(false);
    expect(c.suggestSms()).toBe(true);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="pitch-blockers"]')?.textContent).toContain('24 h');

    api.draftPitch.mockReturnValue(of(draft({ channel: 'SMS', whatsappWindowOpen: null })));
    c.switchToSms();
    expect(api.draftPitch).toHaveBeenLastCalledWith(5, 3, 'fr', 'SMS');
    expect(c.canSend()).toBe(true);
  });

  it('message vide ou trop long : envoi impossible', () => {
    const c = create(draft({ maxLength: 20 }));
    expect(c.tooLong()).toBe(true);
    expect(c.canSend()).toBe(false);
    c.message.set('   ');
    expect(c.canSend()).toBe(false);
  });

  it('envoie le texte modifié par l\'agent', () => {
    const c = create();
    const sent = vi.fn();
    c.sent.subscribe(sent);
    c.message.set('  Bonjour Youssef, texte relu.  ');
    api.sendPitch.mockReturnValue(of({ outboundMessageId: 9, status: 'QUEUED', channel: 'WHATSAPP', pitchedAt: '2026-11-18T23:00:00' }));
    c.send();
    expect(api.sendPitch).toHaveBeenCalledWith(5, 3, { message: 'Bonjour Youssef, texte relu.', channel: 'WHATSAPP', language: 'fr' });
    expect(sent).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Proposition envoyée par WhatsApp');
  });

  it('affiche le motif de refus du serveur', () => {
    const c = create();
    api.sendPitch.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 422, error: { detail: 'Consentement requis' } })));
    c.send();
    expect(toast.error).toHaveBeenCalledWith('Consentement requis');
    expect(c.sending()).toBe(false);
  });

  it('changer de langue régénère le brouillon', () => {
    const c = create();
    c.language = 'ar';
    c.onOptionsChange();
    expect(api.draftPitch).toHaveBeenLastCalledWith(5, 3, 'ar', 'WHATSAPP');
  });
});
