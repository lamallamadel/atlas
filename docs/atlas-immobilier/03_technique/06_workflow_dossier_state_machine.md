# Workflow Dossier — machine à états

## Objectif
Empêcher les transitions arbitraires et activer l’automatisation (notifications, scoring, audit enrichi).

## Modèle
- `DossierStatus` = enum.
- `Transition` = `{ from, to, guard, actions[] }`.

## Exemples de transitions
- NEW → QUALIFYING (guard: contact minimum)
- QUALIFYING → QUALIFIED (guard: critères de qualification remplis)
- QUALIFIED → APPOINTMENT (guard: RDV planifié)
- APPOINTMENT → WON / LOST (guard: outcome saisi)

## API & UI
- L’UI appelle `GET /dossiers/{id}/transitions` et affiche uniquement les transitions autorisées.
- L’UI exécute `POST /dossiers/{id}/transition`.

## Actions automatiques (hooks)
- Audit event enrichi (inclure reason/payload)
- Notifications (agent / manager)
- Scoring (optionnel)
- Création d’un Message système dans la timeline (optionnel)

## Tests
- Matrice de tests : chaque transition valide + transitions invalides.
- Tests multi-tenant : un tenant ne peut pas transitionner un dossier d’un autre tenant.

