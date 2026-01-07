# Atlas Immobilier — Périmètre produit (résumé)

> **Statut**: À jour (résumé produit)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`  
- `docs/atlas-immobilier/03_technique/09_notifications.md`

## Vision

Atlas Immobilier est un CRM immobilier conçu pour être **modulable** selon les métiers (agence location, transaction vente, mandats, promotion/construction), tout en restant **robuste** (traçabilité, conformité, multi-tenancy).

Le concept central est le **Dossier (Case)** : un dossier représente une affaire/processus (lead, transaction, mandat, projet) qui évolue dans un **workflow**.

## Concepts clés

### Dossier = Case universel
Un dossier a :
- un **type** (`caseType`) représentant le métier (lead, vente, location, mandat, projet…)
- un **statut** (`statusCode`) appartenant au workflow de ce type
- une **timeline** (notes, tâches, événements automatiques)
- des **rendez-vous**, **messages**, **consentements**, **parties prenantes**
- une traçabilité **audit + historique de statuts**

### Référentiels + workflows configurables (multi-métiers)
Les types/statuts/raisons/sources/etc. sont traités comme des **référentiels tenant-scopés** (data-driven), afin d’offrir :
- un maximum de cheminements possibles,
- une adaptation par organisation, sans redéploiement.

Référence : `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`

## MVP market-ready (cible)

### P0 (non négociable)
- Pipeline dossier (workflow) + historique
- Timeline lisible (notes + événements auto)
- Consentement strict (bloquant) pour outbound
- Audit trail sur les actions core
- Search/listing + dashboard minimal
- WhatsApp inbound + **WhatsApp outbound réel (Choix B)**

### P1
- Qualification (scoring simple)
- Rappels RDV (scheduler)
- Exports basiques (audit, dossiers)

## Hors périmètre immédiat (peut venir après)
- BI avancée, connecteurs multiples, automatisations complexes
