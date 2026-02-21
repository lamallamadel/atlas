# Settings Page - Guide de référence rapide

## Accès rapide

```bash
URL: /settings
Composant: SettingsPageComponent
Fichiers:
  - settings-page.component.ts
  - settings-page.component.html
  - settings-page.component.css
  - settings-page.component.spec.ts
```

## Structure des onglets

| Onglet | Icône | Rôle requis | Contenu |
|--------|-------|-------------|---------|
| Préférences | tune | Tous | Langue, mode affichage, densité, animations |
| Notifications | notifications | Tous | Canaux et types de notifications |
| Apparence | palette | Tous | Thème, formats date/heure, devise |
| Raccourcis | keyboard | Tous | Configuration raccourcis clavier |
| Intégrations | extension | Admin | Calendrier, email, WhatsApp, VoIP |
| Système | settings | Super-admin | Debug, monitoring, analytics |

## Formulaires

### Préférences (preferencesForm)
```typescript
{
  language: string,              // 'fr' | 'en' | 'es'
  dossierViewMode: string,       // 'list' | 'kanban'
  sidebarCollapsed: boolean,
  density: string,               // 'compact' | 'normal' | 'comfortable'
  animationsEnabled: boolean
}
```

### Notifications (notificationsForm)
```typescript
{
  emailEnabled: boolean,
  pushEnabled: boolean,
  smsEnabled: boolean,
  inAppEnabled: boolean,
  soundEnabled: boolean,
  desktopEnabled: boolean,
  dossierUpdates: boolean,
  taskReminders: boolean,
  appointmentReminders: boolean,
  systemAlerts: boolean
}
```

### Apparence (appearanceForm)
```typescript
{
  theme: 'light' | 'dark',
  dateFormat: string,            // 'dd/MM/yyyy' | 'MM/dd/yyyy' | etc.
  timeFormat: string,            // 'HH:mm' | 'hh:mm a'
  numberFormat: string,          // 'fr-FR' | 'en-US' | etc.
  currency: string,              // 'EUR' | 'USD' | 'GBP'
  timezone: string,              // 'Europe/Paris' | etc.
  firstDayOfWeek: number         // 0-6 (0 = dimanche)
}
```

### Raccourcis (shortcutsForm)
```typescript
{
  keyboardShortcutsEnabled: boolean,
  showShortcutHints: boolean,
  searchShortcut: string,              // '/'
  commandPaletteShortcut: string,      // 'Ctrl+K'
  navigateAnnouncesShortcut: string,   // 'g+a'
  navigateDossiersShortcut: string     // 'g+d'
}
```

## Méthodes principales

### Actions utilisateur
```typescript
onSave()              // Sauvegarde toutes les préférences
onCancel()            // Annule les modifications
onRestoreDefaults()   // Restaure paramètres par défaut
onTabChange(index)    // Change d'onglet
```

### Helpers
```typescript
hasUnsavedChanges(): boolean        // Détecte changements non sauvegardés
areFormsValid(): boolean            // Valide tous les formulaires
getFormattedPreviewDate(): string   // Formate date pour preview
getFormattedPreviewTime(): string   // Formate heure pour preview
```

## Services utilisés

```typescript
// Injection
constructor(
  private fb: FormBuilder,
  private userPreferencesService: UserPreferencesService,
  private themeService: ThemeService,
  private notificationService: NotificationService,
  private authService: AuthService
) {}

// Méthodes appelées
userPreferencesService.getPreferences()
userPreferencesService.updatePreferences(category, values)
userPreferencesService.resetToDefaults()
themeService.setTheme(theme)
notificationService.success/error/warning/info(message)
authService.getUserRoles()
```

## Snackbar messages

```typescript
'Préférences enregistrées avec succès'              // Succès
'Erreur lors de l\'enregistrement des préférences'  // Erreur
'Modifications annulées'                            // Info
'Paramètres par défaut restaurés'                   // Succès
'Veuillez corriger les erreurs dans le formulaire'  // Warning
'Erreur lors du chargement des préférences'         // Erreur
```

## États du composant

```typescript
loading: boolean          // Chargement initial
saving: boolean           // Sauvegarde en cours
isAdmin: boolean          // Utilisateur admin
isSuperAdmin: boolean     // Utilisateur super-admin
selectedTabIndex: number  // Index onglet actif
previewTheme: string      // Thème du preview
```

## Classes CSS principales

