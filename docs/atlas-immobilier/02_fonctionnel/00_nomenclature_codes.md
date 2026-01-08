# Nomenclature des codes (référentiels & workflows)

> **Statut**: TO-BE (contrat de nomenclature — applicable dès maintenant à la documentation)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui (nomenclature)  
> **Dépendances**:  
> - `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`  
> - `docs/atlas-immobilier/02_fonctionnel/04_module_coop_habitat.md`

## Objectif

Éviter les collisions, ambiguïtés et dérives lorsque l’on augmente le nombre de *types*, *statuts* et *cheminements* (multi‑métiers immobilier + module Coop Habitat).

Cette nomenclature s’applique aux **codes stables** stockés en base (référentiels). Les libellés (FR/AR/EN) sont libres et traduisibles.

## Conventions globales

- **Format**: `UPPER_SNAKE_CASE`
- **Stabilité**: un code ne change jamais (on change uniquement le libellé)
- **Unicité**: un code est unique dans son référentiel (pas de doublons sémantiques)
- **Technique vs Métier**
  - **Technique stable** (peut rester enum code): `CHANNEL`, `DIRECTION`, `ROLE`
  - **Métier** (toujours data-driven): `CASE_TYPE`, statuts, raisons, sources, types RDV, etc.

## Préfixes recommandés

### CASE_TYPE (types de dossiers)

**CRM Immobilier**
- `CRM_LEAD_BUY`, `CRM_LEAD_RENT`, `CRM_OWNER_LEAD`
- `CRM_SALE_TRANSACTION`, `CRM_RENTAL_TRANSACTION`
- `CRM_MANDATE_SALE`, `CRM_MANDATE_RENT`
- `CRM_PROPERTY_LISTING`
- `CRM_PROJECT_CONSTRUCTION`, `CRM_PROJECT_RENOVATION`
- `CRM_INVESTOR_CASE`, `CRM_SUPPORT_DISPUTE`

**Coop Habitat**
- `COOP_GROUP` (groupement / coop)
- `COOP_PROJECT` (projet immobilier)
- Optionnels (si besoin de “cases” séparés): `COOP_MEMBER_CASE`, `COOP_ALLOCATION_CASE`

### CASE_STATUS (statuts)

- **CRM**: préfixe `CRM_` (ex: `CRM_NEW`, `CRM_CONTACTED`, `CRM_CLOSED_WON`)
- **Coop**: préfixes spécialisés (lisibilité + prévention collisions):
  - `COOP_GROUP_*` (ex: `COOP_GROUP_FUNDING_OPEN`)
  - `COOP_PROJECT_*` (ex: `COOP_PROJECT_BUILDING`)
  - `COOP_ALLOC_*` (ex: `COOP_ALLOC_ASSIGNED`)
  - `COOP_MEMBER_*` (ex: `COOP_MEMBER_IN_DEFAULT`)

## Raisons (recommandé)

Séparer CRM et Coop pour éviter de mélanger des justifications de “perte lead” avec des annulations/exclusions coop.

- CRM:
  - `CRM_LOSS_*` (ex: `CRM_LOSS_NO_RESPONSE`)
  - `CRM_WON_*` (ex: `CRM_WON_SIGNED`)
- Coop:
  - `COOP_CANCEL_*` (ex: `COOP_CANCEL_PERMITS_DENIED`)
  - `COOP_MEMBER_*` (ex: `COOP_MEMBER_DEFAULT_PAYMENT`) — si nécessaire comme raison

## Activity / timeline

Conserver un tronc commun (générique), et porter la spécificité via un `subTypeCode` (ou `categoryCode`) pour la Coop.

- Tronc commun:
  - `ACT_NOTE`, `ACT_TASK`, `ACT_STATUS_CHANGE`, `ACT_MESSAGE_LOG`, `ACT_APPOINTMENT_LOG`, `ACT_DOCUMENT_LOG`, `ACT_SYSTEM`
- Sous-types Coop (exemples):
  - `COOP_CALL_FOR_FUNDS_SENT`, `COOP_PAYMENT_DECLARED`, `COOP_PAYMENT_VERIFIED`, `COOP_ALLOCATION_ASSIGNED`, `COOP_PROJECT_MILESTONE_REACHED`

## Règles de validation associées

1) Un workflow `COOP_*` ne peut référencer que des statuts `COOP_*`.  
2) Les terminaux par défaut:
   - CRM: `CRM_CLOSED_WON`, `CRM_CLOSED_LOST`
   - Coop: `COOP_*_CANCELLED` et `COOP_*_COMPLETED`  
3) Les preuves documentaires requises (Coop):
   - `COOP_ALLOC_APPROVED` exige un document décisionnel (PV/acte d’allocation).
4) En cas de défaut paiement:
   - passage `COOP_MEMBER_IN_DEFAULT` génère automatiquement une tâche de suivi (`ACT_TASK` + `subTypeCode=COOP_DEFAULT_FOLLOWUP`).

