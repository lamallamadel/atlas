# UiPreferencesFormComponent - Guide Rapide

## Usage Rapide

```html
<app-ui-preferences-form></app-ui-preferences-form>
```

## Fonctionnalités Principales

| Fonctionnalité | Type de contrôle | Options |
|----------------|------------------|---------|
| **Thème** | MatRadioGroup | light, dark, auto |
| **Langue** | MatSelect | fr 🇫🇷, en 🇬🇧, es 🇪🇸 |
| **Densité** | MatButtonToggle | compact, comfortable, spacious |
| **Page par défaut** | MatAutocomplete | 7 routes disponibles |
| **Sync multi-appareils** | MatCheckbox | true/false |

## API Composant

### Propriétés publiques

```typescript
preferencesForm: FormGroup      // Formulaire réactif
loading: boolean               // État de chargement
saving: boolean                // État de sauvegarde
previewTheme: string          // Thème en preview
previewLanguage: string       // Langue en preview
previewDensity: string        // Densité en preview
```

### Méthodes publiques

```typescript
onSave()                      // Sauvegarde les préférences
onCancel()                    // Annule les modifications
hasUnsavedChanges()          // Détecte les changements non sauvegardés
getPreviewClasses()          // Retourne les classes CSS de preview
getPreviewText()             // Retourne le texte localisé
```

## Services Requis

```typescript
UserPreferencesService  // Gestion des préférences
ThemeService           // Gestion du thème
NotificationService    // Notifications utilisateur
```

## Structure des Données

### Préférences UI
```typescript
{
  theme: 'light' | 'dark' | 'auto',
  language: 'fr' | 'en' | 'es',
  density: 'compact' | 'comfortable' | 'spacious',
  defaultRoute: string,
  syncDevices: boolean
}
```

## Routes Disponibles

```typescript
const routes = [
  { path: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
  { path: '/dossiers', label: 'Dossiers', icon: 'folder' },
  { path: '/annonces', label: 'Annonces', icon: 'home' },
  { path: '/tasks', label: 'Tâches', icon: 'task' },
  { path: '/calendar', label: 'Calendrier', icon: 'calendar_today' },
  { path: '/search', label: 'Recherche', icon: 'search' },
  { path: '/reports', label: 'Rapports', icon: 'assessment' }
];
```

## Exemples d'Intégration

### Onglet dans les paramètres

```html
<mat-tab label="Préférences UI">
  <app-ui-preferences-form></app-ui-preferences-form>
</mat-tab>
```

### Page dédiée

```typescript
// Route
{ path: 'ui-preferences', component: UiPreferencesFormComponent }
```

### Dialog modal

```typescript
// Ouvrir dans un dialog
this.dialog.open(UiPreferencesFormComponent, {
  width: '900px',
  maxHeight: '90vh'
});
```

## Classes CSS Principales

```css
.ui-preferences-form          /* Container principal */
.preferences-card            /* Carte principale */
.form-section               /* Section de formulaire */
.theme-radio-group          /* Groupe radio des thèmes */
.density-toggle-group       /* Groupe toggle des densités */
.preview-zone               /* Zone de prévisualisation */
```

## Preview Variants

### Thèmes
```css
.preview-zone.theme-light    /* Gradient bleu clair */
.preview-zone.theme-dark     /* Gradient gris foncé */
.preview-zone.theme-auto     /* Gradient violet-bleu */
```

### Densités
```css
.preview-zone.density-compact      /* Compact: 16px padding */
.preview-zone.density-comfortable  /* Confortable: 24px padding */
.preview-zone.density-spacious     /* Spacieux: 32px padding */
```

## Événements et Comportements

| Action | Comportement |
|--------|-------------|
| Changement de formulaire | Preview mise à jour (debounce 100ms) |
| Saisie autocomplete | Filtrage des routes (debounce 200ms) |
| Clic Enregistrer | Sauvegarde + notification + application du thème |
| Clic Annuler | Restauration des valeurs originales |
| Sync activée | Message de confirmation spécial |

## Validation

```typescript
// Champs requis
theme: Validators.required
language: Validators.required
density: Validators.required
defaultRoute: Validators.required

// Champs optionnels
syncDevices: aucune validation
```

## Responsive Breakpoints

```css
@media (max-width: 768px) {
  /* Layout mobile */
  - Padding réduit
  - Layouts verticaux
  - Boutons pleine largeur
}
```

## Tests

```bash
# Exécuter les tests
ng test --include='**/ui-preferences-form.component.spec.ts'
```

### Coverage des tests
- ✅ Initialisation du formulaire
- ✅ Chargement des préférences
- ✅ Mise à jour preview temps réel
- ✅ Filtrage autocomplete
- ✅ Sauvegarde et erreurs
- ✅ Annulation et dirty checking
- ✅ Validation du formulaire

## Performance

| Optimisation | Valeur |
|-------------|--------|
| Debounce formulaire | 100ms |
| Debounce autocomplete | 200ms |
| Animations | CSS transitions |
| Change detection | OnPush-ready |

## Accessibilité

- ✅ Labels ARIA
- ✅ Hints descriptifs
- ✅ Support clavier complet
- ✅ États de validation visuels
- ✅ Focus management

## Dépendances Material

```typescript
MatCardModule
MatFormFieldModule
MatInputModule
MatSelectModule
MatRadioModule
MatButtonToggleModule
MatAutocompleteModule
MatCheckboxModule
MatIconModule
MatButtonModule
MatProgressBarModule
MatProgressSpinnerModule
MatDividerModule
```

## Commandes Utiles

```bash
# Générer le composant (déjà fait)
ng generate component ui-preferences-form

# Tester le composant
ng test

# Builder pour production
ng build --configuration production

# Analyser le bundle
ng build --stats-json
```

## Troubleshooting

### Le thème ne s'applique pas
```typescript
// Vérifier que ThemeService.setTheme() est appelé
this.themeService.setTheme(formValue.theme);
```

### Les préférences ne se sauvent pas
```typescript
// Vérifier la connexion au serveur
// Vérifier que l'utilisateur est authentifié
// Vérifier les logs du service UserPreferencesService
```

### L'autocomplete ne filtre pas
```typescript
// Vérifier le binding sur defaultRouteInput
// Vérifier que filteredRoutes est mis à jour
```

## Support

Pour plus d'informations, consulter :
- `UI_PREFERENCES_FORM_README.md` - Documentation complète
- `user-preferences.service.ts` - Service de préférences
- `theme.service.ts` - Service de thème
