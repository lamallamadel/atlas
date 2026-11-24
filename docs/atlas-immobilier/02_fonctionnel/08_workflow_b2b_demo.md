# Workflow B2B Demo — Machine à états (MVP)

> **case_type_code**: `CRM_LEAD_B2B_DEMO`  
> **Statut**: implémenté (workflow système `DossierWorkflowCatalog`, étape 7 ; ADR 0004 phase B)  
> **Source of truth**: Oui (pour le pipeline B2B Demo)

## Statuts (`CASE_STATUS`)

| status_code | Libellé | Terminal |
|---|---|---|
| B2B_NEW | Nouveau | Non |
| B2B_QUALIFIED | Qualifié | Non |
| B2B_SCHEDULED | Démo planifiée | Non |
| B2B_DONE | Démo réalisée | Non |
| B2B_WON | Gagné | Oui |
| B2B_LOST | Perdu | Oui |

## Transitions autorisées

| transition_code | From | To | Rôles | Champs requis | Effets |
|---|---|---|---|---|---|
| B2B_T_QUALIFY | B2B_NEW | B2B_QUALIFIED | SALES, MANAGER | `qualification.notes` | LeadEvent `B2B_QUALIFIED` |
| B2B_T_SCHEDULE | B2B_QUALIFIED | B2B_SCHEDULED | SALES, MANAGER | `appointment` | crée/associe RDV + event |
| B2B_T_RESCHEDULE | B2B_SCHEDULED | B2B_SCHEDULED | SALES, MANAGER | `appointmentId` | maj RDV + event |
| B2B_T_MARK_DONE | B2B_SCHEDULED | B2B_DONE | SALES, MANAGER | appointment `DONE` | event `B2B_DEMO_DONE` |
| B2B_T_WIN | B2B_DONE | B2B_WON | SALES, MANAGER | optionnel `dealValue` | event `B2B_WON` |
| B2B_T_LOSE_NEW | B2B_NEW | B2B_LOST | SALES, MANAGER | `lostReasonCode` | event `B2B_LOST` |
| B2B_T_LOSE_QUAL | B2B_QUALIFIED | B2B_LOST | SALES, MANAGER | `lostReasonCode` | event `B2B_LOST` |
| B2B_T_LOSE_SCHED | B2B_SCHEDULED | B2B_LOST | SALES, MANAGER | `lostReasonCode` | cancel RDV (policy) |
| B2B_T_LOSE_DONE | B2B_DONE | B2B_LOST | SALES, MANAGER | `lostReasonCode` | event `B2B_LOST` |
| B2B_T_REOPEN | B2B_QUALIFIED | B2B_NEW | MANAGER | justification | event `REOPENED` (option) |
| B2B_T_REDO_DEMO | B2B_DONE | B2B_SCHEDULED | MANAGER | justification | new RDV (option) |

> `REOPEN` et `REDO_DEMO` peuvent être désactivées en MVP (manager-only + feature flag).

## Lost reasons (`B2B_LOST_REASON`)

- `B2B_LOST_NO_RESPONSE`
- `B2B_LOST_NO_BUDGET`
- `B2B_LOST_NOT_FIT`
- `B2B_LOST_COMPETITOR`
- `B2B_LOST_TIMING`
- `B2B_LOST_OTHER`

## Champs requis à la création (depuis `biz`)
- `case_type_code = CRM_LEAD_B2B_DEMO`
- `status_code = B2B_NEW`
- `source_code = BIZ_DEMO_FORM`
- `consent_contact = true`
- payload minimal : actorType, city, needs[] (+ option teamSize/listingVolume/plan/message)

## Notes d’implémentation (contrat)
- L’UI Pro consomme `GET /api/v1/dossiers/{id}/transitions` pour afficher les actions (carte « Statut » du dossier).
- Le changement de statut passe par `PATCH /api/v1/dossiers/{id}/status` avec `statusCode` ; un saut non autorisé répond 400.

## Écarts avec la spec (choix de l’implémentation)
- **Rôles** : `SALES` n’existe pas. Tout membre de l’agence fait les transitions ; `REOPEN` et `REDO_DEMO` sont réservées au manager (`MANAGER`, `ADMIN`, `SUPER_ADMIN`).
- **Exigences** :
  - `B2B_SCHEDULED` exige un rendez-vous non annulé sur le dossier ;
  - `B2B_LOST` exige une raison du référentiel `B2B_LOST_REASON` ;
  - `MARK_DONE` n’exige pas que le rendez-vous soit marqué « réalisé ».
- **Non implémentées** :
  - `B2B_T_RESCHEDULE` : déplacer le rendez-vous suffit ;
  - les événements `LeadEvent` dédiés : le changement de statut est journalisé dans l’historique et le fil d’activité ;
  - l’annulation automatique du rendez-vous à la perte.
- **Source du lead** : `VITRINE` (inchangé), pas `LEAD_SOURCE_BIZ_DEMO_FORM`.
- **Profil saisi** : ville, profil, taille d’équipe, volume d’annonces, offre et besoins sont gardés sur le dossier (`lead_details`, V162).
- **Écran** : kanban `/pro/b2b-demo` en lecture, une colonne par statut. Les transitions se font dans le détail du dossier.
