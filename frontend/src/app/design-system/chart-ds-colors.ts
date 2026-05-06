/**
 * Résout les tokens `--ds-*` en couleurs utilisables par Chart.js (canvas).
 * Les variables CSS ne sont pas interpolées automatiquement sur le contexte canvas.
 */

/** Valeurs de repli alignées sur `tokens/_ds-tokens.scss` (thème clair). */
export const DS_CHART_FALLBACK_HEX: Record<string, string> = {
  '--ds-bg': '#f8f7f4',
  '--ds-marine': '#0d2c4a',
  '--ds-marine-light': '#1a4472',
  '--ds-marine-hover': '#07203a',
  '--ds-primary': '#b5622e',
  '--ds-primary-hover': '#944e22',
  '--ds-success': '#2e7d32',
  '--ds-warning': '#e65100',
  '--ds-error': '#c62828',
  '--ds-text-muted': '#605c52',
  '--ds-text-faint': '#a8a49a',
  '--ds-text': '#18160f',
  '--ds-text-inverse': '#ffffff',
  '--ds-surface': '#ffffff',
  '--ds-divider': '#e0ddd6',
  '--ds-marine-hl': '#dce8f2',
  '--ds-primary-hl': '#f2e0d5',
  '--ds-success-hl': '#e8f5e9',
  '--ds-warning-hl': '#fff3e0',
  '--ds-error-hl': '#ffebee',
  '--ds-primary-subtle': '#faf3ee',
  '--ds-surface-dynamic': '#e8e5de',
};

/** Ordre canonique des séries — aligné sur les charts métier (marine / accent / sémantique). */
export const DS_CHART_SERIES_VAR_NAMES = [
  '--ds-marine',
  '--ds-primary',
  '--ds-marine-light',
  '--ds-success',
  '--ds-warning',
  '--ds-error',
  '--ds-primary-hover',
  '--ds-text-muted',
] as const;

export function resolveDsToken(varName: string, fallbackHex?: string): string {
  if (typeof document === 'undefined') {
    return fallbackHex ?? DS_CHART_FALLBACK_HEX[varName] ?? '#18160f';
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (raw.length > 0) return raw;
  return fallbackHex ?? DS_CHART_FALLBACK_HEX[varName] ?? '#18160f';
}

/** Conversion vers `rgba(..., alpha)` pour remplissages Chart.js. */
export function dsRgba(varName: string, alpha: number, fallbackHex?: string): string {
  return colorToRgba(resolveDsToken(varName, fallbackHex), alpha);
}

export function dsChartSeriesRgba(index: number, alpha: number): string {
  const name = DS_CHART_SERIES_VAR_NAMES[index % DS_CHART_SERIES_VAR_NAMES.length];
  return dsRgba(name, alpha);
}

/** Dégradé pour barres empilées (ex. funnel), du marine vers marine-light. */
export function dsFunnelBarColors(count: number): string[] {
  if (count <= 0) return [];
  const from = hexToRgb(resolveDsToken('--ds-marine'));
  const to = hexToRgb(resolveDsToken('--ds-marine-light'));
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : i / (count - 1);
    const r = Math.round(from.r + (to.r - from.r) * t);
    const g = Math.round(from.g + (to.g - from.g) * t);
    const b = Math.round(from.b + (to.b - from.b) * t);
    out.push(`rgba(${r}, ${g}, ${b}, 0.92)`);
  }
  return out;
}

export function colorToRgba(color: string, alpha: number): string {
  const c = color.trim();
  if (c.startsWith('rgba(')) return replaceRgbaAlpha(c, alpha);
  if (c.startsWith('rgb(')) {
    const m = c.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (m) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
  }
  let hex = c.startsWith('#') ? c.slice(1) : c;
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (/^[0-9a-fA-F]{8}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(0, 0, 0, ${alpha})`;
}

function replaceRgbaAlpha(rgba: string, alpha: number): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return rgba;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
}

function hexToRgb(hexColor: string): { r: number; g: number; b: number } {
  const s = hexColor.trim().replace('#', '');
  if (s.length === 3) {
    return {
      r: parseInt(s[0] + s[0], 16),
      g: parseInt(s[1] + s[1], 16),
      b: parseInt(s[2] + s[2], 16),
    };
  }
  if (s.length >= 6) {
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16),
    };
  }
  return { r: 13, g: 44, b: 74 };
}
