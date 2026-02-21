# ADR 0001: Outbox Pattern for Inter-Service Communication and Webhooks

## Status
Accepté

## Contexte
Le projet Atlas Immobilier gère des événements asynchrones critiques, notamment l'envoi de messages WhatsApp, les rappels de rendez-vous et les notifications de changement de statut de dossier. L'envoi de ces messages via des API tierces (ex: Twilio) ou des webhooks est sujet à des défaillances réseaux sporadiques ou des temps de réponse élevés, ce qui pourrait bloquer les transactions de la base de données principale (Spring Boot) et entraîner des données corrompues ou des messages perdus.

## Décision
Nous avons décidé d'implémenter le **Transactional Outbox Pattern** :
1. Chaque fois qu'un message ou une notification doit être émise, l'entité correspondante (`OutboxMessage`) est sauvegardée dans la base de données relationnelle locale **au sein de la même transaction métier** que l'action l'ayant déclenchée.
2. Un processus de scrutation asynchrone (Spring `@Scheduled`) lit la table Outbox et tente de publier/envoyer ces messages.
3. Le système gère le relai des messages en échec avec un mécanisme d'**Exponential Backoff** pour éviter de surcharger les API tierces.
4. Les messages envoyés avec succès sont supprimés ou marqués comme traités.

## Conséquences

### Positives
*   **Garantie de livraison At-Least-Once** : Les messages ne sont jamais perdus si une API tierce tombe.
*   **Performance** : Les transactions HTTP des requêtes API REST frontend se terminent immédiatement sans attendre l'API Twilio.
*   **Découplage** : La logique métier d'envoi de message est isolée de la logique de création de dossier ou d'action utilisateur.

### Négatives
*   **Complexité de mise en place** : Nécessite un planificateur (Cron job) et potentiellement une gestion de concurrence stricte si l'application est déployée horizontalement à l'avenir (Nœuds multiples).
*   **Idempotence requise** : Puisque la garantie est "At-Least-Once", le système tiers (ou le webhook récepteur) doit gérer l'idempotence des appels (ex: via un MessageID).
