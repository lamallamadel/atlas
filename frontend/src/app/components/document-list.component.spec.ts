import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from "rxjs";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import {  } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DocumentListComponent } from './document-list.component';
import { DocumentApiService } from '../services/document-api.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DocumentListComponent', () => {
  let component: DocumentListComponent;
  let fixture: ComponentFixture<DocumentListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [CommonModule,
        MatDialogModule,
        
        MatIconModule,
        MatButtonModule,
        MatTooltipModule, DocumentListComponent],
    providers: [
        { provide: MatSnackBar, useValue: { open: () => ({ onAction: () => of(null), afterDismissed: () => of(null) }), dismiss: () => {} } },DocumentApiService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dossierId', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
