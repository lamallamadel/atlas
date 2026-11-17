import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DocumentUploadComponent } from './document-upload.component';
import { DocumentApiService } from '../services/document-api.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent;
  let fixture: ComponentFixture<DocumentUploadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [CommonModule,
        FormsModule,
        DocumentUploadComponent],
    providers: [DocumentApiService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dossierId', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
