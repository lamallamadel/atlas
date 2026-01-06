import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BulkOperationDialogComponent } from './bulk-operation-dialog.component';
import { MaterialTestingModule } from '../testing/material-testing.module';

describe('BulkOperationDialogComponent', () => {
  let component: BulkOperationDialogComponent;
  let fixture: ComponentFixture<BulkOperationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BulkOperationDialogComponent],
      imports: [MaterialTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Test',
            message: 'Test',
            successCount: 0,
            failureCount: 0,
            totalCount: 1,
            errors: [],
            inProgress: true
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BulkOperationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
