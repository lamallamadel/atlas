import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { SearchApiService, SearchResult } from '../services/search-api.service';
import { RecentNavigationService, RecentItem } from '../services/recent-navigation.service';
import { Observable, Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';
import { DossierCreateDialogComponent } from '../pages/dossiers/dossier-create-dialog.component';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
  category: string;
  keywords?: string[];
  shortcut?: string;
}

type PaletteItem = CommandItem | SearchResult | RecentItem;

interface GroupedItems {
  category: string;
  items: PaletteItem[];
}

@Component({
  selector: 'app-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.css']
})
export class CommandPaletteComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('commandInput') commandInput!: ElementRef;

  visible$: Observable<boolean>;
  searchQuery = '';
  globalCommands: CommandItem[] = [];
  filteredItems: PaletteItem[] = [];
  selectedIndex = 0;
  isSearching = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private keyboardShortcutService: KeyboardShortcutService,
    private searchApiService: SearchApiService,
    private recentNavigationService: RecentNavigationService
  ) {
    this.visible$ = this.keyboardShortcutService.commandPaletteVisible$;
  }

  ngOnInit(): void {
    this.initializeGlobalCommands();
    this.initializeSearch();
    
    this.visible$.pipe(takeUntil(this.destroy$)).subscribe(visible => {
      if (visible) {
        setTimeout(() => {
          this.commandInput?.nativeElement?.focus();
          this.updateFilteredItems();
        }, 100);
      } else {
        this.resetState();
      }
    });
  }

  ngAfterViewInit(): void {
    this.keyboardShortcutService.commandPaletteVisible$
      .pipe(takeUntil(this.destroy$))
      .subscribe(visible => {
        if (visible && this.commandInput) {
          setTimeout(() => {
            this.commandInput.nativeElement.focus();
          }, 100);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeGlobalCommands(): void {
    this.globalCommands = [
      {
        id: 'create-dossier',
        label: 'Créer un nouveau dossier',
        description: 'Ouvrir le formulaire de création de dossier',
        icon: 'create_new_folder',
        category: 'Actions',
        keywords: ['nouveau', 'créer', 'dossier', 'lead'],
        shortcut: 'Ctrl+Shift+D',
        action: () => this.openCreateDossierDialog()
      },
      {
        id: 'create-annonce',
        label: 'Créer une nouvelle annonce',
        description: 'Créer une nouvelle annonce immobilière',
        icon: 'add_circle',
        category: 'Actions',
        keywords: ['nouveau', 'créer', 'annonce', 'propriété'],
        shortcut: 'Ctrl+Shift+A',
        action: () => this.navigateTo('/annonces/new')
      },
      {
        id: 'nav-dashboard',
        label: 'Tableau de bord',
        description: 'Voir le tableau de bord principal',
        icon: 'dashboard',
        category: 'Navigation',
        keywords: ['accueil', 'home', 'dashboard'],
        shortcut: 'g+h',
        action: () => this.navigateTo('/dashboard')
      },
      {
        id: 'nav-annonces',
        label: 'Annonces',
        description: 'Liste de toutes les annonces',
        icon: 'campaign',
        category: 'Navigation',
        keywords: ['propriété', 'bien', 'annonce'],
        shortcut: 'g+a',
        action: () => this.navigateTo('/annonces')
      },
      {
        id: 'nav-dossiers',
        label: 'Dossiers',
        description: 'Liste de tous les dossiers',
        icon: 'folder',
        category: 'Navigation',
        keywords: ['leads', 'clients', 'dossiers'],
        shortcut: 'g+d',
        action: () => this.navigateTo('/dossiers')
      },
      {
        id: 'nav-tasks',
        label: 'Tâches',
        description: 'Voir toutes les tâches',
        icon: 'task',
        category: 'Navigation',
        keywords: ['todo', 'tâches', 'tasks'],
        shortcut: 'g+t',
        action: () => this.navigateTo('/tasks')
      },
      {
        id: 'nav-reports',
        label: 'Rapports',
        description: 'Voir les rapports et KPIs',
        icon: 'insights',
        category: 'Navigation',
        keywords: ['statistiques', 'analytics', 'rapports'],
        action: () => this.navigateTo('/reports')
      },
      {
        id: 'nav-observability',
        label: 'Observabilité',
        description: 'Dashboard d\'observabilité système',
        icon: 'analytics',
        category: 'Navigation',
        keywords: ['monitoring', 'logs', 'metrics'],
        action: () => this.navigateTo('/observability')
      },
      {
        id: 'nav-search',
        label: 'Recherche globale',
        description: 'Rechercher des annonces et dossiers',
        icon: 'search',
        category: 'Navigation',
        keywords: ['chercher', 'trouver', 'search'],
        shortcut: '/',
        action: () => this.navigateTo('/search')
      },
      {
        id: 'show-shortcuts',
        label: 'Raccourcis clavier',
        description: 'Voir tous les raccourcis disponibles',
        icon: 'keyboard',
        category: 'Aide',
        keywords: ['aide', 'help', 'shortcuts'],
        shortcut: '?',
        action: () => {
          this.close();
          this.keyboardShortcutService.toggleShortcutHelp();
        }
      }
    ];
  }

  private initializeSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          return of(null);
        }
        this.isSearching = true;
        return this.searchApiService.autocomplete(query);
      }),
      takeUntil(this.destroy$)
    ).subscribe(response => {
      this.isSearching = false;
      this.updateFilteredItems(response?.results || []);
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
    
    // Immediate local filtering for better responsiveness
    if (!this.searchQuery || this.searchQuery.length < 2) {
      this.updateFilteredItems();
    }
  }

  private updateFilteredItems(searchResults: SearchResult[] = []): void {
    const query = this.searchQuery.toLowerCase().trim();
    
    let items: PaletteItem[] = [];

    if (!query) {
      // Show recent items when no query
      const recentItems = this.recentNavigationService.getRecentItems();
      items = [...recentItems, ...this.globalCommands];
    } else {
      // Fuzzy filter global commands
      const filteredCommands = this.globalCommands.filter(cmd =>
        this.fuzzyMatch(query, cmd.label) ||
        this.fuzzyMatch(query, cmd.description) ||
        this.fuzzyMatch(query, cmd.category) ||
        cmd.keywords?.some(keyword => this.fuzzyMatch(query, keyword))
      );

      // Combine filtered commands with search results
      items = [...filteredCommands, ...searchResults];
    }

    this.filteredItems = items;
    this.selectedIndex = 0;
  }

  private fuzzyMatch(query: string, text: string): boolean {
    if (!text) return false;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Simple substring match
    if (textLower.includes(queryLower)) {
      return true;
    }
    
    // Fuzzy matching: check if all characters of query appear in order
    let queryIndex = 0;
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredItems.length - 1);
        this.scrollToSelected();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.scrollToSelected();
        break;
      case 'Enter':
        event.preventDefault();
        if (this.filteredItems[this.selectedIndex]) {
          this.executeItem(this.filteredItems[this.selectedIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  scrollToSelected(): void {
    setTimeout(() => {
      const selectedElement = document.querySelector('.command-item.selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  executeItem(item: PaletteItem): void {
    if (this.isCommandItem(item)) {
      item.action();
    } else if (this.isSearchResult(item)) {
      this.navigateToSearchResult(item);
    } else if (this.isRecentItem(item)) {
      this.navigateTo(item.route);
    }
    this.close();
  }

  selectItem(index: number): void {
    this.selectedIndex = index;
  }

  close(): void {
    this.keyboardShortcutService.closeCommandPalette();
  }

  private resetState(): void {
    this.searchQuery = '';
    this.filteredItems = [];
    this.selectedIndex = 0;
    this.isSearching = false;
  }

  private navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  private navigateToSearchResult(result: SearchResult): void {
    if (result.type === 'ANNONCE') {
      this.navigateTo(`/annonces/${result.id}`);
    } else if (result.type === 'DOSSIER') {
      this.navigateTo(`/dossiers/${result.id}`);
    }
  }

  private openCreateDossierDialog(): void {
    this.dialog.open(DossierCreateDialogComponent, {
      width: '600px',
      maxWidth: '95vw'
    });
  }

  getGroupedItems(): GroupedItems[] {
    const groups = new Map<string, PaletteItem[]>();
    
    this.filteredItems.forEach(item => {
      let category = 'Autres';
      
      if (this.isCommandItem(item)) {
        category = item.category;
      } else if (this.isSearchResult(item)) {
        category = item.type === 'ANNONCE' ? 'Annonces trouvées' : 'Dossiers trouvés';
      } else if (this.isRecentItem(item)) {
        category = 'Récents';
      }
      
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)?.push(item);
    });

    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items
    }));
  }

  getItemLabel(item: PaletteItem): string {
    if (this.isCommandItem(item)) {
      return item.label;
    } else if (this.isSearchResult(item)) {
      return item.title;
    } else if (this.isRecentItem(item)) {
      return item.title;
    }
    return '';
  }

  getItemDescription(item: PaletteItem): string {
    if (this.isCommandItem(item)) {
      return item.description;
    } else if (this.isSearchResult(item)) {
      return item.description || '';
    } else if (this.isRecentItem(item)) {
      return item.subtitle || '';
    }
    return '';
  }

  getItemIcon(item: PaletteItem): string {
    if (this.isCommandItem(item)) {
      return item.icon;
    } else if (this.isSearchResult(item)) {
      return item.type === 'ANNONCE' ? 'campaign' : 'folder';
    } else if (this.isRecentItem(item)) {
      return item.type === 'annonce' ? 'campaign' : 'folder';
    }
    return 'help';
  }

  getItemShortcut(item: PaletteItem): string | undefined {
    if (this.isCommandItem(item)) {
      return item.shortcut;
    }
    return undefined;
  }

  private isCommandItem(item: PaletteItem): item is CommandItem {
    return 'action' in item && typeof item.action === 'function';
  }

  private isSearchResult(item: PaletteItem): item is SearchResult {
    return 'relevanceScore' in item;
  }

  private isRecentItem(item: PaletteItem): item is RecentItem {
    return 'route' in item && 'timestamp' in item;
  }
}
