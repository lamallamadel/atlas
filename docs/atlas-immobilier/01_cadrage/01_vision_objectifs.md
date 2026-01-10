# Vision & objectifs

> **Statut**: Stable (cadrage)  
> **Dernière vérification**: 2026-01-08  
> **Source of truth**: Non (document de vision — la taxonomie/workflows restent la vérité opérationnelle)  
> **Dépendances**:  
- `docs/PRODUCT_SPECS_SUMMARY.md`  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`  
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`

## Problème

Les portails d’annonces génèrent des contacts, mais n’adressent pas les irritants opérationnels du marché :
- **qualification** insuffisante et non traçable ;
- échanges **dispersés** (WhatsApp, téléphone, email) sans historique centralisé ;
- coordination difficile **multi-acteurs** (propriétaires, prospects, agents, prestataires, promoteurs, courtiers) ;
- **manque de confiance** (doublons, informations incomplètes, fraude) ;
- absence de **conformité** (consentements) et de **pilotage** (KPIs, SLA, conversion).

## Proposition de valeur (vision globale)

Atlas Immobilier est une **plateforme immobilière modulaire**, centrée sur le **Dossier (Case)** et pilotée par des **workflows configurables** (référentiels tenant‑scopés), qui unifie :

1) **Portail annonces (B2C)** : recherche, carte, fiche annonce, contact WhatsApp.  
2) **CRM “Lead‑to‑Deal” (B2B)** : capture, qualification, assignation, pipeline, RDV, timeline, reporting.  
3) **Trust layer** : anti‑doublons, modération, vérification progressive (badges/KYC).  
4) **Modules activables** : Neuf (promoteurs), Location longue durée, Financement, Investissement, Data quartier, Gestion locative, Conciergerie, Coop Habitat.

Le tout dans un produit unique (monorepo / architecture modulaire) afin d’éviter la dispersion multi‑outils et de maximiser la conversion.

## Objectifs (MVP → V1)

### Objectifs MVP (market-ready)
- **Publier et consommer** des annonces de qualité (règles de complétude + modération).  
- **Capturer et traiter** des demandes via Dossiers : qualification, assignation, suivi.  
- **Tracer** l’activité : timeline (messages/événements), audit immuable, consentements.  
- **Accélérer** la conversion : RDV/visites, relances, reporting basique.

> Référence “source of truth” pour statuts/transitions : `03_referentiels_workflows_modulables.md` + `00_nomenclature_codes.md`.

### Objectifs V1 (extensions à forte valeur)
- **Trust avancé** : badges, KYC léger (organisation / propriétaire), anti‑fraude renforcé.
- **Neuf / Promoteurs** : programmes, lots, disponibilité, RDV showroom.
- **Financement** : pré‑qualification, constitution dossier, routage courtiers/banques.
- **Location** : dossier locataire “light”, check‑list documentaire, contrat modèle.

### Objectifs V1.5 / V2 (selon traction & conformité)
- **Gestion locative** + **Conciergerie** (services, incidents, prestataires).
- **Investissement** (yield/cashflow) + **Data quartier** (scores, POI, isochrones).
- **Coop Habitat** (après cadrage juridique & gouvernance) : groupement, cotisations, allocation, projet.

## Principes structurants
- **Dossier‑centré** : tout passe par le Dossier (vente/location/mandat/projet/coop), avec un `case_type_code` et un `status_code`.  
- **Workflows modulables** : transitions contrôlées par “machines à états” (AS‑IS) → workflows configurables (TO‑BE).  
- **Multi‑tenancy** : isolation stricte via `org_id` (voir doc sécurité).  
- **Traçabilité** : audit event systématique sur actions sensibles + correlation‑id.  
- **Modularité produit** : modules activables par tenant (feature flags / entitlements).

## Indicateurs de succès (NSM & KPI)
- **North Star Metric (MVP)** : *RDV qualifiés planifiés / mois* (et taux de no‑show).  
- KPI opérationnels :
  - délai moyen lead→qualifié, qualifié→RDV ;
  - taux d’adoption CRM (WAU/MAU des utilisateurs Pro) ;
  - qualité annonces (complétude, doublons détectés, suspensions) ;
  - conversion pipeline (NEW → QUALIFIED → VISIT → OFFER → WON/LOST).

## Modèle économique (vision)
- **Abonnements B2B** (Agences / Promoteurs) : sièges, volume, modules.
- **Add‑ons** : Boost, Verified, Exports, Reporting+, intégrations.
- **Commissions** : financement (courtiers/banques), gestion locative/conciergerie.
- **Frais** : dossier location (si/selon modèle), services partenaires (photos, maintenance).

## Non-objectifs (court terme)
- Facturation et comptabilité complètes.
- Signature électronique avancée (possible plus tard).
- Multi‑DB / multi‑schémas : non retenu pour MVP+ (isolation `org_id`).

## Extension produit (TO-BE) — Coop Habitat / Habitat participatif

Atlas peut évoluer vers un module de gestion de **groupements d’habitat participatif** :
- membres, cotisations, allocation de lots (FIFO d’allocation),
- suivi projet (terrain → permis → chantier → livraison),
- transparence (audit + PV) et communication WhatsApp.

**Point critique** : cadrage juridique obligatoire avant commercialisation/public.
Voir : `docs/atlas-immobilier/02_fonctionnel/04_module_coop_habitat.md`.
