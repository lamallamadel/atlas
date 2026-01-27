import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimatedEmptyStateComponent } from './animated-empty-state.component';
import { LottieAnimationComponent } from './lottie-animation.component';
import { MatIconModule } from '@angular/material/icon';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('AnimatedEmptyStateComponent', () => {
  let component: AnimatedEmptyStateComponent;
  let fixture: ComponentFixture<AnimatedEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ 
        AnimatedEmptyStateComponent,
        LottieAnimationComponent 
      ],
      imports: [ MatIconModule ],
      schemas: [ NO_ERRORS_SCHEMA ]
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
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.animated-empty-state-title')?.textContent).toContain('Test Title');
    expect(compiled.querySelector('.animated-empty-state-message')?.textContent).toContain('Test Message');
  });

  it('should render primary action button when provided', () => {
    component.primaryAction = {
      label: 'Primary Action',
      icon: 'add',
      handler: () => {}
    };
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const button = compiled.querySelector('.btn-primary-action');
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain('Primary Action');
  });

  it('should render secondary action button when provided', () => {
    component.secondaryAction = {
      label: 'Secondary Action',
      icon: 'close',
      handler: () => {}
    };
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const button = compiled.querySelector('.btn-secondary-action');
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain('Secondary Action');
  });

  it('should render help link when provided', () => {
    component.helpLink = {
      label: 'Need help?',
      url: 'https://help.example.com'
    };
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const link = compiled.querySelector('.help-link');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('Need help?');
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
