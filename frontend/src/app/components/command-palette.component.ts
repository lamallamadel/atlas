import { Component, OnInit, ElementRef, OnDestroy, viewChild, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { SearchApiService, SearchResult } from '../services/search-api.service';
import { RecentNavigationService, RecentItem } from '../services/recent-navigation.service';
import { ThemeService } from '../services/theme.service';
import { AiAgentService } from '../services/ai-agent.service';
import { Observable, Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil, filter } from 'rxjs';
import { DossierCreateDialogComponent } from '../pages/dossiers/dossier-create-dialog.component';
import { FocusTrapDirective } from '../directives/focus-trap.directive';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import { 
  DsSkeletonComponent, 
  DsIconComponent, 
  DsDialogService
} from '../design-system';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void;
  category: string;
  keywords?: string[];
  shortcut?: string;
  _score?: number;
}

type PaletteItem = CommandItem | SearchResult | RecentItem;

interface GroupedItems {
  category: string;
  items: PaletteItem[];
}

interface FuzzyResult {
  score: number;
  segments: Array<{ text: string; match: boolean }>;
}

@Component({
    selector: 'app-command-palette',
    standalone: true,
    templateUrl: './command-palette.component.html',
    styleUrls: ['./command-palette.component.css'],
    imports: [
      CommonModule,
      FocusTrapDirective, 
      FormsModule, 
      DsSkeletonComponent, 
      DsIconComponent, 
      AsyncPipe
    ]
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  readonly commandInput = viewChild<ElementRef>('commandInput');

  private router = inject(Router);
  private dsDialogService = inject(DsDialogService);
  private keyboardShortcutService = inject(KeyboardShortcutService);
  private searchApiService = inject(SearchApiService);
  private recentNavigationService = inject(RecentNavigationService);
  private themeService = inject(ThemeService);
  private agentService = inject(AiAgentService);

  visible$: Observable<boolean>;
  searchQuery = '';
  globalCommands: CommandItem[] = [];
  contextualCommands: CommandItem[] = [];
  filteredItems: PaletteItem[] = [];
  selectedIndex = 0;
  isSearching = false;

  highlightMap = new Map<string, Array<{ text: string; match: boolean }>>();

  private currentRoute = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.visible$ = this.keyboardShortcutService.commandPaletteVisible$;
  }

  ngOnInit(): void {
    this.initializeGlobalCommands();
    this.initializeSearch();
    this.watchRoute();

    this.visible$.pipe(takeUntil(this.destroy$)).subscribe(visible => {
      const input = this.commandInput();
      if (visible && input) {
        setTimeout(() => {
          input.nativeElement.focus();
          this.updateFilteredItems();
        }, 100);
      } else if (!visible) {
        this.resetState();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private watchRoute(): void {
    this.currentRoute = this.router.url;
    this.buildContextualCommands();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e) => {
      this.currentRoute = (e as NavigationEnd).url;
      this.buildContextualCommands();
    });
  }

  private buildContextualCommands(): void {
    const route = this.currentRoute;
    const commands: CommandItem[] = [];

    const dossierMatch = route.match(/\/dossiers\/(\d+)/);
    if (dossierMatch) {
      const id = dossierMatch[1];
      commands.push(
        {
          id: 'ctx-add-note',
          label: 'Ajouter une note',
          description: 'Ajouter une note à ce dossier',
          icon: 'edit',
          category: 'Actions contextuelles',
          keywords: ['note', 'commentaire'],
          shortcut: 'n',
          action: () => this.router.navigate(['/dossiers', id], { queryParams: { action: 'add-note' } })
        },
        {
          id: 'ctx-schedule-visit',
          label: 'Planifier une visite',
          description: 'Créer un rendez-vous de visite pour ce prospect',
          icon: 'calendar',
          category: 'Actions contextuelles',
          keywords: ['rdv', 'visite', 'rendez-vous'],
          action: () => this.router.navigate(['/dossiers', id], { queryParams: { action: 'schedule-visit' } })
        },
        {
          id: 'ctx-send-message',
          label: 'Envoyer un message',
          description: 'Contacter ce prospect via WhatsApp ou SMS',
          icon: 'upload',
          category: 'Actions contextuelles',
          keywords: ['message', 'whatsapp', 'sms', 'envoyer'],
          action: () => this.router.navigate(['/dossiers', id], { queryParams: { action: 'send-message' } })
        },
        {
          id: 'ctx-change-status',
          label: 'Changer le statut',
          description: 'Modifier le statut du dossier',
          icon: 'refresh',
          category: 'Actions contextuelles',
          keywords: ['statut', 'status', 'changer'],
          action: () => this.router.navigate(['/dossiers', id], { queryParams: { action: 'change-status' } })
        }
      );
    }

    const annonceMatch = route.match(/\/annonces\/(\d+)/);
    if (annonceMatch) {
      const id = annonceMatch[1];
      commands.push(
        {
          id: 'ctx-edit-annonce',
          label: 'Modifier cette annonce',
          description: 'Éditer les détails de l\'annonce',
          icon: 'edit',
          category: 'Actions contextuelles',
          keywords: ['éditer', 'modifier', 'annonce'],
          action: () => this.router.navigate(['/annonces', id, 'edit'])
        },
        {
          id: 'ctx-create-dossier-for-annonce',
          label: 'Créer un lead pour cette annonce',
          description: 'Ouvrir un nouveau dossier lié à cette annonce',
          icon: 'plus',
          category: 'Actions contextuelles',
          keywords: ['lead', 'dossier', 'nouveau'],
          action: () => this.openCreateDossierDialog()
        }
      );
    }

    if (route.startsWith('/dossiers') && !dossierMatch) {
      commands.push(
        {
          id: 'ctx-new-lead',
          label: 'Nouveau lead / dossier',
          description: 'Créer un nouveau prospect immédiatement',
          icon: 'plus',
          category: 'Actions contextuelles',
          keywords: ['lead', 'nouveau', 'créer', 'prospect'],
          shortcut: 'c',
          action: () => this.openCreateDossierDialog()
        },
        {
          id: 'ctx-export-leads',
          label: 'Exporter les leads',
          description: 'Exporter la liste en CSV ou PDF',
          icon: 'download',
          category: 'Actions contextuelles',
          keywords: ['export', 'csv', 'pdf', 'télécharger'],
          action: () => this.router.navigate(['/dossiers'], { queryParams: { action: 'export' } })
        }
      );
    }

    if (route.startsWith('/dashboard')) {
      commands.push({
        id: 'ctx-customize-dashboard',
        label: 'Personnaliser le tableau de bord',
        description: 'Réorganiser les widgets par glisser-déposer',
        icon: 'maximize',
        category: 'Actions contextuelles',
        keywords: ['widget', 'dashboard', 'personnaliser'],
        action: () => this.router.navigate(['/dashboard'], { queryParams: { action: 'customize' } })
      });
    }

    if (route.startsWith('/calendar')) {
      commands.push({
        id: 'ctx-new-appointment',
        label: 'Nouveau rendez-vous',
        description: 'Planifier un rendez-vous directement',
        icon: 'calendar',
        category: 'Actions contextuelles',
        keywords: ['rdv', 'rendez-vous', 'agenda', 'nouveau'],
        shortcut: 'r',
        action: () => this.router.navigate(['/calendar'], { queryParams: { action: 'new-appointment' } })
      });
    }

    this.contextualCommands = commands;
  }

  private initializeGlobalCommands(): void {
    this.globalCommands = [
      {
        id: 'create-dossier',
        label: 'Créer un nouveau dossier',
        description: 'Ouvrir le formulaire de création de dossier',
        icon: 'plus',
        category: 'Actions',
        keywords: ['nouveau', 'créer', 'dossier', 'lead', 'prospect'],
        shortcut: 'Ctrl+Shift+D',
        action: () => this.openCreateDossierDialog()
      },
      {
        id: 'create-annonce',
        label: 'Créer une nouvelle annonce',
        description: 'Créer une nouvelle annonce immobilière',
        icon: 'plus',
        category: 'Actions',
        keywords: ['nouveau', 'créer', 'annonce', 'propriété', 'bien'],
        shortcut: 'Ctrl+Shift+A',
        action: () => this.navigateTo('/annonces/new')
      },
      {
        id: 'toggle-dark-mode',
        label: 'Basculer le mode sombre',
        description: () => `Mode actuel : ${this.themeService.isDarkTheme() ? 'Sombre 🌙' : 'Clair ☀️'}`,
        icon: () => this.themeService.isDarkTheme() ? 'sun' : 'moon',
        category: 'Système',
        keywords: ['dark', 'sombre', 'thème', 'mode', 'light', 'clair', 'nuit'],
        shortcut: 'Ctrl+\\',
        action: () => this.themeService.toggleTheme()
      } as unknown as CommandItem,
      {
        id: 'nav-dashboard',
        label: 'Tableau de bord',
        description: 'Voir le tableau de bord principal',
        icon: 'chart',
        category: 'Navigation',
        keywords: ['accueil', 'home', 'dashboard'],
        shortcut: 'g+h',
        action: () => this.navigateTo('/dashboard')
      },
      {
        id: 'nav-annonces',
        label: 'Annonces',
        description: 'Liste de toutes les annonces immobilières',
        icon: 'megaphone',
        category: 'Navigation',
        keywords: ['propriété', 'bien', 'annonce', 'liste'],
        shortcut: 'g+a',
        action: () => this.navigateTo('/annonces')
      },
      {
        id: 'nav-dossiers',
        label: 'Dossiers / Leads',
        description: 'Liste de tous les dossiers et prospects',
        icon: 'folder',
        category: 'Navigation',
        keywords: ['leads', 'clients', 'dossiers', 'prospects'],
        shortcut: 'g+d',
        action: () => this.navigateTo('/dossiers')
      },
      {
        id: 'nav-tasks',
        label: 'Tâches',
        description: 'Voir toutes les tâches',
        icon: 'tasks',
        category: 'Navigation',
        keywords: ['todo', 'tâches', 'tasks'],
        shortcut: 'g+t',
        action: () => this.navigateTo('/tasks')
      },
      {
        id: 'nav-calendar',
        label: 'Calendrier',
        description: 'Voir le calendrier des rendez-vous',
        icon: 'calendar',
        category: 'Navigation',
        keywords: ['calendar', 'calendrier', 'rendez-vous', 'appointments', 'rdv'],
        shortcut: 'g+c',
        action: () => this.navigateTo('/calendar')
      },
      {
        id: 'nav-reports',
        label: 'Rapports & KPIs',
        description: 'Statistiques et tableaux de bord analytiques',
        icon: 'chart',
        category: 'Navigation',
        keywords: ['statistiques', 'analytics', 'rapports', 'kpi', 'chiffres'],
        shortcut: 'g+r',
        action: () => this.navigateTo('/reports')
      },
      {
        id: 'nav-search',
        label: 'Recherche globale',
        description: 'Rechercher des annonces, dossiers, contacts',
        icon: 'search',
        category: 'Navigation',
        keywords: ['chercher', 'trouver', 'search', 'recherche'],
        shortcut: '/',
        action: () => this.navigateTo('/search')
      },
      {
        id: 'nav-observability',
        label: 'Observabilité système',
        description: 'Dashboard de monitoring et métriques',
        icon: 'refresh',
        category: 'Navigation',
        keywords: ['monitoring', 'logs', 'metrics', 'système'],
        action: () => this.navigateTo('/observability')
      },
      {
        id: 'show-shortcuts',
        label: 'Raccourcis clavier',
        description: 'Voir tous les raccourcis disponibles',
        icon: 'keyboard',
        category: 'Aide',
        keywords: ['aide', 'help', 'shortcuts', 'raccourcis'],
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
        if (!query || query.length < 2) return of(null);
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
    if (!this.searchQuery || this.searchQuery.length < 2) this.updateFilteredItems();
  }

  private updateFilteredItems(searchResults: SearchResult[] = []): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.highlightMap.clear();

    let items: PaletteItem[] = [];

    if (!query) {
      const recentItems = this.recentNavigationService.getRecentItems();
      items = [...this.contextualCommands, ...recentItems, ...this.globalCommands];
    } else {
      const scoredContextual = this.scoreAndFilter(this.contextualCommands, query);
      const scoredGlobal = this.scoreAndFilter(this.globalCommands, query);

      [...scoredContextual, ...scoredGlobal].forEach(cmd => {
        const result = this.fuzzyScore(query, cmd.label);
        if (result.score > 0) this.highlightMap.set(cmd.id, result.segments);
      });

      items = [...scoredContextual, ...scoredGlobal, ...searchResults];

      if (this.looksLikeNaturalLanguage(this.searchQuery.trim()) || items.length === 0) {
        items = [{
          id: 'ask-agent',
          label: `Demander à Atlas IA : « ${this.searchQuery.trim()} »`,
          description: 'Analyse en langage naturel — recherche, création, navigation…',
          icon: 'refresh',
          category: 'Agent IA',
          keywords: [],
          action: () => {
            this.close();
            this.agentService.openPanel(this.searchQuery.trim());
          }
        }, ...items];
      }
    }

    this.filteredItems = items;
    this.selectedIndex = 0;
  }

  private looksLikeNaturalLanguage(query: string): boolean {
    const wordCount = query.split(/\s+/).length;
    if (wordCount >= 3) return true;
    const agentVerbs = ['trouve', 'crée', 'envoie', 'cherche', 'montre', 'affiche', 'contacte', 'appelle'];
    return agentVerbs.some(v => query.toLowerCase().startsWith(v));
  }

  private scoreAndFilter(commands: CommandItem[], query: string): CommandItem[] {
    return commands
      .map(cmd => {
        const scores = [
          this.fuzzyScore(query, cmd.label).score * 3,
          this.fuzzyScore(query, cmd.description).score * 1.5,
          this.fuzzyScore(query, cmd.category).score,
          ...(cmd.keywords || []).map(k => this.fuzzyScore(query, k).score * 2)
        ];
        return { cmd, score: Math.max(...scores) };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd);
  }

  private fuzzyScore(query: string, text: string | ((...args: unknown[]) => unknown)): FuzzyResult {
    if (typeof text !== 'string') text = '';
    if (!text || !query) return { score: 0, segments: [{ text: String(text), match: false }] };

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    if (textLower.startsWith(queryLower)) {
      return { score: 100, segments: [{ text: text.slice(0, query.length), match: true }, { text: text.slice(query.length), match: false }] };
    }

    const idx = textLower.indexOf(queryLower);
    if (idx !== -1) {
      return { score: 70 + Math.max(0, 50 - idx), segments: [{ text: text.slice(0, idx), match: false }, { text: text.slice(idx, idx + query.length), match: true }, { text: text.slice(idx + query.length), match: false }] };
    }

    let qi = 0;
    const segments: Array<{ text: string; match: boolean }> = [];
    let buf = '';
    let lastMatch = false;

    for (let i = 0; i < text.length && qi < queryLower.length; i++) {
      const isMatch = text[i].toLowerCase() === queryLower[qi];
      if (isMatch !== lastMatch) {
        if (buf) segments.push({ text: buf, match: lastMatch });
        buf = '';
        lastMatch = isMatch;
      }
      buf += text[i];
      if (isMatch) qi++;
    }
    if (buf) segments.push({ text: buf, match: lastMatch });
    if (qi < text.length) segments.push({ text: text.slice(qi), match: false });

    if (qi === queryLower.length) {
      return { score: 10 + Math.round((queryLower.length / textLower.length) * 30), segments };
    }

    return { score: 0, segments: [{ text, match: false }] };
  }

  getHighlightSegments(item: PaletteItem): Array<{ text: string; match: boolean }> | null {
    if (!this.searchQuery || !this.isCommandItem(item)) return null;
    return this.highlightMap.get(item.id) || null;
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
        if (this.filteredItems[this.selectedIndex]) this.executeItem(this.filteredItems[this.selectedIndex]);
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
      if (selectedElement) selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 0);
  }

  executeItem(item: PaletteItem): void {
    if (this.isCommandItem(item)) item.action();
    else if (this.isSearchResult(item)) this.navigateToSearchResult(item);
    else if (this.isRecentItem(item)) this.navigateTo(item.route);
    this.close();
  }

  selectItem(index: number): void { this.selectedIndex = index; }
  close(): void { this.keyboardShortcutService.closeCommandPalette(); }

  private resetState(): void {
    this.searchQuery = '';
    this.filteredItems = [];
    this.selectedIndex = 0;
    this.isSearching = false;
    this.highlightMap.clear();
  }

  private navigateTo(path: string): void { this.router.navigate([path]); }

  private navigateToSearchResult(result: SearchResult): void {
    if (result.type === 'ANNONCE') this.navigateTo(`/annonces/${result.id}`);
    else if (result.type === 'DOSSIER') this.navigateTo(`/dossiers/${result.id}`);
  }

  private openCreateDossierDialog(): void {
    this.dsDialogService.open(DossierCreateDialogComponent, { width: '600px' });
  }

  getGroupedItems(): GroupedItems[] {
    const groups = new Map<string, PaletteItem[]>();
    const ORDER = ['Actions contextuelles', 'Récents', 'Actions', 'Système', 'Navigation', 'Aide', 'Annonces trouvées', 'Dossiers trouvés', 'Autres'];

    this.filteredItems.forEach(item => {
      let category = 'Autres';
      if (this.isCommandItem(item)) category = item.category;
      else if (this.isSearchResult(item)) category = item.type === 'ANNONCE' ? 'Annonces trouvées' : 'Dossiers trouvés';
      else if (this.isRecentItem(item)) category = 'Récents';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category)?.push(item);
    });

    return ORDER.filter(cat => groups.has(cat)).map(cat => ({ category: cat, items: groups.get(cat)! }));
  }

  getItemLabel(item: PaletteItem): string {
    if (this.isCommandItem(item)) return item.label;
    if (this.isSearchResult(item)) return item.title;
    if (this.isRecentItem(item)) return item.title;
    return '';
  }

  getItemDescription(item: PaletteItem): string {
    if (this.isCommandItem(item)) return typeof (item as any)._descFn === 'function' ? (item as any)._descFn() : item.description;
    if (this.isSearchResult(item)) return item.description || '';
    if (this.isRecentItem(item)) return item.subtitle || '';
    return '';
  }

  getItemIcon(item: PaletteItem): string {
    if (this.isCommandItem(item)) return typeof (item as any)._iconFn === 'function' ? (item as any)._iconFn() : item.icon;
    if (this.isSearchResult(item)) return item.type === 'ANNONCE' ? 'megaphone' : 'folder';
    if (this.isRecentItem(item)) return item.type === 'annonce' ? 'megaphone' : 'folder';
    return 'info';
  }

  getItemShortcut(item: PaletteItem): string | undefined {
    if (this.isCommandItem(item)) return item.shortcut;
    return undefined;
  }

  private isCommandItem(item: PaletteItem): item is CommandItem { return 'action' in item && typeof item.action === 'function'; }
  private isSearchResult(item: PaletteItem): item is SearchResult { return 'relevanceScore' in item; }
  private isRecentItem(item: PaletteItem): item is RecentItem { return 'route' in item && 'timestamp' in item; }
}
