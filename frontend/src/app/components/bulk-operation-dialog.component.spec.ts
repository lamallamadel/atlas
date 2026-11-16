import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { BulkOperationDialogComponent } from './bulk-operation-dialog.component';

describe('BulkOperationDialogComponent', () => {
  let component: BulkOperationDialogComponent;
  let fixture: ComponentFixture<BulkOperationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkOperationDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { close: vi.fn() } },
        {
          provide: DIALOG_DATA,
          useValue: {
            title: 'Test',
            message: 'Test',
            successCount: 0,
            failureCount: 0,
            totalCount: 1,
            errors: [],
            inProgress: true}}]}).compileComponents();

    fixture = TestBed.createComponent(BulkOperationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
