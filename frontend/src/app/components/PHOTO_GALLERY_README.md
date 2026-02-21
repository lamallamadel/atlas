# PhotoGalleryComponent

Un composant de galerie photo immobilière avec layout masonry responsive, lightbox full-screen, lazy loading, drag-and-drop, et optimisations d'images.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Installation](#installation)
- [Utilisation de base](#utilisation-de-base)
- [Interface Photo](#interface-photo)
- [Props et événements](#props-et-événements)
- [Masonry Layout](#masonry-layout)
- [Lightbox](#lightbox)
- [Lazy Loading](#lazy-loading)
- [Optimisation d'images](#optimisation-dimages)
- [Drag-and-Drop](#drag-and-drop)
- [Navigation clavier](#navigation-clavier)
- [Responsive Design](#responsive-design)
- [Accessibilité](#accessibilité)

## Fonctionnalités

### ✨ Fonctionnalités principales

- **Layout Masonry Responsive**: 2-3 colonnes selon le viewport
- **Lightbox Full-Screen**: Affichage immersif avec navigation
- **Zoom Smooth**: Zoom fluide avec pan/drag sur images zoomées
- **Navigation Clavier**: Contrôle complet au clavier
- **Thumbnails Navigation**: Barre de miniatures pour accès rapide
- **Lazy Loading**: IntersectionObserver pour chargement optimisé
- **Blur-up Placeholder**: Effet de flou progressif pendant chargement
- **Drag-and-Drop Reorder**: Réorganisation des photos
- **Delete avec Confirmation**: Suppression sécurisée
- **Srcset Multiple Résolutions**: Optimisation pour différents écrans
- **Empty State**: État vide élégant
- **Touch Support**: Gestes tactiles pour mobile

## Installation

Le composant est déjà enregistré dans `app.module.ts`. Aucune installation supplémentaire requise.

## Utilisation de base

### Import

```typescript
import { PhotoGalleryComponent, Photo } from './components/photo-gallery.component';
```

### Template simple

```html
<app-photo-gallery
  [photos]="photos"
  [editable]="false"
  [columns]="3">
</app-photo-gallery>
```

### Template avec édition

```html
<app-photo-gallery
  [photos]="photos"
  [editable]="true"
  [columns]="3"
  (photosReordered)="onPhotosReordered($event)"
  (photoDeleted)="onPhotoDeleted($event)">
</app-photo-gallery>
```

### Component TypeScript

```typescript
import { Component } from '@angular/core';
import { Photo } from './components/photo-gallery.component';

@Component({
  selector: 'app-property-detail',
  template: `
    <app-photo-gallery
      [photos]="propertyPhotos"
      [editable]="canEdit"
      [columns]="3"
      (photosReordered)="handleReorder($event)"
      (photoDeleted)="handleDelete($event)">
    </app-photo-gallery>
  `
})
export class PropertyDetailComponent {
  propertyPhotos: Photo[] = [
    {
      id: 1,
      url: 'https://example.com/photos/property-1.jpg',
      thumbnailUrl: 'https://example.com/photos/property-1-thumb.jpg',
      title: 'Salon principal',
      alt: 'Vue du salon avec grande baie vitrée',
      width: 1920,
      height: 1080,
      blurDataUrl: 'data:image/svg+xml;base64,...'
    },
    {
      id: 2,
      url: 'https://example.com/photos/property-2.jpg',
      thumbnailUrl: 'https://example.com/photos/property-2-thumb.jpg',
      title: 'Cuisine équipée',
      alt: 'Cuisine moderne avec îlot central',
      width: 1920,
      height: 1080
    }
  ];

  canEdit = true;

  handleReorder(photos: Photo[]): void {
    this.propertyPhotos = photos;
    // Sauvegarder le nouvel ordre dans le backend
    this.savePhotoOrder(photos);
  }

  handleDelete(photo: Photo): void {
    this.propertyPhotos = this.propertyPhotos.filter(p => p.id !== photo.id);
    // Supprimer du backend
    this.deletePhotoFromBackend(photo.id);
  }

  private savePhotoOrder(photos: Photo[]): void {
    // API call to save order
  }

  private deletePhotoFromBackend(photoId: string | number): void {
    // API call to delete photo
  }
}
```

## Interface Photo

```typescript
export interface Photo {
  id: string | number;           // Identifiant unique
  url: string;                    // URL haute résolution
  thumbnailUrl?: string;          // URL miniature (optionnel)
  alt?: string;                   // Texte alternatif pour accessibilité
  title?: string;                 // Titre affiché
  width?: number;                 // Largeur originale (pour srcset)
  height?: number;                // Hauteur originale (pour srcset)
  blurDataUrl?: string;          // Data URL pour placeholder flou
}
```

### Génération de blurDataUrl

Pour générer un placeholder flou optimisé :

```typescript
// Avec une vraie image tiny
const blurDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg...';

// Avec SVG simple (fallback)
const blurDataUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23e0e0e0" width="1" height="1"/%3E%3C/svg%3E';
```

## Props et événements

### Inputs

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `photos` | `Photo[]` | `[]` | Liste des photos à afficher |
| `editable` | `boolean` | `false` | Active drag-and-drop et suppression |
| `columns` | `number` | `3` | Nombre de colonnes (adapté selon viewport) |

### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `photosReordered` | `EventEmitter<Photo[]>` | Émis quand l'ordre change |
| `photoDeleted` | `EventEmitter<Photo>` | Émis quand une photo est supprimée |

## Masonry Layout

### Colonnes responsive

```typescript
getColumnCount(): number {
  if (window.innerWidth < 768) {
    return 2;  // Mobile: 2 colonnes
  } else if (window.innerWidth < 1024) {
    return Math.min(this.columns, 3);  // Tablet: max 3 colonnes
  }
  return this.columns;  // Desktop: colonnes configurées
}
```

### Distribution des photos

Les photos sont distribuées en round-robin dans les colonnes pour un équilibre visuel optimal.

## Lightbox

### Fonctionnalités

- **Full-screen**: Fond noir à 95% d'opacité
- **Zoom**: 0.5x à 3x avec transitions smooth
- **Pan**: Déplacement de l'image zoomée par drag
- **Navigation**: Boutons prev/next + flèches clavier
- **Thumbnails**: Barre de navigation en bas
- **Info**: Compteur et titre de la photo
- **Keyboard hints**: Aide visuelle des raccourcis

### Contrôles zoom

```typescript
zoomIn(): void {
  if (this.lightboxZoom < 3) {
    this.lightboxZoom += 0.25;
  }
}

zoomOut(): void {
  if (this.lightboxZoom > 0.5) {
    this.lightboxZoom -= 0.25;
  }
}

resetZoom(): void {
  this.lightboxZoom = 1;
  this.lightboxTranslateX = 0;
  this.lightboxTranslateY = 0;
}
```

## Lazy Loading

### IntersectionObserver

```typescript
setupIntersectionObserver(): void {
  this.intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const dataSrc = img.getAttribute('data-src');
          if (dataSrc && !img.src) {
            img.src = dataSrc;
            img.classList.add('loading');
            img.onload = () => {
              img.classList.remove('loading');
              img.classList.add('loaded');
            };
          }
        }
      });
    },
    {
      rootMargin: '50px',    // Charge 50px avant visible
      threshold: 0.01        // 1% visible suffit
    }
  );
}
```

### Effet blur-up

```html
<div class="photo-wrapper">
  <!-- Placeholder flou -->
  <div 
    class="photo-placeholder"
    [style.background-image]="'url(' + getBlurDataUrl(photo) + ')'">
  </div>
  
  <!-- Image réelle -->
  <img
    class="photo-image"
    [attr.data-src]="getThumbnailUrl(photo)"
    loading="lazy" />
</div>
```

```css
.photo-placeholder {
  filter: blur(20px);
  transform: scale(1.1);
}

.photo-image {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.photo-image.loaded {
  opacity: 1;
}
```

## Optimisation d'images

### Srcset pour responsive images

```typescript
getSrcset(photo: Photo): string {
  const baseUrl = photo.url;
  const sizes = [320, 640, 960, 1280, 1920];
  
  return sizes
    .filter(size => size <= (photo.width || 0))
    .map(size => {
      const scaledUrl = this.getScaledImageUrl(baseUrl, size);
      return `${scaledUrl} ${size}w`;
    })
    .join(', ');
}

getSizes(): string {
  return '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';
}
```

### Usage dans le template

```html
<img
  [attr.srcset]="getSrcset(photo)"
  [attr.sizes]="getSizes()"
  [src]="getThumbnailUrl(photo)"
  loading="lazy" />
```

### Résultats

- Mobile (768px): charge image 320-640w
- Tablet (1024px): charge image 640-960w
- Desktop: charge image 1280-1920w selon densité pixel

## Drag-and-Drop

### Activation

```html
<app-photo-gallery
  [photos]="photos"
  [editable]="true"
  (photosReordered)="onReorder($event)">
</app-photo-gallery>
```

### Implémentation CDK

```typescript
onDrop(event: CdkDragDrop<Photo[]>): void {
  if (!this.editable) return;

  const photosCopy = [...this.photos];
  moveItemInArray(photosCopy, event.previousIndex, event.currentIndex);
  this.photos = photosCopy;
  this.photosReordered.emit(photosCopy);
}
```

### Styles drag

```css
.photo-item.cdk-drag-preview {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  transform: rotate(2deg);
  opacity: 0.9;
}

.photo-item.cdk-drag-animating {
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Navigation clavier

### Raccourcis lightbox

| Touche | Action |
|--------|--------|
| `←` `→` | Navigation photo précédente/suivante |
| `+` `=` | Zoom avant |
| `-` `_` | Zoom arrière |
| `0` | Réinitialiser zoom |
| `Esc` | Fermer lightbox |

### Implémentation

```typescript
setupLightboxKeyboardListener(): void {
  this.keyboardListener = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape': this.closeLightbox(); break;
      case 'ArrowLeft': this.previousPhoto(); break;
      case 'ArrowRight': this.nextPhoto(); break;
      case '+': case '=': this.zoomIn(); break;
      case '-': case '_': this.zoomOut(); break;
      case '0': this.resetZoom(); break;
    }
  };
  document.addEventListener('keydown', this.keyboardListener);
}
```

## Responsive Design

### Breakpoints

| Viewport | Colonnes | Comportement |
|----------|----------|--------------|
| < 480px | 2 | Compact, contrôles réduits |
| < 768px | 2 | Mobile, keyboard hints cachés |
| < 1024px | 2-3 | Tablet, hover désactivé |
| ≥ 1024px | 3 (config) | Desktop, toutes fonctionnalités |

### Media queries CSS

```css
@media (max-width: 768px) {
  .masonry-grid {
    gap: 8px;
  }
  
  .lightbox-keyboard-hints {
    display: none;
  }
  
  .thumbnail-item {
    width: 60px;
    height: 45px;
  }
}

@media (max-width: 480px) {
  .masonry-grid {
    gap: 6px;
  }
  
  .control-btn {
    width: 36px;
    height: 36px;
  }
}
```

## Accessibilité

### ARIA et sémantique

```html
<!-- Labels descriptifs -->
<button
  mat-icon-button
  [attr.aria-label]="'Supprimer ' + (photo.title || 'photo')"
  (click)="deletePhoto(photo, $event)">
  <mat-icon>delete</mat-icon>
</button>

<!-- Alt text -->
<img
  [alt]="photo.alt || photo.title || 'Photo'"
  [src]="photo.url" />

<!-- Navigation -->
<button
  aria-label="Photo précédente"
  (click)="previousPhoto()">
  <mat-icon>chevron_left</mat-icon>
</button>
```

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .photo-item,
  .lightbox-image,
  .photo-image,
  .photo-overlay,
  .thumbnail-item {
    transition: none;
  }

  .lightbox-overlay {
    animation: none;
  }
}
```

### Focus management

- Piégeage du focus dans la lightbox
- Navigation clavier intuitive
- Indicateurs visuels clairs

## Exemples d'utilisation

### Galerie en lecture seule

```typescript
@Component({
  template: `
    <app-photo-gallery
      [photos]="annonce.photos"
      [editable]="false">
    </app-photo-gallery>
  `
})
export class AnnonceDetailComponent {
  annonce = {
    photos: [/* ... */]
  };
}
```

### Galerie éditable avec sauvegarde

```typescript
@Component({
  template: `
    <app-photo-gallery
      [photos]="photos"
      [editable]="true"
      (photosReordered)="saveOrder($event)"
      (photoDeleted)="deletePhoto($event)">
    </app-photo-gallery>
  `
})
export class PropertyEditComponent {
  photos: Photo[] = [];

  async saveOrder(photos: Photo[]): Promise<void> {
    try {
      const order = photos.map((p, i) => ({ id: p.id, order: i }));
      await this.photoService.updateOrder(this.propertyId, order);
      this.snackBar.open('Ordre sauvegardé', 'OK', { duration: 2000 });
    } catch (error) {
      this.snackBar.open('Erreur de sauvegarde', 'OK', { duration: 3000 });
    }
  }

  async deletePhoto(photo: Photo): Promise<void> {
    try {
      await this.photoService.delete(photo.id);
      this.photos = this.photos.filter(p => p.id !== photo.id);
    } catch (error) {
      this.snackBar.open('Erreur de suppression', 'OK', { duration: 3000 });
    }
  }
}
```

### Galerie avec chargement dynamique

```typescript
@Component({
  template: `
    <app-photo-gallery
      [photos]="photos"
      [columns]="columnCount">
    </app-photo-gallery>
  `
})
export class PropertyGalleryComponent implements OnInit {
  photos: Photo[] = [];
  columnCount = 3;

  constructor(private photoService: PhotoService) {}

  async ngOnInit(): Promise<void> {
    this.photos = await this.photoService.getPhotos(this.propertyId);
  }

  @HostListener('window:resize')
  onResize(): void {
    // Ajuster colonnes selon taille fenêtre
    if (window.innerWidth < 768) {
      this.columnCount = 2;
    } else if (window.innerWidth < 1200) {
      this.columnCount = 3;
    } else {
      this.columnCount = 4;
    }
  }
}
```

## Performance

### Optimisations implémentées

1. **Lazy Loading**: Chargement à la demande avec IntersectionObserver
2. **Srcset**: Images adaptées à la résolution d'écran
3. **Blur placeholders**: Perception de rapidité
4. **Virtual scrolling**: Prêt pour grandes collections
5. **Change detection**: OnPush compatible
6. **Cleanup**: Observers nettoyés au destroy

### Métriques attendues

- **First Paint**: < 100ms (placeholder)
- **Load Time**: 200-500ms par image (selon réseau)
- **Memory**: ~2-5MB par 50 photos
- **FPS**: 60fps animations et zoom

## Notes de développement

### Structure des fichiers

```
components/
├── photo-gallery.component.ts       # Logique composant
├── photo-gallery.component.html     # Template
├── photo-gallery.component.css      # Styles
├── photo-gallery.component.spec.ts  # Tests
└── PHOTO_GALLERY_README.md         # Documentation
```

### Dépendances

- Angular Material (Dialog, Snackbar, Icons, Buttons, Tooltip)
- Angular CDK (DragDrop)
- Composant existant: ConfirmDeleteDialogComponent

### Tests

```bash
# Unit tests
ng test --include='**/photo-gallery.component.spec.ts'

# E2E tests
ng e2e
```

## Roadmap

### Améliorations futures

- [ ] Fullscreen API pour vraie full-screen
- [ ] Pinch-to-zoom sur mobile
- [ ] Share API pour partage photos
- [ ] Download individuel/batch
- [ ] Slideshow automatique
- [ ] Filtres et édition basique
- [ ] Métadonnées EXIF
- [ ] Géolocalisation sur carte

## Support

Pour questions ou bugs, créer une issue avec :
- Version Angular
- Browser et version
- Screenshots/recordings
- Console errors
