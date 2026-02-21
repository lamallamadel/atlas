# Real Estate Icon System

## Overview

A comprehensive custom iconography system featuring 30+ real estate-specific icons in SVG format. All icons follow a consistent 24x24px grid with 2px outline stroke, designed to integrate seamlessly with Material Icons.

## Features

- ✅ **30+ Custom Icons**: Property types, rooms, amenities, documents, actions, and measurements
- ✅ **Lazy Loading**: Icons loaded on-demand via IconRegistryService
- ✅ **SVG Sprite**: Single sprite file for optimal performance
- ✅ **Searchable**: Full-text search across icon names, tags, and descriptions
- ✅ **Categorized**: Organized into 6 logical categories
- ✅ **Storybook Integration**: Interactive documentation with search and filter
- ✅ **Accessible**: ARIA labels and semantic HTML
- ✅ **Customizable**: Size and color variants

## Icon Categories

### House Types (6 icons)
- `re-house` - Maison individuelle
- `re-apartment` - Appartement en immeuble
- `re-villa` - Villa de standing
- `re-office` - Espace de bureau
- `re-warehouse` - Entrepôt industriel
- `re-land` - Terrain à bâtir

### Rooms (6 icons)
- `re-bedroom` - Chambre à coucher
- `re-bathroom` - Salle de bain
- `re-kitchen` - Cuisine équipée
- `re-living-room` - Salon / Séjour
- `re-garage` - Garage fermé
- `re-balcony` - Balcon ou terrasse

### Amenities & Equipment (7 icons)
- `re-pool` - Piscine
- `re-garden` - Jardin
- `re-parking` - Place de parking
- `re-elevator` - Ascenseur
- `re-security` - Système de sécurité
- `re-heating` - Chauffage
- `re-ac` - Climatisation

### Documents (5 icons)
- `re-contract` - Contrat de vente/location
- `re-deed` - Acte de propriété
- `re-inspection` - Rapport d'inspection
- `re-blueprint` - Plan architectural
- `re-certificate` - Certificat/Attestation

### Actions (7 icons)
- `re-visit` - Visite de bien
- `re-keys` - Remise de clés
- `re-sold` - Bien vendu
- `re-rent` - Bien loué
- `re-price` - Prix/Montant
- `re-offer` - Offre d'achat
- `re-calendar-visit` - Planifier une visite

### Measurements & Info (7 icons)
- `re-area` - Surface habitable
- `re-floor-plan` - Plan d'étage
- `re-location` - Localisation géographique
- `re-compass` - Orientation du bien
- `re-energy` - Performance énergétique
- `re-photo` - Photographie
- `re-virtual-tour` - Visite virtuelle 360°

## Usage

### Basic Usage

```typescript
import { Component, OnInit } from '@angular/core';
import { IconRegistryService } from './services/icon-registry.service';

@Component({
  selector: 'app-my-component',
  template: `
    <app-re-icon icon="re-house"></app-re-icon>
  `
})
export class MyComponent implements OnInit {
  constructor(private iconRegistry: IconRegistryService) {}

  ngOnInit(): void {
    // Preload icons (optional, icons lazy-load by default)
    this.iconRegistry.loadIcons().subscribe();
  }
}
```

### Size Variants

```html
<app-re-icon icon="re-house" size="small"></app-re-icon>   <!-- 16px -->
<app-re-icon icon="re-house" size="medium"></app-re-icon>  <!-- 24px (default) -->
<app-re-icon icon="re-house" size="large"></app-re-icon>   <!-- 32px -->
<app-re-icon icon="re-house" size="xlarge"></app-re-icon>  <!-- 48px -->
```

### Custom Colors

```html
<app-re-icon icon="re-house" color="#1976d2"></app-re-icon>
<app-re-icon icon="re-apartment" color="#388e3c"></app-re-icon>
```

### With Accessibility

```html
<app-re-icon 
  icon="re-house" 
  ariaLabel="Maison individuelle">
</app-re-icon>
```

### In Templates

