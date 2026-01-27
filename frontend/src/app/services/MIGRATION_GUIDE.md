# Migration Guide: ToastNotificationService → NotificationService

## Vue d'ensemble

Ce guide explique comment migrer du `ToastNotificationService` vers le nouveau `NotificationService` enrichi.

## Pourquoi migrer ?

Le nouveau `NotificationService` offre :

- ✅ **Actions contextuelles** enrichies (Annuler, Réessayer, Voir détails)
- ✅ **Priorisation intelligente** des notifications
- ✅ **Logging automatique** vers le backend pour observabilité
- ✅ **Support du mode sombre** automatique
- ✅ **Durées adaptatives** selon l'importance
- ✅ **Positions configurables**
- ✅ **Messages critiques** avec priorité maximale

## Comparaison des APIs

### ToastNotificationService (ancien)
```typescript
// Ancien service
import { ToastNotificationService } from './toast-notification.service';

constructor(private toast: ToastNotificationService) {}

// Utilisation
this.toast.success('Message');
this.toast.error('Erreur');
this.toast.warning('Attention');
this.toast.info('Info');
```

### NotificationService (nouveau)
```typescript
// Nouveau service
import { NotificationService } from './notification.service';

constructor(private notification: NotificationService) {}

// Utilisation
this.notification.success('Message');
this.notification.error('Erreur');
this.notification.warning('Attention');
this.notification.info('Info');
```

## Migrations par cas d'usage

### 1. Messages simples

**Avant :**
```typescript
this.toast.success('Enregistrement réussi');
this.toast.error('Une erreur est survenue');
this.toast.warning('Attention au quota');
this.toast.info('Nouveau message');
```

**Après :**
```typescript
this.notification.success('Enregistrement réussi');
this.notification.error('Une erreur est survenue');
this.notification.warning('Attention au quota');
this.notification.info('Nouveau message');
```

✅ **Aucun changement nécessaire** pour les messages simples !

### 2. Messages avec actions

**Avant :**
```typescript
this.toast.success('Enregistré', 'Voir', () => {
  this.viewDetails();
});
```

**Après :**
```typescript
// Option 1 : Méthode standard
this.notification.success('Enregistré', 'Voir', () => {
  this.viewDetails();
});

// Option 2 : Méthode de convenance
this.notification.successWithUndo('Élément supprimé', () => {
  this.undoDelete();
});
```

### 3. Durées personnalisées

**Avant :**
```typescript
this.toast.success('Message', undefined, undefined, 3000);
```

**Après :**
```typescript
this.notification.show({
  message: 'Message',
  type: 'success',
  duration: 3000
});
```

### 4. Gestion de la queue

**Avant :**
```typescript
this.toast.clearQueue();
this.toast.dismiss();
```

**Après :**
```typescript
this.notification.clearQueue();
this.notification.dismiss();
```

✅ **Méthodes identiques** !

## Nouvelles fonctionnalités

### Actions contextuelles prédéfinies

```typescript
// Succès avec option d'annulation
this.notification.successWithUndo('Dossier supprimé', () => {
  this.undoDelete();
});

// Erreur avec option de réessai
this.notification.errorWithRetry('Échec de la connexion', () => {
  this.retryConnection();
});

// Erreur avec affichage des détails
this.notification.errorWithDetails('Erreur de traitement', () => {
  this.showErrorDialog();
});
```

### Messages critiques

```typescript
// Nouveau : Messages critiques (priorité maximale)
this.notification.critical('Connexion perdue', 'Reconnecter', () => {
  this.reconnect();
});
```

### Contrôle du logging backend

```typescript
// Erreur avec logging automatique (par défaut)
this.notification.error('Erreur serveur');

// Erreur sans logging backend
this.notification.error('Validation échouée', undefined, undefined, false);

// Warning avec logging backend
this.notification.warning('Quota atteint', undefined, undefined, true);
```

### Positions personnalisées

```typescript
this.notification.show({
  message: 'Notification en bas à droite',
  type: 'info',
  position: {
    horizontal: 'right',
    vertical: 'bottom'
  }
});
```

### Priorités

```typescript
// Priorité basse (affiché en dernier)
this.notification.show({
  message: 'Info non urgente',
  type: 'info',
  priority: 'low'
});

// Priorité haute (affiché avant les messages normaux)
this.notification.show({
  message: 'Erreur importante',
  type: 'error',
  priority: 'high'
});

// Priorité critique (interrompt la notification en cours)
this.notification.critical('Erreur critique');
```

## Plan de migration étape par étape

### Étape 1 : Import du nouveau service

**Dans chaque fichier utilisant ToastNotificationService :**

```typescript
// Remplacer
import { ToastNotificationService } from './services/toast-notification.service';

// Par
import { NotificationService } from './services/notification.service';
```

### Étape 2 : Mise à jour du constructeur

```typescript
// Remplacer
constructor(private toast: ToastNotificationService) {}

// Par
constructor(private notification: NotificationService) {}
```

### Étape 3 : Remplacement des appels

**Utiliser la recherche/remplacement globale :**

1. Remplacer `this.toast.` par `this.notification.`
2. Vérifier chaque occurrence
3. Adapter les appels avec durées personnalisées (voir section ci-dessus)

### Étape 4 : Tests

1. Compiler l'application : `npm run build`
2. Exécuter les tests : `npm test`
3. Tester manuellement les notifications dans l'UI

## Compatibilité

### Ce qui fonctionne sans changement

