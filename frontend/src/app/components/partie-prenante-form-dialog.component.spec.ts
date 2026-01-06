import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PartiePrenanteFormDialogComponent } from './partie-prenante-form-dialog.component';
import { MaterialTestingModule } from '../testing/material-testing.module';

describe('PartiePrenanteFormDialogComponent', () => {
  let component: PartiePrenanteFormDialogComponent;
  let fixture: ComponentFixture<PartiePrenanteFormDialogComponent>;
  const dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PartiePrenanteFormDialogComponent],
      imports: [MaterialTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { mode: 'add', dossierId: 1, party: null }
        }
      ]
    }).compileComponents();

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
