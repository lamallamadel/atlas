# Keyboard Shortcuts System

## Overview

This system provides comprehensive keyboard shortcut functionality for the application, including:

- Global keyboard shortcuts for navigation and actions
- Command palette (Ctrl+K) for quick access to all commands
- Visual shortcuts overlay (?) showing all available shortcuts
- User preferences for enabling/disabling shortcuts and hints
- Keyboard shortcut hints displayed on buttons
- List navigation (j/k keys)
- Modal escape functionality

## Architecture

### Core Components

1. **KeyboardShortcutService** (`keyboard-shortcut.service.ts`)
   - Manages all keyboard shortcuts
   - Handles key event processing
   - Persists user preferences in localStorage
   - Provides observables for UI state (command palette, shortcuts help)

2. **KeyboardShortcutsComponent** (`keyboard-shortcuts.component.*`)
   - Displays the shortcuts help overlay (triggered by `?` key)
   - Shows all available shortcuts organized by category
   - Allows toggling preferences

3. **CommandPaletteComponent** (`command-palette.component.*`)
   - Quick command launcher (triggered by `Ctrl+K`)
   - Fuzzy search through available commands
   - Keyboard navigation support

4. **KeyboardShortcutHintDirective** (`keyboard-shortcut-hint.directive.ts`)
   - Adds visual hint badges to buttons
   - Respects user preferences for showing hints

## Default Keyboard Shortcuts

### Navigation (with 'g' prefix)
- `g + a` - Go to Annonces
- `g + d` - Go to Dossiers
- `g + h` - Go to Dashboard (home)
- `g + t` - Go to Tasks

### Actions
- `/` - Focus search bar
- `Ctrl+K` - Open command palette
- `?` - Show keyboard shortcuts help
- `Escape` - Close modals/dialogs

### List Navigation
- `j` - Navigate to next item in list
- `k` - Navigate to previous item in list
- `Enter` - Open selected list item

## Usage

### Basic Integration

The keyboard shortcuts are automatically integrated into the app layout:

```typescript
// In app-layout.component.ts
@HostListener('window:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent): void {
  this.keyboardShortcutService.handleKeyDown(event);
}
```

### Adding Keyboard Shortcut Hints to Buttons

Use the `appKeyboardShortcutHint` directive:

```html
<button 
  appKeyboardShortcutHint="Ctrl+K"
  (click)="openCommandPalette()">
  Open Commands
</button>
```

### Adding Tooltips with Shortcuts

Use Material tooltips with keyboard hints:

```html
<button 
  mat-icon-button
  matTooltip="Raccourci: g puis a"
  matTooltipPosition="right">
  <mat-icon>campaign</mat-icon>
</button>
```

### Registering Custom Shortcuts

```typescript
constructor(private keyboardShortcutService: KeyboardShortcutService) {
  this.keyboardShortcutService.registerShortcut({
    key: 'Ctrl+N',
    description: 'Create new item',
    category: 'actions',
    action: () => this.createNewItem()
  });
}
```

### Adding Commands to Command Palette

Edit `command-palette.component.ts` and add to the `initializeCommands()` method:

```typescript
{
  id: 'custom-action',
  label: 'Custom Action',
  description: 'Description of the action',
  icon: 'icon_name',
  category: 'Actions',
  action: () => this.performAction()
}
```

## User Preferences

Users can control keyboard shortcuts through the shortcuts overlay (`?` key):

- **Enable/Disable Shortcuts**: Toggle all keyboard shortcuts on/off
- **Show/Hide Hints**: Toggle visual hint badges on buttons

Preferences are persisted in localStorage under the key `keyboard-shortcuts-preferences`.

## Accessibility

The keyboard shortcuts system is designed with accessibility in mind:

- All shortcuts work without a mouse
- Visual feedback for active elements
- Screen reader announcements for actions
- Respects `prefers-reduced-motion` for animations
- WCAG AA compliant focus indicators

## Styling

Global styles for keyboard shortcuts are in `src/styles.css`:

- `.keyboard-hint` - Visual hint badges
- `kbd` - Keyboard key styling
- Dark theme support included

## Testing

Unit tests are provided for:

- `keyboard-shortcut.service.spec.ts`
- `keyboard-shortcuts.component.spec.ts`
- `command-palette.component.spec.ts`
- `keyboard-shortcut-hint.directive.spec.ts`

Run tests with:
```bash
npm test
```

## Best Practices

1. **Sequence Shortcuts**: Use `g+x` pattern for navigation to avoid conflicts
2. **Avoid Input Field Conflicts**: The service automatically ignores shortcuts when typing in inputs
3. **Category Organization**: Group related shortcuts by category
4. **Clear Descriptions**: Use clear, actionable descriptions for shortcuts
5. **Icon Selection**: Choose intuitive Material icons for commands

## Future Enhancements

Potential improvements:

- Custom shortcut mapping by users
- Export/import shortcut configurations
- Shortcut conflict detection
- Contextual shortcuts based on current page
- Shortcut usage analytics
- Multi-language support for descriptions

## Troubleshooting

### Shortcuts Not Working

1. Check if shortcuts are enabled in preferences
2. Verify you're not focused on an input field
3. Check browser console for JavaScript errors
4. Ensure the KeyboardShortcutService is properly injected

### Command Palette Not Opening

1. Verify `Ctrl+K` is not captured by browser
2. Check if other modal is already open
3. Inspect component visibility in dev tools

### Hints Not Showing

1. Verify hints are enabled in preferences
2. Check the directive is applied correctly
3. Ensure button has `position: relative` styling
