# Dashboard Customization System

## Overview

The Dashboard Customization System provides a complete solution for creating personalized, drag-and-drop dashboards with reusable widgets, role-based templates, and responsive mobile support.

## Architecture

### Backend Components

1. **UserPreferencesEntity** (`backend/src/main/java/com/example/backend/entity/UserPreferencesEntity.java`)
   - Stores dashboard layouts, widget settings, and general preferences per user and organization
   - Uses JSONB columns for flexible data storage (PostgreSQL)
   - Tracks role templates and theme preferences

2. **UserPreferencesRepository** (`backend/src/main/java/com/example/backend/repository/UserPreferencesRepository.java`)
   - Handles database operations for user preferences
   - Supports multi-tenant queries with org_id filtering

3. **UserPreferencesService** (`backend/src/main/java/com/example/backend/service/UserPreferencesService.java`)
   - Business logic for managing preferences
   - Provides role-based templates (agent, manager, admin)
   - Handles export/import functionality

4. **UserPreferencesController** (`backend/src/main/java/com/example/backend/controller/UserPreferencesController.java`)
   - REST API endpoints for dashboard customization
   - Endpoints: GET, PUT, DELETE preferences, apply templates, export/import

### Frontend Components

1. **DashboardCustomizationService** (`services/dashboard-customization.service.ts`)
   - Main service for dashboard state management
   - Handles API communication with backend
   - Manages drag-and-drop state and edit mode

2. **CardWidgetBaseComponent** (`components/card-widget-base.component.ts`)
   - Abstract base class for all widgets
   - Provides common functionality: loading, error handling, auto-refresh
   - Lifecycle hooks for data loading and cleanup

3. **Widget Implementations**
   - `KpiWidgetComponent`: Displays KPI metrics with trend indicators
   - `RecentDossiersWidgetComponent`: Shows recent dossiers list
   - `MyTasksWidgetComponent`: Displays user's tasks with priorities

4. **CustomizableDashboardComponent** (`components/customizable-dashboard.component.ts`)
   - Main dashboard container with drag-and-drop grid
   - Edit mode with widget management (add, remove, configure)
   - Template selector and import/export dialogs

5. **WidgetRegistryService** (`services/widget-registry.service.ts`)
   - Central registry for all available widgets
   - Widget metadata (name, icon, dimensions, category)
   - Extensibility for adding custom widgets

6. **DashboardMobileViewComponent** (`components/dashboard-mobile-view.component.ts`)
   - Responsive mobile layout adapter
   - Single-column stack on mobile, grid on tablets

## Features

### 1. Drag-and-Drop Widget Management

Users can customize their dashboard by:
- Dragging widgets to reorder them
- Adding new widgets from the library
- Removing unwanted widgets
- Resizing widgets (via grid layout)

```typescript
// Enable edit mode
customizationService.setEditMode(true);

// Add a widget
customizationService.addWidget({
  id: '',
  type: 'kpi-conversion',
  x: 0,
  y: 0,
  cols: 4,
  rows: 3
});
```

### 2. Role-Based Templates

Pre-configured layouts optimized for different roles:

**Agent Template:**
- My tasks (priority view)
- Recent dossiers
- Today's appointments
- Conversion KPI
- Response time KPI

**Manager Template:**
- Team performance KPIs
- Conversion rate
- Revenue metrics
- Team activity chart
- Pipeline visualization
- Top agents leaderboard

**Admin Template:**
- System health monitoring
- User activity stats
- KPI overview
- Recent users
- Audit log

```typescript
// Apply a role template
customizationService.applyRoleTemplate('user-123', 'agent').subscribe();
```

### 3. Widget Library

Reusable widgets organized by category:

**KPI Widgets:**
- Conversion rate
- Response time
- Revenue
- Team performance

**List Widgets:**
- Recent dossiers
- My tasks
- Appointments
- Notifications

**Chart Widgets:**
- Pipeline funnel
- Activity timeline
- Performance trends

### 4. Export/Import Configuration

Users can backup and share dashboard configurations:

```typescript
// Export configuration
customizationService.exportConfiguration('user-123').subscribe(config => {
  // Download as JSON file
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  // ... download logic
});

// Import configuration
customizationService.importConfiguration('user-123', config).subscribe();
```

### 5. Responsive Mobile Adaptation

The dashboard automatically adapts to mobile devices:
- Single-column layout on phones
- 2-column grid on tablets
- Full grid on desktop
- Touch-friendly controls
- Optimized widget sizes

### 6. Widget Base Class

All widgets extend `CardWidgetBaseComponent`:

