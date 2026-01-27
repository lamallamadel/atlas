# Command Palette - Keyboard Shortcuts Quick Reference

## Opening & Closing

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open/toggle command palette |
| `Escape` | Close command palette |

## Navigation Within Palette

| Shortcut | Action |
|----------|--------|
| `↑` | Navigate to previous item |
| `↓` | Navigate to next item |
| `Enter` | Execute selected item |
| `Escape` | Close without executing |

## Global Actions (from Command Palette)

### Creation Actions
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+D` | Create new dossier |
| `Ctrl+Shift+A` | Create new annonce |

### Navigation Actions (Sequential)
| Shortcut | Action |
|----------|--------|
| `g` then `h` | Go to dashboard (home) |
| `g` then `a` | Go to annonces |
| `g` then `d` | Go to dossiers |
| `g` then `t` | Go to tasks |

### Other Actions
| Shortcut | Action |
|----------|--------|
| `/` | Focus global search |
| `?` | Show keyboard shortcuts help |

## Usage Tips

### Sequential Shortcuts
Sequential shortcuts require pressing keys in order within 1 second:
```
Press 'g' → Release → Press 'h' → Dashboard
```

### Command Palette Workflow
```
1. Press Ctrl+K           → Opens palette
2. Type "créer"           → Filters commands
3. Press ↓                → Select command
4. Press Enter            → Execute command
```

### Search Workflow
```
1. Press Ctrl+K           → Opens palette
2. Type "Dossier #123"    → Searches entities
3. Wait 300ms             → Results appear
4. Press ↓                → Navigate results
5. Press Enter            → Open selected entity
```

### Recent Items
```
1. Press Ctrl+K           → Opens palette
2. Don't type anything    → Recent items shown
3. Press ↓                → Navigate recent items
4. Press Enter            → Open recent item
```

## Context-Specific Shortcuts

### Global (Available Everywhere)
- `Ctrl+K` - Command palette
- `?` - Keyboard shortcuts help
- `Escape` - Close modals
- `/` - Focus search

### Navigation (Sequential)
- `g+h` - Dashboard
- `g+a` - Annonces
- `g+d` - Dossiers
- `g+t` - Tasks

### Actions (With Modifiers)
- `Ctrl+Shift+D` - New dossier
- `Ctrl+Shift+A` - New annonce

## Accessibility Shortcuts

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate between interactive elements |
| `Shift+Tab` | Navigate backwards |
| `Space` | Activate buttons/links |
| `Enter` | Submit forms/execute actions |

## Browser Shortcuts (Don't Conflict)

The following browser shortcuts still work:
- `Ctrl+T` - New tab
- `Ctrl+W` - Close tab
- `Ctrl+L` - Focus address bar
- `Ctrl+R` - Reload page
- `F5` - Reload page
- `F12` - DevTools

## Search Syntax

### Fuzzy Search Examples
| Query | Matches |
|-------|---------|
| `dos` | **Dos**sier, **Dos**siers |
| `crt` | **C**ée**r**, **Cr**éa**t**ion |
| `ann` | **Ann**once, **Ann**onces |
| `rap` | **Rap**ports |

### Entity Search
- Minimum 2 characters required
- Searches title, description
- Case-insensitive
- Automatic debouncing

### Category Search
Type category name to filter:
- `navigation` - Shows navigation commands
- `actions` - Shows action commands
- `aide` - Shows help commands

## Advanced Usage

### Command Chaining
Execute multiple commands quickly:
```
Ctrl+K → Type "créer dossier" → Enter → Fill form → Save
Ctrl+K → Type "annonces" → Enter → Browse listings
```

### Quick Navigation
Navigate to recently viewed items:
```
Ctrl+K → (don't type) → ↓ → Enter
```

### Search and Open
Search and open entity in one flow:
```
Ctrl+K → Type "Client name" → ↓ → Enter
```

## Keyboard Shortcuts Configuration

Currently, shortcuts are hardcoded. Future versions may support:
- Custom keyboard shortcuts
- User-defined sequences
- Shortcut profiles
- Import/export shortcuts

## Troubleshooting

### Shortcut Not Working?

1. **Check if input field is focused**
   - Most shortcuts don't work in input fields
   - Exception: `Escape` always works

2. **Check browser extensions**
   - Extensions may override shortcuts
   - Try in incognito mode

3. **Check OS shortcuts**
   - Some OS shortcuts take priority
   - Example: Windows key shortcuts

4. **Check keyboard layout**
   - Non-QWERTY layouts may have issues
   - Use command palette for non-keyboard access

### Command Palette Not Opening?

1. Try `Ctrl+K` again
2. Check if another modal is open (close with `Escape`)
3. Refresh the page (`F5`)
4. Check browser console for errors

## Platform-Specific Notes

### Windows/Linux
- Use `Ctrl` key for shortcuts
- Sequential shortcuts work as described

### macOS
- Replace `Ctrl` with `Cmd` (⌘)
- Example: `Cmd+K` opens palette
- Sequential shortcuts work the same

### Mobile/Tablet
- No keyboard shortcuts available
- Use touch interface instead
- Command palette opens via toolbar button (future)

## Printing This Reference

To print this guide:
1. Open in browser
2. Press `Ctrl+P` (or `Cmd+P` on Mac)
3. Select "Save as PDF"
4. Print the PDF

## Related Documentation

- Main Documentation: `COMMAND_PALETTE_README.md`
- Usage Examples: `COMMAND_PALETTE_USAGE_EXAMPLES.md`
- Architecture: `COMMAND_PALETTE_ARCHITECTURE.md`
- Keyboard Shortcuts Component: `keyboard-shortcuts.component.ts`
