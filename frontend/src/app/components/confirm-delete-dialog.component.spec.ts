import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';
import { MaterialTestingModule } from '../testing/material-testing.module';

describe('ConfirmDeleteDialogComponent', () => {
  let component: ConfirmDeleteDialogComponent;
  let fixture: ComponentFixture<ConfirmDeleteDialogComponent>;
  const dialogRef = jasmine.createSpyObj<MatDialogRef<ConfirmDeleteDialogComponent>>('MatDialogRef', ['close']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmDeleteDialogComponent],
      imports: [MaterialTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { title: 'Supprimer ?', message: 'Confirmer suppression ?' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog with false on cancel', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should close dialog with true on confirm', () => {
    component.onConfirm();
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });
});