```typescript
@Component({
  selector: 'app-custom-widget',
  template: `...`
})
export class CustomWidgetComponent extends CardWidgetBaseComponent {
  override loadData(): void {
    this.setLoading(true);
    // Fetch data from API
    this.apiService.getData().subscribe({
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

## API Endpoints

### Get User Preferences
```http
GET /api/v1/user-preferences/{userId}
```

### Update Dashboard Layout
```http
PUT /api/v1/user-preferences/{userId}/dashboard-layout
Content-Type: application/json

{
  "widgets": [
    {
      "type": "kpi-conversion",
      "x": 0,
      "y": 0,
      "cols": 4,
      "rows": 3
    }
  ]
}
```

### Apply Role Template
```http
POST /api/v1/user-preferences/{userId}/apply-template?template=agent
```

### Export Configuration
```http
POST /api/v1/user-preferences/{userId}/export
```

### Import Configuration
```http
POST /api/v1/user-preferences/{userId}/import
Content-Type: application/json

{
  "dashboardLayout": { ... },
  "widgetSettings": { ... },
  "roleTemplate": "agent"
}
```

## Database Schema

```sql
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    org_id VARCHAR(255) NOT NULL,
    dashboard_layout JSONB,
    widget_settings JSONB,
    general_preferences JSONB,
    theme VARCHAR(50),
    language VARCHAR(10),
    role_template VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uk_user_preferences_user_org UNIQUE (user_id, org_id)
);
```

## Usage Examples

### Creating a Custom Widget

1. Create widget component extending `CardWidgetBaseComponent`
2. Implement `loadData()` method
3. Register in `WidgetRegistryService`
4. Add to dashboard component's switch statement

```typescript
// 1. Create component
@Component({
  selector: 'app-sales-widget',
  template: `<div>Sales: {{ sales }}</div>`
})
export class SalesWidgetComponent extends CardWidgetBaseComponent {
  sales = 0;

  override loadData(): void {
    this.salesService.getSales().subscribe(data => {
      this.sales = data.total;
    });
  }
}

// 2. Register in WidgetRegistryService
widgetRegistry.register({
  id: 'sales-overview',
  name: 'Sales Overview',
  description: 'Monthly sales summary',
  icon: 'trending_up',
  component: SalesWidgetComponent,
  defaultCols: 4,
  defaultRows: 3,
  minCols: 3,
  minRows: 2,
  category: 'kpi'
});
```

### Customizing Templates

Modify `UserPreferencesService.getTemplateLayout()` to add or modify templates:

```java
case "executive":
    layout.put("widgets", new Object[]{
        createWidget("kpi-revenue", 0, 0, 4, 3),
        createWidget("kpi-profit", 4, 0, 4, 3),
        createWidget("kpi-growth", 8, 0, 4, 3),
        createWidget("executive-summary", 0, 3, 12, 4)
    });
    break;
```

## Responsive Breakpoints

- **Mobile**: < 768px (single column)
- **Tablet**: 768px - 1024px (2-column grid)
- **Desktop**: > 1024px (12-column grid)

## Performance Considerations

1. **Lazy Loading**: Widgets load data only when visible
2. **Auto-Refresh**: Configurable refresh intervals per widget
3. **Debounced Saves**: Layout changes are debounced to reduce API calls
4. **Virtual Scrolling**: For large widget lists (future enhancement)

## Accessibility

- Keyboard navigation support
- ARIA labels for drag-and-drop
- Screen reader announcements for widget changes
- High contrast mode support

## Future Enhancements

- [ ] Widget resize handles
- [ ] Grid snap-to-grid
- [ ] Widget templates/presets
- [ ] Shared dashboards (team dashboards)
- [ ] Dashboard versions/history
- [ ] Widget data refresh scheduling
- [ ] Advanced filtering per widget
- [ ] Widget-to-widget communication
- [ ] Dashboard analytics (usage tracking)
- [ ] A/B testing for layouts

## Testing

Run tests with:
```bash
# Backend
cd backend
mvn test

# Frontend
cd frontend
npm test
```

## Migration from Old Dashboard

To migrate existing dashboards:

1. Export current configuration via API
2. Transform to new format
3. Import using new API
4. Verify widget mappings

## Troubleshooting

**Widgets not loading:**
- Check API connectivity
- Verify user permissions
- Check browser console for errors

**Layout not saving:**
- Ensure backend API is accessible
- Check multi-tenant org_id is set
- Verify database migrations ran

**Drag-and-drop not working:**
- Ensure Angular CDK is installed
- Check edit mode is enabled
- Verify browser compatibility

## Support

For issues or questions, contact the development team or open an issue in the repository.
