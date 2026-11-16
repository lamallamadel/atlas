import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../../icons/ds-icon.component';
import { DsButtonComponent } from '../ds-button/ds-button.component';

@Component({
  selector: 'ds-dialog-header',
  standalone: true,
  imports: [CommonModule, DsIconComponent, DsButtonComponent],
  template: `
    <header class="ds-dialog-header">
      <div class="ds-dialog-header__title-area">
        <h2 class="ds-dialog-header__title"><ng-content></ng-content></h2>
        @if (subtitle) {
          <p class="ds-dialog-header__subtitle">{{ subtitle }}</p>
        }
      </div>
      <ds-button 
        variant="icon" 
        size="sm" 
        (dsClick)="close.emit()" 
        ariaLabel="Fermer la boîte de dialogue"
        class="ds-dialog-header__close">
        <ds-icon name="close" [size]="20"></ds-icon>
      </ds-button>
    </header>
  `,
  styles: [`
    .ds-dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: var(--ds-space-6) var(--ds-space-6) var(--ds-space-4);
      border-bottom: 1px solid var(--ds-divider);
    }
    .ds-dialog-header__title-area {
      flex: 1;
    }
    .ds-dialog-header__title {
      margin: 0;
      font-family: var(--ds-font-display);
      font-size: var(--ds-text-xl);
      font-weight: 700;
      color: var(--ds-marine);
      line-height: 1.2;
    }
    .ds-dialog-header__subtitle {
      margin: var(--ds-space-1) 0 0;
      font-size: var(--ds-text-sm);
      color: var(--ds-text-muted);
    }
    .ds-dialog-header__close {
      margin: calc(var(--ds-space-2) * -1) calc(var(--ds-space-2) * -1) 0 var(--ds-space-4);
    }
    :host-context(.dark-theme) .ds-dialog-header__title {
      color: var(--ds-text);
    }
  `]
})
export class DsDialogHeaderComponent {
  @Input() subtitle?: string;
  @Output() close = new EventEmitter<void>();
}
