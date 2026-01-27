# NotificationService - Système de notifications enrichies

## 🎯 Objectif

Fournir un système de notifications utilisateur robuste et élégant avec feedback visuel optimisé, priorisation intelligente, et observabilité backend intégrée.

## ✨ Fonctionnalités principales

### 1. Types prédéfinis
- ✅ **Success** - Opérations réussies (vert, 4s)
- ❌ **Error** - Erreurs et échecs (rouge, 8s, logging auto)
- ⚠️ **Warning** - Avertissements (orange, 6s)
- ℹ️ **Info** - Informations générales (bleu, 5s)
- 🚨 **Critical** - Erreurs critiques (rouge, 10s, priorité maximale)

### 2. Actions contextuelles
- **Annuler** - Pour opérations réversibles (undo)
- **Réessayer** - Pour opérations échouées (retry)
- **Voir détails** - Pour afficher plus d'informations
- **Fermer** - Pour fermer manuellement

### 3. Durées adaptatives
Les durées sont automatiquement ajustées selon :
- Le type de message (success < info < warning < error)
- La priorité (low < normal < high < critical)
- Durées personnalisables par notification

### 4. Queue intelligente avec priorisation
```
Priority Queue:
┌─────────────────────────────┐
│ CRITICAL (immédiat)         │
├─────────────────────────────┤
│ HIGH (errors)               │
├─────────────────────────────┤
│ NORMAL (success/warning)    │
├─────────────────────────────┤
│ LOW (info non urgente)      │
└─────────────────────────────┘
```

### 5. Positions configurables
- **Horizontal** : left, center, right
- **Vertical** : top, bottom
- **Défaut** : top-center (meilleure visibilité)

### 6. Support du mode sombre
- Détection automatique via `ThemeService`
- Couleurs adaptées pour chaque thème
- Ombres accentuées en mode sombre

### 7. Observabilité backend
- Logging automatique des erreurs
- Endpoint : `POST /api/v1/observability/client-errors`
- Informations envoyées :
  - Message d'erreur
  - Niveau (error/warning)
  - Timestamp
  - User agent
  - URL de la page
  - Stack trace (si disponible)
  - Contexte additionnel

## 📦 Architecture

```
NotificationService
├── Service principal (notification.service.ts)
│   ├── Méthodes de base (success, error, warning, info, critical)
│   ├── Méthodes de convenance (successWithUndo, errorWithRetry, etc.)
│   ├── Gestion de queue avec priorisation
│   ├── Logging backend automatique
│   └── Support du mode sombre
│
├── Composant UI (enhanced-snackbar.component.ts)
│   ├── Template avec icônes et actions
│   ├── Animations d'entrée/sortie
│   ├── Styles adaptatifs (thème clair/sombre)
│   └── Accessibilité (ARIA, clavier)
│
├── Styles globaux (styles.css)
│   ├── Classes par type (.notification-success, etc.)
│   ├── Support du mode sombre (.dark-theme-snackbar)
│   └── Animations et transitions
│
└── Backend
    ├── Controller (ObservabilityController.java)
    ├── DTO (ClientErrorLogRequest.java)
    └── Tests (ObservabilityControllerTest.java)
```

## 🚀 Utilisation rapide

### Installation
```typescript
import { NotificationService } from './services/notification.service';

constructor(private notificationService: NotificationService) {}
```

### Exemples basiques
```typescript
// Success
this.notificationService.success('Dossier enregistré');

// Error avec retry
this.notificationService.errorWithRetry(
  'Échec de la sauvegarde',
  () => this.save()
);

// Success avec undo
this.notificationService.successWithUndo(
  'Élément supprimé',
  () => this.undoDelete()
);

// Critical error
this.notificationService.critical(
  'Connexion perdue',
  'Reconnecter',
  () => this.reconnect()
);
```

## 📊 Diagramme de flux

```
┌─────────────────────────────────────────────────┐
│ Component appelle notificationService.error()  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Service ajoute à la queue (priorisation)       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Log automatique vers backend (async)           │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Affichage snackbar avec EnhancedSnackbar       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Utilisateur lit message ou clique action       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Callback action exécuté (si fourni)            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Fermeture après durée ou action                │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Notification suivante dans la queue            │
└─────────────────────────────────────────────────┘
```

## 🎨 Design tokens

### Couleurs (Mode clair)
```css
Success: #4caf50 (vert)
Error:   #f44336 (rouge)
Warning: #ff9800 (orange)
Info:    #2196f3 (bleu)
```

