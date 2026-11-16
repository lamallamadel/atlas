import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface DsRadioOption {
  label: string;
  value: any;
  description?: string;
  disabled?: boolean;
}

@Component({
  selector: 'ds-radio-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsRadioGroupComponent),
      multi: true,
    }
  ],
  template: `
    <div class="ds-field" [class.ds-field--error]="error" [class.ds-field--disabled]="disabled">
      @if (label) {
        <label class="ds-field__label">{{ label }}</label>
      }
      <div class="ds-radio-group" [class.ds-radio-group--inline]="inline">
        @for (option of options; track option.value; let i = $index) {
          <label 
            class="ds-radio" 
            [class.ds-radio--disabled]="disabled || option.disabled"
            [class.ds-radio--checked]="value === option.value">
            <input 
              type="radio" 
              class="ds-radio__input sr-only" 
              [name]="name" 
              [value]="option.value"
              [checked]="value === option.value"
              [disabled]="disabled || option.disabled" 
              (change)="onRadioChange(option.value)">
            <div class="ds-radio__box" [class.ds-radio__box--error]="error"></div>
            <div class="ds-radio__content">
              <span class="ds-radio__label">{{ option.label }}</span>
              @if (option.description) {
                <p class="ds-radio__description">{{ option.description }}</p>
              }
            </div>
          </label>
        }
      </div>
      @if (error) {
        <p class="ds-field__error" role="alert">{{ error }}</p>
      }
    </div>
  `,
  styleUrls: ['./ds-radio-group.component.scss']
})
export class DsRadioGroupComponent implements ControlValueAccessor {
  @Input() name = `ds-radio-${Math.random().toString(36).slice(2, 7)}`;
  @Input() label: string | null = null;
  @Input() options: DsRadioOption[] = [];
  @Input() inline = false;
  @Input() disabled = false;
  @Input() error: string | null = null;
  
  @Output() valueChange = new EventEmitter<any>();

  value: any = null;

  onChange = (_: any) => {};
  onTouched = () => {};

  onRadioChange(value: any): void {
    if (this.disabled) return;
    
    this.value = value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.onTouched();
  }

  // ControlValueAccessor
  writeValue(val: any): void {
    this.value = val;
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
