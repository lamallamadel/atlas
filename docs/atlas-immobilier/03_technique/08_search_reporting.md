# Recherche & reporting

> **Statut**: Partiel (AS-IS)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/03_api_contracts.md`

## Full-text search PostgreSQL
- Colonnes : `annonce.title`, `annonce.description`, `dossier.leadName`, `dossier.leadPhone`, notes/messages.
- `tsvector` + index GIN.
- Requête : `to_tsquery` / `websearch_to_tsquery`.

## KPIs recommandés
- Volume de leads par période et par source.
- Funnel : NEW → QUALIFYING → QUALIFIED → APPOINTMENT → WON/LOST.
- Taux de conversion par annonce et par source.
- Temps moyen par étape (lead age, time-to-close).
- Activité : #messages sortants/entrants par dossier (qualité de suivi).

## Endpoints
- `/api/dashboard/kpis`
- `/api/dashboard/funnel`
- `/api/dashboard/sources`
- `/api/dashboard/top-annonces`
- `/api/dashboard/durations`

## Frontend
- Page “Reporting”
- Charts (bar/line/pie) + filtres date range + statut.
- Export CSV (option).
