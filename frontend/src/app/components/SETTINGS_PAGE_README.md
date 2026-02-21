# Settings Page Component

## Vue d'ensemble

Le composant `SettingsPageComponent` fournit une interface complète pour gérer les préférences utilisateur avec plusieurs catégories d'options, une validation inline, des aperçus en direct, et une gestion des rôles utilisateur.

## Fonctionnalités principales

### 1. Organisation par onglets

L'interface est organisée en onglets avec Material TabGroup :

- **Préférences** : Paramètres généraux (langue, mode d'affichage, densité, animations)
- **Notifications** : Configuration des canaux et types de notifications
- **Apparence** : Thème, formats de date/heure, devise, fuseau horaire
- **Raccourcis** : Configuration des raccourcis clavier
- **Intégrations** : (Admin seulement) Intégrations tierces (calendrier, email, WhatsApp, VoIP)
- **Système** : (Super-admin seulement) Paramètres système avancés

### 2. Formulaires réactifs par catégorie

Chaque onglet dispose de son propre `FormGroup` avec validation :

```typescript
// Exemple de formulaire avec validation
this.preferencesForm = this.fb.group({
  language: ['fr', Validators.required],
  dossierViewMode: ['list', Validators.required],
  sidebarCollapsed: [false],
  density: ['normal', Validators.required],
  animationsEnabled: [true]
});
```

### 3. Validation inline

- Validation en temps réel avec Material Form Field
- Messages d'erreur contextuels
- Indicateurs visuels (bordures colorées) pour les champs valides/invalides
- Désactivation du bouton "Enregistrer" si le formulaire est invalide

### 4. Aperçus en direct

#### Aperçu du thème
- Changement visuel immédiat lors de la sélection du thème
- Carte de préview avec le style du thème sélectionné

#### Aperçu des formats
- Affichage en temps réel de la date formatée selon le format choisi
- Affichage en temps réel de l'heure formatée selon le format choisi

```typescript
// Mise à jour automatique du preview
this.appearanceForm.get('theme')?.valueChanges
  .pipe(debounceTime(100), distinctUntilChanged(), takeUntil(this.destroy$))
  .subscribe(theme => this.previewTheme = theme);
```

### 5. Gestion des actions

#### Bouton Enregistrer
- Sauvegarde toutes les préférences par catégorie
- Affiche un spinner pendant la sauvegarde
- Applique immédiatement le thème sélectionné
- Feedback via snackbar de succès/erreur

```typescript
onSave(): void {
  if (!this.areFormsValid()) {
    this.notificationService.warning('Veuillez corriger les erreurs');
    return;
  }
  
  this.saving = true;
  // Sauvegarde par catégorie...
  Promise.all(saveOperations)
    .then(() => {
      this.themeService.setTheme(allValues.appearance.theme);
      this.notificationService.success('Préférences enregistrées avec succès');
    })
    .catch(() => {
      this.notificationService.error('Erreur lors de l\'enregistrement');
    });
}
```

#### Bouton Annuler
- Restaure les valeurs originales
- Détecte automatiquement les changements non sauvegardés
- Désactivé si aucun changement n'a été effectué

#### Bouton Restaurer par défaut
- Restaure tous les paramètres aux valeurs par défaut
- Confirmation avant restauration
- Feedback via snackbar

### 6. Gestion des rôles

Le composant adapte l'interface selon le rôle de l'utilisateur :

```typescript
private checkUserRoles(): void {
  const roles = this.authService.getUserRoles();
  this.isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('admin');
  this.isSuperAdmin = roles.includes('ROLE_SUPER_ADMIN') || roles.includes('super-admin');
}
```

- **Utilisateur standard** : 4 onglets (Préférences, Notifications, Apparence, Raccourcis)
- **Admin** : +1 onglet (Intégrations)
- **Super-admin** : +2 onglets (Intégrations, Système)

### 7. Feedback utilisateur

#### Snackbar notifications
- **Succès** : "Préférences enregistrées avec succès"
- **Erreur** : "Erreur lors de l'enregistrement des préférences"
- **Info** : "Modifications annulées"
- **Warning** : "Veuillez corriger les erreurs dans le formulaire"

#### Indicateurs visuels
- Progress bar pendant le chargement initial
- Spinner dans le bouton "Enregistrer" pendant la sauvegarde
- Boutons désactivés selon l'état du formulaire

## Utilisation

### Navigation

Ajoutez un lien de navigation vers les paramètres :

```html
<a mat-list-item routerLink="/settings">
  <mat-icon>settings</mat-icon>
  <span>Paramètres</span>
</a>
```

### Route

La route est déjà configurée dans `app-routing.module.ts` :

```typescript
{ path: 'settings', component: SettingsPageComponent, data: { animation: 'SettingsPage' } }
```

## Structure des données

### UserPreferences

Les préférences sont organisées par catégories :

```typescript
interface UserPreferences {
  ui?: UiPreferences;
  notifications?: NotificationPreferences;
  formats?: FormatPreferences;
  shortcuts?: ShortcutPreferences;
  integrations?: IntegrationPreferences;
  system?: SystemPreferences;
}
```

### Sauvegarde

Les préférences sont sauvegardées par catégorie via le `UserPreferencesService` :

```typescript
this.userPreferencesService.updatePreferences('ui', uiPrefs)
this.userPreferencesService.updatePreferences('notifications', notificationPrefs)
this.userPreferencesService.updatePreferences('formats', formatPrefs)
// etc.
```

## Style et thème

### Responsive design

Le composant s'adapte aux différentes tailles d'écran :

- Desktop : Grille 2 colonnes pour les formulaires
- Tablette : Grille 1 colonne
- Mobile : Boutons en pleine largeur, stack vertical

### Dark mode

Le composant supporte automatiquement le mode sombre :

```css
.dark-theme .settings-page {
  background-color: #1e1e1e;
}

.dark-theme .settings-card {
  background: #2d2d2d;
}
```

### Animations

- Fade-in pour le contenu des onglets (300ms)
- Slide-in pour les cartes (300ms)
- Transitions smooth pour les toggles et checkboxes

## Accessibilité

- Labels ARIA sur tous les contrôles de formulaire
- Navigation au clavier complète
- Indicateurs visuels clairs pour les états (focus, hover, disabled)
- Messages d'erreur associés aux champs via aria-describedby
- Contraste conforme WCAG AA en mode clair et sombre

## Exemple d'intégration complète

```typescript
// Dans le menu de navigation
<mat-sidenav-content>
  <mat-toolbar>
    <button mat-icon-button (click)="sidenav.toggle()">
      <mat-icon>menu</mat-icon>
    </button>
    <span>Mon Application</span>
    <span class="spacer"></span>
    <button mat-icon-button routerLink="/settings">
      <mat-icon>settings</mat-icon>
    </button>
  </mat-toolbar>
  
  <router-outlet></router-outlet>
</mat-sidenav-content>
```

## Tests

Le composant inclut des tests unitaires complets couvrant :

- Initialisation des formulaires
- Chargement des préférences
- Sauvegarde des modifications
- Annulation des changements
- Restauration des valeurs par défaut
- Gestion des erreurs
- Validation des formulaires
- Détection des changements non sauvegardés
- Mise à jour des previews en direct
- Gestion des rôles utilisateur

```bash
# Exécuter les tests
npm test -- --include='**/settings-page.component.spec.ts'
```

## Personnalisation

### Ajouter une nouvelle option

1. Ajouter le champ au formulaire :

```typescript
this.preferencesForm = this.fb.group({
  // ... champs existants
  newOption: ['default', Validators.required]
});
```

2. Ajouter le contrôle dans le template :

```html
<mat-form-field appearance="outline">
  <mat-label>Nouvelle option</mat-label>
  <mat-select formControlName="newOption">
    <mat-option value="option1">Option 1</mat-option>
    <mat-option value="option2">Option 2</mat-option>
  </mat-select>
</mat-form-field>
```

3. Mettre à jour la méthode de sauvegarde :

```typescript
const uiPrefs = {
  // ... préférences existantes
  newOption: allValues.preferences.newOption
};
```

### Ajouter un nouvel onglet

1. Ajouter l'onglet dans `initializeTabs()` :

```typescript
{ label: 'Nouvel onglet', value: 'newtab', icon: 'new_icon', visible: true }
```

2. Créer le formulaire correspondant

3. Ajouter la section dans le template

## Dépendances

- Angular Material (Tabs, Cards, Forms, Buttons, etc.)
- Reactive Forms
- RxJS
- UserPreferencesService
- ThemeService
- NotificationService
- AuthService

## Support et maintenance

Pour toute question ou problème concernant le composant Settings Page :

1. Vérifier la console pour les erreurs
2. Vérifier que les services sont correctement injectés
3. Vérifier que les routes sont configurées
4. Vérifier les permissions utilisateur pour les onglets admin
5. Consulter les tests unitaires pour des exemples d'utilisation
