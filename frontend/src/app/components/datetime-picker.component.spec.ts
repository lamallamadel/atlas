import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DatetimePickerComponent } from './datetime-picker.component';
import { CommonModule } from '@angular/common';

describe('DatetimePickerComponent', () => {
  let component: DatetimePickerComponent;
  let fixture: ComponentFixture<DatetimePickerComponent>;
  let formBuilder: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DatetimePickerComponent],
      imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        BrowserAnimationsModule
      ],
      providers: [FormBuilder]
    }).compileComponents();

    formBuilder = TestBed.inject(FormBuilder);
    fixture = TestBed.createComponent(DatetimePickerComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default input values', () => {
      expect(component.label).toBe('Date et heure');
      expect(component.required).toBe(false);
      expect(component.datePlaceholder).toBe('jj/mm/aaaa');
      expect(component.timePlaceholder).toBe('hh:mm');
    });

    it('should accept custom input values', () => {
      component.label = 'Custom Label';
      component.required = true;
      component.datePlaceholder = 'dd/mm/yyyy';
      component.timePlaceholder = 'HH:MM';
      fixture.detectChanges();

      expect(component.label).toBe('Custom Label');
      expect(component.required).toBe(true);
      expect(component.datePlaceholder).toBe('dd/mm/yyyy');
      expect(component.timePlaceholder).toBe('HH:MM');
    });
  });

  describe('Form Initialization', () => {
    it('should initialize form on ngOnInit', () => {
      expect(component.form).toBeUndefined();
      component.ngOnInit();
      expect(component.form).toBeDefined();
      expect(component.form.get('date')).toBeDefined();
      expect(component.form.get('time')).toBeDefined();
    });

    it('should create form with no validators when not required', () => {
      component.required = false;
      component.ngOnInit();

      const dateControl = component.form.get('date');
      const timeControl = component.form.get('time');

      expect(dateControl?.hasError('required')).toBe(false);
      expect(timeControl?.hasError('required')).toBe(false);
    });

    it('should create form with required validators when required', () => {
      component.required = true;
      component.ngOnInit();

      component.form.get('date')?.markAsTouched();
      component.form.get('time')?.markAsTouched();
      component.form.updateValueAndValidity();

      const dateControl = component.form.get('date');
      const timeControl = component.form.get('time');

      expect(dateControl?.hasError('required')).toBe(true);
      expect(timeControl?.hasError('required')).toBe(true);
    });

    it('should add time validator to time control', () => {
      component.ngOnInit();

      const timeControl = component.form.get('time');
      timeControl?.setValue('invalid');

      expect(timeControl?.hasError('invalidTime')).toBe(true);
    });
  });

  describe('ControlValueAccessor - writeValue', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle null value', () => {
      component.writeValue(null);

      expect(component.form.get('date')?.value).toBeNull();
      expect(component.form.get('time')?.value).toBe('');
    });

    it('should handle empty string value', () => {
      component.writeValue('');

      expect(component.form.get('date')?.value).toBeNull();
      expect(component.form.get('time')?.value).toBe('');
    });

    it('should parse and set valid datetime-local string', () => {
      component.writeValue('2024-06-15T14:30');

      const dateValue = component.form.get('date')?.value;
      const timeValue = component.form.get('time')?.value;

      expect(dateValue).toBeInstanceOf(Date);
      expect(dateValue?.getFullYear()).toBe(2024);
      expect(dateValue?.getMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(dateValue?.getDate()).toBe(15);
      expect(timeValue).toBe('14:30');
    });

    it('should parse and set ISO datetime string', () => {
      component.writeValue('2024-12-25T09:45:00.000Z');

      const dateValue = component.form.get('date')?.value;
      const timeValue = component.form.get('time')?.value;

      expect(dateValue).toBeInstanceOf(Date);
      expect(timeValue).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle writeValue before form initialization', () => {
      const newComponent = new DatetimePickerComponent(formBuilder);
      newComponent.writeValue('2024-06-15T14:30');

      // Form should not exist yet
      expect(newComponent.form).toBeUndefined();

      // After init, pending value should be applied
      newComponent.ngOnInit();

      const timeValue = newComponent.form.get('time')?.value;
      expect(timeValue).toBe('14:30');
    });

    it('should not emit change event when writing value', () => {
      const onChangeSpy = jasmine.createSpy('onChange');
      component.registerOnChange(onChangeSpy);

      component.writeValue('2024-06-15T14:30');

      expect(onChangeSpy).not.toHaveBeenCalled();
    });
  });

  describe('ControlValueAccessor - registerOnChange', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should register onChange callback', () => {
      const onChangeSpy = jasmine.createSpy('onChange');
      component.registerOnChange(onChangeSpy);

      component.form.get('date')?.setValue(new Date(2024, 5, 15));
      component.form.get('time')?.setValue('14:30');

      expect(onChangeSpy).toHaveBeenCalled();
    });

    it('should emit datetime-local format string on valid input', () => {
      let emittedValue  = '';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      const testDate = new Date(2024, 5, 15); // June 15, 2024
      component.form.get('date')?.setValue(testDate);
      component.form.get('time')?.setValue('14:30');

      expect(emittedValue).toBe('2024-06-15T14:30');
    });

    it('should emit empty string when date is missing', () => {
      let emittedValue  = '';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      component.form.get('date')?.setValue(null);
      component.form.get('time')?.setValue('14:30');

      expect(emittedValue).toBe('');
    });

    it('should emit empty string when time is missing', () => {
      let emittedValue  = '';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      component.form.get('date')?.setValue(new Date(2024, 5, 15));
      component.form.get('time')?.setValue('');

      expect(emittedValue).toBe('');
    });

    it('should emit empty string when time is invalid', () => {
      let emittedValue  = '';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      component.form.get('date')?.setValue(new Date(2024, 5, 15));
      component.form.get('time')?.setValue('25:99');

      expect(emittedValue).toBe('');
    });
  });

  describe('ControlValueAccessor - registerOnTouched', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should register onTouched callback', () => {
      const onTouchedSpy = jasmine.createSpy('onTouched');
      component.registerOnTouched(onTouchedSpy);

      component.markTouched();

      expect(onTouchedSpy).toHaveBeenCalled();
    });

    it('should mark form as touched when markTouched is called', () => {
      component.markTouched();

      expect(component.form.touched).toBe(true);
    });
  });

  describe('ControlValueAccessor - setDisabledState', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should disable form when setDisabledState(true)', () => {
      component.setDisabledState(true);

      expect(component.form.disabled).toBe(true);
      expect(component.form.get('date')?.disabled).toBe(true);
      expect(component.form.get('time')?.disabled).toBe(true);
    });

    it('should enable form when setDisabledState(false)', () => {
      component.form.disable();
      component.setDisabledState(false);

      expect(component.form.enabled).toBe(true);
      expect(component.form.get('date')?.enabled).toBe(true);
      expect(component.form.get('time')?.enabled).toBe(true);
    });

    it('should not emit change event when setting disabled state', () => {
      const onChangeSpy = jasmine.createSpy('onChange');
      component.registerOnChange(onChangeSpy);

      component.setDisabledState(true);

      expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('should handle setDisabledState before form initialization gracefully', () => {
      const newComponent = new DatetimePickerComponent(formBuilder);

      expect(() => {
        newComponent.setDisabledState(true);
      }).not.toThrow();
    });
  });

  describe('Validator Implementation', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should return null when form is valid and not required', () => {
      component.required = false;
      const control = new FormControl();

      const errors = component.validate(control);

      expect(errors).toBeNull();
    });

    it('should return required error when required and date is missing', () => {
      component.required = true;
      component.ngOnInit(); // Re-initialize with required = true
      const control = new FormControl();

      component.form.get('date')?.setValue(null);
      component.form.get('time')?.setValue('14:30');

      const errors = component.validate(control);

      expect(errors).toEqual({ required: true });
    });

    it('should return required error when required and time is missing', () => {
      component.required = true;
      component.ngOnInit(); // Re-initialize with required = true
      const control = new FormControl();

      component.form.get('date')?.setValue(new Date());
      component.form.get('time')?.setValue('');

      const errors = component.validate(control);

      expect(errors).toEqual({ required: true });
    });

    it('should return invalidTime error when time format is invalid', () => {
      const control = new FormControl();

      component.form.get('date')?.setValue(new Date());
      component.form.get('time')?.setValue('25:99');

      const errors = component.validate(control);

      expect(errors).toEqual({ invalidTime: true });
    });

    it('should return null when both date and time are valid', () => {
      const control = new FormControl();

      component.form.get('date')?.setValue(new Date());
      component.form.get('time')?.setValue('14:30');

      const errors = component.validate(control);

      expect(errors).toBeNull();
    });

    it('should handle validate before form initialization', () => {
      const newComponent = new DatetimePickerComponent(formBuilder);
      const control = new FormControl();

      const errors = newComponent.validate(control);

      expect(errors).toBeNull();
    });
  });

  describe('Form Validation - Time Validator', () => {
    it('should validate correct time format HH:mm', () => {
      const control = new FormControl('14:30');
      const errors = DatetimePickerComponent.timeValidator(control);

      expect(errors).toBeNull();
    });

    it('should accept valid time ranges', () => {
      const validTimes = ['00:00', '12:00', '23:59', '09:15'];

      validTimes.forEach(time => {
        const control = new FormControl(time);
        const errors = DatetimePickerComponent.timeValidator(control);
        expect(errors).toBeNull();
      });
    });

    it('should reject invalid hours', () => {
      const control = new FormControl('24:00');
      const errors = DatetimePickerComponent.timeValidator(control);

      expect(errors).toEqual({ invalidTime: true });
    });

    it('should reject invalid minutes', () => {
      const control = new FormControl('12:60');
      const errors = DatetimePickerComponent.timeValidator(control);

      expect(errors).toEqual({ invalidTime: true });
    });

    it('should reject incorrect format', () => {
      const invalidFormats = ['1:30', '14:3', '14-30', '14.30', 'invalid'];

      invalidFormats.forEach(time => {
        const control = new FormControl(time);
        const errors = DatetimePickerComponent.timeValidator(control);
        expect(errors).toEqual({ invalidTime: true });
      });
    });

    it('should accept empty string', () => {
      const control = new FormControl('');
      const errors = DatetimePickerComponent.timeValidator(control);

      expect(errors).toBeNull();
    });

    it('should accept null value', () => {
      const control = new FormControl(null);
      const errors = DatetimePickerComponent.timeValidator(control);

      expect(errors).toBeNull();
    });
  });

  describe('Time Validation Helper', () => {
    it('should validate correct time format', () => {
      expect(DatetimePickerComponent.isValidTime('14:30')).toBe(true);
      expect(DatetimePickerComponent.isValidTime('00:00')).toBe(true);
      expect(DatetimePickerComponent.isValidTime('23:59')).toBe(true);
    });

    it('should reject invalid hours', () => {
      expect(DatetimePickerComponent.isValidTime('24:00')).toBe(false);
      expect(DatetimePickerComponent.isValidTime('25:30')).toBe(false);
      expect(DatetimePickerComponent.isValidTime('-1:30')).toBe(false);
    });

    it('should reject invalid minutes', () => {
      expect(DatetimePickerComponent.isValidTime('12:60')).toBe(false);
      expect(DatetimePickerComponent.isValidTime('12:99')).toBe(false);
      expect(DatetimePickerComponent.isValidTime('12:-1')).toBe(false);
    });

    it('should reject invalid format', () => {
      expect(DatetimePickerComponent.isValidTime('1:30')).toBe(false);
      expect(DatetimePickerComponent.isValidTime('14:3')).toBe(false);
      expect(DatetimePickerComponent.isValidTime('14-30')).toBe(false);
      expect(DatetimePickerComponent.isValidTime('invalid')).toBe(false);
    });
  });

  describe('Error Display Getters', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should show required error when touched and required fields are empty', () => {
      component.required = true;
      component.ngOnInit(); // Re-initialize with required = true
      component.form.markAsTouched();

      expect(component.showRequiredError).toBe(true);
    });

    it('should not show required error when not touched', () => {
      component.required = true;
      component.ngOnInit(); // Re-initialize with required = true

      expect(component.showRequiredError).toBe(false);
    });

    it('should not show required error when fields are filled', () => {
      component.required = true;
      component.ngOnInit(); // Re-initialize with required = true
      component.form.markAsTouched();
      component.form.get('date')?.setValue(new Date());
      component.form.get('time')?.setValue('14:30');

      expect(component.showRequiredError).toBe(false);
    });

    it('should show invalid time error when time format is wrong', () => {
      component.form.markAsTouched();
      component.form.get('time')?.setValue('25:99');
      component.form.get('time')?.updateValueAndValidity();

      expect(component.showInvalidTimeError).toBe(true);
    });

    it('should not show invalid time error when not touched', () => {
      component.form.get('time')?.setValue('25:99');

      expect(component.showInvalidTimeError).toBe(false);
    });

    it('should not show invalid time error when time is valid', () => {
      component.form.markAsTouched();
      component.form.get('time')?.setValue('14:30');

      expect(component.showInvalidTimeError).toBe(false);
    });
  });

  describe('Integration with FormControl', () => {
    let testForm: FormGroup;

    beforeEach(() => {
      component.ngOnInit();
      testForm = formBuilder.group({
        datetime: ['']
      });
    });

    it('should work as part of reactive form', () => {
      const onChangeSpy = jasmine.createSpy('onChange');
      component.registerOnChange(onChangeSpy);

      testForm.get('datetime')?.setValue('2024-06-15T14:30');
      component.writeValue(testForm.get('datetime')?.value);

      expect(component.form.get('date')?.value).toBeInstanceOf(Date);
      expect(component.form.get('time')?.value).toBe('14:30');
    });

    it('should update parent form when value changes', () => {
      component.registerOnChange((value: string) => {
        testForm.get('datetime')?.setValue(value, { emitEvent: false });
      });

      component.form.get('date')?.setValue(new Date(2024, 5, 15));
      component.form.get('time')?.setValue('14:30');

      expect(testForm.get('datetime')?.value).toBe('2024-06-15T14:30');
    });
  });

  describe('Accessibility Features', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should render aria-label for required indicator', () => {
      component.required = true;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const requiredSpan = compiled.querySelector('.required');

      expect(requiredSpan?.getAttribute('aria-label')).toBe('obligatoire');
    });

    it('should render error container with aria-live', () => {
      const compiled = fixture.nativeElement;
      const errorContainer = compiled.querySelector('.datetime-errors');

      expect(errorContainer?.getAttribute('aria-live')).toBe('polite');
    });

    it('should display required error message when validation fails', () => {
      component.required = true;
      component.ngOnInit();
      component.form.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorMessage = compiled.querySelector('.datetime-error');

      expect(errorMessage?.textContent).toContain('Ce champ est requis');
    });

    it('should display invalid time error message', () => {
      component.form.markAsTouched();
      component.form.get('time')?.setValue('25:99');
      component.form.get('time')?.updateValueAndValidity();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorMessage = compiled.querySelector('.datetime-error');

      expect(errorMessage?.textContent).toContain('Heure invalide (format HH:mm)');
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should render date and time fields in separate form fields', () => {
      const compiled = fixture.nativeElement;
      const dateField = compiled.querySelector('.date-part');
      const timeField = compiled.querySelector('.time-part');

      expect(dateField).toBeTruthy();
      expect(timeField).toBeTruthy();
    });

    it('should render datetime-row container for layout', () => {
      const compiled = fixture.nativeElement;
      const row = compiled.querySelector('.datetime-row');

      expect(row).toBeTruthy();
    });

    it('should display custom label', () => {
      component.label = 'Rendez-vous';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const label = compiled.querySelector('.datetime-label span');

      expect(label?.textContent).toBe('Rendez-vous');
    });

    it('should apply custom placeholders', () => {
      component.datePlaceholder = 'Select date';
      component.timePlaceholder = 'Select time';
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const dateInput = compiled.querySelector('input[formControlName="date"]');
      const timeInput = compiled.querySelector('input[formControlName="time"]');

      expect(dateInput?.getAttribute('placeholder')).toBe('Select date');
      expect(timeInput?.getAttribute('placeholder')).toBe('Select time');
    });
  });

  describe('Cleanup', () => {
    it('should complete destroy$ subject on ngOnDestroy', () => {
      component.ngOnInit();
      const destroySpy = jasmine.createSpy('destroy');
      component['destroy$'].subscribe({
        complete: destroySpy
      });

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
    });

    it('should unsubscribe from form changes on destroy', () => {
      component.ngOnInit();
      const onChangeSpy = jasmine.createSpy('onChange');
      component.registerOnChange(onChangeSpy);

      component.ngOnDestroy();

      // Changes after destroy should not trigger callback
      component.form.get('date')?.setValue(new Date());

      expect(onChangeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle timezone differences in date parsing', () => {
      const isoString = '2024-06-15T14:30:00.000Z';
      component.writeValue(isoString);

      const dateValue = component.form.get('date')?.value;
      expect(dateValue).toBeInstanceOf(Date);
    });

    it('should pad single digit months and days with zeros', () => {
      let emittedValue = '';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      const testDate = new Date(2024, 0, 5); // January 5, 2024
      component.form.get('date')?.setValue(testDate);
      component.form.get('time')?.setValue('09:05');

      expect(emittedValue).toBe('2024-01-05T09:05');
    });

    it('should handle year boundary dates correctly', () => {
      let emittedValue = '';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      const testDate = new Date(2024, 11, 31); // December 31, 2024
      component.form.get('date')?.setValue(testDate);
      component.form.get('time')?.setValue('23:59');

      expect(emittedValue).toBe('2024-12-31T23:59');
    });

    it('should handle leap year dates', () => {
      let emittedValue = '';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      const testDate = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      component.form.get('date')?.setValue(testDate);
      component.form.get('time')?.setValue('12:00');

      expect(emittedValue).toBe('2024-02-29T12:00');
    });

    it('should handle midnight time', () => {
      expect(DatetimePickerComponent.isValidTime('00:00')).toBe(true);
    });

    it('should handle end of day time', () => {
      expect(DatetimePickerComponent.isValidTime('23:59')).toBe(true);
    });
  });
});