✅ `success(message)`  
✅ `error(message)`  
✅ `warning(message)`  
✅ `info(message)`  
✅ `success(message, action, onAction)`  
✅ `clearQueue()`  
✅ `dismiss()`  

### Ce qui nécessite une adaptation

⚠️ Durées personnalisées → Utiliser `show()` avec config complète  
⚠️ Position personnalisée → Utiliser `show()` avec config complète  

## Exemples de migration réels

### Exemple 1 : Sauvegarde de dossier

**Avant :**
```typescript
saveDossier() {
  this.dossierService.save(this.dossier).subscribe({
    next: () => {
      this.toast.success('Dossier enregistré', 'Voir', () => {
        this.router.navigate(['/dossiers', this.dossier.id]);
      });
    },
    error: (err) => {
      this.toast.error('Échec de la sauvegarde');
    }
  });
}
```

**Après :**
```typescript
saveDossier() {
  this.dossierService.save(this.dossier).subscribe({
    next: () => {
      this.notification.successWithUndo('Dossier enregistré', () => {
        // Annulation : supprimer le dossier
        this.dossierService.delete(this.dossier.id).subscribe();
      });
    },
    error: (err) => {
      this.notification.errorWithRetry('Échec de la sauvegarde', () => {
        this.saveDossier();
      });
    }
  });
}
```

### Exemple 2 : Suppression avec confirmation

**Avant :**
```typescript
deleteItem(id: number) {
  this.service.delete(id).subscribe({
    next: () => {
      this.toast.success('Élément supprimé');
      this.loadItems();
    },
    error: () => {
      this.toast.error('Échec de la suppression');
    }
  });
}
```

**Après :**
```typescript
deleteItem(id: number) {
  const backup = this.items.find(i => i.id === id);
  
  this.service.delete(id).subscribe({
    next: () => {
      this.notification.successWithUndo('Élément supprimé', () => {
        // Restauration
        this.service.restore(backup).subscribe(() => {
          this.notification.success('Élément restauré');
          this.loadItems();
        });
      });
      this.loadItems();
    },
    error: () => {
      this.notification.errorWithRetry('Échec de la suppression', () => {
        this.deleteItem(id);
      });
    }
  });
}
```

### Exemple 3 : Erreur critique

**Avant :**
```typescript
handleConnectionError() {
  this.toast.error('Connexion perdue', 'Réessayer', () => {
    this.reconnect();
  }, 10000);
}
```

**Après :**
```typescript
handleConnectionError() {
  this.notification.critical('Connexion perdue', 'Reconnecter', () => {
    this.reconnect();
  });
  // Durée de 10s automatique pour les messages critiques
}
```

## Checklist de migration

- [ ] Remplacer les imports `ToastNotificationService` → `NotificationService`
- [ ] Mettre à jour les injections dans les constructeurs
- [ ] Remplacer `this.toast.` → `this.notification.`
- [ ] Adapter les appels avec durées personnalisées
- [ ] Utiliser les nouvelles méthodes de convenance (`successWithUndo`, etc.)
- [ ] Ajouter des messages critiques où approprié
- [ ] Compiler l'application sans erreurs
- [ ] Exécuter les tests unitaires
- [ ] Tester manuellement dans l'UI
- [ ] Vérifier le logging backend dans les logs serveur

## Support et questions

En cas de problème lors de la migration :

1. Consulter la [documentation complète](./NOTIFICATION_SERVICE_USAGE.md)
2. Tester avec le [composant de démo](../components/notification-demo.component.ts)
3. Vérifier les [exemples de tests](./notification.service.spec.ts)

## Dépréciation

Le `ToastNotificationService` reste disponible pour compatibilité mais est considéré comme **déprécié**. 

**Timeline de dépréciation :**
- ✅ Version actuelle : `NotificationService` disponible
- 📅 Dans 1 sprint : `ToastNotificationService` marqué `@deprecated`
- 📅 Dans 2 sprints : Migration complète requise
- 📅 Dans 3 sprints : `ToastNotificationService` supprimé

## Avantages après migration

Après la migration complète, votre application bénéficiera de :

1. **Meilleure UX** : Actions contextuelles et feedback enrichi
2. **Observabilité** : Erreurs automatiquement loggées au backend
3. **Maintenance** : Code plus lisible avec les méthodes de convenance
4. **Accessibilité** : Support amélioré du mode sombre et des standards WCAG
5. **Performance** : Queue optimisée avec priorisation intelligente

## Code example complet

### Avant (ToastNotificationService)
```typescript
import { Component } from '@angular/core';
import { ToastNotificationService } from './services/toast-notification.service';

@Component({
  selector: 'app-example',
  template: `<button (click)="save()">Save</button>`
})
export class ExampleComponent {
  constructor(private toast: ToastNotificationService) {}

  save() {
    this.service.save().subscribe({
      next: () => this.toast.success('Saved'),
      error: () => this.toast.error('Failed')
    });
  }
}
```

### Après (NotificationService)
```typescript
import { Component } from '@angular/core';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-example',
  template: `<button (click)="save()">Save</button>`
})
export class ExampleComponent {
  constructor(private notification: NotificationService) {}

  save() {
    this.service.save().subscribe({
      next: () => {
        this.notification.successWithUndo('Saved', () => this.undo());
      },
      error: () => {
        this.notification.errorWithRetry('Failed', () => this.save());
      }
    });
  }

  undo() {
    this.service.undo().subscribe(() => {
      this.notification.success('Undo successful');
    });
  }
}
```

---

**Bon courage pour la migration ! 🚀**
