import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DocumentUploadComponent } from './document-upload.component';

describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent;
  let fixture: ComponentFixture<DocumentUploadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentUploadComponent],
      imports: [HttpClientTestingModule]
    });
    fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
