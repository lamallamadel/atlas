# Vision & objectifs

> **Statut**: Stable (cadrage)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/PRODUCT_SPECS_SUMMARY.md`
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`

## Problème
Les plateformes d’annonces génèrent des contacts, mais n’adressent pas les irritants opérationnels :
- qualification insuffisante et non traçable,
- échanges dispersés (WhatsApp, téléphone, email) sans historique centralisé,
- coordination difficile multi-acteurs (propriétaires, prospects, agents, prestataires),
- absence de conformité (consentements, audit) et de pilotage (KPIs).

## Objectif produit
Transformer une annonce en **processus CRM** complet, mesurable et pilotable, avec :
- centralisation des informations (Annonce, Dossier, Parties prenantes),
- pipeline de statuts avec règles métier,
- historisation (messagerie + audit),
- conformité (consentement, sécurité, multi-tenancy),
- reporting et automatisations (notifications, workflow).

## Non-objectifs (court terme)
- Facturation, gestion comptable.
- Signature électronique avancée.
- Multi-DB ou multi-schémas : non retenu pour le MVP+ (voir multi-tenancy org_id).
