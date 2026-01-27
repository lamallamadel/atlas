# Skeleton Loader - Implementation Checklist

Use this checklist when implementing skeleton loaders in your components.

## ✅ Pre-Implementation

### 1. Analyze Content Layout
- [ ] Identify the main content structure (table, cards, list, etc.)
- [ ] Count typical number of items shown
- [ ] Determine if content uses columns
- [ ] Check mobile vs desktop layouts

### 2. Choose Appropriate Variant
- [ ] Select variant that matches actual layout
- [ ] Verify variant exists (9 available variants)
- [ ] Check variant examples in VISUAL_GUIDE.md

### 3. Plan Loading State
- [ ] Identify async data sources
- [ ] Add loading boolean flag to component
- [ ] Plan error state handling
- [ ] Consider empty state (no data)

## ✅ Component Setup

### 4. Add Loading State to TypeScript
```typescript
export class YourComponent implements OnInit {
  loading = false;  // ✓ Add this
  error: string | null = null;
  data: YourData[] = [];
  
  loadData(): void {
    this.loading = true;  // ✓ Set to true
    this.error = null;
    
    this.service.getData().subscribe({
      next: (response) => {
        this.data = response;
        this.loading = false;  // ✓ Set to false
      },
      error: (err) => {
        this.error = 'Error message';
        this.loading = false;  // ✓ Set to false on error
      }
    });
  }
}
```

- [ ] Add `loading` property (default: `false`)
- [ ] Add `error` property for error handling
- [ ] Set `loading = true` before async call
- [ ] Set `loading = false` after completion
- [ ] Set `loading = false` on error

### 5. Add Skeleton to Template
```html
<!-- Loading State -->
<app-skeleton-loader 
  *ngIf="loading" 
  variant="table" 
  [rows]="10" 
  [columns]="8"
  aria-label="Chargement des données">
</app-skeleton-loader>

<!-- Error State -->
<div *ngIf="error && !loading" class="error-state">
  {{ error }}
</div>

<!-- Success State -->
<div *ngIf="!loading && !error">
  <!-- Your actual content -->
</div>
```

- [ ] Add skeleton with `*ngIf="loading"`
- [ ] Choose correct variant
- [ ] Set appropriate `rows` count
- [ ] Set `columns` if using table variant
- [ ] Add descriptive `aria-label`
- [ ] Ensure content only shows when `!loading`

## ✅ Configuration

### 6. Configure Rows and Columns
- [ ] Count visible items in typical viewport
- [ ] Set `rows` to match (add 1-2 for safety)
- [ ] For tables: Set `columns` to match headers
- [ ] Test with different screen sizes

**Recommended Row Counts:**
| Variant | Desktop | Mobile |
|---------|---------|--------|
| card | 6 | 3 |
| list | 10 | 5-8 |
| table | 10-15 | 5-8 |
| form | 5-8 | 5-8 |
| grid | 9 | 3 |
| message | 10 | 8 |
| timeline | 5-8 | 5 |

### 7. Add Accessibility
- [ ] Include `aria-label` describing what's loading
- [ ] Use French language for labels
- [ ] Test with screen reader
- [ ] Verify role="status" is present (automatic)
- [ ] Check aria-live="polite" (automatic)

**Good aria-labels:**
- ✅ `"Chargement des annonces"`
- ✅ `"Chargement des dossiers"`
- ✅ `"Chargement des données"`
- ❌ `"Loading"` (English)
- ❌ `"Please wait"` (Too generic)

## ✅ Testing

### 8. Visual Testing
- [ ] Verify skeleton appears immediately
- [ ] Check shimmer animation works
- [ ] Test in light theme
- [ ] Test in dark theme
- [ ] Verify smooth transition to content
- [ ] Check responsive behavior (mobile/desktop)

### 9. Functional Testing
- [ ] Skeleton shows on initial load
- [ ] Skeleton shows on refresh
- [ ] Skeleton hides when data loads
- [ ] Error state works correctly
- [ ] Empty state works correctly
- [ ] No flash of unstyled content (FOUC)

