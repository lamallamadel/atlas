import { TestBed } from '@angular/core/testing';
import { DossierBulkService } from './dossier-bulk.service';
import { DossierApiService } from './dossier-api.service';
import { BulkOperationService } from './bulk-operation.service';

describe('DossierBulkService', () => {
  let service: DossierBulkService;

  const mockDossierApiService = {
    bulkAssign: vi.fn().mockName('DossierApiService.bulkAssign'),
  };
  const mockBulkOperationService = {
    executeBulkOperation: vi
      .fn()
      .mockName('BulkOperationService.executeBulkOperation'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DossierBulkService,
        { provide: DossierApiService, useValue: mockDossierApiService },
        { provide: BulkOperationService, useValue: mockBulkOperationService },
      ],
    });
    service = TestBed.inject(DossierBulkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
