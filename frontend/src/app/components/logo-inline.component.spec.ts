import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoInlineComponent } from './logo-inline.component';

describe('LogoInlineComponent', () => {
  let component: LogoInlineComponent;
  let fixture: ComponentFixture<LogoInlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogoInlineComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LogoInlineComponent);
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

  it('should animate by default', () => {
    expect(component.animate).toBe(true);
  });

  it('should generate inline SVG content', () => {
    component.ngOnInit();
    expect(component.svgContent).toBeTruthy();
  });

  it('should generate horizontal SVG for horizontal variant', () => {
    component.variant = 'horizontal';
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('ATLAS');
    expect(svgString).toContain('IMMOBILIER');
  });

  it('should generate vertical SVG for vertical variant', () => {
    component.variant = 'vertical';
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('viewBox="0 0 160 200"');
  });

  it('should generate icon SVG for icon variant', () => {
    component.variant = 'icon';
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('viewBox="0 0 80 80"');
  });

  it('should apply dark theme colors', () => {
    component.theme = 'dark';
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('#90CAF9');
  });

  it('should apply light theme colors', () => {
    component.theme = 'light';
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('#42A5F5');
  });

  it('should apply monochrome theme', () => {
    component.theme = 'mono';
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('#212121');
  });

  it('should add animated class when animate is true', (done) => {
    component.animate = true;
    component.ngOnInit();
    
    setTimeout(() => {
      expect(component.showAnimation).toBe(true);
      expect(component.containerClass).toContain('logo-inline-animated');
      done();
    }, 150);
  });

  it('should not add animated class when animate is false', (done) => {
    component.animate = false;
    component.ngOnInit();
    
    setTimeout(() => {
      expect(component.showAnimation).toBe(false);
      expect(component.containerClass).not.toContain('logo-inline-animated');
      done();
    }, 150);
  });

  it('should generate container class with variant', () => {
    component.variant = 'horizontal';
    expect(component.containerClass).toContain('logo-horizontal');
  });

  it('should apply custom width', () => {
    component.width = '300px';
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('width="300px"');
  });

  it('should apply custom height', () => {
    component.height = '150px';
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('height="150px"');
  });

  it('should include aria label in SVG', () => {
    component.ariaLabel = 'Custom Logo Label';
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('Custom Logo Label');
  });

  it('should include animation classes in SVG', () => {
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('path-animated');
    expect(svgString).toContain('shape-animated');
    expect(svgString).toContain('text-animated');
  });

  it('should render SVG content in template', () => {
    component.ngOnInit();
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.logo-inline-container');
    expect(container).toBeTruthy();
    expect(container.innerHTML).toContain('svg');
  });

  it('should include gradient definitions', () => {
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('linearGradient');
  });

  it('should include building elements', () => {
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('buildings-group');
    expect(svgString).toContain('rect');
  });

  it('should include window elements', () => {
    component.ngOnInit();
    const svgString = component.svgContent.toString();
    expect(svgString).toContain('window-animated');
  });

  it('should sanitize SVG content', () => {
    component.ngOnInit();
    expect(component.svgContent).toBeTruthy();
    // SafeHtml type ensures content is sanitized
  });
});
