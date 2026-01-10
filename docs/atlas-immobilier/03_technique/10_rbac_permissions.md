# RBAC — Rôles & Permissions (contrat)

> **Statut**: TO-BE (contrat sécurité — compatible avec l’implémentation Week 3)  
> **Dernière vérification**: 2026-01-08  
> **Source of truth**: Oui (catalogue permissions + matrice par défaut)  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/04_security_multi_tenancy.md`  
- `docs/atlas-immobilier/03_technique/03_api_contracts.md`  
- `docs/atlas-immobilier/02_fonctionnel/05_feature_flags_plans.md`

## Objectif
Standardiser :
- un **catalogue de permissions** stable,
- une **matrice rôles × permissions** par défaut,
- une trajectoire d’implémentation (Keycloak + mapping côté backend).

## Rôles (MVP)
- `ADMIN_ORG` : admin organisation (users, config, accès complet org)
- `MANAGER` : manager (vision équipe, réassignations, reporting)
- `AGENT` : conseiller (traitement dossiers assignés, annonces)
- `OWNER` : propriétaire/bailleur (ses annonces + dossiers associés)
- `MODERATOR` : modération (scope contenu + décisions, sans data commerciale inutile)

## Catalogue de permissions (v0)

### Organisation / Users
- `ORG_READ`, `ORG_UPDATE_SETTINGS`
- `USER_READ`, `USER_CREATE`, `USER_UPDATE`, `USER_DISABLE`
- `ROLE_MANAGE`
- `BILLING_READ`, `BILLING_MANAGE` (si activé)

### Annonces
- `ANNONCE_READ_PUBLIC`
- `ANNONCE_READ_ORG`
- `ANNONCE_CREATE`, `ANNONCE_UPDATE`
- `ANNONCE_PUBLISH`, `ANNONCE_ARCHIVE`
- `MEDIA_UPLOAD`, `MEDIA_DELETE`

### Dossiers / CRM
- `DOSSIER_READ_ORG`, `DOSSIER_READ_ASSIGNED`
- `DOSSIER_CREATE`, `DOSSIER_UPDATE`
- `DOSSIER_ASSIGN`
- `DOSSIER_CHANGE_STATUS`
- `DOSSIER_ADD_NOTE`, `DOSSIER_ADD_TASK`
- `DOSSIER_EXPORT`

### RDV
- `RDV_READ_ORG`
- `RDV_CREATE`, `RDV_UPDATE`, `RDV_CHANGE_STATUS`

### Trust / Modération
- `REPORT_CREATE`
- `MODERATION_QUEUE_READ`, `MODERATION_DECIDE`
- `DUPLICATE_SIGNAL_READ`, `DUPLICATE_SIGNAL_OVERRIDE`

### Audit / Consent
- `AUDIT_READ`, `AUDIT_EXPORT`
- `CONSENT_READ`, `CONSENT_EXPORT`

### Reporting
- `REPORTING_BASIC_READ`
- `REPORTING_ADV_READ`

## Matrice par défaut (MVP)
Légende : ✅ autorisé, ⚠️ conditionnel, ❌ interdit

| Permission | ADMIN_ORG | MANAGER | AGENT | OWNER | MODERATOR |
|---|---:|---:|---:|---:|---:|
| ORG_READ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| ORG_UPDATE_SETTINGS | ✅ | ❌ | ❌ | ❌ | ❌ |
| USER_* | ✅ | ❌ | ❌ | ❌ | ❌ |
| ROLE_MANAGE | ✅ | ❌ | ❌ | ❌ | ❌ |
| BILLING_* | ✅ | ❌ | ❌ | ❌ | ❌ |
| ANNONCE_READ_PUBLIC | ✅ | ✅ | ✅ | ✅ | ✅ |
| ANNONCE_READ_ORG | ✅ | ✅ | ✅ | ✅ (own) | ✅ (moderation scope) |
| ANNONCE_CREATE/UPDATE | ✅ | ✅ | ✅ | ✅ | ❌ |
| ANNONCE_PUBLISH/ARCHIVE | ✅ | ✅ | ✅ (policy) | ✅ (policy) | ❌ |
| MEDIA_UPLOAD/DELETE | ✅ | ✅ | ✅ | ✅ | ❌ |
| DOSSIER_READ_ORG | ✅ | ✅ | ⚠️ | ⚠️ | ❌ |
| DOSSIER_READ_ASSIGNED | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| DOSSIER_ASSIGN | ✅ | ✅ | ❌ | ❌ | ❌ |
| DOSSIER_CHANGE_STATUS | ✅ | ✅ | ✅ (assigned) | ⚠️ | ❌ |
| DOSSIER_ADD_NOTE/TASK | ✅ | ✅ | ✅ (assigned) | ⚠️ | ❌ |
| RDV_* | ✅ | ✅ | ✅ (assigned) | ⚠️ | ❌ |
| REPORT_CREATE | ✅ | ✅ | ✅ | ✅ | ✅ |
| MODERATION_QUEUE_READ/DECIDE | ❌ | ❌ | ❌ | ❌ | ✅ |
| AUDIT_READ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ (scope) |
| AUDIT_EXPORT | ✅ | ✅ | ❌ | ❌ | ⚠️ |
| REPORTING_BASIC_READ | ✅ | ✅ | ✅ (own) | ✅ (own) | ⚠️ |

## Notes d’implémentation
- Les rôles sont fournis par Keycloak (realm/client roles) et mappés côté backend.
- Les checks doivent être faits **au service layer** (pas uniquement contrôleur).
- Actions sensibles à auditer : publish/archive annonce, réassignation dossier, décision modération, export.
