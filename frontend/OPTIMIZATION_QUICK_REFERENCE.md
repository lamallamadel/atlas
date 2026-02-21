# Performance Optimization Quick Reference

## 🚀 Quick Commands

```bash
# Build and analyze bundle
npm run build:analyze

# Production build
npm run build:prod

# Analyze existing build
npm run analyze:bundle

# Analyze source maps
npm run analyze:source
```

## 📦 Lazy Loading Libraries

### When to use dynamic imports?
Use for libraries > 50KB that aren't needed on initial page load.

### Shepherd.js (Tours)
```typescript
// ❌ DON'T - Eager load
import Shepherd from 'shepherd.js';

// ✅ DO - Lazy load
const { default: Shepherd } = await import('shepherd.js');
```

### FullCalendar
```typescript
// ✅ Load all plugins in parallel
const [dayGrid, timeGrid, list] = await Promise.all([
  import('@fullcalendar/daygrid'),
  import('@fullcalendar/timegrid'),
  import('@fullcalendar/list')
]);
```

### Chart.js
```typescript
// ✅ Load in AfterViewInit
async ngAfterViewInit() {
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);
}
```

## 🎨 Skeleton Screens

### Replace spinners with skeletons:

```html
<!-- ❌ DON'T - Use spinners -->
<mat-spinner *ngIf="loading"></mat-spinner>

<!-- ✅ DO - Use skeletons -->
<app-loading-skeleton 
  *ngIf="loading" 
  variant="table" 
  [rows]="10" 
  [columns]="8">
</app-loading-skeleton>
```

### Available variants:
- `table` - Data tables
- `list` - Simple lists
- `card` - Card layouts
- `form` - Forms
- `dashboard-kpi` - KPI widgets
- `detail` - Detail pages
- `grid` - Grid layouts
- `message` - Messaging
- `timeline` - Activity timelines

## 💾 Service Worker Caching

### Cache strategies automatically applied:
- **API calls** → Network-First (5min cache)
- **Images** → Cache-First (30 days)
- **Static assets** → Cache-First (24 hours)
- **Other assets** → Stale-While-Revalidate

### Clear cache programmatically:
```typescript
constructor(private swService: ServiceWorkerRegistrationService) {}

clearCache() {
  this.swService.clearCache();
}
```

## 📊 Performance Monitoring

### Track API calls:
```typescript
const startTime = performance.now();
apiService.getData().subscribe(() => {
  perfMonitor.measureApiCall('/api/v1/data', startTime);
});
```

### Custom timing:
```typescript
perfMonitor.mark('operation-start');
// ... do work ...
perfMonitor.mark('operation-end');
perfMonitor.measure('operation', 'operation-start', 'operation-end');
```

### Get performance grade:
```typescript
const grade = perfMonitor.getPerformanceGrade();
// Returns: 'good' | 'needs-improvement' | 'poor'
```

## 🎯 Bundle Size Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial bundle (gzipped) | < 500KB | Check with `npm run build:analyze` |
| Lazy chunk | < 200KB | Per chunk |
| Vendor chunk | < 300KB | Shared dependencies |

## ⚡ Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | 2.5s - 4s | > 4s |
| FID | ≤ 100ms | 100ms - 300ms | > 300ms |
| CLS | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |

## 🔍 Debugging Performance

### Check bundle composition:
```bash
npm run build:analyze
# Opens http://localhost:8888
```

### Check source maps:
```bash
npm run analyze:source
```

### Monitor in DevTools:
1. Open Chrome DevTools
2. Performance tab
3. Record interaction
4. Check for:
   - Long tasks (> 50ms)
   - Layout shifts
   - Large bundles

## 📝 Checklist for New Components

- [ ] Use skeleton screens instead of spinners
- [ ] Lazy load heavy dependencies (> 50KB)
- [ ] Track performance metrics for critical paths
- [ ] Optimize images (WebP, lazy loading)
- [ ] Use virtual scrolling for long lists
- [ ] Implement proper loading states
- [ ] Test on slow 3G network
- [ ] Check Lighthouse score

## 🛠️ Common Issues & Solutions

### Bundle size too large?
1. Run `npm run build:analyze`
2. Identify large dependencies
3. Check for duplicates
4. Lazy load or find alternatives

### Slow page load?
1. Check network waterfall
2. Verify service worker is active
3. Check for render-blocking resources
4. Review critical CSS

### Low cache hit rate?
1. Check service worker registration
2. Verify cache strategies
3. Check network conditions
4. Review cache expiration times

## 📚 Additional Resources

- [Full Documentation](./PERFORMANCE_OPTIMIZATIONS_README.md)
- [Bundle Optimization Guide](./BUNDLE_OPTIMIZATION.md)
- [Web.dev Performance](https://web.dev/performance/)
- [Angular Performance](https://angular.io/guide/deployment#optimization)
