# Mode Hors-Ligne - Guide de Démarrage Rapide

## Installation et Activation

### 1. Le Service Worker est déjà activé
Le Service Worker est automatiquement enregistré au démarrage de l'application dans `AppComponent`.

### 2. L'indicateur hors-ligne est visible
Une barre de notification apparaît automatiquement en haut de l'écran quand:
- La connexion est perdue
- La connexion est lente
- Des actions sont en attente de synchronisation

## Utilisation de Base

### Créer une Action Hors-Ligne

```typescript
import { MessageApiService } from './services/message-api.service';

@Component({...})
export class MyComponent {
  constructor(private messageService: MessageApiService) {}

  async sendMessage() {
    // Fonctionne en ligne ET hors ligne !
    this.messageService.create({
      dossierId: 123,
      content: 'Test message',
      channel: MessageChannel.EMAIL,
      direction: MessageDirection.OUTBOUND,
      timestamp: new Date().toISOString()
    }).subscribe(response => {
      // response.id peut être un ID local (string) ou serveur (number)
      console.log('Message créé:', response.id);
    });
  }
}
```

### Vérifier le Statut de Connexion

```typescript
import { OfflineService, ConnectionStatus } from './services/offline.service';

@Component({...})
export class MyComponent {
  constructor(public offlineService: OfflineService) {}
}
```

```html
<!-- Dans le template -->
<div *ngIf="offlineService.isOnline()">
  Mode en ligne
</div>

<div *ngIf="!offlineService.isOnline()">
  Mode hors ligne - Les actions seront synchronisées plus tard
</div>
```

### Observer les Changements de Connexion

```typescript
ngOnInit() {
  this.offlineService.connectivity$.subscribe(state => {
    switch(state.status) {
      case ConnectionStatus.ONLINE:
        console.log('Connexion normale');
        break;
      case ConnectionStatus.SLOW:
        console.log('Connexion lente détectée');
        break;
      case ConnectionStatus.OFFLINE:
        console.log('Hors ligne');
        break;
    }
  });
}
```

## Actions Supportées Hors-Ligne

Les actions suivantes sont automatiquement mises en queue et synchronisées:

1. **Créer un Message**
   ```typescript
   POST /api/v1/messages
   ```

2. **Changer le Statut d'un Dossier**
   ```typescript
   PATCH /api/v1/dossiers/{id}/status
   ```

3. **Créer un Rendez-vous**
   ```typescript
   POST /api/v1/appointments
   ```

4. **Modifier un Rendez-vous**
   ```typescript
   PUT /api/v1/appointments/{id}
   ```

## Gérer les IDs Locaux

Quand une action est créée hors ligne, un ID local temporaire est retourné:

```typescript
// ID local: "local-1234567890-abc123"
// ID serveur: 123

// Vérifier si un ID est local
function isLocalId(id: string | number): boolean {
  return typeof id === 'string' && id.startsWith('local-');
}

// Exemple d'utilisation
if (isLocalId(message.id)) {
  // Afficher un badge "Local" ou "En attente"
  showLocalBadge();
} else {
  // ID serveur, action synchronisée
  showSyncedBadge();
}
```

## Synchronisation

### Automatique
La synchronisation se fait automatiquement:
- Quand la connexion est rétablie
- Toutes les 30 secondes (si connecté)
- Via Background Sync API (Chrome/Edge)

### Manuelle
Forcer la synchronisation:

```typescript
import { OfflineQueueService } from './services/offline-queue.service';

constructor(private queueService: OfflineQueueService) {}

async syncNow() {
  await this.queueService.syncQueue();
}
```

### Suivre la Progression

```typescript
ngOnInit() {
  this.queueService.syncProgress$.subscribe(progress => {
    console.log(`Sync: ${progress.completed}/${progress.total}`);
    console.log(`Échecs: ${progress.failed}`);
    console.log(`En cours: ${progress.inProgress}`);
  });
}
```

## Cache des Données

### Cacher des Données

```typescript
import { OfflineStorageService } from './services/offline-storage.service';

constructor(private storage: OfflineStorageService) {}

async cacheData() {
  // Cache avec TTL de 30 minutes
  await this.storage.cacheData('dossier-123', dossierData, 30);
}
```

### Récupérer du Cache

```typescript
async loadData() {
  const cached = await this.storage.getCachedData('dossier-123');
  if (cached) {
    // Utiliser les données cachées
    return cached;
  }
  // Charger depuis le serveur
  return this.loadFromServer();
}
```

## Résolution de Conflits

Par défaut, le serveur a toujours raison. Pour changer:

```typescript
import { OfflineConflictResolverService, ConflictResolutionStrategy } 
  from './services/offline-conflict-resolver.service';

constructor(private conflictResolver: OfflineConflictResolverService) {
  // Le client a toujours raison
  this.conflictResolver.setDefaultStrategy(
    ConflictResolutionStrategy.CLIENT_WINS
  );
  
  // OU: Fusion automatique intelligente
  this.conflictResolver.setDefaultStrategy(
    ConflictResolutionStrategy.MERGE
  );
}
```

## Notifications Utilisateur

