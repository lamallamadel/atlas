# User stories — Advanced CRM

> **Statut**: Stable (catalogue)  
> **Dernière vérification**: 2026-01-07  
> **Source of truth**: Non  
> **Dépendances**:  
- `docs/UAT_SCENARIOS.md`

## Messagerie / activité
1. En tant qu’agent, je peux enregistrer un **message entrant/sortant** associé à un Dossier (canal EMAIL/SMS/PHONE/WHATSAPP) pour conserver l’historique.
2. En tant qu’agent, je vois une **timeline** dans le détail Dossier avec filtres (canal, direction, auteur, période).
3. En tant que manager, je peux consulter l’activité d’un Dossier pour évaluer la qualité de suivi.

## Audit trail
4. En tant que manager, je peux consulter un **audit** (création/modification/suppression) d’un Dossier ou d’une Annonce, avec horodatage, auteur, et différences avant/après.
5. En tant qu’admin, je peux exporter l’audit sur une période (CSV/JSON) pour conformité.

## Consentements (RGPD)
6. En tant qu’agent, je peux enregistrer le **consentement** d’une personne (opt-in/opt-out) par canal.
7. En tant qu’agent, le système **bloque** l’envoi de messages via un canal non consenti et m’indique la raison.
8. En tant que manager, je vois des **badges** de consentement et la date/trace du dernier choix.

## Multi-tenancy
9. En tant qu’organisation (agence), je ne vois que mes données (`org_id`) et aucune donnée d’une autre organisation.
10. En tant qu’admin technique, je déploie une seule instance (une DB) pour plusieurs organisations.

## Workflow Dossier
11. En tant qu’agent, je ne peux pas passer un Dossier dans un statut incohérent ; le système valide les transitions.
12. En tant qu’agent, l’UI propose uniquement les **transitions autorisées**.
13. En tant que manager, je paramètre les règles de transition (version future).

## Reporting & notifications
14. En tant que manager, je visualise un **funnel** (NEW→QUALIFIED→WON/LOST), délais moyens, et attribution des sources.
15. En tant qu’agent, je reçois des notifications (email/sms) lors d’événements clés (nouveau lead, RDV, changement de statut).
