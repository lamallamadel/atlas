# Mode Hors-Ligne Progressif - Index

## 📚 Documentation

### Guide de Démarrage
- **[OFFLINE_MODE_QUICK_START.md](./OFFLINE_MODE_QUICK_START.md)** - Guide rapide pour démarrer avec le mode hors-ligne
  - Installation et activation
  - Exemples de code de base
  - Tests manuels
  - Troubleshooting

### Documentation Complète
- **[OFFLINE_MODE_IMPLEMENTATION.md](./OFFLINE_MODE_IMPLEMENTATION.md)** - Documentation technique détaillée
  - Architecture complète
  - Flux de données
  - API de tous les services
  - Configuration avancée
  - Monitoring et debugging

### Résumé
- **[OFFLINE_MODE_SUMMARY.md](./OFFLINE_MODE_SUMMARY.md)** - Vue d'ensemble de l'implémentation
  - Liste des fichiers créés/modifiés
  - Fonctionnalités implémentées
  - Métriques de performance
  - Support navigateurs

## 🗂️ Structure des Fichiers

```
frontend/
├── src/
│   ├── app/
│   │   ├── services/
│   │   │   ├── offline.service.ts                      # Détection connectivité
│   │   │   ├── offline.service.spec.ts
│   │   │   ├── offline-queue.service.ts                # File d'attente actions
│   │   │   ├── offline-queue.service.spec.ts
│   │   │   ├── offline-storage.service.ts              # Stockage IndexedDB
│   │   │   ├── offline-storage.service.spec.ts
│   │   │   ├── offline-conflict-resolver.service.ts    # Résolution conflits
│   │   │   ├── offline-conflict-resolver.service.spec.ts
│   │   │   ├── service-worker-registration.service.ts  # Gestion SW
│   │   │   └── service-worker-registration.service.spec.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── offline.interceptor.ts                  # Intercepteur HTTP
│   │   │   └── offline.interceptor.spec.ts
│   │   │
│   │   ├── components/
│   │   │   ├── offline-indicator.component.ts          # Indicateur UI
│   │   │   └── offline-indicator.component.spec.ts
│   │   │
│   │   ├── app.component.ts                            # Initialisation SW
│   │   ├── app.component.html                          # Ajout indicateur
│   │   └── app.module.ts                               # Configuration module
│   │
│   └── service-worker.js                               # Service Worker custom
│
├── OFFLINE_MODE_INDEX.md                               # Ce fichier
├── OFFLINE_MODE_QUICK_START.md                         # Guide rapide
├── OFFLINE_MODE_IMPLEMENTATION.md                      # Doc complète
└── OFFLINE_MODE_SUMMARY.md                             # Résumé
```

## 🚀 Démarrage Rapide

### 1. Activer le Mode Hors-Ligne
Le mode hors-ligne est **automatiquement activé** au démarrage de l'application.

### 2. Tester Localement
```bash
# Démarrer l'app
cd frontend
npm start

# Dans Chrome DevTools:
# F12 → Network → Cocher "Offline"
```

### 3. Créer une Action Hors-Ligne
```typescript
// Fonctionne automatiquement hors ligne !
this.messageService.create({
  dossierId: 123,
  content: 'Test',
  channel: MessageChannel.EMAIL,
  direction: MessageDirection.OUTBOUND,
  timestamp: new Date().toISOString()
}).subscribe(response => {
  // response.id sera un ID local: "local-1234567890-abc"
});
```

### 4. Observer le Statut
```typescript
// Dans votre composant
constructor(public offlineService: OfflineService) {}
```

```html
<!-- Dans le template -->
<div *ngIf="!offlineService.isOnline()">
  Mode hors ligne - Actions enregistrées localement
</div>
```

## 🔑 Concepts Clés

### États de Connexion
- **ONLINE** 🟢 - Connexion normale
- **SLOW** 🟠 - Connexion lente (>2s RTT)
- **OFFLINE** 🔴 - Pas de connexion

### Actions Supportées Hors-Ligne
1. `CREATE_MESSAGE` - Créer un message
2. `UPDATE_DOSSIER_STATUS` - Changer statut dossier
3. `CREATE_APPOINTMENT` - Créer un rendez-vous
4. `UPDATE_APPOINTMENT` - Modifier un rendez-vous
5. `CREATE_NOTE` - Créer une note

### IDs Locaux vs Serveur
- **ID Local:** `"local-1234567890-abc123"` (string)
- **ID Serveur:** `123` (number)
- **Vérification:** `typeof id === 'string' && id.startsWith('local-')`