### 10. Performance Testing
- [ ] Check for smooth 60fps animation
- [ ] Verify no layout shifts
- [ ] Test with slow network (throttle to 3G)
- [ ] Check memory usage in DevTools
- [ ] Verify no console warnings

### 11. Accessibility Testing
- [ ] Test with VoiceOver (Mac) or NVDA (Windows)
- [ ] Verify loading announcement
- [ ] Check keyboard navigation works
- [ ] Test with prefers-reduced-motion enabled
- [ ] Verify color contrast (automatic)

## ✅ Code Quality

### 12. TypeScript
- [ ] No TypeScript errors
- [ ] Proper typing for loading flag
- [ ] Clean async handling
- [ ] Error handling implemented

### 13. Template
- [ ] Proper `*ngIf` conditions
- [ ] No duplicate elements
- [ ] Consistent indentation
- [ ] Clear structure

### 14. Documentation
- [ ] Add comment explaining skeleton variant choice
- [ ] Document expected row count
- [ ] Note any special considerations

```html
<!-- Skeleton: Table variant with 10 rows to match typical page size -->
<app-skeleton-loader 
  *ngIf="loading" 
  variant="table" 
  [rows]="10" 
  [columns]="8">
</app-skeleton-loader>
```

## ✅ Edge Cases

### 15. Handle Special Scenarios
- [ ] Multiple simultaneous API calls
- [ ] Partial data loading
- [ ] Re-fetching/refreshing data
- [ ] Infinite scroll pagination
- [ ] Search/filter operations

### 16. Error Recovery
- [ ] Retry mechanism works
- [ ] Error message is clear
- [ ] Skeleton re-appears on retry
- [ ] No stuck loading states

## ✅ Integration

### 17. Page Integration
- [ ] Skeleton matches page layout exactly
- [ ] Transitions are smooth
- [ ] No jarring content shifts
- [ ] Consistent with other pages

### 18. Mobile Considerations
- [ ] Skeleton works on small screens
- [ ] Touch targets are appropriate
- [ ] Variant choice is mobile-optimized
- [ ] Row count is mobile-appropriate

## ✅ Best Practices Verification

### 19. Follow Guidelines
- [ ] Used semantic variant name
- [ ] Appropriate row/column counts
- [ ] No nested skeletons
- [ ] No mixing variants in same view
- [ ] Animation enabled (default)
- [ ] Proper cleanup (automatic)

### 20. Performance Optimization
- [ ] Component uses OnPush (automatic)
- [ ] No unnecessary re-renders
- [ ] Efficient data loading
- [ ] Proper error handling

## ✅ Final Review

### 21. Code Review Checklist
- [ ] Code follows project conventions
- [ ] Proper indentation and formatting
- [ ] French language for user-facing text
- [ ] No console.log() statements
- [ ] No commented-out code

### 22. Documentation Review
- [ ] Updated component README if needed
- [ ] Added inline comments for complex logic
- [ ] Documented any deviations from standard

### 23. Deployment Checklist
- [ ] Tested in development environment
- [ ] Tested in staging environment
- [ ] No breaking changes
- [ ] Backward compatible
- [ ] Ready for production

## 📋 Quick Reference

### Common Variants by Use Case

| Use Case | Component | Variant | Rows |
|----------|-----------|---------|------|
| Annonces list | `annonces.component` | `table` | 10 |
| Dossiers list | `dossiers.component` | `table` | 10 |
| Dashboard KPIs | `dashboard.component` | `dashboard-kpi` | 1 |
| Recent dossiers | `dashboard.component` | `list` | 5 |
| Dossier detail | `dossier-detail.component` | `detail` | 12 |
| Create form | `annonce-create.component` | `form` | 6 |
| Photo gallery | `annonce-detail.component` | `grid` | 6 |
| Messages | `messaging-tab.component` | `message` | 10 |
| Activity log | `activity-timeline.component` | `timeline` | 8 |

