import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { DocumentPreviewDialogComponent } from './document-preview-dialog.component';
import { DocumentApiService } from '../services/document-api.service';
import { of } from 'rxjs';

describe('DocumentPreviewDialogComponent', () => {
  let component: DocumentPreviewDialogComponent;
  let fixture: ComponentFixture<DocumentPreviewDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    const mockDocumentApiService = jasmine.createSpyObj('DocumentApiService', ['download', 'formatFileSize']);
    mockDocumentApiService.download.and.returnValue(of(new Blob()));
    mockDocumentApiService.formatFileSize.and.returnValue('1 KB');

    TestBed.configureTestingModule({
      declarations: [DocumentPreviewDialogComponent],
      imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatProgressSpinnerModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: { 
            document: {
              id: 1,
              fileName: 'test.pdf',
              contentType: 'application/pdf',
              fileSize: 1024,
              uploadedAt: '2024-01-01T00:00:00Z',
              uploadedBy: 'test-user'
            }
          } 
        },
        { provide: DocumentApiService, useValue: mockDocumentApiService }
      ]
    });
    fixture = TestBed.createComponent(DocumentPreviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
