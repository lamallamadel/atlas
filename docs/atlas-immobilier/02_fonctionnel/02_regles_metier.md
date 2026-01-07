# Règles métier (politiques transverses)

> **Statut**: En partie implémenté (AS-IS) + politiques market-ready (TO-BE)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui (pour les règles transverses)  
> **Dépendances**:  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`  
- `docs/atlas-immobilier/03_technique/09_notifications.md`  
- `docs/atlas-immobilier/03_technique/05_audit_logging_design.md`

Ce document centralise les règles applicables **à tous les métiers** (vente, location, mandat, projet) afin d’éviter des divergences.

## 1) Workflow dossier (statuts, transitions)

### AS-IS
- Transitions validées côté backend
- Historique des changements de statut (status_history)

### TO-BE (multi-métiers)
- Les statuts/types deviennent des **référentiels tenant-scopés** + workflow configurable par `caseType`.  
  Référence : `03_referentiels_workflows_modulables.md`

### Politiques obligatoires
- `CLOSED_WON` et `CLOSED_LOST` sont terminaux (override admin possible)
- Passage vers `CLOSED_LOST` impose `LOSS_REASON`
- Passage vers `CLOSED_WON` impose `WON_REASON`

## 2) Consentement & communications (STRICT — market-ready)

### Principe
Toute communication sortante non triviale doit être conforme. Politique : **deny by default**.

### Règle bloquante
- Si `direction=OUTBOUND` et `channel in (WHATSAPP, SMS, EMAIL)`  
  → consentement **GRANTED** requis (sinon refus).

### Preuve (TO-BE)
Un consentement GRANTED doit transporter une preuve minimale (meta) :
- source (`UI`, `WHATSAPP_INBOUND`, `IMPORT`, etc.)
- texte de preuve / référence (selon process)
- timestamp (ou usage des champs created_at)

## 3) Messages (journalisation + traçabilité)

- Tout message est rattaché à un dossier (case).
- Tout OUTBOUND :
  - est bloqué sans consentement
  - crée un audit event + activity `MESSAGE_LOG`
- Inbound WhatsApp :
  - association dossier (téléphone) + idempotence

## 4) Rendez-vous (RDV)

- Un RDV est rattaché à un dossier.
- Création/modification RDV :
  - crée un audit event
  - crée une activity `APPOINTMENT_LOG`
- Chevauchement : warning minimum, blocage optionnel selon org.

## 5) Multi-tenancy (isolement)

- Toute donnée est scoped par organisation.
- Aucun endpoint ne doit permettre une fuite inter-tenant.
- Le header `X-Org-Id` (ou mécanisme équivalent) est obligatoire et validé côté backend.

Référence : `docs/atlas-immobilier/03_technique/04_security_multi_tenancy.md`

## 6) Audit & historique

Politiques :
- Toutes les opérations core (dossier, statut, message, rdv, consentement) génèrent un audit event.
- Les changements de statut génèrent status_history + activity `STATUS_CHANGE`.
