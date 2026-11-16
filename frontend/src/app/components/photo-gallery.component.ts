import { Component, OnInit, OnDestroy, HostListener, ElementRef, input, output, viewChildren, computed, inject } from '@angular/core';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsToastService,
  DsDialogService
} from '../design-system';

export interface Photo {
  id: string | number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  blurDataUrl?: string;
}

@Component({
    selector: 'app-photo-gallery',
    standalone: true,
    templateUrl: './photo-gallery.component.html',
    styleUrls: ['./photo-gallery.component.css'],
    imports: [
      CommonModule, 
      DsButtonComponent, 
      DsIconComponent, 
      CdkDropList, 
      CdkDrag, 
      CdkDragHandle
    ]
})
export class PhotoGalleryComponent implements OnInit, OnDestroy {
  private dsDialog = inject(DsDialogService);
  private toastService = inject(DsToastService);

  readonly photos = input<Photo[]>([]);
  readonly editable = input(false);
  readonly columns = input(3);
  
  readonly masonryColumns = computed(() => {
    const photos = this.photos();
    if (!photos || photos.length === 0) return [];

    const columnCount = this.getColumnCount();
    const cols: Photo[][] = Array.from({ length: columnCount }, () => []);

    photos.forEach((photo, index) => {
      cols[index % columnCount].push(photo);
    });

    return cols;
  });

  readonly photosReordered = output<Photo[]>();
  readonly photoDeleted = output<Photo>();

  readonly photoImages = viewChildren<ElementRef<HTMLImageElement>>('photoImage');

  lightboxOpen = false;
  currentPhotoIndex = 0;
  lightboxZoom = 1;
  lightboxTranslateX = 0;
  lightboxTranslateY = 0;
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  dragStartTranslateX = 0;
  dragStartTranslateY = 0;

  private intersectionObserver?: IntersectionObserver;
  private keyboardListener?: (e: KeyboardEvent) => void;

  ngOnInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
    this.removeLightboxKeyboardListener();
  }

  setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc && !img.src) {
              img.src = dataSrc;
              img.classList.add('loading');
              img.onload = () => { img.classList.remove('loading'); img.classList.add('loaded'); };
              img.onerror = () => { img.classList.remove('loading'); img.classList.add('error'); };
            }
          }
        });
      },
      { rootMargin: '50px', threshold: 0.01 }
    );

    setTimeout(() => {
      this.photoImages()?.forEach(imgRef => {
        this.intersectionObserver?.observe(imgRef.nativeElement);
      });
    }, 100);
  }

  getColumnCount(): number {
    if (window.innerWidth < 768) return 2;
    if (window.innerWidth < 1024) return Math.min(this.columns(), 3);
    return this.columns();
  }

  openLightbox(index: number): void {
    this.currentPhotoIndex = index;
    this.lightboxOpen = true;
    this.lightboxZoom = 1;
    this.lightboxTranslateX = 0;
    this.lightboxTranslateY = 0;
    document.body.style.overflow = 'hidden';
    this.setupLightboxKeyboardListener();
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    document.body.style.overflow = '';
    this.removeLightboxKeyboardListener();
  }

  previousPhoto(): void {
    if (this.currentPhotoIndex > 0) {
      this.currentPhotoIndex--;
      this.resetLightboxTransform();
    }
  }

  nextPhoto(): void {
    if (this.currentPhotoIndex < this.photos().length - 1) {
      this.currentPhotoIndex++;
      this.resetLightboxTransform();
    }
  }

  resetLightboxTransform(): void {
    this.lightboxZoom = 1;
    this.lightboxTranslateX = 0;
    this.lightboxTranslateY = 0;
  }

  zoomIn(): void {
    if (this.lightboxZoom < 3) this.lightboxZoom += 0.25;
  }

  zoomOut(): void {
    if (this.lightboxZoom > 0.5) {
      this.lightboxZoom -= 0.25;
      if (this.lightboxZoom === 1) {
        this.lightboxTranslateX = 0;
        this.lightboxTranslateY = 0;
      }
    }
  }

  onLightboxImageMouseDown(event: MouseEvent): void {
    if (this.lightboxZoom > 1) {
      event.preventDefault();
      this.isDragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      this.dragStartTranslateX = this.lightboxTranslateX;
      this.dragStartTranslateY = this.lightboxTranslateY;
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging && this.lightboxZoom > 1) {
      this.lightboxTranslateX = this.dragStartTranslateX + (event.clientX - this.dragStartX);
      this.lightboxTranslateY = this.dragStartTranslateY + (event.clientY - this.dragStartY);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }

  setupLightboxKeyboardListener(): void {
    this.keyboardListener = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': this.closeLightbox(); break;
        case 'ArrowLeft': this.previousPhoto(); break;
        case 'ArrowRight': this.nextPhoto(); break;
        case '+': case '=': this.zoomIn(); break;
        case '-': case '_': this.zoomOut(); break;
        case '0': this.resetLightboxTransform(); break;
      }
    };
    document.addEventListener('keydown', this.keyboardListener);
  }

  removeLightboxKeyboardListener(): void {
    if (this.keyboardListener) {
      document.removeEventListener('keydown', this.keyboardListener);
      this.keyboardListener = undefined;
    }
  }

  onDrop(event: CdkDragDrop<Photo[]>): void {
    if (!this.editable()) return;
    const photosCopy = [...this.photos()];
    moveItemInArray(photosCopy, event.previousIndex, event.currentIndex);
    this.photosReordered.emit(photosCopy);
    this.toastService.success('Ordre des photos mis à jour');
  }

  deletePhoto(photo: Photo, event: Event): void {
    event.stopPropagation();
    
    this.dsDialog.open(ConfirmDeleteDialogComponent, {
      data: {
        title: 'Supprimer la photo',
        message: photo.title 
          ? `Êtes-vous sûr de vouloir supprimer "${photo.title}" ?`
          : 'Êtes-vous sûr de vouloir supprimer cette photo ?'
      },
      variant: 'danger'
    }).closed.subscribe((confirmed) => {
      if (confirmed) {
        this.photoDeleted.emit(photo);
        this.toastService.success('Photo supprimée avec succès');
      }
    });
  }

  goToThumbnail(index: number): void {
    this.currentPhotoIndex = index;
    this.resetLightboxTransform();
  }

  getCurrentPhoto(): Photo | null {
    return this.photos()[this.currentPhotoIndex] || null;
  }

  getThumbnailUrl(photo: Photo): string {
    return photo.thumbnailUrl || photo.url;
  }

  getBlurDataUrl(photo: Photo): string {
    return photo.blurDataUrl || '';
  }

  getSrcset(photo: Photo): string {
    return photo.thumbnailUrl ? `${photo.thumbnailUrl} 300w, ${photo.url} 1200w` : '';
  }

  getSizes(): string {
    return '(max-width: 600px) 280px, 800px';
  }

  trackByPhotoId(index: number, photo: Photo): string | number {
    return photo.id;
  }
}
