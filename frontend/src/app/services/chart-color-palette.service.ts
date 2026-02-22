import { Injectable } from '@angular/core';

export interface ColorPalette {
  name: string;
  colors: string[];
  alphaColors?: string[];
  accessible: boolean;
  wcagLevel: 'AA' | 'AAA';
}

export interface ChartColor {
  solid: string;
  alpha20: string;
  alpha40: string;
  alpha60: string;
  alpha80: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChartColorPaletteService {
  private readonly palettes: Map<string, ColorPalette> = new Map();

  constructor() {
    this.initializePalettes();
  }

  private initializePalettes(): void {
    this.palettes.set('default', {
      name: 'Default',
      colors: [
        'rgba(44, 90, 160, 1)',    // primary
        'rgba(66, 136, 206, 1)',   // secondary  
        'rgba(117, 199, 127, 1)',  // success
        'rgba(240, 201, 115, 1)',  // warning
        'rgba(237, 127, 127, 1)',  // error
        'rgba(125, 184, 238, 1)',  // info
        'rgba(158, 158, 158, 1)',  // neutral
        'rgba(171, 130, 255, 1)'   // accent
      ],
      alphaColors: [
        'rgba(44, 90, 160, 0.2)',
        'rgba(66, 136, 206, 0.2)',
        'rgba(117, 199, 127, 0.2)',
        'rgba(240, 201, 115, 0.2)',
        'rgba(237, 127, 127, 0.2)',
        'rgba(125, 184, 238, 0.2)',
        'rgba(158, 158, 158, 0.2)',
        'rgba(171, 130, 255, 0.2)'
      ],
      accessible: true,
      wcagLevel: 'AA'
    });

    this.palettes.set('vibrant', {
      name: 'Vibrant',
      colors: [
        'rgba(231, 76, 60, 1)',    // red
        'rgba(52, 152, 219, 1)',   // blue
        'rgba(46, 204, 113, 1)',   // green
        'rgba(241, 196, 15, 1)',   // yellow
        'rgba(155, 89, 182, 1)',   // purple
        'rgba(26, 188, 156, 1)',   // turquoise
        'rgba(230, 126, 34, 1)',   // orange
        'rgba(149, 165, 166, 1)'   // gray
      ],
      alphaColors: [
        'rgba(231, 76, 60, 0.2)',
        'rgba(52, 152, 219, 0.2)',
        'rgba(46, 204, 113, 0.2)',
        'rgba(241, 196, 15, 0.2)',
        'rgba(155, 89, 182, 0.2)',
        'rgba(26, 188, 156, 0.2)',
        'rgba(230, 126, 34, 0.2)',
        'rgba(149, 165, 166, 0.2)'
      ],
      accessible: true,
      wcagLevel: 'AA'
    });

    this.palettes.set('pastel', {
      name: 'Pastel',
      colors: [
        'rgba(174, 214, 241, 1)',  // light blue
        'rgba(255, 218, 193, 1)',  // light orange
        'rgba(187, 231, 197, 1)',  // light green
        'rgba(248, 196, 196, 1)',  // light red
        'rgba(215, 189, 226, 1)',  // light purple
        'rgba(250, 219, 216, 1)',  // light pink
        'rgba(255, 243, 205, 1)',  // light yellow
        'rgba(220, 221, 225, 1)'   // light gray
      ],
      alphaColors: [
        'rgba(174, 214, 241, 0.3)',
        'rgba(255, 218, 193, 0.3)',
        'rgba(187, 231, 197, 0.3)',
        'rgba(248, 196, 196, 0.3)',
        'rgba(215, 189, 226, 0.3)',
        'rgba(250, 219, 216, 0.3)',
        'rgba(255, 243, 205, 0.3)',
        'rgba(220, 221, 225, 0.3)'
      ],
      accessible: false,
      wcagLevel: 'AA'
    });

    this.palettes.set('dark', {
      name: 'Dark',
      colors: [
        'rgba(66, 136, 206, 1)',   // light blue
        'rgba(125, 184, 238, 1)',  // sky blue
        'rgba(117, 199, 127, 1)',  // light green
        'rgba(240, 201, 115, 1)',  // light yellow
        'rgba(237, 127, 127, 1)',  // light red
        'rgba(171, 130, 255, 1)',  // light purple
        'rgba(255, 171, 145, 1)',  // light orange
        'rgba(189, 189, 189, 1)'   // light gray
      ],
      alphaColors: [
        'rgba(66, 136, 206, 0.2)',
        'rgba(125, 184, 238, 0.2)',
        'rgba(117, 199, 127, 0.2)',
        'rgba(240, 201, 115, 0.2)',
        'rgba(237, 127, 127, 0.2)',
        'rgba(171, 130, 255, 0.2)',
        'rgba(255, 171, 145, 0.2)',
        'rgba(189, 189, 189, 0.2)'
      ],
      accessible: true,
      wcagLevel: 'AA'
    });

    this.palettes.set('monochrome', {
      name: 'Monochrome',
      colors: [
        'rgba(44, 90, 160, 1)',    // primary-700
        'rgba(59, 108, 179, 1)',   // primary-600
        'rgba(66, 136, 206, 1)',   // primary-500
        'rgba(97, 155, 217, 1)',   // primary-400
        'rgba(158, 196, 238, 1)',  // primary-300
        'rgba(189, 215, 245, 1)',  // primary-200
        'rgba(220, 234, 250, 1)',  // primary-100
        'rgba(235, 244, 253, 1)'   // primary-50
      ],
      alphaColors: [
        'rgba(44, 90, 160, 0.2)',
        'rgba(59, 108, 179, 0.2)',
        'rgba(66, 136, 206, 0.2)',
        'rgba(97, 155, 217, 0.2)',
        'rgba(158, 196, 238, 0.2)',
        'rgba(189, 215, 245, 0.2)',
        'rgba(220, 234, 250, 0.2)',
        'rgba(235, 244, 253, 0.2)'
      ],
      accessible: true,
      wcagLevel: 'AAA'
    });

    this.palettes.set('categorical', {
      name: 'Categorical',
      colors: [
        'rgba(44, 90, 160, 1)',    // primary
        'rgba(117, 199, 127, 1)',  // success
        'rgba(237, 127, 127, 1)',  // danger
        'rgba(240, 201, 115, 1)',  // warning
        'rgba(125, 184, 238, 1)',  // info
        'rgba(171, 130, 255, 1)',  // purple
        'rgba(66, 136, 206, 1)',   // secondary
        'rgba(158, 158, 158, 1)'   // neutral
      ],
      alphaColors: [
        'rgba(44, 90, 160, 0.2)',
        'rgba(117, 199, 127, 0.2)',
        'rgba(237, 127, 127, 0.2)',
        'rgba(240, 201, 115, 0.2)',
        'rgba(125, 184, 238, 0.2)',
        'rgba(171, 130, 255, 0.2)',
        'rgba(66, 136, 206, 0.2)',
        'rgba(158, 158, 158, 0.2)'
      ],
      accessible: true,
      wcagLevel: 'AA'
    });
  }

  getPalette(name: string): ColorPalette | undefined {
    return this.palettes.get(name);
  }

  getAllPalettes(): ColorPalette[] {
    return Array.from(this.palettes.values());
  }

  getAccessiblePalettes(): ColorPalette[] {
    return this.getAllPalettes().filter(p => p.accessible);
  }

  getColor(paletteName: string, index: number): string {
    const palette = this.palettes.get(paletteName);
    if (!palette) {
      return this.getDefaultColor(index);
    }
    return palette.colors[index % palette.colors.length];
  }

  getAlphaColor(paletteName: string, index: number): string {
    const palette = this.palettes.get(paletteName);
    if (!palette || !palette.alphaColors) {
      return this.getDefaultAlphaColor(index);
    }
    return palette.alphaColors[index % palette.alphaColors.length];
  }

  getColorWithAlpha(color: string, alpha: number): string {
    const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!rgba) return color;

    const [_, r, g, b] = rgba;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getChartColor(paletteName: string, index: number): ChartColor {
    const solid = this.getColor(paletteName, index);
    return {
      solid,
      alpha20: this.getColorWithAlpha(solid, 0.2),
      alpha40: this.getColorWithAlpha(solid, 0.4),
      alpha60: this.getColorWithAlpha(solid, 0.6),
      alpha80: this.getColorWithAlpha(solid, 0.8)
    };
  }

  private getDefaultColor(index: number): string {
    const defaultPalette = this.palettes.get('default')!;
    return defaultPalette.colors[index % defaultPalette.colors.length];
  }

  private getDefaultAlphaColor(index: number): string {
    const defaultPalette = this.palettes.get('default')!;
    return defaultPalette.alphaColors![index % defaultPalette.alphaColors!.length];
  }

  getContrastColor(backgroundColor: string): string {
    const rgba = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!rgba) return '#212121';

    const [_, r, g, b] = rgba.map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#212121' : '#FFFFFF';
  }

  generateGradient(color: string, steps = 5): string[] {
    const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!rgba) return [color];

    const [_, r, g, b] = rgba.map(Number);
    const gradient: string[] = [];

    for (let i = 0; i < steps; i++) {
      const factor = 1 - (i / (steps - 1)) * 0.5;
      const newR = Math.round(r + (255 - r) * (1 - factor));
      const newG = Math.round(g + (255 - g) * (1 - factor));
      const newB = Math.round(b + (255 - b) * (1 - factor));
      gradient.push(`rgba(${newR}, ${newG}, ${newB}, 1)`);
    }

    return gradient;
  }

  registerCustomPalette(name: string, colors: string[], accessible = false, wcagLevel: 'AA' | 'AAA' = 'AA'): void {
    const alphaColors = colors.map(c => this.getColorWithAlpha(c, 0.2));
    this.palettes.set(name, {
      name,
      colors,
      alphaColors,
      accessible,
      wcagLevel
    });
  }
}
