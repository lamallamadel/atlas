# Lottie Animations - Empty States

Système d'animations Lottie optimisé pour les états vides avec fallback SVG statique.

## Vue d'ensemble

Ce système fournit 5 animations JSON professionnelles pour améliorer l'expérience utilisateur des états vides :
- **search-empty** : Loupe flottante pour recherches vides
- **success** : Checkmark reveal pour succès
- **error** : Triangle d'avertissement pulsant pour erreurs
- **upload** : Nuage avec flèche pour upload de fichiers
- **maintenance** : Outils animés pour maintenance

## Caractéristiques

### ✨ Animations optimisées
- Taille < 50KB par animation (format JSON compressé)
- 30-60 FPS selon l'animation
- Boucle configurable avec options loop
- Vitesse réglable (0.5x - 2x)

### 🎯 Chargement intelligent
- **Lazy loading** : lottie-web chargé uniquement si nécessaire
- Import dynamique des JSON avec code-splitting
- Cache navigateur pour performances optimales

### 🛡️ Fallback robuste
- SVG statiques si Lottie échoue à charger
- Icônes Material Design cohérentes
- Dégradation gracieuse sans perte de fonctionnalité

### ♿ Accessibilité
- Attributs ARIA (role="img", aria-label)
- Support `prefers-reduced-motion`
- Focus keyboard accessible
- Screen reader friendly

### 📱 Responsive
- Adapté mobile, tablette, desktop
- Tailles configurables (width/height)
- Layout flexible

## Installation

### 1. Dépendance npm

```bash
cd frontend
npm install lottie-web@^5.12.2
```

Déjà configuré dans `package.json`:
```json
{
  "dependencies": {
    "lottie-web": "^5.12.2"
  }
}
```

### 2. Configuration Angular

Déjà configuré dans `angular.json`:
```json
{
  "allowedCommonJsDependencies": [
    "lottie-web"
  ]
}
```

### 3. Module Declaration

Déjà configuré dans `app.module.ts`:
```typescript
import { LottieAnimationComponent } from './components/lottie-animation.component';
import { AnimatedEmptyStateComponent } from './components/animated-empty-state.component';

@NgModule({
  declarations: [
    LottieAnimationComponent,
    AnimatedEmptyStateComponent
  ]
})
```

## Utilisation

### Option 1 : Composant Lottie standalone

```typescript
<app-lottie-animation
  [animationType]="'search-empty'"
  [width]="200"
  [height]="200"
  [loop]="true"
  [autoplay]="true"
  [speed]="1"
  [showControls]="false"
  (complete)="onAnimationComplete()"
  (error)="onAnimationError($event)">
</app-lottie-animation>
```

#### Inputs
- `animationType`: `'search-empty' | 'success' | 'error' | 'upload' | 'maintenance'`
- `width`: number (default: 200)
- `height`: number (default: 200)
- `loop`: boolean (default: true)
- `autoplay`: boolean (default: true)
- `speed`: number (default: 1, range: 0.5-2)
- `showControls`: boolean (default: false) - Affiche play/pause + slider vitesse

#### Outputs
- `animationCreated`: EventEmitter<any> - Émis quand l'animation est créée
- `complete`: EventEmitter<void> - Émis à la fin de l'animation
- `loopComplete`: EventEmitter<void> - Émis à chaque fin de boucle
- `error`: EventEmitter<Error> - Émis si chargement échoue

#### Méthodes publiques
```typescript
@ViewChild(LottieAnimationComponent) lottieComponent!: LottieAnimationComponent;

// Contrôles
this.lottieComponent.play();
this.lottieComponent.pause();
this.lottieComponent.stop();
this.lottieComponent.toggle();
this.lottieComponent.setSpeed(1.5);
this.lottieComponent.goToAndPlay(30);
this.lottieComponent.goToAndStop(60);
```

### Option 2 : Empty State animé (recommandé)

