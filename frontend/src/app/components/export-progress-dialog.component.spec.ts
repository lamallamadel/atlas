import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExportProgressDialogComponent } from './export-progress-dialog.component';
import { ExportService } from '../services/export.service';

describe('ExportProgressDialogComponent', () => {
  let component: ExportProgressDialogComponent;
  let fixture: ComponentFixture<ExportProgressDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExportProgressDialogComponent],
      imports: [
        CommonModule,
        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        MatProgressBarModule,
        BrowserAnimationsModule
      ],
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
