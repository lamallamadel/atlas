# Real Estate Icons - Visual Reference Guide

Quick visual reference for all 38 custom real estate icons.

## 🏠 House Types (6 icons)

| Icon ID | Name | Usage |
|---------|------|-------|
| `re-house` | Maison | Single-family house, detached home |
| `re-apartment` | Appartement | Apartment in building, flat |
| `re-villa` | Villa | Luxury villa, upscale property |
| `re-office` | Bureau | Commercial office space |
| `re-warehouse` | Entrepôt | Industrial warehouse, storage |
| `re-land` | Terrain | Land plot, buildable lot |

**Common Use Cases**:
- Property type badges
- Filter buttons
- Listing cards
- Search results

**Example**:
```html
<app-re-icon icon="re-house" size="medium"></app-re-icon>
```

---

## 🚪 Rooms (6 icons)

| Icon ID | Name | Usage |
|---------|------|-------|
| `re-bedroom` | Chambre | Bedroom count, sleeping area |
| `re-bathroom` | Salle de bain | Bathroom count, facilities |
| `re-kitchen` | Cuisine | Kitchen features, equipped |
| `re-living-room` | Salon | Living room, common area |
| `re-garage` | Garage | Enclosed garage, parking |
| `re-balcony` | Balcon | Balcony, terrace, outdoor space |

**Common Use Cases**:
- Property features
- Room count display
- Floor plan details
- Feature lists

**Example**:
```html
<span>
  <app-re-icon icon="re-bedroom" size="small"></app-re-icon>
  3 chambres
</span>
```

---

## 🏊 Amenities & Equipment (7 icons)

| Icon ID | Name | Usage |
|---------|------|-------|
| `re-pool` | Piscine | Swimming pool |
| `re-garden` | Jardin | Garden, yard, green space |
| `re-parking` | Parking | Parking spot, space |
| `re-elevator` | Ascenseur | Elevator, lift |
| `re-security` | Sécurité | Security system, alarm |
| `re-heating` | Chauffage | Heating system |
| `re-ac` | Climatisation | Air conditioning |

**Common Use Cases**:
- Amenity lists
- Property highlights
- Feature chips
- Facility filters

**Example**:
```html
<div class="amenities">
  <app-re-icon icon="re-pool" color="#1976d2"></app-re-icon>
  <app-re-icon icon="re-garden" color="#1976d2"></app-re-icon>
  <app-re-icon icon="re-parking" color="#1976d2"></app-re-icon>
</div>
```

---

## 📄 Documents (5 icons)

| Icon ID | Name | Usage |
|---------|------|-------|
| `re-contract` | Contrat | Sales/rental contract |
| `re-deed` | Acte | Property deed, title |
| `re-inspection` | Inspection | Inspection report, diagnostics |
| `re-blueprint` | Plan | Architectural plans |
| `re-certificate` | Certificat | Certificates, attestations |

**Common Use Cases**:
- Document lists
- Download buttons
- File type indicators
- Document management

**Example**:
```html
<button mat-menu-item>
  <app-re-icon icon="re-contract" size="small"></app-re-icon>
  <span>Télécharger contrat</span>
</button>
```

---

## ⚡ Actions (7 icons)

| Icon ID | Name | Usage |
|---------|------|-------|
| `re-visit` | Visite | Property visit, viewing |
| `re-keys` | Clés | Key handover, access |
| `re-sold` | Vendu | Sold property, completed sale |
| `re-rent` | Loué | Rented property |
| `re-price` | Prix | Price, amount, cost |
| `re-offer` | Offre | Purchase offer, bid |
| `re-calendar-visit` | Calendrier visite | Schedule visit, appointment |

**Common Use Cases**:
- Action buttons
- Status badges
- Workflow steps
- Quick actions menu

**Example**:
```html
<button mat-raised-button color="primary">
  <app-re-icon icon="re-visit" size="small"></app-re-icon>
  Planifier une visite
</button>
```

---

## 📏 Measurements & Info (7 icons)

| Icon ID | Name | Usage |
|---------|------|-------|
| `re-area` | Surface | Living area, square meters |
| `re-floor-plan` | Plan d'étage | Floor plan, layout |
| `re-location` | Localisation | Geographic location, address |
| `re-compass` | Orientation | Property orientation, exposure |
| `re-energy` | Énergie | Energy performance, DPE |
| `re-photo` | Photo | Photography, gallery |
| `re-virtual-tour` | Visite virtuelle | Virtual tour, 360° view |

**Common Use Cases**:
- Property metrics
- Detail labels
- Info cards
- Tab navigation

**Example**:
```html
<div class="metric">
  <app-re-icon icon="re-area" size="small"></app-re-icon>
  <span>120 m²</span>
</div>
```

---

## 🎨 Color Recommendations

### By Context

**Property Types** (House Types):
- Primary Blue: `#1976d2`
- Teal: `#00796b`

**Rooms**:
- Deep Purple: `#512da8`
- Indigo: `#303f9f`

**Amenities**:
- Light Blue: `#0288d1`
- Cyan: `#00acc1`

**Documents**:
- Orange: `#f57c00`
- Amber: `#ffa000`

**Actions**:
- Green: `#388e3c` (success actions)
- Red: `#c62828` (delete/remove)
- Blue: `#1976d2` (primary actions)

**Measurements**:
- Gray: `#757575` (neutral info)
- Brown: `#5d4037` (physical properties)

