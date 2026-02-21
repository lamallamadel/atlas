import { TestBed } from '@angular/core/testing';
import { ChartColorPaletteService } from './chart-color-palette.service';

describe('ChartColorPaletteService', () => {
  let service: ChartColorPaletteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartColorPaletteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return default palette', () => {
    const palette = service.getPalette('default');
    expect(palette).toBeDefined();
    expect(palette?.name).toBe('Default');
    expect(palette?.colors.length).toBe(8);
  });

  it('should return all palettes', () => {
    const palettes = service.getAllPalettes();
    expect(palettes.length).toBeGreaterThan(0);
    expect(palettes.some(p => p.name === 'Default')).toBe(true);
  });

  it('should return only accessible palettes', () => {
    const accessiblePalettes = service.getAccessiblePalettes();
    expect(accessiblePalettes.every(p => p.accessible)).toBe(true);
  });

  it('should get color by index', () => {
    const color = service.getColor('default', 0);
    expect(color).toMatch(/rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)/);
  });

  it('should get alpha color by index', () => {
    const alphaColor = service.getAlphaColor('default', 0);
    expect(alphaColor).toMatch(/rgba\(\d+,\s*\d+,\s*\d+,\s*0\.2\)/);
  });

  it('should get chart color with all alpha variants', () => {
    const chartColor = service.getChartColor('default', 0);
    expect(chartColor.solid).toBeDefined();
    expect(chartColor.alpha20).toBeDefined();
    expect(chartColor.alpha40).toBeDefined();
    expect(chartColor.alpha60).toBeDefined();
    expect(chartColor.alpha80).toBeDefined();
  });

  it('should generate color with custom alpha', () => {
    const color = 'rgba(44, 90, 160, 1)';
    const alphaColor = service.getColorWithAlpha(color, 0.5);
    expect(alphaColor).toBe('rgba(44, 90, 160, 0.5)');
  });

  it('should get contrast color for dark background', () => {
    const darkBg = 'rgba(44, 90, 160, 1)';
    const contrast = service.getContrastColor(darkBg);
    expect(contrast).toBe('#FFFFFF');
  });

  it('should get contrast color for light background', () => {
    const lightBg = 'rgba(240, 240, 240, 1)';
    const contrast = service.getContrastColor(lightBg);
    expect(contrast).toBe('#212121');
  });

  it('should generate gradient', () => {
    const gradient = service.generateGradient('rgba(44, 90, 160, 1)', 5);
    expect(gradient.length).toBe(5);
    expect(gradient[0]).toMatch(/rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)/);
  });

  it('should register custom palette', () => {
    const customColors = [
      'rgba(255, 0, 0, 1)',
      'rgba(0, 255, 0, 1)',
      'rgba(0, 0, 255, 1)'
    ];
    
    service.registerCustomPalette('custom', customColors, true, 'AA');
    
    const palette = service.getPalette('custom');
    expect(palette).toBeDefined();
    expect(palette?.colors.length).toBe(3);
    expect(palette?.accessible).toBe(true);
  });

  it('should cycle through colors when index exceeds palette length', () => {
    const palette = service.getPalette('default');
    const paletteLength = palette?.colors.length || 8;
    
    const color1 = service.getColor('default', 0);
    const color2 = service.getColor('default', paletteLength);
    
    expect(color1).toBe(color2);
  });

  it('should return default color for unknown palette', () => {
    const color = service.getColor('unknown-palette', 0);
    expect(color).toMatch(/rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)/);
  });
});
