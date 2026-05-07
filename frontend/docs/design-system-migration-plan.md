# Plan opérationnel — Design System Atlasia (branchement quasi total)

> **Références :** [`design-system-audit.md`](design-system-audit.md) · Barrel DS : [`src/app/design-system/index.ts`](../src/app/design-system/index.ts)  
> **Règle PR / agent :** [`.cursor/rules/design-system-migration.mdc`](../../.cursor/rules/design-system-migration.mdc)  
> **Dernière mise à jour du document :** 2026-05-07

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
| **3.1** | **Tables** : generic-table → s’appuyer sur **ds-table** + tokens ; retirer les surcharges locales. | [x] quasi terminé — flux desktop branché sur `ds-table` (actions + sélection + pagination inline + pagination client locale), fallback Material desktop retiré, surcharges SCSS nettoyées et APIs de compat obsolètes supprimées ; reste une passe de validation écran par écran |
| **3.2** | **Filtres / recherche** : advanced-filters, dialog associé, global-search-bar → **filter-bar** DS (slots / extensions documentés). | [x] — **ds-input** pour valeurs texte/nombre (filtres avancés), nom de preset (dialog), **global-search-bar** (loupe type filter-bar, ARIA, focus/blur) ; sous-dialogue preset : textarea + checkbox natifs stylés `--ds-*` ; **hybride assumé** : `mat-select` / `mat-datepicker` / panneaux Material tant qu’il n’existe pas d’équivalent DS ; **ds-input** enrichi (`focus`/`blur`, `dsFocus`/`dsBlur`, attributs ARIA optionnels) |
| **3.3** | **Timeline / workflow** : activity-timeline, dossier-timeline-view, workflow-stepper → **timeline** + **stage-stepper** DS. | [x] — **dossier-timeline-view** sur **`ds-timeline`** + SCSS `--ds-*` ; **workflow-stepper** : barre % + **`ds-stage-stepper`** + **`ds-icon`** (chip / en-tête / hint) ; **activity-timeline** : **`ds-button`** / **`ds-icon`**, menu actions = bouton natif + `mat-menu`, icônes **`chevron-up` / `more-vertical`** ajoutées au DS |
| **3.4** | **KPI / dashboard** : kpi-widget, widgets récents → **kpi-card** + layout dashboard. | [x] partiel — widgets déjà branchés ds-card / tokens |
| **3.5** | **Calendrier / tâches** : calendar-view, task-list, task-card → **week-grid** + patterns tâches (cartes cohérentes ds-card). | [x] partiel — **task-list** : vue « Semaine » = **`ds-week-grid`** (clic événement / créneau → dialogs existants), plus **FullCalendar** dans ce flux ; **task-card** : **`ds-button`** + **`ds-icon`**, case à cocher native ; **calendar-view** : en-tête **`ds-button`** / **`ds-icon`**, légende **`--ds-*`**, couleurs événements via **`resolveDsToken`** ; icône **`refresh`** DS |
| **3.6** | **Kanban** : kanban-board → colonnes **kanban-column** DS + tokens. | [x] — **`ds-kanban-column`** pour les 6 colonnes dossiers ; mapping **`DossierResponse` → `DsKanbanCard`** (badge statut DS, tags score/source, date MAJ) ; drop cross-colonne → **`patchStatus`** + `distributeDosiersToColumns()` ; transitions invalides / erreurs API → resync depuis données ; SCSS board réduit au scroll / loading ; composant **standalone** ; specs Karma sans Vitest |
| **3.7** | **Messagerie** : whatsapp-*, comment-thread → **messaging-thread** / pattern commentaires unique. | [x] — partial **`_messaging-thread-bubbles.scss`** partagé ; **whatsapp-thread** / **whatsapp-messaging-ui** : rangées **`ds-thread*`** + **`ds-thread--whatsapp`**, séparateurs **`ds-date-divider`**, tokens (`--ds-shadow-*`, surfaces) ; **comment-thread** : fil **`ds-thread--comments`**, **`ds-avatar`** / **`ds-badge`**, bulles **`ds-thread__text--rich`** |
| **3.8** | **Mobile** : mobile-* (sheets, actions, navigation) → `design-system/platform/` (iOS / patterns plateforme). | [ ] partiel — nombreux `mobile-*` déjà en `--ds-*` |
| **3.9** | **Notifications** : notification-toast + centre → habillage `--ds-*` et composants surface DS. | [x] — **toast** : **`ds-icon`** / **`ds-button`** (variant selon type), SCSS **`--ds-*`** (`shadow`, `space`, `radius`, `text-sm`), thème sombre via **`host-context`** ; **centre** : enveloppe **`ds-card`** (`md`), **`ds-badge`** (non lus + type), **`ds-icon`** par canal, **`ds-button`** (refresh, lu/non lu, charger plus), filtres **`mat-button-toggle`** conservés |

