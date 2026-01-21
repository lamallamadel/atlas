import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LeadExportDialogComponent } from './lead-export-dialog.component';
import { LeadApiService } from '../services/lead-api.service';

describe('LeadExportDialogComponent', () => {
  let component: LeadExportDialogComponent;
  let fixture: ComponentFixture<LeadExportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeadExportDialogComponent ],
      imports: [
        HttpClientTestingModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        LeadApiService
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LeadExportDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
