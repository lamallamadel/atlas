# Mode Hors-Ligne Progressif - Documentation d'Implémentation

## Vue d'ensemble

Cette implémentation fournit un système complet de mode hors-ligne progressif pour l'application Angular, permettant aux utilisateurs de continuer à travailler sans connexion internet et de synchroniser automatiquement leurs actions lorsque la connexion est rétablie.

## Architecture

### Services Principaux

#### 1. OfflineService
**Fichier:** `src/app/services/offline.service.ts`

Responsable de la détection et du monitoring de la connectivité réseau.

**Fonctionnalités:**
- Détection du statut de connexion (Online/Offline/Slow)
- Monitoring de la qualité de connexion (Network Information API)
- Observable `connectivity$` pour les changements d'état
- Vérification active de la connexion via `/api/v1/ping`

**États de connexion:**
```typescript
enum ConnectionStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  SLOW = 'SLOW'
}
```

**Utilisation:**
```typescript
constructor(private offlineService: OfflineService) {}

ngOnInit() {
  this.offlineService.connectivity$.subscribe(state => {
    console.log('Status:', state.status);
    console.log('Last online:', state.lastOnline);
    console.log('RTT:', state.rtt);
  });
}
```

#### 2. OfflineQueueService
**Fichier:** `src/app/services/offline-queue.service.ts`

Gère la file d'attente des actions effectuées hors ligne et leur synchronisation.

**Fonctionnalités:**
- Queue des actions hors ligne (création message, changement statut, etc.)
- Synchronisation automatique en arrière-plan
- Retry automatique avec backoff exponentiel
- Observable `syncProgress$` pour suivre la synchronisation
- Support du Background Sync API (quand disponible)

**Types d'actions supportées:**
```typescript
enum QueuedActionType {
  CREATE_MESSAGE = 'CREATE_MESSAGE',
  UPDATE_DOSSIER_STATUS = 'UPDATE_DOSSIER_STATUS',
  CREATE_APPOINTMENT = 'CREATE_APPOINTMENT',
  UPDATE_APPOINTMENT = 'UPDATE_APPOINTMENT',
  CREATE_NOTE = 'CREATE_NOTE'
}
```

**Utilisation:**
```typescript
// Ajouter une action à la queue
await this.queueService.queueAction({
  type: QueuedActionType.CREATE_MESSAGE,
  payload: {
    dossierId: 123,
    content: 'Message hors ligne',
    channel: 'EMAIL'
  }
});

// Synchroniser manuellement
await this.queueService.syncQueue();

// Observer la progression
this.queueService.syncProgress$.subscribe(progress => {
  console.log(`${progress.completed}/${progress.total}`);
});
```

#### 3. OfflineStorageService
**Fichier:** `src/app/services/offline-storage.service.ts`

Gère le stockage local avec IndexedDB pour les données critiques.

**Fonctionnalités:**
- Stockage des actions en queue dans IndexedDB
- Cache des données avec TTL optionnel
- Mapping local ID ↔ server ID
- Nettoyage automatique des données expirées

**Stores IndexedDB:**
- `queue` - Actions en attente de synchronisation
- `cache` - Données mises en cache
- `id-mapping` - Mapping des IDs locaux vers serveur

**Utilisation:**
```typescript
// Cacher des données avec TTL de 30 minutes
await this.storageService.cacheData('dossier-123', dossierData, 30);

// Récupérer des données du cache
const data = await this.storageService.getCachedData('dossier-123');

// Mapper un ID local vers un ID serveur
await this.storageService.mapLocalToServerId('local-456', 123);
```

#### 4. OfflineConflictResolverService
**Fichier:** `src/app/services/offline-conflict-resolver.service.ts`

Résout les conflits lors de la synchronisation des données modifiées hors ligne.

**Stratégies de résolution:**
```typescript
enum ConflictResolutionStrategy {
  SERVER_WINS = 'SERVER_WINS',      // Le serveur a toujours raison
  CLIENT_WINS = 'CLIENT_WINS',      // Le client a toujours raison
  MERGE = 'MERGE',                  // Fusion automatique intelligente
  MANUAL = 'MANUAL'                 // Résolution manuelle requise
}
```

