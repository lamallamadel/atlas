# Notification Preferences Form Component

## Vue d'ensemble

Le `NotificationPreferencesFormComponent` est un composant Angular complet pour la gestion des préférences de notification utilisateur. Il offre une interface riche avec des contrôles interactifs pour configurer tous les aspects des notifications.

## Fonctionnalités

### 1. Canaux de notification (MatSlideToggle)

Contrôles pour activer/désactiver les canaux de communication :
- **Email** : Notifications par email
- **SMS** : Alertes par SMS
- **In-App** : Notifications dans l'application
- **Push** : Notifications push dans le navigateur

Chaque canal dispose d'un toggle avec icône et description.

### 2. Types de notification (MatSlideToggle)

Filtres par type d'événement :
- **Nouveau dossier** : Notification lors de la création d'un dossier
- **Nouveau message** : Alerte lors de la réception d'un message
- **Rendez-vous** : Rappels de rendez-vous à venir
- **Changement de statut** : Notification de changement de statut de dossier

### 3. Heures de silence (MatSlider)

Configuration d'une plage horaire de silence avec deux sliders :
- **Début du silence** : Heure de début (0-23h)
- **Fin du silence** : Heure de fin (0-23h)
- Gestion des plages qui traversent minuit (ex: 22h-8h)
- Indicateur visuel du mode silencieux actif

### 4. Fréquence de groupement (MatRadio)

Options de digest avec descriptions :
- **Instantané** : Notifications immédiates
- **Horaire** : Groupement par heure
- **Quotidien** : Résumé quotidien

### 5. Aperçu en temps réel

Section de preview dynamique montrant :
- Résumé des paramètres (canaux actifs, types activés, fréquence)
- Exemples de notifications basés sur les paramètres actuels
- Temps relatif (Il y a X min, Dans X min)
- Icônes des canaux actifs pour chaque notification

## Utilisation

### Import du module

```typescript
import { NotificationPreferencesFormComponent } from './components/notification-preferences-form.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatRadioModule } from '@angular/material/radio';

@NgModule({
  declarations: [NotificationPreferencesFormComponent],
  imports: [
    MatSlideToggleModule,
    MatSliderModule,
    MatRadioModule,
    // ... autres modules
  ]
})
```

### Utilisation dans un template

```html
<app-notification-preferences-form></app-notification-preferences-form>
```

### Utilisation dans la page de paramètres

```html
<mat-tab label="Notifications">
  <app-notification-preferences-form></app-notification-preferences-form>
</mat-tab>
```

## Structure des données

### NotificationPreferences

```typescript
interface NotificationPreferences {
  // Canaux
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  
  // Types
  newDossierEnabled: boolean;
  newMessageEnabled: boolean;
  appointmentEnabled: boolean;
  statusChangeEnabled: boolean;
  
  // Heures de silence
  quietHoursEnabled: boolean;
  quietHoursStart: number;  // 0-23
  quietHoursEnd: number;    // 0-23
  
  // Fréquence
  digestFrequency: 'instant' | 'hourly' | 'daily';
}
```

## API

### Propriétés

| Propriété | Type | Description |
|-----------|------|-------------|
| `preferencesForm` | FormGroup | Formulaire réactif des préférences |
| `loading` | boolean | État de chargement |
| `saving` | boolean | État de sauvegarde |
| `channels` | NotificationChannel[] | Liste des canaux disponibles |
| `notificationTypes` | NotificationType[] | Liste des types de notification |
| `digestFrequencies` | DigestFrequency[] | Options de fréquence |
| `exampleNotifications` | NotificationExample[] | Notifications d'exemple |
| `quietHoursStart` | number | Heure de début du silence |
| `quietHoursEnd` | number | Heure de fin du silence |
| `quietHoursEnabled` | boolean | État des heures de silence |

### Méthodes publiques

| Méthode | Description |
|---------|-------------|
| `onSave()` | Sauvegarde les préférences |
| `onCancel()` | Annule les modifications |
| `hasUnsavedChanges()` | Vérifie si des modifications sont en attente |
| `formatQuietHoursLabel(value: number)` | Formate l'heure (ex: 8 → "08:00") |
| `getQuietHoursDisplay()` | Retourne la plage horaire formatée |
| `getDigestFrequencyLabel()` | Retourne le label de la fréquence |
| `getEnabledChannelsCount()` | Compte les canaux actifs |
| `getEnabledTypesCount()` | Compte les types actifs |
| `getRelativeTime(date: Date)` | Calcule le temps relatif |
| `isQuietHoursActive()` | Vérifie si les heures de silence sont actives |

## Styles

### Classes CSS principales

- `.notification-preferences-form` : Container principal
- `.preferences-card` : Carte Material pour chaque section
- `.channels-grid` / `.types-grid` : Grilles responsive (2 colonnes sur desktop)
- `.quiet-hours-slider` : Slider d'heures de silence
- `.digest-frequency-group` : Groupe de radio buttons
- `.preview-card` : Carte d'aperçu avec gradient
- `.notification-example` : Exemple de notification

