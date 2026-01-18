import {
  Component,
  forwardRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  Validators
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

/**
 * Mat-styled Date+Time field that outputs the same string format as native
 * <input type="datetime-local">: YYYY-MM-DDTHH:mm
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
  ]
})
export class DatetimePickerComponent
  implements ControlValueAccessor, Validator, OnInit, OnDestroy
{
  @Input() label = 'Date et heure';
  @Input() required = false;
  @Input() datePlaceholder = 'jj/mm/aaaa';
  @Input() timePlaceholder = 'hh:mm';

  form!: FormGroup;

  private pendingValue: string | null = null;

  private destroy$ = new Subject<void>();
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      date: [null, this.required ? [Validators.required] : []],
      time: [
        '',
        this.required
          ? [Validators.required, DatetimePickerComponent.timeValidator]
          : [DatetimePickerComponent.timeValidator]
      ]
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
      this.form.setValue({ date: null, time: '' }, { emitEvent: false });
      return;
    }

    const parsed = this.parseIncoming(value);
    this.form.setValue(
      {
        date: parsed?.date ?? null,
        time: parsed?.time ?? ''
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
    if (this.required && (!dateCtrl?.value || !timeCtrl?.value)) {
      return { required: true };
    }
    if (timeCtrl?.hasError('invalidTime')) {
      return { invalidTime: true };
    }
    return null;
  }

  markTouched(): void {
    this.onTouched();
    this.form.markAllAsTouched();
  }

  get showRequiredError(): boolean {
    return (
      this.form.touched &&
      this.required &&
      (!this.form.get('date')?.value || !this.form.get('time')?.value)
    );
  }

  get showInvalidTimeError(): boolean {
    return this.form.touched && !!this.form.get('time')?.hasError('invalidTime');
  }

  private buildLocalDateTimeString(): string {
    const date: Date | null = this.form.get('date')?.value ?? null;
    const time: string = this.form.get('time')?.value ?? '';

    if (!date || !time || !DatetimePickerComponent.isValidTime(time)) {
      return '';
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const [hh, min] = time.split(':');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  private parseIncoming(value: string): { date: Date; time: string } | null {
    // Accept either "YYYY-MM-DDTHH:mm" or full ISO strings.
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return { date: d, time: `${hours}:${minutes}` };
  }

  static timeValidator(control: AbstractControl): ValidationErrors | null {
    const v = (control.value ?? '').toString().trim();
    if (!v) return null;
    return DatetimePickerComponent.isValidTime(v) ? null : { invalidTime: true };
  }

  static isValidTime(v: string): boolean {
    if (!/^\d{2}:\d{2}$/.test(v)) return false;
    const [hh, mm] = v.split(':').map(Number);
    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
  }
}
