import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, BehaviorSubject } from 'rxjs';

import { CommandPaletteComponent } from './command-palette.component';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { SearchApiService } from '../services/search-api.service';
import { RecentNavigationService } from '../services/recent-navigation.service';
import { AiAgentService } from '../services/ai-agent.service';

describe('CommandPaletteComponent', () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockKeyboardService: any;
  let mockSearchService: jasmine.SpyObj<SearchApiService>;
  let mockRecentNavService: jasmine.SpyObj<RecentNavigationService>;
  let visibleSubject: BehaviorSubject<boolean>;

  beforeEach(async () => {
    visibleSubject = new BehaviorSubject<boolean>(false);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    mockKeyboardService = {
      commandPaletteVisible$: visibleSubject.asObservable(),
      closeCommandPalette: jasmine.createSpy('closeCommandPalette'),
      toggleShortcutHelp: jasmine.createSpy('toggleShortcutHelp')
    };

    mockSearchService = jasmine.createSpyObj('SearchApiService', ['autocomplete']);
    mockSearchService.autocomplete.and.returnValue(of({
      results: [],
      totalHits: 0,
      elasticsearchAvailable: true
    }));

    mockRecentNavService = jasmine.createSpyObj('RecentNavigationService', ['getRecentItems']);
    mockRecentNavService.getRecentItems.and.returnValue([]);

    const mockAiAgentService = jasmine.createSpyObj('AiAgentService', ['openPanel']);

    await TestBed.configureTestingModule({
      declarations: [CommandPaletteComponent],
      imports: [
        MatIconModule,
        MatProgressSpinnerModule,
        FormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: KeyboardShortcutService, useValue: mockKeyboardService },
        { provide: SearchApiService, useValue: mockSearchService },
        { provide: RecentNavigationService, useValue: mockRecentNavService },
        { provide: AiAgentService, useValue: mockAiAgentService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize global commands', () => {
    expect(component.globalCommands.length).toBeGreaterThan(0);
    const createDossierCmd = component.globalCommands.find(c => c.id === 'create-dossier');
    expect(createDossierCmd).toBeDefined();
    expect(createDossierCmd?.label).toContain('dossier');
  });

  it('should show palette when visible$ emits true', (done) => {
    visibleSubject.next(true);

    fixture.detectChanges();

    setTimeout(() => {
      expect(component.commandInput).toBeDefined();
      done();
    }, 150);
  });

  it('should filter commands based on search query', () => {
    component.searchQuery = 'dossier';
    component.onSearchChange();

    setTimeout(() => {
      const filteredIds = component.filteredItems
        .filter(item => 'action' in item)
        .map((item: any) => item.id);

      expect(filteredIds).toContain('create-dossier');
      expect(filteredIds).toContain('nav-dossiers');
    }, 350);
  });

  it('should handle arrow down key navigation', () => {
    component.filteredItems = component.globalCommands;
    component.selectedIndex = 0;

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    spyOn(event, 'preventDefault');

    component.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.selectedIndex).toBe(1);
  });

  it('should handle arrow up key navigation', () => {
    component.filteredItems = component.globalCommands;
    component.selectedIndex = 2;

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    spyOn(event, 'preventDefault');

    component.onKeyDown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.selectedIndex).toBe(1);
  });

  it('should not go below index 0 with arrow up', () => {
    component.filteredItems = component.globalCommands;
    component.selectedIndex = 0;

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    component.onKeyDown(event);

    expect(component.selectedIndex).toBe(0);
  });

  it('should execute command on Enter key', () => {
    const mockCommand = component.globalCommands[0];
    spyOn(mockCommand, 'action');

    component.filteredItems = [mockCommand];
    component.selectedIndex = 0;

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onKeyDown(event);

    expect(mockCommand.action).toHaveBeenCalled();
  });

  it('should close palette on Escape key', () => {
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onKeyDown(event);

    expect(mockKeyboardService.closeCommandPalette).toHaveBeenCalled();
  });

  it('should close palette when executing item', () => {
    const mockCommand = component.globalCommands[0];
    component.executeItem(mockCommand);

    expect(mockKeyboardService.closeCommandPalette).toHaveBeenCalled();
  });

  it('should group items by category', () => {
    component.filteredItems = component.globalCommands;
    const grouped = component.getGroupedItems();

    expect(grouped.length).toBeGreaterThan(0);

    const navigationGroup = grouped.find(g => g.category === 'Navigation');
    expect(navigationGroup).toBeDefined();
    expect(navigationGroup!.items.length).toBeGreaterThan(0);
  });

  it('should get correct icon for different item types', () => {
    const command = component.globalCommands[0];
    expect(component.getItemIcon(command)).toBe(command.icon);

    const searchResult = {
      id: 1,
      type: 'ANNONCE',
      title: 'Test',
      description: '',
      relevanceScore: 1,
      createdAt: '',
      updatedAt: ''
    };
    expect(component.getItemIcon(searchResult)).toBe('campaign');

    const recentItem = {
      id: '1',
      type: 'dossier' as const,
      title: 'Recent',
      route: '/dossiers/1',
      timestamp: Date.now()
    };
    expect(component.getItemIcon(recentItem)).toBe('folder');
  });

  it('should reset state when closing', () => {
    component.searchQuery = 'test';
    component.selectedIndex = 5;
    component.isSearching = true;

    component['resetState']();

    expect(component.searchQuery).toBe('');
    expect(component.selectedIndex).toBe(0);
    expect(component.isSearching).toBeFalse();
  });

  it('should navigate to correct route for search results', () => {
    const annonceResult = {
      id: 1,
      type: 'ANNONCE',
      title: 'Test',
      description: '',
      relevanceScore: 1,
      createdAt: '',
      updatedAt: ''
    };

    component.executeItem(annonceResult);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/annonces/1']);
  });

  it('should call search service when query length >= 2', fakeAsync(() => {
    component.searchQuery = 'te';
    component.onSearchChange();

    tick(350);

    expect(mockSearchService.autocomplete).toHaveBeenCalledWith('te');
  }));

  it('should show recent items when no query', () => {
    const recentItems = [{
      id: '1',
      type: 'dossier' as const,
      title: 'Recent Dossier',
      route: '/dossiers/1',
      timestamp: Date.now()
    }];

    mockRecentNavService.getRecentItems.and.returnValue(recentItems);
    component.searchQuery = '';
    component['updateFilteredItems']();

    expect(component.filteredItems.length).toBeGreaterThan(0);
  });
});
