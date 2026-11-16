import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ExportProgressDialogComponent } from './export-progress-dialog.component';
import { ExportService } from '../services/export.service';

describe('ExportProgressDialogComponent', () => {
  let component: ExportProgressDialogComponent;
  let fixture: ComponentFixture<ExportProgressDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ExportProgressDialogComponent],
    providers: [
        { provide: DIALOG_DATA, useValue: { message: 'Test message' } },
        { provide: DialogRef, useValue: { close: () => {} } },
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
