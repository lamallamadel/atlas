import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AppointmentFormDialogComponent } from './appointment-form-dialog.component';
import DatetimePickerComponent from './datetime-picker.component';
import { AppointmentStatus } from '../services/appointment-api.service';
import { MaterialTestingModule } from '../testing/material-testing.module';

describe('AppointmentFormDialogComponent', () => {
  let component: AppointmentFormDialogComponent;
  let fixture: ComponentFixture<AppointmentFormDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AppointmentFormDialogComponent>>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      declarations: [AppointmentFormDialogComponent, DatetimePickerComponent],
      imports: [MaterialTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { dossierId: 1 } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.appointmentForm.get('status')?.value).toBe(AppointmentStatus.SCHEDULED);
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
