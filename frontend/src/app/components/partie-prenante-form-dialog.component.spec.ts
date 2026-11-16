import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { PartiePrenanteFormDialogComponent } from './partie-prenante-form-dialog.component';

describe('PartiePrenanteFormDialogComponent', () => {
  let component: PartiePrenanteFormDialogComponent;
  let fixture: ComponentFixture<PartiePrenanteFormDialogComponent>;
  const dialogRef = {
    close: vi.fn().mockName('DialogRef.close')};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartiePrenanteFormDialogComponent],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        {
          provide: DIALOG_DATA,
          useValue: { mode: 'add', dossierId: 1, party: null }}]}).compileComponents();

    fixture = TestBed.createComponent(PartiePrenanteFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
