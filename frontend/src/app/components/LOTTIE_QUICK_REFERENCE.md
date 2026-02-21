# Lottie Animations - Quick Reference

## TL;DR - Copy-Paste Examples

### Basic Usage

```html
<!-- Standalone Lottie Animation -->
<app-lottie-animation
  animationType="search-empty"
  [width]="200"
  [height]="200">
</app-lottie-animation>

<!-- Animated Empty State (Recommended) -->
<app-animated-empty-state
  title="Aucun résultat"
  message="Essayez d'autres critères"
  animationType="search-empty"
  [primaryAction]="{ 
    label: 'Rechercher', 
    icon: 'search', 
    handler: () => search() 
  }">
</app-animated-empty-state>
```

## 5 Animation Types

| Type | Usage | Icon Fallback |
|------|-------|---------------|
| `search-empty` | Recherches vides | 🔍 search |
| `success` | Confirmations | ✅ check_circle |
| `error` | Erreurs | ⚠️ error |
| `upload` | Upload fichiers | ☁️ cloud_upload |
| `maintenance` | Maintenance | 🔧 build |

## Common Patterns

### Search Empty
```typescript
<app-animated-empty-state
  title="Aucun dossier trouvé"
  message="Aucun dossier ne correspond à vos critères"
  animationType="search-empty"
  [primaryAction]="{
    label: 'Réinitialiser',
    icon: 'refresh',
    handler: () => resetFilters()
  }">
</app-animated-empty-state>
```

### Success Confirmation
```typescript
<app-animated-empty-state
  title="Dossier créé !"
  message="Le dossier a été créé avec succès"
  animationType="success"
  [loop]="false"
  [primaryAction]="{
    label: 'Voir le dossier',
    icon: 'visibility',
    handler: () => navigate()
  }">
</app-animated-empty-state>
```

### Error State
```typescript
<app-animated-empty-state
  title="Erreur de chargement"
  message="Impossible de charger les données"
  animationType="error"
  [primaryAction]="{
    label: 'Réessayer',
    icon: 'refresh',
    handler: () => retry()
  }"
  [secondaryAction]="{
    label: 'Annuler',
    icon: 'close',
    handler: () => cancel()
  }">
</app-animated-empty-state>
```

### Upload Area
```typescript
<app-animated-empty-state
  title="Aucun document"
  message="Glissez-déposez ou cliquez pour uploader"
  animationType="upload"
  [primaryAction]="{
    label: 'Parcourir',
    icon: 'folder_open',
    handler: () => openFilePicker()
  }">
</app-animated-empty-state>
```

### Maintenance
```typescript
<app-animated-empty-state
  title="Service indisponible"
  message="Maintenance planifiée en cours"
  animationType="maintenance"
  [helpLink]="{
    label: 'Statut du service',
    url: 'https://status.example.com'
  }">
</app-animated-empty-state>
```

## Advanced Controls

### With Playback Controls
```typescript
<app-lottie-animation
  animationType="success"
  [showControls]="true"
  [loop]="true"
  [speed]="1"
  (complete)="onComplete()"
  (loopComplete)="onLoop()">
</app-lottie-animation>
```

### Programmatic Control
```typescript
@ViewChild(LottieAnimationComponent) lottie!: LottieAnimationComponent;

playAnimation() { this.lottie.play(); }
pauseAnimation() { this.lottie.pause(); }
stopAnimation() { this.lottie.stop(); }
speedUp() { this.lottie.setSpeed(2); }
jumpToFrame() { this.lottie.goToAndStop(30); }
```

## Size Presets

```typescript
// Small (Mobile)
[width]="120" [height]="120"

// Medium (Default)
[width]="200" [height]="200"

// Large (Desktop)
[width]="300" [height]="300"
```

## Performance Tips

✅ DO:
- Use `[loop]="false"` for one-time animations (success, error)
- Set appropriate sizes (smaller = faster)
- Rely on fallback for critical paths

❌ DON'T:
- Don't show controls in production (use `[showControls]="false"`)
- Don't use multiple large animations on same page
- Don't forget to handle `(error)` event

## Accessibility Checklist

```typescript
<app-animated-empty-state
  title="Clear, descriptive title"        <!-- ✅ Screen readers -->
  message="Helpful, actionable message"   <!-- ✅ Context -->
  [primaryAction]="{ 
    label: 'Action label',                <!-- ✅ Keyboard accessible -->
    handler: () => doAction() 
  }">
  <!-- ✅ prefers-reduced-motion respected -->
  <!-- ✅ Fallback SVG if animation fails -->
  <!-- ✅ ARIA labels on all elements -->
</app-animated-empty-state>
```

## Troubleshooting

### Animation not showing
1. Check browser console for errors
2. Verify animationType is correct
3. Ensure lottie-web is installed: `npm list lottie-web`
4. Fallback SVG should appear if Lottie fails

### Performance issues
1. Reduce animation size: `[width]="150" [height]="150"`
2. Disable loop: `[loop]="false"`
3. Lower speed: `[speed]="0.8"`

### TypeScript errors
```typescript
// Import types
import { LottieAnimationType } from './components/lottie-animation.component';
import { ActionButtonConfig } from './components/empty-state.component';
```

## File Sizes

| File | Size | Frames | FPS |
|------|------|--------|-----|
| search-empty.animation.json | 8.2 KB | 90 | 30 |
| success.animation.json | 6.5 KB | 60 | 60 |
| error.animation.json | 5.8 KB | 90 | 60 |
| upload.animation.json | 7.1 KB | 90 | 30 |
| maintenance.animation.json | 9.3 KB | 120 | 30 |
| **Total** | **37 KB** | - | - |

Plus lottie-web: ~45 KB (lazy loaded)

## Integration Checklist

- [x] `npm install lottie-web@^5.12.2`
- [x] Add to `angular.json` allowedCommonJsDependencies
- [x] Import components in `app.module.ts`
- [x] Add animation JSON files to `src/assets/`
- [x] Test fallback by disconnecting network
- [x] Verify accessibility with screen reader
- [x] Check performance on mobile devices

## Resources

- Full Documentation: `LOTTIE_ANIMATIONS_README.md`
- Demo Component: `<app-lottie-animations-demo>`
- Lottie Web: https://github.com/airbnb/lottie-web
- LottieFiles Library: https://lottiefiles.com/
