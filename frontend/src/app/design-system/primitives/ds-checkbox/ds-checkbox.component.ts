import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { DsIconComponent } from '../../icons/ds-icon.component';

@Component({
  selector: 'ds-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule, DsIconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsCheckboxComponent),
      multi: true,
    }
  ],
  template: `
    <label 
      class="ds-checkbox" 
      [class.ds-checkbox--disabled]="disabled"
      [class.ds-checkbox--checked]="checked">
      <input 
        type="checkbox" 
        class="ds-checkbox__input sr-only" 
        [checked]="checked" 
        [disabled]="disabled" 
        (change)="onCheckboxChange($event)">
      <div class="ds-checkbox__box" [class.ds-checkbox__box--error]="error">
        @if (checked) {
          <ds-icon name="check" [size]="16" class="ds-checkbox__icon"></ds-icon>
        }
      </div>
      <div class="ds-checkbox__content">
        @if (label) {
          <span class="ds-checkbox__label">{{ label }}</span>
        }
        <ng-content></ng-content>
        @if (description) {
          <p class="ds-checkbox__description">{{ description }}</p>
        }
      </div>
    </label>
    @if (error) {
      <p class="ds-field__error" role="alert" style="margin-top: 4px;">{{ error }}</p>
    }
  `,
  styleUrls: ['./ds-checkbox.component.scss']
})
export class DsCheckboxComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() description: string | null = null;
  @Input() checked = false;
  @Input() disabled = false;
  @Input() error: string | null = null;
  
  @Output() checkedChange = new EventEmitter<boolean>();

  onChange = (_: any) => {};
  onTouched = () => {};

  onCheckboxChange(event: Event): void {
    if (this.disabled) return;
    
    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.onChange(this.checked);
    this.checkedChange.emit(this.checked);
    this.onTouched();
  }

  // ControlValueAccessor
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
