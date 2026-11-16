import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ConfirmDeleteDialogComponent } from './confirm-delete-dialog.component';

describe('ConfirmDeleteDialogComponent', () => {
  let component: ConfirmDeleteDialogComponent;
  let fixture: ComponentFixture<ConfirmDeleteDialogComponent>;
  const dialogRef = {
    close: vi.fn().mockName('DialogRef.close')};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteDialogComponent],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        {
          provide: DIALOG_DATA,
          useValue: {
            title: 'Supprimer ?',
            message: 'Confirmer suppression ?'}}]}).compileComponents();

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
