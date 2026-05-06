# Backlog — Phase 1.2 (historique)

> **État : fermé (2026-05-06).**  
> Le périmètre initial (hex applicatif, puis `var(--at-*\|--color-*)` → `var(--ds-*)`) est couvert par les scripts et le plan opérationnel à jour : [`design-system-migration-plan.md`](design-system-migration-plan.md).

## Outils

| Script / npm | Rôle |
|--------------|------|
| `check-no-hex-in-app-scss.cjs` / `lint:ds-scss` | Aucun `#hex` dans les `*.scss` applicatifs (hors `_ds-tokens.scss`) |
| `check-no-hex-in-app-css.cjs` / `lint:ds-css` | Aucun `#hex` dans `components/**` et `pages/**` `*.css` |
| `check-no-legacy-css-vars-in-app.cjs` / `lint:ds-legacy-vars` | Aucun `var(--at-*\|--color-*)` dans `src/app` hors pont [`_ds-semantic.scss`](../src/app/design-system/tokens/_ds-semantic.scss) |
| `migrate-hex-to-ds-in-app-css.cjs` | Migration batch hex → `--ds-*` (CSS) |
| `migrate-legacy-vars-to-ds-in-app-styles.cjs` | Migration batch `var(--at-*\|--color-*)` → `var(--ds-*)` / `color-mix` |

**Combo :** `npm run lint:ds-colors` (SCSS + CSS + variables legacy).  
**CI stricte :** chaque script accepte `-- --fail` (appeler chaque commande avec `--fail` : npm ne propage pas un seul `--fail` à toute la chaîne).

## Hors scope Phase 1.2 (rappel)

- **`src/styles/variables.scss`** et feuilles globales : toujours la palette legacy **en plus** des tokens DS ; la dette « global styles » relève plutôt des phases 4–5 (_atlasia_ / `styles.scss`).
- **Couleurs dans le TypeScript** (Lottie, PDF, fallbacks graphiques) : au cas par cas, pas bloquant pour la case 1.2 du plan.
