# UserPreferencesService

Service Angular pour la gestion complète des préférences utilisateur avec synchronisation réactive, cache local, polling périodique et gestion offline.

## Fonctionnalités

### ✅ Gestion des préférences par catégorie
- **Catégories supportées**: `ui`, `notifications`, `formats`, `shortcuts`
- API REST backend: `/api/v1/user/preferences`
- Méthodes CRUD complètes par catégorie

### ✅ Cache local avec BehaviorSubject
- Synchronisation UI réactive via observable `preferences$`
- Émission automatique lors de toute modification
- Support de multiples subscribers
- Persistance dans `localStorage`

### ✅ Polling périodique (5 minutes)
- Détection automatique des modifications cross-tab
- Détection automatique des modifications cross-device
- Synchronisation en arrière-plan
- Désactivation automatique en mode offline

### ✅ Gestion offline complète
- Queue des modifications en attente
- Retry automatique jusqu'à 3 tentatives
- Application automatique au retour de la connexion
- Fusion intelligente des modifications en attente
- Updates optimistes (UI instantanée)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UserPreferencesService                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  BehaviorSubject │◄────────┤  preferences$    │          │
│  │  (State Cache)   │         │  (Observable)    │          │
│  └────────┬─────────┘         └──────────────────┘          │
│           │                                                   │
│           ├─► Component 1 (auto-sync)                        │
│           ├─► Component 2 (auto-sync)                        │
│           └─► Component N (auto-sync)                        │
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  localStorage    │◄────────┤  Offline Queue   │          │
│  │  (Persistence)   │         │  (Pending)       │          │
│  └────────┬─────────┘         └──────────────────┘          │
│           │                                                   │
│  ┌────────▼─────────┐         ┌──────────────────┐          │
│  │  Polling Timer   │         │  Online Monitor  │          │
│  │  (5 min)         │◄────────┤  (OfflineService)│          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        │                                     │
│                   ┌────▼─────┐                               │
│                   │  Backend │                               │
│                   │  API     │                               │
│                   └──────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

## Installation

```typescript
import { UserPreferencesService } from './services/user-preferences.service';

constructor(private preferencesService: UserPreferencesService) {}
```

## Utilisation

### 1. Écouter les changements de préférences (Réactif)

```typescript
// S'abonner aux changements
this.preferencesService.preferences$.subscribe(preferences => {
  console.log('Preferences changed:', preferences);
  this.theme = preferences.ui?.theme || 'light';
  this.language = preferences.ui?.language || 'fr';
});

// Multiples composants peuvent s'abonner simultanément
// Tous reçoivent automatiquement les mises à jour
```

### 2. Récupérer les préférences actuelles

```typescript
// Méthode synchrone
const currentPrefs = this.preferencesService.getCurrentPreferences();
console.log(currentPrefs.ui?.theme);

// Méthode observable
this.preferencesService.getPreferences().subscribe(prefs => {
  console.log(prefs);
});

// Par catégorie
this.preferencesService.getPreferencesByCategory('ui').subscribe(uiPrefs => {
  console.log(uiPrefs);
});
```

### 3. Mettre à jour des préférences

```typescript
// Mise à jour par catégorie
this.preferencesService.updatePreferences('ui', {
  theme: 'dark',
  language: 'fr',
  dossierViewMode: 'kanban'
}).subscribe(response => {
  console.log('Updated:', response);
});

// Mise à jour immédiate dans l'UI (optimistic update)
// Synchronisation automatique avec le backend
// Queue automatique si offline
```

### 4. Réinitialiser aux valeurs par défaut

```typescript
// Réinitialiser toutes les préférences
this.preferencesService.resetToDefaults().subscribe(defaults => {
  console.log('Reset to:', defaults);
});

// Les valeurs par défaut proviennent de l'organisation et du système
```

### 5. Gestion offline

```typescript
// Vérifier s'il y a des modifications en attente
const hasPending = this.preferencesService.hasPendingUpdates();
const pendingCount = this.preferencesService.getPendingUpdatesCount();

// Forcer une synchronisation immédiate
this.preferencesService.forceSyncNow().subscribe(() => {
  console.log('Sync completed');
});
```

