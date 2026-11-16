import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DsSelectComponent, DsSelectOption } from './ds-select.component';

describe('DsSelectComponent', () => {
  let component: DsSelectComponent;
  let fixture: ComponentFixture<DsSelectComponent>;

  const SAMPLE_OPTIONS: DsSelectOption[] = [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
    { value: 'three', label: 'Three', disabled: true },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsSelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DsSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with defaults', () => {
    expect(component).toBeTruthy();
    expect(component.options).toEqual([]);
    expect(component.disabled).toBe(false);
    expect(component.value).toBeNull();
    expect(component.inputId).toMatch(/^ds-select-/);
  });

  describe('options', () => {
    it('renders one <option> per option input', () => {
      fixture.componentRef.setInput('options', SAMPLE_OPTIONS);
      fixture.detectChanges();
      const options = fixture.debugElement.queryAll(By.css('option:not([hidden])'));
      expect(options.length).toBe(3);
      expect(options[0].nativeElement.textContent.trim()).toBe('One');
      expect(options[2].nativeElement.textContent.trim()).toBe('Three');
    });

    it('marks disabled options as disabled', () => {
      fixture.componentRef.setInput('options', SAMPLE_OPTIONS);
      fixture.detectChanges();
      const options = fixture.debugElement.queryAll(By.css('option:not([hidden])'));
      expect((options[2].nativeElement as HTMLOptionElement).disabled).toBe(true);
      expect((options[0].nativeElement as HTMLOptionElement).disabled).toBe(false);
    });
  });

  describe('placeholder', () => {
    it('does not render placeholder option by default', () => {
      const placeholderOption = fixture.debugElement.query(By.css('option[hidden]'));
      expect(placeholderOption).toBeFalsy();
    });

    it('renders placeholder option when placeholder is set', () => {
      fixture.componentRef.setInput('placeholder', 'Choisir...');
      fixture.detectChanges();
      const placeholderOption: HTMLOptionElement = fixture.debugElement.query(By.css('option[hidden]'))?.nativeElement;
      expect(placeholderOption).toBeTruthy();
      expect(placeholderOption.textContent?.trim()).toBe('Choisir...');
      expect(placeholderOption.disabled).toBe(true);
    });
  });

  describe('label & a11y', () => {
    it('renders label when provided and associates with select id', () => {
      fixture.componentRef.setInput('label', 'Type');
      fixture.componentRef.setInput('inputId', 'type-select');
      fixture.detectChanges();
      const label: HTMLLabelElement = fixture.debugElement.query(By.css('.ds-field__label')).nativeElement;
      const select: HTMLSelectElement = fixture.debugElement.query(By.css('select')).nativeElement;
      expect(label.htmlFor).toBe('type-select');
      expect(select.id).toBe('type-select');
    });

    it('sets aria-invalid=true on select when error', () => {
      fixture.componentRef.setInput('error', 'Choix requis');
      fixture.detectChanges();
      const select: HTMLSelectElement = fixture.debugElement.query(By.css('select')).nativeElement;
      expect(select.getAttribute('aria-invalid')).toBe('true');
    });

    it('sets aria-describedby to error id when error', () => {
      fixture.componentRef.setInput('inputId', 'sel-id');
      fixture.componentRef.setInput('error', 'oops');
      fixture.detectChanges();
      const select: HTMLSelectElement = fixture.debugElement.query(By.css('select')).nativeElement;
      expect(select.getAttribute('aria-describedby')).toBe('sel-id-err');
    });

    it('renders error message with role=alert', () => {
      fixture.componentRef.setInput('error', 'Champ requis');
      fixture.detectChanges();
      const err: HTMLElement = fixture.debugElement.query(By.css('.ds-field__error')).nativeElement;
      expect(err.textContent?.trim()).toBe('Champ requis');
      expect(err.getAttribute('role')).toBe('alert');
    });

    it('reflects ariaLabelSelect to aria-label on select', () => {
      fixture.componentRef.setInput('ariaLabelSelect', 'Choisir type');
      fixture.detectChanges();
      const select: HTMLSelectElement = fixture.debugElement.query(By.css('select')).nativeElement;
      expect(select.getAttribute('aria-label')).toBe('Choisir type');
    });
  });

  describe('disabled', () => {
    it('disables native select when disabled=true', async () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const select: HTMLSelectElement = fixture.debugElement.query(By.css('select')).nativeElement;
      expect(select.hasAttribute('disabled')).toBe(true);
    });

    it('applies disabled class on wrapper', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const wrapper = fixture.debugElement.query(By.css('.ds-field'));
      expect(wrapper.nativeElement.classList.contains('ds-field--disabled')).toBe(true);
    });
  });

  describe('value change', () => {
    it('emits valueChange and fires onChange when onValueChange is called', () => {
      vi.spyOn(component.valueChange, 'emit');
      const handler = vi.fn();
      component.registerOnChange(handler);
      component.onValueChange('two');
      expect(component.value).toBe('two');
      expect(handler).toHaveBeenCalledWith('two');
      expect(component.valueChange.emit).toHaveBeenCalledWith('two');
    });
  });

  describe('focus/blur', () => {
    it('emits dsFocus and toggles focused on focus', () => {
      vi.spyOn(component.dsFocus, 'emit');
      component.onNativeFocus(new FocusEvent('focus'));
      expect(component.focused).toBe(true);
      expect(component.dsFocus.emit).toHaveBeenCalled();
    });

    it('emits dsBlur, calls onTouched and unsets focused on blur', () => {
      const touched = vi.fn();
      component.registerOnTouched(touched);
      vi.spyOn(component.dsBlur, 'emit');
      component.focused = true;
      component.onNativeBlur(new FocusEvent('blur'));
      expect(component.focused).toBe(false);
      expect(touched).toHaveBeenCalled();
      expect(component.dsBlur.emit).toHaveBeenCalled();
    });
  });

  describe('ControlValueAccessor', () => {
    it('writeValue assigns value', () => {
      component.writeValue('two');
      expect(component.value).toBe('two');
    });

    it('setDisabledState toggles disabled property', () => {
      component.setDisabledState(true);
      expect(component.disabled).toBe(true);
      component.setDisabledState(false);
      expect(component.disabled).toBe(false);
    });
  });

  describe('chevron suffix', () => {
    it('always renders the chevron suffix icon', () => {
      const suffix = fixture.debugElement.query(By.css('.ds-field__suffix ds-icon'));
      expect(suffix).toBeTruthy();
    });
  });
});