---

## Phase 4 — Pages / domaine : branchement écran par écran

| # | Tâche | État |
|---|--------|------|
| **4.1** | **Pilote 1 — Dashboard** : page-header, filter-bar, kpi-card, ds-card partout ; retirer les classes `_atlasia-semantic-pages` devenues inutiles. | [x] — zones KPI, derniers dossiers, actions rapides, annonces enveloppées dans **`ds-card`** (`sm` + pad) ; **`dash-stack`** pour l’espacement interne ; erreurs / actions rapides en **`--ds-error-hl`**, **`--ds-success-hl`**, **`--ds-warning-hl`** ; suppression du **`dashboard.component.css`** obsolète ; sparkline sans `?.` (NG8107) |
| **4.2** | **Pilote 2 — Liste dossiers** : tableau DS, filtres DS, empty state DS ; supprimer `_atlasia-dossiers-scroll-fix` / table-dialog-repair quand le layout est stable. | [x] — liste desktop : **`ds-card`** (`sm`, sans pad) + **`ds-table`** (colonnes riches HTML échappées, actions **`ds-button`** / **`ds-icon`**), clic ligne → détail ; action **Annonce** (`building`) si `annonceId` ; filtres actifs : **`ds-badge`** (`info`, sans dot) + **`ds-icon`** `close` ; mobile inchangé (**`app-mobile-dossier-card`**). Fichiers `_atlasia-dossiers-scroll-fix` / `table-dialog-repair` : **aucune occurrence** dans `frontend/src` au moment de la livraison ; suppression globale reportée phase **5.x**. |
| **4.3** | **Pilote 3 — Détail dossier** : entity-detail-layout, timeline DS, messagerie DS. | [x] — **`ds-entity-detail-layout`** (`rightSlot=false`) : fil d’Ariane, **topbar** titre / badge / « Changer statut », colonne **Résumé** (`ds-card` + métadonnées + présence collab), zone centrale onglets + contenus ; onglet **Messages** : **`ds-empty-state`** + **`ds-messaging-thread`** dans **`ds-card`** (`getMessagesForDsThread`) ; **Chronologie** inchangée (**`app-activity-timeline`** déjà DS) ; **WhatsApp** / **messages sortants** inchangés ; **`goBack`** → **`/pro/dossiers`** ; fermeture template + quick-actions (FAB) corrigées. |
| **4.4** | **Enchaîner** : annonces, tâches, calendrier, reports, observability, workflow-admin, settings (même recette : en-tête + surfaces + tables/filtres DS). | [ ] partiel — **reports** : **`reports-dashboard`** — filtres dates **`mat-datepicker`** conservés ; actions **Apply / Export CSV / PDF** en **`ds-button`** + **`ds-icon`** (`filter`, `table`, `file-pdf`) ; KPI & graphiques : **`ds-icon`** (dont nouvelles clés **`clock`**, **`trending-up`**, **`table`**, **`file-pdf`**, **`pie-chart`**, **`gauge`**, **`bars-asc`**) ; menus graphiques : **`CdkConnectedOverlay`** (backdrop **`rpt-chart-menu-backdrop`**, styles **`rpt-chart-menu-*`**) + bouton **`rpt-menu-trigger`** + items **`ds-icon`** `download` ; tableaux détail **`mat-table`** → **`ds-table`** (colonnes riches HTML + **`rowClick`** drill-down sources / étapes entonnoir) ; SCSS **`--ds-*`** (bordures, ombres, halos) ; spec Vitest sans **`MatButton`/`MatIcon`/`MatTable`/`MatMenuModule`**. — **observability** : **`observability-dashboard`** — **`mat-table`** (latence par canal, messages DLQ) → **`ds-table`** (badges HTML **`ds-badge--*`** + **`escapeHtml`/`escapeAttr`**, nombres formatés `fr-FR`) ; export **`CdkConnectedOverlay`** (backdrop **`obs-export-menu-backdrop`**, classes **`obs-export-menu-*`**) avec **`ds-icon`** `chevron-down`, `table`, `chart` ; **`MatTooltip`** retiré (infobulle via **`title`** sur message tronqué) ; SCSS wrap **`obs-table-wrap--ds`** + **`::ng-deep`** pour cellules riches ; spec Vitest (**`FormsModule`** + animations, sans **`MatMenuModule`**). — **workflow-admin** : **`workflow-admin.component`** — actions principales en **`ds-button`** + **`ds-icon`** (`upload`, `whatsapp`) ; retrait de **`mat-raised-button`** / **`mat-icon`** sur les CTA d’édition et templates ; styles convertis vers tokens **`--ds-*`** (espacements, titres, séparateurs, shadow toggle). — **workflow-admin/template-library** : CTA principaux en **`ds-button`** + **`ds-icon`** (`plus`) ; avatar statut + métadonnées + menus actions migrés en **`ds-icon`** ; statut visuel en classes **`ds-badge--*`** ; état vide migré vers **`ds-empty-state`** (CTA conditionnel selon filtres) ; suppression des `rgba()` dans le CSS local. — **workflow-admin/template-editor** : navigation retour + actions sections (ajout/suppression boutons et variables) en **`ds-button`** `icon` + **`ds-icon`** ; boutons formulaire finaux (**Cancel/Create/Update**) en **`ds-button`** ; icônes suffixe « insert variable » migrées en **`ds-icon`** ; CSS aligné tokens DS (`drag-handle`, `empty-variables`, `form-actions` divider). — **workflow-admin/workflow-preview** : CTA **Réinitialiser** + boutons de transition migrés vers **`ds-button`** ; icônes statiques en **`ds-icon`** (`refresh`, `lock`, `chevron-right`, `tasks`, `users`, `clock`) ; historique et résumé alignés DS ; `MatButton` retiré du composant (conservation de `MatIcon` uniquement pour l’icône dynamique de nœud) ; ombres/couleurs CSS passées sur tokens **`--ds-*`**. — **workflow-admin/template-preview** : en-tête et aperçu WhatsApp migrés en **`ds-icon`** (`info`, `whatsapp`) ; boutons de message interactifs en **`ds-button`** `ghost` + icône DS (`link`, `phone`, `chevron-right`) ; variables rendues en **`ds-badge`** (`status="info"`, `showDot=false`) ; séparateurs `mat-divider` remplacés par séparateurs CSS ; retrait de **`MatButton`/`MatIcon`/`MatDivider`/`MatChip*`**, infobulles migrées en attributs natifs `title` ; palette et ombres CSS harmonisées sur tokens **`--ds-*`**. — **workflow-admin/workflow-editor** : barre d’actions « ajout de transition » migrée vers **`ds-button`** + **`ds-icon`** (`link`, `close`) ; fermeture du panneau propriétés et suppression de transition en **`ds-button`** `icon` + **`ds-icon`** (`close`, `trash`) ; puces Material des champs/rôles remplacées par **`ds-badge`** (`info`/`neutral`, `showDot=false`) ; séparateur `mat-divider` remplacé par un divider CSS ; retrait de **`MatButton`/`MatIconButton`/`MatDivider`/`MatChip*`** (conservation de `MatIcon` pour icône dynamique du nœud). — **workflow-admin/transition-rule-form** : actions formulaire (**Enregistrer/Supprimer**) migrées vers **`ds-button`** (`marine`/`danger`) + **`ds-icon`** (`check`, `trash`) ; icônes statiques de liste et états (`arrow`, verrou approbation, empty-state) migrées vers **`ds-icon`** ; puces éditables champs/rôles remplacées par **`ds-badge`** + bouton icône DS de retrait ; retrait de **`MatButton`/`MatChip*`** ; CSS harmonisé tokens DS (surfaces, shadows, chips-wrap). — **workflow-admin/variable-manager** : actions d’en-tête et suppression migrées vers **`ds-button`** `icon` + **`ds-icon`** ; indicateurs carte et détails (`drag`, type composant, description, position, empty-state) passés en **`ds-icon`** ; chip “Required” migrée vers **`ds-badge`** (`warning`, `showDot=false`) ; retrait de **`MatIconButton`/`MatIcon`/`MatChip`** ; styles harmonisés tokens DS (`surface`, `divider`, `shadow`, `text-*`) en conservant le panel d’astuces Material. — **workflow-admin/workflow-node** : action “ajouter transition” migrée vers **`ds-button`** `icon` + **`ds-icon`** (`plus`) ; poignée de drag migrée vers **`ds-icon`** (`bars-asc`) ; retrait de **`MatIconButton`** ; conservation de `MatIcon` pour l’icône dynamique de nœud ; styles nœud harmonisés via tokens DS (`surface`, `shadow-*`) et sélecteurs mis à jour pour `ds-icon`. — **settings** : **`settings-page`** — actions globales (**Restaurer**, **Annuler**, **Enregistrer**) migrées vers **`ds-button`** + **`ds-icon`** (`refresh`, `upload`) ; icône d’en-tête en **`ds-icon`** ; bouton preview en **`ds-button`** ; migration complémentaire des icônes sections notifications/intégrations vers **`ds-icon`** (`mail`, `bell`, `sms`, `megaphone`, `monitor`, `calendar`, `whatsapp`, `phone`) ; nouveaux glyphes DS ajoutés (`bell`, `sms`, `megaphone`, `monitor`, `globe`, `coin`) ; `rgba()` supprimés du CSS settings (tokens DS) ; import `MatButton` retiré (warning NG8113 levé) ; spec Vitest **16/16** OK. — **liste annonces** : vue liste = **`ds-card`** + **`ds-table`** (vignette sécurisée `safePhotoUrl`, **`escapeHtml`/`escapeAttr`**, prix **`PriceFormatPipe`**, statut **`ds-badge`** classes), filtres actifs **`ds-badge`** + **`ds-icon`** `close` ; vue cartes inchangée ; pagination carte vs liste séparée ; spec Karma **`vi` → `karmaSpy`**. — **tâches** : **`task-list`** conserve cartes + semaine ; **toggle cartes / tableau** dans **`ds-page-header`** ; tableau = **`ds-table`** (**échéance**, **`ds-badge`** prio/statut, actions terminer/rouvrir/modifier/supprimer) ; export barrel **`DsRowAction`**. — **calendrier — vue liste** : **`calendar-list-view`** : **`ds-empty-state`**, groupe par date avec **`ds-badge`** + **`ds-icon`** chevron, cartes RDV avec barre statut **`appointment-status-indicator--*`** (`--ds-*`), pied **`ds-badge`** (mapping statut → **`DsBadgeStatus`**), détails **`ds-icon`** (`map`, `calendar`, `folder`), action bureau **`ds-button`** `icon` + attribut natif `title` ; Material **`mat-icon` / `mat-chip` / `mat-icon-button`** retirés ; spec **`AppointmentApiService.list`** mock **`vi.fn()`** (`Vitest`) + **`NoopAnimationsModule`**. — **tooltip runtime applicatif** : migration finalisée vers `title` / `[attr.title]` ; aucun usage `MatTooltip` restant dans `src/app` (hors documentation). |
| **4.5** | **Shell** : app-shell / layout → absorber ce qui reste de `_atlasia-pro-shell` et `_atlasia-pro-navigation` dans des composants de layout explicites + tokens. | [ ] partiel — **`app-layout`** : navigation latérale + topbar en **`ds-button`** `icon` / **`ds-icon`** ; **`header`/`nav`** + **`.nav-link`** / **`.layout-divider`** ; **trois panneaux toolbar** (**Aide**, **notifications**, **utilisateur**) en **`CdkConnectedOverlay`** + tokens DS (**`.help-menu-dropdown`**, **`.notification-panel-dropdown`**, **`.user-menu-dropdown`**, items **`.help-menu-item`**) ; styles de backdrop overlays shell (**`.shell-toolbar-overlay-backdrop`**) déplacés vers **`app-layout.component.scss`** (retirés de `material-overrides.css`, alias legacy supprimé). **Styles shell déplacés de `styles.scss` vers `app-layout.component.scss`** : **`.skip-to-content`**, **`.tour-progress-badge`**, **`.tour-status-icon`**, **`.submenu-arrow`** (version DS/tokens), ainsi que le garde-fou overflow horizontal des conteneurs Material shell (**`.mat-drawer-container` / `.mat-sidenav-container` / `.mat-drawer-content` / `.mat-sidenav-content`**), et l’animation du backdrop sidenav (**`.mat-drawer-backdrop`**) scoppée au shell. Sous-menu **Guides interactifs** : section repliable **`.user-menu-tours-inline`** (plus de **`mat-menu`** sur le shell). **`mat-sidenav`** conservé ; **infobulles** via attribut natif **`title`** / **`[attr.title]`** ; **pastille notifications** en CSS (**`.toolbar-count-badge`**, sans **`MatBadge`**). **`mobile-bottom-navigation`** / **`app-shell`** inchangés. |

