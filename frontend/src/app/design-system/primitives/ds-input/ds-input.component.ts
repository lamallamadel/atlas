import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'ds-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DsInputComponent),
    multi: true,
  }],
  template: `
    <div class="ds-field" [class.ds-field--focused]="focused" [class.ds-field--error]="error">
      @if (label) {
        <label class="ds-field__label" [attr.for]="inputId">{{ label }}</label>
      }
      <div class="ds-field__wrap">
        @if (prefixIcon) {
          <span class="ds-field__prefix" aria-hidden="true" [innerHTML]="prefixIcon"></span>
        }
        <input
          [id]="inputId"
          class="ds-field__input"
          [class.ds-field__input--has-prefix]="prefixIcon"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [attr.aria-invalid]="error ? 'true' : null"
          [attr.aria-describedby]="error ? inputId + '-err' : null"
          [(ngModel)]="value"
          (focus)="focused = true"
          (blur)="focused = false; onTouched()"
          (ngModelChange)="onChange($event)" />
      </div>
      @if (error) {
        <p class="ds-field__error" [id]="inputId + '-err'" role="alert">{{ error }}</p>
      }
    </div>
  `,
  styleUrls: ['./ds-input.component.scss'],
})
export class DsInputComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() disabled = false;
  @Input() error: string | null = null;
  @Input() prefixIcon: string | null = null;
  @Input() inputId = `ds-input-${Math.random().toString(36).slice(2, 7)}`;

  value = '';
  focused = false;
  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(val: any): void { this.value = val ?? ''; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }
}
