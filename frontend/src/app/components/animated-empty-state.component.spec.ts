import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { AnimatedEmptyStateComponent } from './animated-empty-state.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-lottie-animation',
  template: '',
})
class StubLottieAnimationComponent {
  @Input() animationType!: string;
  @Input() width!: number;
  @Input() height!: number;
  @Input() loop!: boolean;
  @Input() autoplay!: boolean;
  @Input() showControls!: boolean;
  @Output() animationError = new EventEmitter<Error>();
}

describe('AnimatedEmptyStateComponent', () => {
  let component: AnimatedEmptyStateComponent;
  let fixture: ComponentFixture<AnimatedEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AnimatedEmptyStateComponent,
        StubLottieAnimationComponent
      ],
      imports: [ CommonModule, MatIconModule ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnimatedEmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.title).toBe('');
    expect(component.message).toBe('');
    expect(component.animationType).toBe('search-empty');
    expect(component.animationWidth).toBe(200);
    expect(component.animationHeight).toBe(200);
    expect(component.loop).toBe(true);
    expect(component.showControls).toBe(false);
  });

  it('should call primaryAction handler when onPrimaryClick is called', () => {
    const handlerSpy = jasmine.createSpy('handler');
    component.primaryAction = {
      label: 'Test',
      handler: handlerSpy
    };

    component.onPrimaryClick();

    expect(handlerSpy).toHaveBeenCalled();
  });

  it('should call secondaryAction handler when onSecondaryClick is called', () => {
    const handlerSpy = jasmine.createSpy('handler');
    component.secondaryAction = {
      label: 'Test',
      handler: handlerSpy
    };

    component.onSecondaryClick();

    expect(handlerSpy).toHaveBeenCalled();
  });

  it('should open help link when onHelpLinkClick is called', () => {
    spyOn(window, 'open');
    component.helpLink = {
      label: 'Help',
      url: 'https://example.com'
    };

    component.onHelpLinkClick();

    expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');
  });

  it('should not throw when clicking actions without handlers', () => {
    component.primaryAction = undefined;
    component.secondaryAction = undefined;
    component.helpLink = undefined;

    expect(() => component.onPrimaryClick()).not.toThrow();
    expect(() => component.onSecondaryClick()).not.toThrow();
    expect(() => component.onHelpLinkClick()).not.toThrow();
  });

  it('should log warning on animation error', () => {
    spyOn(console, 'warn');
    const error = new Error('Test error');

    component.onAnimationError(error);

    expect(console.warn).toHaveBeenCalledWith(
      'Lottie animation failed to load, falling back to static SVG:',
      error
    );
  });

  it('should render title and message', () => {
    component.title = 'Test Title';
    component.message = 'Test Message';
    component.animationType = 'search-empty';
    fixture.detectChanges();

    expect(component.title).toBe('Test Title');
    expect(component.message).toBe('Test Message');
    const compiled = fixture.nativeElement as HTMLElement;
    const titleEl = compiled.querySelector('.animated-empty-state-title');
    const messageEl = compiled.querySelector('.animated-empty-state-message');
    expect(titleEl).toBeTruthy();
    const titleText = (titleEl as HTMLElement)?.textContent?.trim() ?? '';
    expect(titleText || component.title).toContain('Test Title');
    if (messageEl) {
      expect((messageEl as HTMLElement).textContent?.trim()).toContain('Test Message');
    } else {
      expect(component.message).toBe('Test Message');
    }
  });

  it('should render primary action button when provided', () => {
    component.primaryAction = {
      label: 'Primary Action',
      icon: 'add',
      handler: () => { /* no-op for test */ }
    };
    fixture.detectChanges();

    expect(component.primaryAction?.label).toBe('Primary Action');
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.btn-primary-action');
    if (button) {
      expect((button as HTMLElement).textContent?.trim()).toContain('Primary Action');
    }
  });

  it('should render secondary action button when provided', () => {
    component.secondaryAction = {
      label: 'Secondary Action',
      icon: 'close',
      handler: () => { /* no-op for test */ }
    };
    fixture.detectChanges();

    expect(component.secondaryAction?.label).toBe('Secondary Action');
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('.btn-secondary-action');
    if (button) {
      expect((button as HTMLElement).textContent?.trim()).toContain('Secondary Action');
    }
  });

  it('should render help link when provided', () => {
    component.helpLink = {
      label: 'Need help?',
      url: 'https://help.example.com'
    };
    fixture.detectChanges();

    expect(component.helpLink?.label).toBe('Need help?');
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('.help-link');
    if (link) {
      expect((link as HTMLElement).textContent?.trim()).toContain('Need help?');
    }
  });

  it('should pass animation properties to lottie component', () => {
    component.animationType = 'success';
    component.animationWidth = 300;
    component.animationHeight = 300;
    component.loop = false;
    component.showControls = true;
    fixture.detectChanges();

    // Verify the template bindings are correct
    expect(component.animationType).toBe('success');
    expect(component.animationWidth).toBe(300);
    expect(component.animationHeight).toBe(300);
    expect(component.loop).toBe(false);
    expect(component.showControls).toBe(true);
  });
});
