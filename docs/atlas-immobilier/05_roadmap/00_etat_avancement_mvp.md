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
- CRUD consentements (stockage/consultation) ✅
- Enforcement strict sur outbound (WhatsApp/SMS/Email) + preuve de consentement ✅

### S6+ — WhatsApp Inbound & Outbound (Agentic Chatbot)
- Webhook inbound : validation HMAC + idempotence + association dossier ✅
- WhatsApp outbound : provider Twilio + templates + outbox/retry + monitoring ✅
- Agent IA NLP intégré : qualification de leads auto et prise de RDV autonome ✅

### S7+ — IA Agentique & Automatisation (Phase 2)
- Coach Virtuel : Nudging comportemental sur les leads ✅
- Scanning IA : Validation DPE & Amiante ✅
- Contrats IA : Génération de compromis de vente pré-rempli ✅
- Yield Management : Ajustement automatique des prix ✅
- Anti-fraude & Doublons : Scoring IA sur les annonces ✅
- Interface "Glass Box" (tooltips d'explicabilité de l'IA) ✅

### S8+ — Qualité & NFR
- NFR : rate limiting, alerting, dashboards de performance ✅
- E2E Playwright : Suite complète de tests E2E stabilisés intégrée au pipeline CI ✅

## Écarts vers “market-ready” (TO-BE)
- Le cœur du système et le CRM avancé sont livrés. Les prochains écarts concernent les extensions métiers B2B et Coop Habitat.

## Références
- Contrat API : `docs/atlas-immobilier/03_technique/03_api_contracts.md`
- Workflow dossier : `docs/atlas-immobilier/03_technique/06_workflow_dossier_state_machine.md`

## Extension TO-BE — Module Coop Habitat

- **Statut** : non implémenté (spécifié)
- **Doc source** : `02_fonctionnel/04_module_coop_habitat.md`
- **Dépendances** :
  - Référentiels/workflows modulables (caseType/statusCode)
  - Notifications outbound (Choix B) pour appels de fonds et jalons
  - Modèle documents (PV/justificatifs) et audit

Objectif : attaquer un segment “groupement/cooperative” avec une V1 déclarative (preuves) avant paiement intégré.
