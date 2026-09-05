import { Component, input, output } from '@angular/core';
import { ValidationSuggestion } from '../services/form-validation.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { DsButtonComponent, DsIconComponent } from '../design-system';

@Component({
    selector: 'app-inline-validation-suggestion',
    template: `
    @if (suggestion(); as s) {
      <div class="suggestion-container" @slideIn>
        <div class="suggestion-card" [class.high-confidence]="s.confidence === 'high'">
          <div class="suggestion-header">
            <ds-icon class="suggestion-icon" [name]="getConfidenceIcon()" [size]="20"></ds-icon>
            <span class="suggestion-reason">{{ s.reason }}</span>
          </div>
          <div class="suggestion-content">
            <div class="original-value">
              <span class="label">Valeur actuelle:</span>
              <span class="value">{{ s.originalValue }}</span>
            </div>
            <ds-icon class="arrow-icon" name="chevron-right" [size]="20"></ds-icon>
            <div class="suggested-value">
              <span class="label">Suggestion:</span>
              <span class="value suggested">{{ s.suggestedValue }}</span>
            </div>
          </div>
          <div class="suggestion-actions">
            <ds-button variant="ghost" size="sm" (dsClick)="onAccept()" class="accept-btn">
              <ds-icon name="check" [size]="16"></ds-icon>
              Accepter
            </ds-button>
            <ds-button variant="ghost" size="sm" (dsClick)="onDismiss()" class="dismiss-btn">
              <ds-icon name="close" [size]="16"></ds-icon>
              Ignorer
            </ds-button>
          </div>
        </div>
      </div>
    }
    `,
    styles: [`
    .suggestion-container {
      margin-top: var(--ds-space-2);
      margin-bottom: var(--ds-space-2);
    }

    .suggestion-card {
      background: var(--ds-marine-hl);
      border: 1px solid var(--ds-border);
      border-radius: var(--ds-radius-md);
      padding: var(--ds-space-3);
      box-shadow: var(--ds-shadow-sm);
    }

    .suggestion-card.high-confidence {
      background: var(--ds-success-hl);
      border-color: var(--ds-success);
    }

    .suggestion-header {
      display: flex;
      align-items: center;
      gap: var(--ds-space-2);
      margin-bottom: var(--ds-space-3);
    }

    .suggestion-icon {
      color: var(--ds-marine);
    }

    .high-confidence .suggestion-icon {
      color: var(--ds-success);
    }

    .suggestion-reason {
      font-size: 13px;
      font-weight: 500;
      color: var(--ds-marine);
    }

    .high-confidence .suggestion-reason {
      color: var(--ds-success);
    }

    .suggestion-content {
      display: flex;
      align-items: center;
      gap: var(--ds-space-3);
      margin-bottom: var(--ds-space-3);
      flex-wrap: wrap;
    }

    .original-value,
    .suggested-value {
      flex: 1;
      min-width: 120px;
    }

    .label {
      display: block;
      font-size: 11px;
      color: var(--ds-text-muted);
      margin-bottom: var(--ds-space-1);
      font-weight: 500;
    }

    .value {
      display: block;
      font-size: 14px;
      padding: 6px var(--ds-space-2);
      background: var(--ds-surface);
      border-radius: var(--ds-radius-sm);
      border: 1px solid var(--ds-divider);
    }

    .value.suggested {
      border-color: var(--ds-marine);
      background: var(--ds-surface);
      font-weight: 500;
    }

    .high-confidence .value.suggested {
      border-color: var(--ds-success);
    }

    .arrow-icon {
      color: var(--ds-text-muted);
      flex-shrink: 0;
    }

    .suggestion-actions {
      display: flex;
      gap: var(--ds-space-2);
      justify-content: flex-end;
    }

    .accept-btn,
    .dismiss-btn {
      font-size: 12px;
    }

    @media (max-width: 600px) {
      .suggestion-content {
        flex-direction: column;
        align-items: stretch;
      }

      .arrow-icon {
        transform: rotate(90deg);
        align-self: center;
      }

      .original-value,
      .suggested-value {
        width: 100%;
      }
    }
  `],
    animations: [
        trigger('slideIn', [
            transition(':enter', [
                style({ transform: 'translateY(-10px)', opacity: 0 }),
                animate('200ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateY(-10px)', opacity: 0 }))
            ])
        ])
    ],
    imports: [DsButtonComponent, DsIconComponent]
})
export class InlineValidationSuggestionComponent {
  readonly suggestion = input<ValidationSuggestion | null>(null);
  readonly accept = output<ValidationSuggestion>();
  readonly dismiss = output<void>();

  onAccept(): void {
    const suggestion = this.suggestion();
    if (suggestion) {
      this.accept.emit(suggestion);
    }
  }

  onDismiss(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.dismiss.emit();
  }

  getConfidenceIcon(): string {
    const suggestion = this.suggestion();
    if (!suggestion) return 'info';

    switch (suggestion.confidence) {
      case 'high':   return 'check';
      case 'medium': return 'help-circle';
      default:       return 'info';
    }
  }
}