```css
.settings-page           /* Container principal */
.settings-header         /* En-tête avec titre */
.settings-tabs           /* Material tab group */
.tab-content             /* Contenu d'un onglet */
.settings-card           /* Carte Material */
.form-grid               /* Grille formulaire responsive */
.checkbox-group          /* Groupe de checkboxes */
.notification-item       /* Item de notification */
.theme-toggle-group      /* Sélecteur de thème */
.preview-card            /* Carte aperçu thème */
.preview-box             /* Boîte aperçu formats */
.shortcuts-list          /* Liste des raccourcis */
.integration-item        /* Item d'intégration */
.settings-actions        /* Barre d'actions sticky */
```

## Responsive breakpoints

```css
@media (max-width: 768px) {
  /* Mobile adaptations */
  .form-grid { grid-template-columns: 1fr; }
  .settings-actions { flex-direction: column; }
}
```

## Animations

```typescript
Duration: 300ms
Type: fadeIn, slideIn
Easing: ease-in-out, ease-out
```

## Validation

```typescript
// Validators utilisés
Validators.required
Validators.min(0)
Validators.max(6)

// Validation visuelle
.ng-invalid.ng-touched  /* Bordure rouge */
.ng-valid.ng-touched    /* Bordure verte */
```

## Exemple d'utilisation

### 1. Navigation vers settings
```html
<button mat-icon-button routerLink="/settings">
  <mat-icon>settings</mat-icon>
</button>
```

### 2. Accès programmatique
```typescript
this.router.navigate(['/settings']);
```

### 3. Modification d'une préférence
```typescript
// Dans le service ou composant parent
this.userPreferencesService.updatePreferences('ui', {
  theme: 'dark',
  language: 'fr'
}).subscribe(() => {
  console.log('Préférences mises à jour');
});
```

## Debug

### Console logs
```typescript
// Activer les logs de debug
console.log('Preferences loaded:', preferences);
console.log('Form values:', this.getAllFormValues());
console.log('Has unsaved changes:', this.hasUnsavedChanges());
```

### Dev tools
```typescript
// Inspecter le composant
const component = fixture.componentInstance;
console.log(component.preferencesForm.value);
console.log(component.tabs);
console.log(component.isAdmin);
```

## Raccourcis clavier

| Touche | Action |
|--------|--------|
| Tab | Navigation entre champs |
| Enter | Valider sélection dans select |
| Space | Toggle checkbox/slide-toggle |
| Esc | Fermer menus déroulants |

## Performance

```typescript
// Debounce sur les previews
debounceTime(100)

// Unsubscribe automatique
takeUntil(this.destroy$)

// Promise.all pour sauvegardes parallèles
Promise.all(saveOperations)
```

## Tests rapides

```bash
# Test du composant
ng test --include='**/settings-page.component.spec.ts'

# Test d'intégration
ng e2e --spec='settings-page.e2e.ts'

# Coverage
ng test --code-coverage --include='**/settings-page.component.spec.ts'
```

## Checklist d'implémentation

- [x] Composant TypeScript avec tous les formulaires
- [x] Template HTML avec onglets Material
- [x] Styles CSS responsive avec dark mode
- [x] Tests unitaires complets
- [x] Route configurée dans app-routing
- [x] Déclaration dans app.module
- [x] Service UserPreferences intégré
- [x] Validation inline
- [x] Previews en direct
- [x] Feedback snackbar
- [x] Gestion des rôles
- [x] Documentation README
- [x] Guide de référence rapide

## Troubleshooting

### Problème: Les préférences ne se chargent pas
**Solution:** Vérifier que `UserPreferencesService` est bien injecté et que l'API backend répond

### Problème: Les onglets admin/super-admin ne s'affichent pas
**Solution:** Vérifier que `AuthService.getUserRoles()` retourne les bons rôles

### Problème: Le thème ne change pas
**Solution:** Vérifier que `ThemeService.setTheme()` est appelé et que les classes CSS sont appliquées

### Problème: Les formulaires ne se valident pas
**Solution:** Vérifier les `Validators` et que tous les champs requis ont une valeur

### Problème: Les changements ne sont pas détectés
**Solution:** Vérifier que `hasUnsavedChanges()` compare correctement les objets JSON

## Support

Pour plus d'informations, consulter :
- `SETTINGS_PAGE_README.md` (documentation complète)
- `settings-page.component.spec.ts` (exemples de tests)
- `user-preferences.model.ts` (structure des données)
- `USER_PREFERENCES_README.md` (documentation du service)
