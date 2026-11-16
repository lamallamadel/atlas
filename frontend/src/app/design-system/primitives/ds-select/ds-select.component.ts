import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { DsIconComponent } from '../../icons/ds-icon.component';

export interface DsSelectOption {
  label: string;
  value: any;
  disabled?: boolean;
}

@Component({
  selector: 'ds-select',
  standalone: true,
  imports: [CommonModule, FormsModule, DsIconComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DsSelectComponent),
    multi: true,
  }],
  template: `
    <div class="ds-field" [class.ds-field--focused]="focused" [class.ds-field--error]="error" [class.ds-field--disabled]="disabled">
      @if (label) {
        <label class="ds-field__label" [attr.for]="inputId">{{ label }}</label>
      }
      <div class="ds-field__wrap">
        @if (prefixIcon) {
          <span class="ds-field__prefix" aria-hidden="true">
            <ds-icon [name]="prefixIcon" [size]="20"></ds-icon>
          </span>
        }
        
        <select
          #nativeSelect
          [id]="inputId"
          class="ds-field__input ds-field__select"
          [class.ds-field__input--has-prefix]="prefixIcon"
          [disabled]="disabled"
          [attr.aria-label]="ariaLabelSelect || null"
          [attr.aria-invalid]="error ? 'true' : null"
          [attr.aria-describedby]="error ? inputId + '-err' : null"
          [(ngModel)]="value"
          (focus)="onNativeFocus($event)"
          (blur)="onNativeBlur($event)"
          (ngModelChange)="onValueChange($event)">
          
          @if (placeholder) {
            <option [value]="null" disabled selected hidden>{{ placeholder }}</option>
          }
          
          <ng-content></ng-content>
          
          @for (option of options; track option.value) {
            <option [value]="option.value" [disabled]="option.disabled">
              {{ option.label }}
            </option>
          }
        </select>
        
        <span class="ds-field__suffix" aria-hidden="true">
          <ds-icon name="chevron-down" [size]="16"></ds-icon>
        </span>
      </div>
      @if (error) {
        <p class="ds-field__error" [id]="inputId + '-err'" role="alert">{{ error }}</p>
      }
    </div>
  `,
  styleUrls: ['./ds-select.component.scss'],
})
export class DsSelectComponent implements ControlValueAccessor {
  @ViewChild('nativeSelect') private nativeSelect?: ElementRef<HTMLSelectElement>;

  @Input() label: string | null = null;
  @Input() placeholder: string | null = null;
  @Input() options: DsSelectOption[] = [];
  @Input() disabled = false;
  @Input() error: string | null = null;
  @Input() prefixIcon: string | null = null;
  @Input() inputId = `ds-select-${Math.random().toString(36).slice(2, 7)}`;
  /** Libellé accessible sur le champ seul (sans label visuel). */
  @Input() ariaLabelSelect: string | null = null;

  @Output() dsFocus = new EventEmitter<FocusEvent>();
  @Output() dsBlur = new EventEmitter<FocusEvent>();
  @Output() valueChange = new EventEmitter<any>();

  value: any = null;
  focused = false;
  onChange = (_: any) => {};
  onTouched = () => {};

  focus(): void {
    this.nativeSelect?.nativeElement?.focus();
  }

  blur(): void {
    this.nativeSelect?.nativeElement?.blur();
  }

  onNativeFocus(event: FocusEvent): void {
    this.focused = true;
    this.dsFocus.emit(event);
  }

  onNativeBlur(event: FocusEvent): void {
    this.focused = false;
    this.onTouched();
    this.dsBlur.emit(event);
  }

  onValueChange(newValue: any): void {
    this.value = newValue;
    this.onChange(newValue);
    this.valueChange.emit(newValue);
  }

  writeValue(val: any): void { this.value = val; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }
}
