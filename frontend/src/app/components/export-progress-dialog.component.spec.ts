import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExportProgressDialogComponent } from './export-progress-dialog.component';
import { ExportService } from '../services/export.service';

describe('ExportProgressDialogComponent', () => {
  let component: ExportProgressDialogComponent;
  let fixture: ComponentFixture<ExportProgressDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExportProgressDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { message: 'Test message' } },
        { provide: MatDialogRef, useValue: { close: () => { /* Mock close */ } } },
        ExportService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExportProgressDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
