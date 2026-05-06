# Plan opérationnel — Design System Atlasia (branchement quasi total)

> **Références :** [`design-system-audit.md`](design-system-audit.md) · Barrel DS : [`src/app/design-system/index.ts`](../src/app/design-system/index.ts)  
> **Règle PR / agent :** [`.cursor/rules/design-system-migration.mdc`](../../.cursor/rules/design-system-migration.mdc)  
> **Dernière mise à jour du document :** 2026-05-06

Plan pour compléter le design system et viser un **branchement quasi total** : tout le **Pro Space** et les **patterns transverses** passent par **`ds-*`** + **`--ds-*`**, sans dépendre des couches **`_atlasia-*`** de contournement.

---

## Principes de fin de parcours

1. **Une seule source de tokens** : `--ds-*` dans le code applicatif ; `--at-*` / `--color-*` uniquement comme **alias** dans `_ds-semantic.scss` jusqu’à disparition des usages.
2. **Zéro hex** dans `src/app/**/*.scss` (hors fichiers de tokens sources) ; remplacer par `var(--ds-*)`.
3. **Pas de nouveau `_atlasia-*`** ; chaque besoin = composant DS ou token.
4. **Ordre de merge** : primitives → patterns réutilisables → écrans pilotes → écrans secondaires → **suppression des patches globaux en dernier** (surtout `_atlasia-density-correction.scss`).

---

## Dépendances essentielles (ordre logique)

```
Phase 1 (tokens + garde-fous)
  → Phase 2 (primitives)
  → Phase 3 (patterns)
  → Phase 4 (pages)
  → Phase 5 (suppression _atlasia-*)
  → Phase 6 (storybook + cleanup)
```

---

## Définition de « branchement total » (critères de done)

| Critère | Cible |
|--------|--------|
| **Pages Pro** | En-têtes, cartes, boutons, badges, empty/skeleton, filtres principaux passent par **`ds-*`** ou Material uniquement wrappé avec **`--ds-*`**. |
| **SCSS applicatif** | Plus de hex ; legacy **`--at-*` / `--color-*`** = **0 usage direct** (ou fichier liste d’exceptions temporaires). |
| **Global** | Plus de **`_atlasia-*-fix`** pour le Pro Space ; `styles.scss` charge surtout **tokens DS** + thème Material mappé. |

---

## Phase 0 — Cadrage et mesure (court)

| # | Tâche | État |
|---|--------|------|
| **0.1** | Figurer la liste canonique des primitives/patterns DS déjà livrés (`design-system/index.ts` + README) et les écarts vs l’audit (ex. kanban-column / week-grid déjà présents — mettre l’audit à jour si besoin). | [x] |
| **0.2** | Définir **3 écrans pilotes** : **dashboard**, **liste dossiers**, **détail dossier** (ou annonces équivalent) — ceux qui libèrent le plus de `_atlasia-page-patterns` / core-flows. | [x] |
| **0.3** | Ajouter une **règle de PR** : nouveau composant = tokens `--ds-*` + réutilisation d’un `ds-*` si un équivalent existe. | [x] |

### Barrel DS (réf. 0.1)

**Primitives :** `DsButton`, `DsBadge`, `DsCard`, `DsAvatar`, `DsInput`, `DsFilterChip`, `DsEmptyState`, `DsSkeleton`, `DsTabs`, `DsTable`, `DsIcon`  
**Patterns :** `PageHeader`, `KpiCard`, `FilterBar`, `EntityDetailLayout`, `StageStepper`, `Timeline`, `MessagingThread`, `AuthHero`, `KanbanColumn`, `WeekGrid`  
**Platform :** `LargeTitleDirective`, `GlassTabbar`, `M3AppBar`, `M3Fab`

### Écrans pilotes (0.2)

1. **Dashboard** (`/pro/dashboard`)
2. **Liste dossiers** (`/pro/dossiers`)
3. **Détail dossier** (`/pro/dossiers/:id`)

---

## Phase 1 — Fermeture des divergences tokens (bloquant visuel)

| # | Tâche | État |
|---|--------|------|
| **1.1** | Vérifier / finaliser les alias critiques dans `_ds-semantic.scss` : `--color-primary-500` → `var(--ds-marine)`, `--color-secondary-500` → `var(--ds-primary)` (et voisins), alignement radius `--at-*` → `--ds-*`. | [x] |
| **1.2** | Passer un grep sur `src/app` : `#([0-9a-f]{3,8})` et `--color-` / `--at-` ; créer un **backlog fichier par fichier** (priorité : `components/*.scss` les plus gros). | [x] **Hex** : scripts `check-no-hex-in-app-*.cjs` ; **variables** : `var(--at-*\|--color-*)` remplacés par `var(--ds-*)` dans l’applicatif — garde-fou `npm run lint:ds-legacy-vars` (historique : [`design-system-backlog-phase-1.2.md`](design-system-backlog-phase-1.2.md)) |
| **1.3** | Interdire les **nouveaux hex** dans le lint (ESLint/stylelint ou script CI) — au minimum sur `src/app/components` et `src/app/pages`. | [x] script `check-no-hex-in-app-scss.cjs` + `npm run lint:ds-scss` (`--fail` pour CI stricte quand backlog vide) |

