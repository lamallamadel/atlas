import { TestBed } from '@angular/core/testing';
import { FilterPresetService } from './filter-preset.service';

describe('FilterPresetService', () => {
  let service: FilterPresetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterPresetService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save a preset', () => {
    const context = 'test-context';
    const name = 'My Preset';
    const filters = { status: 'ACTIVE', city: 'Paris' };

    service.savePreset(context, name, filters);
    const presets = service.getPresets(context);

    expect(presets.length).toBe(1);
    expect(presets[0].name).toBe(name);
    expect(presets[0].filters).toEqual(filters);
  });

  it('should get empty array when no presets exist', () => {
    const presets = service.getPresets('non-existent');
    expect(presets).toEqual([]);
  });

  it('should delete a preset', () => {
    const context = 'test-context';
    service.savePreset(context, 'Preset 1', { a: 1 });
    service.savePreset(context, 'Preset 2', { b: 2 });

    let presets = service.getPresets(context);
    expect(presets.length).toBe(2);

    const idToDelete = presets[0].id;
    service.deletePreset(context, idToDelete);

    presets = service.getPresets(context);
    expect(presets.length).toBe(1);
    expect(presets[0].name).toBe('Preset 2');
  });

  it('should handle multiple contexts independently', () => {
    service.savePreset('context1', 'Preset A', { x: 1 });
    service.savePreset('context2', 'Preset B', { y: 2 });

    const presets1 = service.getPresets('context1');
    const presets2 = service.getPresets('context2');

    expect(presets1.length).toBe(1);
    expect(presets2.length).toBe(1);
    expect(presets1[0].name).toBe('Preset A');
    expect(presets2[0].name).toBe('Preset B');
  });

  it('should preserve dates when saving and loading', () => {
    const context = 'test-context';
    service.savePreset(context, 'Test', {});
    
    const presets = service.getPresets(context);
    expect(presets[0].createdAt).toBeInstanceOf(Date);
  });
});