**Fonctionnalités:**
- Détection automatique des conflits
- Fusion intelligente des données
- Résolution par batch
- Comparaison granulaire des champs

**Utilisation:**
```typescript
// Définir la stratégie par défaut
this.conflictResolver.setDefaultStrategy(ConflictResolutionStrategy.MERGE);

// Détecter un conflit
const conflict = await this.conflictResolver.detectConflict(action);

// Résoudre un conflit
if (conflict) {
  const result = await this.conflictResolver.resolveConflict(
    conflict, 
    ConflictResolutionStrategy.MERGE
  );
}
```

#### 5. ServiceWorkerRegistrationService
**Fichier:** `src/app/services/service-worker-registration.service.ts`

Gère l'enregistrement et le cycle de vie du Service Worker.

**Fonctionnalités:**
- Enregistrement du Service Worker
- Détection des mises à jour
- Communication bidirectionnelle avec le SW
- Nettoyage du cache

**Utilisation:**
```typescript
// Dans AppComponent
ngOnInit() {
  this.swService.register();
  
  // Observer les mises à jour
  this.swService.state$.subscribe(state => {
    if (state.updateAvailable) {
      // Notifier l'utilisateur
    }
  });
}
```

### Service Worker
**Fichier:** `src/service-worker.js`

Service Worker personnalisé avec stratégies de cache intelligentes.

**Stratégies de cache:**

1. **Cache First** - Assets statiques (JS, CSS, images)
   - Vérifie le cache en premier
   - Fallback sur le réseau si non trouvé
   - Met en cache les nouvelles requêtes

2. **Network First** - Routes de navigation
   - Essaie le réseau en premier
   - Fallback sur le cache si hors ligne
   - Met à jour le cache avec la réponse réseau

3. **Stale While Revalidate** - APIs critiques
   - Retourne immédiatement le cache
   - Revalide en arrière-plan
   - Met à jour silencieusement

**APIs cachées:**
- `/api/v1/dossiers`
- `/api/v1/messages`
- `/api/v1/appointments`

**Background Sync:**
```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-queue-sync') {
    event.waitUntil(syncOfflineQueue());
  }
});
```

### Intercepteur HTTP
**Fichier:** `src/app/interceptors/offline.interceptor.ts`

Intercepte les requêtes HTTP pour gérer le mode hors ligne.

**Fonctionnalités:**
- Détection automatique des erreurs réseau
- Mise en queue automatique des requêtes POST/PUT/PATCH
- Retour du cache pour les GET hors ligne
- Génération d'IDs locaux temporaires

**Requêtes supportées hors ligne:**
- `POST /api/v1/messages` → CREATE_MESSAGE
- `PATCH /api/v1/dossiers/{id}/status` → UPDATE_DOSSIER_STATUS
- `POST /api/v1/appointments` → CREATE_APPOINTMENT
- `PUT /api/v1/appointments/{id}` → UPDATE_APPOINTMENT

**Comportement:**
```typescript
// Requête en ligne
POST /api/v1/messages → Serveur

// Requête hors ligne
POST /api/v1/messages → Queue + ID local
// Retourne immédiatement avec { id: 'local-123', _isLocal: true }
```

### Composant UI
**Fichier:** `src/app/components/offline-indicator.component.ts`

Indicateur visuel du statut de connexion et de synchronisation.

**Affichage:**
- Barre de notification en haut de l'écran
- Icône et texte adaptés au statut
- Barre de progression pendant la sync
- Bouton de synchronisation manuelle
- Compteur d'actions en attente

**États visuels:**
- 🔴 **Offline** - Fond rouge, icône cloud_off
- 🟠 **Slow** - Fond orange, icône signal_cellular_alt_2_bar
- 🔵 **Online** - Fond bleu, icône cloud_queue
- 🟢 **Syncing** - Fond vert, icône sync + progress bar

