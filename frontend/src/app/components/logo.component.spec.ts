import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let component: LogoComponent;
  let fixture: ComponentFixture<LogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [LogoComponent]
}).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default variant as horizontal', () => {
    expect(component.variant()).toBe('horizontal');
  });

  it('should have default theme as auto', () => {
    expect(component.theme()).toBe('auto');
  });

  it('should not animate by default', () => {
    expect(component.animate()).toBe(false);
  });

  it('should generate correct logo path for horizontal variant', () => {
    fixture.componentRef.setInput('variant', 'horizontal');
    fixture.componentRef.setInput('theme', 'default');
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-horizontal');
  });

  it('should generate correct logo path for vertical variant', () => {
    fixture.componentRef.setInput('variant', 'vertical');
    fixture.componentRef.setInput('theme', 'default');
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-vertical');
  });

  it('should generate correct logo path for icon variant', () => {
    fixture.componentRef.setInput('variant', 'icon');
    fixture.componentRef.setInput('theme', 'default');
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-icon');
  });

  it('should generate correct logo path with dark theme', () => {
    fixture.componentRef.setInput('variant', 'horizontal');
    fixture.componentRef.setInput('theme', 'dark');
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-horizontal-dark');
  });

  it('should generate correct logo path with light theme', () => {
    fixture.componentRef.setInput('variant', 'horizontal');
    fixture.componentRef.setInput('theme', 'light');
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-horizontal-light');
  });

  it('should generate correct logo path with mono theme', () => {
    fixture.componentRef.setInput('variant', 'horizontal');
    fixture.componentRef.setInput('theme', 'mono');
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-horizontal-mono');
  });

  it('should add animated class when animate is true', (done) => {
    fixture.componentRef.setInput('animate', true);
    component.ngOnInit();
    
    // Wait for animation delay
    setTimeout(() => {
      expect(component.showAnimation).toBe(true);
      expect(component.containerClass).toContain('logo-animated');
      done();
    }, 100);
  });

  it('should generate container class with variant', () => {
    fixture.componentRef.setInput('variant', 'horizontal');
    expect(component.containerClass).toContain('logo-horizontal');
  });

  it('should apply custom width and height', () => {
    fixture.componentRef.setInput('width', '200px');
    fixture.componentRef.setInput('height', '100px');
    const styles = component.imageStyles;
    expect(styles.width).toBe('200px');
    expect(styles.height).toBe('100px');
  });

  it('should use custom aria label', () => {
    fixture.componentRef.setInput('ariaLabel', 'Custom Label');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('aria-label')).toBe('Custom Label');
  });

  it('should render img element', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
  });

  it('should have role="img" on image', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('role')).toBe('img');
  });
});
