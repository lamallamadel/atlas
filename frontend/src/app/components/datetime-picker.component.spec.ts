import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule} from '@angular/forms';
import { DatetimePickerComponent } from './datetime-picker.component';
import { CommonModule } from '@angular/common';

describe('DatetimePickerComponent', () => {
  let component: DatetimePickerComponent;
  let fixture: ComponentFixture<DatetimePickerComponent>;
  let formBuilder: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        DatetimePickerComponent],
      providers: [FormBuilder]}).compileComponents();

    formBuilder = TestBed.inject(FormBuilder);
    fixture = TestBed.createComponent(DatetimePickerComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default input values', () => {
      expect(component.label()).toBe('Date et heure');
      expect(component.required()).toBe(false);
    });

    it('should accept custom input values', () => {
      fixture.componentRef.setInput('label', 'Custom Label');
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();

      expect(component.label()).toBe('Custom Label');
      expect(component.required()).toBe(true);
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
      fixture.componentRef.setInput('required', false);
      component.ngOnInit();

      const dateControl = component.form.get('date');
      const timeControl = component.form.get('time');

      expect(dateControl?.hasError('required')).toBe(false);
      expect(timeControl?.hasError('required')).toBe(false);
    });

    it('should create form with required validators when required', () => {
      fixture.componentRef.setInput('required', true);
      component.ngOnInit();

      component.form.get('date')?.markAsTouched();
      component.form.get('time')?.markAsTouched();
      component.form.updateValueAndValidity();

      const dateControl = component.form.get('date');
      const timeControl = component.form.get('time');

      expect(dateControl?.hasError('required')).toBe(true);
      expect(timeControl?.hasError('required')).toBe(true);
    });

  });

  describe('ControlValueAccessor - writeValue', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should handle null value', () => {
      component.writeValue(null);

      expect(component.form.get('date')?.value).toBe('');
      expect(component.form.get('time')?.value).toBe('');
    });

    it('should handle empty string value', () => {
      component.writeValue('');

      expect(component.form.get('date')?.value).toBe('');
      expect(component.form.get('time')?.value).toBe('');
    });

    it('should parse and set valid datetime-local string', () => {
      component.writeValue('2024-06-15T14:30');

      const dateValue = component.form.get('date')?.value;
      const timeValue = component.form.get('time')?.value;

      expect(dateValue).toBe('2024-06-15');
      expect(timeValue).toBe('14:30');
    });

    it('should handle writeValue before form initialization', () => {
      const newComponent = TestBed.runInInjectionContext(
        () => new DatetimePickerComponent(formBuilder)
      );
      newComponent.writeValue('2024-06-15T14:30');

      // Form should not exist yet
      expect(newComponent.form).toBeUndefined();

      // After init, pending value should be applied
      newComponent.ngOnInit();

      const timeValue = newComponent.form.get('time')?.value;
      expect(timeValue).toBe('14:30');
    });

    it('should not emit change event when writing value', () => {
      const onChangeSpy = vi.fn();
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
      const onChangeSpy = vi.fn();
      component.registerOnChange(onChangeSpy);

      component.form.get('date')?.setValue('2024-06-15');
      component.form.get('time')?.setValue('14:30');

      expect(onChangeSpy).toHaveBeenCalled();
    });

    it('should emit datetime-local format string on valid input', () => {
      let emittedValue = '';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      component.form.get('date')?.setValue('2024-06-15');
      component.form.get('time')?.setValue('14:30');

      expect(emittedValue).toBe('2024-06-15T14:30');
    });

    it('should emit empty string when date is missing', () => {
      let emittedValue = '';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      component.form.get('date')?.setValue('');
      component.form.get('time')?.setValue('14:30');

      expect(emittedValue).toBe('');
    });

    it('should emit empty string when time is missing', () => {
      let emittedValue = '';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      component.form.get('date')?.setValue('2024-06-15');
      component.form.get('time')?.setValue('');

      expect(emittedValue).toBe('');
    });
  });

  describe('ControlValueAccessor - registerOnTouched', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should register onTouched callback', () => {
      const onTouchedSpy = vi.fn();
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
      const onChangeSpy = vi.fn();
      component.registerOnChange(onChangeSpy);

      component.setDisabledState(true);

      expect(onChangeSpy).not.toHaveBeenCalled();
    });

    it('should handle setDisabledState before form initialization gracefully', () => {
      const newComponent = TestBed.runInInjectionContext(
        () => new DatetimePickerComponent(formBuilder)
      );

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
      fixture.componentRef.setInput('required', false);
      const control = new FormControl();

      const errors = component.validate(control);

      expect(errors).toBeNull();
    });

    it('should return required error when required and date is missing', () => {
      fixture.componentRef.setInput('required', true);
      component.ngOnInit(); // Re-initialize with required = true
      const control = new FormControl();

      component.form.get('date')?.setValue('');
      component.form.get('time')?.setValue('14:30');

      const errors = component.validate(control);

      expect(errors).toEqual({ required: true });
    });

    it('should return required error when required and time is missing', () => {
      fixture.componentRef.setInput('required', true);
      component.ngOnInit(); // Re-initialize with required = true
      const control = new FormControl();

      component.form.get('date')?.setValue('2024-06-15');
      component.form.get('time')?.setValue('');

      const errors = component.validate(control);

      expect(errors).toEqual({ required: true });
    });

    it('should return null when both date and time are valid', () => {
      const control = new FormControl();

      component.form.get('date')?.setValue('2024-06-15');
      component.form.get('time')?.setValue('14:30');

      const errors = component.validate(control);

      expect(errors).toBeNull();
    });

    it('should handle validate before form initialization', () => {
      const newComponent = TestBed.runInInjectionContext(
        () => new DatetimePickerComponent(formBuilder)
      );
      const control = new FormControl();

      const errors = newComponent.validate(control);

      expect(errors).toBeNull();
    });
  });

  describe('Integration with FormControl', () => {
    let testForm: FormGroup;

    beforeEach(() => {
      component.ngOnInit();
      testForm = formBuilder.group({
        datetime: ['']});
    });

    it('should work as part of reactive form', () => {
      const onChangeSpy = vi.fn();
      component.registerOnChange(onChangeSpy);

      testForm.get('datetime')?.setValue('2024-06-15T14:30');
      component.writeValue(testForm.get('datetime')?.value);

      expect(component.form.get('date')?.value).toBe('2024-06-15');
      expect(component.form.get('time')?.value).toBe('14:30');
    });

    it('should update parent form when value changes', () => {
      component.registerOnChange((value: string) => {
        testForm.get('datetime')?.setValue(value, { emitEvent: false });
      });

      component.form.get('date')?.setValue('2024-06-15');
      component.form.get('time')?.setValue('14:30');

      expect(testForm.get('datetime')?.value).toBe('2024-06-15T14:30');
    });
  });

  describe('Cleanup', () => {
    it('should complete destroy$ subject on ngOnDestroy', () => {
      component.ngOnInit();
      const destroySpy = vi.fn();
      component['destroy$'].subscribe({
        complete: destroySpy});

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
    });

    it('should unsubscribe from form changes on destroy', () => {
      component.ngOnInit();
      const onChangeSpy = vi.fn();
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
      expect(typeof dateValue).toBe('string');
      expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should emit combined datetime string on valid string inputs', () => {
      let emittedValue = '';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      component.form.get('date')?.setValue('2024-01-05');
      component.form.get('time')?.setValue('09:05');

      expect(emittedValue).toBe('2024-01-05T09:05');
    });

    it('should emit empty string when either field is missing', () => {
      let emittedValue = 'initial';
      component.registerOnChange((value: string) => {
        emittedValue = value;
      });

      component.form.get('date')?.setValue('');
      component.form.get('time')?.setValue('09:05');

      expect(emittedValue).toBe('');
    });
  });
});
