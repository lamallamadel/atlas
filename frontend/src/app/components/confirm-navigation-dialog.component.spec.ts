import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogRef } from '@angular/cdk/dialog';
import { ConfirmNavigationDialogComponent } from './confirm-navigation-dialog.component';

describe('ConfirmNavigationDialogComponent', () => {
  let component: ConfirmNavigationDialogComponent;
  let fixture: ComponentFixture<ConfirmNavigationDialogComponent>;
  let dialogRefSpy: AngularVitestPartialMock<DialogRef<ConfirmNavigationDialogComponent>>;

  beforeEach(async () => {
    const spy = {
      close: vi.fn().mockName('DialogRef.close')};

    await TestBed.configureTestingModule({
      imports: [
        ConfirmNavigationDialogComponent],
      providers: [{ provide: DialogRef, useValue: spy }]}).compileComponents();

    fixture = TestBed.createComponent(ConfirmNavigationDialogComponent);
    component = fixture.componentInstance;
    dialogRefSpy = TestBed.inject(DialogRef) as AngularVitestPartialMock<
      DialogRef<ConfirmNavigationDialogComponent>
    >;
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
