import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BadgeComponent ],
      imports: [ MatIconModule ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply default variant, size, and color', () => {
    expect(component.variant).toBe('soft');
    expect(component.size).toBe('md');
    expect(component.color).toBe('neutral');
  });

  it('should generate correct badge classes', () => {
    component.variant = 'solid';
    component.size = 'lg';
    component.color = 'success';
    
    const classes = component.getBadgeClasses();
    
    expect(classes).toContain('badge');
    expect(classes).toContain('badge-solid');
    expect(classes).toContain('badge-lg');
    expect(classes).toContain('badge-success');
  });

  it('should add pill class when pill is true', () => {
    component.pill = true;
    
    const classes = component.getBadgeClasses();
    
    expect(classes).toContain('badge-pill');
  });

  it('should add pulse class when pulse is true', () => {
    component.pulse = true;
    
    const classes = component.getBadgeClasses();
    
    expect(classes).toContain('badge-pulse');
  });

  it('should add with-dot class when dot is true', () => {
    component.dot = true;
    
    const classes = component.getBadgeClasses();
    
    expect(classes).toContain('badge-with-dot');
  });

  it('should add with-icon class when icon is provided', () => {
    component.icon = 'check';
    
    const classes = component.getBadgeClasses();
    
    expect(classes).toContain('badge-with-icon');
  });

  it('should generate correct dot classes', () => {
    component.color = 'success-sold';
    
    const dotClasses = component.getDotClasses();
    
    expect(dotClasses).toContain('badge-dot');
    expect(dotClasses).toContain('badge-dot-success-sold');
  });

  it('should correctly identify if icon should show on left', () => {
    component.icon = 'check';
    component.iconPosition = 'left';
    
    expect(component.showIconLeft).toBe(true);
    expect(component.showIconRight).toBe(false);
  });

  it('should correctly identify if icon should show on right', () => {
    component.icon = 'check';
    component.iconPosition = 'right';
    
    expect(component.showIconLeft).toBe(false);
    expect(component.showIconRight).toBe(true);
  });

  it('should not show icon when icon is not provided', () => {
    component.icon = undefined;
    
    expect(component.hasIcon).toBe(false);
    expect(component.showIconLeft).toBe(false);
    expect(component.showIconRight).toBe(false);
  });

  it('should support all badge variants', () => {
    const variants: Array<'solid' | 'outline' | 'soft'> = ['solid', 'outline', 'soft'];
    
    variants.forEach(variant => {
      component.variant = variant;
      const classes = component.getBadgeClasses();
      expect(classes).toContain(`badge-${variant}`);
    });
  });

  it('should support all badge sizes', () => {
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
    
    sizes.forEach(size => {
      component.size = size;
      const classes = component.getBadgeClasses();
      expect(classes).toContain(`badge-${size}`);
    });
  });

  it('should support all badge colors', () => {
    const colors = [
      'primary', 
      'success', 
      'success-sold', 
      'success-rented', 
      'success-signed',
      'warning', 
      'warning-attention', 
      'warning-urgent', 
      'warning-critical',
      'danger', 
      'danger-soft',
      'info', 
      'neutral', 
      'neutral-warmth'
    ];
    
    colors.forEach(color => {
      component.color = color as any;
      const classes = component.getBadgeClasses();
      expect(classes).toContain(`badge-${color}`);
    });
  });
});