### Responsive

- **Desktop (≥768px)** : Grilles à 2 colonnes
- **Mobile (<768px)** : Grilles à 1 colonne, boutons en pleine largeur

### Dark mode

Support natif du mode sombre via `@media (prefers-color-scheme: dark)`.

## Animations

### slideDown

Animation d'apparition/disparition pour la configuration des heures de silence :

```typescript
trigger('slideDown', [
  transition(':enter', [
    style({ height: '0', opacity: '0', overflow: 'hidden' }),
    animate('300ms ease-out', style({ height: '*', opacity: '1' }))
  ]),
  transition(':leave', [
    style({ height: '*', opacity: '1', overflow: 'hidden' }),
    animate('300ms ease-in', style({ height: '0', opacity: '0' }))
  ])
])
```

### Autres animations CSS

- `fadeInUp` : Apparition des exemples de notification
- `pulse` : Pulsation de l'icône "heures de silence actives"
- Transitions hover sur tous les éléments interactifs

## Accessibilité

- Labels ARIA pour tous les toggles et sliders
- Navigation au clavier complète
- Contraste des couleurs conforme WCAG
- Messages d'état pour les actions (sauvegarde, annulation)
- Tooltips et descriptions pour chaque contrôle

## Intégration avec les services

### UserPreferencesService

Le composant s'appuie sur le `UserPreferencesService` pour :
- Charger les préférences au démarrage
- Sauvegarder les modifications
- Synchronisation automatique entre appareils (si activée)

### NotificationService

Notifications toast pour :
- Succès de sauvegarde
- Erreurs
- Avertissements (formulaire invalide)
- Informations (annulation)

## Exemples d'utilisation

### Utilisation standalone

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  template: `
    <div class="settings-container">
      <h1>Paramètres de notification</h1>
      <app-notification-preferences-form></app-notification-preferences-form>
    </div>
  `
})
export class SettingsComponent {}
```

### Utilisation dans un dialog

```typescript
import { MatDialog } from '@angular/material/dialog';

openNotificationSettings() {
  this.dialog.open(NotificationPreferencesFormComponent, {
    width: '1200px',
    maxHeight: '90vh'
  });
}
```

### Utilisation avec routage

```typescript
// app-routing.module.ts
{
  path: 'settings/notifications',
  component: NotificationPreferencesFormComponent
}
```

## Personnalisation

### Ajouter un canal

```typescript
// Dans le composant
channels: NotificationChannel[] = [
  // Canaux existants...
  { 
    id: 'whatsapp', 
    label: 'WhatsApp', 
    description: 'Notifications via WhatsApp',
    icon: 'chat',
    enabled: false 
  }
];

// Dans initializeForm()
this.preferencesForm = this.fb.group({
  // ... contrôles existants
  whatsappEnabled: [false]
});
```

### Ajouter un type de notification

```typescript
notificationTypes: NotificationType[] = [
  // Types existants...
  { 
    id: 'taskDue', 
    label: 'Tâche échue', 
    description: 'Notification quand une tâche arrive à échéance',
    icon: 'alarm',
    enabled: true 
  }
];
```

### Personnaliser les fréquences

```typescript
digestFrequencies: DigestFrequency[] = [
  { 
    value: 'instant', 
    label: 'Instantané', 
    description: 'Recevoir immédiatement',
    icon: 'flash_on' 
  },
  { 
    value: 'weekly', 
    label: 'Hebdomadaire', 
    description: 'Recevoir un résumé hebdomadaire',
    icon: 'date_range' 
  }
];
```

## Tests

Le composant est fourni avec une suite de tests complète (voir `notification-preferences-form.component.spec.ts`) couvrant :

- Initialisation du formulaire
- Chargement des préférences
- Mise à jour des exemples
- Calcul des heures de silence
- Formatage des labels
- Comptage des canaux/types actifs
- Détection des modifications
- Sauvegarde et gestion des erreurs
- Annulation des modifications
- Calcul du temps relatif

### Lancer les tests

```bash
ng test --include='**/notification-preferences-form.component.spec.ts'
```

## Performance

- **Debounce** : Les mises à jour de l'aperçu sont débounced (300ms) pour éviter les recalculs excessifs
- **distinctUntilChanged** : Évite les mises à jour inutiles si les valeurs n'ont pas changé
- **OnPush** : Peut être activé pour optimiser la détection de changements
- **Lazy loading** : Le composant peut être lazy-loadé dans un module de paramètres

## Dépendances

- Angular 15+
- Angular Material 15+
- RxJS 7+
- TypeScript 4.8+

## Maintenance

### TODO / Améliorations futures

- [ ] Support des notifications par catégorie de dossier
- [ ] Configuration du son de notification
- [ ] Preview audio du son
- [ ] Export/import des préférences
- [ ] Templates de préférences prédéfinis
- [ ] Historique des notifications
- [ ] Statistiques d'utilisation des notifications

## Support

Pour toute question ou problème, consultez :
- La documentation Angular Material : https://material.angular.io
- La documentation du projet
- Issues GitHub du projet