---

## Phase 2 — Primitives : un seul chemin UI

| # | Tâche | État |
|---|--------|------|
| **2.1** | Migrer badges : badge + badge-status → **ds-badge** (variants / mapping statuts CRM). | [x] |
| **2.2** | Migrer états vides / chargement : empty-state, animated-empty-state → **ds-empty-state** ; loading-skeleton, skeleton-loader, spinners → **ds-skeleton** / icône DS. | [x] |
| **2.3** | Migrer actions : loading-button → **ds-button** (état loading) ; évaluer fusion custom-spinner / spinner. | [x] loading-button supprimé ; custom-spinner supprimé si non utilisé |
| **2.4** | Migrer surfaces : card-widget-base → **ds-card**. | [x] Widgets dashboard sur **`ds-card`** ; base renommée **`DashboardWidgetBase`** (sans surface HTML dédiée) |
| **2.5** | Supprimer ou isoler les doublons une fois les imports remplacés (éviter deux APIs parallèles). | [x] **`DashboardWidgetConfig`** canonique = [`dashboard-layout.model.ts`](../src/app/models/dashboard-layout.model.ts) (réexport service pour compat) ; chrome = **`dashboard-widget-shared.scss`** |

### Phase 2 étendue — tout le **Pro Space** (`path: 'pro'` dans [`app.routes.ts`](../src/app/app.routes.ts))

Extension **implicite** du chantier primitives : au-delà des chantiers 2.1–2.5 déjà bouclés, le **Pro Space** doit converger vers **`ds-*`** comme surface / états par défaut, tout en gardant Material là où il n’y a pas d’équivalent DS (tables complexes, datepickers, etc.).

| # | Tâche | État |
|---|--------|------|
| **2.6** | **Surfaces** : enveloppes **`mat-card` / `MatCard*`** → **`ds-card`** (ou pattern équivalent documenté) pour les composants Pro ci‑dessous. | [x] **Applicatif** + **Storybook** [`Cards.stories.ts`](../src/stories/Cards.stories.ts) (`DsCardWithHeaderAndActions`, `DsCardSelected`) : **0** `mat-card` / `MatCard*` dans `src/stories` ; restes = **exemples dans `*.md`**, **styles legacy** `print.scss` (`mat-card` + `.ds-card`). |
| **2.7** | **Chargement** : **`MatProgressSpinner`** utilisé comme placeholder pleine zone → **`DsSkeleton`** / composants déjà branchés DS où pertinent. | [x] Migration terminée dans le code applicatif (`src/app`) : **0** `mat-spinner` restant en templates `.html` / inline `.ts`; placeholders convertis vers `ds-skeleton` (y compris cas inline 16/20/24). Nettoyage tests : imports `MatProgressSpinnerModule` retirés des `*.spec.ts` concernés ; reste uniquement `testing/material-testing.module.ts` (module utilitaire global de tests). |
| **2.8** | **Hors périmètre Pro Space par défaut** : **`PublicLayout`** (portail, vitrine), pages login/signup/access — même recommandation `ds-*`, sans bloquer la définition de « Phase 2 Pro étendue ». | info |
| **2.9** | **Mesure dette cartes** (racine `frontend/`) : `rg "MatCard|mat-card" src/app --glob "*.ts" --glob "!*.spec.ts"` ; objectif **zéro** dans les fichiers du backlog hors exceptions acceptées (documentées en PR). | récurrent |

**Backlog surfaces (`mat-card`) — traité (2026-05-06)**

Les fichiers listés précédemment ont été migrés vers **`ds-card`** + classes de structure ; les sélecteurs CSS résiduels **`mat-card-*`** ont été alignés (ex. `tour-progress`, `workflow-template-library`).  
**Contrôle récurrent :** commande **2.9** ; hors périmètre volontaire : exemples historiques dans certains `*.md`, `print.scss` conserve `mat-card` pour d’éventuelles pages legacy imprimées.

---

## Phase 3 — Patterns transverses (gros levier de merge)

