# Backlog Phase 6 — Remplacement des `--at-*`

> Généré le : 2026-05-07
> Objectif : supprimer les usages restants de `var(--at-*)` au profit de `--ds-*` (ou fallback DS explicite).

## Inventaire actuel

- `src/styles/_atlasia-shared.scss` : **0** occurrence ✅
- `src/styles/_atlasia-public-portal.scss` : **0** occurrence ✅
- `src/styles/_fullcalendar-ds.scss` : **0** occurrence ✅
- `src/app/pages/portail/mentions-legales/mentions-legales.component.ts` : **0** occurrence ✅
- `src/app/pages/portail/confidentialite/confidentialite.component.ts` : **0** occurrence ✅

## Priorisation proposée

1. **Facile / rapide** (fait)
- `src/styles/_fullcalendar-ds.scss` ✅
- `src/app/pages/portail/mentions-legales/mentions-legales.component.ts` ✅
- `src/app/pages/portail/confidentialite/confidentialite.component.ts` ✅

2. **Moyen** (fait)
- `src/styles/_atlasia-public-portal.scss` ✅

3. **Lourd** (fait)
- `src/styles/_atlasia-shared.scss` ✅

## Stratégie d’exécution

- Remplacer `var(--at-...)` par `var(--ds-...)` quand mapping 1:1 évident.
- Quand le mapping n’est pas strict, utiliser un fallback explicite DS dans la même règle.
- Valider chaque lot par :
  - `npm run build`
  - pages publiques clés (home portail, recherche, annonce détail, vitrine home/tarifs/contact).

## Critère de sortie

- `rg "var\\(--at-" frontend/src` ne retourne plus de résultats (hors docs si conservés à titre historique).
