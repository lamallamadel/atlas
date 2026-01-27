import { TestBed } from '@angular/core/testing';
import { SearchHistoryService } from './search-history.service';

describe('SearchHistoryService', () => {
  let service: SearchHistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchHistoryService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty array when no history exists', () => {
    const history = service.getHistory();
    expect(history).toEqual([]);
  });

  it('should add item to history', () => {
    service.addToHistory('test query', 5);
    const history = service.getHistory();
    
    expect(history.length).toBe(1);
    expect(history[0].query).toBe('test query');
    expect(history[0].resultCount).toBe(5);
  });

  it('should not add empty or short queries', () => {
    service.addToHistory('', 0);
    service.addToHistory('a', 0);
    
    const history = service.getHistory();
    expect(history.length).toBe(0);
  });

  it('should remove duplicate queries and add to top', () => {
    service.addToHistory('first', 1);
    service.addToHistory('second', 2);
    service.addToHistory('first', 3);
    
    const history = service.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].query).toBe('first');
    expect(history[0].resultCount).toBe(3);
  });

  it('should limit history to max items', () => {
    for (let i = 0; i < 15; i++) {
      service.addToHistory(`query ${i}`, i);
    }
    
    const history = service.getHistory();
    expect(history.length).toBeLessThanOrEqual(10);
  });

  it('should remove item from history', () => {
    service.addToHistory('query1', 1);
    service.addToHistory('query2', 2);
    service.removeFromHistory('query1');
    
    const history = service.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].query).toBe('query2');
  });

  it('should clear all history', () => {
    service.addToHistory('query1', 1);
    service.addToHistory('query2', 2);
    service.clearHistory();
    
    const history = service.getHistory();
    expect(history.length).toBe(0);
  });
});