**Animation:**
- Slide down/up lors de l'apparition/disparition
- Transition fluide entre les états

## Flux de Données

### Scénario: Création de Message Hors Ligne

```
1. Utilisateur crée un message (mode hors ligne)
   ↓
2. OfflineInterceptor intercepte la requête
   ↓
3. Action ajoutée à la queue (OfflineQueueService)
   ↓
4. Stockage dans IndexedDB (OfflineStorageService)
   ↓
5. ID local généré et retourné ('local-123')
   ↓
6. UI mise à jour avec l'ID local
   ↓
7. Notification "Action enregistrée hors ligne"
   ↓
8. Connexion rétablie
   ↓
9. OfflineQueueService détecte le changement
   ↓
10. Synchronisation automatique lancée
    ↓
11. Requête envoyée au serveur
    ↓
12. Serveur retourne ID réel (123)
    ↓
13. Mapping local-123 → 123 stocké
    ↓
14. Action marquée SUCCESS dans la queue
    ↓
15. Notification "Action synchronisée"
```

### Scénario: Résolution de Conflit

```
1. Utilisateur modifie un dossier hors ligne
   ↓
2. Action mise en queue
   ↓
3. Pendant ce temps, dossier modifié sur le serveur
   ↓
4. Connexion rétablie, synchronisation lancée
   ↓
5. OfflineConflictResolver détecte le conflit
   ↓
6. Récupération des données serveur
   ↓
7. Comparaison des champs modifiés
   ↓
8. Stratégie MERGE appliquée:
   - Champs non conflictuels: fusion automatique
   - Champs conflictuels: serveur gagne (par défaut)
   ↓
9. Données fusionnées envoyées au serveur
   ↓
10. UI mise à jour avec les données finales
```

## Configuration

### Activation du Service Worker

**Dans AppComponent:**
```typescript
ngOnInit() {
  this.swService.register();
}
```

### Stratégie de Conflit par Défaut

**Dans un service d'initialisation:**
```typescript
constructor(private conflictResolver: OfflineConflictResolverService) {
  this.conflictResolver.setDefaultStrategy(
    ConflictResolutionStrategy.SERVER_WINS
  );
}
```

### Intervalles de Synchronisation

**Dans OfflineQueueService:**
```typescript
private readonly SYNC_INTERVAL = 30000; // 30 secondes
private readonly MAX_RETRY_COUNT = 3;   // 3 tentatives max
```

## Intégration dans le Code Existant

### 1. Utiliser dans un Service API

```typescript
@Injectable({ providedIn: 'root' })
export class MessageApiService {
  constructor(
    private http: HttpClient,
    private offlineService: OfflineService
  ) {}

  create(request: MessageCreateRequest): Observable<MessageResponse> {
    // L'interceptor gère automatiquement le mode offline
    return this.http.post<MessageResponse>('/api/v1/messages', request);
  }
}
```

### 2. Afficher le Statut dans un Composant

```typescript
@Component({...})
export class MyComponent {
  isOffline$ = this.offlineService.connectivity$.pipe(
    map(state => state.status === ConnectionStatus.OFFLINE)
  );

  constructor(private offlineService: OfflineService) {}
}
```

```html
<div *ngIf="isOffline$ | async" class="offline-warning">
  Mode hors ligne activé
</div>
```

### 3. Gérer les IDs Locaux

```typescript
// Vérifier si un ID est local
function isLocalId(id: string | number): boolean {
  return typeof id === 'string' && id.startsWith('local-');
}

// Utiliser un ID avec fallback
const messageId = isLocalId(message.id) 
  ? await this.storageService.getServerId(message.id)
  : message.id;
```

## Tests

### Test du Mode Hors Ligne

1. **Simulation Chrome DevTools:**
   - F12 → Network → Offline

2. **Test des Actions:**
   - Créer un message hors ligne
   - Vérifier l'indicateur
   - Réactiver le réseau
   - Vérifier la synchronisation

3. **Test des Conflits:**
   - Modifier un dossier hors ligne
   - Modifier le même dossier sur le serveur
   - Synchroniser et vérifier la fusion

