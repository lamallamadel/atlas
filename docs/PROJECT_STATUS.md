# Atlas Immobilier — État du projet

> **Statut**: AS-IS consolidé + trajectoire “market-ready” définie  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/03_api_contracts.md`  
- `docs/atlas-immobilier/05_roadmap/00_etat_avancement_mvp.md`  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`

## Synthèse (langage produit)

Atlas Immobilier est un CRM immobilier centré sur la gestion de **dossiers** (cases) et d’**annonces / biens**, avec :
- un **pipeline de traitement** (statuts, transitions, historique),
- une **timeline** d’activités (notes, événements),
- des **rendez-vous** et des **messages** rattachés aux dossiers,
- un **audit trail** (traçabilité),
- une base de **search & reporting**,
- une intégration **WhatsApp inbound** (webhook) déjà posée.

## AS-IS (réel implémenté)

### Fonctionnel
- Annonces : CRUD + statuts (draft/published/active/paused/archived)
- Dossiers : création + déduplication (logique existant ouvert), mise à jour + transitions de statuts, historique de statuts
- Parties prenantes : CRUD v1
- Messages : enregistrement / lecture (timeline conversation), rattachement dossier
- Rendez-vous : CRUD v1, affichage dans le dossier
- Timeline (activities) : notes + chronologie
- Consentements : CRUD v1 (stockage/consultation)
- Audit : AOP + lecture via API
- Search & reporting : endpoints + dashboard de base
- WhatsApp : webhook inbound (validation HMAC, idempotence, association dossier)

### Tech / Ops
- Monorepo (backend Spring Boot + frontend Angular + infra Docker)
- Sécurité : JWT + multi-tenancy via header `X-Org-Id` (voir doc sécurité)
- Tests : couverture BE solide, FE unit tests, Playwright E2E (présents mais à stabiliser)

## TO-BE (MVP market-ready — cible)

### Axes produit (sans réduire le scope)
1) **CRM modulable multi-métiers** : statuts/types/règles gérés comme **référentiels tenant-scopés** + workflows par type de dossier  
   → Voir : `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`

2) **Choix B : WhatsApp Outbound réel** (market-ready)  
   - envoi provider + templates + retries/outbox + observabilité  
   → Voir : `docs/atlas-immobilier/03_technique/09_notifications.md`

3) **Consentement strict** (bloquant) pour tout outbound WhatsApp/SMS/Email

4) **Stabilisation QA** (anti-flaky E2E, critères release)

## Risques actuels (à traiter avant “marché”)
- E2E Playwright : fragilité de login/sélecteurs (timeouts) → fiabilisation P0
- Consentement : stocké mais pas encore systématiquement “bloquant” sur l’outbound
- Outbound provider : architecture à finaliser (outbox, retry, idempotence, monitoring)

## Références
- Contrats API : `docs/atlas-immobilier/03_technique/03_api_contracts.md`
- Roadmap : `docs/MVP_ROADMAP.md`
- État d’avancement : `docs/atlas-immobilier/05_roadmap/00_etat_avancement_mvp.md`

## Extension (TO-BE) — Coop Habitat
- Module de gestion de groupement/cooperative (membres, cotisations, allocation lots, jalons projet) — spécifié, non implémenté.
- Doc source : `docs/atlas-immobilier/02_fonctionnel/04_module_coop_habitat.md`.
