import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from "rxjs";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {  } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
        
        MatIconModule,
        MatButtonModule,
        MatProgressBarModule, DocumentUploadComponent],
    providers: [
        { provide: MatSnackBar, useValue: { open: () => ({ onAction: () => of(null), afterDismissed: () => of(null) }), dismiss: () => {} } },DocumentApiService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
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
