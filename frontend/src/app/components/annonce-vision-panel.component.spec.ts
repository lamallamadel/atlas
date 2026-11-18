import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import {
  AnnonceVisionPanelComponent,
  POLL_INTERVAL_MS,
  conditionBadge,
  formatArea,
  formatEra,
  roomLabel,
} from './annonce-vision-panel.component';
import { AnnonceMediaApiService, VisionStatusResponse } from '../services/annonce-media-api.service';
import { DsToastService } from '../design-system';

function state(partial: Partial<VisionStatusResponse> = {}): VisionStatusResponse {
  return {
    status: 'DONE', total: 0, done: 0, pending: 0, failed: 0, rejected: 0,
    media: [], result: null, updatedAt: null, ...partial,
  };
}

const RESULT: VisionStatusResponse['result'] = {
  profile: {
    photos_analysees: 2,
    photos_du_bien: 2,
    pieces: [{
      room_type: 'chambre', label: 'chambre', photos: 2, area_m2_min: 11.6, area_m2_max: 14.2,
      furniture: [{ item: 'lit double', count: 1 }], condition: 'bon_etat',
    }],
    equipements: [{ label: 'climatisation', photos: 1 }],
    materiaux: [{ surface: 'sol', material: 'zellige', photos: 1 }],
    meuble: true,
    etat_general: 'a_rafraichir',
    signes_etat: ['peinture écaillée'],
    epoque: { from_year: 1990, to_year: 2005 },
    vues: ['vue mer'],
    lumiere: 'bonne',
  },
  inconsistencies: ['La description mentionne une piscine, non visible sur les photos.'],
  descriptions: { fr: 'Appartement lumineux à Tanger.' },
  description_engine: 'openai',
};

describe('formatage', () => {
  it('libellés de pièce', () => {
    expect(roomLabel('salle_de_bain')).toBe('Salle de bain');
    expect(roomLabel('inconnue')).toBe('inconnue');
    expect(roomLabel(null)).toBe('—');
  });

  it('surface toujours présentée comme une estimation', () => {
    expect(formatArea(11.6, 14.2)).toBe('≈ 12–14 m²');
    expect(formatArea(12, 12.3)).toBe('≈ 12 m²');
    expect(formatArea(null, 14)).toBeNull();
  });

  it('époque', () => {
    expect(formatEra({ from_year: 1990, to_year: 2005 })).toBe('entre 1990 et 2005');
    expect(formatEra({ from_year: 2010, to_year: null })).toBe('après 2010');
    expect(formatEra({ from_year: null, to_year: null })).toBeNull();
    expect(formatEra(null)).toBeNull();
  });

  it('état', () => {
    expect(conditionBadge('a_renover')).toEqual({ label: 'À rénover', status: 'error' });
    expect(conditionBadge('inconnu')).toBeNull();
  });
});

describe('AnnonceVisionPanelComponent', () => {
  let fixture: ComponentFixture<AnnonceVisionPanelComponent>;
  let api: Record<string, ReturnType<typeof vi.fn>>;
  let toast: Record<string, ReturnType<typeof vi.fn>>;

  async function create(initial: VisionStatusResponse) {
    api = {
      status: vi.fn().mockReturnValue(of(initial)),
      analyze: vi.fn(),
      upload: vi.fn(),
      delete: vi.fn(),
      content: vi.fn().mockReturnValue(of(new Blob())),
      applyDescription: vi.fn().mockReturnValue(of(undefined)),
    };
    toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [AnnonceVisionPanelComponent],
      providers: [
        { provide: AnnonceMediaApiService, useValue: api },
        { provide: DsToastService, useValue: toast },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AnnonceVisionPanelComponent);
    fixture.componentRef.setInput('annonceId', 7);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('sans photo : message vide', async () => {
    const el = await create(state({ status: 'EMPTY' }));
    expect(api['status']).toHaveBeenCalledWith(7);
    expect(el.querySelector('[data-testid="vp-empty"]')).not.toBeNull();
  });

  it('affiche le profil, les écarts et la description proposée', async () => {
    const el = await create(state({
      total: 2, done: 2, result: RESULT,
      media: [{
        id: 1, annonceId: 7, mediaType: 'PHOTO', source: 'URL', url: 'https://cdn.ma/a.jpg', position: 0,
        analysisStatus: 'DONE', analysis: { is_property_photo: true, room_type: 'chambre' },
      }],
    }));
    expect(el.querySelector('[data-testid="vp-media"] img')?.getAttribute('src')).toBe('https://cdn.ma/a.jpg');
    expect(el.querySelector('[data-testid="vp-inconsistencies"]')?.textContent).toContain('piscine');
    const profile = el.querySelector('[data-testid="vp-profile"]')?.textContent ?? '';
    expect(profile).toContain('À rafraîchir');
    expect(profile).toContain('entre 1990 et 2005');
    expect(profile).toContain('zellige');
    expect(el.querySelector('[data-testid="vp-rooms"]')?.textContent).toContain('≈ 12–14 m²');
    expect(fixture.componentInstance.descriptionDraft).toBe('Appartement lumineux à Tanger.');
  });

  it('les photos importées sont chargées avec le jeton', async () => {
    await create(state({
      total: 1, pending: 1,
      media: [{
        id: 3, annonceId: 7, mediaType: 'PHOTO', source: 'UPLOAD', url: '/api/v1/annonces/7/media/3/content',
        position: 0, analysisStatus: 'PENDING',
      }],
    }));
    expect(api['content']).toHaveBeenCalledWith('/api/v1/annonces/7/media/3/content');
  });

  it('suit l’analyse en cours jusqu’à la fin', async () => {
    await create(state({ status: 'PENDING', total: 1, pending: 1 }));
    vi.useFakeTimers();
    try {
      api['analyze'].mockReturnValue(of(state({ status: 'RUNNING', total: 1 })));
      api['status'].mockReturnValue(of(state({ status: 'DONE', total: 1, done: 1, result: RESULT })));

      fixture.componentInstance.analyze();
      expect(api['analyze']).toHaveBeenCalledWith(7, false);
      expect(fixture.componentInstance.running()).toBe(true);

      vi.advanceTimersByTime(POLL_INTERVAL_MS);
      expect(fixture.componentInstance.running()).toBe(false);
      expect(fixture.componentInstance.result()).toEqual(RESULT);
    } finally {
      vi.useRealTimers();
    }
  });

  it('signale une erreur de lancement', async () => {
    await create(state({ status: 'EMPTY' }));
    api['analyze'].mockReturnValue(throwError(() => ({ error: { detail: 'Aucune photo à analyser pour cette annonce' } })));
    fixture.componentInstance.analyze();
    expect(toast['error']).toHaveBeenCalledWith('Aucune photo à analyser pour cette annonce');
  });

  it('applique la description relue par l’agent', async () => {
    await create(state({ total: 1, done: 1, result: RESULT }));
    const emitted: string[] = [];
    fixture.componentInstance.descriptionApplied.subscribe((t) => emitted.push(t));
    fixture.componentInstance.descriptionDraft = '  Texte corrigé.  ';
    fixture.componentInstance.applyDescription();
    expect(api['applyDescription']).toHaveBeenCalledWith(7, 'Texte corrigé.');
    expect(emitted).toEqual(['Texte corrigé.']);
  });
});
