import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DocumentPreviewDialogComponent } from './document-preview-dialog.component';
import { DocumentApiService } from '../services/document-api.service';
import { of } from 'rxjs';

describe('DocumentPreviewDialogComponent', () => {
  let component: DocumentPreviewDialogComponent;
  let fixture: ComponentFixture<DocumentPreviewDialogComponent>;

  beforeEach(() => {
    const mockDialogRef = {
      close: vi.fn().mockName('MatDialogRef.close')};
    const mockDocumentApiService = {
      download: vi.fn().mockName('DocumentApiService.download'),
      formatFileSize: vi.fn().mockName('DocumentApiService.formatFileSize')};
    mockDocumentApiService.download.mockReturnValue(of(new Blob()));
    mockDocumentApiService.formatFileSize.mockReturnValue('1 KB');

    TestBed.configureTestingModule({
      imports: [DocumentPreviewDialogComponent],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        {
          provide: DIALOG_DATA,
          useValue: {
            document: {
              id: 1,
              fileName: 'test.pdf',
              contentType: 'application/pdf',
              fileSize: 1024,
              uploadedAt: '2024-01-01T00:00:00Z',
              uploadedBy: 'test-user'}}},
        { provide: DocumentApiService, useValue: mockDocumentApiService }]});
    fixture = TestBed.createComponent(DocumentPreviewDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
