import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { BulkOperationService } from './bulk-operation.service';

describe('BulkOperationService', () => {
  let service: BulkOperationService;

  const mockDialog = {
    open: jasmine.createSpy('open').and.returnValue({
      afterClosed: () => ({ subscribe: jasmine.createSpy('subscribe') })
    })
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BulkOperationService,
        { provide: MatDialog, useValue: mockDialog }
      ]
    });
    service = TestBed.inject(BulkOperationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
