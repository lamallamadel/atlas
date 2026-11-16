import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { DsIconComponent } from '../../icons/ds-icon.component';

@Component({
  selector: 'ds-input',
  standalone: true,
  imports: [CommonModule, FormsModule, DsIconComponent],
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
          <span class="ds-field__prefix" aria-hidden="true">
            <ds-icon [name]="prefixIcon" [size]="16"></ds-icon>
          </span>
        }
        <input
          #nativeInput
          [id]="inputId"
          class="ds-field__input"
          [class.ds-field__input--has-prefix]="prefixIcon"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [attr.aria-label]="ariaLabelInput || null"
          [attr.aria-invalid]="error ? 'true' : null"
          [attr.aria-describedby]="error ? inputId + '-err' : null"
          [attr.aria-expanded]="ariaExpanded === null ? null : ariaExpanded"
          [attr.aria-controls]="ariaControls || null"
          [attr.aria-autocomplete]="ariaAutocomplete || null"
          [(ngModel)]="value"
          (focus)="onNativeFocus($event)"
          (blur)="onNativeBlur($event)"
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
  @ViewChild('nativeInput') private nativeInput?: ElementRef<HTMLInputElement>;

  @Input() label: string | null = null;
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() disabled = false;
  @Input() error: string | null = null;
  @Input() prefixIcon: string | null = null;
  @Input() inputId = `ds-input-${Math.random().toString(36).slice(2, 7)}`;
  /** Libellé accessible sur le champ seul (sans label visuel). */
  @Input() ariaLabelInput: string | null = null;
  @Input() ariaExpanded: boolean | null = null;
  @Input() ariaControls: string | null = null;
  @Input() ariaAutocomplete: string | null = null;

  @Output() dsFocus = new EventEmitter<FocusEvent>();
  @Output() dsBlur = new EventEmitter<FocusEvent>();

  value = '';
  focused = false;
  onChange = (_: any) => {};
  onTouched = () => {};

  focus(): void {
    this.nativeInput?.nativeElement?.focus();
  }

  blur(): void {
    this.nativeInput?.nativeElement?.blur();
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

  writeValue(val: any): void { this.value = val ?? ''; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }
}
