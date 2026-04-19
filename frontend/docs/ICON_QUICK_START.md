# Real Estate Icons - Quick Start Guide

## 🚀 Installation (5 minutes)

### 1. Files Already Created

The icon system is ready to use! These files have been created:

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/re-icon/           ← Icon component
│   │   │   ├── re-icon.component.ts
│   │   │   ├── re-icon.component.html
│   │   │   └── re-icon.component.css
│   │   └── services/
│   │       └── icon-registry.service.ts  ← Icon loader service
│   ├── assets/icons/
│   │   └── real-estate-icons.svg         ← 38 SVG icons
│   └── stories/
│       ├── RealEstateIcons.stories.ts    ← Storybook showcase
│       ├── IconGallery.stories.ts        ← Interactive gallery
│       └── components/
│           └── icon-gallery.component.ts
├── .storybook/                           ← Storybook config
│   ├── main.js
│   ├── preview.js
│   └── README.md
├── REAL_ESTATE_ICONS.md                  ← Full documentation
├── ICON_IMPLEMENTATION_EXAMPLES.md       ← Usage examples
└── ICON_QUICK_START.md                   ← This file
```

### 2. Add to AppModule

Open `src/app/app.module.ts` and add:

```typescript
import { HttpClientModule } from '@angular/common/http';
import { ReIconComponent } from './components/re-icon/re-icon.component';
import { IconRegistryService } from './services/icon-registry.service';

@NgModule({
  declarations: [
    // ... existing declarations
    ReIconComponent,  // ← Add this
  ],
  imports: [
    // ... existing imports
    HttpClientModule,  // ← Add this if not already present
  ],
  providers: [
    // ... existing providers
    IconRegistryService,  // ← Add this
  ]
})
export class AppModule { }
```

### 3. Preload Icons (Optional)

In `app.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { IconRegistryService } from './services/icon-registry.service';

export class AppComponent implements OnInit {
  constructor(private iconRegistry: IconRegistryService) {}
  
  ngOnInit(): void {
    // Preload all icons at app startup
    this.iconRegistry.loadIcons().subscribe();
  }
}
```

## 📦 Basic Usage

### Simple Icon

```html
<app-re-icon icon="re-house"></app-re-icon>
```

### With Size

```html
<app-re-icon icon="re-house" size="small"></app-re-icon>   <!-- 16px -->
<app-re-icon icon="re-house" size="medium"></app-re-icon>  <!-- 24px default -->
<app-re-icon icon="re-house" size="large"></app-re-icon>   <!-- 32px -->
<app-re-icon icon="re-house" size="xlarge"></app-re-icon>  <!-- 48px -->
```

### With Color

```html
<app-re-icon icon="re-house" color="#1976d2"></app-re-icon>
```

### With Accessibility

```html
<app-re-icon icon="re-house" ariaLabel="Maison individuelle"></app-re-icon>
```

## 🎨 All 38 Available Icons

### House Types (6)
- `re-house` - Maison
- `re-apartment` - Appartement  
- `re-villa` - Villa
- `re-office` - Bureau
- `re-warehouse` - Entrepôt
- `re-land` - Terrain

### Rooms (6)
- `re-bedroom` - Chambre
- `re-bathroom` - Salle de bain
- `re-kitchen` - Cuisine
- `re-living-room` - Salon
- `re-garage` - Garage
- `re-balcony` - Balcon

### Amenities (7)
- `re-pool` - Piscine
- `re-garden` - Jardin
- `re-parking` - Parking
- `re-elevator` - Ascenseur
- `re-security` - Sécurité
- `re-heating` - Chauffage
- `re-ac` - Climatisation

### Documents (5)
- `re-contract` - Contrat
- `re-deed` - Acte
- `re-inspection` - Inspection
- `re-blueprint` - Plan
- `re-certificate` - Certificat

### Actions (7)
- `re-visit` - Visite
- `re-keys` - Clés
- `re-sold` - Vendu
- `re-rent` - Loué
- `re-price` - Prix
- `re-offer` - Offre
- `re-calendar-visit` - Calendrier

### Measurements (7)
- `re-area` - Surface
- `re-floor-plan` - Plan d'étage
- `re-location` - Localisation
- `re-compass` - Orientation
- `re-energy` - Énergie
- `re-photo` - Photo
- `re-virtual-tour` - Visite virtuelle

## 💡 Common Use Cases

### Property Card

```html
<mat-card class="property-card">
  <div class="property-type">
    <app-re-icon icon="re-house" size="medium"></app-re-icon>
    <h3>Maison 4 pièces</h3>
  </div>
  <div class="details">
    <span>
      <app-re-icon icon="re-bedroom" size="small"></app-re-icon>
      3 chambres
    </span>
    <span>
      <app-re-icon icon="re-area" size="small"></app-re-icon>
      120 m²
    </span>
    <span>
      <app-re-icon icon="re-location" size="small"></app-re-icon>
      Paris 15e
    </span>
  </div>
