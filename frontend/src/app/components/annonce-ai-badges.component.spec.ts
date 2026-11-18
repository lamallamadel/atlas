import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  AnnonceAiBadgesComponent,
  AnnonceAiFields,
  computeAiAlertBadges,
} from './annonce-ai-badges.component';

describe('computeAiAlertBadges', () => {
  it('ne signale rien pour une annonce saine ou non analysée', () => {
    expect(computeAiAlertBadges({})).toEqual([]);
    expect(computeAiAlertBadges({ fraudStatut: 'SAIN', fraudScore: 0 })).toEqual([]);
  });

  it('signale une fraude suspecte avec ses alertes dans l’infobulle', () => {
    const badges = computeAiAlertBadges({
      fraudStatut: 'SUSPECT',
      fraudScore: 35,
      fraudAlertes: ['Prix/m² très bas', 'Vendeur sans historique'],
    });
    expect(badges).toHaveLength(1);
    expect(badges[0]).toMatchObject({ kind: 'fraud', status: 'warning', label: 'Suspecte' });
    expect(badges[0].tooltip).toContain('35/100');
    expect(badges[0].tooltip).toContain('Vendeur sans historique');
  });

  it('signale une fraude probable en erreur', () => {
    const [badge] = computeAiAlertBadges({ fraudStatut: 'FRAUDULEUX', fraudScore: 80 });
    expect(badge).toMatchObject({ status: 'error', label: 'Fraude probable' });
  });

  it('signale un doublon avec l’annonce d’origine et la similarité', () => {
    const [badge] = computeAiAlertBadges({
      duplicateStatut: 'DOUBLON_CERTAIN',
      duplicateOfId: 42,
      duplicateSimilarity: 96.4,
    });
    expect(badge).toMatchObject({ kind: 'duplicate', status: 'error', label: 'Doublon' });
    expect(badge.tooltip).toBe("Ressemble à l'annonce #42 (96 % similaire)");
  });

  it('ignore un statut de doublon sans annonce liée', () => {
    expect(computeAiAlertBadges({ duplicateStatut: 'DOUBLON_PROBABLE' })).toEqual([]);
  });

  it('affiche fraude et doublon ensemble', () => {
    const badges = computeAiAlertBadges({
      fraudStatut: 'SUSPECT',
      duplicateStatut: 'DOUBLON_PROBABLE',
      duplicateOfId: 7,
    });
    expect(badges.map((b) => b.kind)).toEqual(['fraud', 'duplicate']);
  });
});

describe('AnnonceAiBadgesComponent', () => {
  let fixture: ComponentFixture<AnnonceAiBadgesComponent>;

  function render(annonce: AnnonceAiFields, compact = false): HTMLElement {
    fixture.componentRef.setInput('annonce', annonce);
    fixture.componentRef.setInput('compact', compact);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnonceAiBadgesComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AnnonceAiBadgesComponent);
  });

  it('mode compact : rien pour une annonce saine', () => {
    const el = render({ fraudStatut: 'SAIN' }, true);
    expect(el.querySelector('[data-testid="annonce-ai-badges"]')).toBeNull();
  });

  it('mode compact : badges de risque', () => {
    const el = render({ fraudStatut: 'FRAUDULEUX', duplicateStatut: 'DOUBLON_CERTAIN', duplicateOfId: 3 }, true);
    const text = el.querySelector('[data-testid="annonce-ai-badges"]')?.textContent ?? '';
    expect(text).toContain('Fraude probable');
    expect(text).toContain('Doublon');
  });

  it('mode détaillé : analyse en attente si rien n’a encore été calculé', () => {
    const el = render({});
    expect(el.textContent).toContain('Analyse en attente');
  });

  it('mode détaillé : score, alertes et lien vers le doublon', () => {
    const el = render({
      aiScore: 80,
      fraudStatut: 'SUSPECT',
      fraudScore: 35,
      fraudAlertes: ['Prix/m² très bas'],
      duplicateStatut: 'DOUBLON_PROBABLE',
      duplicateOfId: 42,
      duplicateSimilarity: 88,
    });
    expect(el.textContent).toContain('80');
    expect(el.querySelector('[data-testid="ai-fraud"]')?.textContent).toContain('Prix/m² très bas');
    const link = el.querySelector('[data-testid="ai-duplicate"] a') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/annonces/42');
    expect(el.querySelector('[data-testid="ai-duplicate"]')?.textContent).toContain('88 % similaire');
  });

  it('mode détaillé : aucun doublon détecté', () => {
    const el = render({ fraudStatut: 'SAIN' });
    expect(el.querySelector('[data-testid="ai-duplicate"]')?.textContent).toContain('Aucun doublon détecté');
  });
});
