import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DocumentUploadComponent } from './document-upload.component';
import { DocumentApiService } from '../services/document-api.service';

describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent;
  let fixture: ComponentFixture<DocumentUploadComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentUploadComponent],
      imports: [
        CommonModule,
        FormsModule,
        HttpClientTestingModule,
        MatSnackBarModule,
        MatIconModule,
        MatButtonModule,
        MatProgressBarModule
      ],
      providers: [DocumentApiService]
    });
    fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    component.dossierId = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