```typescript
<app-animated-empty-state
  [title]="'Aucun résultat trouvé'"
  [message]="'Essayez de modifier vos critères de recherche'"
  [animationType]="'search-empty'"
  [animationWidth]="200"
  [animationHeight]="200"
  [loop]="true"
  [showControls]="false"
  [primaryAction]="primaryActionConfig"
  [secondaryAction]="secondaryActionConfig"
  [helpLink]="helpLinkConfig">
</app-animated-empty-state>
```

#### Configuration des actions
```typescript
primaryActionConfig = {
  label: 'Nouvelle recherche',
  icon: 'search',
  handler: () => this.startNewSearch()
};

secondaryActionConfig = {
  label: 'Réinitialiser filtres',
  icon: 'filter_alt_off',
  handler: () => this.resetFilters()
};

helpLinkConfig = {
  label: 'Besoin d\'aide ?',
  url: 'https://docs.example.com/search'
};
```

## Cas d'usage

### 1. Recherche vide
```typescript
<app-animated-empty-state
  title="Aucun résultat"
  message="Essayez d'autres mots-clés"
  animationType="search-empty"
  [primaryAction]="{
    label: 'Nouvelle recherche',
    icon: 'search',
    handler: () => resetSearch()
  }">
</app-animated-empty-state>
```

### 2. Succès d'opération
```typescript
<app-animated-empty-state
  title="Enregistré !"
  message="Votre annonce a été créée avec succès"
  animationType="success"
  [loop]="false"
  [primaryAction]="{
    label: 'Voir l\'annonce',
    icon: 'visibility',
    handler: () => viewAnnonce()
  }">
</app-animated-empty-state>
```

### 3. Erreur
```typescript
<app-animated-empty-state
  title="Erreur de connexion"
  message="Impossible de contacter le serveur"
  animationType="error"
  [primaryAction]="{
    label: 'Réessayer',
    icon: 'refresh',
    handler: () => retry()
  }"
  [secondaryAction]="{
    label: 'Support',
    icon: 'support_agent',
    handler: () => contactSupport()
  }">
</app-animated-empty-state>
```

### 4. Upload de fichiers
```typescript
<app-animated-empty-state
  title="Aucun document"
  message="Glissez-déposez vos fichiers ici"
  animationType="upload"
  [primaryAction]="{
    label: 'Parcourir',
    icon: 'folder_open',
    handler: () => openFilePicker()
  }">
</app-animated-empty-state>
```

### 5. Maintenance
```typescript
<app-animated-empty-state
  title="Maintenance en cours"
  message="Nous reviendrons bientôt !"
  animationType="maintenance"
  [primaryAction]="{
    label: 'Vérifier le statut',
    icon: 'info',
    handler: () => checkStatus()
  }">
</app-animated-empty-state>
```

## Démo interactive

Component de démonstration disponible pour tester toutes les animations :

```typescript
import { LottieAnimationsDemoComponent } from './components/lottie-animations-demo.component';

// Dans un route ou dialog
<app-lottie-animations-demo></app-lottie-animations-demo>
```

La démo permet de :
- ✅ Voir toutes les animations côte à côte
- ✅ Activer/désactiver les contrôles
- ✅ Activer/désactiver la boucle
- ✅ Ajuster la taille (width/height)
- ✅ Tester les actions primaires/secondaires

## Architecture des fichiers

```
frontend/src/
├── app/
│   └── components/
│       ├── lottie-animation.component.ts       # Composant Lottie de base
│       ├── lottie-animation.component.html
│       ├── lottie-animation.component.css
│       ├── animated-empty-state.component.ts   # Empty state avec Lottie
│       ├── animated-empty-state.component.html
│       ├── animated-empty-state.component.css
│       ├── lottie-animations-demo.component.ts # Démo interactive
│       ├── lottie-animations-demo.component.html
│       ├── lottie-animations-demo.component.css
│       └── LOTTIE_ANIMATIONS_README.md
└── assets/
    ├── search-empty.animation.json   # 8.2 KB
    ├── success.animation.json        # 6.5 KB
    ├── error.animation.json          # 5.8 KB
    ├── upload.animation.json         # 7.1 KB
    └── maintenance.animation.json    # 9.3 KB
```

