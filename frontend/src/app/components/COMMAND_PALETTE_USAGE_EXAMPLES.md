# Command Palette - Usage Examples

## Basic Usage

### Opening the Command Palette

```typescript
// Method 1: Keyboard shortcut (recommended)
// User presses: Ctrl+K

// Method 2: Programmatically
constructor(private keyboardShortcutService: KeyboardShortcutService) {}

openCommandPalette() {
  this.keyboardShortcutService.toggleCommandPalette();
}
```

### Closing the Command Palette

```typescript
// Method 1: Keyboard shortcuts
// - Press Escape
// - Press Ctrl+K again (toggle)

// Method 2: Programmatically
closeCommandPalette() {
  this.keyboardShortcutService.closeCommandPalette();
}
```

## Adding Custom Commands

### Example 1: Simple Navigation Command

```typescript
// In CommandPaletteComponent.initializeGlobalCommands()
{
  id: 'nav-settings',
  label: 'Paramètres',
  description: 'Ouvrir la page des paramètres',
  icon: 'settings',
  category: 'Navigation',
  keywords: ['config', 'options', 'préférences'],
  action: () => this.navigateTo('/settings')
}
```

### Example 2: Command with Dialog

```typescript
{
  id: 'export-data',
  label: 'Exporter les données',
  description: 'Exporter les données en CSV',
  icon: 'download',
  category: 'Actions',
  shortcut: 'Ctrl+Shift+E',
  action: () => this.openExportDialog()
}

private openExportDialog(): void {
  this.dialog.open(ExportDialogComponent, {
    width: '600px'
  });
}
```

### Example 3: Command with Confirmation

```typescript
{
  id: 'clear-cache',
  label: 'Vider le cache',
  description: 'Supprimer toutes les données en cache',
  icon: 'delete_sweep',
  category: 'Actions',
  keywords: ['nettoyer', 'clear', 'purge'],
  action: () => this.confirmClearCache()
}

private confirmClearCache(): void {
  const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
    data: {
      title: 'Vider le cache',
      message: 'Êtes-vous sûr de vouloir supprimer toutes les données en cache ?'
    }
  });

  dialogRef.afterClosed().subscribe(confirmed => {
    if (confirmed) {
      this.clearCache();
    }
  });
}
```

## Tracking Recent Navigation

### Example 1: Track Dossier Visit

```typescript
// In DossierDetailComponent
constructor(private recentNavigationService: RecentNavigationService) {}

ngOnInit() {
  this.loadDossier();
}

private loadDossier() {
  this.dossierApiService.getById(id).subscribe(dossier => {
    this.dossier = dossier;
    
    // Add to recent navigation
    this.recentNavigationService.addRecentItem({
      id: String(dossier.id),
      type: 'dossier',
      title: dossier.leadName || `Dossier #${dossier.id}`,
      subtitle: dossier.leadPhone || undefined,
      route: `/dossiers/${dossier.id}`
    });
  });
}
```

### Example 2: Track Custom Entity

```typescript
// Track a task visit
trackTaskVisit(task: Task) {
  this.recentNavigationService.addRecentItem({
    id: String(task.id),
    type: 'dossier', // Use existing type or extend interface
    title: task.title,
    subtitle: task.status,
    route: `/tasks/${task.id}`
  });
}
```

### Example 3: Clear Recent Items

```typescript
// Clear all recent navigation history
clearRecentHistory() {
  this.recentNavigationService.clearRecentItems();
}
```

## Search Integration

### Example 1: Custom Search Handler

```typescript
// Override search behavior for specific entity types
private initializeSearch(): void {
  this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(query => {
      if (!query || query.length < 2) {
        return of(null);
      }
      
      // Custom search logic
      return this.customSearchService.search(query);
    }),
    takeUntil(this.destroy$)
  ).subscribe(results => {
    this.updateFilteredItems(results);
  });
}
```

### Example 2: Filter Search Results

```typescript
// Filter search results by type
private updateFilteredItems(searchResults: SearchResult[] = []): void {
  const query = this.searchQuery.toLowerCase().trim();
  
  let items: PaletteItem[] = [];

  if (query) {
    // Filter commands
    const filteredCommands = this.globalCommands.filter(cmd =>
      this.fuzzyMatch(query, cmd.label)
    );

    // Filter search results by type
    const filteredResults = searchResults.filter(result =>
      result.type === 'ANNONCE' || result.type === 'DOSSIER'
    );

    items = [...filteredCommands, ...filteredResults];
  } else {
    items = [...this.getRecentItems(), ...this.globalCommands];
  }

  this.filteredItems = items;
  this.selectedIndex = 0;
}
```

## Advanced Features

### Example 1: Command with Parameters

```typescript
{
  id: 'filter-by-status',
  label: 'Filtrer par statut',
  description: 'Ouvrir le filtre de statut',
  icon: 'filter_list',
  category: 'Actions',
  action: () => this.openStatusFilter()
}

