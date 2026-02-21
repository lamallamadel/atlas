# ADR 0002: Service Worker and IndexedDB for Offline-First CRM

## Status
Accepté

## Contexte
Les agents immobiliers utilisant Atlas sont fréquemment sur le terrain (visites d'appartements, réunions dans des zones mal desservies en réseau 4G/5G). Il est impératif qu'ils puissent consulter la fiche d'un prospect (`Dossier`) ou ajouter une note de visite même en perdant temporairement leur connexion Internet.

## Décision
Plutôt que de s'appuyer uniquement sur le `localStorage` de l'application (qui est synchrone et très limité en taille - 5MB environ), nous avons adopté une architecture **Progressive Web App (PWA) Offline-First** dans Angular, reposant sur :
1. **Service Workers** : Pour mettre en cache l'intégrité de l'application cliente (scripts, CSS, images de base) et intercepter toutes les requêtes HTTP.
2. **IndexedDB** : Une base de données NoSQL asynchrone dans le navigateur pour stocker de larges volumes de données structurées (listes de dossiers, annonces). Nous utilisons la bibliothèque d'abstraction Angular ou RxDB pour simplifier les appels.
3. **Queue de Synchronisation** : Les mutations (POST/PUT/DELETE) effectuées hors ligne sont persistées dans IndexedDB et rejouées séquentiellement vers le backend Spring Boot lorsque l'événement `window.addEventListener('online')` est capté.

## Conséquences

### Positives
*   **Résilience** : Le CRM reste opérationnel pendant une visite de bien sans réseau.
*   **Performances perçues** : Les données du cache IndexedDB peuvent être servies instantanément (Stale-While-Revalidate), offrant une fluidité proche du natif.

### Négatives
*   **Résolution de conflits** : Complexité lors de la reconnexion si plusieurs agents modifient le même dossier. La stratégie actuelle du "Last-Write-Wins" couvre le MVP, mais devra éventuellement évoluer vers des CRDTs si les éditions simultanées augmentent.
*   **Maintenance** : Les migrations de schémas IndexedDB côté client (ex: ajout d'une colonne) doivent être soigneusement gérées (versioning de base de données front).
