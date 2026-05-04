import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '../ds-button/ds-button.component';

@Component({
  selector: 'ds-empty-state',
  standalone: true,
  imports: [CommonModule, DsButtonComponent],
  template: `
    <div class="ds-empty" [class.ds-empty--compact]="compact" role="status">
      @if (icon) {
        <div class="ds-empty__icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" [innerHTML]="icon"></svg>
        </div>
      }
      <p class="ds-empty__title">{{ title }}</p>
      @if (description) {
        <p class="ds-empty__desc">{{ description }}</p>
      }
      @if (ctaLabel) {
        <ds-button variant="marine" size="md" (dsClick)="ctaClick.emit()">
          {{ ctaLabel }}
        </ds-button>
      }
    </div>
  `,
  styleUrls: ['./ds-empty-state.component.scss'],
})
export class DsEmptyStateComponent {
  @Input() title = 'Aucun résultat';
  @Input() description: string | null = null;
  @Input() icon: string | null = null;
  @Input() ctaLabel: string | null = null;
  @Input() compact = false;
  @Output() ctaClick = new EventEmitter<void>();
}
