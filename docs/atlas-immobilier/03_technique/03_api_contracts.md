# API contracts (REST) — AS-IS + extensions market-ready

> **Statut**: Partiellement implémenté (AS-IS) + extensions TO-BE  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/04_security_multi_tenancy.md`  
- `docs/atlas-immobilier/02_fonctionnel/02_regles_metier.md`  
- `docs/atlas-immobilier/03_technique/09_notifications.md`

Ce document liste les contrats REST. Il distingue :
- **AS-IS** : endpoints présents dans le repo.
- **TO-BE** : endpoints à ajouter pour la cible market-ready (référentiels/workflow, outbound provider, monitoring).

## Conventions

- Base path : `/api/v1`
- Multi-tenant : header `X-Org-Id` requis (voir doc sécurité)
- Pagination : `page`, `size` (ou équivalent, selon implémentation)
- Erreurs : format normalisé (voir doc standardisation erreurs, si présent)

## AS-IS — Endpoints core

### Annonces
- `GET /api/v1/annonces`
- `POST /api/v1/annonces`
- `GET /api/v1/annonces/{id}`
- `PUT /api/v1/annonces/{id}`
- `DELETE /api/v1/annonces/{id}`

### Dossiers
- `GET /api/v1/dossiers`
- `POST /api/v1/dossiers`
- `GET /api/v1/dossiers/{id}`
- `PUT /api/v1/dossiers/{id}`
- `PATCH /api/v1/dossiers/{id}/status`
- `GET /api/v1/dossiers/{id}/status-history`

### Parties prenantes
- `GET /api/v1/parties-prenantes?dossierId=...`
- `POST /api/v1/parties-prenantes`
- `PUT /api/v1/parties-prenantes/{id}`
- `DELETE /api/v1/parties-prenantes/{id}`

### Messages
- `GET /api/v1/messages?dossierId=...`
- `POST /api/v1/messages`
- `GET /api/v1/messages/{id}` (si présent)
- (option) `DELETE /api/v1/messages/{id}`

### Rendez-vous
- `GET /api/v1/appointments?dossierId=...`
- `POST /api/v1/appointments`
- `PUT /api/v1/appointments/{id}`
- `DELETE /api/v1/appointments/{id}`

### Activities (timeline)
- `GET /api/v1/activities?dossierId=...`
- `POST /api/v1/activities`
- `PUT /api/v1/activities/{id}`
- `DELETE /api/v1/activities/{id}`

### Consentements
- `GET /api/v1/consentements?dossierId=...`
- `POST /api/v1/consentements`
- `PUT /api/v1/consentements/{id}`

### Audit events
- `GET /api/v1/audit-events` (filtres: entityType/entityId/date range)

### Search & reporting / dashboard
- `GET /api/v1/search` (ou endpoints spécialisés)
- `GET /api/v1/reports/...`
- `GET /api/v1/dashboard/...`

### Webhooks
- `POST /api/v1/webhooks/whatsapp` (inbound, signature HMAC)

## TO-BE — Extensions “market-ready”

### Référentiels & workflows (admin)
Objectif : rendre les enums métier configurables par tenant.

- `GET /api/v1/admin/reference-data/{type}` (liste)  
- `POST /api/v1/admin/reference-data/{type}` (create)  
- `PUT /api/v1/admin/reference-data/{type}/{code}` (update)  
- `DELETE /api/v1/admin/reference-data/{type}/{code}` (disable/delete)

Workflows :
- `GET /api/v1/admin/workflows?caseType=...`
- `PUT /api/v1/admin/workflows/{caseType}` (states + transitions)
- `GET /api/v1/dossiers/{id}/available-transitions` (UI helper)

Référence : `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`

### Outbound (WhatsApp/SMS/Email)
Objectif : exposer un envoi réel, traçable et résilient.

Option API (recommandée) :
- `POST /api/v1/outbound/messages` (création d’une demande d’envoi → outbox)
- `GET /api/v1/outbound/messages/{id}` (statut)
- `GET /api/v1/outbound/messages?dossierId=...` (listing)
- (admin/ops) `POST /api/v1/outbound/messages/{id}/retry`

Monitoring :
- `GET /api/v1/ops/outbound/metrics`
- `GET /api/v1/ops/outbound/health`

Référence : `docs/atlas-immobilier/03_technique/09_notifications.md`
