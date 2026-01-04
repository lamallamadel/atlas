# Messagerie & timeline — backend + frontend

## Backend
### Endpoints
- `POST /api/dossiers/{id}/messages`
- `GET /api/dossiers/{id}/messages`

### Validation
- Si message sortant : vérifier consentement.
- Normaliser `occurredAt` (si fourni) sinon `createdAt`.

### Sécurité
- `org_id` obligatoire + filtrage.

## Frontend (Angular)
### Service
- `MessageApiService`
  - `listByDossier(dossierId, filters)`
  - `create(dossierId, payload)`

### Composant timeline
- Intégration dans le détail Dossier :
  - onglet “Activité” ou bloc latéral CRM
  - affichage chronologique, badges :
    - Canal (EMAIL/SMS/PHONE/WHATSAPP)
    - Direction (Entrant/Sortant)
    - Auteur / date
  - filtres rapides : canal / direction / période

### UX
- Entrée rapide : bouton “Ajouter un message”.
- Templates courts (appels téléphoniques) : “compte-rendu” (textarea).

