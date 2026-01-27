# Command Palette Component

## Overview

The Command Palette is a VSCode-inspired quick action interface that provides fast access to application features, global actions, and entity search. It can be triggered with `Ctrl+K` keyboard shortcut.

## Features

### 1. Global Actions
Quick access to common actions:
- **Create new dossier** (Ctrl+Shift+D)
- **Create new annonce** (Ctrl+Shift+A)
- **Navigate to pages** (Dashboard, Annonces, Dossiers, Tasks, Reports, Observability)
- **Show keyboard shortcuts** (?)

### 2. Fuzzy Search
Intelligent search that matches commands based on:
- Command label
- Description
- Category
- Keywords (additional search terms)

The fuzzy matching allows for:
- Substring matching: "dos" matches "**dos**sier"
- Character sequence matching: "crt" matches "**c**ré**e**r"
- Case-insensitive search

### 3. Entity Search
Real-time search integration with backend:
- Searches annonces and dossiers
- Debounced search (300ms) for optimal performance
- Shows loading state during search
- Displays relevance scores and entity types

### 4. Recent Navigation
Automatic tracking of recently visited pages:
- Last 10 visited dossiers and annonces
- Shows entity title and subtitle
- Persisted in localStorage
- Displayed when command palette opens without search query

### 5. Keyboard Navigation
Full keyboard support:
- `↑` / `↓` - Navigate through items
- `Enter` - Execute selected item
- `Escape` - Close palette
- Auto-scroll selected item into view

### 6. Categorization
Items are grouped by category:
- **Actions** - Create, update operations
- **Navigation** - Page navigation
- **Récents** - Recently visited items
- **Annonces trouvées** - Search results for annonces
- **Dossiers trouvés** - Search results for dossiers
- **Aide** - Help and documentation

## Architecture

### Components
- **CommandPaletteComponent** - Main component with overlay and search
- **RecentNavigationService** - Tracks recent page visits

### Integration Points
- **KeyboardShortcutService** - Manages keyboard shortcuts and palette visibility
- **SearchApiService** - Backend search integration
- **Router** - Navigation handling
- **MatDialog** - Dialog reference (prepared for future enhancements)

### State Management
```typescript
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

interface RecentItem {
  id: string;
  type: 'dossier' | 'annonce';
  title: string;
  subtitle?: string;
  route: string;
  timestamp: number;
}
```

## Usage

### Opening the Palette
- Press `Ctrl+K` anywhere in the application
- Palette opens with focus on search input

### Searching
- Start typing to filter commands and search entities
- Results update in real-time
- Minimum 2 characters for backend search

### Executing Commands
- Click on an item
- Press `Enter` on selected item
- Navigate with arrow keys before executing

### Recent Items
Recent items are automatically tracked when:
- User navigates to a dossier detail page
- User navigates to an annonce detail page

Track custom recent items:
```typescript
constructor(private recentNavigationService: RecentNavigationService) {}

addToRecent() {
  this.recentNavigationService.addRecentItem({
    id: '123',
    type: 'dossier',
    title: 'Client Name',
    subtitle: '+33612345678',
    route: '/dossiers/123'
  });
}
```

## Customization

### Adding New Commands

```typescript
// In initializeGlobalCommands()
this.globalCommands.push({
  id: 'my-action',
  label: 'My Custom Action',
  description: 'Description of the action',
  icon: 'favorite',
  category: 'Actions',
  keywords: ['custom', 'special'],
  shortcut: 'Ctrl+Shift+M',
  action: () => this.doCustomAction()
});
```

### Styling
The component supports dark theme automatically through `:host-context(.dark-theme)` selectors.

Custom CSS variables can be added to:
- `command-palette.component.css`

### Search Integration
Configure search behavior:
- Adjust debounce time in `initializeSearch()` (default: 300ms)
- Modify minimum query length (default: 2 characters)
- Customize search result display in template

## Accessibility

### Features
- Full ARIA labels and roles
- Keyboard navigation
- Screen reader announcements
- Focus management
- High contrast mode support
- Reduced motion support

### ARIA Attributes
- `role="dialog"` - Dialog container
- `aria-modal="true"` - Modal overlay
- `role="listbox"` - Results list
- `role="option"` - Individual items
- `aria-selected` - Selected state
- `aria-activedescendant` - Active item reference

## Performance

### Optimizations
- Debounced search (300ms)
- Lazy loading of search results
- Virtual scrolling ready (list is scrollable)
- Minimal re-renders with change detection
- Local filtering happens immediately

### Memory Management
- Component properly unsubscribes on destroy
- Recent items limited to 10 entries
- Search results cleared on close

## Testing

### Unit Tests
Run tests with:
```bash
cd frontend
npm test -- --include='**/command-palette.component.spec.ts'
```

### Manual Testing
1. Open palette with `Ctrl+K`
2. Test keyboard navigation
3. Test fuzzy search
4. Test entity search
5. Test recent items tracking
6. Test command execution

### E2E Testing
Add E2E tests in `frontend/e2e/`:
```typescript
test('command palette opens with Ctrl+K', async ({ page }) => {
  await page.goto('/dashboard');
  await page.keyboard.press('Control+k');
  await expect(page.locator('.command-palette')).toBeVisible();
});
```

## Browser Support
- Chrome/Edge: ✓ Full support
- Firefox: ✓ Full support
- Safari: ✓ Full support
- Mobile browsers: ✓ Touch-optimized

## Known Limitations
1. Search requires backend availability (gracefully degrades to command-only mode)
2. Recent items limited to 10 entries
3. No search result pagination (shows all results)

## Future Enhancements
- [ ] Custom keyboard shortcuts per user
- [ ] Command favorites/pinning
- [ ] Command usage analytics
- [ ] Multi-workspace support
- [ ] Command history
- [ ] Custom command plugins
- [ ] Voice command support
- [ ] Quick actions from search results (edit, delete, etc.)
