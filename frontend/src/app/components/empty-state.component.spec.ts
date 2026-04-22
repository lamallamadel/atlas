import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EmptyStateComponent } from './empty-state.component';
import { EmptyStateIllustrationsService, EmptyStateContext } from '../services/empty-state-illustrations.service';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [CommonModule, MatIconModule, MatButtonModule, EmptyStateComponent],
    providers: [EmptyStateIllustrationsService]
})
    .compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('legacy mode (without context)', () => {
    it('should display message and subtext', () => {
      fixture.componentRef.setInput('message', 'Test message');
      fixture.componentRef.setInput('subtext', 'Test subtext');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.empty-state-title').textContent).toContain('Test message');
      expect(compiled.querySelector('.empty-state-message').textContent).toContain('Test subtext');
    });

    it('should call primary action handler', () => {
      const handler = jasmine.createSpy('handler');
      fixture.componentRef.setInput('primaryAction', { label: 'Test', handler });
      fixture.detectChanges();

      component.onPrimaryClick();
      expect(handler).toHaveBeenCalled();
    });

    it('should call secondary action handler', () => {
      const handler = jasmine.createSpy('handler');
      fixture.componentRef.setInput('secondaryAction', { label: 'Test', handler });
      fixture.detectChanges();

      component.onSecondaryClick();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('context-based mode', () => {
    it('should use service config when context is provided', () => {
      fixture.componentRef.setInput('context', EmptyStateContext.NO_DOSSIERS);
      fixture.componentRef.setInput('isNewUser', false);
      component.ngOnInit();

      expect(component.displayTitle).toContain('dossier');
      expect(component.displayMessage).toBeTruthy();
      expect(component.displayIllustration).toBeDefined();
    });

    it('should adapt content for new users', () => {
      fixture.componentRef.setInput('context', EmptyStateContext.NO_DOSSIERS);
      fixture.componentRef.setInput('isNewUser', true);
      component.ngOnInit();

      expect(component.displayTitle).toContain('Bienvenue');
    });

    it('should merge service config with provided handlers', () => {
      const primaryHandler = jasmine.createSpy('primaryHandler');
      const secondaryHandler = jasmine.createSpy('secondaryHandler');

      fixture.componentRef.setInput('context', EmptyStateContext.NO_DOSSIERS);
      fixture.componentRef.setInput('primaryAction', { label: 'Test', handler: primaryHandler });
      fixture.componentRef.setInput('secondaryAction', { label: 'Test', handler: secondaryHandler });
      component.ngOnInit();

      component.onPrimaryClick();
      component.onSecondaryClick();

      expect(primaryHandler).toHaveBeenCalled();
      expect(secondaryHandler).toHaveBeenCalled();
    });

    it('should display help link when provided by service', () => {
      fixture.componentRef.setInput('context', EmptyStateContext.NO_DOSSIERS);
      component.ngOnInit();

      expect(component.displayHelpLink).toBeDefined();
      expect(component.displayHelpLink?.label).toBeTruthy();
    });

    it('should use custom illustration when provided', () => {
      const customIllustration = '<svg>custom</svg>';
      fixture.componentRef.setInput('context', EmptyStateContext.NO_DOSSIERS);
      fixture.componentRef.setInput('customIllustration', customIllustration as any);
      component.ngOnInit();

      expect(component.displayIllustration).toBe(customIllustration);
    });

    it('should handle context changes', () => {
      fixture.componentRef.setInput('context', EmptyStateContext.NO_DOSSIERS);
      component.ngOnInit();
      const firstTitle = component.displayTitle;

      fixture.componentRef.setInput('context', EmptyStateContext.NO_ANNONCES);
      component.ngOnChanges();
      const secondTitle = component.displayTitle;

      expect(firstTitle).not.toBe(secondTitle);
    });
  });

  describe('help link', () => {
    it('should open help link in new tab', () => {
      spyOn(window, 'open');
      
      component.displayHelpLink = {
        label: 'Help',
        url: 'https://example.com/help'
      };
      
      component.onHelpLinkClick();
      
      expect(window.open).toHaveBeenCalledWith('https://example.com/help', '_blank');
    });

    it('should not error when help link is not provided', () => {
      component.displayHelpLink = undefined;
      expect(() => component.onHelpLinkClick()).not.toThrow();
    });
  });

  describe('action click helpers', () => {
    it('should handle primary click when action is defined', () => {
      const handler = jasmine.createSpy('handler');
      component.displayPrimaryAction = { label: 'Test', handler };
      
      component.onPrimaryClick();
      
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('rendering', () => {
    it('should display fallback icon when no illustration provided', () => {
      fixture.componentRef.setInput('message', 'Test');
      component.displayIllustration = undefined;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.empty-state-icon')).toBeTruthy();
    });

    it('should display illustration when provided', () => {
      fixture.componentRef.setInput('context', EmptyStateContext.NO_DOSSIERS);
      fixture.detectChanges();
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('.empty-state-illustration')).toBeTruthy();
    });

    it('should render primary action button with icon', () => {
      fixture.componentRef.setInput('primaryAction', {
        label: 'Create',
        icon: 'add',
        handler: () => { /* no-op */ }
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('.btn-primary-action');
      expect(button).toBeTruthy();
      expect(button.querySelector('mat-icon')).toBeTruthy();
    });

    it('should render help link when provided', () => {
      fixture.componentRef.setInput('helpLink', {
        label: 'Need help?',
        url: '/help'
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.help-link')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      fixture.componentRef.setInput('message', 'Test message');
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const container = compiled.querySelector('.empty-state-container');
      expect(container.getAttribute('role')).toBe('status');
      expect(container.getAttribute('aria-live')).toBe('polite');
    });

    it('should have aria-hidden on decorative elements', () => {
      fixture.componentRef.setInput('context', EmptyStateContext.NO_DOSSIERS);
      fixture.detectChanges();
      component.ngOnInit();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const illustration = compiled.querySelector('.empty-state-illustration');
      expect(illustration?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have aria-label on action buttons', () => {
      fixture.componentRef.setInput('primaryAction', {
        label: 'Create new',
        handler: () => { /* no-op for test */ }
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const button = compiled.querySelector('.btn-primary-action');
      expect(button.getAttribute('aria-label')).toBe('Create new');
    });
  });
});
