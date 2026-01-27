# NotificationService - Guide d'utilisation

## Vue d'ensemble

Le `NotificationService` est un service wrapper autour de `MatSnackBar` qui fournit un système de notifications enrichi avec :

- **4 types prédéfinis** : success, error, warning, info
- **Actions contextuelles** : Annuler, Réessayer, Voir détails, Fermer
- **Durées adaptatives** selon l'importance du message
- **Queue intelligente** avec priorisation
- **Position configurable** (top/bottom, left/center/right)
- **Support du mode sombre** automatique
- **Logging automatique** des erreurs vers le backend pour observabilité

## Installation

Le service est déjà configuré dans le module principal et disponible via injection de dépendances.

```typescript
import { NotificationService } from './services/notification.service';

constructor(private notificationService: NotificationService) {}
```

## Utilisation basique

### Messages de succès

```typescript
// Succès simple
this.notificationService.success('Enregistrement réussi');

// Succès avec action
this.notificationService.success('Enregistrement réussi', 'Voir', () => {
  console.log('Action clicked');
});
```

### Messages d'erreur

```typescript
// Erreur simple (logs automatiquement au backend)
this.notificationService.error('Une erreur est survenue');

// Erreur sans logging backend
this.notificationService.error('Erreur de validation', undefined, undefined, false);

// Erreur avec action
this.notificationService.error('Échec de la sauvegarde', 'Réessayer', () => {
  this.retryOperation();
});
```

### Messages d'avertissement

```typescript
// Avertissement simple
this.notificationService.warning('Cette action est irréversible');

// Avertissement avec logging backend
this.notificationService.warning('Quota presque atteint', undefined, undefined, true);
```

### Messages d'information

```typescript
// Info simple
this.notificationService.info('Nouveau message reçu');

// Info avec action
this.notificationService.info('Mise à jour disponible', 'Voir détails', () => {
  this.showUpdateDetails();
});
```

### Messages critiques

```typescript
// Message critique (priorité maximale, durée 10s)
this.notificationService.critical('Connexion perdue avec le serveur', 'Reconnecter', () => {
  this.reconnect();
});
```

## Méthodes de convenance

### Succès avec annulation

```typescript
this.notificationService.successWithUndo('Dossier supprimé', () => {
  this.undoDelete();
});
```

### Erreur avec réessai

```typescript
this.notificationService.errorWithRetry('Échec de la synchronisation', () => {
  this.retrySync();
});
```

### Erreur avec détails

```typescript
this.notificationService.errorWithDetails('Erreur lors du traitement', () => {
  this.showErrorDetails();
});
```

## Configuration avancée

### Notification personnalisée

```typescript
this.notificationService.show({
  message: 'Opération en cours',
  type: 'info',
  action: 'Annuler',
  onAction: () => this.cancelOperation(),
  duration: 8000,
  dismissible: true,
  position: {
    horizontal: 'right',
    vertical: 'bottom'
  },
  priority: 'high'
});
```

### Priorités disponibles

- **low** : Messages informatifs non urgents (affichés en dernier)
- **normal** : Messages standards (success, info, warning)
- **high** : Messages d'erreur (affichés avant les messages normaux)
- **critical** : Messages critiques (affichés immédiatement, interrompent les notifications en cours)

### Durées par défaut

- **success** : 4 secondes
- **info** : 5 secondes
- **warning** : 6 secondes
- **error** : 8 secondes
- **critical** : 10 secondes

## Gestion de la file d'attente

```typescript
// Obtenir la longueur de la queue
const queueLength = this.notificationService.getQueueLength();

// Fermer la notification actuelle
this.notificationService.dismiss();

// Vider toute la queue
this.notificationService.clearQueue();
```

## Actions contextuelles standards

Le service reconnaît et supporte les actions suivantes :

- **Annuler** : Pour les opérations réversibles
- **Réessayer** : Pour les opérations échouées
- **Voir détails** : Pour afficher plus d'informations
- **Fermer** : Pour fermer manuellement

## Observabilité et logging backend

