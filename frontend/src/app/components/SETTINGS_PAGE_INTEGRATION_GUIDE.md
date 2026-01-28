# Settings Page - Guide d'intégration

## Intégration dans le menu de navigation

### Option 1: Ajouter au menu latéral (sidebar)

Modifier `app-layout.component.html` pour ajouter l'entrée de menu :

```html
<!-- Après les autres entrées de menu, avant ou après le divider -->
<mat-divider></mat-divider>
<a mat-list-item 
   routerLink="/settings" 
   routerLinkActive="active" 
   (click)="closeSidenavOnMobile()"
   aria-label="Accéder aux paramètres">
  <mat-icon matListItemIcon aria-hidden="true">settings</mat-icon>
  <span matListItemTitle>Paramètres</span>
</a>
```

### Option 2: Ajouter au menu utilisateur (toolbar)

Si vous avez un menu utilisateur dans la toolbar :

```html
<!-- Dans le menu utilisateur -->
<button mat-menu-item routerLink="/settings">
  <mat-icon>settings</mat-icon>
  <span>Paramètres</span>
</button>
```

### Option 3: Bouton dans la toolbar

```html
<!-- Toolbar -->
<mat-toolbar color="primary">
  <button mat-icon-button [matMenuTriggerFor]="menu">
    <mat-icon>account_circle</mat-icon>
  </button>
  
  <mat-menu #menu="matMenu">
    <button mat-menu-item routerLink="/settings">
      <mat-icon>settings</mat-icon>
      <span>Paramètres</span>
    </button>
    <button mat-menu-item (click)="logout()">
      <mat-icon>logout</mat-icon>
      <span>Déconnexion</span>
    </button>
  </mat-menu>
</mat-toolbar>
```

## Intégration du raccourci clavier

### Dans le KeyboardShortcutService

Ajouter un raccourci pour accéder rapidement aux paramètres :

```typescript
// Dans keyboard-shortcut.service.ts
this.registerShortcut({
  key: 'g+s',
  description: 'Aller aux paramètres',
  category: 'navigation',
  sequence: true,
  action: () => this.navigateToSettings()
});

private navigateToSettings(): void {
  this.router.navigate(['/settings']);
}
```

### Dans le CommandPaletteComponent

Ajouter une commande dans la palette :

```typescript
{
  id: 'settings',
  label: 'Ouvrir les paramètres',
  icon: 'settings',
  action: () => this.router.navigate(['/settings']),
  keywords: ['paramètres', 'settings', 'préférences', 'configuration']
}
```

## Intégration avec le profil utilisateur

### Afficher un indicateur de préférences non sauvegardées

```typescript
// Dans un composant parent ou service
export class UserProfileService {
  hasPendingPreferences(): Observable<boolean> {
    return this.userPreferencesService.preferences$.pipe(
      map(prefs => {
        // Logique pour détecter des changements non synchronisés
        return this.userPreferencesService.hasPendingUpdates();
      })
    );
  }
}
```

```html
<!-- Dans la navigation -->
<a mat-list-item routerLink="/settings">
  <mat-icon matListItemIcon>settings</mat-icon>
  <span matListItemTitle>Paramètres</span>
  <mat-icon *ngIf="hasPendingPreferences$ | async" 
            class="warning-badge"
            matTooltip="Modifications non sauvegardées">
    warning
  </mat-icon>
</a>
```

## Intégration du thème

### Synchronisation automatique du thème

Le composant Settings Page applique automatiquement le thème via `ThemeService.setTheme()`.

Pour s'assurer que le thème est appliqué au démarrage de l'application :

```typescript
// Dans app.component.ts
export class AppComponent implements OnInit {
  constructor(
    private userPreferencesService: UserPreferencesService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Appliquer le thème sauvegardé au démarrage
    this.userPreferencesService.getPreferences()
      .pipe(take(1))
      .subscribe(prefs => {
        if (prefs.ui?.theme) {
          this.themeService.setTheme(prefs.ui.theme);
        }
      });
  }
}
```

## Intégration des notifications

### Écouter les changements de préférences de notification

