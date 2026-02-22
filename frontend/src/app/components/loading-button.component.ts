import { Component, Input, Output, EventEmitter } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-loading-button',
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClass"
      (click)="handleClick($event)"
      [@buttonState]="loading ? 'loading' : 'idle'">
      <span class="button-content" [@contentState]="loading ? 'hidden' : 'visible'">
        <ng-content></ng-content>
      </span>
      <span class="spinner-container" [@spinnerState]="loading ? 'visible' : 'hidden'">
        <app-custom-spinner
          [size]="spinnerSize"
          [color]="spinnerColor">
        </app-custom-spinner>
      </span>
    </button>
  `,
  styles: [`
    button {
      position: relative;
      transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 100px;
    }

    button:not(:disabled):hover {
      transform: scale(1.02);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    button:not(:disabled):active {
      transform: scale(0.98);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .button-content {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .spinner-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `],
  animations: [
    trigger('buttonState', [
      state('idle', style({ minWidth: '*' })),
      state('loading', style({ minWidth: '*' })),
      transition('idle <=> loading', animate('200ms ease-out'))
    ]),
    trigger('contentState', [
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      state('hidden', style({ opacity: 0, transform: 'scale(0.8)' })),
      transition('visible <=> hidden', animate('150ms ease-out'))
    ]),
    trigger('spinnerState', [
      state('visible', style({ opacity: 1, transform: 'translate(-50%, -50%) scale(1)' })),
      state('hidden', style({ opacity: 0, transform: 'translate(-50%, -50%) scale(0.5)' })),
      transition('hidden => visible', animate('200ms ease-out')),
      transition('visible => hidden', animate('150ms ease-in'))
    ])
  ]
})
export class LoadingButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() buttonClass = '';
  @Input() spinnerSize = 20;
  @Input() spinnerColor = '#ffffff';
  
  @Output() clicked = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
