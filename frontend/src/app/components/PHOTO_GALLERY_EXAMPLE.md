# PhotoGalleryComponent - Exemples d'intégration

## Exemple 1: Intégration dans AnnonceDetailComponent

### Mise à jour de l'interface Annonce

```typescript
// frontend/src/app/models/annonce.model.ts
import { Photo } from '../components/photo-gallery.component';

export interface Annonce {
  id: number;
  titre: string;
  description: string;
  // ... autres champs
  photos?: Photo[];  // Ajouter cette propriété
  photoUrls?: string[];  // Pour compatibilité avec ancien format
}
```

### Adapter les données existantes

Si vos annonces utilisent un format différent pour les photos, créez un adaptateur:

```typescript
// frontend/src/app/pages/annonces/annonce-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Photo } from '../../components/photo-gallery.component';
import { AnnonceApiService } from '../../services/annonce-api.service';

@Component({
  selector: 'app-annonce-detail',
  template: `
    <div class="annonce-detail-container">
      <div class="annonce-header">
        <h1>{{ annonce?.titre }}</h1>
      </div>

      <!-- Galerie de photos -->
      <section class="photos-section">
        <h2>Photos</h2>
        <app-photo-gallery
          [photos]="galleryPhotos"
          [editable]="canEdit"
          [columns]="3"
          (photosReordered)="handlePhotoReorder($event)"
          (photoDeleted)="handlePhotoDelete($event)">
        </app-photo-gallery>
      </section>

      <!-- Reste du contenu de l'annonce -->
      <section class="details-section">
        <h2>Description</h2>
        <p>{{ annonce?.description }}</p>
      </section>
    </div>
  `,
  styles: [`
    .annonce-detail-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .photos-section {
      margin: 32px 0;
    }

    .photos-section h2 {
      margin-bottom: 16px;
      font-size: 24px;
      font-weight: 600;
    }
  `]
})
export class AnnonceDetailComponent implements OnInit {
  annonce: any = null;
  galleryPhotos: Photo[] = [];
  canEdit = false;

  constructor(
    private route: ActivatedRoute,
    private annonceService: AnnonceApiService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadAnnonce(id);
  }

  async loadAnnonce(id: number): Promise<void> {
    try {
      this.annonce = await this.annonceService.getById(id).toPromise();
      this.galleryPhotos = this.convertToGalleryPhotos(this.annonce);
      this.canEdit = this.checkEditPermission();
    } catch (error) {
      console.error('Error loading annonce:', error);
    }
  }

  private convertToGalleryPhotos(annonce: any): Photo[] {
    // Adapter selon votre format de données
    if (annonce.photos && Array.isArray(annonce.photos)) {
      return annonce.photos.map((photo: any, index: number) => ({
        id: photo.id || index,
        url: photo.url || photo.photoUrl,
        thumbnailUrl: photo.thumbnailUrl || photo.url,
        title: photo.title || photo.caption || `Photo ${index + 1}`,
        alt: photo.alt || photo.description || `Photo de ${annonce.titre}`,
        width: photo.width || 1920,
        height: photo.height || 1080,
        blurDataUrl: photo.blurDataUrl
      }));
    }

    // Fallback: si les photos sont des URLs simples
    if (annonce.photoUrls && Array.isArray(annonce.photoUrls)) {
      return annonce.photoUrls.map((url: string, index: number) => ({
        id: index,
        url: url,
        thumbnailUrl: url,
        title: `Photo ${index + 1}`,
        alt: `Photo de ${annonce.titre}`,
        width: 1920,
        height: 1080
      }));
    }

    return [];
  }

  handlePhotoReorder(photos: Photo[]): void {
    this.galleryPhotos = photos;
    // Sauvegarder l'ordre dans le backend
    const photoIds = photos.map(p => p.id);
    this.annonceService.updatePhotoOrder(this.annonce.id, photoIds)
      .subscribe({
        next: () => console.log('Photo order saved'),
        error: (err) => console.error('Error saving photo order:', err)
      });
  }

  handlePhotoDelete(photo: Photo): void {
    this.galleryPhotos = this.galleryPhotos.filter(p => p.id !== photo.id);
    // Supprimer du backend
    this.annonceService.deletePhoto(this.annonce.id, photo.id)
      .subscribe({
        next: () => console.log('Photo deleted'),
        error: (err) => console.error('Error deleting photo:', err)
      });
  }

  private checkEditPermission(): boolean {
    // Logique pour vérifier si l'utilisateur peut éditer
    // Par exemple, vérifier les rôles ou le propriétaire
    return true; // À adapter selon vos besoins
  }
}
```

