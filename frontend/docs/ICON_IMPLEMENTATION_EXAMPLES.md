# Real Estate Icon Implementation Examples

This document provides practical examples of integrating the custom real estate icons into existing templates, replacing generic Material Icons.

## Example 1: Annonce Detail Page

### Before (Generic Icons)

```html
<div class="detail-row">
  <span class="detail-label">Type :</span>
  <span class="detail-value">{{ annonce.type }}</span>
</div>
<div class="detail-row">
  <span class="detail-label">Ville :</span>
  <span class="detail-value">{{ annonce.city }}</span>
</div>
<div class="detail-row">
  <span class="detail-label">Prix :</span>
  <span class="detail-value">{{ annonce.price | currency }}</span>
</div>
```

### After (Custom Real Estate Icons)

```html
<div class="detail-row">
  <span class="detail-label">
    <app-re-icon icon="re-house" size="small" color="#666"></app-re-icon>
    Type :
  </span>
  <span class="detail-value">
    <app-re-icon [icon]="getTypeIcon(annonce.type)" size="small"></app-re-icon>
    {{ annonce.type }}
  </span>
</div>

<div class="detail-row">
  <span class="detail-label">
    <app-re-icon icon="re-location" size="small" color="#666"></app-re-icon>
    Ville :
  </span>
  <span class="detail-value">{{ annonce.city }}</span>
</div>

<div class="detail-row">
  <span class="detail-label">
    <app-re-icon icon="re-price" size="small" color="#666"></app-re-icon>
    Prix :
  </span>
  <span class="detail-value">{{ annonce.price | currency }}</span>
</div>
```

#### Component TypeScript

```typescript
getTypeIcon(type: string): string {
  const typeMap: { [key: string]: string } = {
    'HOUSE': 're-house',
    'APARTMENT': 're-apartment',
    'VILLA': 're-villa',
    'OFFICE': 're-office',
    'WAREHOUSE': 're-warehouse',
    'LAND': 're-land'
  };
  return typeMap[type] || 're-house';
}
```

## Example 2: Property Card List

### Before

```html
<mat-card class="property-card">
  <mat-card-header>
    <mat-icon>home</mat-icon>
    <mat-card-title>{{ property.title }}</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="property-info">
      <span>{{ property.city }}</span>
      <span>{{ property.price | currency }}</span>
    </div>
  </mat-card-content>
</mat-card>
```

### After

```html
<mat-card class="property-card">
  <mat-card-header>
    <div class="property-type-badge">
      <app-re-icon [icon]="getTypeIcon(property.type)" size="medium"></app-re-icon>
    </div>
    <mat-card-title>{{ property.title }}</mat-card-title>
  </mat-card-header>
  <mat-card-content>
    <div class="property-info">
      <div class="info-item">
        <app-re-icon icon="re-location" size="small" color="#757575"></app-re-icon>
        <span>{{ property.city }}</span>
      </div>
      <div class="info-item">
        <app-re-icon icon="re-price" size="small" color="#757575"></app-re-icon>
        <span>{{ property.price | currency }}</span>
      </div>
      <div class="info-item" *ngIf="property.surface">
        <app-re-icon icon="re-area" size="small" color="#757575"></app-re-icon>
        <span>{{ property.surface }} m²</span>
      </div>
    </div>
  </mat-card-content>
</mat-card>
```

## Example 3: Property Features/Amenities

### Before

```html
<div class="features">
  <mat-chip-list>
    <mat-chip>{{ property.bedrooms }} chambres</mat-chip>
    <mat-chip>{{ property.bathrooms }} salles de bain</mat-chip>
    <mat-chip *ngIf="property.hasPool">Piscine</mat-chip>
    <mat-chip *ngIf="property.hasGarden">Jardin</mat-chip>
  </mat-chip-list>
</div>
```

### After

```html
<div class="features">
  <div class="feature-grid">
    <div class="feature-item">
      <app-re-icon icon="re-bedroom" size="medium" color="#1976d2"></app-re-icon>
      <span>{{ property.bedrooms }} chambres</span>
    </div>
    <div class="feature-item">
      <app-re-icon icon="re-bathroom" size="medium" color="#1976d2"></app-re-icon>
      <span>{{ property.bathrooms }} salles de bain</span>
    </div>
    <div class="feature-item" *ngIf="property.hasPool">
      <app-re-icon icon="re-pool" size="medium" color="#1976d2"></app-re-icon>
      <span>Piscine</span>
    </div>
    <div class="feature-item" *ngIf="property.hasGarden">
      <app-re-icon icon="re-garden" size="medium" color="#1976d2"></app-re-icon>
      <span>Jardin</span>
    </div>
    <div class="feature-item" *ngIf="property.hasParking">
      <app-re-icon icon="re-parking" size="medium" color="#1976d2"></app-re-icon>
      <span>Parking</span>
    </div>
  </div>
</div>
```

#### CSS

```css
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s;
}

.feature-item:hover {
  border-color: #1976d2;
  background: #f5f5f5;
}
```

## Example 4: Action Buttons

### Before

