import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PhotoGalleryComponent, Photo } from './photo-gallery.component';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { of } from 'rxjs';

describe('PhotoGalleryComponent', () => {
  let component: PhotoGalleryComponent;
  let fixture: ComponentFixture<PhotoGalleryComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockPhotos: Photo[] = [
    {
      id: 1,
      url: 'https://example.com/photo1.jpg',
      thumbnailUrl: 'https://example.com/thumb1.jpg',
      alt: 'Photo 1',
      title: 'Test Photo 1',
      width: 1920,
      height: 1080
    },
    {
      id: 2,
      url: 'https://example.com/photo2.jpg',
      thumbnailUrl: 'https://example.com/thumb2.jpg',
      alt: 'Photo 2',
      title: 'Test Photo 2',
      width: 1920,
      height: 1080
    },
    {
      id: 3,
      url: 'https://example.com/photo3.jpg',
      thumbnailUrl: 'https://example.com/thumb3.jpg',
      alt: 'Photo 3',
      title: 'Test Photo 3',
      width: 1920,
      height: 1080
    }
  ];

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      declarations: [PhotoGalleryComponent],
      imports: [
        DragDropModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoGalleryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty state when no photos', () => {
    component.photos = [];
    fixture.detectChanges();
    
    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Aucune photo disponible');
  });

  it('should display photos in masonry layout', () => {
    component.photos = mockPhotos;
    fixture.detectChanges();
    
    const masonryGrid = fixture.nativeElement.querySelector('.masonry-grid');
    expect(masonryGrid).toBeTruthy();
  });

  it('should open lightbox when photo is clicked', () => {
    component.photos = mockPhotos;
    component.openLightbox(0);
    
    expect(component.lightboxOpen).toBe(true);
    expect(component.currentPhotoIndex).toBe(0);
  });

  it('should close lightbox', () => {
    component.lightboxOpen = true;
    component.closeLightbox();
    
    expect(component.lightboxOpen).toBe(false);
  });

  it('should navigate to next photo', () => {
    component.photos = mockPhotos;
    component.currentPhotoIndex = 0;
    component.nextPhoto();
    
    expect(component.currentPhotoIndex).toBe(1);
  });

  it('should navigate to previous photo', () => {
    component.photos = mockPhotos;
    component.currentPhotoIndex = 1;
    component.previousPhoto();
    
    expect(component.currentPhotoIndex).toBe(0);
  });

  it('should not navigate beyond bounds', () => {
    component.photos = mockPhotos;
    component.currentPhotoIndex = 0;
    component.previousPhoto();
    expect(component.currentPhotoIndex).toBe(0);
    
    component.currentPhotoIndex = mockPhotos.length - 1;
    component.nextPhoto();
    expect(component.currentPhotoIndex).toBe(mockPhotos.length - 1);
  });

  it('should zoom in and out', () => {
    component.lightboxZoom = 1;
    component.zoomIn();
    expect(component.lightboxZoom).toBe(1.25);
    
    component.zoomOut();
    expect(component.lightboxZoom).toBe(1);
  });

  it('should reset zoom', () => {
    component.lightboxZoom = 2;
    component.lightboxTranslateX = 100;
    component.lightboxTranslateY = 50;
    
    component.resetZoom();
    
    expect(component.lightboxZoom).toBe(1);
    expect(component.lightboxTranslateX).toBe(0);
    expect(component.lightboxTranslateY).toBe(0);
  });

  it('should emit photosReordered on drag and drop', () => {
    component.photos = mockPhotos;
    component.editable = true;
    
    spyOn(component.photosReordered, 'emit');
    
    const event = {
      previousIndex: 0,
      currentIndex: 1,
      item: {} as unknown,
      container: {} as unknown,
      previousContainer: {} as unknown,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 }
    } as CdkDragDrop<Photo[]>;
    
    component.onDrop(event);
    
    expect(component.photosReordered.emit).toHaveBeenCalled();
  });

  it('should open delete confirmation dialog', () => {
    const mockDialogRef = {
      afterClosed: () => of(true)
    };
    mockDialog.open.and.returnValue(mockDialogRef as unknown as MatDialogRef<ConfirmDeleteDialogComponent>);
    
    spyOn(component.photoDeleted, 'emit');
    
    const photo = mockPhotos[0];
    const event = new Event('click');
    
    component.deletePhoto(photo, event);
    
    expect(mockDialog.open).toHaveBeenCalled();
    expect(component.photoDeleted.emit).toHaveBeenCalledWith(photo);
  });

  it('should get masonry columns based on viewport', () => {
    component.photos = mockPhotos;
    
    spyOn(component, 'getColumnCount').and.returnValue(3);
    
    const columns = component.getMasonryColumns();
    
    expect(columns.length).toBe(3);
  });

  it('should generate srcset for responsive images', () => {
    const photo = mockPhotos[0];
    const srcset = component.getSrcset(photo);
    
    expect(srcset).toContain('320w');
    expect(srcset).toContain('640w');
    expect(srcset).toContain('960w');
  });

  it('should get current photo', () => {
    component.photos = mockPhotos;
    component.currentPhotoIndex = 1;
    
    const currentPhoto = component.getCurrentPhoto();
    
    expect(currentPhoto).toBe(mockPhotos[1]);
  });

  it('should go to thumbnail', () => {
    component.photos = mockPhotos;
    component.goToThumbnail(2);
    
    expect(component.currentPhotoIndex).toBe(2);
    expect(component.lightboxZoom).toBe(1);
  });
});
