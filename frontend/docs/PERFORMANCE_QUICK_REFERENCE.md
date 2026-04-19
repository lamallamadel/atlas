# Performance Optimizations - Quick Reference

## Quick Start

### 1. View Bundle Analysis
```bash
cd frontend
npm run analyze
```

### 2. Enable Virtual Scrolling on Table
```typescript
<app-generic-table
  [data]="myLargeDataset"
  [enableVirtualScroll]="true"
  [virtualScrollItemSize]="150">
</app-generic-table>
```

### 3. Add OnPush to Component
```typescript
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 4. Add TrackBy Function
```typescript
// In component
trackById(index: number, item: any): number {
  return item.id;
}

// In template
<div *ngFor="let item of items; trackBy: trackById">
  {{ item.name }}
</div>
```

## TrackBy Function Templates

### By ID (Most Common)
```typescript
trackById(index: number, item: any): number {
  return item.id;
}
```

### By Index (Static Lists)
```typescript
trackByIndex(index: number): number {
  return index;
}
```

### By String Key
```typescript
trackByKey(index: number, key: string): string {
  return key;
}
```

### Complex Objects
```typescript
trackByCompositeKey(index: number, item: any): string {
  return `${item.id}-${item.type}`;
}
```

## OnPush Best Practices

### ✅ Good Candidates
- Pure presentational components
- Components with only `@Input()` properties
- List item components
- Card/tile components
- Badge/label components

### ❌ Avoid OnPush
- Components with service subscriptions in template
- Components with complex internal state
- Components that need frequent updates
- Root/smart components managing state

## Virtual Scrolling Guide

### When to Use
- Lists with 50+ items
- Infinite scroll
- Mobile views
- Data grids

### Configuration
```typescript
// Default item size
[virtualScrollItemSize]="48"  // Small items (list)
[virtualScrollItemSize]="150" // Medium items (cards)
[virtualScrollItemSize]="300" // Large items (detailed cards)
```

### CSS Requirements
```css
.virtual-scroll-viewport {
  height: 600px; /* Must have fixed height */
  width: 100%;
}
```

## Lazy Loading Pattern

### Import Dynamically
```typescript
async loadModule(): Promise<void> {
  const module = await import('./heavy-module');
  // Use module
}
```

### For Chart.js
```typescript
async createChart(): Promise<void> {
  const chartModule = await import('chart.js/auto');
  const Chart = chartModule.Chart;
  new Chart(canvas, config);
}
```

## Performance Checklist

### For New Components
- [ ] Add OnPush if presentational
- [ ] Add trackBy to all ngFor
- [ ] Use virtual scrolling if list is large
- [ ] Lazy load heavy dependencies
- [ ] Optimize images
- [ ] Use pure pipes

### For Existing Components
- [ ] Profile with Angular DevTools
- [ ] Check change detection frequency
- [ ] Review ngFor without trackBy
- [ ] Identify heavy computations
- [ ] Check for memory leaks
- [ ] Review bundle size contribution

## Monitoring Commands

### Build and Analyze
```bash
npm run build
npm run analyze
```

### Check Bundle Size
```bash
npm run build -- --stats-json
```

### Development Build
```bash
npm start
```

## Common Pitfalls

### ❌ Don't Do This
```typescript
// Mutation without new reference (OnPush won't detect)
this.items.push(newItem);

// Function in template (breaks OnPush)
<div *ngFor="let item of getItems()">

// No trackBy
<div *ngFor="let item of items">
```

### ✅ Do This Instead
```typescript
// Create new reference
this.items = [...this.items, newItem];

// Store in property
this.filteredItems = this.getItems();

// Use trackBy
<div *ngFor="let item of items; trackBy: trackById">
```

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| First Contentful Paint | < 1.5s | < 2.5s |
| Time to Interactive | < 2.5s | < 4.0s |
| List render (100 items) | < 50ms | < 100ms |
| Bundle size | < 1MB | < 1.5MB |

## Helpful Links

- [Angular Performance](https://angular.io/guide/performance-best-practices)
- [CDK Virtual Scrolling](https://material.angular.io/cdk/scrolling/overview)
- [OnPush Change Detection](https://angular.io/api/core/ChangeDetectionStrategy)
- [Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

## Quick Debugging

### Check Change Detection
```typescript
import { ChangeDetectorRef } from '@angular/core';

constructor(private cdr: ChangeDetectorRef) {
  // Force check if needed
  this.cdr.detectChanges();
  
  // Mark for check
  this.cdr.markForCheck();
}
```

### Log Virtual Scroll Events
```html
<cdk-virtual-scroll-viewport
  (scrolledIndexChange)="onScrollIndexChange($event)">
</cdk-virtual-scroll-viewport>
```

### Profile Component
1. Open Angular DevTools
2. Click Profiler tab
3. Start recording
4. Interact with component
5. Stop recording
6. Analyze change detection cycles

---

**For detailed documentation, see:**
- `PERFORMANCE_OPTIMIZATIONS.md` - Complete guide
- `PERFORMANCE_OPTIMIZATION_SUMMARY.md` - Implementation details
- `PERFORMANCE_OPTIMIZATION_CHECKLIST.md` - Task tracking
