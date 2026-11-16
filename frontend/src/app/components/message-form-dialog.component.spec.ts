import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { MessageFormDialogComponent } from './message-form-dialog.component';
import { DatetimePickerComponent } from './datetime-picker.component';

describe('MessageFormDialogComponent', () => {
  let component: MessageFormDialogComponent;
  let fixture: ComponentFixture<MessageFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MessageFormDialogComponent,
        DatetimePickerComponent],
      providers: [
        { provide: DialogRef, useValue: { close: vi.fn() } },
        { provide: DIALOG_DATA, useValue: { dossierId: 1 } }]}).compileComponents();

    fixture = TestBed.createComponent(MessageFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
