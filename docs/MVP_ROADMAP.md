# Atlas Immobilier — Roadmap MVP (S1 → S13)

Ce document décrit la **roadmap MVP par semaines**, avec l’**état d’avancement réel** (ce qui est fait / reste à faire) et les **ajustements** issus des échanges ChatGPT.

## Statut global (au 2026-01-04)

- **Semaine 1 : Terminée** (baseline prod-ready)
- **Semaine 2 : Terminée** (schéma DB + CRUD core + UI)
- **Semaine 3 : Terminée fonctionnellement** (Auth/RBAC + Multi-tenant + durcissement), avec **correctifs de fermeture FE/contrat** listés ci-dessous
- **Semaines 4 → 13 : Planifiées** (reste du MVP)

### Correctifs de fermeture — Semaine 3 (à traiter avant d’enchaîner)

1. **FE — DTO create** : `AnnonceCreateRequest` et `DossierCreateRequest` contiennent encore `orgId`. En Week 3, l’org vient du header `X-Org-Id` ⇒ **retirer `orgId` des DTO** et des payloads.
2. **FE — AnnonceStatus** : le FE n’expose que `DRAFT/PUBLISHED/ARCHIVED` alors que le BE expose aussi `ACTIVE/PAUSED` ⇒ **aligner enum + badges** (et fallback valeur inconnue).
3. **FE — DossierResponse** : il manque `score`, `source`, `parties`, `existingOpenDossierId` alors que le backend les expose ⇒ **compléter modèles + UI**.
4. **FE — Dossier details** : `orgId` affiché en “Système” et “Avancé” ⇒ **masquer technique** et ne le laisser qu’en “Avancé”.
5. **FE — i18n FR** : certains messages systèmes restent en EN (“Session expired…”, “Access denied…”) ⇒ **uniformiser FR**.
6. **FE — filtre liste dossiers** : colonne remplacée par “Annonce (titre)” mais filtre reste “ID annonce” brut ⇒ **select/autocomplete** (au minimum côté liste).

---

## Plan MVP — par semaines (version projet)

### Semaine 1 — Baseline “prod-ready” (TERMINÉE)

- Repo + monorepo + hygiene
- Docker compose Postgres + backend + healthchecks
- Backend : Actuator/Swagger/ping/correlation-id/tests/build jar
- Frontend : lint/tests/build prod/proxy/ping UI
- Profils Spring (local/test/staging/prod) + CI workflows

**Livrables clés (repo)** : CI FE/BE, profils Spring, dev scripts, Docker compose, documentation de setup.

### Semaine 2 — Schéma DB + CRUD core (Annonce/Dossier) + UI (TERMINÉE)

- Flyway V1/V2/V3 : annonce, dossier, partie_prenante, consentement, message, appointment, audit_event
- Backend CRUD Annonce (create/get/update/list + filtres/pagination)
- Backend CRUD Dossier (create/get/list + patch status + filtres)
- Frontend : pages Annonce (liste + form), Dossier (liste + détail) + services API
- Tests API + intégration FE↔BE

### Semaine 3 — Auth/RBAC + Multi-tenant + durcissement API (TERMINÉE + fermeture en cours)

- Auth (JWT/OIDC) + guards Angular
- RBAC (ADMIN, PRO) sur endpoints
- Multi-tenant `orgId` sur entités core + filtre automatique
- Normalisation erreurs API (ProblemDetails) + validation renforcée
- Seed/demo contrôlé + scripts migration

**À finaliser (fermeture S3)** : voir section “Correctifs de fermeture — Semaine 3”.

---

### Semaine 4 — Pipeline Dossier + Audit + Notes/Tasks (MVP CRM interne)

- Statuts Dossier + transitions + règles MVP (ex : pas de retour sur WON/LOST)
- AuditEvent systématique sur changements
- Notes + tâches internes sur dossier (API + UI)
- Vue Kanban (option MVP) ou liste par statut optimisée

**Ajustements recommandés (alignement suggestions AI)**
- Ajouter explicitement **PartiePrenante CRUD v1** (gestion contacts/roles) sur le dossier.
- Ajouter une première suite **E2E (Playwright) smoke** (2–3 parcours critiques) + artifacts CI.
- Préciser l’implémentation audit : **AOP ou listeners + diff JSON** + viewer minimal.

### Semaine 5 — Consentements & conformité (WhatsApp-ready)

- Modèle Consentement + preuves (texte, timestamp, metadata)
- Enforcement : interdiction d’envoi sans consentement (API + UI)
- UI gestion consentements + historique
- Paramétrage politique de conservation (basique)

### Semaine 6 — WhatsApp Inbound (réception)

- Webhook inbound + validation payload + idempotence (providerMsgId)
- Création/attachement Dossier par téléphone + routage basique
- Stockage Messages (in) + UI conversation read-only
- Tests d’intégration webhook

### Semaine 7 — WhatsApp Outbound (envoi)

- Client provider + envoi messages
- Templates + variables + multi-langue (MVP)
- UI composer + quick replies (option)
- Logs/erreurs provider + retries

### Semaine 8 — Qualification (rules + extraction MVP)

- Moteur rules v1 (json rules par org/annonce)
- Extraction champs (budget/zone/timing) heuristique MVP
- Calcul score + reasons + snapshot historisé
- UI panneau qualification + trigger manuel

### Semaine 9 — RDV (Appointment) + rappels

- CRUD Appointment lié au Dossier
- UI création/édition RDV + liste
- Scheduler rappels (J-1 / H-2) via WhatsApp (avec consentement)
- Statuts RDV (planned/confirmed/cancelled/done/no-show)
- Validation : **anti double-booking** + dates futures only

### Semaine 10 — Import/Export + connecteur CRM minimal

- Export CSV (annonces/dossiers/rdv/messages) + filtres
- Import CSV (annonces/dossiers) + mapping + rapport erreurs
- Connector outbound (webhook events) vers CRM externe (MVP)
- UI settings intégrations

### Semaine 11 — Reporting & KPI

- KPIs : temps réponse, taux qualif, taux RDV, no-show, conversion pipeline
- Endpoints reports + agrégations
- Dashboard Angular (cards + tables)

### Semaine 12 — Hardening + perf + observabilité

- Rate limiting endpoints sensibles
- Renforcer idempotence/retries + anti-replay
- Metrics (Prometheus) / logs structurés / alerting minimal
- Tests supplémentaires (parcours critiques)

### Semaine 13 — UAT pilote + Go-live

- Scénarios UAT + dataset de test
- Bugfix P0/P1 + re-tests
- Runbook + checklist release
- Tag/release MVP v0.2.0 (ou équivalent) + déploiement pilote

---

## Convention de version (suggestion)

Le projet suit actuellement une numérotation simple alignée sur les jalons déjà livrés :

- `0.1.0` : Semaine 1 (baseline)
- `0.2.0` : Semaine 2 (CRUD core)
- `0.3.0` : Semaine 3 (auth + multi-tenant)

Pour le **go-live MVP**, utiliser un tag dédié (par ex. `0.4.0` ou `0.9.0`) afin d’éviter la collision avec les tags déjà utilisés.
