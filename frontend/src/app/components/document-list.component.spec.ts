import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DocumentListComponent } from './document-list.component';
import { DocumentApiService } from '../services/document-api.service';

describe('DocumentListComponent', () => {
  let component: DocumentListComponent;
  let fixture: ComponentFixture<DocumentListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentListComponent],
      imports: [
        CommonModule,
        HttpClientTestingModule,
        MatDialogModule,
        MatSnackBarModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule
      ],
      providers: [DocumentApiService],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;
    component.dossierId = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