---

## Phase 5 — Nettoyage des couches globales (merge « total »)

| # | Tâche | État |
|---|--------|------|
| **5.1** | Quand les **3 pilotes** sont verts : supprimer `_atlasia-page-patterns`, `_atlasia-core-flows`, `_atlasia-semantic-pages`, `_atlasia-dossiers-scroll-fix` (ordre recommandé dans l’audit). | [x] — aucune occurrence de ces couches dans `frontend/src` (fichiers et imports supprimés). |
| **5.2** | Après écrans 4–9 : supprimer `_atlasia-special-screens-fix`, `_atlasia-table-dialog-repair`, `_atlasia-pro-navigation`. | [x] — aucune occurrence dans `frontend/src` (fichiers et imports supprimés). |
| **5.3** | Refonte layout terminée : réduire puis supprimer `_atlasia-pro-shell`. | [x] — couche legacy absente ; styles shell portés par `app-layout.component.scss` (tokens DS + overlays CDK). |
| **5.4** | **Dernier** : auditer ligne par ligne `_atlasia-density-correction` (beaucoup de `!important`) puis le supprimer une fois les espacements corrigés à la source. | [x] — aucune occurrence de `_atlasia-density-correction` dans `frontend/src`. |
| **5.5** | Conserver hors scope Pro si besoin : `_atlasia-shared`, `_atlasia-public-portal` jusqu’à migration du portail public. | [~] — `_atlasia-shared` **et** `_atlasia-public-portal` ne sont plus chargés globalement via `styles.scss` ; ils sont désormais chargés avec `PublicLayout` (`public-layout.component.scss`, encapsulation `None`) pour limiter l’impact au scope portail/vitrine. |