</mat-card>
```

### Action Button

```html
<button mat-raised-button color="primary">
  <app-re-icon icon="re-visit" size="small"></app-re-icon>
  Planifier une visite
</button>
```

### Feature List

```html
<div class="amenities">
  <div class="amenity">
    <app-re-icon icon="re-pool" color="#1976d2"></app-re-icon>
    <span>Piscine</span>
  </div>
  <div class="amenity">
    <app-re-icon icon="re-garden" color="#1976d2"></app-re-icon>
    <span>Jardin</span>
  </div>
  <div class="amenity">
    <app-re-icon icon="re-parking" color="#1976d2"></app-re-icon>
    <span>Parking</span>
  </div>
</div>
```

## 🔍 Search & Filter Service Usage

### Search Icons

```typescript
import { IconRegistryService } from './services/icon-registry.service';

export class MyComponent {
  constructor(private iconRegistry: IconRegistryService) {}
  
  searchIcons(query: string) {
    const results = this.iconRegistry.searchIcons(query);
    // Returns matching icons by name, tags, or description
  }
}
```

### Filter by Category

```typescript
const houseTypes = this.iconRegistry.getIconsByCategory('house-types');
const rooms = this.iconRegistry.getIconsByCategory('rooms');
const amenities = this.iconRegistry.getIconsByCategory('amenities');
```

### Get All Categories

```typescript
const categories = this.iconRegistry.getAllCategories();
// [{ key: 'house-types', label: 'Types de biens' }, ...]
```

## 📚 Storybook (Optional)

### Install Storybook

```bash
cd frontend
npx storybook@latest init
```

### Run Storybook

```bash
npm run storybook
```

Opens at http://localhost:6006

Navigate to:
- **Design System > Real Estate Icons** - Individual showcase
- **Design System > Icon Gallery** - Interactive searchable gallery

## 🎯 Migration from Material Icons

| Old (Material) | New (Real Estate) |
|---------------|------------------|
| `<mat-icon>home</mat-icon>` | `<app-re-icon icon="re-house"></app-re-icon>` |
| `<mat-icon>apartment</mat-icon>` | `<app-re-icon icon="re-apartment"></app-re-icon>` |
| `<mat-icon>bed</mat-icon>` | `<app-re-icon icon="re-bedroom"></app-re-icon>` |
| `<mat-icon>pool</mat-icon>` | `<app-re-icon icon="re-pool"></app-re-icon>` |
| `<mat-icon>place</mat-icon>` | `<app-re-icon icon="re-location"></app-re-icon>` |

## 🐛 Troubleshooting

### Icons Not Showing

1. **Check Module Import**
   ```typescript
   // app.module.ts
   import { HttpClientModule } from '@angular/common/http';
   imports: [HttpClientModule]
   ```

2. **Check Component Declaration**
   ```typescript
   // app.module.ts
   import { ReIconComponent } from './components/re-icon/re-icon.component';
   declarations: [ReIconComponent]
   ```

3. **Check SVG File Exists**
   - Path: `src/assets/icons/real-estate-icons.svg`
   - Size: ~15KB with 38 icons

### Console Errors

- **404 on SVG file**: Check `angular.json` includes `assets` folder
- **SafeHtml error**: IconRegistryService is using DomSanitizer correctly
- **Module not found**: Verify all imports in app.module.ts

## 📖 Full Documentation

- [**REAL_ESTATE_ICONS.md**](./REAL_ESTATE_ICONS.md) - Complete API reference
- [**ICON_IMPLEMENTATION_EXAMPLES.md**](./ICON_IMPLEMENTATION_EXAMPLES.md) - 10+ detailed examples
- [**.storybook/README.md**](./.storybook/README.md) - Storybook setup guide

## ✅ Checklist

- [ ] Added `ReIconComponent` to app.module.ts declarations
- [ ] Added `HttpClientModule` to app.module.ts imports
- [ ] Added `IconRegistryService` to app.module.ts providers
- [ ] Verified SVG file exists at `assets/icons/real-estate-icons.svg`
- [ ] Tested basic icon usage: `<app-re-icon icon="re-house"></app-re-icon>`
- [ ] (Optional) Installed Storybook for interactive documentation
- [ ] (Optional) Replaced Material Icons with custom icons in templates

## 🎉 You're Ready!

Start using custom real estate icons in your templates!

```html
<app-re-icon icon="re-house" size="large" color="#1976d2"></app-re-icon>
```

For more examples, see [ICON_IMPLEMENTATION_EXAMPLES.md](./ICON_IMPLEMENTATION_EXAMPLES.md)