```html
<!-- Property listing card -->
<div class="property-card">
  <div class="property-type">
    <app-re-icon icon="re-house" size="small"></app-re-icon>
    <span>Maison</span>
  </div>
  <div class="property-details">
    <div class="detail">
      <app-re-icon icon="re-bedroom" size="small"></app-re-icon>
      <span>3 chambres</span>
    </div>
    <div class="detail">
      <app-re-icon icon="re-bathroom" size="small"></app-re-icon>
      <span>2 salles de bain</span>
    </div>
    <div class="detail">
      <app-re-icon icon="re-area" size="small"></app-re-icon>
      <span>120 m²</span>
    </div>
  </div>
</div>

<!-- Amenities list -->
<div class="amenities">
  <app-re-icon icon="re-pool" ariaLabel="Piscine"></app-re-icon>
  <app-re-icon icon="re-garden" ariaLabel="Jardin"></app-re-icon>
  <app-re-icon icon="re-parking" ariaLabel="Parking"></app-re-icon>
  <app-re-icon icon="re-elevator" ariaLabel="Ascenseur"></app-re-icon>
</div>

<!-- Action buttons -->
<button mat-button>
  <app-re-icon icon="re-visit" size="small"></app-re-icon>
  Planifier une visite
</button>
<button mat-button>
  <app-re-icon icon="re-offer" size="small"></app-re-icon>
  Faire une offre
</button>
```

## IconRegistryService API

### Methods

#### `loadIcons(): Observable<void>`
Loads the SVG sprite and caches all icons. Called automatically on first icon usage.

```typescript
this.iconRegistry.loadIcons().subscribe(() => {
  console.log('Icons loaded');
});
```

#### `getIcon(iconId: string): Observable<SafeHtml | null>`
Retrieves a specific icon (async).

```typescript
this.iconRegistry.getIcon('re-house').subscribe(svg => {
  this.houseSvg = svg;
});
```

#### `getIconSync(iconId: string): SafeHtml | null`
Retrieves a cached icon synchronously.

```typescript
const svg = this.iconRegistry.getIconSync('re-house');
```

#### `isLoaded(): boolean`
Check if icons have been loaded.

```typescript
if (this.iconRegistry.isLoaded()) {
  // Icons available
}
```

#### `getMetadata(iconId?: string): IconMetadata[]`
Get metadata for one or all icons.

```typescript
// Get all metadata
const allIcons = this.iconRegistry.getMetadata();

// Get specific icon metadata
const houseIcon = this.iconRegistry.getMetadata('re-house');
```

#### `searchIcons(query: string): IconMetadata[]`
Search icons by name, tags, or description.

```typescript
const results = this.iconRegistry.searchIcons('piscine');
// Returns: [{ id: 're-pool', name: 'Piscine', ... }]
```

#### `getIconsByCategory(category: string): IconMetadata[]`
Filter icons by category.

```typescript
const houseTypes = this.iconRegistry.getIconsByCategory('house-types');
```

#### `getAllCategories(): Array<{ key: string; label: string }>`
Get all available categories.

```typescript
const categories = this.iconRegistry.getAllCategories();
// [{ key: 'house-types', label: 'Types de biens' }, ...]
```

## Module Integration

### Import in AppModule

```typescript
import { ReIconComponent } from './components/re-icon/re-icon.component';
import { IconRegistryService } from './services/icon-registry.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    ReIconComponent,
    // ... other components
  ],
  imports: [
    HttpClientModule,
    // ... other modules
  ],
  providers: [
    IconRegistryService
  ]
})
export class AppModule { }
```

### Shared Module Pattern

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReIconComponent } from './components/re-icon/re-icon.component';

@NgModule({
  declarations: [ReIconComponent],
  imports: [CommonModule],
  exports: [ReIconComponent]
})
export class SharedModule { }
```

## Storybook Documentation

View the interactive icon gallery in Storybook:

```bash
npm run storybook
```

Navigate to:
- **Design System > Real Estate Icons** - Individual icon showcase with controls
- **Design System > Icon Gallery** - Interactive searchable gallery with filters

### Storybook Features

- **Search**: Type to search across icon names, tags, and descriptions
- **Filter**: Filter by category (House Types, Rooms, Amenities, etc.)
- **Copy Code**: Click "Copier" to copy the component markup
- **Live Preview**: See all size and color variants
- **Documentation**: Auto-generated docs with usage examples

## Design Guidelines

### Grid System
- All icons fit within a 24x24px grid
- 2px stroke width for consistency
- 2px margin for optical balance

### Style
- Outline style (stroke-based, no fills except for small details)
- Rounded line caps and joins
- Consistent with Material Icons design language

### Colors
- Icons inherit `currentColor` by default
- Can be customized via the `color` prop
- Recommended colors:
  - Primary: `#1976d2` (Material Blue)
  - Success: `#388e3c` (Material Green)
  - Warning: `#f57c00` (Material Orange)
  - Error: `#c62828` (Material Red)

### Accessibility
- Always provide `ariaLabel` for standalone icons
- Use with descriptive text when possible
- Ensure sufficient color contrast (4.5:1 minimum)

## Performance

