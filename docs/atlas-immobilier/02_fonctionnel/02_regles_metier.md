# Règles métier (politiques transverses)

> **Statut**: En partie implémenté (AS-IS) + politiques market-ready (TO-BE)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui (pour les règles transverses)  
> **Dépendances**:  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`  
- `docs/atlas-immobilier/03_technique/09_notifications.md`  
- `docs/atlas-immobilier/03_technique/05_audit_logging_design.md`
- `docs/atlas-immobilier/02_fonctionnel/00_nomenclature_codes.md`

Ce document centralise les règles applicables **à tous les métiers** (vente, location, mandat, projet) afin d’éviter des divergences.

## 1) Workflow dossier (statuts, transitions)

### AS-IS
- Transitions validées côté backend
- Historique des changements de statut (status_history)

### TO-BE (multi-métiers)
- Les statuts/types deviennent des **référentiels tenant-scopés** + workflow configurable par `caseType`.  
  Référence : `03_referentiels_workflows_modulables.md`

### Politiques obligatoires
- `CRM_CLOSED_WON` et `CRM_CLOSED_LOST` sont terminaux (override admin possible)
- Passage vers `CRM_CLOSED_LOST` impose `LOSS_REASON`
- Passage vers `CRM_CLOSED_WON` impose `WON_REASON`

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

## 6) Coop Habitat (TO-BE) — règles de gouvernance & cotisation

> **Périmètre** : module “Coop Habitat” (groupement).  
> **Source of truth** : `docs/atlas-immobilier/02_fonctionnel/04_module_coop_habitat.md`.

### 6.1 FIFO d’allocation (et non FIFO de livraison)
- Le rang FIFO détermine la **priorité d’attribution** d’un lot.
- La livraison dépend des jalons du projet (`COOP_PROJECT`) ; un lot peut être “attribué” avant d’être livrable.

### 6.2 Éligibilité à l’allocation (cut-off)
- Un membre est éligible à l’allocation si :
  - `member_status=ACTIVE`,
  - contributions à jour à la date de cut-off (ex: toutes les échéances <= cut-off confirmées),
  - absence de blocage (litige / suspension), si activé par la gouvernance.

### 6.3 Cotisation croissante (indexation) — règle de transparence
- Toute formule d’indexation doit être :
  - lisible (table d’échéances + explication),
  - versionnée (changement de formule = nouvelle version + notification),
  - tracée (audit + PV si décision collective).

### 6.4 Preuve & audit (obligatoire)
- Toute décision critique doit être justifiée par un document (PV/contrat) attaché et auditée :
  - ouverture/fermeture de collecte,
  - validation d’une allocation,
  - exclusion/remplacement d’un membre,
  - modification des règles financières.

### 6.5 Notifications obligatoires (Choix B)
- Appels de fonds, rappels, allocations et jalons projet déclenchent des notifications outbound (WhatsApp) via Outbox (voir `03_technique/09_notifications.md`).