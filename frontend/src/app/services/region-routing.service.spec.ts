import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RegionRoutingService } from './region-routing.service';

describe('RegionRoutingService', () => {
  let service: RegionRoutingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RegionRoutingService]
    });
    service = TestBed.inject(RegionRoutingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    const ipapiReqs = httpMock.match(req => req.url === 'https://ipapi.co/json/');
    ipapiReqs.forEach(req => req.flush({
      country: 'FR',
      continent: 'EU',
      city: 'Paris',
      latitude: 48.8,
      longitude: 2.3,
      timezone: 'Europe/Paris'
    }));
    const healthReqs = httpMock.match(req => !!(req.url && req.url.includes('/actuator/health')));
    healthReqs.forEach(req => req.flush({ status: 'UP' }));
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all regions', () => {
    const regions = service.getAllRegions();
    expect(regions.length).toBe(3);
    expect(regions.some(r => r.name === 'eu-west-1')).toBeTruthy();
    expect(regions.some(r => r.name === 'us-east-1')).toBeTruthy();
    expect(regions.some(r => r.name === 'ap-southeast-1')).toBeTruthy();
  });

  it('should get API endpoint for selected region', () => {
    const endpoint = service.getApiEndpoint();
    expect(endpoint).toBeTruthy();
    expect(endpoint).toContain('https://');
  });

  it('should find region by name', () => {
    const region = service.getRegionByName('eu-west-1');
    expect(region).toBeTruthy();
    expect(region?.displayName).toBe('Europe (Paris)');
  });
});
