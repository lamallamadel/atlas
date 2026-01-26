import { TestBed } from '@angular/core/testing';
import { UserPreferencesService } from './user-preferences.service';

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserPreferencesService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty object when no preferences are stored', () => {
    const prefs = service.getPreferences();
    expect(prefs).toEqual({});
  });

  it('should store and retrieve preferences', () => {
    service.setPreference('dossierViewMode', 'kanban');
    const prefs = service.getPreferences();
    expect(prefs.dossierViewMode).toBe('kanban');
  });

  it('should get specific preference with default value', () => {
    const viewMode = service.getPreference('dossierViewMode', 'list');
    expect(viewMode).toBe('list');
  });

  it('should clear all preferences', () => {
    service.setPreference('dossierViewMode', 'kanban');
    service.clearPreferences();
    const prefs = service.getPreferences();
    expect(prefs).toEqual({});
  });
});
