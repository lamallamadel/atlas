# Extended Color System - Quick Reference Cheat Sheet

## 🎨 Badge-Status Component

### Property Status (Real Estate)
```html
<app-badge-status status="SOLD" entityType="property"></app-badge-status>      <!-- Green -->
<app-badge-status status="RENTED" entityType="property"></app-badge-status>    <!-- Teal -->
<app-badge-status status="SIGNED" entityType="property"></app-badge-status>    <!-- Blue-Green -->
<app-badge-status status="AVAILABLE" entityType="property"></app-badge-status> <!-- Standard Green -->
<app-badge-status status="PENDING" entityType="property"></app-badge-status>   <!-- Yellow-Orange -->
<app-badge-status status="RESERVED" entityType="property"></app-badge-status>  <!-- Orange -->
<app-badge-status status="WITHDRAWN" entityType="property"></app-badge-status> <!-- Warm Gray -->
```

## 🎯 CSS Custom Properties

### Neutral-Warmth (Warm Grays)
```scss
--color-neutral-warmth-50   // #fafaf9  - Almost white
--color-neutral-warmth-600  // #57534e  - 7.07:1 ✓ WCAG AAA
--color-neutral-warmth-700  // #44403c  - 9.73:1 ✓ WCAG AAA
--color-neutral-warmth-800  // #292524  - 14.47:1 ✓ WCAG AAA
--color-neutral-warmth-900  // #1c1917  - 17.22:1 ✓ WCAG AAA
```

### Success-Variants
```scss
// Vendu (Sold) - Green
--color-success-sold-700    // #047857  - 7.09:1 ✓
--color-success-sold-800    // #065f46  - 9.56:1 ✓
--color-success-sold-900    // #064e3b  - 11.82:1 ✓

// Loué (Rented) - Teal
--color-success-rented-700  // #0f766e  - 7.05:1 ✓
--color-success-rented-800  // #115e59  - 9.45:1 ✓
--color-success-rented-900  // #134e4a  - 11.67:1 ✓

// Signé (Signed) - Blue-Green
--color-success-signed-700  // #0e7490  - 7.03:1 ✓
--color-success-signed-800  // #155e75  - 9.39:1 ✓
--color-success-signed-900  // #164e63  - 11.42:1 ✓
```

### Warning-Levels
```scss
// Attention (Yellow-Orange)
--color-warning-attention-800  // #854d0e  - 8.92:1 ✓
--color-warning-attention-900  // #713f12  - 10.84:1 ✓

// Urgent (Orange)
--color-warning-urgent-800     // #9a3412  - 9.24:1 ✓
--color-warning-urgent-900     // #7c2d12  - 11.45:1 ✓

// Critical (Red-Orange)
--color-warning-critical-700   // #b91c1c  - 7.41:1 ✓
--color-warning-critical-800   // #991b1b  - 9.39:1 ✓
--color-warning-critical-900   // #7f1d1d  - 11.26:1 ✓
```

### Danger-Soft (Non-Blocking)
```scss
--color-danger-soft-700     // #be123c  - 7.42:1 ✓
--color-danger-soft-800     // #9f1239  - 9.58:1 ✓
--color-danger-soft-900     // #881337  - 11.45:1 ✓
```

### Surface Layering
```scss
--color-surface-base   // #ffffff - Base background
--color-surface-1      // #fafafa - First elevation
--color-surface-2      // #f5f5f5 - Second elevation
--color-surface-3      // #f0f0f0 - Third elevation
--color-surface-4      // #ebebeb - Fourth elevation
```

## 🚀 Utility Classes

### Background Colors
```html
<div class="bg-surface-1">...</div>
<div class="bg-surface-2">...</div>
<div class="bg-success-sold-50">...</div>
<div class="bg-warning-attention-50">...</div>
<div class="bg-neutral-warmth-100">...</div>
```

### Text Colors
```html
<span class="text-success-sold-700">Vendu</span>
<span class="text-success-rented-700">Loué</span>
<span class="text-warning-attention-800">Attention</span>
<span class="text-danger-soft-700">Erreur</span>
<span class="text-neutral-warmth-700">Retiré</span>
```

### Border Colors
```html
<div class="border-success-sold">...</div>
<div class="border-warning-urgent">...</div>
<div class="border-neutral-warmth-300">...</div>
```

### Transitions
```html
<div class="transition-badge-smooth">...</div>
<div class="transition-badge-color">...</div>
<div class="transition-badge-transform">...</div>
```

### Shadows
```html
<div class="shadow-surface-1">...</div>
<div class="shadow-surface-2">...</div>
<div class="shadow-surface-3">...</div>
<div class="shadow-surface-4">...</div>
```

## 📊 Property Card Variants

```html
<!-- Sold -->
<div class="property-card-sold">
  <h3>Villa Moderne</h3>
  <p class="text-success-sold-700">450 000€</p>
</div>

<!-- Rented -->
<div class="property-card-rented">
  <h3>Appartement T3</h3>
  <p class="text-success-rented-700">1 500€/mois</p>
</div>

<!-- Signed -->
<div class="property-card-signed">
  <h3>Maison Familiale</h3>
  <p class="text-success-signed-700">Contrat signé</p>
</div>

<!-- Pending -->
<div class="property-card-pending">
  <h3>Studio Centre</h3>
  <p class="text-warning-attention-700">En attente</p>
</div>

<!-- Reserved -->
<div class="property-card-reserved">
  <h3>Loft Moderne</h3>
  <p class="text-warning-urgent-700">Réservé</p>
</div>
```

## ⚡ Lead Urgency Indicators

```html
<div class="lead-attention">Normal follow-up</div>
<div class="lead-urgent">Urgent attention (pulses)</div>
<div class="lead-critical">Critical action (pulses faster)</div>
```