### Logging automatique

Les erreurs sont automatiquement loggées au backend via l'endpoint `/api/v1/observability/client-errors` :

```typescript
// Cette erreur sera automatiquement loggée
this.notificationService.error('Échec du chargement des données');
```

### Désactiver le logging

```typescript
// Erreur non loggée au backend
this.notificationService.error('Validation échouée', undefined, undefined, false);
```

### Informations loggées

- Message d'erreur
- Niveau (error/warning)
- Timestamp
- User agent
- URL de la page
- Contexte additionnel (pour les erreurs critiques)

## Support du mode sombre

Le service détecte automatiquement le thème actif via `ThemeService` et applique les styles appropriés :

- **Mode clair** : Couleurs vives avec ombres légères
- **Mode sombre** : Couleurs plus sombres avec ombres accentuées

Aucune configuration nécessaire, le support est automatique.

## Positions disponibles

### Horizontal
- `left`
- `center` (par défaut)
- `right`

### Vertical
- `top` (par défaut)
- `bottom`

## Exemples d'utilisation réels

### Sauvegarde avec confirmation et annulation

```typescript
saveDossier() {
  this.dossierService.save(this.dossier).subscribe({
    next: (saved) => {
      this.notificationService.successWithUndo(
        'Dossier enregistré',
        () => this.undoSave(saved.id)
      );
    },
    error: (err) => {
      this.notificationService.errorWithRetry(
        'Échec de l\'enregistrement',
        () => this.saveDossier()
      );
    }
  });
}
```

### Opération longue avec progression

```typescript
startExport() {
  this.notificationService.info('Export en cours...', 'Annuler', () => {
    this.cancelExport();
  });
  
  this.exportService.export().subscribe({
    next: () => {
      this.notificationService.success('Export terminé', 'Télécharger', () => {
        this.downloadExport();
      });
    },
    error: () => {
      this.notificationService.error('Échec de l\'export', 'Réessayer', () => {
        this.startExport();
      });
    }
  });
}
```

### Erreur critique avec contexte

```typescript
handleCriticalError(error: any) {
  this.notificationService.critical(
    'Erreur critique détectée',
    'Voir détails',
    () => this.showErrorDialog(error)
  );
  
  // Le contexte est automatiquement loggé au backend
}
```

## Meilleures pratiques

1. **Utilisez les méthodes spécifiques** : Préférez `success()`, `error()`, etc. à `show()` pour la clarté
2. **Actions significatives** : Fournissez toujours une action claire et utile
3. **Messages concis** : Limitez les messages à une ligne (max 2 lignes)
4. **Erreurs loggées** : Laissez le logging automatique activé pour les vraies erreurs
5. **Priorités appropriées** : Réservez `critical` pour les vraies urgences
6. **Testez les actions** : Assurez-vous que les callbacks d'action fonctionnent correctement

## Accessibilité

Le service respecte les standards d'accessibilité :

- Annonces ARIA automatiques
- Support clavier complet
- Contraste de couleurs conforme WCAG 2.1 AA
- Labels aria appropriés sur tous les boutons
- Temps d'affichage adaptés pour la lecture

## Tests

### Test unitaire exemple

```typescript
it('should show success notification', () => {
  const spy = spyOn(notificationService, 'show');
  notificationService.success('Test');
  expect(spy).toHaveBeenCalledWith({
    message: 'Test',
    type: 'success',
    action: undefined,
    onAction: undefined,
    priority: 'normal'
  });
});
```

## Dépannage

### Les notifications ne s'affichent pas

Vérifiez que `MatSnackBarModule` est importé dans votre module.

### Le style est incorrect

Assurez-vous que `styles.css` est bien chargé et contient les classes de notification.

### Les erreurs ne sont pas loggées au backend

- Vérifiez la connectivité réseau
- Vérifiez que l'utilisateur est authentifié
- Consultez la console pour les erreurs HTTP

### Plusieurs notifications se chevauchent

C'est normal : le service utilise une queue. Les notifications apparaissent séquentiellement.
