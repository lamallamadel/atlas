import { Injectable } from '@angular/core';
import { ChartDataset, ChartFilterConfig, ChartDataTransform } from '../models/chart.types';

@Injectable({
  providedIn: 'root'
})
export class ChartUtilsService {

  formatCurrency(value: number, currency = '€', decimals = 2): string {
    return `${value.toFixed(decimals)}${currency}`;
  }

  formatNumber(value: number, decimals = 0): string {
    return value.toLocaleString('fr-FR', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  formatPercentage(value: number, decimals = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  formatCompactNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
    if (format === 'short') {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    }
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  calculateTrend(current: number, previous: number): {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  } {
    if (previous === 0) {
      return { value: 'N/A', type: 'neutral' };
    }

    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    const type = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';

    return {
      value: `${sign}${change.toFixed(1)}%`,
      type
    };
  }

  aggregateData(data: number[], method: 'sum' | 'average' | 'min' | 'max' | 'count'): number {
    switch (method) {
      case 'sum':
        return data.reduce((acc, val) => acc + val, 0);
      case 'average':
        return data.length > 0 ? data.reduce((acc, val) => acc + val, 0) / data.length : 0;
      case 'min':
        return Math.min(...data);
      case 'max':
        return Math.max(...data);
      case 'count':
        return data.length;
      default:
        return 0;
    }
  }

  groupByPeriod(
    data: Array<{ date: Date; value: number }>,
    period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ): Array<{ label: string; value: number }> {
    const grouped = new Map<string, number>();

    data.forEach(item => {
      const key = this.getPeriodKey(item.date, period);
      grouped.set(key, (grouped.get(key) || 0) + item.value);
    });

    return Array.from(grouped.entries()).map(([label, value]) => ({ label, value }));
  }

  private getPeriodKey(date: Date, period: 'day' | 'week' | 'month' | 'quarter' | 'year'): string {
    switch (period) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week': {
        const weekNumber = this.getWeekNumber(date);
        return `${date.getFullYear()}-W${weekNumber}`;
      }
      case 'month':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      case 'quarter': {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      }
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  filterDataByDateRange(
    data: Array<{ date: Date; value: number }>,
    startDate: Date,
    endDate: Date
  ): Array<{ date: Date; value: number }> {
    return data.filter(item => item.date >= startDate && item.date <= endDate);
  }

  filterDataByValue(
    data: Array<{ value: number }>,
    min?: number,
    max?: number
  ): Array<{ value: number }> {
    return data.filter(item => {
      if (min !== undefined && item.value < min) return false;
      if (max !== undefined && item.value > max) return false;
      return true;
    });
  }

  smoothData(data: number[], windowSize = 3): number[] {
    if (windowSize < 1 || data.length < windowSize) return data;

    const smoothed: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
      const window = data.slice(start, end);
      const avg = window.reduce((acc, val) => acc + val, 0) / window.length;
      smoothed.push(avg);
    }

    return smoothed;
  }

  normalizeData(data: number[], min = 0, max = 100): number[] {
    const dataMin = Math.min(...data);
    const dataMax = Math.max(...data);
    
    if (dataMax === dataMin) return data.map(() => min);

    return data.map(value => 
      min + ((value - dataMin) / (dataMax - dataMin)) * (max - min)
    );
  }

  interpolateMissingData(data: (number | null)[]): number[] {
    const result = [...data];
    
    for (let i = 0; i < result.length; i++) {
      if (result[i] === null) {
        let prevIndex = i - 1;
        let nextIndex = i + 1;

        while (prevIndex >= 0 && result[prevIndex] === null) prevIndex--;
        while (nextIndex < result.length && result[nextIndex] === null) nextIndex++;

        if (prevIndex >= 0 && nextIndex < result.length) {
          const prevValue = result[prevIndex] as number;
          const nextValue = result[nextIndex] as number;
          const ratio = (i - prevIndex) / (nextIndex - prevIndex);
          result[i] = prevValue + (nextValue - prevValue) * ratio;
        } else if (prevIndex >= 0) {
          result[i] = result[prevIndex] as number;
        } else if (nextIndex < result.length) {
          result[i] = result[nextIndex] as number;
        } else {
          result[i] = 0;
        }
      }
    }

    return result as number[];
  }

  calculateMovingAverage(data: number[], period: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(data[i]);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
        result.push(sum / period);
      }
    }

    return result;
  }

