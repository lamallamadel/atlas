import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LeadImportDialogComponent } from './lead-import-dialog.component';
import { LeadApiService } from '../services/lead-api.service';

describe('LeadImportDialogComponent', () => {
  let component: LeadImportDialogComponent;
  let fixture: ComponentFixture<LeadImportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeadImportDialogComponent ],
      imports: [
        HttpClientTestingModule,
        MatSnackBarModule,
        MatIconModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        LeadApiService
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeadImportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
