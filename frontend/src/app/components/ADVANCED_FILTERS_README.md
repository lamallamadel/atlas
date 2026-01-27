# Advanced Filters System

## Overview

The Advanced Filters System provides a powerful, visual query builder for filtering dossiers with support for complex conditions, saved presets, real-time result counts, and URL-based filter sharing.

## Features

### 1. Visual Query Builder

- **Multiple Conditions**: Add multiple filter conditions with intuitive UI
- **Logical Operators**: Combine conditions using AND/OR logic
- **Field-Specific Operators**: Different operators based on field type (text, number, date, select)
- **Dynamic Value Inputs**: Input types adapt based on selected field and operator

### 2. Supported Operators

#### Text Fields
- Égal à (EQUALS)
- Différent de (NOT_EQUALS)
- Contient (CONTAINS)
- Ne contient pas (NOT_CONTAINS)
- Commence par (STARTS_WITH)
- Finit par (ENDS_WITH)
- Est vide (IS_NULL)
- N'est pas vide (IS_NOT_NULL)

#### Number Fields
- Égal à (EQUALS)
- Supérieur à (GREATER_THAN)
- Supérieur ou égal à (GREATER_THAN_OR_EQUAL)
- Inférieur à (LESS_THAN)
- Inférieur ou égal à (LESS_THAN_OR_EQUAL)
- Entre (BETWEEN)

#### Date Fields
- Égal à (EQUALS)
- Après (GREATER_THAN)
- Avant (LESS_THAN)
- Entre (BETWEEN)
- Aujourd'hui (EQUALS_TODAY)
- Cette semaine (THIS_WEEK)
- Moins de X jours (LESS_THAN_DAYS_AGO)

#### Select Fields
- Égal à (EQUALS)
- Différent de (NOT_EQUALS)
- Parmi (IN)
- Pas parmi (NOT_IN)

### 3. Filter Presets

#### Predefined Quick Filters

System-provided filters for common use cases:

- **Mes dossiers**: Dossiers assignés à l'utilisateur courant
- **Urgent**: Dossiers urgents (NEW/QUALIFIED, créés il y a moins de 2 jours)
- **À traiter aujourd'hui**: Dossiers avec action prévue aujourd'hui
- **Nouveaux prospects**: Prospects créés dans les dernières 24h
- **Rendez-vous cette semaine**: Dossiers avec RDV planifiés cette semaine

#### User-Created Presets

- **Save Filters**: Save current filter configuration with custom name
- **Share with Team**: Option to share presets with organization members
- **Private Presets**: User-specific saved filters
- **Description**: Add optional descriptions to presets for clarity

### 4. Real-Time Result Count

- **Live Count**: Displays result count as you build filters (debounced 500ms)
- **Visual Feedback**: Loading spinner during count calculation
- **Performance**: Optimized count queries without fetching full results

### 5. URL Filter Sharing

- **Export to URL**: Generate shareable URLs with filter configuration
- **Copy to Clipboard**: One-click copy of filter URL
- **Load from URL**: Automatically apply filters from URL query parameter
- **Encoded Filters**: Base64-encoded JSON for compact URLs

### 6. Backend Integration

#### API Endpoints

**Advanced Filter Endpoint**:
```
POST /api/v1/dossiers/advanced-filter
Body: {
  "conditions": [
    {
      "field": "status",
      "operator": "IN",
      "value": ["NEW", "QUALIFIED"]
    }
  ],
  "logicOperator": "AND",
  "page": 0,
  "size": 20
}
```

**Count Endpoint**:
```
POST /api/v1/dossiers/advanced-filter/count
Body: {
  "conditions": [...],
  "logicOperator": "AND"
}
Response: number (count of matching records)
```

**Filter Preset Endpoints**:
```
GET    /api/v1/filter-presets?filterType=DOSSIER
GET    /api/v1/filter-presets/predefined?filterType=DOSSIER
GET    /api/v1/filter-presets/user?filterType=DOSSIER
POST   /api/v1/filter-presets
PUT    /api/v1/filter-presets/{id}
DELETE /api/v1/filter-presets/{id}
```

#### Database Schema

