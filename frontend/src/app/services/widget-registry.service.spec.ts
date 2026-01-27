import { TestBed } from '@angular/core/testing';
import { WidgetRegistryService, WidgetMetadata } from './widget-registry.service';
import { CardWidgetBaseComponent } from '../components/card-widget-base.component';

describe('WidgetRegistryService', () => {
  let service: WidgetRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WidgetRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default widgets registered', () => {
    const widgets = service.getAllWidgets();
    expect(widgets.length).toBeGreaterThan(0);
  });

  it('should get widget metadata by id', () => {
    const metadata = service.getMetadata('kpi-conversion');
    expect(metadata).toBeTruthy();
    expect(metadata?.name).toBe('Taux de conversion');
  });

  it('should get widgets by category', () => {
    const kpiWidgets = service.getWidgetsByCategory('kpi');
    expect(kpiWidgets.length).toBeGreaterThan(0);
    expect(kpiWidgets.every(w => w.category === 'kpi')).toBe(true);
  });

  it('should check if widget is registered', () => {
    expect(service.isRegistered('kpi-conversion')).toBe(true);
    expect(service.isRegistered('non-existent-widget')).toBe(false);
  });

  it('should get default dimensions', () => {
    const dimensions = service.getDefaultDimensions('kpi-conversion');
    expect(dimensions.cols).toBeTruthy();
    expect(dimensions.rows).toBeTruthy();
  });
});
