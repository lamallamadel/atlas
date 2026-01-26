# Dashboard Customization - Quick Start Guide

## Overview

This guide will help you quickly get started with the customizable dashboard system featuring drag-and-drop widgets, role-based templates, and responsive mobile support.

## What's Been Implemented

### Backend
✅ **Database Schema**: `user_preferences` table with JSONB columns
✅ **Entity**: `UserPreferencesEntity` with multi-tenant support
✅ **Repository**: `UserPreferencesRepository` with org_id filtering
✅ **Service**: `UserPreferencesService` with role templates (agent, manager, admin)
✅ **Controller**: `UserPreferencesController` with full REST API
✅ **Migration**: `V34__Add_user_preferences.sql`

### Frontend
✅ **Service**: `DashboardCustomizationService` for state management
✅ **Base Component**: `CardWidgetBaseComponent` for widget development
✅ **Widgets**: KPI, Recent Dossiers, My Tasks
✅ **Main Component**: `CustomizableDashboardComponent` with drag-and-drop
✅ **Registry**: `WidgetRegistryService` for extensibility
✅ **Mobile**: Responsive adaptation for all screen sizes
✅ **Tests**: Unit tests for all major components

## Quick Setup

### 1. Database Migration

The migration will run automatically on application startup. To verify:

```bash
# Check if migration V34 has been applied
cd backend
# PostgreSQL
psql -d your_database -c "SELECT version FROM flyway_schema_history WHERE version = '34';"
```

### 2. Backend Setup

The backend is ready to use. No additional configuration needed.

**Test the API:**
```bash
# Get user preferences
curl -X GET http://localhost:8080/api/v1/user-preferences/user-123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Apply agent template
curl -X POST "http://localhost:8080/api/v1/user-preferences/user-123/apply-template?template=agent" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Frontend Integration

**Option A: Use as Standalone Component**

```typescript
// In your routing module
import { CustomizableDashboardComponent } from './components/customizable-dashboard.component';

const routes: Routes = [
  { path: 'dashboard', component: CustomizableDashboardComponent }
];
```

**Option B: Embed in Existing Page**

```html
<!-- In your template -->
<app-customizable-dashboard></app-customizable-dashboard>
```

## Using the Dashboard

### For End Users

1. **Navigate to Dashboard**: Go to the dashboard route
2. **Customize**: Click "Personnaliser" button to enter edit mode
3. **Add Widgets**: Click "Ajouter widget" and select from library
4. **Drag & Drop**: Reorder widgets by dragging
5. **Remove Widgets**: Click X icon on any widget in edit mode
6. **Apply Template**: Click "Templates" to apply role-based layouts
7. **Export/Import**: Backup or share configurations
8. **Save**: Click "Terminer" to save your layout

### Role-Based Templates

**Agent Template:**
- My tasks (6x4)
- Recent dossiers (6x4)
- Today's appointments (6x3)
- KPI Conversion (3x3)
- KPI Response time (3x3)

**Manager Template:**
- Team performance KPI (4x3)
- Conversion rate KPI (4x3)
- Revenue KPI (4x3)
- Team activity (6x4)
- Pipeline chart (6x4)
- Top agents (4x3)
- Recent deals (8x3)

**Admin Template:**
- System health (6x3)
- User activity (6x3)
- KPI overview (12x3)
- Recent users (6x4)
- Audit log (6x4)

## Creating Custom Widgets

### Step 1: Create Widget Component

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardWidgetBaseComponent } from './card-widget-base.component';
import { YourApiService } from '../services/your-api.service';

@Component({
  selector: 'app-custom-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget" [class.edit-mode]="editMode">
      <div class="widget-header">
        <h3>{{ config.title || 'Custom Widget' }}</h3>
        <div class="widget-actions" *ngIf="editMode">
          <button (click)="onRefresh()">🔄</button>
          <button (click)="onRemove()">❌</button>
        </div>
      </div>
      
      <div class="widget-content" *ngIf="!loading && !error">
        <!-- Your widget content here -->
        <div>{{ data }}</div>
      </div>

      <div *ngIf="loading">Loading...</div>
      <div *ngIf="error">{{ error }}</div>
    </div>
  `,
  styles: [`
    .widget {
      background: white;
      border-radius: 8px;
      padding: 20px;
      height: 100%;
    }
  `]
})
export class CustomWidgetComponent extends CardWidgetBaseComponent {
  data: any;

  constructor(private apiService: YourApiService) {
    super();
  }

