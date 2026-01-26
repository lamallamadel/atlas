import { TestBed } from '@angular/core/testing';
import { FuzzySearchService } from './fuzzy-search.service';

describe('FuzzySearchService', () => {
  let service: FuzzySearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FuzzySearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fuzzyScore', () => {
    it('should return 0 for empty strings', () => {
      expect(service.fuzzyScore('', '')).toBe(0);
      expect(service.fuzzyScore('test', '')).toBe(0);
      expect(service.fuzzyScore('', 'test')).toBe(0);
    });

    it('should score exact matches highly', () => {
      const exactScore = service.fuzzyScore('test', 'test');
      const partialScore = service.fuzzyScore('testing', 'test');
      expect(exactScore).toBeGreaterThan(partialScore);
    });

    it('should score starts-with matches highly', () => {
      const startsWithScore = service.fuzzyScore('testing', 'test');
      const containsScore = service.fuzzyScore('my testing', 'test');
      expect(startsWithScore).toBeGreaterThan(containsScore);
    });

    it('should handle fuzzy matches', () => {
      const score = service.fuzzyScore('hello world', 'hlo');
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('search', () => {
    interface TestItem {
      id: number;
      name: string;
      description: string;
    }

    const testItems: TestItem[] = [
      { id: 1, name: 'Apple', description: 'A red fruit' },
      { id: 2, name: 'Banana', description: 'A yellow fruit' },
      { id: 3, name: 'Cherry', description: 'A small red fruit' },
      { id: 4, name: 'Apricot', description: 'An orange fruit' }
    ];

    it('should return all items when query is empty', () => {
      const results = service.search(testItems, '', item => [item.name, item.description]);
      expect(results.length).toBe(4);
    });

    it('should filter items by query', () => {
      const results = service.search(testItems, 'ap', item => [item.name, item.description]);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name === 'Apple')).toBe(true);
    });

    it('should sort results by relevance', () => {
      const results = service.search(testItems, 'ap', item => [item.name, item.description]);
      // 'Apple' should score higher than 'Apricot' because it's shorter
      expect(results[0].name).toBe('Apple');
    });

    it('should search across multiple fields', () => {
      const results = service.search(testItems, 'red', item => [item.name, item.description]);
      expect(results.length).toBe(2); // Apple and Cherry have 'red' in description
    });
  });

  describe('highlight', () => {
    it('should return original text when query is empty', () => {
      expect(service.highlight('test', '')).toBe('test');
    });

    it('should highlight exact matches', () => {
      const result = service.highlight('hello world', 'world');
      expect(result).toContain('<mark>world</mark>');
    });

    it('should handle case-insensitive matches', () => {
      const result = service.highlight('Hello World', 'world');
      expect(result).toContain('<mark>World</mark>');
    });
  });

  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(service.levenshteinDistance('test', 'test')).toBe(0);
    });

    it('should calculate distance correctly', () => {
      expect(service.levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(service.levenshteinDistance('saturday', 'sunday')).toBe(3);
    });

    it('should handle empty strings', () => {
      expect(service.levenshteinDistance('', 'test')).toBe(4);
      expect(service.levenshteinDistance('test', '')).toBe(4);
    });
  });
});
