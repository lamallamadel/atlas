import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmNavigationDialogComponent } from './confirm-navigation-dialog.component';

describe('ConfirmNavigationDialogComponent', () => {
  let component: ConfirmNavigationDialogComponent;
  let fixture: ComponentFixture<ConfirmNavigationDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ConfirmNavigationDialogComponent>>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      declarations: [ConfirmNavigationDialogComponent],
      imports: [MatIconModule, MatButtonModule],
      providers: [
        { provide: MatDialogRef, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmNavigationDialogComponent);
    component = fixture.componentInstance;
    dialogRefSpy = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ConfirmNavigationDialogComponent>>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close with false when cancel is clicked', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should close with true when confirm is clicked', () => {
    component.onConfirm();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });
});
