import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ValidationSuggestion } from '../services/form-validation.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-inline-validation-suggestion',
  template: `
    <div class="suggestion-container" *ngIf="suggestion" @slideIn>
      <div class="suggestion-card" [class.high-confidence]="suggestion.confidence === 'high'">
        <div class="suggestion-header">
          <mat-icon class="suggestion-icon">{{ getConfidenceIcon() }}</mat-icon>
          <span class="suggestion-reason">{{ suggestion.reason }}</span>
        </div>
        <div class="suggestion-content">
          <div class="original-value">
            <span class="label">Valeur actuelle:</span>
            <span class="value">{{ suggestion.originalValue }}</span>
          </div>
          <mat-icon class="arrow-icon">arrow_forward</mat-icon>
          <div class="suggested-value">
            <span class="label">Suggestion:</span>
            <span class="value suggested">{{ suggestion.suggestedValue }}</span>
          </div>
        </div>
        <div class="suggestion-actions">
          <button 
            mat-button 
            color="primary" 
            (click)="onAccept()"
            class="accept-btn">
            <mat-icon>check</mat-icon>
            Accepter
          </button>
          <button 
            mat-button 
            (click)="onDismiss()"
            class="dismiss-btn">
            <mat-icon>close</mat-icon>
            Ignorer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .suggestion-container {
      margin-top: 8px;
      margin-bottom: 8px;
    }

    .suggestion-card {
      background: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .suggestion-card.high-confidence {
      background: #e8f5e9;
      border-color: #81c784;
    }

    .suggestion-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .suggestion-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .high-confidence .suggestion-icon {
      color: #43a047;
    }

    .suggestion-reason {
      font-size: 13px;
      font-weight: 500;
      color: #1565c0;
    }

    .high-confidence .suggestion-reason {
      color: #2e7d32;
    }

    .suggestion-content {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
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
      color: #666;
      margin-bottom: 4px;
      font-weight: 500;
    }

    .value {
      display: block;
      font-size: 14px;
      padding: 6px 8px;
      background: #fff;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
    }

    .value.suggested {
      border-color: #1976d2;
      background: #fff;
      font-weight: 500;
    }

    .high-confidence .value.suggested {
      border-color: #43a047;
    }

    .arrow-icon {
      color: #757575;
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .suggestion-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .accept-btn,
    .dismiss-btn {
      font-size: 12px;
      height: 32px;
    }

    .accept-btn mat-icon,
    .dismiss-btn mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
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
  ]
})
export class InlineValidationSuggestionComponent {
  @Input() suggestion: ValidationSuggestion | null = null;
  @Output() accept = new EventEmitter<ValidationSuggestion>();
  @Output() dismiss = new EventEmitter<void>();

  onAccept(): void {
    if (this.suggestion) {
      this.accept.emit(this.suggestion);
    }
  }

  onDismiss(): void {
    this.dismiss.emit();
  }

  getConfidenceIcon(): string {
    if (!this.suggestion) return 'info';
    
    switch (this.suggestion.confidence) {
      case 'high':
        return 'verified';
      case 'medium':
        return 'help_outline';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }
}