### Semantic Colors

```html
<!-- Success -->
<app-re-icon icon="re-sold" color="#388e3c"></app-re-icon>

<!-- Warning -->
<app-re-icon icon="re-energy" color="#f57c00"></app-re-icon>

<!-- Error -->
<app-re-icon icon="re-security" color="#c62828"></app-re-icon>

<!-- Info -->
<app-re-icon icon="re-location" color="#1976d2"></app-re-icon>

<!-- Neutral -->
<app-re-icon icon="re-area" color="#757575"></app-re-icon>
```

---

## 📱 Size Guidelines

### Small (16px)
Use for inline text, compact lists, table cells

```html
<app-re-icon icon="re-bedroom" size="small"></app-re-icon>
```

**Best for**:
- List items
- Table rows
- Inline labels
- Breadcrumbs

### Medium (24px) - Default
Use for cards, buttons, standard UI elements

```html
<app-re-icon icon="re-house" size="medium"></app-re-icon>
```

**Best for**:
- Property cards
- Buttons
- Navigation
- Feature lists

### Large (32px)
Use for section headers, prominent features

```html
<app-re-icon icon="re-villa" size="large"></app-re-icon>
```

**Best for**:
- Page headers
- Dashboard cards
- Empty states
- Hero sections

### XLarge (48px)
Use for hero sections, splash screens, large displays

```html
<app-re-icon icon="re-house" size="xlarge"></app-re-icon>
```

**Best for**:
- Landing pages
- Onboarding
- Error states
- Promotional banners

---

## 🔄 Common Combinations

### Property Card Header
```html
<div class="property-header">
  <app-re-icon icon="re-house" size="medium"></app-re-icon>
  <span>Maison 4 pièces</span>
</div>
```

### Property Details Row
```html
<div class="detail-row">
  <app-re-icon icon="re-bedroom" size="small"></app-re-icon>
  <span>3 chambres</span>
  
  <app-re-icon icon="re-bathroom" size="small"></app-re-icon>
  <span>2 salles de bain</span>
  
  <app-re-icon icon="re-area" size="small"></app-re-icon>
  <span>120 m²</span>
</div>
```

### Amenities Grid
```html
<div class="amenities-grid">
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

### Action Buttons
```html
<div class="actions">
  <button mat-button>
    <app-re-icon icon="re-visit" size="small"></app-re-icon>
    Planifier visite
  </button>
  <button mat-button>
    <app-re-icon icon="re-offer" size="small"></app-re-icon>
    Faire une offre
  </button>
</div>
```

---

## 🎯 Quick Reference Table

| Category | Icons | Primary Use | Recommended Size |
|----------|-------|-------------|------------------|
| House Types | 6 | Type identification | Medium (24px) |
| Rooms | 6 | Room counts, features | Small (16px) |
| Amenities | 7 | Property highlights | Small-Medium (16-24px) |
| Documents | 5 | Document management | Small (16px) |
| Actions | 7 | Buttons, workflows | Small (16px) |
| Measurements | 7 | Property metrics | Small (16px) |

---

## 🔍 Search Terms Reference

**Quick search by French terms**:

| Search Term | Matching Icons |
|-------------|----------------|
| maison | re-house |
| appartement | re-apartment |
| piscine | re-pool |
| jardin | re-garden |
| chambre | re-bedroom |
| salle de bain | re-bathroom |
| cuisine | re-kitchen |
| parking | re-parking, re-garage |
| contrat | re-contract |
| visite | re-visit, re-calendar-visit, re-virtual-tour |
| surface | re-area |
| localisation | re-location |
| vendu | re-sold |
| loué | re-rent |
| prix | re-price |

---

## 📋 Print Reference

For printing/offline reference, all icons follow this naming pattern:

**Pattern**: `re-{category}-{name}`

**Prefix**: `re-` (real estate)

**Examples**:
- Property types: `re-house`, `re-apartment`, `re-villa`
- Rooms: `re-bedroom`, `re-bathroom`, `re-kitchen`
- Amenities: `re-pool`, `re-garden`, `re-parking`
- Documents: `re-contract`, `re-deed`, `re-inspection`
- Actions: `re-visit`, `re-keys`, `re-sold`
- Measurements: `re-area`, `re-location`, `re-energy`

---

## 🚀 Quick Copy-Paste

```html
<!-- Property Type -->
<app-re-icon icon="re-house"></app-re-icon>

<!-- Room Features -->
<app-re-icon icon="re-bedroom" size="small"></app-re-icon>
<app-re-icon icon="re-bathroom" size="small"></app-re-icon>

<!-- Amenities -->
<app-re-icon icon="re-pool" color="#1976d2"></app-re-icon>
<app-re-icon icon="re-garden" color="#1976d2"></app-re-icon>

<!-- Actions -->
<app-re-icon icon="re-visit" size="small"></app-re-icon>
<app-re-icon icon="re-offer" size="small"></app-re-icon>

<!-- Measurements -->
<app-re-icon icon="re-area" size="small"></app-re-icon>
<app-re-icon icon="re-location" size="small"></app-re-icon>
```

---

**For detailed usage and examples, see:**
- [Complete Documentation](./REAL_ESTATE_ICONS.md)
- [Implementation Examples](./ICON_IMPLEMENTATION_EXAMPLES.md)
- [Quick Start Guide](./ICON_QUICK_START.md)
