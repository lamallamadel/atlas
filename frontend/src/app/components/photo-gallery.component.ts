import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

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
  templateUrl: './photo-gallery.component.html',
  styleUrls: ['./photo-gallery.component.css']
})
export class PhotoGalleryComponent implements OnInit, OnDestroy {
  @Input() photos: Photo[] = [];
  @Input() editable = false;
  @Input() columns = 3;
  @Output() photosReordered = new EventEmitter<Photo[]>();
  @Output() photoDeleted = new EventEmitter<Photo>();

  @ViewChildren('photoImage') photoImages!: QueryList<ElementRef<HTMLImageElement>>;

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

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.removeLightboxKeyboardListener();
  }

  setupIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      return;
    }

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
              img.onerror = () => {
                img.classList.remove('loading');
                img.classList.add('error');
              };
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    setTimeout(() => {
      this.photoImages?.forEach(imgRef => {
        this.intersectionObserver?.observe(imgRef.nativeElement);
      });
    }, 100);
  }

  getMasonryColumns(): Photo[][] {
    if (!this.photos || this.photos.length === 0) {
      return [];
    }

    const columnCount = this.getColumnCount();
    const columns: Photo[][] = Array.from({ length: columnCount }, () => []);

    this.photos.forEach((photo, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex].push(photo);
    });

    return columns;
  }

  getColumnCount(): number {
    if (window.innerWidth < 768) {
      return 2;
    } else if (window.innerWidth < 1024) {
      return Math.min(this.columns, 3);
    }
    return this.columns;
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
    this.lightboxZoom = 1;
    this.lightboxTranslateX = 0;
    this.lightboxTranslateY = 0;
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
    if (this.currentPhotoIndex < this.photos.length - 1) {
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
    if (this.lightboxZoom < 3) {
      this.lightboxZoom += 0.25;
    }
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

  resetZoom(): void {
    this.lightboxZoom = 1;
    this.lightboxTranslateX = 0;
    this.lightboxTranslateY = 0;
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
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;
      this.lightboxTranslateX = this.dragStartTranslateX + deltaX;
      this.lightboxTranslateY = this.dragStartTranslateY + deltaY;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }

  @HostListener('window:resize')
  onResize(): void {
    // Force re-render of masonry layout on window resize
  }

  setupLightboxKeyboardListener(): void {
    this.keyboardListener = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          this.closeLightbox();
          break;
        case 'ArrowLeft':
          this.previousPhoto();
          break;
        case 'ArrowRight':
          this.nextPhoto();
          break;
        case '+':
        case '=':
          this.zoomIn();
          break;
        case '-':
        case '_':
          this.zoomOut();
          break;
        case '0':
          this.resetZoom();
          break;
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
    if (!this.editable) {
      return;
    }

    const photosCopy = [...this.photos];
    moveItemInArray(photosCopy, event.previousIndex, event.currentIndex);
    this.photos = photosCopy;
    this.photosReordered.emit(photosCopy);

    this.snackBar.open('Ordre des photos mis à jour', 'Fermer', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  deletePhoto(photo: Photo, event: Event): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer la photo',
        message: photo.title 
          ? `Êtes-vous sûr de vouloir supprimer "${photo.title}" ?`
          : 'Êtes-vous sûr de vouloir supprimer cette photo ?'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.photoDeleted.emit(photo);
        this.snackBar.open('Photo supprimée avec succès', 'Fermer', {
          duration: 2000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  goToThumbnail(index: number): void {
    this.currentPhotoIndex = index;
    this.resetLightboxTransform();
  }

  getCurrentPhoto(): Photo | null {
    return this.photos[this.currentPhotoIndex] || null;
  }

  getSrcset(photo: Photo): string {
    if (!photo.width || !photo.height) {
      return '';
    }

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

  private getScaledImageUrl(url: string, width: number): string {
    if (url.includes('?')) {
      return `${url}&w=${width}`;
    }
    return `${url}?w=${width}`;
  }

  getThumbnailUrl(photo: Photo): string {
    return photo.thumbnailUrl || photo.url;
  }

  getBlurDataUrl(photo: Photo): string {
    return photo.blurDataUrl || this.generateDefaultBlurDataUrl();
  }

  private generateDefaultBlurDataUrl(): string {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect fill="%23e0e0e0" width="1" height="1"/%3E%3C/svg%3E';
  }

  trackByPhotoId(index: number, photo: Photo): string | number {
    return photo.id;
  }
}
