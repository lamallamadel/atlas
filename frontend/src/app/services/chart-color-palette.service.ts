import { Injectable } from '@angular/core';
import {
  colorToRgba,
  DS_CHART_SERIES_VAR_NAMES,
  dsRgba,
  resolveDsToken,
} from '../design-system/chart-ds-colors';

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

/** Ordre pour graphes sur fond sombre (tons lisibles en premier). */
const DS_CHART_DARK_SURFACE_VARS = [
  '--ds-marine-light',
  '--ds-primary',
  '--ds-success',
  '--ds-warning',
  '--ds-error',
  '--ds-primary-hover',
  '--ds-marine',
  '--ds-text-muted',
] as const;

/** Variation « vibrant » — permutation des sémantiques. */
const DS_CHART_VIBRANT_VARS = [
  '--ds-error',
  '--ds-marine-light',
  '--ds-success',
  '--ds-warning',
  '--ds-primary',
  '--ds-marine',
  '--ds-primary-hover',
  '--ds-text-muted',
] as const;

/** Catégories métier classiques (statut / alerte). */
const DS_CHART_CATEGORICAL_VARS = [
  '--ds-marine',
  '--ds-success',
  '--ds-error',
  '--ds-warning',
  '--ds-marine-light',
  '--ds-primary',
  '--ds-primary-hover',
  '--ds-text-muted',
] as const;

/** Surfaces « pastel » à partir des hl / neutres DS. */
const DS_CHART_PASTEL_VARS = [
  '--ds-marine-hl',
  '--ds-primary-hl',
  '--ds-success-hl',
  '--ds-warning-hl',
  '--ds-error-hl',
  '--ds-primary-subtle',
  '--ds-surface-dynamic',
  '--ds-divider',
] as const;

@Injectable({
  providedIn: 'root'
})
export class ChartColorPaletteService {
  private readonly palettes: Map<string, ColorPalette> = new Map();

  constructor() {
    this.initializePalettes();
  }

  private initializePalettes(): void {
    const alphaStandard = 0.2;
    const alphaPastel = 0.35;

    this.palettes.set(
      'default',
      this.buildDsPalette('Default', DS_CHART_SERIES_VAR_NAMES, alphaStandard, true, 'AA')
    );

    this.palettes.set(
      'categorical',
      this.buildDsPalette('Categorical', DS_CHART_CATEGORICAL_VARS, alphaStandard, true, 'AA')
    );

    this.palettes.set(
      'vibrant',
      this.buildDsPalette('Vibrant', DS_CHART_VIBRANT_VARS, alphaStandard, true, 'AA')
    );

    this.palettes.set(
      'pastel',
      this.buildDsPalette('Pastel', DS_CHART_PASTEL_VARS, alphaPastel, false, 'AA')
    );

    this.palettes.set(
      'dark',
      this.buildDsPalette('Dark', DS_CHART_DARK_SURFACE_VARS, alphaStandard, true, 'AA')
    );

    const monoAnchor = colorToRgba(resolveDsToken('--ds-marine'), 1);
    const monoColors = this.generateGradient(monoAnchor, 8);
    this.palettes.set('monochrome', {
      name: 'Monochrome',
      colors: monoColors,
      alphaColors: monoColors.map(c => colorToRgba(c, alphaStandard)),
      accessible: true,
      wcagLevel: 'AAA'
    });
  }

  private buildDsPalette(
    name: string,
    vars: readonly string[],
    alpha: number,
    accessible: boolean,
    wcagLevel: 'AA' | 'AAA'
  ): ColorPalette {
    return {
      name,
      colors: vars.map(v => colorToRgba(resolveDsToken(v), 1)),
      alphaColors: vars.map(v => dsRgba(v, alpha)),
      accessible,
      wcagLevel
    };
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
    if (rgba) {
      const [, r, g, b] = rgba;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return colorToRgba(color, alpha);
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
    let rgba = backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!rgba && backgroundColor.trim().startsWith('#')) {
      const converted = colorToRgba(backgroundColor, 1);
      rgba = converted.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    }
    if (!rgba) {
      return resolveDsToken('--ds-text');
    }

    const [, rs, gs, bs] = rgba;
    const r = Number(rs);
    const g = Number(gs);
    const b = Number(bs);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? resolveDsToken('--ds-text') : resolveDsToken('--ds-text-inverse');
  }

  generateGradient(color: string, steps = 5): string[] {
    let rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    let r: number;
    let g: number;
    let b: number;
    if (rgba) {
      r = Number(rgba[1]);
      g = Number(rgba[2]);
      b = Number(rgba[3]);
    } else {
      const converted = colorToRgba(color, 1);
      const m = converted.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) {
        return [color];
      }
      r = Number(m[1]);
      g = Number(m[2]);
      b = Number(m[3]);
    }

    const gradient: string[] = [];

    for (let i = 0; i < steps; i++) {
      const factor = 1 - (i / Math.max(steps - 1, 1)) * 0.5;
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
