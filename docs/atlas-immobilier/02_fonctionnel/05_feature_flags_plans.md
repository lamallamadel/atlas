# Feature flags & Plans (modules activables)

> **Statut**: implémenté pour les modules bloquants (étape 7) ; plans et quotas encore à faire  
> **Dernière vérification**: 2026-11-24  
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
- `module.mandate_marketplace` : bourse aux mandats, propositions aux propriétaires (TO-BE, cas d'usage n°1) ; réservé aux agences vérifiées ; quota `quota.mandate_proposals_month` selon le plan

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

## Implémentation (étape 7, décidée le 2026-11-24)

- **Catalogue :** `entitlement/Feature`, qui reprend les clés ci-dessus plus `addon.esign` (signature électronique).
- **Stockage :** table `feature_flag` (`org_id`, `feature_key`, `enabled`), sans nouvelle migration.
  - Sans ligne, un module est **actif** : les agences existantes ne perdent rien.
  - Le socle `core.*` est toujours actif et ne peut pas être désactivé.
- **Contrôle :** `EntitlementService.require(feature)`, appelé par `@RequiresFeature` sur un contrôleur ou une méthode.
  - Un module désactivé répond 403 `FEATURE_DISABLED` avec sa clé.
  - `@SkipFeatureCheck` exempte un rappel de prestataire, comme le webhook DocuSign.
  - L'état est gardé en mémoire 30 secondes par instance.
- **Modules bloqués aujourd'hui :**
  - `module.coop_habitat` : les 5 contrôleurs Coop ;
  - `module.neuf` : programmes, lots, réservations de lots ;
  - `addon.export` : export des leads ;
  - `addon.esign` : signature électronique, sauf le webhook.

  L'export RGPD (`/data-export`) n'est jamais bloqué.
- **Gestion :** super-admin seulement, via `PUT /api/v1/admin/white-label/{orgId}/features/{key}?enabled=`, qui crée la ligne au besoin. `GET /api/v1/features` donne à l'écran l'état des modules de l'agence ; le bouton « Exporter » est masqué sans `addon.export`.
- **Pas encore :**
  - plans → modules (les plans du provisioning restent `starter` / `professional` / `enterprise`, avec leurs anciennes clés `whatsapp_integration`… non appliquées) ;
  - quotas (`maxDossiers` reste informatif ; seul le quota d'annonces est appliqué) ;
  - `module.trust.basic`, `addon.reporting_plus` et `addon.integrations` sont au catalogue mais non bloqués ;
  - le JSON `features` de la configuration white label n'est pas lu.
