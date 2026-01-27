# Command Palette - Architecture Documentation

## Component Structure

```
CommandPaletteComponent
├── Template (command-palette.component.html)
│   ├── Overlay (.command-palette-overlay)
│   │   └── Dialog Container (.command-palette)
│   │       ├── Header (.command-header)
│   │       │   └── Search Bar (.command-search)
│   │       │       ├── Search Icon
│   │       │       ├── Input Field
│   │       │       ├── Loading Spinner (conditional)
│   │       │       └── Keyboard Hint (Ctrl+K)
│   │       ├── Results List (.command-list)
│   │       │   └── Groups (per category)
│   │       │       ├── Category Header (.command-category)
│   │       │       └── Command Items (.command-item)
│   │       │           ├── Icon
│   │       │           ├── Details (label + description)
│   │       │           └── Shortcut Badge (optional)
│   │       ├── Empty State (.command-empty)
│   │       ├── Loading State (.command-loading)
│   │       └── Footer (.command-footer)
│   │           └── Keyboard Shortcuts Hint
└── Logic (command-palette.component.ts)
    ├── State Management
    ├── Search Integration
    ├── Keyboard Navigation
    └── Command Execution
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├──► Keyboard: Ctrl+K
                   ├──► Mouse: Click overlay
                   └──► Search: Type query
                   
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              KeyboardShortcutService                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ commandPaletteVisible$ (BehaviorSubject<boolean>)    │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              CommandPaletteComponent                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Global Commands (Static)                             │  │
│  │ ├── Navigation commands                              │  │
│  │ ├── Action commands                                  │  │
│  │ └── Help commands                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Search Pipeline                                       │  │
│  │ User Input ──► Subject ──► Debounce ──► API ──► UI  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Recent Navigation                                     │  │
│  │ ├── Load from localStorage                           │  │
│  │ ├── Subscribe to updates                             │  │
│  │ └── Display when no query                            │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├──► SearchApiService ──► Backend API
                   ├──► RecentNavigationService ──► localStorage
                   └──► Router ──► Navigation
```

## Service Dependencies

```
CommandPaletteComponent
│
├── KeyboardShortcutService
│   ├── Manages global keyboard shortcuts
│   ├── Controls palette visibility
│   └── Provides command palette state observable
│
├── SearchApiService
│   ├── Connects to backend search API
│   ├── Performs autocomplete searches
│   └── Returns SearchResult[]
│
├── RecentNavigationService
│   ├── Tracks navigation history
│   ├── Persists to localStorage
│   ├── Provides recent items observable
│   └── Limits to 10 most recent items
│
├── Router (Angular)
│   ├── Performs navigation
│   └── Provides current route information
│
└── MatDialog (Angular Material)
    ├── Opens dialog components
    └── Returns dialog references
```

## State Management

### Component State

```typescript
interface ComponentState {
  // UI State
  searchQuery: string;           // Current search input
  selectedIndex: number;         // Selected item index
  isSearching: boolean;          // Loading state
  
  // Data State
  globalCommands: CommandItem[];  // Static commands
  filteredItems: PaletteItem[];   // Displayed items
  
  // Observables
  visible$: Observable<boolean>;  // Palette visibility
  searchSubject: Subject<string>; // Search debounce
  destroy$: Subject<void>;        // Cleanup
}
```

### Item Types

```typescript
type PaletteItem = CommandItem | SearchResult | RecentItem;

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

interface SearchResult {
  id: number;
  type: 'ANNONCE' | 'DOSSIER';
  title: string;
  description: string;
  relevanceScore: number;
  createdAt: string;
  updatedAt: string;
}

interface RecentItem {
  id: string;
  type: 'dossier' | 'annonce';
  title: string;
  subtitle?: string;
  route: string;
  timestamp: number;
}
```

## Event Flow

### Opening Palette

```
User presses Ctrl+K
    ↓
KeyboardShortcutService.handleKeyDown()
    ↓
KeyboardShortcutService.toggleCommandPalette()
    ↓
commandPaletteVisible$.next(true)
    ↓
CommandPaletteComponent.visible$ emits true
    ↓
Template renders overlay
    ↓
ngAfterViewInit() sets focus to input
    ↓
updateFilteredItems() shows recent + commands
```

### Searching

```
User types "dos"
    ↓
(input) event fires
    ↓
onSearchChange()
    ↓
searchSubject.next("dos")
    ↓
debounceTime(300ms)
    ↓
distinctUntilChanged()
    ↓
switchMap() cancels previous search
    ↓
SearchApiService.autocomplete("dos")
    ↓
HTTP request to /api/v1/search/autocomplete?q=dos
    ↓
Backend returns SearchResponse
    ↓
updateFilteredItems(results)
    ↓
Fuzzy filter global commands
    ↓
Combine commands + search results
    ↓
Group by category
    ↓
Template re-renders
```

