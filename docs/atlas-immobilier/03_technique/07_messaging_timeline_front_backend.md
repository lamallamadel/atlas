# Messagerie & timeline — backend + frontend

> **Statut**: Partiel (AS-IS) + extension TO-BE  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/atlas-immobilier/03_technique/09_notifications.md`

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


## TO-BE — Outbound réel (WhatsApp/SMS/Email)

- L’action “envoyer” doit créer une demande d’envoi dans l’outbox (voir notifications).
- La timeline doit refléter :
  - `MESSAGE_LOG` à la création de la demande
  - mises à jour de statut d’envoi (SENT/DELIVERED/FAILED) selon provider
- Le consentement est **bloquant** avant toute création d’outbound.

Référence : `docs/atlas-immobilier/03_technique/09_notifications.md`
