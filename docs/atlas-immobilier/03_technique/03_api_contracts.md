# API contracts (REST) — état Week 3 + cible Advanced CRM

## Pré-requis communs
- Authentification : `Authorization: Bearer <JWT>` requis pour `/api/**`.
- Multi-tenancy : `X-Org-Id: <ORG_ID>` requis pour `/api/**`.

---

## 0) Implémenté (Week 2 → Week 3)

### Health / tooling
- `GET /actuator/health` (public)
- `GET /swagger-ui/index.html` (public)
- `GET /v3/api-docs` (public)

### Ping
- `GET /ping` (public)

### Annonces
Base path : `/api/v1/annonces`
- `POST /api/v1/annonces` (roles : `ADMIN`, `PRO`)
- `GET /api/v1/annonces/{id}` (roles : `ADMIN`, `PRO`)
- `GET /api/v1/annonces` (list + filtres/tri/pagination)
- `PUT /api/v1/annonces/{id}`
- `DELETE /api/v1/annonces/{id}`

### Dossiers
Base path : `/api/v1/dossiers`
- `POST /api/v1/dossiers` (création + règles métier/déduplication)
- `GET /api/v1/dossiers/{id}`
- `GET /api/v1/dossiers` (list + filtres/tri/pagination)
- `PATCH /api/v1/dossiers/{id}/status` (changement de statut)
- `DELETE /api/v1/dossiers/{id}`

### Dashboard (KPIs)
Base path : `/api/v1/dashboard`
- `GET /api/v1/dashboard/kpis/annonces-actives`
- `GET /api/v1/dashboard/kpis/dossiers-a-traiter`
- `GET /api/v1/dashboard/dossiers/recent`

---

## 1) En conception (Sprints suivants — Advanced CRM)

> Les sections ci-dessous restent la cible fonctionnelle/technique (documents présents), mais les endpoints ne sont pas encore exposés.

### Messages
- `POST /api/dossiers/{dossierId}/messages`
  - body : `{ channel, direction, content, timestamp? }`
  - règle : si `direction=OUTBOUND` → vérifier consentement canal
- `GET /api/dossiers/{dossierId}/messages?channel=&direction=&from=&to=&page=&size=`
  - tri par `timestamp/createdAt` desc

### Audit (read-only)
- `GET /api/audit?entityType=...&entityId=...&from=&to=&page=&size=`
- `GET /api/dossiers/{dossierId}/audit`
- `GET /api/annonces/{annonceId}/audit`

### Consentements
- `GET /api/dossiers/{dossierId}/consentements`
- `PUT /api/dossiers/{dossierId}/consentements/{channel}`
  - body : `{ status, meta? }`

### Workflow Dossier
- `GET /api/dossiers/{id}/transitions`
  - retourne : `{ currentStatus, allowed: [ ... ] }`
- `POST /api/dossiers/{id}/transition`
  - body : `{ toStatus, reason?, payload? }`

### Reporting
- `GET /api/dashboard/kpis?from=&to=`
- `GET /api/dashboard/funnel?from=&to=`
- `GET /api/dashboard/sources?from=&to=`
- `GET /api/search/dossiers?q=&status=&page=&size=`