```html
<div class="actions">
  <button mat-button>
    <mat-icon>visibility</mat-icon>
    Planifier visite
  </button>
  <button mat-button>
    <mat-icon>attach_money</mat-icon>
    Faire une offre
  </button>
  <button mat-button>
    <mat-icon>description</mat-icon>
    Télécharger documents
  </button>
</div>
```

### After

```html
<div class="actions">
  <button mat-button class="action-btn">
    <app-re-icon icon="re-visit" size="small"></app-re-icon>
    Planifier visite
  </button>
  <button mat-button class="action-btn">
    <app-re-icon icon="re-offer" size="small"></app-re-icon>
    Faire une offre
  </button>
  <button mat-button class="action-btn">
    <app-re-icon icon="re-contract" size="small"></app-re-icon>
    Télécharger documents
  </button>
</div>
```

## Example 5: Dashboard Stats Cards

### Before

```html
<div class="stats-cards">
  <mat-card>
    <mat-icon>home</mat-icon>
    <h3>{{ totalProperties }}</h3>
    <p>Biens actifs</p>
  </mat-card>
  <mat-card>
    <mat-icon>event</mat-icon>
    <h3>{{ upcomingVisits }}</h3>
    <p>Visites prévues</p>
  </mat-card>
  <mat-card>
    <mat-icon>check_circle</mat-icon>
    <h3>{{ soldProperties }}</h3>
    <p>Biens vendus</p>
  </mat-card>
</div>
```

### After

```html
<div class="stats-cards">
  <mat-card class="stat-card">
    <div class="stat-icon" style="background: #e3f2fd;">
      <app-re-icon icon="re-house" size="large" color="#1976d2"></app-re-icon>
    </div>
    <h3 class="stat-value">{{ totalProperties }}</h3>
    <p class="stat-label">Biens actifs</p>
  </mat-card>
  
  <mat-card class="stat-card">
    <div class="stat-icon" style="background: #fff3e0;">
      <app-re-icon icon="re-calendar-visit" size="large" color="#f57c00"></app-re-icon>
    </div>
    <h3 class="stat-value">{{ upcomingVisits }}</h3>
    <p class="stat-label">Visites prévues</p>
  </mat-card>
  
  <mat-card class="stat-card">
    <div class="stat-icon" style="background: #e8f5e9;">
      <app-re-icon icon="re-sold" size="large" color="#388e3c"></app-re-icon>
    </div>
    <h3 class="stat-value">{{ soldProperties }}</h3>
    <p class="stat-label">Biens vendus</p>
  </mat-card>
</div>
```

#### CSS

```css
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  text-align: center;
  padding: 24px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.stat-label {
  font-size: 14px;
  color: #757575;
  margin: 0;
}
```

## Example 6: Document List

### Before

```html
<mat-list>
  <mat-list-item *ngFor="let doc of documents">
    <mat-icon matListIcon>description</mat-icon>
    <span>{{ doc.name }}</span>
  </mat-list-item>
</mat-list>
```

### After

```html
<mat-list class="document-list">
  <mat-list-item *ngFor="let doc of documents" class="document-item">
    <div class="doc-icon">
      <app-re-icon [icon]="getDocumentIcon(doc.type)" size="medium" color="#1976d2"></app-re-icon>
    </div>
    <div class="doc-info">
      <span class="doc-name">{{ doc.name }}</span>
      <span class="doc-meta">{{ doc.size }} • {{ doc.date | date }}</span>
    </div>
  </mat-list-item>
</mat-list>
```

#### Component TypeScript

```typescript
getDocumentIcon(type: string): string {
  const docTypeMap: { [key: string]: string } = {
    'CONTRACT': 're-contract',
    'DEED': 're-deed',
    'INSPECTION': 're-inspection',
    'BLUEPRINT': 're-blueprint',
    'CERTIFICATE': 're-certificate',
    'PHOTO': 're-photo'
  };
  return docTypeMap[type] || 're-contract';
}
```

## Example 7: Property Type Filter

### Before

```html
<mat-button-toggle-group>
  <mat-button-toggle value="all">Tous</mat-button-toggle>
  <mat-button-toggle value="house">Maison</mat-button-toggle>
  <mat-button-toggle value="apartment">Appartement</mat-button-toggle>
  <mat-button-toggle value="villa">Villa</mat-button-toggle>
</mat-button-toggle-group>
```

### After

```html
<mat-button-toggle-group [(value)]="selectedType" class="type-filter">
  <mat-button-toggle value="all">
    <span>Tous</span>
  </mat-button-toggle>
  <mat-button-toggle value="house">
    <app-re-icon icon="re-house" size="small"></app-re-icon>
    <span>Maison</span>
  </mat-button-toggle>
  <mat-button-toggle value="apartment">
    <app-re-icon icon="re-apartment" size="small"></app-re-icon>
    <span>Appartement</span>
  </mat-button-toggle>
  <mat-button-toggle value="villa">
    <app-re-icon icon="re-villa" size="small"></app-re-icon>
    <span>Villa</span>
  </mat-button-toggle>
  <mat-button-toggle value="office">
    <app-re-icon icon="re-office" size="small"></app-re-icon>
    <span>Bureau</span>
  </mat-button-toggle>
</mat-button-toggle-group>
```

