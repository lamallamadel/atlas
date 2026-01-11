# UI Pro CRM — B2B Demo (MVP)

> **Domaine**: `pro.atlasia.ma`  
> **Route**: `/crm/b2b-demo/*`  
> **case_type_code**: `CRM_LEAD_B2B_DEMO`

## Vues

### Kanban (par défaut)
Colonnes = `B2B_NEW`, `B2B_QUALIFIED`, `B2B_SCHEDULED`, `B2B_DONE`, `B2B_WON`, `B2B_LOST`.

Carte dossier : contact, ville, score, tags needs, indicateur RDV, assignee.

### Liste (table)
Filtres : statut, assignee, ville, actorType, date, recherche.

## Détail dossier
Drawer/page avec onglets :
- Résumé
- RDV
- Timeline
- Notes & tâches

## Actions / transitions (principe clé)
L’UI ne hardcode pas : elle appelle `GET /cases/{id}/transitions` et affiche uniquement les actions autorisées.
Modals :
- Lost (raison obligatoire)
- Schedule (appointment)
- Win (optionnel)

## Done
- Kanban + Liste + Détail
- Transitions via `allowedTransitions`
- LostReason obligatoire
- RDV intégré SCHEDULED/DONE
- Timeline cohérente
