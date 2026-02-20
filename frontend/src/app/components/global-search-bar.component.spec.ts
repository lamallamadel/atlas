import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GlobalSearchBarComponent } from './global-search-bar.component';
import { SearchApiService } from '../services/search-api.service';

describe('GlobalSearchBarComponent', () => {
  let component: GlobalSearchBarComponent;
  let fixture: ComponentFixture<GlobalSearchBarComponent>;
  let mockSearchService: jasmine.SpyObj<SearchApiService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockSearchService = jasmine.createSpyObj('SearchApiService', ['autocomplete']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [GlobalSearchBarComponent],
      imports: [FormsModule],
      providers: [
        { provide: SearchApiService, useValue: mockSearchService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalSearchBarComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search query', () => {
    expect(component.searchQuery).toBe('');
    expect(component.showDropdown).toBe(false);
    expect(component.isLoading).toBe(false);
  });

  it('should load recent searches from localStorage on init', () => {
    const recentSearches = [
      { query: 'test1', timestamp: Date.now() },
      { query: 'test2', timestamp: Date.now() - 1000 }
    ];
    localStorage.setItem('globalSearchRecent', JSON.stringify(recentSearches));

    component.ngOnInit();

    expect(component.recentSearches.length).toBe(2);
  });

  it('should clear search query and results', () => {
    component.searchQuery = 'test';
    component.groupedResults = {
      annonces: [{ id: 1, type: 'annonce', title: 'Test', description: '', relevanceScore: 1, createdAt: '', updatedAt: '' }],
      dossiers: [],
      contacts: []
    };
    component.totalHits = 1;

    component.clearSearch();

    expect(component.searchQuery).toBe('');
    expect(component.groupedResults.annonces.length).toBe(0);
    expect(component.totalHits).toBe(0);
    expect(component.showDropdown).toBe(false);
  });

  it('should navigate to annonce detail on result selection', () => {
    const result = {
      id: 1,
      type: 'annonce',
      title: 'Test Annonce',
      description: 'Test',
      relevanceScore: 1,
      createdAt: '',
      updatedAt: ''
    };

    component.navigateToResult(result);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/annonces', 1]);
  });

  it('should navigate to dossier detail on result selection', () => {
    const result = {
      id: 2,
      type: 'dossier',
      title: 'Test Dossier',
      description: 'Test',
      relevanceScore: 1,
      createdAt: '',
      updatedAt: ''
    };

    component.navigateToResult(result);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dossiers', 2]);
  });

  it('should navigate to contact detail on result selection', () => {
    const result = {
      id: 3,
      type: 'contact',
      title: 'Test Contact',
      description: 'Test',
      relevanceScore: 1,
      createdAt: '',
      updatedAt: ''
    };

    component.navigateToResult(result);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/parties-prenantes', 3]);
  });

  it('should navigate to search page on view all results', () => {
    component.searchQuery = 'test query';

    component.viewAllResults();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'test query' }
    });
  });

  it('should save recent search on navigation', () => {
    component.searchQuery = 'test search';
    const result = {
      id: 1,
      type: 'annonce',
      title: 'Test',
      description: '',
      relevanceScore: 1,
      createdAt: '',
      updatedAt: ''
    };

    component.navigateToResult(result);

    const stored = localStorage.getItem('globalSearchRecent');
    expect(stored).toBeTruthy();
    
    const parsed = JSON.parse(stored!);
    expect(parsed[0].query).toBe('test search');
  });

  it('should remove recent search', () => {
    component.recentSearches = [
      { query: 'test1', timestamp: 1 },
      { query: 'test2', timestamp: 2 }
    ];

    const event = new Event('click');
    component.removeRecentSearch({ query: 'test1', timestamp: 1 }, event);

    expect(component.recentSearches.length).toBe(1);
    expect(component.recentSearches[0].query).toBe('test2');
  });

  it('should highlight text with search query', () => {
    const text = 'hello world';
    const query = 'world';

    const highlighted = component['highlightText'](text, query);

    expect(highlighted).toContain('<mark>');
    expect(highlighted).toContain('world');
    expect(highlighted).toContain('</mark>');
  });

  it('should calculate fuzzy score correctly', () => {
    const score1 = component['fuzzyScore']('hello', 'hello');
    const score2 = component['fuzzyScore']('hello', 'helo');
    const score3 = component['fuzzyScore']('hello', 'xyz');

    expect(score1).toBeGreaterThan(score2);
    expect(score2).toBeGreaterThan(score3);
  });

  it('should group results by type', () => {
    const results = [
      { id: 1, type: 'annonce', title: 'Annonce 1', description: '', relevanceScore: 1, createdAt: '', updatedAt: '' },
      { id: 2, type: 'dossier', title: 'Dossier 1', description: '', relevanceScore: 1, createdAt: '', updatedAt: '' },
      { id: 3, type: 'annonce', title: 'Annonce 2', description: '', relevanceScore: 1, createdAt: '', updatedAt: '' }
    ];

    component['groupResults'](results);

    expect(component.groupedResults.annonces.length).toBe(2);
    expect(component.groupedResults.dossiers.length).toBe(1);
    expect(component.groupedResults.contacts.length).toBe(0);
  });

  it('should handle keyboard navigation', () => {
    component.flatResults = [
      { id: 1, type: 'annonce', title: 'Test 1', description: '', relevanceScore: 1, createdAt: '', updatedAt: '' },
      { id: 2, type: 'annonce', title: 'Test 2', description: '', relevanceScore: 1, createdAt: '', updatedAt: '' }
    ];
    component.showDropdown = true;
    component.selectedIndex = -1;

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    component.handleKeyboardShortcut(event);

    expect(component.selectedIndex).toBe(0);
  });

  it('should handle Enter key to select result', () => {
    const result = {
      id: 1,
      type: 'annonce',
      title: 'Test',
      description: '',
      relevanceScore: 1,
      createdAt: '',
      updatedAt: ''
    };
    component.flatResults = [result];
    component.selectedIndex = 0;
    component.showDropdown = true;

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    component.handleKeyboardShortcut(event);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/annonces', 1]);
  });

  it('should handle Escape key to close dropdown', () => {
    component.searchQuery = 'test';
    component.showDropdown = true;
    component.flatResults = [
      { id: 1, type: 'annonce', title: 'Test', description: '', relevanceScore: 1, createdAt: '', updatedAt: '' }
    ];

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.handleKeyboardShortcut(event);

    expect(component.searchQuery).toBe('');
    expect(component.showDropdown).toBe(false);
  });

  it('should truncate long text', () => {
    const longText = 'a'.repeat(150);
    const truncated = component.truncate(longText, 100);

    expect(truncated.length).toBe(103); // 100 + '...'
    expect(truncated).toContain('...');
  });

  it('should not truncate short text', () => {
    const shortText = 'short';
    const result = component.truncate(shortText, 100);

    expect(result).toBe(shortText);
  });
});
