# API Pro — Listings / Publications (v1)

> **Domaine**: `pro.atlasia.ma`

## Base & conventions
- Base URL: `https://pro.atlasia.ma/api/v1`
- Auth JWT Bearer, tenant via `X-Org-Id`
- Erreurs JSON `{code,message,details}`

## Listings
- `GET /listings` (filtres + pagination)
- `POST /listings` (create → `ANN_DRAFT`)
- `GET /listings/{id}` (détail + qualité + trust + visibility)
- `PATCH /listings/{id}` (update)

## Médias
- `POST /listings/{id}/media/init` (pre-signed)
- `POST /listings/{id}/media/{mediaId}/finalize`
- `POST /listings/{id}/media/reorder`
- `POST /listings/{id}/media/{mediaId}/primary`
- `DELETE /listings/{id}/media/{mediaId}`

## Trust / Dedupe
- `GET /listings/{id}/trust/duplicate`
- `POST /listings/{id}/trust/duplicate/override` (manager-only)

## Transitions
- `GET /listings/{id}/transitions`
- `POST /listings/{id}/transitions` (publish/suspend/archive)

## Reports
- `GET /listings/{id}/reports`
- `POST /reports/{reportId}/status`

## Visibility
- `GET /listings/{id}/visibility`

## Codes erreurs
- `LISTING_NOT_FOUND` (404)
- `TRANSITION_NOT_ALLOWED` (409)
- `VALIDATION_ERROR` (400)
- `FORBIDDEN` (403)