### Lazy Loading
Icons are loaded on-demand when first requested. The SVG sprite is fetched once and cached.

### Caching
- SVG sprite cached via RxJS `shareReplay(1)`
- Individual icons cached in-memory as `SafeHtml`
- No re-parsing on subsequent renders

### Bundle Size
- SVG sprite: ~15KB (uncompressed)
- Service code: ~3KB
- Component code: ~2KB
- **Total**: ~20KB for 38 icons

### Optimization Tips

1. **Preload on App Init** (optional):
```typescript
export class AppComponent implements OnInit {
  constructor(private iconRegistry: IconRegistryService) {}
  
  ngOnInit(): void {
    this.iconRegistry.loadIcons().subscribe();
  }
}
```

2. **Use OnPush Change Detection**:
The `ReIconComponent` uses `ChangeDetectionStrategy.OnPush` for optimal performance.

3. **Avoid Repeated Searches**:
Cache search results if performing the same query multiple times.

## Migration from Material Icons

### Before (Material Icons)
```html
<mat-icon>home</mat-icon>
<mat-icon>bed</mat-icon>
<mat-icon>pool</mat-icon>
```

### After (Real Estate Icons)
```html
<app-re-icon icon="re-house"></app-re-icon>
<app-re-icon icon="re-bedroom"></app-re-icon>
<app-re-icon icon="re-pool"></app-re-icon>
```

### Mapping Guide

| Material Icon | Real Estate Icon | Context |
|--------------|------------------|---------|
| `home` | `re-house` | Single-family house |
| `apartment` | `re-apartment` | Apartment building |
| `villa` | `re-villa` | Luxury villa |
| `business` | `re-office` | Commercial office |
| `warehouse` | `re-warehouse` | Industrial warehouse |
| `terrain` | `re-land` | Land parcel |
| `bed` | `re-bedroom` | Bedroom |
| `bathtub` | `re-bathroom` | Bathroom |
| `kitchen` | `re-kitchen` | Kitchen |
| `weekend` | `re-living-room` | Living room |
| `garage` | `re-garage` | Garage |
| `balcony` | `re-balcony` | Balcony |
| `pool` | `re-pool` | Swimming pool |
| `park` | `re-garden` | Garden |
| `local_parking` | `re-parking` | Parking spot |
| `elevator` | `re-elevator` | Elevator |
| `security` | `re-security` | Security system |
| `thermostat` | `re-heating` | Heating |
| `ac_unit` | `re-ac` | Air conditioning |
| `description` | `re-contract` | Contract |
| `gavel` | `re-deed` | Property deed |
| `fact_check` | `re-inspection` | Inspection report |
| `architecture` | `re-blueprint` | Blueprint |
| `verified` | `re-certificate` | Certificate |
| `visibility` | `re-visit` | Property visit |
| `vpn_key` | `re-keys` | Keys |
| `check_circle` | `re-sold` | Sold |
| `attach_money` | `re-rent` | Rent |
| `euro` | `re-price` | Price |
| `local_offer` | `re-offer` | Offer |
| `square_foot` | `re-area` | Area |
| `maps_home_work` | `re-floor-plan` | Floor plan |
| `place` | `re-location` | Location |
| `explore` | `re-compass` | Compass |
| `bolt` | `re-energy` | Energy |
| `event` | `re-calendar-visit` | Calendar visit |
| `photo_camera` | `re-photo` | Photo |
| `360` | `re-virtual-tour` | Virtual tour |

## Files Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── re-icon/
│   │   │       ├── re-icon.component.ts
│   │   │       ├── re-icon.component.html
│   │   │       └── re-icon.component.css
│   │   └── services/
│   │       └── icon-registry.service.ts
│   ├── assets/
│   │   └── icons/
│   │       └── real-estate-icons.svg
│   └── stories/
│       ├── components/
│       │   └── icon-gallery.component.ts
│       ├── RealEstateIcons.stories.ts
│       └── IconGallery.stories.ts
└── REAL_ESTATE_ICONS.md
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All modern browsers with SVG support.

## Future Enhancements

- [ ] Add more property-specific icons (co-working, loft, duplex)
- [ ] Add filled variants for selected states
- [ ] Add animated icons for loading states
- [ ] Export individual SVG files for design tools
- [ ] Create Figma component library
- [ ] Add dark mode optimized variants

## Contributing

When adding new icons:

1. Follow the 24x24px grid system
2. Use 2px stroke width
3. Add metadata to `IconRegistryService`
4. Update this documentation
5. Add Storybook example
6. Test in all size variants

## License

Custom icons created for Atlasia real estate platform.
