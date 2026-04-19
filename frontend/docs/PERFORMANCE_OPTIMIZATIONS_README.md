# Performance Optimizations Implementation

## Overview

This document describes all performance optimizations implemented in the frontend application, including bundle size optimization, lazy loading strategies, service worker implementation, and performance monitoring.

## Table of Contents

1. [Dynamic Imports (Lazy Loading)](#dynamic-imports-lazy-loading)
2. [Service Worker with Workbox Strategies](#service-worker-with-workbox-strategies)
3. [Skeleton Screens](#skeleton-screens)
4. [CDN-Ready Asset Configuration](#cdn-ready-asset-configuration)
5. [Bundle Analysis](#bundle-analysis)
6. [Performance Monitoring](#performance-monitoring)
7. [Usage Examples](#usage-examples)
8. [Build Commands](#build-commands)

---

## Dynamic Imports (Lazy Loading)

Heavy third-party libraries are now lazy-loaded on demand to reduce initial bundle size and improve Time to Interactive (TTI).

### 1. Shepherd.js (Tour System)

**File**: `src/app/services/onboarding-tour.service.ts`

**Implementation**:
```typescript
private async loadShepherd(): Promise<any> {
  const { default: Shepherd } = await import('shepherd.js');
  this.shepherdModule = Shepherd;
  return Shepherd;
}

async startDossierCreationTour(): Promise<void> {
  const tour = await this.createTour(tourId);
  // ... tour configuration
}
```

**Benefits**:
- ~50KB reduction in initial bundle
- Library only loads when tour is triggered
- Cached after first load

**Trigger Points**:
- Manual tour start via user action
- Automatic on first visit to specific routes

### 2. FullCalendar

**File**: `src/app/components/calendar-view.component.ts`

**Implementation**:
```typescript
private async loadCalendarPlugins(): Promise<void> {
  const [
    { default: dayGridPlugin },
    { default: timeGridPlugin },
    { default: listPlugin },
    { default: interactionPlugin },
    { default: iCalendarPlugin }
  ] = await Promise.all([
    import('@fullcalendar/daygrid'),
    import('@fullcalendar/timegrid'),
    import('@fullcalendar/list'),
    import('@fullcalendar/interaction'),
    import('@fullcalendar/icalendar')
  ]);

  this.calendarOptions.plugins = [
    dayGridPlugin,
    timeGridPlugin,
    listPlugin,
    interactionPlugin,
    iCalendarPlugin
  ];
}
```

**Benefits**:
- ~200KB reduction in initial bundle
- Plugins load in parallel when calendar view accessed
- Cached for subsequent visits

**Trigger Points**:
- Component initialization (ngOnInit)
- Only loads on calendar route

### 3. Chart.js

**File**: `src/app/components/reports-dashboard.component.ts`

**Implementation**:
```typescript
async ngAfterViewInit(): Promise<void> {
  await this.loadChartJs();
}

private async loadChartJs(): Promise<void> {
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);
  
  if (this.analyticsData) {
    await this.renderAllCharts();
  }
}
```

**Benefits**:
- ~150KB reduction in initial bundle
- Deferred until after view initialization
- Renders charts only after data is loaded

**Trigger Points**:
- Dashboard component AfterViewInit lifecycle
- Only on reports/analytics pages

---

## Service Worker with Workbox Strategies

**File**: `src/service-worker.js`

Enhanced service worker implementing multiple caching strategies for optimal offline-first performance.

### Cache Strategies

#### 1. Cache-First Strategy
**Best For**: Static assets (images, fonts, compiled JS/CSS)

```javascript
async function cacheFirstStrategy(request, cacheName) {
  // Check cache first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse && !isCacheExpired(cachedResponse, cacheName)) {
    return cachedResponse;
  }
  
  // Fetch from network and update cache
  const networkResponse = await fetch(request);
  const cache = await caches.open(cacheName);
  await cache.put(request, networkResponse.clone());
  
  return networkResponse;
}
```

**Configuration**:
- **Image Cache**: 30 days expiration, max 60 entries
- **Static Cache**: 24 hours expiration, max 50 entries

#### 2. Network-First Strategy
**Best For**: API calls and dynamic content

```javascript
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Update cache
    const cache = await caches.open(cacheName);
    await cache.put(request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    return await caches.match(request) || createOfflineResponse(request);
  }
}
```

**Configuration**:
- **API Cache**: 5 minutes expiration, max 100 entries
- **Runtime Cache**: 24 hours expiration, max 50 entries

#### 3. Stale-While-Revalidate Strategy
**Best For**: Non-critical assets

```javascript
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  // Fetch and update in background
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    const cache = await caches.open(cacheName);
    await cache.put(request, networkResponse.clone());
    return networkResponse;
  });
  
  // Return cached immediately, or wait for fetch
  return cachedResponse || fetchPromise;
}
```

### Cache Management

**Expiration Tracking**:
```javascript
function addCacheMetadata(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-time', Date.now().toString());
  return new Response(response.body, {
    status: response.status,
    headers: headers
  });
}

function isCacheExpired(response, cacheName) {
  const cacheTime = response.headers.get('sw-cache-time');
  const expirationTime = CACHE_EXPIRATION[cacheName];
  const age = (Date.now() - parseInt(cacheTime)) / 1000;
  return age > expirationTime;
}
```

**LRU Cache Trimming**:
```javascript
async function trimCache(cacheName) {
  const maxSize = MAX_CACHE_SIZE[cacheName];
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    const entriesToDelete = keys.length - maxSize;
    for (let i = 0; i < entriesToDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}
```

### Background Sync

```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-queue-sync') {
    event.waitUntil(syncOfflineQueue());
  }
});
```

---

## Skeleton Screens

**Component**: `app-loading-skeleton`

Replace traditional spinners with skeleton screens to improve perceived performance and reduce CLS.

### Available Variants

1. **Table Skeleton**
   ```html
   <app-loading-skeleton 
     *ngIf="loading" 
     variant="table" 
     [rows]="10" 
     [columns]="8">
   </app-loading-skeleton>
   ```

2. **List Skeleton**
   ```html
   <app-loading-skeleton 
     variant="list" 
     [rows]="5">
   </app-loading-skeleton>
   ```

3. **Card Skeleton**
   ```html
   <app-loading-skeleton 
     variant="card" 
     [rows]="3">
   </app-loading-skeleton>
   ```

### Implementation in List Views

**Before (Spinner)**:
```html
<div *ngIf="loading" class="spinner-container">
  <mat-spinner></mat-spinner>
</div>
```

**After (Skeleton)**:
```html
<app-loading-skeleton 
  *ngIf="loading && viewMode === 'list'" 
  variant="table" 
  [rows]="10" 
  [columns]="8">
</app-loading-skeleton>
```

**Benefits**:
- Reduced Cumulative Layout Shift (CLS)
- Better perceived performance
- Matches final content structure
- No jarring transitions

---

## CDN-Ready Asset Configuration

**File**: `angular.json`

### Production Build Configuration

```json
{
  "outputHashing": "all",
  "optimization": {
    "scripts": true,
    "styles": {
      "minify": true,
      "inlineCritical": true
    },
    "fonts": {
      "inline": true
    }
  },
  "sourceMap": {
    "scripts": true,
    "styles": false,
    "hidden": true
  },
  "namedChunks": false,
  "extractLicenses": true,
  "vendorChunk": true,
  "buildOptimizer": true
}
```

### Asset Hashing

**Benefits**:
- All assets get content-based hashes
- Enables aggressive CDN caching
- Automatic cache busting on updates
- Safe to cache indefinitely

**Example Output**:
```
main.a3f4b2c1.js
styles.8d9e6f2a.css
vendor.4b7c9e1d.js
```

### Compression

**Recommended nginx configuration**:
```nginx
# Brotli compression
brotli on;
brotli_types text/plain text/css application/javascript application/json;
brotli_comp_level 6;

# Gzip fallback
gzip on;
gzip_types text/plain text/css application/javascript application/json;
gzip_comp_level 6;

# Cache static assets aggressively
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

---

## Bundle Analysis

### Commands

```bash
# Build with stats and analyze
npm run build:analyze

# Analyze existing build
npm run analyze:bundle

# Analyze source maps
npm run analyze:source

# Production build
npm run build:prod
```

### Webpack Bundle Analyzer

**Port**: 8888 (default)
**Interface**: Interactive treemap visualization

**Shows**:
- Bundle sizes (parsed, stat, gzipped)
- Module composition
- Duplicate dependencies
- Chunk relationships

**Usage**:
```bash
npm run build:analyze
# Opens http://localhost:8888 automatically
```

### Source Map Explorer

**Analyzes actual bundle content**:
```bash
npm run analyze:source
```

**Shows**:
- Exact source file sizes
- Tree-shaking effectiveness
- Dead code detection

---

## Performance Monitoring

**Service**: `PerformanceMonitorService`

### Core Web Vitals Tracking

```typescript
constructor(private perfMonitor: PerformanceMonitorService) {
  // Automatic tracking starts
}

// Get current metrics
const metrics = perfMonitor.getMetrics();

// Get performance grade
const grade = perfMonitor.getPerformanceGrade();
// Returns: 'good' | 'needs-improvement' | 'poor' | 'unknown'
```

### Custom Metrics

```typescript
// Mark timing points
perfMonitor.mark('data-fetch-start');
// ... fetch data ...
perfMonitor.mark('data-fetch-end');

// Measure duration
const duration = perfMonitor.measure(
  'data-fetch-duration',
  'data-fetch-start',
  'data-fetch-end'
);
```

### API Performance

```typescript
// Track API response times
const startTime = performance.now();
apiService.getData().subscribe(() => {
  perfMonitor.measureApiCall('/api/v1/data', startTime);
});
```

### Cache Performance

```typescript
// Track cache hits/misses
perfMonitor.recordCacheHit();
perfMonitor.recordCacheMiss();

// Get cache hit rate
const metrics = perfMonitor.getMetrics();
console.log('Cache hit rate:', metrics.cacheHitRate);
```

### Long Task Monitoring

```typescript
// Monitor tasks blocking main thread > 50ms
perfMonitor.observeLongTasks();
```

---

## Usage Examples

### Full Example: Dossiers List Component

```typescript
import { Component, OnInit } from '@angular/core';
import { PerformanceMonitorService } from '../services/performance-monitor.service';

@Component({
  selector: 'app-dossiers',
  template: `
    <app-loading-skeleton 
      *ngIf="loading" 
      variant="table" 
      [rows]="10" 
      [columns]="8">
    </app-loading-skeleton>
    
    <app-generic-table
      *ngIf="!loading"
      [data]="dossiers"
      [columns]="columns">
    </app-generic-table>
  `
})
export class DossiersComponent implements OnInit {
  loading = false;
  dossiers: any[] = [];

  constructor(
    private dossierService: DossierApiService,
    private perfMonitor: PerformanceMonitorService
  ) {}

  ngOnInit(): void {
    this.perfMonitor.mark('dossiers-load-start');
    this.loadDossiers();
  }

  loadDossiers(): void {
    this.loading = true;
    const startTime = performance.now();

    this.dossierService.list().subscribe({
      next: (response) => {
        this.dossiers = response.content;
        this.loading = false;
        
        // Track API performance
        this.perfMonitor.measureApiCall('/api/v1/dossiers', startTime);
        
        // Measure total load time
        this.perfMonitor.mark('dossiers-load-end');
        this.perfMonitor.measure(
          'dossiers-load-duration',
          'dossiers-load-start',
          'dossiers-load-end'
        );
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
```

---

## Build Commands

### Development
```bash
npm start                    # Dev server
npm run watch               # Watch mode
```

### Production
```bash
npm run build:prod          # Production build
npm run build:analyze       # Build + analyze
```

### Analysis
```bash
npm run analyze:bundle      # Analyze bundle
npm run analyze:source      # Analyze sources
```

### Testing
```bash
npm test                    # Unit tests
npm run e2e                 # E2E tests
npm run e2e:fast            # Fast E2E
```

---

## Performance Targets

### Bundle Size
- Initial bundle: < 500KB (gzipped)
- Lazy chunks: < 200KB each
- Vendor chunk: < 300KB

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Lighthouse Scores
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90
- PWA: > 90

---

## Monitoring & Alerts

### Production Monitoring

1. **Real User Monitoring (RUM)**
   - Track Core Web Vitals
   - Monitor bundle load times
   - Track cache hit rates

2. **Synthetic Monitoring**
   - Regular Lighthouse CI audits
   - Bundle size tracking
   - Performance regression detection

3. **Analytics Integration**
   ```typescript
   // Automatic reporting to Google Analytics
   if (window.gtag) {
     gtag('event', 'performance_metric', {
       event_category: 'Performance',
       event_label: metricName,
       value: metricValue
     });
   }
   ```

---

## Troubleshooting

### Bundle Size Too Large
1. Run `npm run build:analyze`
2. Identify large dependencies
3. Check for duplicates
4. Consider lazy loading or alternatives

### Slow Initial Load
1. Check network waterfall
2. Verify service worker caching
3. Review critical CSS inlining
4. Check for render-blocking resources

### Cache Issues
1. Clear service worker cache
2. Update cache version in `service-worker.js`
3. Check cache expiration settings
4. Verify network strategies

---

## Next Steps

1. Monitor production metrics
2. Regular bundle analysis
3. Update dependencies quarterly
4. Optimize based on real user data
5. Consider HTTP/3 and Server Push

## References

- [Web.dev Performance](https://web.dev/performance/)
- [Angular Performance Guide](https://angular.io/guide/deployment#optimization)
- [Webpack Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- [Core Web Vitals](https://web.dev/vitals/)