## Exemple complet : Composant de paramètres

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserPreferencesService } from './services/user-preferences.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-settings',
  template: `
    <div class="settings">
      <h2>Préférences utilisateur</h2>
      
      <!-- Thème -->
      <div class="setting-group">
        <label>Thème</label>
        <select [(ngModel)]="theme" (change)="updateTheme()">
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
        </select>
      </div>

      <!-- Langue -->
      <div class="setting-group">
        <label>Langue</label>
        <select [(ngModel)]="language" (change)="updateLanguage()">
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>

      <!-- Mode d'affichage -->
      <div class="setting-group">
        <label>Mode d'affichage des dossiers</label>
        <select [(ngModel)]="viewMode" (change)="updateViewMode()">
          <option value="list">Liste</option>
          <option value="kanban">Kanban</option>
        </select>
      </div>

      <!-- Indicateur offline -->
      <div *ngIf="hasPendingUpdates" class="offline-indicator">
        {{ pendingCount }} modification(s) en attente de synchronisation
      </div>

      <!-- Actions -->
      <button (click)="resetToDefaults()">Réinitialiser</button>
      <button (click)="syncNow()" *ngIf="hasPendingUpdates">
        Synchroniser maintenant
      </button>
    </div>
  `
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  theme = 'light';
  language = 'fr';
  viewMode: 'list' | 'kanban' = 'list';
  hasPendingUpdates = false;
  pendingCount = 0;

  private destroy$ = new Subject<void>();

  constructor(private preferencesService: UserPreferencesService) {}

  ngOnInit(): void {
    // S'abonner aux changements de préférences
    this.preferencesService.preferences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(prefs => {
        this.theme = prefs.ui?.theme || 'light';
        this.language = prefs.ui?.language || 'fr';
        this.viewMode = prefs.ui?.dossierViewMode || 'list';
        
        this.hasPendingUpdates = this.preferencesService.hasPendingUpdates();
        this.pendingCount = this.preferencesService.getPendingUpdatesCount();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateTheme(): void {
    this.preferencesService.updatePreferences('ui', { theme: this.theme })
      .subscribe();
  }

  updateLanguage(): void {
    this.preferencesService.updatePreferences('ui', { language: this.language })
      .subscribe();
  }

  updateViewMode(): void {
    this.preferencesService.updatePreferences('ui', { 
      dossierViewMode: this.viewMode 
    }).subscribe();
  }

  resetToDefaults(): void {
    if (confirm('Réinitialiser toutes les préférences ?')) {
      this.preferencesService.resetToDefaults().subscribe();
    }
  }

  syncNow(): void {
    this.preferencesService.forceSyncNow().subscribe(() => {
      console.log('Synchronisation terminée');
    });
  }
}
```

## Exemple : Utilisation dans un Guard

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserPreferencesService } from './services/user-preferences.service';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ThemeGuard implements CanActivate {
  constructor(
    private preferencesService: UserPreferencesService,
    private router: Router
  ) {}

  canActivate() {
    return this.preferencesService.getPreferences().pipe(
      map(prefs => {
        // Appliquer le thème avant d'activer la route
        const theme = prefs.ui?.theme || 'light';
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
        return true;
      })
    );
  }
}
```

## Exemple : Directive réactive au thème

```typescript
import { Directive, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { UserPreferencesService } from './services/user-preferences.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[appThemed]'
})
export class ThemedDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private el: ElementRef,
    private preferencesService: UserPreferencesService
  ) {}

  ngOnInit(): void {
    this.preferencesService.preferences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(prefs => {
        const theme = prefs.ui?.theme || 'light';
        this.el.nativeElement.setAttribute('data-theme', theme);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Catégories de préférences

### UI (`ui`)
```typescript
{
  theme: 'light' | 'dark',
  language: 'fr' | 'en',
  dossierViewMode: 'list' | 'kanban',
  sidebarCollapsed: boolean,
  dashboardLayout: DashboardLayout,
  widgetSettings: WidgetSettings,
  density: 'compact' | 'normal' | 'comfortable',
  animationsEnabled: boolean
}
```

### Notifications (`notifications`)
```typescript
{
  emailEnabled: boolean,
  pushEnabled: boolean,
  smsEnabled: boolean,
  inAppEnabled: boolean,
  soundEnabled: boolean,
  desktopEnabled: boolean,
  channels: {
    dossierUpdates: boolean,
    taskReminders: boolean,
    appointmentReminders: boolean,
    systemAlerts: boolean
  }
}
```

### Formats (`formats`)
```typescript
{
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm',
  numberFormat: 'fr-FR',
  currency: 'EUR',
  timezone: 'Europe/Paris',
  firstDayOfWeek: 1
}
```

### Raccourcis (`shortcuts`)
```typescript
{
  'create-dossier': 'Ctrl+N',
  'search': 'Ctrl+K',
  'save': 'Ctrl+S'
}
```

## Persistance et synchronisation

### LocalStorage
- **Clé principale**: `user_preferences`
- **Queue offline**: `user_preferences_pending`
- **Dernier sync**: `user_preferences_last_sync`

### Stratégie de synchronisation

1. **Chargement initial**:
   - Charge depuis localStorage (instantané)
   - Charge depuis le serveur (avec retry)
   - Met à jour le cache local

2. **Mise à jour**:
   - Update optimiste (UI immédiate)
   - Sauvegarde localStorage
   - Envoi au serveur (ou queue si offline)

3. **Polling (5 min)**:
   - Vérifie les changements serveur
   - Compare avec cache local
   - Met à jour si différent (cross-tab/device)

4. **Retour online**:
   - Détecte le changement de statut
   - Process la queue des modifications
   - Retry jusqu'à 3 fois par modification
   - Recharge depuis le serveur

## Gestion des erreurs

### Erreurs réseau
```typescript
// Retry automatique (2 tentatives)
// Fallback vers le cache local
// Queue automatique si offline
```

### Erreurs localStorage
```typescript
// Console.error mais n'empêche pas le fonctionnement
// Dégradation gracieuse sans persistance locale
```

### Erreurs de synchronisation
```typescript
// Retry jusqu'à 3 fois avec délai de 5 secondes
// Après 3 échecs, modification ignorée (logged)
```

## Performance

### Optimisations
- ✅ BehaviorSubject pour émissions instantanées
- ✅ ShareReplay pour éviter requêtes HTTP multiples
- ✅ Debouncing du polling quand inactif
- ✅ Désactivation polling en mode offline
- ✅ Updates optimistes (pas d'attente réseau)

### Mémoire
- ✅ Cleanup automatique via `OnDestroy`
- ✅ Unsubscribe automatique via `takeUntil`
- ✅ Pas de memory leaks

## Tests

### Test unitaires
```bash
npm test -- --include='**/user-preferences.service.spec.ts'
```

### Couverture
- ✅ Initialisation et chargement
- ✅ BehaviorSubject et réactivité
- ✅ Méthodes CRUD
- ✅ Gestion offline et queue
- ✅ Polling périodique
- ✅ Détection cross-tab/device
- ✅ Reset et defaults
- ✅ Gestion des erreurs
- ✅ LocalStorage persistence
- ✅ API legacy (backward compatibility)

## Migration depuis l'ancienne API

### Avant
```typescript
// API legacy (toujours supportée)
preferencesService.setPreference('dossierViewMode', 'kanban');
const mode = preferencesService.getPreference('dossierViewMode', 'list');
```

### Après (Recommandé)
```typescript
// Nouvelle API par catégorie
preferencesService.updatePreferences('ui', { dossierViewMode: 'kanban' })
  .subscribe();

// Réactivité
preferencesService.preferences$.subscribe(prefs => {
  const mode = prefs.ui?.dossierViewMode || 'list';
});
```

## API Backend

### Endpoints
- `GET /api/v1/user/preferences` - Toutes les préférences
- `GET /api/v1/user/preferences/{category}` - Par catégorie
- `PUT /api/v1/user/preferences/{category}` - Mettre à jour
- `POST /api/v1/user/preferences/reset` - Réinitialiser

### Authentification
- Requires JWT token ou session valide
- User ID extrait du contexte d'authentification
- Isolation multi-tenant automatique

## Bonnes pratiques

### ✅ À faire
```typescript
// Toujours unsubscribe
ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// Utiliser takeUntil
this.preferencesService.preferences$
  .pipe(takeUntil(this.destroy$))
  .subscribe(...);

// Mise à jour atomique par catégorie
this.preferencesService.updatePreferences('ui', { theme: 'dark' });
```

### ❌ À éviter
```typescript
// Ne pas oublier d'unsubscribe (memory leak)
this.preferencesService.preferences$.subscribe(...);

// Ne pas modifier directement l'objet
const prefs = this.preferencesService.getCurrentPreferences();
prefs.ui.theme = 'dark'; // ❌ Mutation directe

// Ne pas faire de requêtes HTTP manuelles
// Le service gère tout automatiquement
```

## Troubleshooting

### Les préférences ne se synchronisent pas
1. Vérifier la connexion réseau
2. Vérifier `hasPendingUpdates()` pour voir la queue
3. Forcer une synchro avec `forceSyncNow()`
4. Vérifier les logs console pour les erreurs

### Le polling ne fonctionne pas
1. Vérifier que le service n'est pas en mode offline
2. Vérifier les intervalles (5 min par défaut)
3. Vérifier que le composant n'a pas destroy le service

### LocalStorage plein
1. Les préférences sont légères (~10-50KB)
2. Vérifier les quotas navigateur (5-10MB)
3. Nettoyer avec `clearPreferences()` si nécessaire

## Licence

Ce service fait partie de l'application Atlas et est soumis à la même licence.
