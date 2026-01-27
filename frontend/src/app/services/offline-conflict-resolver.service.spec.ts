import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { OfflineConflictResolverService, ConflictResolutionStrategy } from './offline-conflict-resolver.service';

describe('OfflineConflictResolverService', () => {
  let service: OfflineConflictResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(OfflineConflictResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set default strategy', () => {
    service.setDefaultStrategy(ConflictResolutionStrategy.CLIENT_WINS);
    expect(service).toBeTruthy();
  });
});