Les notifications sont automatiques:
- ✅ "Action enregistrée hors ligne" (quand créée offline)
- ✅ "Action synchronisée: Création de message" (quand sync OK)
- ❌ "Échec de synchronisation: ..." (quand sync KO avec bouton retry)
- ℹ️ "X action(s) synchronisée(s) avec succès" (à la fin)

## Debug et Monitoring

### Console Browser
```javascript
// Logs du Service Worker
[Service Worker] Installing...
[Service Worker] Caching static assets
[Service Worker] Network failed, trying cache
```

### IndexedDB
Chrome DevTools → Application → IndexedDB → offline-db
- **queue**: Actions en attente
- **cache**: Données mises en cache
- **id-mapping**: IDs locaux → serveur

### Service Worker
Chrome DevTools → Application → Service Workers
- État: Activé/En attente/Installé
- Update on reload
- Unregister (pour debug)

### Network
Chrome DevTools → Network
- Cocher "Offline" pour simuler mode hors ligne
- Throttling: Fast 3G / Slow 3G

## Tests Manuels

### Test Basique
1. Ouvrir l'app
2. F12 → Network → Offline
3. Créer un message
4. Observer la notification "Action enregistrée hors ligne"
5. Observer l'indicateur en haut de l'écran
6. Décocher Offline
7. Observer la synchronisation automatique
8. Vérifier que le message apparaît avec son vrai ID

### Test de Conflit
1. Ouvrir deux onglets de l'app
2. Dans le premier: F12 → Network → Offline
3. Dans le premier: Modifier un dossier
4. Dans le second: Modifier le même dossier (en ligne)
5. Dans le premier: Décocher Offline
6. Observer la résolution du conflit

## Exemples de Code Complets

### Composant avec Gestion Offline

```typescript
import { Component, OnInit } from '@angular/core';
import { OfflineService } from './services/offline.service';
import { OfflineQueueService } from './services/offline-queue.service';
import { MessageApiService } from './services/message-api.service';

@Component({
  selector: 'app-messaging',
  template: `
    <div class="messaging">
      <div *ngIf="!offlineService.isOnline()" class="offline-warning">
        Mode hors ligne - Les messages seront envoyés à la reconnexion
      </div>
      
      <div *ngIf="pendingCount > 0" class="pending-actions">
        {{ pendingCount }} message(s) en attente de synchronisation
        <button (click)="syncNow()">Synchroniser</button>
      </div>
      
      <form (submit)="sendMessage()">
        <input [(ngModel)]="content" placeholder="Message...">
        <button type="submit">Envoyer</button>
      </form>
      
      <div *ngFor="let msg of messages">
        <span [class.local]="isLocalId(msg.id)">
          {{ msg.content }}
          <span *ngIf="isLocalId(msg.id)" class="badge">En attente</span>
        </span>
      </div>
    </div>
  `
})
export class MessagingComponent implements OnInit {
  content = '';
  messages: any[] = [];
  pendingCount = 0;

  constructor(
    public offlineService: OfflineService,
    private queueService: OfflineQueueService,
    private messageService: MessageApiService
  ) {}

  ngOnInit() {
    this.updatePendingCount();
    
    this.queueService.syncProgress$.subscribe(progress => {
      if (!progress.inProgress) {
        this.updatePendingCount();
      }
    });
  }

  sendMessage() {
    this.messageService.create({
      dossierId: 123,
      content: this.content,
      channel: 'EMAIL',
      direction: 'OUTBOUND',
      timestamp: new Date().toISOString()
    }).subscribe(msg => {
      this.messages.push(msg);
      this.content = '';
    });
  }

  async syncNow() {
    await this.queueService.syncQueue();
  }

  isLocalId(id: any): boolean {
    return typeof id === 'string' && id.startsWith('local-');
  }

  async updatePendingCount() {
    this.pendingCount = await this.queueService.getPendingActionsCount();
  }
}
```

## Troubleshooting

### Problème: Service Worker ne fonctionne pas
**Solution:** 
- Vérifier que l'app est en HTTPS (ou localhost)
- Vérifier `chrome://serviceworker-internals/`
- Hard refresh: Ctrl+Shift+R

### Problème: Les actions ne se synchronisent pas
**Solution:**
- Ouvrir IndexedDB et vérifier la table `queue`
- Vérifier les logs console
- Forcer la sync: `queueService.syncQueue()`

### Problème: ID local ne se transforme pas en ID serveur
**Solution:**
- Vérifier la table `id-mapping` dans IndexedDB
- Vérifier que la sync a réussi (pas d'erreur)
- Recharger les données depuis le serveur

## Limites Importantes

1. **DELETE non supporté** - Les suppressions ne peuvent pas se faire hors ligne
2. **Fichiers volumineux** - Limités par le quota IndexedDB (~50-100 MB)
3. **Conflits complexes** - Peuvent nécessiter intervention manuelle
4. **Background Sync** - Seulement Chrome/Edge (graceful fallback sur autres)

## Ressources

- Documentation complète: `OFFLINE_MODE_IMPLEMENTATION.md`
- Service Worker: `src/service-worker.js`
- Services: `src/app/services/offline*.service.ts`
- Composant UI: `src/app/components/offline-indicator.component.ts`
- Intercepteur: `src/app/interceptors/offline.interceptor.ts`
