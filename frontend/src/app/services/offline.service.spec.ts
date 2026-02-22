import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs/operators';
import { OfflineService, ConnectionStatus } from './offline.service';

describe('OfflineService', () => {
  let service: OfflineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfflineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should detect online status', () => {
    expect(service.isOnline()).toBe(navigator.onLine);
  });

  it('should provide connectivity observable', (done) => {
    service.connectivity$.pipe(take(1)).subscribe(state => {
      expect(state).toBeDefined();
      expect(state.status).toBeDefined();
      done();
    });
  });
});