### Stratégies de Cache (Service Worker)
- **Cache First** → Assets statiques (JS, CSS, images)
- **Network First** → Routes de navigation
- **Stale While Revalidate** → APIs critiques

### Résolution de Conflits
- **SERVER_WINS** - Le serveur a raison (par défaut)
- **CLIENT_WINS** - Le client a raison
- **MERGE** - Fusion automatique intelligente
- **MANUAL** - Résolution manuelle requise

## 📋 Checklist d'Intégration

### Pour un Nouveau Type d'Action

- [ ] Ajouter l'enum dans `QueuedActionType`
- [ ] Ajouter le case dans `OfflineInterceptor.getActionType()`
- [ ] Ajouter le case dans `OfflineQueueService.syncAction()`
- [ ] Ajouter le label dans `OfflineQueueService.getActionLabel()`
- [ ] Tester en mode offline
- [ ] Tester la synchronisation

### Pour un Nouveau Composant

- [ ] Injecter `OfflineService` si besoin du statut
- [ ] Injecter `OfflineQueueService` si besoin de la sync
- [ ] S'abonner à `connectivity$` ou `syncProgress$`
- [ ] Gérer les IDs locaux dans l'affichage
- [ ] Ajouter un indicateur visuel si données locales
- [ ] Tester le comportement hors ligne

## 🧪 Tests

### Tests Unitaires
```bash
cd frontend
npm test

# Tous les tests doivent passer:
# ✓ OfflineService
# ✓ OfflineQueueService
# ✓ OfflineStorageService
# ✓ OfflineConflictResolverService
# ✓ ServiceWorkerRegistrationService
# ✓ OfflineIndicatorComponent
# ✓ OfflineInterceptor
```

### Tests Manuels

#### Test 1: Création Hors-Ligne
1. Ouvrir l'app
2. F12 → Network → Offline
3. Créer un message
4. Observer notification "Action enregistrée hors ligne"
5. Observer indicateur rouge en haut
6. Décocher Offline
7. Observer synchronisation automatique
8. Vérifier que le message a un vrai ID

#### Test 2: Synchronisation Multiple
1. Mode offline
2. Créer 5 messages
3. Observer "5 actions en attente"
4. Revenir en ligne
5. Observer barre de progression "1/5, 2/5, ..."
6. Vérifier que tous les messages sont synchronisés

#### Test 3: Conflit
1. Ouvrir 2 onglets
2. Dans onglet 1: Offline → Modifier dossier
3. Dans onglet 2: Online → Modifier même dossier
4. Dans onglet 1: Revenir online
5. Observer résolution automatique du conflit

### Tests de Performance

#### Benchmark Sync
```typescript
// Mesurer temps de sync pour 100 actions
const start = Date.now();
await queueService.syncQueue();
const duration = Date.now() - start;
console.log(`Sync 100 actions: ${duration}ms`);
// Attendu: < 10 secondes
```

#### Benchmark IndexedDB
```typescript
// Mesurer temps d'écriture
const start = Date.now();
for (let i = 0; i < 1000; i++) {
  await storageService.cacheData(`key-${i}`, data);
}
const duration = Date.now() - start;
console.log(`1000 writes: ${duration}ms`);
// Attendu: < 2 secondes
```

## 🐛 Debugging

### Chrome DevTools

#### Application Tab
- **Service Workers** - État du SW, logs, unregister
- **Cache Storage** - Contenu du cache SW
- **IndexedDB** - Données dans offline-db
  - `queue` - Actions en attente
  - `cache` - Données mises en cache
  - `id-mapping` - Mappings ID local ↔ serveur

#### Network Tab
- Cocher **Offline** pour simuler mode hors ligne
- Throttling: **Fast 3G** / **Slow 3G** pour tester connexion lente

#### Console
```javascript
// Activer logs détaillés
localStorage.setItem('offline-debug', 'true');

// Logs disponibles:
// [OfflineService] Status changed: OFFLINE
// [OfflineQueueService] Queued: CREATE_MESSAGE
// [Service Worker] Cache hit: /api/v1/dossiers
```

### Service Worker Internals
```
chrome://serviceworker-internals/
```
- Liste de tous les SW enregistrés
- Unregister / Start / Stop
- Voir les erreurs d'installation

### Commandes Utiles

