import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DsInputComponent } from './ds-input.component';

describe('DsInputComponent', () => {
  let component: DsInputComponent;
  let fixture: ComponentFixture<DsInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DsInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with defaults', () => {
    expect(component).toBeTruthy();
    expect(component.type).toBe('text');
    expect(component.disabled).toBe(false);
    expect(component.value).toBe('');
    expect(component.focused).toBe(false);
    expect(component.inputId).toMatch(/^ds-input-/);
  });

  describe('label', () => {
    it('does not render label by default', () => {
      const label = fixture.debugElement.query(By.css('.ds-field__label'));
      expect(label).toBeFalsy();
    });

    it('renders label when provided', () => {
      fixture.componentRef.setInput('label', 'Email');
      fixture.detectChanges();
      const label = fixture.debugElement.query(By.css('.ds-field__label'));
      expect(label.nativeElement.textContent.trim()).toBe('Email');
    });

    it('associates label "for" with input id', () => {
      fixture.componentRef.setInput('label', 'Email');
      fixture.componentRef.setInput('inputId', 'test-email-id');
      fixture.detectChanges();
      const label: HTMLLabelElement = fixture.debugElement.query(By.css('.ds-field__label')).nativeElement;
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      expect(label.htmlFor).toBe('test-email-id');
      expect(input.id).toBe('test-email-id');
    });
  });

  describe('attributes', () => {
    it('reflects placeholder', () => {
      fixture.componentRef.setInput('placeholder', 'Tapez ici');
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      expect(input.placeholder).toBe('Tapez ici');
    });

    it('reflects type', () => {
      fixture.componentRef.setInput('type', 'email');
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      expect(input.type).toBe('email');
    });

    it('disables input when disabled=true', async () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      expect(input.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('error state', () => {
    it('does not render error by default', () => {
      const err = fixture.debugElement.query(By.css('.ds-field__error'));
      expect(err).toBeFalsy();
    });

    it('renders error message and role=alert when error set', () => {
      fixture.componentRef.setInput('error', 'Champ requis');
      fixture.detectChanges();
      const err: HTMLElement = fixture.debugElement.query(By.css('.ds-field__error')).nativeElement;
      expect(err.textContent?.trim()).toBe('Champ requis');
      expect(err.getAttribute('role')).toBe('alert');
    });

    it('applies error class to wrapper', () => {
      fixture.componentRef.setInput('error', 'oops');
      fixture.detectChanges();
      const wrapper = fixture.debugElement.query(By.css('.ds-field'));
      expect(wrapper.nativeElement.classList.contains('ds-field--error')).toBe(true);
    });

    it('sets aria-invalid=true on input when error', () => {
      fixture.componentRef.setInput('error', 'oops');
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('sets aria-describedby to error id when error', () => {
      fixture.componentRef.setInput('inputId', 'myid');
      fixture.componentRef.setInput('error', 'oops');
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      const err: HTMLElement = fixture.debugElement.query(By.css('.ds-field__error')).nativeElement;
      expect(input.getAttribute('aria-describedby')).toBe('myid-err');
      expect(err.id).toBe('myid-err');
    });

    it('does not set aria-invalid when no error', () => {
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      expect(input.hasAttribute('aria-invalid')).toBe(false);
    });
  });

  describe('prefixIcon', () => {
    it('does not render prefix slot by default', () => {
      const prefix = fixture.debugElement.query(By.css('.ds-field__prefix'));
      expect(prefix).toBeFalsy();
    });

    it('renders ds-icon when prefixIcon set', () => {
      fixture.componentRef.setInput('prefixIcon', 'search');
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('.ds-field__prefix ds-icon'));
      expect(icon).toBeTruthy();
    });

    it('adds has-prefix modifier to input', () => {
      fixture.componentRef.setInput('prefixIcon', 'search');
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      expect(input.classList.contains('ds-field__input--has-prefix')).toBe(true);
    });
  });

  describe('focus/blur', () => {
    it('emits dsFocus on focus and toggles focused class', () => {
      vi.spyOn(component.dsFocus, 'emit');
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      input.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();
      expect(component.focused).toBe(true);
      expect(component.dsFocus.emit).toHaveBeenCalled();
      const wrapper = fixture.debugElement.query(By.css('.ds-field'));
      expect(wrapper.nativeElement.classList.contains('ds-field--focused')).toBe(true);
    });

    it('emits dsBlur and unsets focused on blur', () => {
      vi.spyOn(component.dsBlur, 'emit');
      component.focused = true;
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      input.dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      expect(component.focused).toBe(false);
      expect(component.dsBlur.emit).toHaveBeenCalled();
    });

    it('calls onTouched on blur', () => {
      const touched = vi.fn();
      component.registerOnTouched(touched);
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      input.dispatchEvent(new FocusEvent('blur'));
      expect(touched).toHaveBeenCalled();
    });

    it('focus() method calls native input focus', () => {
      const input: HTMLInputElement = fixture.debugElement.query(By.css('input')).nativeElement;
      vi.spyOn(input, 'focus');
      component.focus();
      expect(input.focus).toHaveBeenCalled();
    });
  });

  describe('ControlValueAccessor', () => {
    it('writeValue assigns value', () => {
      component.writeValue('hello');
      expect(component.value).toBe('hello');
    });

    it('writeValue handles null/undefined as empty string', () => {
      component.writeValue(null);
      expect(component.value).toBe('');
      component.writeValue(undefined);
      expect(component.value).toBe('');
    });

    it('registerOnChange stores handler and fires on ngModelChange', () => {
      const handler = vi.fn();
      component.registerOnChange(handler);
      component.onChange('typed-value');
      expect(handler).toHaveBeenCalledWith('typed-value');
    });

    it('setDisabledState toggles disabled property', () => {
      component.setDisabledState(true);
      expect(component.disabled).toBe(true);
      component.setDisabledState(false);
      expect(component.disabled).toBe(false);
    });
  });
});
