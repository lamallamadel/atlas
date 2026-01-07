# État d’avancement — MVP (AS-IS) + cible market-ready

> **Statut**: Source de vérité (AS-IS)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/03_api_contracts.md`  
- `docs/atlas-immobilier/03_technique/06_workflow_dossier_state_machine.md`

Ce document décrit **uniquement** l’état réel du projet (ce qui est présent). Les éléments “à faire” sont listés comme **écarts** vers la cible market-ready.

## AS-IS — Livré / présent

### S1 — Baseline / monorepo
- Structure monorepo (backend/frontend/infra)
- Docker Compose local (PostgreSQL)
- Scripts et docs setup

### S2 — Core CRM (annonces + dossiers)
- CRUD annonces
- CRUD dossiers + logique de déduplication
- UI listes et détails (annonces/dossiers)

### S3 — Sécurité & multi-tenancy
- Auth JWT
- Isolation tenant via `X-Org-Id`
- Rôles / protections endpoints (niveau MVP)

### S4+ — Fonctionnel “CRM interne” (parties, messages, rdv, audit, timeline)
- Workflow dossier (transitions) + historique (status history)
- Audit via AOP + endpoints de lecture
- Timeline / activities (notes + événements)
- Parties prenantes (CRUD v1)
- Messages (journalisation + timeline conversation)
- Rendez-vous (CRUD v1)
- Search & reporting (endpoints + dashboard)

### S5+ — Consentements
- CRUD consentements (stockage/consultation)

### S6+ — WhatsApp inbound
- Webhook inbound : validation HMAC + idempotence + association dossier

## Écarts vers “market-ready” (TO-BE)

- Consentement : enforcement strict sur outbound (WhatsApp/SMS/Email) + preuve de consentement
- WhatsApp outbound : provider + templates + outbox/retry + monitoring (Choix B)
- E2E Playwright : stabiliser le login et réduire le flakiness
- Timeline : garantir les événements automatiques pour statut/rdv/message
- NFR : rate limiting, alerting, dashboards, politiques de rétention (selon besoin)

## Références
- Contrat API : `docs/atlas-immobilier/03_technique/03_api_contracts.md`
- Workflow dossier : `docs/atlas-immobilier/03_technique/06_workflow_dossier_state_machine.md`
