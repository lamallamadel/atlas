# Atlas Immobilier — Roadmap MVP (S1 → S13)

> **Statut**: À jour (AS-IS + cible market-ready)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/PROJECT_STATUS.md`  
- `docs/atlas-immobilier/05_roadmap/00_etat_avancement_mvp.md`  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`  
- `docs/atlas-immobilier/03_technique/09_notifications.md`

Ce document décrit la roadmap MVP par semaines (S1 → S13). Il distingue :
- **AS-IS** : livré/présent dans le repo.
- **TO-BE** : cible “market-ready” pour attaquer le marché.

## Statut global (au 2026-01-07)

- **S1 → S3** : terminées (socle monorepo + CRUD core + auth/multi-tenant).
- **S4** : très avancée (workflow dossier + audit + timeline + modules core), à **clore proprement** (QA + cohérence).
- **S5 → S7** : partiellement engagées ; décision produit : **Choix B = WhatsApp Outbound réel** (provider + outbox + retry + consentement strict).
- **S8+** : à planifier après stabilisation (qualification, rappels, import/export, hardening).

### Correctifs de fermeture — avant “marché” (gating)

- E2E Playwright : rendre le login et les sélecteurs **stables** (anti-flaky)
- Consentement : rendre **bloquant** l’outbound (WhatsApp/SMS/Email)
- Outbound : outbox + retry + idempotence + monitoring (Choix B)
- Normalisation erreurs (API) + observabilité (correlation-id / logs)

## Plan MVP — par semaines (version projet)

### Semaine 1 — Baseline “prod-ready” (TERMINÉE)
- Monorepo, Docker Compose, profils, scripts, hygiene repo, CI de base.

### Semaine 2 — Schéma DB + CRUD core (Annonce/Dossier) + UI (TERMINÉE)
- Migrations + CRUD annonces/dossiers + UI de base.

### Semaine 3 — Auth/RBAC + Multi-tenant + durcissement API (TERMINÉE)
- JWT + tenant via `X-Org-Id` + protections endpoints + garde-fous.

### Semaine 4 — Pipeline Dossier + Audit + Notes/Tasks (EN COURS — à clore)
**AS-IS**
- Machine à états dossier + historique
- Audit AOP + lecture
- Activity timeline (notes) + modules messages/rdv/parties
- Search + dashboard/reporting de base

**TO-BE (clôture S4)**
- Timeline “journal” : événements auto (STATUS_CHANGE, APPOINTMENT_LOG, MESSAGE_LOG)
- Tasks v1 (OPEN/DONE + dueAt) intégrées à timeline
- UAT/E2E : 5 parcours stables (zéro flaky)

### Semaine 5 — Consentements & conformité (TERMINÉE)
L'implémentation du consentement est terminée et agit désormais comme garde-fou strict bloquant tout trafic outbound.
- Preuve de consentement (meta standardisée)
- Politique stricte (bloquante) : pas d'outbound sans statut `GRANTED`
- Audit + activity log sur changement consentement

### Semaine 6 — WhatsApp Inbound (TERMINÉE)
- Webhook inbound avec validation HMAC, idempotence, rattachement dossier
- Réception et traitement de tous les types de messages entrants
- Règles d’association (téléphone, org, stratégie de fallback)

### Semaine 7 — WhatsApp Outbound (CHOIX B - TERMINÉE)
L'architecture Cloud API complète est en production :
- Provider officiel WhatsApp Cloud API Intégré
- Architecture Outbox + Exponential Backoff Retry Handling + DLQ
- Rate Limiting via Redis (et Quota tracking par Organisation)
- Session Windows de 24h vérifiées pour les messages free-form (et templates autorisés hors-fenêtre)

### Semaine 8 — Qualification (rules + extraction MVP) (PLANIFIÉE)
- Règles de scoring / qualification (simple et explicable)
- Champs et tags métier

### Semaine 9 — RDV (Appointment) + rappels (PLANIFIÉE)
- Rappels (scheduler) + intégration optionnelle calendrier

### Semaine 10 — Import/Export + connecteur CRM minimal (PLANIFIÉE)

### Semaine 11 — Reporting & KPI (AS-IS PARTIEL → AMÉLIORER)
- KPIs, filtres, exports simples

### Semaine 12 — Hardening + perf + observabilité (PLANIFIÉE)
- Rate limiting, anti-abus, perf, backups, alerting

### Semaine 13 — UAT pilote + Go-live (PLANIFIÉE)
- Pilotage agence(s), boucle feedback, packaging, go-live

## Convention de version (suggestion)
- `v0.4-week3` : socle sécurisé
- `v0.5-week4plus` : CRM interne complet
- `v0.6-market-ready` : consentement strict + WhatsApp outbound + QA stable

## Extension (TO-BE) — Coop Habitat
- Ajouter un bounded context Coop (Group/Member/Project/Lot/Contributions/Allocation/Documents)
- Brancher notifications WhatsApp (Choix B) sur appels de fonds, allocations, jalons
- Gouvernance (PV/décisions) + audit/timeline