#### CSS

```css
.type-filter ::ng-deep .mat-button-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

## Example 8: Property Details Tabs

### Before

```html
<mat-tab-group>
  <mat-tab label="Détails">...</mat-tab>
  <mat-tab label="Photos">...</mat-tab>
  <mat-tab label="Documents">...</mat-tab>
  <mat-tab label="Visite virtuelle">...</mat-tab>
</mat-tab-group>
```

### After

```html
<mat-tab-group>
  <mat-tab>
    <ng-template mat-tab-label>
      <app-re-icon icon="re-house" size="small"></app-re-icon>
      <span>Détails</span>
    </ng-template>
    <!-- Content -->
  </mat-tab>
  
  <mat-tab>
    <ng-template mat-tab-label>
      <app-re-icon icon="re-photo" size="small"></app-re-icon>
      <span>Photos</span>
    </ng-template>
    <!-- Content -->
  </mat-tab>
  
  <mat-tab>
    <ng-template mat-tab-label>
      <app-re-icon icon="re-contract" size="small"></app-re-icon>
      <span>Documents</span>
    </ng-template>
    <!-- Content -->
  </mat-tab>
  
  <mat-tab>
    <ng-template mat-tab-label>
      <app-re-icon icon="re-virtual-tour" size="small"></app-re-icon>
      <span>Visite virtuelle</span>
    </ng-template>
    <!-- Content -->
  </mat-tab>
</mat-tab-group>
```

## Example 9: Property Status Badge

### Before

```html
<span class="status-badge" [class.sold]="property.status === 'SOLD'">
  {{ property.status }}
</span>
```

### After

```html
<div class="status-badge" [ngClass]="'status-' + property.status.toLowerCase()">
  <app-re-icon 
    [icon]="getStatusIcon(property.status)" 
    size="small">
  </app-re-icon>
  <span>{{ getStatusLabel(property.status) }}</span>
</div>
```

#### Component TypeScript

```typescript
getStatusIcon(status: string): string {
  const statusMap: { [key: string]: string } = {
    'SOLD': 're-sold',
    'RENTED': 're-rent',
    'AVAILABLE': 're-keys',
    'VISIT_SCHEDULED': 're-calendar-visit',
    'OFFER_PENDING': 're-offer'
  };
  return statusMap[status] || 're-house';
}

getStatusLabel(status: string): string {
  const labelMap: { [key: string]: string } = {
    'SOLD': 'Vendu',
    'RENTED': 'Loué',
    'AVAILABLE': 'Disponible',
    'VISIT_SCHEDULED': 'Visite prévue',
    'OFFER_PENDING': 'Offre en cours'
  };
  return labelMap[status] || status;
}
```

#### CSS

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.status-sold {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-rented {
  background: #e3f2fd;
  color: #1565c0;
}

.status-available {
  background: #fff3e0;
  color: #ef6c00;
}
```

## Example 10: Quick Actions Menu

### Before

```html
<button mat-icon-button [matMenuTriggerFor]="menu">
  <mat-icon>more_vert</mat-icon>
</button>
<mat-menu #menu="matMenu">
  <button mat-menu-item>Voir</button>
  <button mat-menu-item>Modifier</button>
  <button mat-menu-item>Supprimer</button>
</mat-menu>
```

### After

```html
<button mat-icon-button [matMenuTriggerFor]="menu">
  <mat-icon>more_vert</mat-icon>
</button>
<mat-menu #menu="matMenu">
  <button mat-menu-item>
    <app-re-icon icon="re-visit" size="small"></app-re-icon>
    <span>Voir les détails</span>
  </button>
  <button mat-menu-item>
    <app-re-icon icon="re-calendar-visit" size="small"></app-re-icon>
    <span>Planifier visite</span>
  </button>
  <button mat-menu-item>
    <app-re-icon icon="re-contract" size="small"></app-re-icon>
    <span>Générer contrat</span>
  </button>
  <button mat-menu-item>
    <app-re-icon icon="re-keys" size="small"></app-re-icon>
    <span>Remettre les clés</span>
  </button>
  <mat-divider></mat-divider>
  <button mat-menu-item>
    <mat-icon>delete</mat-icon>
    <span>Supprimer</span>
  </button>
</mat-menu>
```

## Best Practices

1. **Consistency**: Use the same icon for the same concept throughout the app
2. **Size**: Use `small` for inline text, `medium` for cards, `large` for headers
3. **Color**: Use theme colors or semantic colors (success, warning, error)
4. **Accessibility**: Always provide meaningful context via text labels
5. **Performance**: Icons are lazy-loaded, so use freely without performance concerns

## Migration Checklist

- [ ] Replace Material Icons in property listings
- [ ] Update property detail pages
- [ ] Enhance dashboard stats cards
- [ ] Update action buttons with contextual icons
- [ ] Add icons to filters and toggles
- [ ] Enhance document lists
- [ ] Update tab labels
- [ ] Add status badges with icons
- [ ] Enhance quick action menus
- [ ] Update forms with icon labels
