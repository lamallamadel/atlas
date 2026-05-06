# Atlasia Design System — Audit Phase 0

> **Figé le :** 2026-05-04  
> **Référence visuelle :** `frontend/design-system-source/` (copie de `frontend/design system/`)  
> **Décision unique adoptée :** les tokens de `design-system-source/tokens.css` (Marine #0d2c4a, Copper #b5622e, Warm bg #f8f7f4) sont la source de vérité. Les couches `--at-`* et `--color-*` deviennent des alias vers `--ds-*`. Suppression progressive en Phase 6.

---

## 1. Mapping des tokens

### Légende des colonnes


| Colonne      | Signification                                                            |
| ------------ | ------------------------------------------------------------------------ |
| `tokens.css` | Token dans `design-system-source/tokens.css` (source officielle)         |
| `--ds-*`     | Token Angular actuel dans `src/app/design-system/tokens/_ds-tokens.scss` |
| `--at-*`     | Token legacy dans `src/styles/_atlasia-tokens.scss`                      |
| `--color-*`  | Token très legacy dans `src/styles/variables.scss`                       |
| **Décision** | Alias à créer / Garder / Supprimer                                       |


### 1.1 Surfaces & Backgrounds


| `tokens.css`                  | `--ds-`*                 | `--at-*`                     | `--color-*`         | Décision                              |
| ----------------------------- | ------------------------ | ---------------------------- | ------------------- | ------------------------------------- |
| `--bg` `#f8f7f4`              | `--ds-bg` ✅              | `--at-color-bg`              | —                   | `--at-color-bg: var(--ds-bg)` → alias |
| `--surface` `#ffffff`         | `--ds-surface` ✅         | `--at-color-surface`         | `--color-neutral-0` | alias                                 |
| `--surface-2` `#faf9f7`       | `--ds-surface-2` ✅       | `--at-color-surface-2`       | —                   | alias                                 |
| `--surface-offset` `#f2f0eb`  | `--ds-surface-offset` ✅  | `--at-color-surface-offset`  | —                   | alias                                 |
| `--surface-dynamic` `#e8e5de` | `--ds-surface-dynamic` ✅ | `--at-color-surface-dynamic` | —                   | alias                                 |
| `--divider` `#e0ddd6`         | `--ds-divider` ✅         | `--at-color-divider`         | —                   | alias                                 |
| `--border` `#d4d0c8`          | `--ds-border` ✅          | `--at-color-border`          | —                   | alias                                 |


### 1.2 Texte


| `tokens.css`               | `--ds-*`              | `--at-*`                  | `--color-*`           | Décision |
| -------------------------- | --------------------- | ------------------------- | --------------------- | -------- |
| `--text` `#18160f`         | `--ds-text` ✅         | `--at-color-text`         | `--color-neutral-900` | alias    |
| `--text-muted` `#605c52`   | `--ds-text-muted` ✅   | `--at-color-text-muted`   | `--color-neutral-600` | alias    |
| `--text-faint` `#a8a49a`   | `--ds-text-faint` ✅   | `--at-color-text-faint`   | `--color-neutral-500` | alias    |
| `--text-inverse` `#ffffff` | `--ds-text-inverse` ✅ | `--at-color-text-inverse` | —                     | alias    |


### 1.3 Palette Marine (brand primaire)


| `tokens.css`               | `--ds-*`              | `--at-*`                      | `--color-*`                 | Décision                                                                                                        |
| -------------------------- | --------------------- | ----------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--marine` `#0d2c4a`       | `--ds-marine` ✅       | `--at-color-marine`           | `--color-primary-500` (≠ !) | ⚠️ `--color-primary-500` pointait vers `#2c5aa0` (bleu pur, pas marine) → **corriger alias** vers `--ds-marine` |
| `--marine-light` `#1a4472` | `--ds-marine-light` ✅ | `--at-color-marine-light`     | `--color-primary-600`       | alias                                                                                                           |
| `--marine-hover` `#07203a` | `--ds-marine-hover` ✅ | `--at-color-marine-hover`     | —                           | alias                                                                                                           |
| `--marine-hl` `#dce8f2`    | `--ds-marine-hl` ✅    | `--at-color-marine-highlight` | `--color-primary-50`        | alias                                                                                                           |


### 1.4 Palette Copper (accent)


| `tokens.css`                 | `--ds-`*                         | `--at-*`                       | `--color-*`                   | Décision                                                      |
| ---------------------------- | -------------------------------- | ------------------------------ | ----------------------------- | ------------------------------------------------------------- |
| `--primary` `#b5622e`        | `--ds-primary` / `--ds-copper` ✅ | `--at-color-primary`           | `--color-secondary-500` (≠ !) | ⚠️ `--color-secondary-500` était `#e67e22` — alias à corriger |
| `--primary-hover` `#944e22`  | `--ds-copper-hover` ✅            | `--at-color-primary-hover`     | `--color-secondary-400`       | alias                                                         |
| `--primary-active` `#6e3917` | —                                | `--at-color-primary-active`    | —                             | ajouter `--ds-copper-active`                                  |
| `--primary-hl` `#f2e0d5`     | `--ds-copper-hl` ✅               | `--at-color-primary-highlight` | `--color-secondary-50`        | alias                                                         |
| `--primary-subtle` `#faf3ee` | `--ds-copper-subtle` ✅           | `--at-color-primary-subtle`    | —                             | alias                                                         |


### 1.5 Couleurs sémantiques


| `tokens.css`             | `--ds-*`            | `--at-*`                       | Décision |
| ------------------------ | ------------------- | ------------------------------ | -------- |
| `--success` `#2e7d32`    | `--ds-success` ✅    | `--at-color-success`           | alias    |
| `--success-hl` `#e8f5e9` | `--ds-success-hl` ✅ | `--at-color-success-highlight` | alias    |
| `--error` `#c62828`      | `--ds-error` ✅      | `--at-color-error`             | alias    |
| `--error-hl` `#ffebee`   | `--ds-error-hl` ✅   | `--at-color-error-highlight`   | alias    |
| `--warning` `#e65100`    | `--ds-warning` ✅    | `--at-color-warning`           | alias    |
| `--warning-hl` `#fff3e0` | `--ds-warning-hl` ✅ | `--at-color-warning-highlight` | alias    |


### 1.6 Ombres


| `tokens.css`                       | `--ds-*`           | `--at-*`         | Note                                                                 |
| ---------------------------------- | ------------------ | ---------------- | -------------------------------------------------------------------- |
| `--shadow-xs` `rgba(24,22,15,.04)` | `--ds-shadow-xs` ✅ | `--at-shadow-xs` | `--at-*` utilise `oklch()` — valeur différente mais effet équivalent |
| `--shadow-sm` `rgba(24,22,15,.06)` | `--ds-shadow-sm` ✅ | `--at-shadow-sm` | idem                                                                 |
| `--shadow-md` `rgba(24,22,15,.08)` | `--ds-shadow-md` ✅ | `--at-shadow-md` | idem                                                                 |
| `--shadow-lg` `rgba(24,22,15,.12)` | `--ds-shadow-lg` ✅ | `--at-shadow-lg` | idem                                                                 |


### 1.7 Radius


| `tokens.css`        | `--ds-*`                      | `--at-*`                      |
| ------------------- | ----------------------------- | ----------------------------- |
| `--r-sm` `6px`      | `--ds-radius-sm` `6px` ✅      | `--at-radius-sm` `6px` ✅      |
| `--r-md` `10px`     | `--ds-radius-md` `10px` ✅     | `--at-radius-md` `8px` ⚠️     |
| `--r-lg` `14px`     | `--ds-radius-lg` `14px` ✅     | `--at-radius-lg` `12px` ⚠️    |
| `--r-xl` `18px`     | `--ds-radius-xl` `18px` ✅     | `--at-radius-xl` `16px` ⚠️    |
| `--r-2xl` `24px`    | `--ds-radius-2xl` `24px` ✅    | `--at-radius-2xl` `24px` ✅    |
| `--r-pill` `9999px` | `--ds-radius-pill` `9999px` ✅ | `--at-radius-full` `9999px` ✅ |


> **Divergence radius :** `--at-`* utilise des valeurs légèrement inférieures (8/12/16 vs 10/14/18 dans `tokens.css`). Décision : aligner sur `tokens.css` via `--ds-*`.

### 1.8 Typographie


| Concept      | `tokens.css`                                    | `--ds-*`                | `--at-*`                                   |
| ------------ | ----------------------------------------------- | ----------------------- | ------------------------------------------ |
| Font display | `'Playfair Display', Georgia, serif`            | `--ds-font-display` ✅   | `--at-font-display` ✅                      |
| Font body    | `'Plus Jakarta Sans', -apple-system, system-ui` | `--ds-font-body` ✅      | `--at-font-body` ✅                         |
| Échelle typo | aucune (`tokens.css` n'a pas de scale)          | `--ds-text-xs/sm/…/3xl` | `--at-text-xs/sm/…/3xl` (clamp responsive) |


### 1.9 Spacing


| `--ds-*`              | `--at-*`                | `--spacing-*` (variables.scss) |
| --------------------- | ----------------------- | ------------------------------ |
| `--ds-space-1` `4px`  | `--at-space-1` `4px` ✅  | `--spacing-1` `4px` ✅          |
| `--ds-space-2` `8px`  | `--at-space-2` `8px` ✅  | `--spacing-2` `8px` ✅          |
| `--ds-space-4` `16px` | `--at-space-4` `16px` ✅ | `--spacing-4` `16px` ✅         |
| `--ds-space-6` `24px` | `--at-space-6` `24px` ✅ | `--spacing-6` `24px` ✅         |
| `--ds-space-8` `32px` | `--at-space-8` `32px` ✅ | `--spacing-8` `32px` ✅         |


> Spacing est cohérent entre les 3 systèmes. Les `--spacing-*` deviennent alias de `--ds-space-*`.

---

## 2. Audit des fichiers SCSS `_atlasia-*`

11 fichiers, ~5 233 lignes, ~147 KB de CSS compilé.

### Fichiers de tokens (à conserver et fusionner)


| Fichier                | Taille | Rôle                                                                              | Verdict                                                                                                 |
| ---------------------- | ------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `_atlasia-tokens.scss` | ~166L  | Déclare tous les `--at-color-*`, `--at-space-*`, `--at-shadow-*`, `--at-radius-*` | **Conserver** jusqu'à Phase 6. En Phase 6 : supprimer et remplacer par aliases dans `_ds-semantic.scss` |


### Fichiers de bridge (à absorber progressivement)


| Fichier                   | Taille      | Rôle                                                                                                                                                   | Verdict                                                                                                        |
| ------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `_atlasia-pro-shell.scss` | 660L / 18KB | Identity Bridge principal : écrase les styles Material/Angular pour aligner sur Atlasia. Crée le shell (`app-layout`, sidebar, topbar, `pro-content`). | **Conserver** jusqu'à Phase 5 terminée. À absorber dans le composant `app-layout` refondé.                     |
| `_atlasia-shared.scss`    | 679L / 19KB | Styles partagés Portail B2C + Vitrine B2B (cartes annonce, hero public, search bar publique).                                                          | **Conserver**. Concerne les pages publiques, pas le Pro Space. Ne pas supprimer avant Phase 5 pages publiques. |


### Fichiers de "fix" post-rendu (à résorber par la migration DS)


| Fichier                             | Taille      | Rôle                                                                                                                                          | Verdict Phase 5                                                                                                                                       |
| ----------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_atlasia-page-patterns.scss`       | 595L / 13KB | En-têtes de page, filter bars, tables, sections cards — les patterns généraux.                                                                | **Supprimer** après migration dashboard + dossiers + annonces (Phase 5 écrans 1–3). Déjà partiellement couvert par `ds-page-header`, `ds-filter-bar`. |
| `_atlasia-core-flows.scss`          | 488L / 12KB | UX polish dashboard, dossiers, dossier-detail, annonces. Row hover, quick actions, badges inline.                                             | **Supprimer** après migration des 4 premiers écrans.                                                                                                  |
| `_atlasia-semantic-pages.scss`      | 374L / 10KB | Meaning visuel des pages : command center (dashboard), CRM workspace (dossiers), case file (dossier-detail). Titres display + accents Copper. | **Supprimer** avec `_atlasia-core-flows.scss` (même scope).                                                                                           |
| `_atlasia-density-correction.scss`  | 424L / 9KB  | Réduit les marges/paddings générés par les SCSS précédents (hacks `!important`).                                                              | ⚠️ **Fragile.** À auditer ligne par ligne avant Phase 6. Beaucoup de `!important` qui masquent des bugs de spacing. Supprimer en dernier.             |
| `_atlasia-pro-navigation.scss`      | 301L / 7KB  | Sidebar nav, active state, dot indicator, collapse behavior.                                                                                  | **Supprimer** après refonte du composant `app-layout` / `app-sidebar`.                                                                                |
| `_atlasia-special-screens-fix.scss` | 555L / 16KB | Correctifs observability, tâches, calendrier, kanban, advanced filters dialog.                                                                | **Supprimer** après migration Phases 5 écrans 4–9 (calendar, tasks, reports, observability, workflow-admin).                                          |
| `_atlasia-table-dialog-repair.scss` | 503L / 14KB | Tableau dossiers : overflow horizontal, colonne actions sticky, advanced filters dialog.                                                      | **Supprimer** après migration dossiers liste + dossier-detail.                                                                                        |
| `_atlasia-dossiers-scroll-fix.scss` | 136L / 4KB  | Scroll horizontal dossiers (chargé en dernier pour surpasser les autres).                                                                     | **Supprimer immédiatement** si le tableau dossiers est entièrement remplacé par le nouveau template DS. Le nouveau template n'a pas ce problème.      |
| `_atlasia-public-portal.scss`       | 518L / 14KB | Pages publiques : vitrine, portail client, annonce publique, recherche.                                                                       | **Conserver**. Hors scope Pro Space.                                                                                                                  |


### Ordre de suppression recommandé

```
Phase 5, écrans 1-3 terminés → supprimer _atlasia-page-patterns, _atlasia-core-flows, _atlasia-semantic-pages, _atlasia-dossiers-scroll-fix
Phase 5, écrans 4-9 terminés → supprimer _atlasia-special-screens-fix, _atlasia-table-dialog-repair, _atlasia-pro-navigation
Phase 5, app-layout refondé  → supprimer _atlasia-pro-shell
Phase 6                      → supprimer _atlasia-density-correction (avec tests visuels), _atlasia-tokens (remplacé par aliases)
Hors scope Pro             → _atlasia-shared, _atlasia-public-portal conservés (pages publiques)
```

---

## 3. Inventaire des composants `src/app/components/`

**Total : 127 composants**

### 3.1 Primitives (atomes sans logique métier) → à migrer vers `design-system/primitives/`


| Composant                           | Priorité migration | Notes                                          |
| ----------------------------------- | ------------------ | ---------------------------------------------- |
| `badge.component.ts`                | Haute              | Remplacer par `ds-badge`                       |
| `badge-status.component.ts`         | Haute              | Sous-type de badge — fusionner avec `ds-badge` |
| `empty-state.component.ts`          | Haute              | Remplacer par `ds-empty-state`                 |
| `animated-empty-state.component.ts` | Moyenne            | Variante animée de ds-empty-state              |
| `loading-skeleton.component.ts`     | Haute              | Remplacer par `ds-skeleton`                    |
| `skeleton-loader.component.ts`      | Haute              | Doublon de loading-skeleton — supprimer un     |
| `spinner.component.ts`              | Moyenne            | → variante de `ds-skeleton` ou icône           |
| `custom-spinner.component.ts`       | Basse              | Doublon — supprimer                            |
| `progress-bar.component.ts`         | Basse              | Conserver si utilisé hors DS                   |
| `loading-button.component.ts`       | Haute              | Remplacer par `ds-button[loading]`             |
| `logo.component.ts`                 | Basse              | Garder tel quel                                |
| `logo-inline.component.ts`          | Basse              | Garder tel quel                                |
| `dashboard-widget-base.ts`           | Faible             | Base lifecycle ; surface = `ds-card` + `dashboard-widget-shared.scss` |
| `success-animation.component.ts`    | Basse              | Garder                                         |
| `lottie-animation.component.ts`     | Basse              | Garder                                         |


### 3.2 Patterns (composites UI sans logique domaine) → à migrer vers `design-system/patterns/` ou refondre


| Composant                               | Priorité migration | Notes                                             |
| --------------------------------------- | ------------------ | ------------------------------------------------- |
| `activity-timeline.component.ts`        | Haute              | → `ds-timeline` (pattern DS existant)             |
| `kanban-board.component.ts`             | Haute              | → `ds-kanban-column` (pattern DS à créer Phase 2) |
| `generic-table.component.ts`            | Haute              | → `ds-table` (primitive DS à créer Phase 1)       |
| `advanced-filters.component.ts`         | Haute              | Absorber dans `ds-filter-bar` étendu              |
| `advanced-filters-dialog.component.ts`  | Haute              | Wrapper de `ds-filter-bar` en dialog              |
| `global-search-bar.component.ts`        | Haute              | Intégrer à `ds-filter-bar`                        |
| `command-palette.component.ts`          | Moyenne            | Conserver en l'état (fonctionnalité spécifique)   |
| `datetime-picker.component.ts`          | Moyenne            | Wrapper Material DatePicker avec DS tokens        |
| `notification-center.component.ts`      | Moyenne            | Pattern complexe — conserver en l'état            |
| `notification-toast.component.ts`       | Haute              | → wrapper avec DS tokens                          |
| `document-list.component.ts`            | Moyenne            | → pattern `ds-document-list` à créer Phase 5      |
| `document-upload.component.ts`          | Moyenne            | Conserver                                         |
| `document-preview-dialog.component.ts`  | Basse              | Conserver                                         |
| `photo-gallery.component.ts`            | Moyenne            | Conserver                                         |
| `mobile-dossier-card.component.ts`      | Haute              | → pattern mobile dans `design-system/platform/`   |
| `mobile-filter-sheet.component.ts`      | Haute              | → `design-system/platform/`                       |
| `mobile-action-sheet.component.ts`      | Haute              | → `design-system/platform/`                       |
| `mobile-bottom-navigation.component.ts` | Haute              | → `design-system/platform/ios/` ou `android/`     |
| `calendar-view.component.ts`            | Haute              | → `ds-week-grid` (pattern à créer Phase 2)        |
| `calendar-list-view.component.ts`       | Moyenne            | Variante liste du calendrier                      |
| `task-list.component.ts`                | Haute              | → pattern tasks Phase 5                           |
| `task-card.component.ts`                | Haute              | → primitive `ds-task-card`                        |
| `kpi-widget.component.ts`               | Haute              | → `ds-kpi-card` (pattern DS existant)             |
| `quick-actions.component.ts`            | Moyenne            | Utiliser dans dashboard refondé                   |
| `recent-dossiers-widget.component.ts`   | Haute              | Absorbé dans dashboard DS refondé                 |
| `swipeable-card.component.ts`           | Basse              | Conserver (gesture)                               |
| `virtual-scroll-list.component.ts`      | Basse              | Conserver (performance)                           |
| `form-progress-indicator.component.ts`  | Basse              | Conserver                                         |
| `workflow-stepper.component.ts`         | Haute              | → `ds-stage-stepper` (pattern DS existant)        |
| `template-editor.component.ts`          | Basse              | Conserver                                         |
| `template-library.component.ts`         | Basse              | Conserver                                         |
| `template-selection-sheet.component.ts` | Basse              | Conserver                                         |
| `keyboard-shortcuts.component.ts`       | Basse              | Conserver                                         |
| `waterfall-chart.component.ts`          | Basse              | Conserver                                         |
| `whatsapp-message-input.component.ts`   | Haute              | → sous-composant de `ds-messaging-thread`         |
| `whatsapp-messaging-ui.component.ts`    | Haute              | → `ds-messaging-thread`                           |
| `whatsapp-thread.component.ts`          | Haute              | → `ds-messaging-thread`                           |
| `comment-thread.component.ts`           | Moyenne            | → pattern `ds-comment-thread`                     |
| `comment-search.component.ts`           | Basse              | Conserver                                         |


### 3.3 Domaine (logique métier spécifique) → garder dans `src/app/components/`, refondre visuellement avec DS


| Composant                                    | Écran cible         | Notes                                    |
| -------------------------------------------- | ------------------- | ---------------------------------------- |
| `analytics-dashboard.component.ts`           | /pro/reports        | Utiliser `ds-kpi-card` + `ds-filter-bar` |
| `reports-dashboard.component.ts`             | /pro/reports        | Idem                                     |
| `scheduled-reports.component.ts`             | /pro/reports        |                                          |
| `executive-dashboard.component.ts`           | /pro/dashboard      | Absorber dans dashboard refondé          |
| `customizable-dashboard.component.ts`        | /pro/dashboard      | Absorber                                 |
| `dashboard-mobile-view.component.ts`         | /pro/dashboard      | Mobile — absorber                        |
| `observability-dashboard.component.ts`       | /pro/observability  |                                          |
| `api-status-indicator.component.ts`          | /pro/observability  |                                          |
| `workflow-builder.component.ts`              | /pro/workflow-admin |                                          |
| `workflow-simulation.component.ts`           | /pro/workflow-admin |                                          |
| `workflow-template-library.component.ts`     | /pro/workflow-admin |                                          |
| `dossier-timeline-view.component.ts`         | /pro/dossiers/:id   | → `ds-timeline`                          |
| `appointment-form-dialog.component.ts`       | /pro/dossiers/:id   | Conserver                                |
| `appointment-request.component.ts`           | Portail client      | Conserver                                |
| `approval-request.component.ts`              | /pro/dossiers/:id   | Conserver                                |
| `partie-prenante-form-dialog.component.ts`   | /pro/dossiers/:id   | Conserver                                |
| `note-form-dialog.component.ts`              | /pro/dossiers/:id   | Conserver                                |
| `message-form-dialog.component.ts`           | /pro/dossiers/:id   | Conserver                                |
| `whatsapp-messaging-container.component.ts`  | /pro/dossiers/:id   | Conserver, habiller avec DS              |
| `secure-message-thread.component.ts`         | Portail client      | Conserver                                |
| `lead-import-dialog.component.ts`            | /pro/dossiers       | Conserver                                |
| `lead-export-dialog.component.ts`            | /pro/dossiers       | Conserver                                |
| `export-progress-dialog.component.ts`        | /pro/dossiers       | Conserver                                |
| `bulk-operation-dialog.component.ts`         | /pro/dossiers       | Conserver                                |
| `lead-priority-queue.component.ts`           | /pro/dossiers       | Conserver                                |
| `lead-scoring-page.component.ts`             | /pro/dossiers       | Conserver                                |
| `lead-scoring-config-dialog.component.ts`    | /pro/dossiers       | Conserver                                |
| `consent-management.component.ts`            | /pro/dossiers/:id   | Conserver                                |
| `contract-template.component.ts`             | /pro/dossiers/:id   | Conserver                                |
| `document-audit-trail.component.ts`          | /pro/dossiers/:id   | Conserver                                |
| `client-document-library.component.ts`       | Portail client      | Conserver                                |
| `client-satisfaction-survey.component.ts`    | Portail client      | Conserver                                |
| `customer-portal-auth.component.ts`          | Portail client      | Conserver                                |
| `customer-portal-dashboard.component.ts`     | Portail client      | Conserver                                |
| `property-recommendation.component.ts`       | Portail client      | Conserver                                |
| `signature-request-dialog.component.ts`      | /pro/dossiers/:id   | Conserver                                |
| `signature-status-tracker.component.ts`      | /pro/dossiers/:id   | Conserver                                |
| `ai-agent-panel.component.ts`                | Transversal         | Conserver                                |
| `collaboration-*.component.ts` (x4)          | Transversal         | Conserver                                |
| `notification-preferences-form.component.ts` | Settings            | Conserver                                |
| `settings-page.component.ts`                 | /pro/settings       | Habiller avec DS                         |
| `locale-switcher.component.ts`               | Settings            | Conserver                                |
| `offline-dossiers-viewer.component.ts`       | PWA offline         | Conserver                                |
| `offline-indicator.component.ts`             | PWA                 | Conserver                                |
| `pwa-install-prompt.component.ts`            | PWA                 | Conserver                                |
| `report-builder.component.ts`                | /pro/reports        | Conserver                                |
| `custom-query-builder.component.ts`          | /pro/reports        | Conserver                                |
| `voip-config-dialog.component.ts`            | Settings            | Conserver                                |
| `my-tasks-widget.component.ts`               | /pro/dashboard      | Absorbé dans dashboard DS                |
| `app-shell.component.ts`                     | Shell global        | Absorber dans app-layout DS              |
| `tour-progress.component.ts`                 | Onboarding          | Conserver (Shepherd.js)                  |


### 3.4 Showcase / Demo → supprimer en Phase 6


| Composant                                    | Action                             |
| -------------------------------------------- | ---------------------------------- |
| `animations-demo.component.ts`               | Supprimer                          |
| `badge-showcase.component.ts`                | Supprimer (remplacé par Storybook) |
| `badge-status-showcase.component.ts`         | Supprimer                          |
| `button-examples.component.ts`               | Supprimer (remplacé par Storybook) |
| `enhanced-form-example.component.ts`         | Supprimer                          |
| `lottie-animations-demo.component.ts`        | Supprimer                          |
| `notification-demo.component.ts`             | Supprimer                          |
| `whatsapp-messaging-ui-example.component.ts` | Supprimer                          |
| `chart/chart-demo.component.ts`              | Supprimer                          |


### Synthèse


| Catégorie                      | Nombre  | Action                                       |
| ------------------------------ | ------- | -------------------------------------------- |
| Primitives à migrer vers DS    | 15      | Remplacer par `ds-`* progressivement         |
| Patterns à migrer vers DS      | 38      | Refondre ou absorber dans patterns DS        |
| Domaine à garder + habiller DS | 52      | Conserver logique, appliquer DS visuellement |
| Showcase à supprimer           | 9       | Supprimer en Phase 6                         |
| Autres (specs, utils)          | 13      | Cas par cas                                  |
| **Total**                      | **127** |                                              |


---

## 4. Décision officielle — Source unique de tokens

```
SOURCE UNIQUE : design-system-source/tokens.css
     ↓ import
_ds-tokens.scss  (préfixe --ds-*)   ← SOURCE EFFECTIVE ANGULAR
     ↓ aliases
_ds-semantic.scss                   ← bridge --at-* → --ds-*
                                    ← bridge --color-* → --ds-*
                                    ← bridge --spacing-* → --ds-*
                                    ← overrides Material MDC → --ds-*
     ↓ chargé en dernier
_atlasia-pro-shell.scss             ← écrase Material (temporaire, Phase 5)
_atlasia-*-fix.scss                 ← correctifs (temporaire, Phase 5-6)
```

### Règles fermes (à appliquer dès maintenant)

1. **Zéro hardcode** de couleur hexadécimale dans tout `src/app/**/*.scss` ou `*.ts`. Uniquement `var(--ds-*)`.
2. **Zéro nouveau fichier `_atlasia-*`** après cette phase.
3. **Zéro nouveau `--color-*` ou `--at-*`** dans du code nouveau. Les nouveaux tokens vont dans `_ds-tokens.scss`.
4. **Chaque nouveau composant DS** déclare son SCSS avec `@use '../../../tokens/index' as `* et n'utilise que `--ds-*`.
5. Les `--color-*` legacy (variables.scss) sont **read-only** — on ne crée plus de variables dans ce fichier.

---

## 5. Alerte : divergences critiques à corriger en Phase 1


| N°  | Divergence                                                       | Impact                                                                    | Correction                                                        |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| A   | `--color-primary-500: #2c5aa0` (bleu pur) ≠ Marine `#0d2c4a`     | Tout code utilisant `--color-primary-500` pour la couleur brand est faux  | `--color-primary-500: var(--ds-marine)` dans `_ds-semantic.scss`  |
| B   | `--color-secondary-500: #e67e22` (orange vif) ≠ Copper `#b5622e` | Même problème pour le Copper                                              | `--color-secondary-500: var(--ds-primary)`                        |
| C   | Radius `--at-radius-md: 8px` ≠ `tokens.css --r-md: 10px`         | Composants avec `--at-radius-md` paraissent plus anguleux que la maquette | Aligner `--at-radius-md → --ds-radius-md` (10px)                  |
| D   | `_atlasia-density-correction.scss` contient 40+ `!important`     | Impossible de styliser proprement avec DS sans `!important` en retour     | Supprimer en priorité lors de Phase 6 après audit ligne par ligne |


---

*Document généré par audit Phase 0 — ne pas modifier manuellement, régénérer si le code évolue.*