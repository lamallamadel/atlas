import {
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  input
} from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

/**
 * Atlasia V2 styled Date+Time field using native HTML5 inputs.
 * Outputs the same string format as native <input type="datetime-local">: YYYY-MM-DDTHH:mm
 */
@Component({
    selector: 'app-datetime-picker',
    templateUrl: './datetime-picker.component.html',
    styleUrls: ['./datetime-picker.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DatetimePickerComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => DatetimePickerComponent),
            multi: true
        }
    ],
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class DatetimePickerComponent
  implements ControlValueAccessor, Validator, OnInit, OnDestroy
{
  readonly label = input('Date et heure');
  readonly required = input(false);

  form!: FormGroup;

  private pendingValue: string | null = null;

  private destroy$ = new Subject<void>();
  private onChange: (value: string) => void = (_value) => {};
  private onTouched: () => void = () => {};

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      date: ['', this.required() ? [Validators.required] : []],
      time: ['', this.required() ? [Validators.required] : []]
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const value = this.buildLocalDateTimeString();
      this.onChange(value);
    });

    if (this.pendingValue !== null) {
      const v = this.pendingValue;
      this.pendingValue = null;
      this.writeValue(v);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  writeValue(value: string | null): void {
    if (!this.form) {
      this.pendingValue = value;
      return;
    }

    if (!value) {
      this.form.setValue({ date: '', time: '' }, { emitEvent: false });
      return;
    }

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      this.form.setValue({ date: '', time: '' }, { emitEvent: false });
      return;
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');

    this.form.setValue(
      {
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${min}`
      },
      { emitEvent: false }
    );
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (!this.form) return;
    if (isDisabled) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  }

  validate(_: AbstractControl): ValidationErrors | null {
    if (!this.form) return null;
    const dateCtrl = this.form.get('date');
    const timeCtrl = this.form.get('time');
    if (this.required() && (!dateCtrl?.value || !timeCtrl?.value)) {
      return { required: true };
    }
    return null;
  }

  markTouched(): void {
    if (this.onTouched) this.onTouched();
    if (this.form) this.form.markAllAsTouched();
  }

  private buildLocalDateTimeString(): string {
    if (!this.form) return '';
    const date: string = this.form.get('date')?.value || '';
    const time: string = this.form.get('time')?.value || '';

    if (!date || !time) {
      return '';
    }

    return `${date}T${time}`;
  }
}