```typescript
export class NotificationManagerService {
  constructor(
    private userPreferencesService: UserPreferencesService,
    private pushNotificationService: PushNotificationService
  ) {
    this.watchNotificationPreferences();
  }

  private watchNotificationPreferences(): void {
    this.userPreferencesService.getPreferences()
      .pipe(
        map(prefs => prefs.notifications),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe(notifPrefs => {
        // Activer/désactiver les notifications push
        if (notifPrefs?.pushEnabled) {
          this.pushNotificationService.requestPermission();
        }

        // Activer/désactiver les sons
        if (notifPrefs?.soundEnabled) {
          this.enableNotificationSounds();
        } else {
          this.disableNotificationSounds();
        }

        // etc.
      });
  }
}
```

## Intégration avec les formulaires

### Appliquer les préférences de format dans les formulaires

```typescript
export class DossierFormComponent implements OnInit {
  dateFormat = 'dd/MM/yyyy';
  
  constructor(private userPreferencesService: UserPreferencesService) {}

  ngOnInit(): void {
    this.userPreferencesService.getPreferences()
      .pipe(take(1))
      .subscribe(prefs => {
        if (prefs.formats?.dateFormat) {
          this.dateFormat = prefs.formats.dateFormat;
        }
      });
  }
}
```

```html
<!-- Dans le template -->
<mat-form-field>
  <mat-label>Date</mat-label>
  <input matInput 
         [matDatepicker]="picker" 
         formControlName="date">
  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
  <mat-datepicker #picker></mat-datepicker>
  <mat-hint>Format: {{ dateFormat }}</mat-hint>
</mat-form-field>
```

## Intégration de la densité d'affichage

### Appliquer la densité dans les composants

```typescript
// Dans un composant de liste
export class DossierListComponent implements OnInit {
  density: 'compact' | 'normal' | 'comfortable' = 'normal';
  
  constructor(private userPreferencesService: UserPreferencesService) {}

  ngOnInit(): void {
    this.userPreferencesService.getPreferences()
      .subscribe(prefs => {
        if (prefs.ui?.density) {
          this.density = prefs.ui.density;
        }
      });
  }
}
```

```html
<!-- Template avec classes conditionnelles -->
<div class="dossier-list" [class]="'density-' + density">
  <!-- Contenu -->
</div>
```

```css
/* Styles pour les différentes densités */
.dossier-list.density-compact {
  .dossier-item {
    padding: 8px;
    min-height: 48px;
  }
}

.dossier-list.density-normal {
  .dossier-item {
    padding: 12px;
    min-height: 64px;
  }
}

.dossier-list.density-comfortable {
  .dossier-item {
    padding: 16px;
    min-height: 80px;
  }
}
```

## Intégration avec le mode hors-ligne

### Gérer les modifications hors-ligne

Le `UserPreferencesService` gère automatiquement les modifications hors-ligne via le système de pending updates.

Pour afficher l'état de synchronisation :

```html
<!-- Dans la page de paramètres ou le header -->
<div class="sync-status" *ngIf="userPreferencesService.hasPendingUpdates()">
  <mat-icon>sync_problem</mat-icon>
  <span>{{ userPreferencesService.getPendingUpdatesCount() }} modification(s) en attente de synchronisation</span>
  <button mat-button (click)="forceSyncNow()">
    Synchroniser maintenant
  </button>
</div>
```

```typescript
forceSyncNow(): void {
  this.userPreferencesService.forceSyncNow()
    .subscribe({
      next: () => {
        this.notificationService.success('Synchronisation réussie');
      },
      error: () => {
        this.notificationService.error('Échec de la synchronisation');
      }
    });
}
```

## Intégration avec les animations

### Désactiver les animations selon les préférences

```typescript
// Dans app.component.ts
export class AppComponent implements OnInit {
  constructor(
    private userPreferencesService: UserPreferencesService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.userPreferencesService.getPreferences()
      .subscribe(prefs => {
        if (prefs.ui?.animationsEnabled === false) {
          this.document.body.classList.add('no-animations');
        } else {
          this.document.body.classList.remove('no-animations');
        }
      });
  }
}
```

```css
/* Dans styles.css global */
.no-animations,
.no-animations * {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
}
```

## Intégration avec le garde de navigation

### Avertir des changements non sauvegardés

