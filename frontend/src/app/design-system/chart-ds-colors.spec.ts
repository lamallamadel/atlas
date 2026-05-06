import {
  colorToRgba,
  dsChartSeriesRgba,
  dsFunnelBarColors,
  dsRgba,
  resolveDsToken,
  DS_CHART_FALLBACK_HEX,
} from './chart-ds-colors';

describe('chart-ds-colors', () => {
  it('resolveDsToken uses fallback when var absent', () => {
    document.documentElement.style.removeProperty('--ds-marine');
    expect(resolveDsToken('--ds-marine')).toBe(DS_CHART_FALLBACK_HEX['--ds-marine']);
  });

  it('resolveDsToken prefers computed custom property', () => {
    document.documentElement.style.setProperty('--ds-marine', '#112233');
    expect(resolveDsToken('--ds-marine')).toBe('#112233');
    document.documentElement.style.removeProperty('--ds-marine');
  });

  it('dsRgba builds rgba from hex token', () => {
    document.documentElement.style.setProperty('--ds-success', '#2e7d32');
    expect(dsRgba('--ds-success', 0.5)).toBe('rgba(46, 125, 50, 0.5)');
    document.documentElement.style.removeProperty('--ds-success');
  });

  it('colorToRgba supports short hex', () => {
    expect(colorToRgba('#abc', 1)).toBe('rgba(170, 187, 204, 1)');
  });

  it('dsChartSeriesRgba cycles palette', () => {
    expect(dsChartSeriesRgba(0, 1)).toMatch(/^rgba\(/);
    expect(dsChartSeriesRgba(32, 0.4)).toMatch(/^rgba\(/);
  });

  it('dsFunnelBarColors returns gradient length', () => {
    const c = dsFunnelBarColors(4);
    expect(c.length).toBe(4);
    expect(c.every((x) => x.startsWith('rgba('))).toBe(true);
  });
});