| # | Tâche | État |
|---|--------|------|
| **3.1** | **Tables** : generic-table → s’appuyer sur **ds-table** + tokens ; retirer les surcharges locales. | [ ] — styles/tokens DS avancés ; composition ds-table à finaliser |
| **3.2** | **Filtres / recherche** : advanced-filters, dialog associé, global-search-bar → **filter-bar** DS (slots / extensions documentés). | [ ] |
| **3.3** | **Timeline / workflow** : activity-timeline, dossier-timeline-view, workflow-stepper → **timeline** + **stage-stepper** DS. | [ ] |
| **3.4** | **KPI / dashboard** : kpi-widget, widgets récents → **kpi-card** + layout dashboard. | [x] partiel — widgets déjà branchés ds-card / tokens |
| **3.5** | **Calendrier / tâches** : calendar-view, task-list, task-card → **week-grid** + patterns tâches (cartes cohérentes ds-card). | [ ] partiel |
| **3.6** | **Kanban** : kanban-board → colonnes **kanban-column** DS + tokens. | [ ] |
| **3.7** | **Messagerie** : whatsapp-*, comment-thread → **messaging-thread** / pattern commentaires unique. | [ ] |
| **3.8** | **Mobile** : mobile-* (sheets, actions, navigation) → `design-system/platform/` (iOS / patterns plateforme). | [ ] partiel — nombreux `mobile-*` déjà en `--ds-*` |
| **3.9** | **Notifications** : notification-toast + centre → habillage `--ds-*` et composants surface DS. | [ ] |

---

## Phase 4 — Pages / domaine : branchement écran par écran

| # | Tâche | État |
|---|--------|------|
| **4.1** | **Pilote 1 — Dashboard** : page-header, filter-bar, kpi-card, ds-card partout ; retirer les classes `_atlasia-semantic-pages` devenues inutiles. | [ ] |
| **4.2** | **Pilote 2 — Liste dossiers** : tableau DS, filtres DS, empty state DS ; supprimer `_atlasia-dossiers-scroll-fix` / table-dialog-repair quand le layout est stable. | [ ] |
| **4.3** | **Pilote 3 — Détail dossier** : entity-detail-layout, timeline DS, messagerie DS. | [ ] |
| **4.4** | **Enchaîner** : annonces, tâches, calendrier, reports, observability, workflow-admin, settings (même recette : en-tête + surfaces + tables/filtres DS). | [ ] |
| **4.5** | **Shell** : app-shell / layout → absorber ce qui reste de `_atlasia-pro-shell` et `_atlasia-pro-navigation` dans des composants de layout explicites + tokens. | [ ] |

---

## Phase 5 — Nettoyage des couches globales (merge « total »)

| # | Tâche | État |
|---|--------|------|
| **5.1** | Quand les **3 pilotes** sont verts : supprimer `_atlasia-page-patterns`, `_atlasia-core-flows`, `_atlasia-semantic-pages`, `_atlasia-dossiers-scroll-fix` (ordre recommandé dans l’audit). | [ ] |
| **5.2** | Après écrans 4–9 : supprimer `_atlasia-special-screens-fix`, `_atlasia-table-dialog-repair`, `_atlasia-pro-navigation`. | [ ] |
| **5.3** | Refonte layout terminée : réduire puis supprimer `_atlasia-pro-shell`. | [ ] |
| **5.4** | **Dernier** : auditer ligne par ligne `_atlasia-density-correction` (beaucoup de `!important`) puis le supprimer une fois les espacements corrigés à la source. | [ ] |
| **5.5** | Conserver hors scope Pro si besoin : `_atlasia-shared`, `_atlasia-public-portal` jusqu’à migration du portail public. | [ ] |

---

## Phase 6 — Qualité, docs, fin de dette

| # | Tâche | État |
|---|--------|------|
| **6.1** | Supprimer les showcases / demos listés dans l’audit (remplacés par Storybook si c’est la cible). | [ ] |
| **6.2** | **Storybook** : une story par variante des primitives ; stories pour patterns critiques (filter-bar, table, messaging). | [~] **Recipes DS** : Empty States, Loading States, Badges & chips ; **Buttons** (`Components-Buttons.stories.ts` → `Design System/Recipes/Buttons`) ; **Dialogs** (`Components-Dialogs.stories.ts`) ; **Forms** (`Components-Forms.stories.ts`, Material conservé pour select/checkbox/radio/datepicker) ; **Illustrations** ; **Guidelines** (Do and Don’t) ; **Cards** (`Cards.stories.ts` migré vers `ds-button` + `ds-icon`) ; **pattern FilterBar** (`DS-Patterns-FilterBar.stories.ts`) ; **patterns critiques** **Table** (`DS-Table.stories.ts` → `Design System/Patterns/Table`) et **Messaging** (`DS-Patterns-Messaging.stories.ts`). **Suite** : compléter/aligner `generic-table` et cas messaging avancés. `npm run build-storybook` ✅ (2026-05-06). |
| **6.3** | Mettre à jour **design-system-audit.md** (ou le régénérer) pour refléter l’état réel — éviter que le plan et le code divergent. | [ ] |
| **6.4** | Tests visuels légers (Chromatic / Playwright screenshots sur 3–5 pages) pour éviter les régressions lors de la suppression des `_atlasia-*`. | [ ] |

