import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FilterPresetService } from './filter-preset.service';

describe('FilterPresetService', () => {
  let service: FilterPresetService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
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

    service.savePresetLocally(context, name, filters);
    const presets = service.getPresetsLocally(context);

    expect(presets.length).toBe(1);
    expect(presets[0].name).toBe(name);
    expect(presets[0].filterConfig).toEqual(filters);
  });

  it('should get empty array when no presets exist', () => {
    const presets = service.getPresetsLocally('non-existent');
    expect(presets).toEqual([]);
  });

  it('should delete a preset', () => {
    const context = 'test-context';
    service.savePresetLocally(context, 'Preset 1', { a: 1 });
    service.savePresetLocally(context, 'Preset 2', { b: 2 });

    let presets = service.getPresetsLocally(context);
    expect(presets.length).toBe(2);

    const nameToDelete = presets[0].name;
    service.deletePresetLocally(context, nameToDelete);

    presets = service.getPresetsLocally(context);
    expect(presets.length).toBe(1);
    expect(presets[0].name).toBe('Preset 2');
  });

  it('should handle multiple contexts independently', () => {
    service.savePresetLocally('context1', 'Preset A', { x: 1 });
    service.savePresetLocally('context2', 'Preset B', { y: 2 });

    const presets1 = service.getPresetsLocally('context1');
    const presets2 = service.getPresetsLocally('context2');

    expect(presets1.length).toBe(1);
    expect(presets2.length).toBe(1);
    expect(presets1[0].name).toBe('Preset A');
    expect(presets2[0].name).toBe('Preset B');
  });

  it('should preserve dates when saving and loading', () => {
    const context = 'test-context';
    service.savePresetLocally(context, 'Test', {});

    const presets = service.getPresetsLocally(context);
    expect(presets[0].createdAt).toBeInstanceOf(Date);
  });
});
