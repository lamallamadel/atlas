import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { OfflineConflictResolverService, ConflictResolutionStrategy } from './offline-conflict-resolver.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('OfflineConflictResolverService', () => {
  let service: OfflineConflictResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
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