---

## Prochaine étape possible (hors dépôt)

Découper la **Phase 4** en tickets (GitLab / autre) : **un par écran** + **un pour le shell**, avec les fichiers `_atlasia-*` attachés à chaque ticket de suppression.

---

## Commandes utiles

```bash
cd frontend
npm run lint:ds-scss              # hex dans les SCSS applicatifs (hors _ds-tokens)
npm run lint:ds-scss -- --fail
npm run lint:ds-css               # hex dans components/pages *.css
npm run lint:ds-css -- --fail
npm run lint:ds-legacy-vars      # var(--at-*|--color-*) interdits hors _ds-semantic.scss
npm run lint:ds-legacy-vars -- --fail
npm run lint:ds-colors            # SCSS + CSS + variables legacy
```

---

## Annexe — Journal d’exécution déjà réalisé (ne pas supprimer : traçabilité)

Les lignes ci-dessous documentent des chantiers **déjà mergés** dans le repo (Phase 2 élargie + tokens + exports + mobile). Elles complètent les cases ci-dessus sans les remplacer.

- **Badges** : `app-badge-status` → `ds-badge` + `ds-badge-shared.scss` ; suppression `BadgeComponent`.
- **Empty / skeleton** : `ds-empty-state`, `app-loading-skeleton` → `ds-skeleton`, `app-skeleton-loader` délégué ; types `empty-state-actions.types.ts`.
- **Dashboard widgets** : `KpiWidget`, `RecentDossiersWidget`, `MyTasksWidget` sur `ds-card` + `--ds-*`.
- **Legacy** : suppression `LoadingButtonComponent`, `CustomSpinnerComponent` où sans usage.
- **Collab / offline / snackbar / validation / dashboard perso** : couleurs `--ds-*`.
- **Portail / collaboration** : `secure-message-thread`, `customer-portal-auth`, `collaboration-activity-stream`.
- **Charts** : `chart-ds-colors.ts`, `ChartColorPaletteService`, `app-chart`, analytics / observability / waterfall.
- **Shell / PWA / mobile nav** : `app-shell`, `pwa-install-prompt`, `mobile-bottom-navigation`, `swipeable-card`.
- **Dashboard / tâches / workflows** : KPI sparklines, `task-list`, workflow D3, `customer-portal-dashboard`, `lead-priority-queue`, `tour-launcher`.
- **Exports PDF & mobile offline** : `export.service`, `report-builder`, `generic-table` (`getActionColor` + SCSS tokens DS), `pdf-template.service`, `offline-dossiers-viewer`, `mobile-filter-sheet`, `mobile-dossier-card`, services natifs + `ai-agent-panel` en `--ds-*` / `DS_CHART_FALLBACK_HEX`.
- **Phase 2.4 / 2.5** : `CardWidgetBaseComponent` → **`DashboardWidgetBase`** ; **`dashboard-layout.model.ts`** + chrome **`dashboard-widget-shared.scss`**.
- **Phase 2 étendue Pro** : backlog **`mat-card`** → **`ds-card`** (~26 fichiers) + réduction spinners pleine zone (voir § Phase 2 étendue).

---

## Où vous situer (résumé)

| Phase | Sens |
|--------|------|
| **0–1** | Largement **bouclés** (cadrage + ponts sémantiques + lint hex). |
| **2** | **Cœur** (2.1–2.5) **fait**. **Extension Pro Space** (2.6+) **en cours** : **2.6 fait**, reste surtout **2.7** (inventaire/remplacement des placeholders `MatProgressSpinner`) + suivi récurrent **2.9**. |
| **3** | **Gros chantier ouvert** : tables/filtres/timeline/kanban/messagerie/mobile/notifications — beaucoup de **cosmétique DS** déjà faite, peu de **fusion architecturale** `ds-table` / filter-bar partout. |
| **4** | **À faire** : pilotes dashboard / dossiers / détail puis reste du domaine + shell. |
| **5–6** | **Après** stabilisation des écrans : retirer `_atlasia-*`, Storybook, audit à jour, tests visuels. |
