import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DsTextareaComponent } from './ds-textarea.component';

describe('DsTextareaComponent', () => {
  let component: DsTextareaComponent;
  let fixture: ComponentFixture<DsTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsTextareaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DsTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with defaults', () => {
    expect(component).toBeTruthy();
    expect(component.rows).toBe(4);
    expect(component.disabled).toBe(false);
    expect(component.readonly).toBe(false);
    expect(component.resize).toBe('vertical');
    expect(component.value).toBe('');
    expect(component.maxLength).toBeNull();
    expect(component.showCount).toBe(false);
    expect(component.inputId).toMatch(/^ds-textarea-/);
  });

  describe('label', () => {
    it('does not render label by default', () => {
      const label = fixture.debugElement.query(By.css('.ds-field__label'));
      expect(label).toBeFalsy();
    });

    it('renders label and associates with textarea id', () => {
      fixture.componentRef.setInput('label', 'Notes');
      fixture.componentRef.setInput('inputId', 'notes-id');
      fixture.detectChanges();
      const label: HTMLLabelElement = fixture.debugElement.query(By.css('.ds-field__label')).nativeElement;
      const ta: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
      expect(label.htmlFor).toBe('notes-id');
      expect(ta.id).toBe('notes-id');
      expect(label.textContent?.trim()).toBe('Notes');
    });
  });

  describe('attributes', () => {
    it('reflects placeholder', () => {
      fixture.componentRef.setInput('placeholder', 'Décrivez...');
      fixture.detectChanges();
      const ta: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
      expect(ta.placeholder).toBe('Décrivez...');
    });

    it('reflects rows', () => {
      fixture.componentRef.setInput('rows', 8);
      fixture.detectChanges();
      const ta: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
      expect(ta.rows).toBe(8);
    });

    it('reflects maxLength', () => {
      fixture.componentRef.setInput('maxLength', 200);
      fixture.detectChanges();
      const ta: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
      expect(ta.getAttribute('maxlength')).toBe('200');
    });

    it('disables textarea when disabled=true', async () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const ta: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
      expect(ta.hasAttribute('disabled')).toBe(true);
    });

    it('sets readonly attribute when readonly=true', () => {
      fixture.componentRef.setInput('readonly', true);
      fixture.detectChanges();
      const ta: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
      expect(ta.readOnly).toBe(true);
    });
  });

  describe('resize behavior', () => {
    it('applies vertical resize style by default', () => {
      const ta: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
      expect(ta.style.resize).toBe('vertical');
    });

    it('applies none style when resize=none', () => {
      fixture.componentRef.setInput('resize', 'none');
      fixture.detectChanges();
      const ta: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
      expect(ta.style.resize).toBe('none');
    });

    it('adds --auto modifier when resize=auto', () => {
      fixture.componentRef.setInput('resize', 'auto');
      fixture.detectChanges();
      const ta = fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;
      expect(ta.classList.contains('ds-field__textarea--auto')).toBe(true);
      expect(ta.style.resize).toBe('none');
    });

    it('calls autoResize on value change when resize=auto', () => {
      fixture.componentRef.setInput('resize', 'auto');
      fixture.detectChanges();
      const ta = fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;
      // Stub scrollHeight (jsdom returns 0)
      Object.defineProperty(ta, 'scrollHeight', { value: 120, configurable: true });
      component.onValueChange('hello\nworld');
      expect(ta.style.height).toBe('120px');
    });
  });

  describe('error state', () => {
    it('does not render error by default', () => {
      const err = fixture.debugElement.query(By.css('.ds-field__error'));
      expect(err).toBeFalsy();
    });

    it('renders error message with role=alert when error set', () => {
      fixture.componentRef.setInput('error', 'Requis');
      fixture.detectChanges();
      const err: HTMLElement = fixture.debugElement.query(By.css('.ds-field__error')).nativeElement;
      expect(err.textContent?.trim()).toBe('Requis');
      expect(err.getAttribute('role')).toBe('alert');
    });

    it('applies error class on wrapper', () => {
      fixture.componentRef.setInput('error', 'oops');
      fixture.detectChanges();
      const wrap = fixture.debugElement.query(By.css('.ds-field'));
      expect(wrap.nativeElement.classList.contains('ds-field--error')).toBe(true);
    });

    it('sets aria-invalid and aria-describedby with error id', () => {
      fixture.componentRef.setInput('inputId', 'my-id');
      fixture.componentRef.setInput('error', 'oops');
      fixture.detectChanges();
      const ta: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
      expect(ta.getAttribute('aria-invalid')).toBe('true');
      expect(ta.getAttribute('aria-describedby')).toBe('my-id-err');
    });
  });

  describe('character count', () => {
    it('does not render count by default', () => {
      const count = fixture.debugElement.query(By.css('.ds-field__count'));
      expect(count).toBeFalsy();
    });

    it('does not render count when showCount=true but maxLength is null', () => {
      fixture.componentRef.setInput('showCount', true);
      fixture.detectChanges();
      const count = fixture.debugElement.query(By.css('.ds-field__count'));
      expect(count).toBeFalsy();
    });

    it('renders count when showCount=true and maxLength is set', () => {
      fixture.componentRef.setInput('showCount', true);
      fixture.componentRef.setInput('maxLength', 100);
      fixture.detectChanges();
      const count: HTMLElement = fixture.debugElement.query(By.css('.ds-field__count')).nativeElement;
      expect(count.textContent).toContain('0 / 100');
    });

    it('updates count when value changes', () => {
      fixture.componentRef.setInput('showCount', true);
      fixture.componentRef.setInput('maxLength', 100);
      component.value = 'hello';
      fixture.detectChanges();
      const count: HTMLElement = fixture.debugElement.query(By.css('.ds-field__count')).nativeElement;
      expect(count.textContent).toContain('5 / 100');
    });

    it('applies --over modifier when at maxLength', () => {
      fixture.componentRef.setInput('showCount', true);
      fixture.componentRef.setInput('maxLength', 5);
      component.value = 'hello';
      fixture.detectChanges();
      const count: HTMLElement = fixture.debugElement.query(By.css('.ds-field__count')).nativeElement;
      expect(count.classList.contains('ds-field__count--over')).toBe(true);
    });

    it('aria-describedby includes count id when showCount and maxLength set', () => {
      fixture.componentRef.setInput('inputId', 'note');
      fixture.componentRef.setInput('showCount', true);
      fixture.componentRef.setInput('maxLength', 100);
      fixture.detectChanges();
      const ta: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
      expect(ta.getAttribute('aria-describedby')).toBe('note-count');
    });

    it('aria-describedby combines error and count ids', () => {
      fixture.componentRef.setInput('inputId', 'note');
      fixture.componentRef.setInput('error', 'oops');
      fixture.componentRef.setInput('showCount', true);
      fixture.componentRef.setInput('maxLength', 100);
      fixture.detectChanges();
      const ta: HTMLTextAreaElement = fixture.debugElement.query(By.css('textarea')).nativeElement;
      expect(ta.getAttribute('aria-describedby')).toBe('note-err note-count');
    });
  });

  describe('focus/blur', () => {
    it('emits dsFocus and toggles focused on focus', () => {
      const spy = vi.spyOn(component.dsFocus, 'emit');
      component.onNativeFocus(new FocusEvent('focus'));
      expect(component.focused).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('emits dsBlur, calls onTouched and unsets focused', () => {
      const touched = vi.fn();
      component.registerOnTouched(touched);
      const spy = vi.spyOn(component.dsBlur, 'emit');
      component.focused = true;
      component.onNativeBlur(new FocusEvent('blur'));
      expect(component.focused).toBe(false);
      expect(touched).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('focus() method calls native focus', () => {
      const ta = fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;
      const spy = vi.spyOn(ta, 'focus');
      component.focus();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('value emission', () => {
    it('emits valueChange and calls onChange', () => {
      const handler = vi.fn();
      const spy = vi.spyOn(component.valueChange, 'emit');
      component.registerOnChange(handler);
      component.onValueChange('typed-text');
      expect(component.value).toBe('typed-text');
      expect(handler).toHaveBeenCalledWith('typed-text');
      expect(spy).toHaveBeenCalledWith('typed-text');
    });

    it('coerces null/undefined to empty string on value change', () => {
      component.onValueChange(null as any);
      expect(component.value).toBe('');
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

    it('registerOnChange stores handler', () => {
      const handler = vi.fn();
      component.registerOnChange(handler);
      component.onChange('val');
      expect(handler).toHaveBeenCalledWith('val');
    });

    it('setDisabledState toggles disabled', () => {
      component.setDisabledState(true);
      expect(component.disabled).toBe(true);
      component.setDisabledState(false);
      expect(component.disabled).toBe(false);
    });
  });
});
