import { TestBed } from '@angular/core/testing';
import { ChartUtilsService } from './chart-utils.service';

describe('ChartUtilsService', () => {
  let service: ChartUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('formatCurrency', () => {
    it('should format currency with default symbol', () => {
      expect(service.formatCurrency(1234.56)).toBe('1234.56€');
    });

    it('should format currency with custom symbol', () => {
      expect(service.formatCurrency(1234.56, '$')).toBe('1234.56$');
    });

    it('should format currency with custom decimals', () => {
      expect(service.formatCurrency(1234.567, '€', 3)).toBe('1234.567€');
    });
  });

  describe('formatCompactNumber', () => {
    it('should format large numbers with M suffix', () => {
      expect(service.formatCompactNumber(1500000)).toBe('1.5M');
    });

    it('should format thousands with K suffix', () => {
      expect(service.formatCompactNumber(1500)).toBe('1.5K');
    });

    it('should return number as string for small values', () => {
      expect(service.formatCompactNumber(500)).toBe('500');
    });
  });

  describe('calculateTrend', () => {
    it('should calculate positive trend', () => {
      const trend = service.calculateTrend(110, 100);
      expect(trend.value).toBe('+10.0%');
      expect(trend.type).toBe('positive');
    });

    it('should calculate negative trend', () => {
      const trend = service.calculateTrend(90, 100);
      expect(trend.value).toBe('-10.0%');
      expect(trend.type).toBe('negative');
    });

    it('should handle zero previous value', () => {
      const trend = service.calculateTrend(100, 0);
      expect(trend.value).toBe('N/A');
      expect(trend.type).toBe('neutral');
    });

    it('should calculate neutral trend', () => {
      const trend = service.calculateTrend(100, 100);
      expect(trend.value).toBe('+0.0%');
      expect(trend.type).toBe('neutral');
    });
  });

  describe('aggregateData', () => {
    const data = [10, 20, 30, 40, 50];

    it('should calculate sum', () => {
      expect(service.aggregateData(data, 'sum')).toBe(150);
    });

    it('should calculate average', () => {
      expect(service.aggregateData(data, 'average')).toBe(30);
    });

    it('should calculate min', () => {
      expect(service.aggregateData(data, 'min')).toBe(10);
    });

    it('should calculate max', () => {
      expect(service.aggregateData(data, 'max')).toBe(50);
    });

    it('should calculate count', () => {
      expect(service.aggregateData(data, 'count')).toBe(5);
    });
  });

  describe('smoothData', () => {
    it('should smooth data with window size', () => {
      const data = [10, 50, 20, 60, 30];
      const smoothed = service.smoothData(data, 3);
      expect(smoothed.length).toBe(data.length);
      expect(smoothed[0]).toBeLessThan(50);
    });

    it('should return original data if window size is too large', () => {
      const data = [10, 20, 30];
      const smoothed = service.smoothData(data, 10);
      expect(smoothed).toEqual(data);
    });
  });

  describe('normalizeData', () => {
    it('should normalize data to 0-100 range', () => {
      const data = [0, 50, 100];
      const normalized = service.normalizeData(data);
      expect(normalized[0]).toBe(0);
      expect(normalized[2]).toBe(100);
    });

    it('should handle uniform data', () => {
      const data = [50, 50, 50];
      const normalized = service.normalizeData(data);
      expect(normalized).toEqual([0, 0, 0]);
    });
  });

  describe('interpolateMissingData', () => {
    it('should interpolate null values', () => {
      const data = [10, null, 30] as (number | null)[];
      const interpolated = service.interpolateMissingData(data);
      expect(interpolated[1]).toBe(20);
    });

    it('should handle multiple null values', () => {
      const data = [10, null, null, 40] as (number | null)[];
      const interpolated = service.interpolateMissingData(data);
      expect(interpolated.every(v => v !== null)).toBe(true);
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate moving average', () => {
      const data = [10, 20, 30, 40, 50];
      const ma = service.calculateMovingAverage(data, 3);
      expect(ma.length).toBe(data.length);
      expect(ma[2]).toBe(20); // (10 + 20 + 30) / 3
    });
  });

  describe('detectOutliers', () => {
    it('should detect outliers', () => {
      const data = [10, 12, 11, 13, 100, 9];
      const outliers = service.detectOutliers(data, 2);
      expect(outliers.length).toBeGreaterThan(0);
      expect(outliers).toContain(4); // Index of 100
    });
  });

  describe('exportToCSV', () => {
    it('should generate CSV string', () => {
      const labels = ['A', 'B', 'C'];
      const datasets = [
        { label: 'Series 1', data: [1, 2, 3] }
      ];
      const csv = service.exportToCSV(labels, datasets);
      expect(csv).toContain('Label,Series 1');
      expect(csv).toContain('A,1');
    });
  });

  describe('generateMockData', () => {
    it('should generate random data', () => {
      const data = service.generateMockData(10, 0, 100);
      expect(data.length).toBe(10);
      expect(data.every(v => v >= 0 && v <= 100)).toBe(true);
    });
  });

  describe('generateTrendData', () => {
    it('should generate upward trend', () => {
      const data = service.generateTrendData(10, 50, 'up', 5);
      expect(data.length).toBe(10);
      expect(data[data.length - 1]).toBeGreaterThan(data[0]);
    });

    it('should generate downward trend', () => {
      const data = service.generateTrendData(10, 50, 'down', 5);
      expect(data.length).toBe(10);
      expect(data[data.length - 1]).toBeLessThan(data[0]);
    });
  });
});
