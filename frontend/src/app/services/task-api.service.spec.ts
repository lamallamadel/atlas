import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskApiService } from './task-api.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('TaskApiService', () => {
  let service: TaskApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    service = TestBed.inject(TaskApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