## Exemple 2: Galerie simple en lecture seule

```typescript
@Component({
  selector: 'app-property-showcase',
  template: `
    <div class="property-showcase">
      <h2>Galerie photos</h2>
      <app-photo-gallery
        [photos]="photos"
        [columns]="4">
      </app-photo-gallery>
    </div>
  `
})
export class PropertyShowcaseComponent {
  photos: Photo[] = [
    {
      id: 1,
      url: '/assets/images/property1-full.jpg',
      thumbnailUrl: '/assets/images/property1-thumb.jpg',
      title: 'Vue extérieure',
      alt: 'Maison avec jardin',
      width: 1920,
      height: 1080
    },
    {
      id: 2,
      url: '/assets/images/property2-full.jpg',
      thumbnailUrl: '/assets/images/property2-thumb.jpg',
      title: 'Salon',
      alt: 'Salon spacieux avec cheminée',
      width: 1920,
      height: 1080
    }
  ];
}
```

## Exemple 3: Upload et gestion dynamique

```typescript
import { Component } from '@angular/core';
import { Photo } from '../../components/photo-gallery.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-property-photos-manager',
  template: `
    <div class="photos-manager">
      <div class="upload-section">
        <h3>Ajouter des photos</h3>
        <input
          type="file"
          multiple
          accept="image/*"
          (change)="onFileSelected($event)"
          #fileInput>
        <button mat-raised-button color="primary" (click)="fileInput.click()">
          <mat-icon>add_photo_alternate</mat-icon>
          Ajouter des photos
        </button>
      </div>

      <app-photo-gallery
        [photos]="photos"
        [editable]="true"
        [columns]="3"
        (photosReordered)="onReorder($event)"
        (photoDeleted)="onDelete($event)">
      </app-photo-gallery>
    </div>
  `,
  styles: [`
    .photos-manager {
      padding: 24px;
    }

    .upload-section {
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .upload-section input[type="file"] {
      display: none;
    }

    .upload-section button {
      margin-top: 8px;
    }
  `]
})
export class PropertyPhotosManagerComponent {
  photos: Photo[] = [];
  private nextId = 1;

  constructor(private snackBar: MatSnackBar) {}

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    
    for (const file of files) {
      try {
        // Upload vers le serveur
        const uploadedPhoto = await this.uploadPhoto(file);
        
        // Ajouter à la galerie
        this.photos = [...this.photos, uploadedPhoto];
        
        this.snackBar.open(`${file.name} ajouté`, 'OK', { duration: 2000 });
      } catch (error) {
        this.snackBar.open(`Erreur: ${file.name}`, 'OK', { duration: 3000 });
      }
    }

    // Reset input
    input.value = '';
  }

  private async uploadPhoto(file: File): Promise<Photo> {
    // Simuler upload (remplacer par vraie API)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        
        // Générer blur placeholder
        const blurDataUrl = this.generateBlurPlaceholder();
        
        resolve({
          id: this.nextId++,
          url: dataUrl,
          thumbnailUrl: dataUrl,
          title: file.name,
          alt: file.name,
          width: 1920,
          height: 1080,
          blurDataUrl
        });
      };
      reader.readAsDataURL(file);
    });
  }

  private generateBlurPlaceholder(): string {
    // Placeholder SVG simple
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23e0e0e0" width="1" height="1"/%3E%3C/svg%3E';
  }

  onReorder(photos: Photo[]): void {
    this.photos = photos;
    console.log('New order:', photos.map(p => p.id));
  }

  onDelete(photo: Photo): void {
    this.photos = this.photos.filter(p => p.id !== photo.id);
    console.log('Deleted photo:', photo.id);
  }
}
```

## Exemple 4: Service API pour gestion photos

```typescript
// frontend/src/app/services/photo-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Photo } from '../components/photo-gallery.component';

export interface PhotoDto {
  id: number;
  annonceId: number;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  order: number;
  width?: number;
  height?: number;
  blurHash?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoApiService {
  private apiUrl = '/api/photos';

  constructor(private http: HttpClient) {}

  getPhotosByAnnonce(annonceId: number): Observable<Photo[]> {
    return this.http
      .get<PhotoDto[]>(`${this.apiUrl}/annonce/${annonceId}`)
      .pipe(map(dtos => dtos.map(dto => this.dtoToPhoto(dto))));
  }

  uploadPhoto(annonceId: number, file: File): Observable<Photo> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('annonceId', annonceId.toString());

    return this.http
      .post<PhotoDto>(`${this.apiUrl}/upload`, formData)
      .pipe(map(dto => this.dtoToPhoto(dto)));
  }

  updatePhotoOrder(annonceId: number, photoIds: (string | number)[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/annonce/${annonceId}/order`, {
      photoIds
    });
  }

  deletePhoto(photoId: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${photoId}`);
  }

  private dtoToPhoto(dto: PhotoDto): Photo {
    return {
      id: dto.id,
      url: dto.url,
      thumbnailUrl: dto.thumbnailUrl || dto.url,
      title: dto.caption,
      alt: dto.caption || `Photo ${dto.id}`,
      width: dto.width || 1920,
      height: dto.height || 1080,
      blurDataUrl: dto.blurHash 
        ? this.blurHashToDataUrl(dto.blurHash)
        : undefined
    };
  }

  private blurHashToDataUrl(blurHash: string): string {
    // Convertir blurhash en data URL si vous utilisez blurhash
    // Sinon retourner un placeholder SVG
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23e0e0e0" width="1" height="1"/%3E%3C/svg%3E';
  }
}
```

## Exemple 5: Tests

```typescript
// Test avec données mockées
describe('PhotoGalleryComponent Integration', () => {
  let component: AnnonceDetailComponent;
  let fixture: ComponentFixture<AnnonceDetailComponent>;
  let photoService: jasmine.SpyObj<PhotoApiService>;

  beforeEach(() => {
    const photoServiceSpy = jasmine.createSpyObj('PhotoApiService', [
      'getPhotosByAnnonce',
      'updatePhotoOrder',
      'deletePhoto'
    ]);

    TestBed.configureTestingModule({
      declarations: [AnnonceDetailComponent, PhotoGalleryComponent],
      providers: [
        { provide: PhotoApiService, useValue: photoServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(AnnonceDetailComponent);
    component = fixture.componentInstance;
    photoService = TestBed.inject(PhotoApiService) as jasmine.SpyObj<PhotoApiService>;
  });

  it('should load and display photos', async () => {
    const mockPhotos: Photo[] = [
      { id: 1, url: 'photo1.jpg', thumbnailUrl: 'thumb1.jpg' },
      { id: 2, url: 'photo2.jpg', thumbnailUrl: 'thumb2.jpg' }
    ];

    photoService.getPhotosByAnnonce.and.returnValue(of(mockPhotos));
    
    await component.loadAnnonce(1);
    fixture.detectChanges();

    expect(component.galleryPhotos.length).toBe(2);
  });
});
```

## Configuration supplémentaire

### Ajouter à angular.json (si nécessaire)

```json
{
  "projects": {
    "frontend": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              "src/favicon.ico",
              "src/assets",
              {
                "glob": "**/*",
                "input": "src/assets/images",
                "output": "/assets/images"
              }
            ]
          }
        }
      }
    }
  }
}
```

### Variables CSS globales (optionnel)

Ajouter dans `styles.css` pour personnalisation:

```css
:root {
  --photo-gallery-gap: 16px;
  --photo-gallery-border-radius: 8px;
  --photo-gallery-hover-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  --lightbox-overlay-opacity: 0.95;
  --lightbox-controls-blur: 10px;
}
```

## Bonnes pratiques

1. **Optimiser les images avant upload**: Redimensionner et compresser côté serveur
2. **Générer thumbnails**: Créer versions miniatures automatiquement
3. **Utiliser CDN**: Servir images depuis CDN pour performance
4. **Lazy loading**: Laisser le composant gérer le lazy loading
5. **Responsive images**: Fournir width/height pour srcset optimal
6. **Blur placeholders**: Générer avec BlurHash ou similaire
7. **Error handling**: Gérer les erreurs de chargement d'images
8. **Permissions**: Vérifier droits d'édition avant activation

## Troubleshooting

### Les images ne se chargent pas

Vérifier CORS si images depuis autre domaine:

```typescript
// backend CORS config
@Configuration
public class CorsConfig {
  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
          .allowedOrigins("http://localhost:4200")
          .allowedMethods("GET", "POST", "PUT", "DELETE");
      }
    };
  }
}
```

### Drag and drop ne fonctionne pas

Vérifier que DragDropModule est importé dans le module:

```typescript
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  imports: [DragDropModule]
})
```

### Performance lente avec beaucoup de photos

Implémenter virtual scrolling ou pagination:

```typescript
// Limiter le nombre de photos affichées
get visiblePhotos(): Photo[] {
  return this.photos.slice(0, this.currentPage * this.photosPerPage);
}
```
