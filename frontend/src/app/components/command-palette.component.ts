import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { SearchApiService, SearchResult } from '../services/search-api.service';
import { RecentNavigationService, RecentItem } from '../services/recent-navigation.service';
import { ThemeService } from '../services/theme.service';
import { AiAgentService } from '../services/ai-agent.service';
import { Observable, Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil, filter } from 'rxjs';
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
  /** Score assigned during fuzzy sort (transient, not stored) */
  _score?: number;
}

type PaletteItem = CommandItem | SearchResult | RecentItem;

interface GroupedItems {
  category: string;
  items: PaletteItem[];
}

/** Result of a fuzzy match including highlight segments */
interface FuzzyResult {
  score: number;
  /** Array of [text, isMatch] tuples for highlight rendering */
  segments: Array<{ text: string; match: boolean }>;
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
  contextualCommands: CommandItem[] = [];
  filteredItems: PaletteItem[] = [];
  selectedIndex = 0;
  isSearching = false;

  /** Map of itemId → highlight segments for the current query */
  highlightMap = new Map<string, Array<{ text: string; match: boolean }>>();

  private currentRoute = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private keyboardShortcutService: KeyboardShortcutService,
    private searchApiService: SearchApiService,
    private recentNavigationService: RecentNavigationService,
    private themeService: ThemeService,
    private agentService: AiAgentService
  ) {
    this.visible$ = this.keyboardShortcutService.commandPaletteVisible$;
  }

  ngOnInit(): void {
    this.initializeGlobalCommands();
    this.initializeSearch();
    this.watchRoute();

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
          setTimeout(() => this.commandInput.nativeElement.focus(), 100);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─────────────────────────────────────────────────────────────
  // Route watcher → contextual command injection
  // ─────────────────────────────────────────────────────────────
  private watchRoute(): void {
    // Capture initial route
    this.currentRoute = this.router.url;
    this.buildContextualCommands();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: NavigationEnd) => {
      this.currentRoute = e.urlAfterRedirects || e.url;
      this.buildContextualCommands();
    });
  }

  /**
   * Builds context-sensitive commands based on the current URL.
   * These appear at the top of the palette as "Actions contextuelles".
   */
  private buildContextualCommands(): void {
    const route = this.currentRoute;
    const commands: CommandItem[] = [];

    // ── Dossier detail page ──────────────────────────────────
    const dossierMatch = route.match(/\/dossiers\/(\d+)/);
    if (dossierMatch) {
      const id = dossierMatch[1];
      commands.push(
        {
          id: 'ctx-add-note',
          label: 'Ajouter une note',
          description: 'Ajouter une note à ce dossier',
          icon: 'note_add',
          category: 'Actions contextuelles',
          keywords: ['note', 'commentaire'],
          shortcut: 'n',
          action: () => this.router.navigate(['/dossiers', id], { queryParams: { action: 'add-note' } })
        },
        {
          id: 'ctx-schedule-visit',
          label: 'Planifier une visite',
          description: 'Créer un rendez-vous de visite pour ce prospect',
          icon: 'event',
          category: 'Actions contextuelles',
          keywords: ['rdv', 'visite', 'rendez-vous'],
          action: () => this.router.navigate(['/dossiers', id], { queryParams: { action: 'schedule-visit' } })
        },
        {
          id: 'ctx-send-message',
          label: 'Envoyer un message',
          description: 'Contacter ce prospect via WhatsApp ou SMS',
          icon: 'send',
          category: 'Actions contextuelles',
          keywords: ['message', 'whatsapp', 'sms', 'envoyer'],
          action: () => this.router.navigate(['/dossiers', id], { queryParams: { action: 'send-message' } })
        },
        {
          id: 'ctx-change-status',
          label: 'Changer le statut',
          description: 'Modifier le statut du dossier',
          icon: 'sync_alt',
          category: 'Actions contextuelles',
          keywords: ['statut', 'status', 'changer'],
          action: () => this.router.navigate(['/dossiers', id], { queryParams: { action: 'change-status' } })
        }
      );
    }

    // ── Annonce detail page ──────────────────────────────────
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
          icon: 'person_add',
          category: 'Actions contextuelles',
          keywords: ['lead', 'dossier', 'nouveau'],
          action: () => this.openCreateDossierDialog()
        }
      );
    }

    // ── Dossiers list page ───────────────────────────────────
    if (route.startsWith('/dossiers') && !dossierMatch) {
      commands.push(
        {
          id: 'ctx-new-lead',
          label: 'Nouveau lead / dossier',
          description: 'Créer un nouveau prospect immédiatement',
          icon: 'person_add',
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

    // ── Dashboard ────────────────────────────────────────────
    if (route.startsWith('/dashboard')) {
      commands.push({
        id: 'ctx-customize-dashboard',
        label: 'Personnaliser le tableau de bord',
        description: 'Réorganiser les widgets par glisser-déposer',
        icon: 'dashboard_customize',
        category: 'Actions contextuelles',
        keywords: ['widget', 'dashboard', 'personnaliser'],
        action: () => this.router.navigate(['/dashboard'], { queryParams: { action: 'customize' } })
      });
    }

    // ── Calendar ─────────────────────────────────────────────
    if (route.startsWith('/calendar')) {
      commands.push({
        id: 'ctx-new-appointment',
        label: 'Nouveau rendez-vous',
        description: 'Planifier un rendez-vous directement',
        icon: 'event_available',
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
      // ── Actions ─────────────────────────────────────────────
      {
        id: 'create-dossier',
        label: 'Créer un nouveau dossier',
        description: 'Ouvrir le formulaire de création de dossier',
        icon: 'create_new_folder',
        category: 'Actions',
        keywords: ['nouveau', 'créer', 'dossier', 'lead', 'prospect'],
        shortcut: 'Ctrl+Shift+D',
        action: () => this.openCreateDossierDialog()
      },
      {
        id: 'create-annonce',
        label: 'Créer une nouvelle annonce',
        description: 'Créer une nouvelle annonce immobilière',
        icon: 'add_circle',
        category: 'Actions',
        keywords: ['nouveau', 'créer', 'annonce', 'propriété', 'bien'],
        shortcut: 'Ctrl+Shift+A',
        action: () => this.navigateTo('/annonces/new')
      },
      // ── Système ─────────────────────────────────────────────
      {
        id: 'toggle-dark-mode',
        label: 'Basculer le mode sombre',
        description: () => `Mode actuel : ${this.themeService.isDarkTheme() ? 'Sombre 🌙' : 'Clair ☀️'} — cliquez pour basculer`,
        icon: () => this.themeService.isDarkTheme() ? 'light_mode' : 'dark_mode',
        category: 'Système',
        keywords: ['dark', 'sombre', 'thème', 'mode', 'light', 'clair', 'nuit'],
        shortcut: 'Ctrl+\\',
        action: () => this.themeService.toggleTheme()
      } as unknown as CommandItem,
      // ── Navigation ──────────────────────────────────────────
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
        description: 'Liste de toutes les annonces immobilières',
        icon: 'campaign',
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
        icon: 'task',
        category: 'Navigation',
        keywords: ['todo', 'tâches', 'tasks'],
        shortcut: 'g+t',
        action: () => this.navigateTo('/tasks')
      },
      {
        id: 'nav-calendar',
        label: 'Calendrier',
        description: 'Voir le calendrier des rendez-vous',
        icon: 'calendar_today',
        category: 'Navigation',
        keywords: ['calendar', 'calendrier', 'rendez-vous', 'appointments', 'rdv'],
        shortcut: 'g+c',
        action: () => this.navigateTo('/calendar')
      },
      {
        id: 'nav-reports',
        label: 'Rapports & KPIs',
        description: 'Statistiques et tableaux de bord analytiques',
        icon: 'insights',
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
        icon: 'analytics',
        category: 'Navigation',
        keywords: ['monitoring', 'logs', 'metrics', 'système'],
        action: () => this.navigateTo('/observability')
      },
      // ── Aide ────────────────────────────────────────────────
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

    // Immediate local filtering for responsiveness
    if (!this.searchQuery || this.searchQuery.length < 2) {
      this.updateFilteredItems();
    }
  }

  private updateFilteredItems(searchResults: SearchResult[] = []): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.highlightMap.clear();

    let items: PaletteItem[] = [];

    if (!query) {
      // No query: contextual first, then recent, then global commands
      const recentItems = this.recentNavigationService.getRecentItems();
      items = [...this.contextualCommands, ...recentItems, ...this.globalCommands];
    } else {
      // Score + filter contextual commands
      const scoredContextual = this.scoreAndFilter(this.contextualCommands, query);
      // Score + filter global commands
      const scoredGlobal = this.scoreAndFilter(this.globalCommands, query);

      // Build highlight map for all matched commands
      [...scoredContextual, ...scoredGlobal].forEach(cmd => {
        const result = this.fuzzyScore(query, cmd.label);
        if (result.score > 0) {
          this.highlightMap.set(cmd.id, result.segments);
        }
      });

      items = [...scoredContextual, ...scoredGlobal, ...searchResults];

      // ── Agent mode: inject "Ask the agent" when query looks like NL ──
      const isNaturalLanguage = this.looksLikeNaturalLanguage(this.searchQuery.trim());
      const hasResults = items.length > 0;
      if (isNaturalLanguage || !hasResults) {
        const agentCommand: CommandItem = {
          id: 'ask-agent',
          label: `Demander à Atlas IA : « ${this.searchQuery.trim()} »`,
          description: 'Analyse en langage naturel — recherche, création, navigation…',
          icon: 'auto_awesome',
          category: 'Agent IA',
          keywords: [],
          action: () => {
            this.close();
            this.agentService.openPanel(this.searchQuery.trim());
          }
        };
        // Always show agent option first
        items = [agentCommand, ...items];
      }
    }

    this.filteredItems = items;
    this.selectedIndex = 0;
  }

  /**
   * Detects if the query is likely natural language rather than a command keyword.
   * Heuristics: ≥3 words, OR starts with a known agent verb, OR contains proper nouns.
   */
  private looksLikeNaturalLanguage(query: string): boolean {
    const wordCount = query.split(/\s+/).length;
    if (wordCount >= 3) return true;
    const agentVerbs = ['trouve', 'crée', 'envoie', 'cherche', 'montre', 'affiche', 'contacte', 'appelle'];
    const qLower = query.toLowerCase();
    return agentVerbs.some(v => qLower.startsWith(v));
  }

  /**
   * Scores all commands against the query and returns them sorted by relevance desc.
   * Commands scoring 0 are excluded.
   */
  private scoreAndFilter(commands: CommandItem[], query: string): CommandItem[] {
    return commands
      .map(cmd => {
        const scores = [
          this.fuzzyScore(query, cmd.label).score * 3,          // label weighted ×3
          this.fuzzyScore(query, cmd.description).score * 1.5,  // description ×1.5
          this.fuzzyScore(query, cmd.category).score,
          ...(cmd.keywords || []).map(k => this.fuzzyScore(query, k).score * 2)
        ];
        const best = Math.max(...scores);
        return { cmd, score: best };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ cmd }) => cmd);
  }

  /**
   * Returns a relevance score (0 = no match) plus highlight segments.
   * Scoring:
   *  - Exact start match  = 100
   *  - Substring match    = 70 + (proximity to start)
   *  - Fuzzy char match   = 10 + ratio of chars matched
   */
  private fuzzyScore(query: string, text: string): FuzzyResult {
    if (!text || !query) return { score: 0, segments: [{ text, match: false }] };

    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();

    // ── Exact start match ────────────────────────────────────
    if (textLower.startsWith(queryLower)) {
      return {
        score: 100,
        segments: [
          { text: text.slice(0, query.length), match: true },
          { text: text.slice(query.length), match: false }
        ]
      };
    }

    // ── Substring match ──────────────────────────────────────
    const idx = textLower.indexOf(queryLower);
    if (idx !== -1) {
      const proximity = Math.max(0, 50 - idx); // higher score if closer to start
      return {
        score: 70 + proximity,
        segments: [
          { text: text.slice(0, idx), match: false },
          { text: text.slice(idx, idx + query.length), match: true },
          { text: text.slice(idx + query.length), match: false }
        ]
      };
    }

    // ── Fuzzy char match ─────────────────────────────────────
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
    // remaining text after last match char
    if (buf) segments.push({ text: buf, match: lastMatch });
    if (qi < text.length) {
      segments.push({ text: text.slice(qi), match: false });
    }

    if (qi === queryLower.length) {
      const ratio = queryLower.length / textLower.length;
      return { score: 10 + Math.round(ratio * 30), segments };
    }

    return { score: 0, segments: [{ text, match: false }] };
  }

  /** Get highlight segments for a given command id (populated after updateFilteredItems) */
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
    this.highlightMap.clear();
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

    // Fixed category order for clarity
    const ORDER = ['Actions contextuelles', 'Récents', 'Actions', 'Système', 'Navigation', 'Aide', 'Annonces trouvées', 'Dossiers trouvés', 'Autres'];

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

    // Sort categories by predefined order
    return ORDER
      .filter(cat => groups.has(cat))
      .map(cat => ({ category: cat, items: groups.get(cat)! }));
  }

  getItemLabel(item: PaletteItem): string {
    if (this.isCommandItem(item)) return item.label;
    if (this.isSearchResult(item)) return item.title;
    if (this.isRecentItem(item)) return item.title;
    return '';
  }

  getItemDescription(item: PaletteItem): string {
    if (this.isCommandItem(item)) {
      // Support dynamic descriptions (functions)
      return typeof (item as any)._descFn === 'function'
        ? (item as any)._descFn()
        : item.description;
    }
    if (this.isSearchResult(item)) return item.description || '';
    if (this.isRecentItem(item)) return item.subtitle || '';
    return '';
  }

  getItemIcon(item: PaletteItem): string {
    if (this.isCommandItem(item)) {
      // Support dynamic icons (functions)
      return typeof (item as any)._iconFn === 'function'
        ? (item as any)._iconFn()
        : item.icon;
    }
    if (this.isSearchResult(item)) return item.type === 'ANNONCE' ? 'campaign' : 'folder';
    if (this.isRecentItem(item)) return item.type === 'annonce' ? 'campaign' : 'folder';
    return 'help';
  }

  getItemShortcut(item: PaletteItem): string | undefined {
    if (this.isCommandItem(item)) return item.shortcut;
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