---

## Phase 6 — Qualité, docs, fin de dette

| # | Tâche | État |
|---|--------|------|
| **6.1** | Supprimer les showcases / demos listés dans l’audit (remplacés par Storybook si c’est la cible). | [x] — composants demo listés absents de `src/app/components` (contrôle par noms de fichiers : 0 résultat). |
| **6.2** | **Storybook** : une story par variante des primitives ; stories pour patterns critiques (filter-bar, table, messaging). | [~] **Recipes DS** : Empty States, Loading States, Badges & chips ; **Buttons** (`Components-Buttons.stories.ts` → `Design System/Recipes/Buttons`) ; **Dialogs** (`Components-Dialogs.stories.ts`) ; **Forms** (`Components-Forms.stories.ts`, Material conservé pour select/checkbox/radio/datepicker) ; **Illustrations** ; **Guidelines** (Do and Don’t) ; **Cards** (`Cards.stories.ts` migré vers `ds-button` + `ds-icon`) ; **pattern FilterBar** (`DS-Patterns-FilterBar.stories.ts`) ; **patterns critiques** **Table** (`DS-Table.stories.ts` → `Design System/Patterns/Table`) et **Messaging** (`DS-Patterns-Messaging.stories.ts`). **Ajouts** : cas `AdvancedGenericTableLike` (sélection + actions + cellules riches) et `MessagingThread / Dense no avatar`. `npm run build-storybook` bloqué localement par limite mémoire Node (`ERR_WORKER_OUT_OF_MEMORY`) ; `npm run build` applicatif ✅. |
| **6.3** | Mettre à jour **design-system-audit.md** (ou le régénérer) pour refléter l’état réel — éviter que le plan et le code divergent. | [x] — audit aligné sur l’état réel (cleanup `--at-*` terminé, état `_atlasia-*` et showcases mis à jour). |
| **6.4** | Tests visuels légers (Chromatic / Playwright screenshots sur 3–5 pages) pour éviter les régressions lors de la suppression des `_atlasia-*`. | [~] pack Playwright ajouté : `e2e/visual-smoke.spec.ts` (captures dashboard, dossiers, annonces, reports, settings → `test-results/visual-smoke/*.png`). Exécution locale bloquée pour l’instant : navigateur Playwright absent puis installation Chromium en échec (`ENOSPC` disque). |

---

## Backlog Phase 6 (usages `--at-*`)

Référence opérationnelle : [`design-system-backlog-phase-6-at-vars.md`](design-system-backlog-phase-6-at-vars.md)

État actuel : **cleanup `var(--at-*)` terminé dans `frontend/src`** (`rg "var\\(--at-" frontend/src` → 0 résultat).

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
