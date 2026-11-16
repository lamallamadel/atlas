import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'ds-switch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsSwitchComponent),
      multi: true,
    }
  ],
  template: `
    <label 
      class="ds-switch" 
      [class.ds-switch--disabled]="disabled"
      [class.ds-switch--checked]="checked">
      <input 
        type="checkbox" 
        class="ds-switch__input sr-only" 
        [checked]="checked" 
        [disabled]="disabled" 
        (change)="onToggle($event)">
      <div class="ds-switch__track">
        <div class="ds-switch__thumb"></div>
      </div>
      @if (label) {
        <div class="ds-switch__content">
          <span class="ds-switch__label">{{ label }}</span>
          @if (description) {
            <p class="ds-switch__description">{{ description }}</p>
          }
        </div>
      }
    </label>
  `,
  styles: [`
    .ds-switch {
      display: inline-flex;
      align-items: flex-start;
      gap: var(--ds-space-3);
      cursor: pointer;
      user-select: none;
      transition: opacity var(--ds-transition-med);
    }

    .ds-switch--disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .ds-switch__track {
      position: relative;
      width: 44px;
      height: 24px;
      background: var(--ds-surface-dynamic);
      border-radius: var(--ds-radius-full);
      transition: background-color var(--ds-transition-med);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .ds-switch--checked .ds-switch__track {
      background: var(--ds-primary);
    }

    .ds-switch__thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      box-shadow: var(--ds-shadow-sm);
      transition: transform var(--ds-transition-med);
    }

    .ds-switch--checked .ds-switch__thumb {
      transform: translateX(20px);
    }

    .ds-switch__content {
      display: flex;
      flex-direction: column;
    }

    .ds-switch__label {
      font-size: var(--ds-text-base);
      font-weight: 500;
      color: var(--ds-text);
      line-height: 1.5;
    }

    .ds-switch__description {
      margin: 2px 0 0;
      font-size: var(--ds-text-sm);
      color: var(--ds-text-muted);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `]
})
export class DsSwitchComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() description: string | null = null;
  @Input() checked = false;
  @Input() disabled = false;
  
  @Output() checkedChange = new EventEmitter<boolean>();

  onChange = (_: any) => {};
  onTouched = () => {};

  onToggle(event: Event): void {
    if (this.disabled) return;
    
    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.onChange(this.checked);
    this.checkedChange.emit(this.checked);
    this.onTouched();
  }

  writeValue(value: any): void {
    this.checked = !!value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
