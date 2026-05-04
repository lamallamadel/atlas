# Atlasia Design System — Angular

> Source de vérité visuelle : `frontend/design-system-source/tokens.css`  
> Audit complet : `frontend/docs/design-system-audit.md`

## Structure

```
src/app/design-system/
├── tokens/
│   ├── _ds-tokens.scss     # Tokens --ds-* (Marine, Copper, spacing, typo, radius, shadows)
│   ├── _ds-semantic.scss   # Aliases : --at-* → --ds-*, --color-* → --ds-*
│   └── index.scss          # Barrel @forward
├── primitives/             # Atomes sans logique métier
│   ├── ds-button/          # 5 variantes (marine, copper, ghost, danger, icon)
│   ├── ds-badge/           # Statuts CRM (new, qual, rdv, won, lost, draft, active, archived)
│   ├── ds-card/            # Surfaces élevées (flat, xs, sm, md)
│   ├── ds-avatar/          # Initiales ou photo (xs→xl)
│   ├── ds-filter-chip/     # Chips de filtre actif/inactif
│   ├── ds-skeleton/        # Loading states (text, heading, rect, circle, card)
│   ├── ds-empty-state/     # État vide avec CTA optionnel
│   └── ds-input/           # Champ texte avec label, prefix, erreur
├── patterns/               # Composites d'écran
│   ├── page-header/        # Eyebrow + titre display + slot actions
│   ├── kpi-card/           # KPI avec sparkline, trend, delta
│   ├── filter-bar/         # Chips filtres + recherche + filtre avancé
│   ├── entity-detail-layout/ # 3 colonnes : 360px / 1fr / 320px
│   ├── stage-stepper/      # Progression workflow (pills horizontales)
│   ├── timeline/           # Événements chronologiques (dot + line)
│   ├── messaging-thread/   # Conversation inbound/outbound
│   └── auth-hero/          # Split desktop : form + hero photo marine
├── platform/               # À créer — iOS & Android (Capacitor)
│   ├── ios/                # large-title.directive, glass-tabbar
│   └── android/            # m3-app-bar, m3-fab
└── icons/                  # À créer — SVG inline 16/20/24px
    └── ds-icon.component.ts
```

## Règles d'or

1. **Zéro hardcode couleur** — uniquement `var(--ds-*)` dans les SCSS DS.
2. **Wrapper Material, pas remplacer** — les primitives `ds-*` utilisent `MatRipple`, `MatDialog`, etc.
3. **Index barrel** — tout export public passe par `design-system/index.ts`.
4. **Pas de logique métier** dans les primitives ni les patterns.
5. **Storybook** — chaque primitive = 1 story par variante. Un écran sans story = écran non livré.

## Utilisation dans les templates

```typescript
// Import dans le composant (standalone)
import { DsButtonComponent } from '../../design-system/primitives/ds-button/ds-button.component';
import { PageHeaderComponent } from '../../design-system/patterns/page-header/page-header.component';
```

```html
<!-- Tokens automatiquement disponibles via styles.scss → tokens/index.scss -->
<ds-page-header eyebrow="Espace Pro" titleBefore="Mes" titleAccent="dossiers">
  <ng-container slot="actions">
    <ds-button variant="marine" size="md">Nouveau</ds-button>
  </ng-container>
</ds-page-header>
```

## Tokens clés

| Token | Valeur Light | Usage |
|---|---|---|
| `--ds-marine` | `#0d2c4a` | CTA primaire, sidebar active, liens |
| `--ds-primary` | `#b5622e` | Accent Copper, italic-accent, highlights |
| `--ds-bg` | `#f8f7f4` | Fond page warm off-white |
| `--ds-surface` | `#ffffff` | Cards, inputs, modals |
| `--ds-font-display` | Playfair Display | Titres, display, eyebrow display |
| `--ds-font-body` | Plus Jakarta Sans | Corps de texte, UI |

## Correspondance avec design-system-source/

| Pattern DS | Maquette de référence |
|---|---|
| `page-header` | Toutes les pages `*.html` |
| `kpi-card` | `dashboard.html` |
| `filter-bar` | `dossiers.html`, `annonces.html` |
| `entity-detail-layout` | `dossier-detail.html`, `annonce-detail.html` |
| `stage-stepper` | `dossier-detail.html` |
| `timeline` | `dossier-detail.html` |
| `messaging-thread` | `dossier-detail.html` |
| `auth-hero` | `auth.html`, `Atlasia Signup.html` |
