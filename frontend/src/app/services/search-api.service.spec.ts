import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SearchApiService, SearchResponse } from './search-api.service';
import { environment } from '../../environments/environment';

describe('SearchApiService', () => {
  let service: SearchApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SearchApiService]
    });
    service = TestBed.inject(SearchApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should search with query', () => {
    const mockResponse: SearchResponse = {
      results: [
        {
          id: 1,
          type: 'DOSSIER',
          title: 'Test Dossier',
          description: 'Test description',
          relevanceScore: 0.9,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ],
      totalHits: 1,
      elasticsearchAvailable: true
    };

    service.search('test', undefined, undefined, 0, 10).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.results.length).toBe(1);
      expect(response.totalHits).toBe(1);
    });

    const req = httpMock.expectOne(request => 
      request.url.includes(`${environment.apiBaseUrl}/v1/search`) &&
      request.params.has('q') &&
      request.params.get('q') === 'test'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should search with type filter', () => {
    const mockResponse: SearchResponse = {
      results: [],
      totalHits: 0,
      elasticsearchAvailable: true
    };

    service.search('test', 'DOSSIER').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(request => 
      request.url.includes(`${environment.apiBaseUrl}/v1/search`) &&
      request.params.has('type') &&
      request.params.get('type') === 'DOSSIER'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should search with filters', () => {
    const mockResponse: SearchResponse = {
      results: [],
      totalHits: 0,
      elasticsearchAvailable: true
    };

    const filters = { status: 'NEW' };

    service.search('test', undefined, filters).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(request => 
      request.url.includes(`${environment.apiBaseUrl}/v1/search`) &&
      request.params.has('filters')
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should autocomplete search', () => {
    const mockResponse: SearchResponse = {
      results: [
        {
          id: 1,
          type: 'DOSSIER',
          title: 'Test',
          description: '',
          relevanceScore: 1.0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ],
      totalHits: 1,
      elasticsearchAvailable: true
    };

    service.autocomplete('tes').subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.results.length).toBe(1);
    });

    const req = httpMock.expectOne(request => 
      request.url.includes(`${environment.apiBaseUrl}/v1/search/autocomplete`) &&
      request.params.get('q') === 'tes'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should autocomplete with type filter', () => {
    const mockResponse: SearchResponse = {
      results: [],
      totalHits: 0,
      elasticsearchAvailable: true
    };

    service.autocomplete('tes', 'ANNONCE').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(request => 
      request.url.includes(`${environment.apiBaseUrl}/v1/search/autocomplete`) &&
      request.params.has('type') &&
      request.params.get('type') === 'ANNONCE'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle search error', () => {
    service.search('test').subscribe(
      () => fail('should have failed'),
      (error) => {
        expect(error.status).toBe(500);
      }
    );

    const req = httpMock.expectOne(request => 
      request.url.includes(`${environment.apiBaseUrl}/v1/search`)
    );
    req.flush('Error', { status: 500, statusText: 'Server Error' });
  });
});
