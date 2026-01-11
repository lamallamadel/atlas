# Atlas Immobilier — Périmètre produit (résumé)

> **Statut**: À jour (résumé produit)  
> **Dernière vérification**: 2026-01-10  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`  
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`  
- `docs/atlas-immobilier/02_fonctionnel/05_feature_flags_plans.md`  
- `docs/atlas-immobilier/03_technique/14_repo_layout_deploiement.md`
- `docs/atlas-immobilier/03_technique/09_notifications.md`

## Vision

Atlas Immobilier est une plateforme (portail + CRM) conçue pour être **modulable par métier** tout en restant **robuste** :
- multi‑tenancy `org_id`,
- workflows contrôlés,
- traçabilité (timeline + audit),
- conformité (consentements).

Le concept central est le **Dossier (Case)** : un dossier représente une intention/activité (lead, transaction, mandat, projet, coop) qui évolue dans un **workflow**.

## Concepts clés
- **Annonce** : bien publié (vente/location) + qualité + modération.
- **Dossier** : capture/qualification/assignation + `case_type_code` + `status_code`.
- **Timeline** : messages (WhatsApp/SMS/email/phone), événements, tâches, RDV.
- **Workflows** : transitions autorisées (AS‑IS) puis configurables tenant‑scopés (TO‑BE).
- **Trust layer** : déduplication, signalement, modération, vérification progressive.
- **Feature flags / plans** : modules activables par organisation + quotas.

## Modules (catalogue)
### Core (MVP)
- Annonces (CRUD + publication + recherche/carte)
- Dossiers (CRM basique : pipeline, assignation, filtres)
- RDV/Visites
- Timeline (messages/événements)
- Audit + consentements
- Reporting basique

### Extensions (V1+)
- Trust avancé (badges/KYC léger)
- Neuf / Promoteurs (programmes, lots)
- Location (dossier locataire)
- Financement (pré‑qualification + partenaires)
- Investissement + Data quartier (V1.5)
- Gestion locative + Conciergerie (V1.5)
- Coop Habitat (V2 — sous réserve conformité)

## Hors périmètre immédiat
- BI avancée, connecteurs multiples, automatisations complexes
- Comptabilité/facturation
- Signature électronique avancée

## Extension produit (TO-BE) — Coop Habitat

Doc central : `docs/atlas-immobilier/02_fonctionnel/04_module_coop_habitat.md`.

Note : ce module est juridiquement sensible ; il doit être cadré avant exposition publique.


## MVP — 3 sites (public + corporate + pro)

- Portail annonces : `atlasia.ma` (spec: `docs/atlas-immobilier/02_fonctionnel/06_portail_annonces_mvp.md`)
- Site vitrine corporate : `biz.atlasia.ma` (spec: `docs/atlas-immobilier/02_fonctionnel/07_site_vitrine_biz_mvp.md`)
- Espace Pro/CRM : `pro.atlasia.ma` (B2B Demo + Listings)


> Note: la marque **Atlasia** est conservée en phase dev; le TLD final (ex: `.ma` / `.immo`) reste à figer. Voir : `docs/atlas-immobilier/01_cadrage/04_branding_domains.md`.
