import { TestBed } from '@angular/core/testing';
import { AnnonceBulkService } from './annonce-bulk.service';
import { AnnonceApiService } from './annonce-api.service';
import { BulkOperationService } from './bulk-operation.service';

describe('AnnonceBulkService', () => {
  let service: AnnonceBulkService;

  const mockAnnonceApiService = {
    bulkUpdate: vi.fn().mockName('AnnonceApiService.bulkUpdate'),
  };
  const mockBulkOperationService = {
    executeBulkOperation: vi
      .fn()
      .mockName('BulkOperationService.executeBulkOperation'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnnonceBulkService,
        { provide: AnnonceApiService, useValue: mockAnnonceApiService },
        { provide: BulkOperationService, useValue: mockBulkOperationService },
      ],
    });
    service = TestBed.inject(AnnonceBulkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
