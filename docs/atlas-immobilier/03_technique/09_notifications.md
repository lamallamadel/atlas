# Notifications (email / SMS)

## Objectifs
- Notifier l’agent (et optionnellement le manager) d’événements clés.
- Automatiser rappels (RDV, relances) à partir du workflow.

## Canaux
- Email : Spring Mail
- SMS : Twilio (ou provider alternatif)
- WhatsApp : option future (provider)

## Templates
- Thymeleaf (email) / templates texte (sms)
- Scénarios :
  - nouveau lead
  - changement de statut
  - rappel RDV
  - relance “sans activité” X jours

## Architecture
- `NotificationService` (domain)
- `NotificationDispatcher` (infra)
- Dispatch async `@Async` (ou mieux : outbox + worker) selon volume.

## Observabilité
- Journaliser : envoi, statut, latence, erreurs.
- Endpoint monitoring / métriques.

