# Workflow B2B Demo — Machine à états (MVP)

> **case_type_code**: `CRM_LEAD_B2B_DEMO`  
> **Statut**: TO-BE (cible MVP)  
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
- `source_code = LEAD_SOURCE_BIZ_DEMO_FORM`
- `consent_contact = true`
- payload minimal : actorType, city, needs[] (+ option teamSize/listingVolume/plan/message)

## Notes d’implémentation (contrat)
- L’UI Pro doit consommer `GET /cases/{id}/transitions` pour afficher les actions.
- Le backend doit refuser les sauts non autorisés (409/400).
