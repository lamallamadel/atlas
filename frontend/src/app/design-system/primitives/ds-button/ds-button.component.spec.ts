import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DsButtonComponent } from './ds-button.component';

describe('DsButtonComponent', () => {
  let component: DsButtonComponent;
  let fixture: ComponentFixture<DsButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DsButtonComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DsButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with default values', () => {
    expect(component).toBeTruthy();
    expect(component.variant).toBe('marine');
    expect(component.size).toBe('md');
    expect(component.nativeType).toBe('button');
    expect(component.disabled).toBe(false);
    expect(component.loading).toBe(false);
  });

  describe('classes', () => {
    it('applies default marine + md classes', () => {
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.classList.contains('ds-btn')).toBe(true);
      expect(btn.classList.contains('ds-btn--marine')).toBe(true);
      expect(btn.classList.contains('ds-btn--md')).toBe(true);
    });

    it('applies copper variant', () => {
      fixture.componentRef.setInput('variant', 'copper');
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.classList.contains('ds-btn--copper')).toBe(true);
    });

    it('applies ghost variant', () => {
      fixture.componentRef.setInput('variant', 'ghost');
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.classList.contains('ds-btn--ghost')).toBe(true);
    });

    it('applies danger variant', () => {
      fixture.componentRef.setInput('variant', 'danger');
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.classList.contains('ds-btn--danger')).toBe(true);
    });

    it('applies icon variant', () => {
      fixture.componentRef.setInput('variant', 'icon');
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.classList.contains('ds-btn--icon')).toBe(true);
    });

    it('applies sm size', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.classList.contains('ds-btn--sm')).toBe(true);
    });

    it('applies lg size', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.classList.contains('ds-btn--lg')).toBe(true);
    });

    it('adds loading modifier when loading=true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.classList.contains('ds-btn--loading')).toBe(true);
    });

    it('adds disabled modifier when disabled=true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.classList.contains('ds-btn--disabled')).toBe(true);
    });
  });

  describe('attributes', () => {
    it('reflects nativeType to type attribute', () => {
      fixture.componentRef.setInput('nativeType', 'submit');
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.getAttribute('type')).toBe('submit');
    });

    it('disables native button when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.disabled).toBe(true);
    });

    it('disables native button when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.disabled).toBe(true);
    });

    it('sets aria-busy when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.getAttribute('aria-busy')).toBe('true');
    });

    it('reflects ariaLabel input to aria-label attribute', () => {
      fixture.componentRef.setInput('ariaLabel', 'Fermer le menu');
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.getAttribute('aria-label')).toBe('Fermer le menu');
    });

    it('does not set aria-label when not provided', () => {
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      expect(btn.hasAttribute('aria-label')).toBe(false);
    });
  });

  describe('prefixIcon', () => {
    it('renders ds-icon when prefixIcon is set and not loading', () => {
      fixture.componentRef.setInput('prefixIcon', 'search');
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('ds-icon'));
      expect(icon).toBeTruthy();
      expect(icon.componentInstance.name).toBe('search');
    });

    it('does not render ds-icon when loading even if prefixIcon is set', () => {
      fixture.componentRef.setInput('prefixIcon', 'search');
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('.ds-btn__icon'));
      expect(icon).toBeFalsy();
    });

    it('renders spinner when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      const spinner = fixture.debugElement.query(By.css('.ds-btn__spinner'));
      expect(spinner).toBeTruthy();
    });
  });

  describe('click event', () => {
    it('emits dsClick when clicked', () => {
      vi.spyOn(component.dsClick, 'emit');
      const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
      btn.click();
      expect(component.dsClick.emit).toHaveBeenCalled();
    });

    it('does not emit dsClick when disabled', () => {
      vi.spyOn(component.dsClick, 'emit');
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      // call onClick directly because native button.click() is a no-op on disabled
      component.onClick(new MouseEvent('click'));
      expect(component.dsClick.emit).not.toHaveBeenCalled();
    });

    it('does not emit dsClick when loading', () => {
      vi.spyOn(component.dsClick, 'emit');
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      component.onClick(new MouseEvent('click'));
      expect(component.dsClick.emit).not.toHaveBeenCalled();
    });
  });

  describe('rippleColor', () => {
    it('returns light ripple for marine', () => {
      fixture.componentRef.setInput('variant', 'marine');
      expect(component.rippleColor).toBe('rgba(255,255,255,0.15)');
    });

    it('returns light ripple for copper', () => {
      fixture.componentRef.setInput('variant', 'copper');
      expect(component.rippleColor).toBe('rgba(255,255,255,0.15)');
    });

    it('returns dark ripple for ghost', () => {
      fixture.componentRef.setInput('variant', 'ghost');
      expect(component.rippleColor).toBe('rgba(13,44,74,0.08)');
    });

    it('returns light ripple for danger', () => {
      fixture.componentRef.setInput('variant', 'danger');
      expect(component.rippleColor).toBe('rgba(255,255,255,0.15)');
    });

    it('returns dark ripple for icon', () => {
      fixture.componentRef.setInput('variant', 'icon');
      expect(component.rippleColor).toBe('rgba(13,44,74,0.08)');
    });
  });
});