```typescript
// Dans la console du navigateur

// Forcer la synchronisation
await queueService.syncQueue();

// Voir les actions en attente
const pending = await queueService.getPendingActionsCount();
console.log(`${pending} actions en attente`);

// Voir les actions échouées
const failed = await queueService.getFailedActions();
console.log('Actions échouées:', failed);

// Nettoyer la queue (ATTENTION: perte de données)
await queueService.clearQueue();

// Nettoyer le cache expiré
await storageService.clearExpiredCache();

// Vérifier le statut de connexion
console.log('Online:', offlineService.isOnline());
console.log('Slow:', offlineService.isSlow());

// Unregister le Service Worker
await swService.unregister();

// Nettoyer tout le cache SW
await swService.clearCache();
```

## 📊 Métriques

### Taille du Code
- Services: ~1200 lignes TypeScript
- Service Worker: ~250 lignes JavaScript
- Composant UI: ~200 lignes TypeScript
- Tests: ~400 lignes TypeScript
- Documentation: ~1500 lignes Markdown
- **Total: ~3550 lignes**

### Impact Bundle
- Services: ~30 KB gzippé
- Service Worker: ~8 KB gzippé
- Composant UI: ~10 KB gzippé
- **Total: ~48 KB gzippé**

### Performance
- Détection connectivité: < 1 ms
- Stockage IndexedDB: < 10 ms par action
- Sync par action: ~50-200 ms (réseau)
- Cache lookup: < 5 ms

### Quotas
- IndexedDB: ~50-100 MB par origine
- Cache Storage: ~10% espace disque disponible

## 🔗 Liens Utiles

### Documentation Externe
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
- [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage)

### Outils
- [Workbox](https://developers.google.com/web/tools/workbox) - Bibliothèque Google pour SW
- [sw-precache](https://github.com/GoogleChrome/sw-precache) - Générateur de SW
- [IndexedDB Explorer](https://chrome.google.com/webstore/detail/indexeddb-explorer/) - Extension Chrome

### Articles
- [Offline First](https://offlinefirst.org/) - Philosophie Offline First
- [Progressive Web Apps](https://web.dev/progressive-web-apps/) - Guide PWA
- [Caching Strategies](https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook) - Stratégies de cache

## 🎯 Prochaines Étapes

### Court Terme (Sprint actuel)
1. ✅ Implémenter les services de base
2. ✅ Créer le Service Worker
3. ✅ Ajouter l'indicateur UI
4. ✅ Écrire la documentation
5. ⏳ Tests E2E automatisés
6. ⏳ Monitoring et analytics

### Moyen Terme (Sprint suivant)
1. UI de résolution manuelle de conflits
2. Synchronisation sélective
3. Compression des données
4. Mode "Avion" explicite

### Long Terme (Backlog)
1. Synchronisation différentielle
2. Synchronisation P2P
3. Chiffrement des données locales
4. Prédiction de déconnexion

## 💡 Bonnes Pratiques

### DO ✅
- Toujours vérifier si un ID est local avant utilisation
- Afficher un badge visuel pour les données locales
- Notifier l'utilisateur des actions hors ligne
- Gérer les erreurs de synchronisation
- Nettoyer régulièrement le cache expiré
- Logger les métriques d'utilisation offline

### DON'T ❌
- Ne pas supposer qu'un ID est toujours un number
- Ne pas oublier de gérer les IDs locaux dans l'UI
- Ne pas bloquer l'UI pendant la synchronisation
- Ne pas stocker de données sensibles non chiffrées
- Ne pas oublier de tester en mode offline
- Ne pas négliger les cas d'erreur réseau

## 📞 Support

### Questions Fréquentes

**Q: Le Service Worker ne s'installe pas?**  
R: Vérifier HTTPS (ou localhost), consulter la console.

**Q: Les actions ne se synchronisent pas?**  
R: Vérifier IndexedDB, forcer la sync avec `syncQueue()`.

**Q: Comment désactiver le mode offline?**  
R: Pas recommandé, mais possible via `OfflineInterceptor.shouldBypassOfflineHandling()`.

**Q: Comment ajouter un nouveau type d'action?**  
R: Suivre la checklist dans "Checklist d'Intégration".

**Q: Les conflits ne se résolvent pas correctement?**  
R: Changer la stratégie ou implémenter une résolution manuelle.

### Ressources
- Documentation: Voir fichiers MD dans `frontend/`
- Code source: `src/app/services/offline*.service.ts`
- Tests: `src/app/services/offline*.service.spec.ts`
- Exemples: `OFFLINE_MODE_QUICK_START.md`

---

**Dernière mise à jour:** 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Auteur:** Développement interne
