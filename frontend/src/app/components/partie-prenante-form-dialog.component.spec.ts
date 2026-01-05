import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PartiePrenanteFormDialogComponent } from './partie-prenante-form-dialog.component';
import { PartiePrenanteRole } from '../services/dossier-api.service';

describe('PartiePrenanteFormDialogComponent', () => {
  let component: PartiePrenanteFormDialogComponent;
  let fixture: ComponentFixture<PartiePrenanteFormDialogComponent>;
  let dialogRefMock: jasmine.SpyObj<MatDialogRef<PartiePrenanteFormDialogComponent>>;

  beforeEach(async () => {
    dialogRefMock = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      declarations: [ PartiePrenanteFormDialogComponent ],
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: null }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartiePrenanteFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values for add mode', () => {
    expect(component.isEditMode).toBeFalse();
    expect(component.partieForm.get('role')?.value).toBe(PartiePrenanteRole.BUYER);
    expect(component.partieForm.get('firstName')?.value).toBe('');
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(dialogRefMock.close).toHaveBeenCalled();
  });
});