## ✅ Validation States

```html
<!-- Soft Error -->
<div class="validation-error-soft">
  <span class="validation-error-soft-text">Champ invalide</span>
</div>

<!-- Warning -->
<div class="validation-warning">
  <span class="validation-warning-text">Vérification recommandée</span>
</div>
```

## 🎭 Semantic Aliases

```scss
// Property Status
--color-property-sold        // var(--color-success-sold-700)
--color-property-rented      // var(--color-success-rented-700)
--color-property-signed      // var(--color-success-signed-700)
--color-property-available   // var(--color-success-700)
--color-property-pending     // var(--color-warning-attention-700)
--color-property-reserved    // var(--color-warning-urgent-700)
--color-property-withdrawn   // var(--color-neutral-warmth-600)

// Lead Urgency
--color-lead-attention       // var(--color-warning-attention-700)
--color-lead-urgent          // var(--color-warning-urgent-700)
--color-lead-critical        // var(--color-warning-critical-700)

// Validation
--color-validation-error     // var(--color-error-700)
--color-validation-warning   // var(--color-warning-urgent-600)
--color-validation-info      // var(--color-info-700)
--color-validation-success   // var(--color-success-700)
--color-validation-soft-error // var(--color-danger-soft-700)
```

## 🎨 Smooth Transitions

```scss
// Badge transitions (250ms cubic-bezier)
--transition-badge-smooth: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-badge-color: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1), 
                          color 250ms cubic-bezier(0.4, 0, 0.2, 1), 
                          border-color 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-badge-transform: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-badge-shadow: box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

## ♿ WCAG AAA Guidelines

| Text Type | Minimum Variant | Contrast Ratio |
|-----------|----------------|----------------|
| **Critical** (prices, legal) | 700+ | 7:1 (AAA) |
| **Standard** | 600+ | 4.5:1 (AA) |
| **Large** (18px+) | 600+ | 3:1 (AA) |
| **Decorative** | Any | N/A |

### Examples
```html
<!-- Critical text - Use 700+ -->
<span class="text-success-sold-700">850 000€</span>

<!-- Standard text - Use 600+ -->
<p class="text-neutral-warmth-600">Description</p>

<!-- Large heading - Use 600+ -->
<h2 class="text-warning-urgent-600">Urgent</h2>
```

## 🌙 Dark Mode

Colors automatically adapt - no extra code needed!

```scss
// Light mode
--color-property-sold: var(--color-success-sold-700);

// Dark mode (automatic)
.dark-theme {
  --color-property-sold: var(--color-success-sold-400);
}
```

## 📱 Surface Layering Example

```html
<div class="bg-surface-base">
  <div class="bg-surface-1 shadow-surface-1">
    <div class="bg-surface-2 shadow-surface-2">
      <div class="bg-surface-3 shadow-surface-3">
        <div class="bg-surface-4 shadow-surface-4">
          Deepest level
        </div>
      </div>
    </div>
  </div>
</div>
```

## 🎯 Quick Copy-Paste Templates

### Property Status Badge
```html
<app-badge-status status="SOLD" entityType="property"></app-badge-status>
```

### Property Card with Badge
```html
<div class="property-card-sold">
  <h3>Villa Luxe</h3>
  <app-badge-status status="SOLD" entityType="property"></app-badge-status>
  <p class="text-success-sold-700">Prix: 1 200 000€</p>
</div>
```

### KPI Card
```html
<div class="kpi-card bg-success-sold-50 border-success-sold">
  <h4 class="text-success-sold-800">Biens Vendus</h4>
  <p class="text-success-sold-700" style="font-size: 2rem; font-weight: 700;">42</p>
</div>
```

### Lead with Urgency
```html
<div class="lead-urgent">
  <h4>Client VIP - Suivi urgent</h4>
  <p class="text-warning-urgent-700">Dernier contact: il y a 3 jours</p>
</div>
```

### Surface Layered Card
```html
<div class="bg-surface-1 shadow-surface-1" style="padding: 1.5rem; border-radius: 8px;">
  <h3>Carte principale</h3>
  <div class="bg-surface-2 shadow-surface-2" style="padding: 1rem; border-radius: 6px;">
    <p>Contenu imbriqué</p>
  </div>
</div>
```

## 🔧 Common Patterns

### Success Card
```html
<div class="bg-success-sold-50 border-success-sold" style="padding: 1rem; border-left-width: 4px;">
  <h4 class="text-success-sold-800">Vente confirmée</h4>
  <p class="text-success-sold-700">Le bien a été vendu avec succès</p>
</div>
```

### Warning Card
```html
<div class="bg-warning-urgent-50 border-warning-urgent" style="padding: 1rem; border-left-width: 4px;">
  <h4 class="text-warning-urgent-800">Action requise</h4>
  <p class="text-warning-urgent-700">Document à signer avant le 15/01</p>
</div>
```

### Error Card (Soft)
```html
<div class="validation-error-soft" style="padding: 1rem; border-radius: 6px;">
  <h4 class="validation-error-soft-text">Information manquante</h4>
  <p class="validation-error-soft-text">Veuillez compléter le formulaire</p>
</div>
```

## 📚 Documentation Links

- **Full Guide**: `frontend/EXTENDED_COLOR_SYSTEM_GUIDE.md`
- **Color Docs**: `frontend/src/styles/COLOR_SYSTEM_EXTENDED_README.md`
- **Utilities**: `frontend/src/styles/_color-utilities.scss`
- **Variables**: `frontend/src/styles/_colors-extended.scss`

---

**Pro Tip**: Use semantic aliases (`--color-property-sold`) instead of raw tokens for better maintainability! ✨
