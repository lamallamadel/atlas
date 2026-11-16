import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';

import { AppointmentFormDialogComponent } from './appointment-form-dialog.component';
import { DatetimePickerComponent } from './datetime-picker.component';
import { AppointmentStatus } from '../services/appointment-api.service';

describe('AppointmentFormDialogComponent', () => {
  let component: AppointmentFormDialogComponent;
  let fixture: ComponentFixture<AppointmentFormDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn().mockName('DialogRef.close')};

    await TestBed.configureTestingModule({
      imports: [
        AppointmentFormDialogComponent,
        DatetimePickerComponent],
      providers: [
        { provide: DialogRef, useValue: mockDialogRef },
        { provide: DIALOG_DATA, useValue: { dossierId: 1 } }]}).compileComponents();

    fixture = TestBed.createComponent(AppointmentFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.appointmentForm.get('status')?.value).toBe(
      AppointmentStatus.SCHEDULED
    );
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