  override loadData(): void {
    this.setLoading(true);
    this.setError(null);

    this.apiService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.data = data;
          this.setLoading(false);
        },
        error: () => {
          this.setError('Failed to load data');
          this.setLoading(false);
        }
      });
  }
}
```

### Step 2: Register Widget

```typescript
// In widget-registry.service.ts
this.register({
  id: 'custom-widget',
  name: 'Custom Widget',
  description: 'Your widget description',
  icon: 'widgets',
  component: CustomWidgetComponent,
  defaultCols: 4,
  defaultRows: 3,
  minCols: 3,
  minRows: 2,
  category: 'custom'
});
```

### Step 3: Add to Dashboard Component

```typescript
// In customizable-dashboard.component.ts
// Add to the switch statement in template:

<app-custom-widget 
  *ngSwitchCase="'custom-widget'"
  [config]="getWidgetConfig(widget, 'Custom Widget')"
  [editMode]="editMode"
  (remove)="removeWidget($event)">
</app-custom-widget>
```

## API Usage Examples

### Get Preferences
```typescript
this.customizationService.getUserPreferences('user-123').subscribe(prefs => {
  console.log('Dashboard layout:', prefs.dashboardLayout);
});
```

### Update Layout
```typescript
const layout = {
  widgets: [
    { id: '1', type: 'kpi-conversion', x: 0, y: 0, cols: 4, rows: 3 }
  ]
};

this.customizationService.updateDashboardLayout('user-123', layout).subscribe();
```

### Apply Template
```typescript
this.customizationService.applyRoleTemplate('user-123', 'agent').subscribe();
```

### Export Configuration
```typescript
this.customizationService.exportConfiguration('user-123').subscribe(config => {
  // Download as JSON file
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dashboard-config.json';
  a.click();
});
```

### Import Configuration
```typescript
const config = {
  dashboardLayout: { widgets: [...] },
  widgetSettings: {...},
  roleTemplate: 'agent'
};

this.customizationService.importConfiguration('user-123', config).subscribe();
```

## Mobile Responsiveness

The dashboard automatically adapts to different screen sizes:

- **Desktop (>1024px)**: 12-column grid with full drag-and-drop
- **Tablet (768-1024px)**: 6-column grid
- **Mobile (<768px)**: Single column stack, simplified controls

No additional code needed - responsive behavior is built-in.

## Troubleshooting

### Widgets not loading
- ✅ Check API is running: `curl http://localhost:8080/actuator/health`
- ✅ Verify authentication token is valid
- ✅ Check browser console for errors

### Layout not saving
- ✅ Ensure you're clicking "Terminer" to exit edit mode
- ✅ Verify network requests in browser dev tools
- ✅ Check user has proper permissions (ROLE_PRO or ROLE_ADMIN)

### Drag-and-drop not working
- ✅ Ensure Angular CDK is installed: `npm list @angular/cdk`
- ✅ Check edit mode is enabled (should see dashed borders)
- ✅ Try on a different browser

### Migration not running
- ✅ Check Flyway is enabled in application properties
- ✅ Verify database connection
- ✅ Look for migration errors in logs: `grep "V34" backend/logs/*`

## Testing

### Run Backend Tests
```bash
cd backend
mvn test -Dtest=UserPreferencesServiceTest
mvn test -Dtest=UserPreferencesControllerTest
```

### Run Frontend Tests
```bash
cd frontend
npm test -- --include='**/dashboard-customization.service.spec.ts'
npm test -- --include='**/customizable-dashboard.component.spec.ts'
```

## Performance Tips

1. **Widget Refresh**: Set appropriate refresh intervals
   ```typescript
   config.refreshInterval = 60; // seconds
   ```

2. **Lazy Loading**: Widgets only load when visible
3. **Debounced Saves**: Layout changes are batched
4. **Optimize Queries**: Use widget settings to filter data
   ```typescript
   config.settings = { limit: 10, status: 'ACTIVE' };
   ```

## Next Steps

1. **Add more widgets**: Follow the custom widget guide
2. **Customize templates**: Modify role templates in service
3. **Add analytics**: Track widget usage and interactions
4. **Team dashboards**: Extend for shared configurations
5. **Advanced features**: Widget resize, grid snapping, etc.

## Resources

- **Full Documentation**: `frontend/src/app/components/DASHBOARD_CUSTOMIZATION_README.md`
- **API Reference**: Swagger UI at `http://localhost:8080/swagger-ui.html`
- **Component Examples**: `frontend/src/app/components/`
- **Service Tests**: `backend/src/test/java/com/example/backend/`

## Support

For issues or questions:
1. Check the full README documentation
2. Review test files for usage examples
3. Check browser console and backend logs
4. Contact development team

---

**Happy customizing! 🎨📊**
