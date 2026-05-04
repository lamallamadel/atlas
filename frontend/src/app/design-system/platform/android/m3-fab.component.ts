import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../../icons/ds-icon.component';

export type M3FabSize = 'small' | 'regular' | 'large' | 'extended';
export type M3FabVariant = 'primary' | 'secondary' | 'tertiary' | 'surface';

/**
 * Floating Action Button Material 3.
 * Utilisé via Capacitor sur Android uniquement.
 * Spec : https://m3.material.io/components/floating-action-button
 */
@Component({
  selector: 'ds-m3-fab',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  template: `
    <button
      class="ds-m3-fab"
      [class]="'ds-m3-fab--' + size + ' ds-m3-fab--' + variant"
      [attr.aria-label]="label"
      (click)="fabClick.emit($event)">
      <ds-icon [name]="icon" [size]="size === 'large' ? 24 : 20"></ds-icon>
      @if (size === 'extended' && extendedLabel) {
        <span class="ds-m3-fab__label">{{ extendedLabel }}</span>
      }
    </button>
  `,
  styles: [`
    .ds-m3-fab {
      border: none; cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: var(--ds-radius-lg);
      box-shadow: var(--ds-shadow-md);
      transition: box-shadow 200ms ease, transform 150ms ease;
      font-family: var(--ds-font-body);
      gap: 8px;
      &:hover { box-shadow: var(--ds-shadow-lg); }
      &:active { transform: scale(0.96); box-shadow: var(--ds-shadow-sm); }
    }
    /* Sizes */
    .ds-m3-fab--small { width: 40px; height: 40px; border-radius: var(--ds-radius-md); }
    .ds-m3-fab--regular { width: 56px; height: 56px; border-radius: var(--ds-radius-lg); }
    .ds-m3-fab--large { width: 96px; height: 96px; border-radius: var(--ds-radius-xl); }
    .ds-m3-fab--extended { height: 56px; padding: 0 16px; border-radius: var(--ds-radius-pill); }
    /* Variants */
    .ds-m3-fab--primary { background: var(--ds-marine); color: var(--ds-text-inverse); }
    .ds-m3-fab--secondary { background: var(--ds-primary); color: var(--ds-text-inverse); }
    .ds-m3-fab--surface { background: var(--ds-surface); color: var(--ds-marine); }
    .ds-m3-fab--tertiary { background: var(--ds-copper-hl); color: var(--ds-primary); }
    .ds-m3-fab__label { font-size: 14px; font-weight: 600; letter-spacing: 0.1px; }
  `],
})
export class M3FabComponent {
  @Input() icon = 'plus';
  @Input() size: M3FabSize = 'regular';
  @Input() variant: M3FabVariant = 'primary';
  @Input() label = 'Action principale';
  @Input() extendedLabel = '';
  @Output() fabClick = new EventEmitter<MouseEvent>();
}