  detectOutliers(data: number[], threshold = 2): number[] {
    const mean = this.aggregateData(data, 'average');
    const stdDev = this.calculateStandardDeviation(data, mean);
    
    return data.map((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      return zScore > threshold ? index : -1;
    }).filter(index => index !== -1);
  }

  private calculateStandardDeviation(data: number[], mean: number): number {
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  mergeDatasets(datasets: ChartDataset[]): ChartDataset {
    const mergedData: number[] = [];
    const maxLength = Math.max(...datasets.map(ds => Array.isArray(ds.data) ? ds.data.length : 0));

    for (let i = 0; i < maxLength; i++) {
      let sum = 0;
      datasets.forEach(ds => {
        if (Array.isArray(ds.data) && typeof ds.data[i] === 'number') {
          sum += ds.data[i] as number;
        }
      });
      mergedData.push(sum);
    }

    return {
      label: 'Merged',
      data: mergedData
    };
  }

  transposeData(datasets: ChartDataset[]): ChartDataset[] {
    if (datasets.length === 0) return [];

    const firstDataset = datasets[0];
    const dataLength = Array.isArray(firstDataset.data) ? firstDataset.data.length : 0;
    const transposed: ChartDataset[] = [];

    for (let i = 0; i < dataLength; i++) {
      const data: number[] = [];
      datasets.forEach(ds => {
        if (Array.isArray(ds.data) && typeof ds.data[i] === 'number') {
          data.push(ds.data[i] as number);
        }
      });

      transposed.push({
        label: `Series ${i + 1}`,
        data
      });
    }

    return transposed;
  }

  calculateCorrelation(data1: number[], data2: number[]): number {
    if (data1.length !== data2.length || data1.length === 0) return 0;

    const mean1 = this.aggregateData(data1, 'average');
    const mean2 = this.aggregateData(data2, 'average');

    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < data1.length; i++) {
      const diff1 = data1[i] - mean1;
      const diff2 = data2[i] - mean2;
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  generateColorGradient(startColor: string, endColor: string, steps: number): string[] {
    const start = this.parseRGBA(startColor);
    const end = this.parseRGBA(endColor);
    const gradient: string[] = [];

    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const r = Math.round(start.r + (end.r - start.r) * ratio);
      const g = Math.round(start.g + (end.g - start.g) * ratio);
      const b = Math.round(start.b + (end.b - start.b) * ratio);
      const a = start.a + (end.a - start.a) * ratio;
      gradient.push(`rgba(${r}, ${g}, ${b}, ${a})`);
    }

    return gradient;
  }

  private parseRGBA(color: string): { r: number; g: number; b: number; a: number } {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return { r: 0, g: 0, b: 0, a: 1 };

    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: parseFloat(match[4] || '1')
    };
  }

  exportToCSV(labels: string[], datasets: ChartDataset[]): string {
    let csv = 'Label,' + datasets.map(ds => ds.label).join(',') + '\n';

    for (let i = 0; i < labels.length; i++) {
      const row = [labels[i]];
      datasets.forEach(ds => {
        if (Array.isArray(ds.data) && typeof ds.data[i] === 'number') {
          row.push(ds.data[i].toString());
        } else {
          row.push('');
        }
      });
      csv += row.join(',') + '\n';
    }

    return csv;
  }

  downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  applyTransform(data: any[], transform: ChartDataTransform): any[] {
    let result = data;

    if (transform.filter) {
      result = transform.filter(result);
    }

    if (transform.map) {
      result = transform.map(result);
    }

    if (transform.sort) {
      result = [...result].sort(transform.sort);
    }

    return result;
  }

  generateMockData(count: number, min = 0, max = 100): number[] {
    const data: number[] = [];
    for (let i = 0; i < count; i++) {
      data.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return data;
  }

  generateTrendData(count: number, start: number, trend: 'up' | 'down' | 'flat', variance = 10): number[] {
    const data: number[] = [];
    let current = start;
    const trendFactor = trend === 'up' ? 1 : trend === 'down' ? -1 : 0;

    for (let i = 0; i < count; i++) {
      const randomVariance = (Math.random() - 0.5) * variance;
      current += trendFactor * (variance / 2) + randomVariance;
      current = Math.max(0, current);
      data.push(Math.round(current));
    }

    return data;
  }
}
