# Personas & périmètre

> **Statut**: Stable (cadrage)  
> **Dernière vérification**: 2026-01-08  
> **Source of truth**: Non (les référentiels/workflows restent la vérité pour statuts/transitions)  
> **Dépendances**:  
- `docs/PRODUCT_SPECS_SUMMARY.md`  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`  
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`  
- `docs/atlas-immobilier/02_fonctionnel/05_feature_flags_plans.md`

## Personas (cible produit)

### Core (MVP)
- **Agent / Conseiller** : qualifie et suit les Dossiers, planifie RDV, pilote son pipeline.
- **Responsable agence** : supervise KPI, SLA de traitement, réassignation, conversion.
- **Propriétaire / Vendeur / Bailleur** (direct ou indirect) : fournit infos, valide actions, suit avancement.
- **Modérateur** (interne) : traite signalements, suspensions, doublons/fraude, trace décisions.

### Extension (V1+)
- **Promoteur / Commercial neuf** : gère programmes + lots + showroom, suit les demandes.
- **Courtier / Partenaire financement** : traite des dossiers de financement et statuts associés.
- **Investisseur** : compare rendements, scénarios, sélectionne opportunités.
- **Gestionnaire locatif / Concierge** : opère incidents, prestations, calendrier, qualité service.
- **Responsable de coop / Groupement** : gouvernance, appels de fonds, allocation, jalons (module Coop).

## Périmètre fonctionnel (vision modulaire)

### 1) Core produit (socle commun)
- **Annonces** : création/édition/publication, médias, géoloc, règles de qualité, modération.
- **Dossiers** : CRUD, `case_type_code`, `status_code`, assignation, filtrage, scoring.
- **Timeline** : messages (WhatsApp/SMS/email/phone), appels, événements, tâches.
- **RDV** : visites/appels, relances, no‑show.
- **Audit** : journal de changements immuable (actions sensibles).
- **Consentements** : opt-in/out par canal et par personne.
- **Reporting** : dashboard KPI (funnel, délais, sources).

### 2) Trust layer
- Anti‑doublons (annonces / dossiers), signalements, workflow de modération.
- Vérification progressive (V1) : badges, KYC léger, politiques anti‑fraude.

### 3) Modules activables (feature flags)
- **Neuf / Promoteurs** : programmes, lots, disponibilités, RDV showroom.
- **Location** : dossier locataire, pièces, check‑list, modèle de bail.
- **Financement** : pré‑qualification, constitution dossier, routage partenaires.
- **Investissement** : yield/cashflow, scénarios, alertes.
- **Data quartier** : scores, POI, isochrones, comparateurs.
- **Gestion locative** : quittances, incidents, prestataires, suivi.
- **Conciergerie** : demandes services, planning, qualité.
- **Coop Habitat** : groupement, cotisations, allocation, suivi projet (après conformité).

## Périmètre par phase (recommandation d’exécution)

### MVP (priorité livraison)
Objectif : prouver la valeur “portail + CRM + WhatsApp + RDV + confiance basique”.

IN (MVP)
- Annonces : CRUD + publication + recherche/carte + signalement.
- Dossiers : capture (form/WhatsApp), déduplication, assignation, pipeline, tâches/notes.
- RDV : planification + statuts.
- Trust basique : anti‑doublons + modération manuelle.
- Conformité : consentements + audit + traçabilité.

OUT (MVP)
- Paiements, signature électronique avancée.
- KYC complet (stockage pièces) : V1.
- Financement pré‑accord : V1.
- Gestion locative complète : V1.5.
- Coop Habitat : V2 (après cadrage).

### V1 (extensions à forte valeur)
- Trust avancé (badges/KYC léger).
- Neuf (programmes/lots).
- Financement (pré‑qualification).
- Location (dossier locataire light).

### V1.5 / V2
- Gestion locative + conciergerie.
- Invest + data quartier.
- Coop Habitat (conformité + gouvernance validées).

## Remarques de cohérence “termes & référentiels”
- Les **statuts** utilisés par l’UI et l’API sont des **codes** (`*_STATUS_CODE`) définis dans :
  - `02_fonctionnel/03_referentiels_workflows_modulables.md`
  - `02_fonctionnel/00_nomenclature_codes.md`
- Les transitions doivent être validées par la machine à états (AS‑IS) et, à terme, par les workflows tenant‑scopés (TO‑BE).
