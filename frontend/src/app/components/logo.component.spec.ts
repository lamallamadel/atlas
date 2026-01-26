import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let component: LogoComponent;
  let fixture: ComponentFixture<LogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default variant as horizontal', () => {
    expect(component.variant).toBe('horizontal');
  });

  it('should have default theme as auto', () => {
    expect(component.theme).toBe('auto');
  });

  it('should not animate by default', () => {
    expect(component.animate).toBe(false);
  });

  it('should generate correct logo path for horizontal variant', () => {
    component.variant = 'horizontal';
    component.theme = 'default';
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-horizontal');
  });

  it('should generate correct logo path for vertical variant', () => {
    component.variant = 'vertical';
    component.theme = 'default';
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-vertical');
  });

  it('should generate correct logo path for icon variant', () => {
    component.variant = 'icon';
    component.theme = 'default';
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-icon');
  });

  it('should generate correct logo path with dark theme', () => {
    component.variant = 'horizontal';
    component.theme = 'dark';
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-horizontal-dark');
  });

  it('should generate correct logo path with light theme', () => {
    component.variant = 'horizontal';
    component.theme = 'light';
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-horizontal-light');
  });

  it('should generate correct logo path with mono theme', () => {
    component.variant = 'horizontal';
    component.theme = 'mono';
    component.ngOnInit();
    expect(component.logoPath).toContain('logo-horizontal-mono');
  });

  it('should add animated class when animate is true', (done) => {
    component.animate = true;
    component.ngOnInit();
    
    // Wait for animation delay
    setTimeout(() => {
      expect(component.showAnimation).toBe(true);
      expect(component.containerClass).toContain('logo-animated');
      done();
    }, 100);
  });

  it('should generate container class with variant', () => {
    component.variant = 'horizontal';
    expect(component.containerClass).toContain('logo-horizontal');
  });

  it('should apply custom width and height', () => {
    component.width = '200px';
    component.height = '100px';
    const styles = component.imageStyles;
    expect(styles.width).toBe('200px');
    expect(styles.height).toBe('100px');
  });

  it('should use custom aria label', () => {
    component.ariaLabel = 'Custom Label';
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
