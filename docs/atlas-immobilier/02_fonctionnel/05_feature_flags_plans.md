# Feature flags & Plans (modules activables)

> **Statut**: TO-BE (contrat produit/tech — applicable dès maintenant à la doc)  
> **Dernière vérification**: 2026-01-08  
> **Source of truth**: Oui (nomenclature des clés de modules + entitlements)  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/01_architecture_decisions.md`  
- `docs/atlas-immobilier/03_technique/04_security_multi_tenancy.md`  
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`

## Objectif
Permettre une **plateforme unique** avec des **modules activables** par organisation (`org_id`), sans dupliquer les produits.

Le backend reste la **source de vérité** :
- l’UI masque/affiche (confort)
- l’API **enforce** (403/limit) selon l’entitlement

## Convention de clés (stable)
- `core.*` : capacités socle
- `module.*` : modules activables
- `addon.*` : add-ons monétisables
- `exp.*` : expérimentations

## Catalogue (v0)

### Core (socle)
- `core.identity` : Auth, users, RBAC
- `core.annonce` : Annonces CRUD + publication + médias
- `core.search` : recherche + carte
- `core.dossier` : Dossiers/CRM basique (pipeline, assignation)
- `core.rdv` : RDV/visites
- `core.timeline` : messages + événements
- `core.audit` : audit immuable
- `core.consent` : consentements

### Modules
- `module.trust.basic` : déduplication + modération (MVP)
- `module.trust.kyc` : badges + KYC léger (V1)
- `module.neuf` : promoteurs / programmes / lots (V1)
- `module.location` : dossier locataire (V1)
- `module.financement` : pré‑qualification & routage partenaires (V1)
- `module.invest` : rendement & scénarios (V1.5)
- `module.quartier` : data quartier, scores (V1.5)
- `module.gestion_locative` : incidents, quittances, prestataires (V1.5)
- `module.conciergerie` : services courte durée (V1.5)
- `module.coop_habitat` : groupement/cotisations/allocation/projet (V2 — conformité)

### Add-ons
- `addon.boost` : mise en avant / ranking
- `addon.verified` : vérification renforcée annonce
- `addon.export` : exports (audit/dossiers)
- `addon.reporting_plus` : reporting avancé
- `addon.integrations` : connecteurs (WhatsApp Business API, webhooks, partenaires)

## Modèle d’entitlements (par org)
Recommandation : table `org_feature` (ou équivalent) :
- `org_id`
- `feature_key`
- `enabled`
- `limits_json`

### Schéma de limites (standard)
- `limits.users.seats_max`
- `limits.annonces.published_max`
- `limits.dossiers.monthly_max`
- `limits.exports.monthly_max`
- `limits.boosts.monthly_max`
- `limits.trust.duplicate_threshold` (0..100)

## Plans (packaging initial)

### `plan.free` (B2C)
- core.search ✅
- core.annonce ⚠️ (option “owner publishing” limité)
- core.dossier ❌
- modules ❌

### `plan.pro_starter` (agence)
- core.* ✅ (identity, annonce, search, dossier, rdv, timeline, audit, consent)
- module.trust.basic ✅
- add-ons : boost/export (option)
- limites typiques : seats=3, annonces=50, dossiers/mois=300

### `plan.pro_growth` (agence)
- pro_starter + export + reporting_plus
- module.trust.kyc (option)
- limites supérieures : seats=10, annonces=200, dossiers/mois=1500

### `plan.promoteur`
- core.* ✅
- module.neuf ✅
- module.trust.basic ✅
- limites adaptées (programmes/lots)

### `plan.enterprise`
- modules (sauf coop si non validé) + intégrations + limites custom

## Notes d’implémentation (contrat)
- Un check unique : `Entitlements.check(orgId, featureKey)`
- Annotation/middleware : `@RequiresFeature("module.trust.basic")`
- Quotas : `QuotaService.assertWithinLimit(orgId, "limits.dossiers.monthly_max")`
