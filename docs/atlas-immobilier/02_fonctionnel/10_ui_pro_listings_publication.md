# UI Pro — Listings / Publications (MVP)

> **Domaine**: `pro.atlasia.ma`  
> **Route**: `/publications/listings/*`

## Vues

### Liste annonces
Filtres : statut, tx, ville/zone, auteur, période, suspect doublon, signalée.  
Colonnes : thumbnail, titre, tx, prix, ville/zone, `status_code`, qualité, trust, updatedAt, actions.

### Détail annonce
Onglets :
- Fiche (édition)
- Médias
- Qualité & Trust
- Signalements
- Audit/Historique

Actions statut (dropdown) : **pilotées par transitions** (`GET /listings/{id}/transitions`).

## Publication (règles MVP)
Publish exige :
- photos >= N
- champs obligatoires complétés
- pas de blocage modération
- trust (duplicateScore sous seuil ou override manager)

## Done
- Liste + détail + médias
- Transitions publish/suspend/archive
- Qualité + trust dédup minimal
- Lien “Voir sur le portail” pour publié
- Audit complet
