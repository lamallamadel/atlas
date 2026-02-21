import { TestBed } from '@angular/core/testing';
import { TourDefinitionService } from './tour-definition.service';

describe('TourDefinitionService', () => {
  let service: TourDefinitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TourDefinitionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all tours', () => {
    const tours = service.getAllTours();
    expect(tours.length).toBeGreaterThan(0);
  });

  it('should return core tours', () => {
    const coreTours = service.getCoreTours();
    expect(coreTours.length).toBe(5);
    expect(coreTours.every(t => t.category === 'core')).toBe(true);
  });

  it('should return a specific tour by ID', () => {
    const tour = service.getTour('dashboard-overview');
    expect(tour).toBeTruthy();
    expect(tour?.id).toBe('dashboard-overview');
  });

  it('should return undefined for non-existent tour', () => {
    const tour = service.getTour('non-existent-tour');
    expect(tour).toBeUndefined();
  });

  it('should have proper tour structure', () => {
    const tour = service.getTour('dashboard-overview');
    expect(tour).toBeTruthy();
    expect(tour?.id).toBeDefined();
    expect(tour?.name).toBeDefined();
    expect(tour?.description).toBeDefined();
    expect(tour?.steps).toBeDefined();
    expect(tour?.steps.length).toBeGreaterThan(0);
    expect(tour?.category).toBeDefined();
    expect(tour?.estimatedTime).toBeGreaterThan(0);
  });
});
