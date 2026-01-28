# UiPreferencesFormComponent

Composant de formulaire de préférences d'interface utilisateur avec prévisualisation en temps réel et synchronisation multi-appareils.

## Fonctionnalités

### 1. Sélecteur de thème (MatRadioGroup)
- **Options disponibles** :
  - Clair (light) - Thème clair
  - Sombre (dark) - Thème sombre
  - Auto - S'adapte automatiquement aux préférences système
- Icônes Material pour chaque option
- Visual feedback avec bordures et fond coloré

### 2. Sélecteur de langue (MatSelect)
- **Langues disponibles** :
  - Français 🇫🇷 (fr)
  - English 🇬🇧 (en)
  - Español 🇪🇸 (es)
- Affichage avec drapeaux emoji
- Icône de traduction en préfixe

### 3. Sélecteur de densité (MatButtonToggle)
- **Options disponibles** :
  - Compact - Maximum de contenu sur l'écran
  - Confortable - Équilibre entre contenu et espacement
  - Spacieux - Plus d'espace, moins de contenu
- Icônes et descriptions pour chaque option
- Layout vertical pour une meilleure lisibilité

### 4. Page par défaut (MatAutocomplete)
- **Routes disponibles** :
  - Tableau de bord (`/dashboard`)
  - Dossiers (`/dossiers`)
  - Annonces (`/annonces`)
  - Tâches (`/tasks`)
  - Calendrier (`/calendar`)
  - Recherche (`/search`)
  - Rapports (`/reports`)
- Recherche en temps réel avec filtrage
- Affichage des icônes et chemins
- Autocomplétion intelligente

### 5. Zone de prévisualisation en temps réel
- **Mise à jour dynamique** :
  - Changements de thème avec gradients adaptés
  - Adaptation de la densité (padding et espacement)
  - Texte multilingue selon la langue sélectionnée
  - Affichage de la route par défaut
- **Contenu de la preview** :
  - Header avec icône et titre
  - Détails des préférences sélectionnées
  - Boutons d'exemple
  - Carte d'exemple
  - Footer informatif
- Transitions fluides entre les états

### 6. Synchronisation multi-appareils
- Option pour synchroniser les préférences
- Indicateur visuel de synchronisation active
- Message de confirmation spécifique lors de la sauvegarde
- Intégration avec le service UserPreferencesService

## Utilisation

### Dans un template
```html
<app-ui-preferences-form></app-ui-preferences-form>
```

### Dans les paramètres existants
Le composant peut être intégré dans la page de paramètres existante comme un onglet ou une section :

```html
<mat-tab label="Préférences UI">
  <app-ui-preferences-form></app-ui-preferences-form>
</mat-tab>
```

## Structure du formulaire

```typescript
preferencesForm = {
  theme: 'light' | 'dark' | 'auto',
  language: 'fr' | 'en' | 'es',
  density: 'compact' | 'comfortable' | 'spacious',
  defaultRoute: string,
  syncDevices: boolean,
  defaultRouteInput: string // Utilisé pour l'autocomplete
}
```

## Services utilisés

### UserPreferencesService
- `getPreferences()` - Charge les préférences depuis le serveur
- `updatePreferences(category, values)` - Sauvegarde les préférences

### ThemeService
- `setTheme(theme)` - Applique le thème sélectionné

### NotificationService
- `success()`, `error()`, `warning()`, `info()` - Notifications utilisateur

## Caractéristiques techniques

### Réactivité
- Formulaire réactif avec validation
- Détection des changements non sauvegardés
- Debounce sur les changements pour la performance

### Prévisualisation
- Classes CSS dynamiques basées sur les sélections
- Gradients et couleurs adaptés au thème
- Spacing adaptatif selon la densité
- Textes multilingues

### Accessibilité
- Labels clairs et descriptifs
- Hints pour guider l'utilisateur
- États de validation
- Support du clavier

### Responsive
- Adaptation mobile avec grilles flexibles
- Layout vertical sur petits écrans
- Boutons pleine largeur sur mobile

## Styles

Les styles sont organisés en sections :
- **Form sections** - Layout et espacement des sections
- **Theme radio group** - Styling des boutons radio de thème
- **Density toggle** - Styling des toggles de densité
- **Route autocomplete** - Styling de l'autocomplete
- **Preview zone** - Styling de la zone de prévisualisation
- **Animations** - Transitions et animations
- **Responsive** - Adaptations mobiles

### Thèmes de la preview
- **light** - Gradient bleu clair
- **dark** - Gradient gris foncé
- **auto** - Gradient violet-bleu

### Densités de la preview
- **compact** - padding: 16px, items: 8px
- **comfortable** - padding: 24px, items: 12px
- **spacious** - padding: 32px, items: 16px

## Exemple de sauvegarde

```typescript
// Données sauvegardées
{
  theme: 'dark',
  language: 'en',
  density: 'compact',
  defaultRoute: '/dossiers',
  syncDevices: true
}
```

Le service `UserPreferencesService` gère :
- La sauvegarde locale (localStorage)
- La synchronisation serveur
- La gestion hors ligne avec queue de mises à jour
- La synchronisation cross-device/cross-tab

## Tests

Le composant inclut des tests unitaires complets :
- Initialisation du formulaire
- Chargement des préférences
- Mise à jour de la preview en temps réel
- Filtrage des routes
- Sauvegarde et gestion d'erreurs
- Annulation des modifications
- Détection des changements non sauvegardés
- Validation du formulaire

## Personnalisation

### Ajouter une nouvelle route
```typescript
availableRoutes: Route[] = [
  // ... routes existantes
  { path: '/nouvelle-page', label: 'Nouvelle Page', icon: 'new_icon' }
];
```

### Ajouter une nouvelle langue
```typescript
languages = [
  // ... langues existantes
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' }
];

// Ajouter les textes dans getPreviewText()
de: {
  welcome: 'Willkommen',
  description: '...',
  button: '...'
}
```

### Ajouter une nouvelle densité
```typescript
densities = [
  // ... densités existantes
  { 
    value: 'extra-spacious', 
    label: 'Très spacieux', 
    description: 'Maximum d\'espace',
    icon: 'view_agenda'
  }
];

// Ajouter les styles CSS correspondants
.preview-zone.density-extra-spacious {
  padding: 40px;
}
```

## Intégration

Le composant est déjà déclaré dans `app.module.ts` et peut être utilisé directement.

### Dans la page de paramètres
Ajouter un nouvel onglet dans `SettingsPageComponent` :

```typescript
// settings-page.component.ts
tabs = [
  // ... autres onglets
  { label: 'Préférences UI', value: 'ui-preferences', icon: 'palette', visible: true }
];
```

```html
<!-- settings-page.component.html -->
<div *ngIf="tab.value === 'ui-preferences'">
  <app-ui-preferences-form></app-ui-preferences-form>
</div>
```

## Performance

- Debouncing des changements de formulaire (100ms)
- Debouncing de l'autocomplete (200ms)
- Chargement des préférences avec gestion du cache
- Optimisation des animations CSS
- Utilisation de `distinctUntilChanged` pour éviter les mises à jour inutiles

## Sécurité

- Validation des entrées utilisateur
- Sanitization automatique par Angular
- Gestion sécurisée des tokens et authentification via les services
- Pas de stockage de données sensibles

## Maintenance

Le composant est conçu pour être facilement maintenable :
- Code TypeScript typé
- Séparation claire des responsabilités
- Services injectables et testables
- Documentation inline
- Tests unitaires complets