### Template Patterns

**Simple loading:**
```html
<app-skeleton-loader *ngIf="loading" variant="table"></app-skeleton-loader>
<div *ngIf="!loading">{{ data }}</div>
```

**With error state:**
```html
<app-skeleton-loader *ngIf="loading" variant="list"></app-skeleton-loader>
<div *ngIf="error && !loading">{{ error }}</div>
<div *ngIf="!loading && !error">{{ data }}</div>
```

**With empty state:**
```html
<app-skeleton-loader *ngIf="loading" variant="card"></app-skeleton-loader>
<app-empty-state *ngIf="!loading && data.length === 0"></app-empty-state>
<div *ngIf="!loading && data.length > 0">{{ data }}</div>
```

**Multiple sections:**
```html
<div class="kpi-section">
  <app-skeleton-loader *ngIf="kpiLoading" variant="dashboard-kpi">
  </app-skeleton-loader>
  <div *ngIf="!kpiLoading">{{ kpiData }}</div>
</div>

<div class="list-section">
  <app-skeleton-loader *ngIf="listLoading" variant="list" [rows]="8">
  </app-skeleton-loader>
  <div *ngIf="!listLoading">{{ listData }}</div>
</div>
```

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This
```html
<!-- Missing *ngIf - skeleton always shows -->
<app-skeleton-loader variant="table"></app-skeleton-loader>
<div>{{ data }}</div>

<!-- Wrong variant for layout -->
<app-skeleton-loader variant="form"></app-skeleton-loader>
<table><!-- This is a table! --></table>

<!-- Too many rows -->
<app-skeleton-loader variant="list" [rows]="100"></app-skeleton-loader>

<!-- Missing aria-label -->
<app-skeleton-loader variant="table"></app-skeleton-loader>

<!-- Nested skeletons -->
<app-skeleton-loader variant="card">
  <app-skeleton-loader variant="list"></app-skeleton-loader>
</app-skeleton-loader>
```

### ✅ Do This Instead
```html
<!-- Proper conditional rendering -->
<app-skeleton-loader 
  *ngIf="loading" 
  variant="table"
  [rows]="10"
  aria-label="Chargement des données">
</app-skeleton-loader>
<table *ngIf="!loading"><!-- Table content --></table>
```

## 📝 Implementation Template

Copy and customize this template:

```typescript
// your-component.ts
export class YourComponent implements OnInit {
  loading = false;
  error: string | null = null;
  data: YourData[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.yourService.getData().subscribe({
      next: (response) => {
        this.data = response;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des données';
        this.loading = false;
        console.error('Load error:', err);
      }
    });
  }
}
```

```html
<!-- your-component.html -->
<app-skeleton-loader 
  *ngIf="loading" 
  variant="[CHOOSE_VARIANT]" 
  [rows]="[SET_ROWS]"
  aria-label="Chargement de [DESCRIPTION]">
</app-skeleton-loader>

<div *ngIf="error && !loading" class="error-state">
  <p>{{ error }}</p>
  <button (click)="loadData()">Réessayer</button>
</div>

<div *ngIf="!loading && !error && data.length > 0">
  <!-- Your content here -->
</div>

<app-empty-state 
  *ngIf="!loading && !error && data.length === 0">
</app-empty-state>
```

---

## ✨ Ready to Implement!

Once all checkboxes are complete, your skeleton loader implementation is production-ready!

**Need help?**
- [SKELETON_LOADER_README.md](./SKELETON_LOADER_README.md) - Full documentation
- [SKELETON_LOADER_QUICK_REFERENCE.md](./SKELETON_LOADER_QUICK_REFERENCE.md) - Quick reference
- [SKELETON_LOADER_VISUAL_GUIDE.md](./SKELETON_LOADER_VISUAL_GUIDE.md) - Visual examples
