import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FeatureService } from './feature.service';

describe('FeatureService', () => {
  let service: FeatureService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FeatureService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('treats modules as enabled until told otherwise, like the server', () => {
    expect(service.isEnabled('addon.export')).toBe(true);
    service.load();
    service.load();
    httpMock.expectOne('/api/v1/features').flush([
      { key: 'addon.export', label: 'Export des leads', enabled: false, core: false, enforced: true },
      { key: 'core.dossier', label: 'Dossiers', enabled: true, core: true, enforced: false },
    ]);
    expect(service.isEnabled('addon.export')).toBe(false);
    expect(service.isEnabled('core.dossier')).toBe(true);
    expect(service.isEnabled('module.unknown')).toBe(true);
  });

  it('stays permissive if the list cannot be loaded', () => {
    service.load();
    httpMock.expectOne('/api/v1/features').flush({}, { status: 500, statusText: 'Error' });
    expect(service.isEnabled('addon.export')).toBe(true);
  });
});
