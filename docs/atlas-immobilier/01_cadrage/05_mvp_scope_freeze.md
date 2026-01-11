# MVP — Scope Freeze (Atlasia)

> Objectif : figer le périmètre fonctionnel MVP pour exécution (éviter l’élargissement de scope).

## Périmètre MVP — inclus

### 1) Portail annonces (public) — `atlasia.<tld>`
- Listing search (recherche + filtres basiques) : ville/zone, transaction, budget, critères.
- Page détail annonce (slug + canonical).
- Contact annonce (création lead B2C) avec consentement.
- Signalement annonce (report) avec motif + commentaire.
- Visibilité : seules les annonces **publiées** sont visibles.

Docs :
- `docs/atlas-immobilier/02_fonctionnel/06_portail_annonces_mvp.md`
- `docs/atlas-immobilier/04_qa_prod/03_e2e_acceptance_mvp.md`

### 2) Vitrine corporate (B2B) — `biz.atlasia.<tld>`
- Landing, pages verticales (Agences / Promoteurs), Tarifs, Démo.
- Tracking UX `biz_*` (sans PII) + SEO vitrine.
- Formulaire Démo → création d’un dossier B2B dans le CRM Pro.

Docs :
- `docs/atlas-immobilier/02_fonctionnel/07_site_vitrine_biz_mvp.md`
- `docs/atlas-immobilier/02_fonctionnel/11_biz_seo_tracking.md`
- `docs/atlas-immobilier/02_fonctionnel/08_workflow_b2b_demo.md`

### 3) Pro (CRM) — `pro.atlasia.<tld>`
#### 3.1 Pipeline B2B Demo
- Kanban + Liste + Détail dossier.
- Actions 100% pilotées par `allowedTransitions`.
- Qualification, assignation, RDV (planification / replanification / done), LOST (raison obligatoire), WON.

Docs :
- `docs/atlas-immobilier/02_fonctionnel/09_ui_pro_crm_b2b_demo.md`
- `docs/atlas-immobilier/03_technique/12_api_pro_crm_b2b_demo.md`

#### 3.2 Publications / Listings
- CRUD annonce (brouillon → publication → suspension/archivage).
- Médias (upload / ordre / photo principale).
- Qualité (score + manquants) ; Trust (duplicate_score + override manager).
- Reports visibles côté Pro + actions (clore report, suspendre annonce).

Docs :
- `docs/atlas-immobilier/02_fonctionnel/10_ui_pro_listings_publication.md`
- `docs/atlas-immobilier/03_technique/13_api_pro_listings.md`

---

## Hors périmètre MVP (V1+)
- Paiement en ligne / abonnements (facturation, Stripe) — V1.
- Matching IA avancé, recommandations personnalisées — V1+.
- “Multi-portails” (syndication vers autres portails) — V1+.
- Messagerie temps réel complète (chat omnicanal) — V1+.
- Gestion avancée promoteurs (lots, stocks, réservations) — V1.
- Multi-langues complètes (FR/AR) — V1 (MVP = FR).

---

## Contraintes & hypothèses
- Source of truth des codes : référentiel `*_code` (voir doc de freeze ci-dessous).
- Multi-tenant : isolation stricte par org.
- “Pro” est authentifié ; Portail/Biz publics.

---

## Definition of Done (MVP)
- Les scénarios “E2E Acceptance Criteria” sont réalisables fonctionnellement :
  `docs/atlas-immobilier/04_qa_prod/03_e2e_acceptance_mvp.md`
- Les contrats API Pro/Public existent et sont cohérents avec les transitions.
- L’arborescence & déploiement (MVP) documentés :
  `docs/atlas-immobilier/03_technique/14_repo_layout_deploiement.md`
