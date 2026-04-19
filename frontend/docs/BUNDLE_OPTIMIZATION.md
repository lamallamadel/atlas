# Bundle Optimization & Performance Guide

## Overview

This document describes the bundle optimization strategies and performance enhancements implemented in the frontend application.

## Dynamic Imports (Lazy Loading)

### Shepherd.js (Tour Library)
- **Location**: `src/app/services/onboarding-tour.service.ts`
- **Strategy**: Lazy-loaded on first tour trigger
- **Benefit**: ~50KB savings on initial bundle
- **Implementation**:
  ```typescript
  const { default: Shepherd } = await import('shepherd.js');
  ```

### FullCalendar
- **Location**: `src/app/components/calendar-view.component.ts`
- **Strategy**: Lazy-loaded when calendar view is accessed
- **Benefit**: ~200KB+ savings on initial bundle
- **Plugins loaded**: daygrid, timegrid, list, interaction, icalendar
- **Implementation**:
  ```typescript
  await Promise.all([
    import('@fullcalendar/daygrid'),
    import('@fullcalendar/timegrid'),
    // ... other plugins
  ]);
  ```

### Chart.js
- **Location**: `src/app/components/reports-dashboard.component.ts`
- **Strategy**: Lazy-loaded when dashboard mounts (AfterViewInit)
- **Benefit**: ~150KB savings on initial bundle
- **Implementation**:
  ```typescript
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);
  ```

## Service Worker with Workbox Strategies

### Cache Strategies

#### 1. Cache-First
- **Use Case**: Static assets (images, fonts, compiled JS/CSS)
- **Max Age**: 30 days for images, 24 hours for runtime
- **Max Size**: 60 entries for images, 50 for runtime
- **Benefits**: Fastest loading for static resources

#### 2. Network-First
- **Use Case**: API calls, dynamic content
- **Max Age**: 5 minutes
- **Max Size**: 100 API responses
- **Benefits**: Fresh data with offline fallback

#### 3. Stale-While-Revalidate
- **Use Case**: Non-critical assets
- **Benefits**: Instant response with background updates

### Cache Configuration
```javascript
const CACHE_EXPIRATION = {
  [API_CACHE]: 5 * 60,           // 5 minutes
  [IMAGE_CACHE]: 30 * 24 * 60 * 60, // 30 days
  [RUNTIME_CACHE]: 24 * 60 * 60     // 24 hours
};
```

### Offline Support
- API requests cached for offline access
- Background sync for queued operations
- Automatic cache trimming (LRU eviction)
- Cache expiration with metadata tracking

## Skeleton Screens

### List Views
- **Component**: `app-loading-skeleton`
- **Variants**: table, list, card
- **Usage**:
  ```html
  <app-loading-skeleton 
    *ngIf="loading" 
    variant="table" 
    [rows]="10" 
    [columns]="8">
  </app-loading-skeleton>
  ```
- **Benefits**:
  - Better perceived performance
  - Eliminates "flash of empty content"
  - Reduces CLS (Cumulative Layout Shift)

### Available Variants
- `table` - For data tables with rows and columns
- `list` - For simple list views
- `card` - For card-based layouts
- `form` - For forms
- `dashboard-kpi` - For KPI widgets
- `detail` - For detail pages
- `grid` - For grid layouts
- `message` - For messaging interfaces
- `timeline` - For activity timelines

## CDN-Ready Asset Configuration

### Production Build Settings
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
  "namedChunks": false,
  "extractLicenses": true,
  "vendorChunk": true,
  "buildOptimizer": true
}
```

### Asset Hashing
- **All files**: Content-based hashing enabled
- **Benefits**: 
  - Aggressive caching without stale content
  - CDN-friendly (CloudFront, CloudFlare, etc.)
  - Cache busting on updates

### Compression
- **Gzip**: Automatic via Angular build
- **Brotli**: Recommended for production server
- **Source Maps**: Hidden source maps for debugging

## Bundle Analysis

### Running Analysis

```bash
# Build and analyze bundle
npm run build:analyze

# Just analyze existing build
npm run analyze:bundle

# Analyze source maps
npm run analyze:source
```

### Webpack Bundle Analyzer
- **Port**: 8888 (default)
- **Output**: Interactive treemap visualization
- **Shows**:
  - Actual bundle sizes
  - Gzipped sizes
  - Module composition
  - Duplicate dependencies

### Key Metrics to Monitor

1. **Initial Bundle Size**
   - Target: < 500KB (gzipped)
   - Current: Monitor with `npm run build:analyze`

2. **Lazy-Loaded Chunks**
   - Shepherd.js: ~50KB
   - FullCalendar: ~200KB
   - Chart.js: ~150KB

3. **Vendor Chunk**
   - Angular core & common
   - RxJS
   - Material components

## Performance Optimizations

### 1. Code Splitting
- Route-based lazy loading
- Dynamic imports for heavy libraries
- Vendor chunk separation

### 2. Tree Shaking
- ES modules for all imports
- No side effects in imports
- Dead code elimination

### 3. Minification
- Terser for JavaScript
- cssnano for CSS
- HTML minification

### 4. Compression
- Gzip compression ready
- Brotli compression recommended
- Asset size reduction: ~70-80%

### 5. Caching
- Service worker caching
- HTTP cache headers
- Content-based hashing

## Performance Budgets

### Current Budgets (angular.json)
```json
{
  "type": "initial",
  "maximumWarning": "2mb",
  "maximumError": "3.5mb"
},
{
  "type": "anyComponentStyle",
  "maximumWarning": "30kb",
  "maximumError": "40kb"
}
```

### Lighthouse Targets
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90
- **PWA**: > 90

## Deployment Recommendations

### 1. CDN Configuration
```nginx
# Cache static assets aggressively
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# Cache index.html cautiously
location = /index.html {
  expires -1;
  add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### 2. Compression
```nginx
# Enable Brotli
brotli on;
brotli_types text/plain text/css application/javascript application/json image/svg+xml;
brotli_comp_level 6;

# Gzip fallback
gzip on;
gzip_types text/plain text/css application/javascript application/json;
gzip_comp_level 6;
```

### 3. HTTP/2 & HTTP/3
- Enable HTTP/2 for multiplexing
- Use Server Push for critical resources
- Consider HTTP/3 (QUIC) for even better performance

## Monitoring

### 1. Real User Monitoring (RUM)
- Track Core Web Vitals
- Monitor bundle load times
- Track cache hit rates

### 2. Synthetic Monitoring
- Regular Lighthouse audits
- WebPageTest analysis
- Bundle size tracking

### 3. Service Worker Analytics
```javascript
// Track cache hits/misses
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_HIT') {
    // Track cache hit
  }
});
```

## Maintenance

### Regular Tasks

1. **Weekly**: Check bundle size after PR merges
2. **Monthly**: Run full bundle analysis
3. **Quarterly**: Review and update dependencies
4. **Yearly**: Major optimization audit

### Dependency Updates
```bash
# Check outdated packages
npm outdated

# Update with caution
npm update

# Analyze impact
npm run build:analyze
```

## Troubleshooting

### Large Bundle Size
1. Run `npm run build:analyze`
2. Identify large dependencies
3. Consider alternatives or lazy loading
4. Check for duplicate dependencies

### Slow Initial Load
1. Check network waterfall
2. Verify service worker caching
3. Review critical CSS inlining
4. Check for render-blocking resources

### High Cache Miss Rate
1. Review cache strategy settings
2. Check cache expiration times
3. Verify service worker registration
4. Monitor network conditions

## Additional Resources

- [Angular Build Optimization](https://angular.io/guide/deployment#optimization)
- [Webpack Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
