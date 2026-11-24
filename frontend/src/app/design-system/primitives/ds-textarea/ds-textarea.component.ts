import {
  Component, Input, Output, EventEmitter, forwardRef,
  ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export type DsTextareaResize = 'none' | 'vertical' | 'horizontal' | 'both' | 'auto';

@Component({
  selector: 'ds-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DsTextareaComponent),
    multi: true,
  }],
  template: `
    <div class="ds-field" [class.ds-field--focused]="focused" [class.ds-field--error]="error" [class.ds-field--disabled]="disabled">
      @if (label) {
        <label class="ds-field__label" [attr.for]="inputId">{{ label }}</label>
      }
      <div class="ds-field__wrap">
        <textarea
          #nativeTextarea
          [id]="inputId"
          class="ds-field__textarea"
          [class.ds-field__textarea--auto]="resize === 'auto'"
          [style.resize]="resize === 'auto' ? 'none' : resize"
          [rows]="rows"
          [attr.maxlength]="maxLength"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [attr.aria-label]="ariaLabelTextarea || null"
          [attr.aria-invalid]="error ? 'true' : null"
          [attr.aria-describedby]="describedByIds"
          [(ngModel)]="value"
          (focus)="onNativeFocus($event)"
          (blur)="onNativeBlur($event)"
          (ngModelChange)="onValueChange($event)"></textarea>
      </div>
      <div class="ds-field__footer" [class.ds-field__footer--solo]="!error && !showCount">
        @if (error) {
          <p class="ds-field__error" [id]="inputId + '-err'" role="alert">{{ error }}</p>
        }
        @if (showCount && maxLength !== null && maxLength !== undefined) {
          <span class="ds-field__count" [id]="inputId + '-count'" [class.ds-field__count--over]="(value?.length || 0) >= maxLength">
            {{ value?.length || 0 }} / {{ maxLength }}
          </span>
        }
      </div>
    </div>
  `,
  styleUrls: ['./ds-textarea.component.scss'],
})
export class DsTextareaComponent implements ControlValueAccessor, AfterViewInit, OnChanges {
  @ViewChild('nativeTextarea') private nativeTextarea?: ElementRef<HTMLTextAreaElement>;

  @Input() label: string | null = null;
  @Input() placeholder = '';
  @Input() rows = 4;
  @Input() maxLength: number | null = null;
  @Input() showCount = false;
  @Input() resize: DsTextareaResize = 'vertical';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() error: string | null = null;
  @Input() inputId = `ds-textarea-${Math.random().toString(36).slice(2, 7)}`;
  /** Libellé accessible sur le champ seul (sans label visuel). */
  @Input() ariaLabelTextarea: string | null = null;

  @Output() dsFocus = new EventEmitter<FocusEvent>();
  @Output() dsBlur = new EventEmitter<FocusEvent>();
  @Output() valueChange = new EventEmitter<string>();

  value = '';
  focused = false;
  onChange = (_: any) => {};
  onTouched = () => {};

  get describedByIds(): string | null {
    const ids: string[] = [];
    if (this.error) ids.push(`${this.inputId}-err`);
    if (this.showCount && this.maxLength != null) ids.push(`${this.inputId}-count`);
    return ids.length ? ids.join(' ') : null;
  }

  ngAfterViewInit(): void {
    if (this.resize === 'auto') {
      this.autoResize();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resize'] && this.resize === 'auto') {
      queueMicrotask(() => this.autoResize());
    }
  }

  focus(): void {
    this.nativeTextarea?.nativeElement?.focus();
  }

  blur(): void {
    this.nativeTextarea?.nativeElement?.blur();
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

  onValueChange(newValue: string): void {
    this.value = newValue ?? '';
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    if (this.resize === 'auto') {
      this.autoResize();
    }
  }

  private autoResize(): void {
    const el = this.nativeTextarea?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  writeValue(val: any): void {
    this.value = val ?? '';
    if (this.resize === 'auto') {
      queueMicrotask(() => this.autoResize());
    }
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }
}
