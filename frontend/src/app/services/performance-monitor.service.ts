import { Injectable } from '@angular/core';

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Additional metrics
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  tti?: number; // Time to Interactive
  
  // Custom metrics
  bundleLoadTime?: number;
  apiResponseTime?: number;
  cacheHitRate?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceMonitorService {
  private metrics: PerformanceMetrics = {};
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor() {
    if ('PerformanceObserver' in window) {
      this.observeWebVitals();
    }
    
    this.measureNavigationTiming();
  }

  private observeWebVitals(): void {
    // Observe Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observation not supported');
    }

    // Observe First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.reportMetric('FID', this.metrics.fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observation not supported');
    }

    // Observe Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
        this.reportMetric('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observation not supported');
    }

    // Observe First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime;
          this.reportMetric('FCP', fcpEntry.startTime);
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP observation not supported');
    }
  }

  private measureNavigationTiming(): void {
    if (!('performance' in window) || !performance.timing) {
      return;
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing;
        
        // Time to First Byte
        this.metrics.ttfb = timing.responseStart - timing.requestStart;
        this.reportMetric('TTFB', this.metrics.ttfb);
        
        // Page Load Time
        const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        this.reportMetric('PageLoad', pageLoadTime);
        
        // DOM Content Loaded
        const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
        this.reportMetric('DOMContentLoaded', domContentLoaded);
      }, 0);
    });
  }

  /**
   * Measure API response time
   */
  measureApiCall(url: string, startTime: number): void {
    const duration = performance.now() - startTime;
    
    if (!this.metrics.apiResponseTime) {
      this.metrics.apiResponseTime = duration;
    } else {
      // Running average
      this.metrics.apiResponseTime = (this.metrics.apiResponseTime + duration) / 2;
    }
    
    this.reportMetric('API', duration, { url });
  }

  /**
   * Track cache performance
   */
  recordCacheHit(): void {
    this.cacheHits++;
    this.updateCacheHitRate();
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
    this.updateCacheHitRate();
  }

  private updateCacheHitRate(): void {
    const total = this.cacheHits + this.cacheMisses;
    if (total > 0) {
      this.metrics.cacheHitRate = (this.cacheHits / total) * 100;
      this.reportMetric('CacheHitRate', this.metrics.cacheHitRate);
    }
  }

  /**
   * Mark timing for custom metrics
   */
  mark(name: string): void {
    if ('performance' in window && performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark: string): number | null {
    if (!('performance' in window) || !performance.measure) {
      return null;
    }

    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      this.reportMetric(name, measure.duration);
      return measure.duration;
    } catch (e) {
      console.warn('Performance measurement failed:', e);
      return null;
    }
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Report metric to analytics
   */
  private reportMetric(name: string, value: number, metadata?: any): void {
    console.log(`[Performance] ${name}:`, value.toFixed(2), 'ms', metadata || '');
    
    // Send to analytics (Google Analytics, custom endpoint, etc.)
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(value),
        ...metadata
      });
    }

    // Send to custom analytics endpoint
    this.sendToAnalyticsEndpoint(name, value, metadata);
  }

  private sendToAnalyticsEndpoint(name: string, value: number, metadata?: any): void {
    // Optional: Send to custom backend analytics
    // Debounce and batch for efficiency
    const payload = {
      metric: name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...metadata
    };

    // Example: send to backend
    // fetch('/api/v1/analytics/performance', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // }).catch(() => {
    //   // Silent fail for analytics
    // });
  }

  /**
   * Get performance grade based on Core Web Vitals
   */
  getPerformanceGrade(): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
    const { lcp, fid, cls } = this.metrics;

    if (!lcp || !fid || cls === undefined) {
      return 'unknown';
    }

    const lcpGood = lcp <= 2500;
    const fidGood = fid <= 100;
    const clsGood = cls <= 0.1;

    const lcpPoor = lcp > 4000;
    const fidPoor = fid > 300;
    const clsPoor = cls > 0.25;

    if (lcpGood && fidGood && clsGood) {
      return 'good';
    } else if (lcpPoor || fidPoor || clsPoor) {
      return 'poor';
    } else {
      return 'needs-improvement';
    }
  }

  /**
   * Get resource timing for lazy-loaded chunks
   */
  getChunkLoadTimes(): Array<{ name: string; duration: number }> {
    if (!('performance' in window) || !performance.getEntriesByType) {
      return [];
    }

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return resources
      .filter((resource) => resource.name.includes('.js') && resource.name.includes('chunk'))
      .map((resource) => ({
        name: resource.name.split('/').pop() || 'unknown',
        duration: resource.duration
      }));
  }

  /**
   * Monitor long tasks (> 50ms) that block the main thread
   */
  observeLongTasks(): void {
    if (!('PerformanceLongTaskTiming' in window)) {
      console.warn('Long Task API not supported');
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.warn('[Performance] Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime
          });
          
          this.reportMetric('LongTask', entry.duration);
        });
      });
      
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('Long task observation failed:', e);
    }
  }
}