## Optimisation

### Bundle size impact
- **lottie-web (light)**: ~45KB gzipped (chargé lazy)
- **Animations JSON**: ~40KB total (5 fichiers)
- **Fallback SVG**: ~2KB inline

### Performance
- Premier chargement : ~47KB (lottie + 1 animation)
- Animations suivantes : cache (0KB)
- Fallback si erreur : <2KB

### Code splitting
```typescript
// lottie-web chargé uniquement si nécessaire
const lottie = await import('lottie-web/build/player/lottie_light');

// JSON chargé dynamiquement
const animationData = await import('../../assets/search-empty.animation.json');
```

## Personnalisation

### Créer une nouvelle animation

1. **Créer le JSON Lottie** (Adobe After Effects + Bodymovin, ou LottieFiles)
2. **Optimiser** : < 50KB, simplifier paths, réduire keyframes
3. **Ajouter** : `frontend/src/assets/nom-animation.animation.json`
4. **Déclarer le type** :
```typescript
// lottie-animation.component.ts
export type LottieAnimationType = 
  | 'search-empty' 
  | 'success' 
  | 'error' 
  | 'upload' 
  | 'maintenance'
  | 'nouvelle-animation'; // Ajouter ici
```

5. **Ajouter l'import** :
```typescript
// lottie-animation.component.ts
private async loadAnimationData(): Promise<any> {
  switch (this.animationType) {
    case 'nouvelle-animation':
      return (await import('../../assets/nouvelle-animation.animation.json')).default;
    // ...
  }
}
```

6. **Ajouter le fallback** :
```typescript
getFallbackIcon(): string {
  const icons: Record<LottieAnimationType, string> = {
    'nouvelle-animation': 'icon_name'
  };
  // ...
}

getFallbackColor(): string {
  const colors: Record<LottieAnimationType, string> = {
    'nouvelle-animation': '#hex-color'
  };
  // ...
}
```

### Personnaliser le style

Modifier les fichiers CSS des composants :
- `lottie-animation.component.css` : Style du player
- `animated-empty-state.component.css` : Style de l'empty state

## Accessibilité

### ARIA Labels
```html
<div 
  #lottieContainer 
  role="img"
  [attr.aria-label]="'Animation: ' + animationType">
</div>
```

### Reduced motion
```css
@media (prefers-reduced-motion: reduce) {
  /* Animations désactivées automatiquement */
  .lottie-animation-wrapper {
    animation: none;
  }
}
```

### Keyboard navigation
- Contrôles accessibles au clavier
- Focus visible (outline)
- Tab order logique

## Dépannage

### Animation ne se charge pas
1. Vérifier que lottie-web est installé : `npm list lottie-web`
2. Vérifier le chemin du JSON dans `loadAnimationData()`
3. Vérifier la console pour les erreurs
4. Le fallback SVG doit s'afficher automatiquement

### Performance lente
1. Réduire la taille des animations (simplifier paths)
2. Diminuer le framerate (30 FPS au lieu de 60)
3. Désactiver les contrôles si non nécessaires
4. Utiliser `loop: false` si possible

### Problème d'import JSON
1. Vérifier `tsconfig.json` : `"resolveJsonModule": true`
2. Vérifier `angular.json` : JSON dans `assets`
3. Redémarrer le serveur de dev

## Ressources

- [Lottie Web Documentation](https://github.com/airbnb/lottie-web)
- [LottieFiles](https://lottiefiles.com/) - Bibliothèque d'animations
- [Bodymovin](https://aescripts.com/bodymovin/) - Plugin After Effects

## Licence

Les animations JSON sont fournies sous licence MIT. Les icônes de fallback utilisent Material Icons (Apache 2.0).
