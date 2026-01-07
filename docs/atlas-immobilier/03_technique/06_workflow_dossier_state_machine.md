# Workflow Dossier — machine à états

> **Statut**: Implémenté (AS-IS) + trajectoire vers workflow configurable (TO-BE)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Oui (pour la logique workflow dossier)  
> **Dépendances**:  
- `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`  
- `docs/atlas-immobilier/03_technique/05_audit_logging_design.md`

## Objectif

Garantir que les dossiers suivent des cheminements contrôlés (transitions autorisées), avec traçabilité complète :
- validation des transitions
- historique des statuts
- audit event
- timeline (activity)

## AS-IS (implémentation actuelle)

### Fonctionnement
- Le backend expose une logique de validation de transitions de statut.
- Les transitions autorisées sont contrôlées côté service.
- Les changements de statut alimentent un historique (status_history).

### Limites
- Le modèle est principalement “single workflow” et dépend d’un set de statuts codé.
- L’ajout de nouveaux métiers (ex : construction, mandat) nécessite une évolution code.

## TO-BE (cible modulable)

### Principes
- `caseType` détermine le workflow du dossier.
- Les statuts et transitions sont configurés via :
  - référentiels tenant-scopés
  - workflow_definition (states + transitions + règles)
- L’UI n’affiche que les transitions atteignables.

Référence : `docs/atlas-immobilier/02_fonctionnel/03_referentiels_workflows_modulables.md`

## Règles transverses (gouvernance)

- `CLOSED_WON` / `CLOSED_LOST` : terminaux par défaut
- `CLOSED_LOST` exige `LOSS_REASON`
- `CLOSED_WON` exige `WON_REASON`

## Effets de bord obligatoires (observables)

À chaque transition de statut :
1) Une entrée est ajoutée dans **status_history**
2) Un **audit_event** est produit (diff before/after)
3) Une activity `STATUS_CHANGE` est ajoutée à la timeline

## Contrats (API) — principe

- Patch statut : endpoint de modification de statut (AS-IS)
- En cible : endpoint “list transitions” (TO-BE) pour alimenter l’UI (transitions possibles depuis l’état courant)

Référence : `docs/atlas-immobilier/03_technique/03_api_contracts.md`

## Tests attendus

### AS-IS
- Matrice de tests : transitions valides + transitions interdites

### TO-BE
- Tests de workflow “par type” : chaque caseType charge son workflow et valide les transitions attendues.