### Executing Command

```
User presses Enter (or clicks)
    ↓
onKeyDown() catches Enter key
    ↓
executeItem(selectedItem)
    ↓
Check item type
    ├── CommandItem: Execute action()
    ├── SearchResult: navigateToSearchResult()
    └── RecentItem: navigateTo(route)
    ↓
close()
    ↓
KeyboardShortcutService.closeCommandPalette()
    ↓
commandPaletteVisible$.next(false)
    ↓
Template hides overlay
    ↓
resetState() clears search and selection
```

## Lifecycle Hooks

```typescript
class CommandPaletteComponent {
  constructor() {
    // 1. Initialize observables
    // 2. Inject dependencies
  }

  ngOnInit() {
    // 1. Initialize global commands
    // 2. Setup search pipeline
    // 3. Subscribe to visibility changes
  }

  ngAfterViewInit() {
    // 1. Setup focus management
    // 2. Additional subscriptions
  }

  ngOnDestroy() {
    // 1. Complete all subjects
    // 2. Clean up subscriptions
    // 3. Remove event listeners
  }
}
```

## Search Pipeline Details

### Debounce Strategy

```
User types: "d" → "do" → "dos" → "doss" → "dossier"
Time:       0ms   50ms   100ms   200ms   300ms
            ↓      ↓      ↓       ↓       ↓
Debounce:   wait   wait   wait    wait    TRIGGER
                                          ↓
                                      Search API
```

### Search Optimization

1. **Local Filtering** (Immediate)
   - Filters global commands instantly
   - Updates UI without waiting for API

2. **Backend Search** (Debounced)
   - Waits 300ms after last keystroke
   - Only triggers if query length >= 2
   - Shows loading spinner during request

3. **Result Merging**
   - Combines local and backend results
   - Groups by category
   - Maintains selection state

## Memory Management

### Subscription Handling

```typescript
// All subscriptions use takeUntil pattern
this.observable$
  .pipe(takeUntil(this.destroy$))
  .subscribe(...);

// Cleanup in ngOnDestroy
ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Storage Management

```typescript
// Recent items limited to 10
const MAX_ITEMS = 10;
const newItems = [item, ...existing].slice(0, MAX_ITEMS);

// Persisted to localStorage
localStorage.setItem('recent_navigation', JSON.stringify(items));
```

## Performance Characteristics

### Time Complexity
- Command filtering: O(n * m) where n = commands, m = query length
- Fuzzy matching: O(m * k) where m = query length, k = text length
- Grouping: O(n) where n = filtered items

### Space Complexity
- Global commands: ~10 items (constant)
- Recent items: Max 10 items (bounded)
- Search results: Variable (typically 5-20 items)
- Total memory: < 100KB

### Network Requests
- Search API: Debounced to max 1 request per 300ms
- No requests for queries < 2 characters
- Canceled on new search (switchMap)

## Error Handling

### Search API Failures

```typescript
switchMap(query => {
  return this.searchApiService.autocomplete(query)
    .pipe(
      catchError(error => {
        console.error('Search failed:', error);
        return of({ results: [], totalHits: 0 });
      })
    );
})
```

### Navigation Failures

```typescript
try {
  this.router.navigate([path]);
} catch (error) {
  console.error('Navigation failed:', error);
  this.snackBar.open('Navigation failed', 'Close');
}
```

## Accessibility Architecture

### Focus Management

```
Palette Opens
    ↓
Set focus to input field
    ↓
User navigates with keyboard
    ↓
Update aria-activedescendant
    ↓
Screen reader announces selection
    ↓
User executes command
    ↓
Palette closes
    ↓
Return focus to trigger element
```

### ARIA Tree

```html
<div role="dialog" aria-modal="true">
  <h2 id="title" class="visually-hidden">Palette de commandes</h2>
  <input 
    aria-label="Recherche"
    aria-controls="command-list"
    aria-activedescendant="command-item-0" />
  <div id="command-list" role="listbox">
    <div role="option" id="command-item-0" aria-selected="true">
      ...
    </div>
  </div>
</div>
```

## Extension Points

### Custom Commands

```typescript
// Extend globalCommands array
this.globalCommands.push(customCommand);
```

### Custom Search

```typescript
// Override initializeSearch()
private initializeSearch(): void {
  // Custom implementation
}
```

### Custom Rendering

```typescript
// Override getItemIcon(), getItemLabel(), etc.
getItemIcon(item: PaletteItem): string {
  // Custom icon logic
}
```

### Custom Categories

```typescript
// Add new categories in getGroupedItems()
if (isCustomItem(item)) {
  category = 'Custom Category';
}
```
