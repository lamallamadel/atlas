# Atlas Immobilier — Documentation Produit & Spécifications

> **Version**: voir `VERSION.txt` (v0.7, réalignée sur le code le 2026-11-23)  
> **Statut**: Stable  
> **Source of truth**: Non (index)  
> **Dépendances**:  
- `docs/atlas-immobilier/05_roadmap/00_etat_avancement_mvp.md`

Ce dossier regroupe le **cahier des charges**, les **spécifications fonctionnelles**, les **spécifications techniques** et la **roadmap** d’Atlas Immobilier (CRM immobilier, marché marocain).

## Comment lire cette documentation
- **Ce qui existe** : `05_roadmap/00_etat_avancement_mvp.md` (seul document AS-IS, réécrit depuis le code).
- **Ce qui reste à faire, dans l’ordre** : `05_roadmap/02_backlog_mvp_execution.md`.
- **Codes et statuts** : `02_fonctionnel/00_nomenclature_codes.md` fait foi ; `12_referential_freeze_mvp.md` en est le sous-ensemble MVP.
- **Décisions d’architecture** : `docs/adr/`.
- Les documents marqués **TO-BE** décrivent une cible, pas l’existant.
- `docs/archive/` contient l’historique ; ce n’est pas une spec.

## Stack réelle (2026-11)
Spring Boot 4.0.3 / Java 25 · Angular 21 · services IA Python (`brain/`) · PostgreSQL 16 (H2 en local) · Keycloak · API WhatsApp Cloud de Meta · prod sur `afroware.app`.

## Organisation
- `01_cadrage/` : vision, objectifs, scope, personas
- `02_fonctionnel/` : user stories, règles métier, écrans
- `03_technique/` : architecture, API, données, sécurité
- `04_qa_prod/` : tests, CI, exploitation, checklists
- `05_roadmap/` : planification par sprints, dépendances
- `CHANGELOG.md` : évolutions et correctifs clés (dont corrections de tests FE)

## Démarrage local
Voir le `CLAUDE.md` à la racine du dépôt et `03_technique/17_runbook_dev_deploy_mvp.md`.

Les détails (headers, rôles, obtention du token, isolation tenant) sont décrits dans `03_technique/04_security_multi_tenancy.md`.

## Coop Habitat
Backend en place (groupes, membres, projets, lots, cotisations), aucun écran. Spec : `02_fonctionnel/04_module_coop_habitat.md`.


## Modularité (plateforme unique)

- Modules activables (plans/entitlements) : `02_fonctionnel/05_feature_flags_plans.md`
- RBAC (rôles/permissions) : `03_technique/10_rbac_permissions.md`
- Dictionnaire de données (Core) : `03_technique/11_data_dictionary_core.md`
- Glossaire : `01_cadrage/03_glossaire.md`


## MVP — 3 sites (Portail + Biz + Pro)

En pratique, une seule application Angular sur `afroware.app` : portail sur `/`, vitrine sur `/biz`, espace Pro sur `/pro`. Les domaines `atlasia.*` ci-dessous sont la cible de marque, pas l’existant (voir `01_cadrage/04_branding_domains.md`).


- **Portail public** (`atlasia.ma`) : `docs/atlas-immobilier/02_fonctionnel/06_portail_annonces_mvp.md`
- **Site vitrine B2B** (`biz.atlasia.ma`) : `docs/atlas-immobilier/02_fonctionnel/07_site_vitrine_biz_mvp.md`
- **Cas d'usage n°1 — propriétaire et bourse aux mandats** (TO-BE) : `docs/atlas-immobilier/02_fonctionnel/13_uc_proprietaire_mandats.md` (modèle : `docs/adr/0005-proprietaire-organisation-personnelle-et-mandat.md`)
- **Espace Pro** (`pro.atlasia.ma`) :
  - Pipeline B2B Demo : `docs/atlas-immobilier/02_fonctionnel/09_ui_pro_crm_b2b_demo.md`
  - Publications / Listings : `docs/atlas-immobilier/02_fonctionnel/10_ui_pro_listings_publication.md`

> Convention domaines: `www.atlasia.ma` redirige en 301 vers `atlasia.ma`.
- Arborescence du projet & déploiement (MVP) : `docs/atlas-immobilier/03_technique/14_repo_layout_deploiement.md`