private openStatusFilter(): void {
  // Open bottom sheet with status options
  this.bottomSheet.open(MobileFilterSheetComponent, {
    data: {
      filterType: 'status',
      options: Object.values(DossierStatus)
    }
  });
}
```

### Example 2: Context-Aware Commands

```typescript
// Add commands based on current route
private addContextualCommands(): void {
  const currentRoute = this.router.url;
  
  if (currentRoute.includes('/dossiers/')) {
    this.globalCommands.push({
      id: 'add-note',
      label: 'Ajouter une note',
      description: 'Ajouter une note à ce dossier',
      icon: 'note_add',
      category: 'Actions',
      shortcut: 'Ctrl+N',
      action: () => this.addNote()
    });
  }
}
```

### Example 3: Command with Analytics

```typescript
{
  id: 'generate-report',
  label: 'Générer un rapport',
  description: 'Créer un nouveau rapport',
  icon: 'assessment',
  category: 'Actions',
  action: () => {
    this.trackCommandUsage('generate-report');
    this.generateReport();
  }
}

private trackCommandUsage(commandId: string): void {
  // Track command usage in analytics
  console.log(`Command executed: ${commandId}`);
}
```

## Keyboard Navigation Examples

### Example 1: Custom Key Bindings

```typescript
// Add custom keyboard shortcuts to commands
this.registerShortcut({
  key: 'Ctrl+Shift+N',
  description: 'Nouvelle note',
  category: 'actions',
  action: () => this.createNote()
});
```

### Example 2: Sequential Key Bindings

```typescript
// Gmail-style sequential shortcuts (g+i = go to inbox)
this.registerShortcut({
  key: 'g+r',
  description: 'Aller aux rapports',
  category: 'navigation',
  sequence: true,
  action: () => this.navigateTo('/reports')
});
```

## Styling Examples

### Example 1: Custom Command Icons

```typescript
// Use Material Icons
icon: 'dashboard'    // Standard icon
icon: 'campaign'     // Annonce icon
icon: 'folder'       // Dossier icon
icon: 'task'         // Task icon
icon: 'person'       // Contact icon
```

### Example 2: Custom Categories

```typescript
// Define custom categories
category: 'Navigation'  // Blue theme
category: 'Actions'     // Green theme
category: 'Aide'        // Gray theme
category: 'Récents'     // Purple theme
```

## Testing Examples

### Example 1: Unit Test for Command Execution

```typescript
it('should execute create dossier command', () => {
  const createCmd = component.globalCommands.find(c => c.id === 'create-dossier');
  spyOn(component['dialog'], 'open');
  
  createCmd?.action();
  
  expect(component['dialog'].open).toHaveBeenCalledWith(
    DossierCreateDialogComponent,
    jasmine.any(Object)
  );
});
```

### Example 2: Unit Test for Fuzzy Search

```typescript
it('should fuzzy match search queries', () => {
  expect(component['fuzzyMatch']('crt', 'créer')).toBeTruthy();
  expect(component['fuzzyMatch']('dos', 'dossier')).toBeTruthy();
  expect(component['fuzzyMatch']('xyz', 'créer')).toBeFalsy();
});
```

### Example 3: E2E Test

```typescript
// In frontend/e2e/command-palette.spec.ts
import { test, expect } from '@playwright/test';

test('command palette opens and executes command', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Open command palette
  await page.keyboard.press('Control+k');
  await expect(page.locator('.command-palette')).toBeVisible();
  
  // Search for command
  await page.fill('.command-input', 'créer dossier');
  await expect(page.locator('.command-item').first()).toBeVisible();
  
  // Execute command
  await page.keyboard.press('Enter');
  await expect(page.locator('app-dossier-create-dialog')).toBeVisible();
});
```

## Integration Examples

### Example 1: Integrate with Global Search Bar

```typescript
// In GlobalSearchBarComponent
handleSearchFocus() {
  // Open command palette instead of inline search
  this.keyboardShortcutService.toggleCommandPalette();
}
```

### Example 2: Integrate with Toolbar Button

```typescript
// In app-layout.component.html
<button
  mat-icon-button
  (click)="openCommandPalette()"
  matTooltip="Palette de commandes (Ctrl+K)"
  aria-label="Ouvrir la palette de commandes">
  <mat-icon>search</mat-icon>
</button>

// In app-layout.component.ts
openCommandPalette() {
  this.keyboardShortcutService.toggleCommandPalette();
}
```

### Example 3: Integrate with Mobile Bottom Sheet

```typescript
// Show command palette as bottom sheet on mobile
openCommandPaletteMobile() {
  this.bottomSheet.open(CommandPaletteComponent, {
    panelClass: 'command-palette-bottom-sheet'
  });
}
```

## Performance Optimization Examples

### Example 1: Lazy Load Commands

```typescript
// Load commands on demand
private async loadAdminCommands() {
  if (this.isAdmin) {
    const adminCommands = await import('./admin-commands');
    this.globalCommands.push(...adminCommands.default);
  }
}
```

### Example 2: Virtual Scrolling for Large Result Sets

```typescript
// Use CDK Virtual Scroll for many results
<cdk-virtual-scroll-viewport itemSize="50" class="command-list">
  <div *cdkVirtualFor="let item of filteredItems" class="command-item">
    {{ getItemLabel(item) }}
  </div>
</cdk-virtual-scroll-viewport>
```

### Example 3: Debounce Configuration

```typescript
// Adjust debounce based on network speed
private getDebounceTime(): number {
  const connection = (navigator as any).connection;
  if (connection && connection.effectiveType === 'slow-2g') {
    return 500; // Slower network = longer debounce
  }
  return 300; // Default debounce
}
```
