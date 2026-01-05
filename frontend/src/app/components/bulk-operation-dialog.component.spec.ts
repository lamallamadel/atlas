import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BulkOperationDialogComponent } from './bulk-operation-dialog.component';

describe('BulkOperationDialogComponent', () => {
  let component: BulkOperationDialogComponent;
  let fixture: ComponentFixture<BulkOperationDialogComponent>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockDialogData = {
    title: 'Test Bulk Operation',
    message: 'Processing items...',
    successCount: 0,
    failureCount: 0,
    totalCount: 10,
    errors: [],
    inProgress: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BulkOperationDialogComponent ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BulkOperationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