```typescript
// settings-page-can-deactivate.guard.ts
import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { SettingsPageComponent } from './settings-page.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmNavigationDialogComponent } from './confirm-navigation-dialog.component';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SettingsPageCanDeactivateGuard implements CanDeactivate<SettingsPageComponent> {
  constructor(private dialog: MatDialog) {}

  canDeactivate(component: SettingsPageComponent): Observable<boolean> | boolean {
    if (!component.hasUnsavedChanges()) {
      return true;
    }

    const dialogRef = this.dialog.open(ConfirmNavigationDialogComponent, {
      data: {
        title: 'Modifications non sauvegardées',
        message: 'Vous avez des modifications non sauvegardées. Voulez-vous vraiment quitter cette page ?'
      }
    });

    return dialogRef.afterClosed().pipe(
      map(result => result === true)
    );
  }
}
```

```typescript
// Dans app-routing.module.ts
{ 
  path: 'settings', 
  component: SettingsPageComponent,
  canDeactivate: [SettingsPageCanDeactivateGuard],
  data: { animation: 'SettingsPage' } 
}
```

## Intégration avec les tests E2E

### Exemple de test Playwright

```typescript
// settings-page.e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Naviguer vers la page de paramètres
    await page.click('a[href="/settings"]');
    await page.waitForURL('/settings');
  });

  test('should display all tabs', async ({ page }) => {
    const tabs = page.locator('.mat-tab-label');
    await expect(tabs).toHaveCount(4); // 4 tabs pour un utilisateur standard
    
    await expect(page.locator('text=Préférences')).toBeVisible();
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Apparence')).toBeVisible();
    await expect(page.locator('text=Raccourcis')).toBeVisible();
  });

  test('should save preferences', async ({ page }) => {
    // Changer la langue
    await page.click('mat-select[formControlName="language"]');
    await page.click('mat-option:has-text("English")');
    
    // Sauvegarder
    await page.click('button:has-text("Enregistrer")');
    
    // Vérifier le snackbar de succès
    await expect(page.locator('text=Préférences enregistrées avec succès')).toBeVisible();
  });

  test('should change theme with live preview', async ({ page }) => {
    // Aller à l'onglet Apparence
    await page.click('text=Apparence');
    
    // Changer le thème
    await page.click('mat-button-toggle[value="dark"]');
    
    // Vérifier que le preview change
    await expect(page.locator('.preview-card.dark-preview')).toBeVisible();
  });

  test('should restore defaults', async ({ page }) => {
    // Modifier une valeur
    await page.click('mat-select[formControlName="language"]');
    await page.click('mat-option:has-text("English")');
    
    // Restaurer les valeurs par défaut
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Restaurer par défaut")');
    
    // Vérifier le snackbar
    await expect(page.locator('text=Paramètres par défaut restaurés')).toBeVisible();
  });
});
```

## Intégration mobile

### Adaptations pour mobile

```html
<!-- Dans app-layout.component.html pour mobile -->
<app-mobile-bottom-navigation>
  <button mat-icon-button routerLink="/settings">
    <mat-icon [matBadge]="hasPendingPreferences$ | async ? '!' : null" 
              matBadgeColor="warn">
      settings
    </mat-icon>
  </button>
</app-mobile-bottom-navigation>
```

### Gestes tactiles

```typescript
// Dans settings-page.component.ts
@HostListener('swiperight')
onSwipeRight(): void {
  if (this.selectedTabIndex > 0) {
    this.selectedTabIndex--;
  }
}

@HostListener('swipeleft')
onSwipeLeft(): void {
  if (this.selectedTabIndex < this.tabs.length - 1) {
    this.selectedTabIndex++;
  }
}
```

## Checklist d'intégration

- [ ] Ajouter l'entrée de menu dans la navigation
- [ ] Configurer le raccourci clavier
- [ ] Ajouter la commande dans la palette de commandes
- [ ] Intégrer le thème au démarrage de l'application
- [ ] Gérer les préférences de notification
- [ ] Appliquer les formats dans les formulaires
- [ ] Implémenter la densité d'affichage
- [ ] Gérer le mode hors-ligne
- [ ] Configurer les animations
- [ ] Ajouter le garde de navigation (optionnel)
- [ ] Créer les tests E2E
- [ ] Adapter pour mobile
- [ ] Tester avec différents rôles (user, admin, super-admin)
- [ ] Vérifier l'accessibilité
- [ ] Documenter pour l'équipe

## Prochaines étapes

1. Tester la page avec des données réelles
2. Ajouter des analytics pour suivre l'utilisation des paramètres
3. Implémenter des suggestions intelligentes
4. Ajouter l'export/import de configuration
5. Créer un système de templates de paramètres
6. Implémenter le partage de configuration entre utilisateurs (admin)
