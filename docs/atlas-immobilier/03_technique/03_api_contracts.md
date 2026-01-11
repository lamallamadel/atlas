# API contracts (REST) — AS-IS + extensions market-ready

> **Statut**: Partiellement implémenté (AS-IS) + extensions TO-BE  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/04_security_multi_tenancy.md`  
- `docs/atlas-immobilier/02_fonctionnel/02_regles_metier.md`  
- `docs/atlas-immobilier/03_technique/09_notifications.md`
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`

Ce document liste les contrats REST. Il distingue :
- **AS-IS** : endpoints présents dans le repo.
- **TO-BE** : endpoints à ajouter pour la cible market-ready (référentiels/workflow, outbound provider, monitoring).


## MVP — Séparation Public vs Pro

- Public (Portail/Biz) : `docs/atlas-immobilier/03_technique/15_api_public_portal_biz.md`
- Pro (CRM) : `docs/atlas-immobilier/03_technique/12_api_pro_crm_b2b_demo.md`
- Pro (Listings) : `docs/atlas-immobilier/03_technique/13_api_pro_listings.md`

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
- `GET /api/v1/parties-prenantes?dossierId=`
- `POST /api/v1/parties-prenantes`
- `PUT /api/v1/parties-prenantes/{id}`
- `DELETE /api/v1/parties-prenantes/{id}`

### Messages
- `GET /api/v1/messages?dossierId=`
- `POST /api/v1/messages`
- `GET /api/v1/messages/{id}` (si présent)
- (option) `DELETE /api/v1/messages/{id}`

### Rendez-vous
- `GET /api/v1/appointments?dossierId=`
- `POST /api/v1/appointments`
- `PUT /api/v1/appointments/{id}`
- `DELETE /api/v1/appointments/{id}`

### Activities (timeline)
- `GET /api/v1/activities?dossierId=`
- `POST /api/v1/activities`
- `PUT /api/v1/activities/{id}`
- `DELETE /api/v1/activities/{id}`

### Consentements
- `GET /api/v1/consentements?dossierId=`
- `POST /api/v1/consentements`
- `PUT /api/v1/consentements/{id}`

### Audit events
- `GET /api/v1/audit-events` (filtres: entityType/entityId/date range)

### Search & reporting / dashboard
- `GET /api/v1/search` (ou endpoints spécialisés)
- `GET /api/v1/reports/`
- `GET /api/v1/dashboard/`

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
- `GET /api/v1/admin/workflows?caseType=`
- `PUT /api/v1/admin/workflows/{caseType}` (states + transitions)
- `GET /api/v1/dossiers/{id}/available-transitions` (UI helper)

Référence : `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`

### Outbound (WhatsApp/SMS/Email)
Objectif : exposer un envoi réel, traçable et résilient.

Option API (recommandée) :
- `POST /api/v1/outbound/messages` (création d’une demande d’envoi → outbox)
- `GET /api/v1/outbound/messages/{id}` (statut)
- `GET /api/v1/outbound/messages?dossierId=` (listing)
- (admin/ops) `POST /api/v1/outbound/messages/{id}/retry`

Monitoring :
- `GET /api/v1/ops/outbound/metrics`
- `GET /api/v1/ops/outbound/health`

Référence : `docs/atlas-immobilier/03_technique/09_notifications.md`

### Coop Habitat (TO-BE)

> Module “coopérative / groupement d’habitat participatif”.  
> Source of truth : `docs/atlas-immobilier/02_fonctionnel/04_module_coop_habitat.md`.

#### Groupements
- `POST /api/v1/coop/groups`
- `GET /api/v1/coop/groups` (filtres: status, city)
- `GET /api/v1/coop/groups/{id}`
- `PATCH /api/v1/coop/groups/{id}` (status change via workflow)
- `GET /api/v1/coop/groups/{id}/timeline` (activity)

#### Membres
- `POST /api/v1/coop/groups/{groupId}/members`
- `GET /api/v1/coop/groups/{groupId}/members` (filtres: memberStatus)
- `PATCH /api/v1/coop/members/{id}` (status, fifoRank, contact)
- `POST /api/v1/coop/members/{id}/documents` (KYC docs)

#### Plans & contributions
- `POST /api/v1/coop/groups/{groupId}/contribution-plans` (versioning)
- `GET /api/v1/coop/groups/{groupId}/contribution-plans`
- `GET /api/v1/coop/groups/{groupId}/contributions` (ledger)
- `POST /api/v1/coop/groups/{groupId}/contributions` (déclaratif + preuve)
- `PATCH /api/v1/coop/contributions/{id}` (confirm/reject/mark-late)

#### Projet & lots
- `POST /api/v1/coop/groups/{groupId}/projects`
- `PATCH /api/v1/coop/projects/{id}` (status/milestones)
- `POST /api/v1/coop/projects/{projectId}/lots`
- `GET /api/v1/coop/projects/{projectId}/lots`

#### Allocation
- `POST /api/v1/coop/groups/{groupId}/allocations` (propose FIFO)
- `PATCH /api/v1/coop/allocations/{id}` (validate/assign/reject)
- `POST /api/v1/coop/allocations/{id}/documents` (PV/decision)

## Annexes API (spécifiques MVP)

- API Pro CRM B2B Demo : `docs/atlas-immobilier/03_technique/12_api_pro_crm_b2b_demo.md`
- API Pro Listings / Publications : `docs/atlas-immobilier/03_technique/13_api_pro_listings.md`
