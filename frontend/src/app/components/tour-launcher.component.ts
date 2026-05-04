/**
 * TourLauncherComponent — Menu flottant de démarrage des 3 tours guidés.
 *
 * Usage (ex. dans DashboardComponent) :
 *   <app-tour-launcher></app-tour-launcher>
 */
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuidedTourService } from '../services/guided-tour.service';

interface TourMeta {
  id: 'dashboard-welcome' | 'pipeline-dossiers' | 'messagerie-multicanal';
  icon: string;
  label: string;
  desc: string;
  mins: number;
}

const TOURS: TourMeta[] = [
  { id: 'dashboard-welcome',     icon: '🗺️', label: 'Tableau de bord',    desc: 'KPIs, pipeline et navigation',          mins: 3 },
  { id: 'pipeline-dossiers',     icon: '📁', label: 'Dossiers & Pipeline', desc: 'Créer et piloter vos dossiers',         mins: 4 },
  { id: 'messagerie-multicanal', icon: '💬', label: 'Messagerie',          desc: 'WhatsApp, Email et SMS unifiés',        mins: 3 },
];

@Component({
  selector: 'app-tour-launcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tl">
      <button class="tl__trigger" (click)="open = !open" [attr.aria-expanded]="open"
        aria-label="Guides interactifs" title="Guides interactifs">
        <span class="tl__trigger-icon" aria-hidden="true">🧭</span>
        @if (!allDone) { <span class="tl__badge" aria-label="{{ remaining }} tours restants">{{ remaining }}</span> }
      </button>

      @if (open) {
        <div class="tl__panel" role="dialog" aria-label="Guides interactifs">
          <div class="tl__header">
            <span class="tl__title">Guides interactifs</span>
            <button class="tl__close" (click)="open = false" aria-label="Fermer">✕</button>
          </div>
          <div class="tl__list">
            @for (t of tours; track t.id) {
              <div class="tl__item" [class.tl__item--done]="guidedTour.isCompleted(t.id)">
                <div class="tl__item-icon" aria-hidden="true">{{ t.icon }}</div>
                <div class="tl__item-body">
                  <div class="tl__item-label">{{ t.label }}</div>
                  <div class="tl__item-desc">{{ t.desc }} · {{ t.mins }} min</div>
                </div>
                <button class="tl__item-btn"
                  (click)="launch(t.id)"
                  [attr.aria-label]="'Démarrer le tour ' + t.label">
                  @if (guidedTour.isCompleted(t.id)) { ↺ } @else { ▶ }
                </button>
              </div>
            }
          </div>
          <div class="tl__footer">
            <button class="tl__reset" (click)="resetAll()">Réinitialiser tous les tours</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tl { position: fixed; bottom: 24px; right: 24px; z-index: 9000; font-family: var(--ds-font-body); }
    .tl__trigger {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--ds-marine); color: #fff; border: none; cursor: pointer;
      font-size: 20px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(13,44,74,.35);
      transition: transform 150ms, box-shadow 150ms; position: relative;
    }
    .tl__trigger:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(13,44,74,.45); }
    .tl__badge {
      position: absolute; top: -4px; right: -4px;
      width: 18px; height: 18px; border-radius: 50%;
      background: var(--ds-primary); color: #fff;
      font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid var(--ds-surface);
    }
    .tl__panel {
      position: absolute; bottom: 60px; right: 0; width: 320px;
      background: var(--ds-surface); border: 1px solid var(--ds-divider);
      border-radius: var(--ds-radius-lg, 12px);
      box-shadow: 0 8px 32px rgba(13,44,74,.15); overflow: hidden;
    }
    .tl__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid var(--ds-divider);
      background: var(--ds-marine); color: #fff;
    }
    .tl__title { font-size: 13px; font-weight: 700; }
    .tl__close {
      background: none; border: none; color: rgba(255,255,255,.7);
      cursor: pointer; font-size: 14px; padding: 0;
    }
    .tl__close:hover { color: #fff; }
    .tl__list { display: flex; flex-direction: column; }
    .tl__item {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; border-bottom: 1px solid var(--ds-surface-offset);
      transition: background 100ms;
    }
    .tl__item:hover { background: var(--ds-surface-offset); }
    .tl__item.tl__item--done .tl__item-label { color: var(--ds-text-faint); text-decoration: line-through; }
    .tl__item-icon { font-size: 20px; flex-shrink: 0; }
    .tl__item-body { flex: 1; }
    .tl__item-label { font-size: 13px; font-weight: 600; color: var(--ds-text); }
    .tl__item-desc { font-size: 11px; color: var(--ds-text-faint); margin-top: 2px; }
    .tl__item-btn {
      width: 32px; height: 32px; border-radius: var(--ds-radius-md, 8px);
      background: var(--ds-marine-hl); color: var(--ds-marine);
      border: none; cursor: pointer; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
      transition: background 150ms;
    }
    .tl__item-btn:hover { background: var(--ds-marine); color: #fff; }
    .tl__footer { padding: 10px 16px; }
    .tl__reset {
      background: none; border: none; font-size: 11.5px;
      color: var(--ds-text-faint); cursor: pointer; padding: 0;
    }
    .tl__reset:hover { color: var(--ds-error); text-decoration: underline; }
  `],
})
export class TourLauncherComponent {
  open = false;
  readonly tours = TOURS;
  readonly guidedTour = inject(GuidedTourService);

  get remaining(): number { return TOURS.filter(t => !this.guidedTour.isCompleted(t.id)).length; }
  get allDone(): boolean  { return this.remaining === 0; }

  launch(id: TourMeta['id']): void {
    this.open = false;
    this.guidedTour.start(id);
  }

  resetAll(): void {
    this.guidedTour.reset();
  }
}
