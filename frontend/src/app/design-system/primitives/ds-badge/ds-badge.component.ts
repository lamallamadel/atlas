import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DsBadgeStatus =
  | 'new' | 'qualification' | 'rdv' | 'won' | 'lost'
  | 'draft' | 'active' | 'paused' | 'archived'
  | 'success' | 'warning' | 'error' | 'info' | 'neutral';

@Component({
  selector: 'ds-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="classes" [attr.aria-label]="ariaLabel || null">
      @if (showDot) {
        <span class="ds-badge__dot" aria-hidden="true"></span>
      }
      <ng-content></ng-content>
    </span>
  `,
})
export class DsBadgeComponent {
  @Input() status: DsBadgeStatus = 'neutral';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() ariaLabel: string | null = null;
  /** Affiche le point d’état (par défaut oui). Désactiver quand une icône est injectée via ng-content. */
  @Input() showDot = true;
  /** Animation légère pour les statuts « vivants » (nouveau, actif publié…). */
  @Input() pulse = false;

  get classes(): string {
    const parts = ['ds-badge', `ds-badge--${this.status}`, `ds-badge--${this.size}`];
    if (!this.showDot) {
      parts.push('ds-badge--no-dot');
    }
    if (this.pulse) {
      parts.push('ds-badge--pulse');
    }
    return parts.join(' ');
  }
}