### Couleurs (Mode sombre)
```css
Success: #388e3c (vert foncé)
Error:   #d32f2f (rouge foncé)
Warning: #f57c00 (orange foncé)
Info:    #1976d2 (bleu foncé)
```

### Durées
```typescript
Success:  4000ms
Info:     5000ms
Warning:  6000ms
Error:    8000ms
Critical: 10000ms
```

## 🔒 Sécurité

### Authentification requise
L'endpoint `/api/v1/observability/client-errors` requiert une authentification :
```java
@PreAuthorize("isAuthenticated()")
```

### Validation des données
```java
@NotBlank(message = "Message is required")
String message,

@Pattern(regexp = "error|warning|info")
String level
```

### Protection contre les abus
- Rate limiting au niveau API Gateway (si configuré)
- Validation stricte des payloads
- Pas de données sensibles loggées

## ♿ Accessibilité

### WCAG 2.1 AA Compliance
- ✅ Contraste de couleurs conforme
- ✅ Annonces ARIA automatiques
- ✅ Support clavier complet
- ✅ Labels appropriés sur tous les boutons
- ✅ Durées d'affichage adaptées

### Support clavier
- `Tab` : Navigation entre actions
- `Enter` : Activer l'action
- `Escape` : Fermer (si dismissible)

## 📈 Métriques et observabilité

### Logs backend
```
[ERROR] Client ERROR - Message: Failed to load data, 
        URL: http://app.com/dossiers, 
        UserAgent: Mozilla/5.0..., 
        Timestamp: 2024-01-15T10:30:00Z
```

### Métriques disponibles
- Nombre d'erreurs client par page
- Taux d'erreurs par user agent
- Patterns d'erreurs fréquentes
- Timeline des erreurs critiques

## 🧪 Tests

### Tests unitaires
```bash
cd frontend
npm test -- notification.service.spec.ts
```

### Tests backend
```bash
cd backend
mvn test -Dtest=ObservabilityControllerTest
```

### Tests E2E
Utiliser `NotificationDemoComponent` pour tester visuellement :
- Tous les types de notifications
- Toutes les positions
- Priorisation de la queue
- Actions contextuelles
- Support du mode sombre

## 🔧 Configuration avancée

### Position par défaut
```typescript
// Dans notification.service.ts
private readonly DEFAULT_POSITIONS = {
  horizontal: 'center' as MatSnackBarHorizontalPosition,
  vertical: 'top' as MatSnackBarVerticalPosition
};
```

### Durées par défaut
```typescript
// Dans notification.service.ts
private readonly DEFAULT_DURATIONS = {
  success: 4000,
  info: 5000,
  warning: 6000,
  error: 8000,
  critical: 10000
};
```

### Désactiver le logging global
```typescript
// Pour une erreur spécifique
this.notificationService.error('Message', undefined, undefined, false);
```

## 🐛 Dépannage

### Problème : Les notifications ne s'affichent pas
**Solution** : Vérifier que `MatSnackBarModule` est importé dans `app.module.ts`

### Problème : Les styles ne s'appliquent pas
**Solution** : Vérifier que les classes CSS sont bien dans `styles.css`

### Problème : Les erreurs ne sont pas loggées
**Solution** :
1. Vérifier l'authentification utilisateur
2. Vérifier la connectivité réseau
3. Consulter la console navigateur pour les erreurs HTTP

### Problème : Queue ne respecte pas la priorité
**Solution** : Vérifier que `priority` est bien défini dans `NotificationConfig`

## 📚 Ressources

- [Documentation complète](./NOTIFICATION_SERVICE_USAGE.md)
- [Composant de démo](../components/notification-demo.component.ts)
- [Tests unitaires](./notification.service.spec.ts)
- [Tests backend](../../backend/src/test/java/.../ObservabilityControllerTest.java)

## 🤝 Contribution

Pour ajouter un nouveau type de notification :

1. Ajouter le type dans `NotificationType`
2. Créer une méthode dans `NotificationService`
3. Ajouter les styles CSS correspondants
4. Ajouter l'icône dans `EnhancedSnackbarComponent`
5. Mettre à jour la documentation

## 📝 Changelog

### Version 1.0.0 (2024-01)
- ✨ Système de notifications enrichies
- ✨ 4 types prédéfinis + critical
- ✨ Actions contextuelles
- ✨ Queue avec priorisation
- ✨ Logging backend automatique
- ✨ Support du mode sombre
- ✨ Positions configurables
- ✨ Durées adaptatives
- ✨ Composant de démo
- ✨ Documentation complète

## 📄 Licence

Propriétaire - Usage interne uniquement