**filter_preset table**:
```sql
- id: BIGSERIAL PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- filter_type: VARCHAR(50) NOT NULL
- description: TEXT
- filter_config: JSONB NOT NULL
- is_shared: BOOLEAN DEFAULT false
- is_predefined: BOOLEAN DEFAULT false
- created_by: VARCHAR(255)
- org_id: VARCHAR(255) NOT NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Usage Examples

### Opening Advanced Filters

```typescript
// From dossiers component
openAdvancedFilters(): void {
  const dialogRef = this.dialog.open(AdvancedFiltersDialogComponent, {
    width: '900px',
    data: {
      filterType: 'DOSSIER',
      fields: this.advancedFilterFields,
      initialFilter: this.currentFilter
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result?.filter) {
      this.applyAdvancedFilter(result.filter);
    }
  });
}
```

### Defining Filter Fields

```typescript
advancedFilterFields: FilterField[] = [
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    operators: [
      { value: 'EQUALS', label: 'Égal à', requiresValue: true },
      { value: 'IN', label: 'Parmi', requiresValue: true }
    ],
    options: [
      { value: 'NEW', label: 'Nouveau' },
      { value: 'QUALIFIED', label: 'Qualifié' }
    ]
  },
  {
    key: 'leadName',
    label: 'Nom du prospect',
    type: 'text',
    operators: [
      { value: 'CONTAINS', label: 'Contient', requiresValue: true },
      { value: 'STARTS_WITH', label: 'Commence par', requiresValue: true }
    ]
  }
];
```

### Applying Filters

```typescript
applyAdvancedFilter(filter: AdvancedFilter): void {
  this.useAdvancedFilter = true;
  this.advancedFilterRequest = {
    conditions: filter.conditions,
    logicOperator: filter.logicOperator
  };
  this.loadDossiers();
}
```

### Sharing Filters via URL

```typescript
// Generate shareable URL
exportToUrl(): string {
  const filter = this.getFilterValue();
  const encoded = btoa(JSON.stringify(filter));
  return `${window.location.origin}${window.location.pathname}?filter=${encoded}`;
}

// Load filter from URL
loadFilterFromUrl(encodedFilter: string): void {
  try {
    const decoded = atob(encodedFilter);
    const filter = JSON.parse(decoded);
    this.applyAdvancedFilter(filter);
  } catch (e) {
    console.error('Error loading filter from URL:', e);
  }
}
```

## Backend Implementation

### Filter Specification Builder

The `DossierAdvancedFilterService` uses JPA Criteria API to build dynamic queries:

```java
private Specification<Dossier> buildSpecification(DossierFilterRequest request) {
    return (root, query, criteriaBuilder) -> {
        List<Predicate> predicates = new ArrayList<>();
        
        for (FilterCondition condition : request.getConditions()) {
            Predicate predicate = buildPredicate(root, criteriaBuilder, condition);
            if (predicate != null) {
                predicates.add(predicate);
            }
        }
        
        if ("OR".equals(request.getLogicOperator())) {
            return criteriaBuilder.or(predicates.toArray(new Predicate[0]));
        } else {
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        }
    };
}
```

### Special Operators

- **EQUALS_CURRENT_USER**: Filters by current authenticated user
- **EQUALS_TODAY**: Filters records from today
- **THIS_WEEK**: Filters records from current week
- **LESS_THAN_DAYS_AGO**: Filters records from last X days

## Security Considerations

1. **Organization Isolation**: All filters respect org_id boundaries
2. **User Permissions**: Preset sharing requires proper authorization
3. **Predefined Protection**: System presets cannot be modified/deleted
4. **SQL Injection Prevention**: Uses JPA Criteria API, not raw SQL
5. **Input Validation**: All filter inputs validated on backend

## Performance Optimizations

1. **Debounced Counting**: Count requests debounced to reduce server load
2. **Index Support**: Database indexes on commonly filtered fields
3. **Optimized Count Queries**: Count queries don't fetch full result sets
4. **Lazy Loading**: Filter presets loaded on-demand
5. **URL Encoding**: Compact base64 encoding for shareable URLs

## Accessibility

- **ARIA Labels**: All interactive elements properly labeled
- **Keyboard Navigation**: Full keyboard support for filter builder
- **Screen Readers**: Semantic HTML and ARIA annotations
- **Focus Management**: Proper focus handling in dialogs
- **Error Messages**: Clear validation messages

## Mobile Responsiveness

- **Responsive Layout**: Adapts to mobile screen sizes
- **Touch-Friendly**: Large touch targets for mobile users
- **Simplified UI**: Reduced complexity on small screens
- **Bottom Sheet**: Mobile-optimized filter interface

## Future Enhancements

1. **Filter Templates**: Industry-specific filter templates
2. **Advanced Analytics**: Filter usage analytics and recommendations
3. **Batch Operations**: Apply actions to filtered results
4. **Export Filters**: Export filter configurations as JSON/YAML
5. **Filter History**: Track and reuse recent filter configurations
6. **Nested Conditions**: Support for nested AND/OR groups
7. **Custom Operators**: Allow plugins to define custom operators
8. **Filter Suggestions**: AI-powered filter suggestions based on context