### Tests Unitaires

```typescript
describe('OfflineQueueService', () => {
  it('should queue actions when offline', async () => {
    spyOn(offlineService, 'isOnline').and.returnValue(false);
    
    const id = await queueService.queueAction({
      type: QueuedActionType.CREATE_MESSAGE,
      payload: { content: 'Test' }
    });
    
    expect(id).toBeDefined();
    const count = await queueService.getPendingActionsCount();
    expect(count).toBe(1);
  });
});
```

## Monitoring et Debugging

### Console Logs

Le Service Worker et les services offline loggent des informations utiles:

```javascript
[Service Worker] Installing...
[Service Worker] Caching static assets
[Service Worker] Network failed, trying cache
[Service Worker] Background sync: offline-queue-sync
```

### IndexedDB Inspector

Chrome DevTools → Application → IndexedDB → offline-db

- **queue**: Actions en attente
- **cache**: Données mises en cache
- **id-mapping**: Mappings ID local ↔ serveur

### Métriques

```typescript
// Nombre d'actions en attente
const pending = await queueService.getPendingActionsCount();

// Actions échouées
const failed = await queueService.getFailedActions();

// Progression de sync
queueService.syncProgress$.subscribe(progress => {
  console.log(`Sync: ${progress.completed}/${progress.total}`);
});
```

## Limitations

1. **Taille du Cache:**
   - IndexedDB: ~50-100 MB par origine
   - Service Worker Cache: Limité par quota navigateur

2. **Actions Supportées:**
   - Seulement certaines actions sont mises en queue
   - Les DELETE ne sont pas supportés hors ligne

3. **Résolution de Conflits:**
   - Stratégie MERGE peut ne pas gérer tous les cas
   - Conflits complexes nécessitent intervention manuelle

4. **Support Navigateurs:**
   - Service Worker: Chrome/Edge/Firefox/Safari 11.1+
   - IndexedDB: Tous les navigateurs modernes
   - Background Sync: Chrome/Edge uniquement

## Bonnes Pratiques

1. **Toujours vérifier si un ID est local:**
   ```typescript
   if (id && typeof id === 'string' && id.startsWith('local-')) {
     // Gérer l'ID local
   }
   ```

2. **Indiquer visuellement les données locales:**
   ```html
   <span *ngIf="message._isLocal" class="badge">Local</span>
   ```

3. **Gérer les erreurs de sync:**
   ```typescript
   queueService.syncProgress$.subscribe(progress => {
     if (progress.failed > 0) {
       notificationService.warning(
         `${progress.failed} action(s) ont échoué`
       );
     }
   });
   ```

4. **Nettoyer périodiquement le cache:**
   ```typescript
   // Dans un service d'initialisation
   setInterval(() => {
     this.storageService.clearExpiredCache();
   }, 3600000); // Toutes les heures
   ```

## Évolutions Futures

1. **Synchronisation Sélective:**
   - Permettre à l'utilisateur de choisir quelles actions synchroniser

2. **Résolution de Conflits UI:**
   - Dialog interactif pour résoudre les conflits manuellement

3. **Synchronisation Différentielle:**
   - Envoyer seulement les champs modifiés

4. **Compression des Données:**
   - Compresser les données avant stockage IndexedDB

5. **Metrics et Analytics:**
   - Collecter des métriques sur l'utilisation offline
   - Taux de conflits, temps de sync, etc.

## Support et Dépannage

### Problème: Service Worker ne s'installe pas
- Vérifier que l'app est servie en HTTPS (ou localhost)
- Vérifier la console pour les erreurs
- Tester avec `chrome://serviceworker-internals/`

### Problème: Les données ne se synchronisent pas
- Vérifier `IndexedDB` dans DevTools
- Vérifier que `OfflineQueueService.syncQueue()` est appelé
- Vérifier les logs console du Service Worker

### Problème: Conflit non résolu
- Changer la stratégie par défaut
- Implémenter une résolution manuelle
- Logger les détails du conflit pour analyse

## Références

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
