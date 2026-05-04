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
      <span class="ds-badge__dot" aria-hidden="true"></span>
      <ng-content></ng-content>
    </span>
  `,
  styleUrls: ['./ds-badge.component.scss'],
})
export class DsBadgeComponent {
  @Input() status: DsBadgeStatus = 'neutral';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() ariaLabel: string | null = null;

  get classes(): string {
    return [
      'ds-badge',
      `ds-badge--${this.status}`,
      `ds-badge--${this.size}`,
    ].join(' ');
  }
}
