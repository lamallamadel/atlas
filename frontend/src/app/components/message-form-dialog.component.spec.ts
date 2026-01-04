import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MessageFormDialogComponent } from './message-form-dialog.component';

describe('MessageFormDialogComponent', () => {
  let component: MessageFormDialogComponent;
  let fixture: ComponentFixture<MessageFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageFormDialogComponent ],
      imports: [ ReactiveFormsModule ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { dossierId: 1 } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
