import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IconRegistryService } from './icon-registry.service';

describe('IconRegistryService', () => {
  let service: IconRegistryService;
  let httpMock: HttpTestingController;

  const mockSvgSprite = `
    <svg xmlns="http://www.w3.org/2000/svg">
      <symbol id="re-house" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      </symbol>
      <symbol id="re-apartment" viewBox="0 0 24 24">
        <rect x="4" y="2" width="16" height="20"/>
      </symbol>
    </svg>
  `;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IconRegistryService]
    });
    service = TestBed.inject(IconRegistryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load icons from SVG sprite', (done) => {
    service.loadIcons().subscribe(() => {
      expect(service.isLoaded()).toBe(true);
      done();
    });

    const req = httpMock.expectOne('/assets/icons/real-estate-icons.svg');
    expect(req.request.method).toBe('GET');
    req.flush(mockSvgSprite);
  });

  it('should cache icons after loading', (done) => {
    service.loadIcons().subscribe(() => {
      expect(service.getIconSync('re-house')).toBeTruthy();
      expect(service.getIconSync('re-apartment')).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne('/assets/icons/real-estate-icons.svg');
    req.flush(mockSvgSprite);
  });

  it('should return null for non-existent icon', (done) => {
    service.loadIcons().subscribe(() => {
      expect(service.getIconSync('non-existent')).toBeNull();
      done();
    });

    const req = httpMock.expectOne('/assets/icons/real-estate-icons.svg');
    req.flush(mockSvgSprite);
  });

  it('should get icon asynchronously', (done) => {
    service.getIcon('re-house').subscribe(icon => {
      expect(icon).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne('/assets/icons/real-estate-icons.svg');
    req.flush(mockSvgSprite);
  });

  it('should share the same HTTP request for multiple subscribers', (done) => {
    let count = 0;

    service.loadIcons().subscribe(() => {
      count++;
      if (count === 2) {
        done();
      }
    });

    service.loadIcons().subscribe(() => {
      count++;
      if (count === 2) {
        done();
      }
    });

    const requests = httpMock.match('/assets/icons/real-estate-icons.svg');
    expect(requests.length).toBe(1);
    requests[0].flush(mockSvgSprite);
  });

  it('should return metadata for all icons', () => {
    const metadata = service.getMetadata();
    expect(metadata.length).toBeGreaterThan(0);
    expect(metadata[0].id).toBeDefined();
    expect(metadata[0].name).toBeDefined();
    expect(metadata[0].category).toBeDefined();
    expect(metadata[0].tags).toBeDefined();
  });

  it('should return metadata for specific icon', () => {
    const metadata = service.getMetadata('re-house');
    expect(metadata.length).toBe(1);
    expect(metadata[0].id).toBe('re-house');
  });

  it('should search icons by name', () => {
    const results = service.searchIcons('maison');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(icon => icon.name.toLowerCase().includes('maison'))).toBe(true);
  });

  it('should search icons by tag', () => {
    const results = service.searchIcons('home');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(icon => icon.tags.includes('home'))).toBe(true);
  });

  it('should search icons by description', () => {
    const results = service.searchIcons('individuelle');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(icon => icon.description.toLowerCase().includes('individuelle'))).toBe(true);
  });

  it('should filter icons by category', () => {
    const houseTypes = service.getIconsByCategory('house-types');
    expect(houseTypes.length).toBeGreaterThan(0);
    expect(houseTypes.every(icon => icon.category === 'house-types')).toBe(true);
  });

  it('should return all categories', () => {
    const categories = service.getAllCategories();
    expect(categories.length).toBe(6);
    expect(categories[0].key).toBeDefined();
    expect(categories[0].label).toBeDefined();
  });

  it('should return false for isLoaded before icons are loaded', () => {
    expect(service.isLoaded()).toBe(false);
  });

  it('should return true for isLoaded after icons are loaded', (done) => {
    service.loadIcons().subscribe(() => {
      expect(service.isLoaded()).toBe(true);
      done();
    });

    const req = httpMock.expectOne('/assets/icons/real-estate-icons.svg');
    req.flush(mockSvgSprite);
  });

  it('should handle HTTP errors gracefully', (done) => {
    service.loadIcons().subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne('/assets/icons/real-estate-icons.svg');
    req.error(new ErrorEvent('Network error'));
  });

  it('should have correct metadata for house types', () => {
    const houseTypes = service.getIconsByCategory('house-types');
    const iconIds = houseTypes.map(icon => icon.id);

    expect(iconIds).toContain('re-house');
    expect(iconIds).toContain('re-apartment');
    expect(iconIds).toContain('re-villa');
    expect(iconIds).toContain('re-office');
    expect(iconIds).toContain('re-warehouse');
    expect(iconIds).toContain('re-land');
  });

  it('should have correct metadata for rooms', () => {
    const rooms = service.getIconsByCategory('rooms');
    const iconIds = rooms.map(icon => icon.id);

    expect(iconIds).toContain('re-bedroom');
    expect(iconIds).toContain('re-bathroom');
    expect(iconIds).toContain('re-kitchen');
    expect(iconIds).toContain('re-living-room');
    expect(iconIds).toContain('re-garage');
    expect(iconIds).toContain('re-balcony');
  });

  it('should have correct metadata for amenities', () => {
    const amenities = service.getIconsByCategory('amenities');
    const iconIds = amenities.map(icon => icon.id);

    expect(iconIds).toContain('re-pool');
    expect(iconIds).toContain('re-garden');
    expect(iconIds).toContain('re-parking');
    expect(iconIds).toContain('re-elevator');
  });
});
