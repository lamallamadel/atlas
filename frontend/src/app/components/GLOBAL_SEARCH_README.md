# Global Search Bar - Enhanced Implementation

## Overview

The Global Search Bar is a comprehensive search component that provides instant, fuzzy search capabilities across Annonces, Dossiers, and Contacts with rich previews and keyboard navigation.

## Features

### 1. Grouped Search Results
Results are automatically organized by type:
- **Annonces** (Properties/Listings)
- **Dossiers** (Files/Cases)
- **Contacts** (Parties Prenantes)

Each group displays:
- Group icon and count
- Dedicated styling per type
- Collapsible sections

### 2. Fuzzy Search (Frontend)
- Instant filtering as you type
- Tolerant of typos and partial matches
- Smart scoring algorithm that prioritizes:
  - Exact matches
  - Starts-with matches
  - Word boundary matches
  - Consecutive character matches

### 3. Search Text Highlighting
- Matched text is highlighted in yellow (`<mark>` tags)
- Works in both titles and descriptions
- Case-insensitive matching

### 4. Recent Searches
- Stores last 5 searches in localStorage
- Click to repeat a search
- Remove individual searches
- Persists across sessions

### 5. Hover Previews
- Rich preview panel appears on hover
- Shows key information:
  - Type badge and ID
  - Full title
  - Relevant details (dates, scores, etc.)
  - Action hint

### 6. Keyboard Navigation
| Shortcut | Action |
|----------|--------|
| `/` | Focus search input (from anywhere) |
| `↓` or `Tab` | Navigate to next result |
| `↑` or `Shift+Tab` | Navigate to previous result |
| `Enter` | Open selected result |
| `Esc` | Close dropdown and clear search |

### 7. Visual Polish
- Smooth animations (slide-down, fade-in)
- Loading spinner with message
- Empty state with helpful message
- Error state with icon
- Keyboard shortcut hints in footer
- Responsive design (mobile-friendly)
- Dark mode support

## Architecture

### Components
```
GlobalSearchBarComponent
├── Template: global-search-bar.component.html
├── Styles: global-search-bar.component.scss
└── Logic: global-search-bar.component.ts
```

### Services
1. **SearchApiService** - Backend API integration
2. **SearchHistoryService** - localStorage management for recent searches
3. **FuzzySearchService** - Frontend fuzzy matching algorithms

### Pipes
- **HighlightPipe** - Safe HTML highlighting of search terms

## Usage

### Basic Integration

```html
<!-- In your layout component -->
<app-global-search-bar></app-global-search-bar>
```

### Service Integration

```typescript
// SearchApiService is automatically used
// No additional configuration needed
```

### Styling

The component is fully self-contained with its own styles. Optional customization via CSS variables:

```scss
app-global-search-bar {
  --search-primary-color: #4CAF50;
  --search-border-radius: 10px;
  --search-max-width: 600px;
}
```

## Data Flow

1. **User Input** → Component debounces (300ms)
2. **Backend Search** → SearchApiService.autocomplete()
3. **Frontend Filter** → FuzzySearchService enhances results
4. **Grouping** → Results organized by type
5. **Display** → Rendered with highlighting

## Search Result Interface

```typescript
interface EnhancedSearchResult {
  id: number;
  type: 'annonce' | 'dossier' | 'contact';
  title: string;
  description: string;
  relevanceScore: number;
  createdAt: string;
  updatedAt: string;
  highlightedTitle?: string;      // HTML with <mark> tags
  highlightedDescription?: string; // HTML with <mark> tags
  preview?: {
    id: number;
    type: string;
    details: Array<{
      label: string;
      value: string;
    }>;
  };
}
```

## localStorage Schema

### Recent Searches
```typescript
// Key: 'globalSearchRecent'
[
  {
    query: "appartement paris",
    timestamp: 1699564800000
  },
  {
    query: "dossier dupont",
    timestamp: 1699564700000
  }
]
```

Max items: 5
Auto-cleanup: Yes (FIFO)

## Performance Optimizations

1. **Debouncing** - 300ms delay before search
2. **Fuzzy Filtering** - Client-side filtering reduces API calls
3. **Lazy Rendering** - Results rendered only when visible
4. **Virtual Scrolling** - For large result sets (via CSS overflow)
5. **Memoization** - Preview generation cached per result

## Accessibility (a11y)

- Semantic HTML (`<input>`, `<button>`, roles)
- ARIA attributes:
  - `aria-label`
  - `aria-expanded`
  - `aria-controls`
  - `aria-activedescendant`
  - `aria-selected`
- Screen reader announcements
- Keyboard-only navigation
- Focus management
- High contrast support

## Mobile Responsiveness

- Touch-friendly tap targets
- No hover previews on mobile (space constraint)
- Hidden keyboard hints on small screens
- Optimized dropdown height
- Swipe-to-dismiss (future enhancement)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Testing

### Unit Tests
```bash
ng test --include='**/global-search-bar.component.spec.ts'
```

### E2E Tests
```bash
ng e2e --spec='search.e2e-spec.ts'
```

### Manual Testing Checklist
- [ ] Search with valid query returns results
- [ ] Empty query shows recent searches
- [ ] Keyboard shortcuts work globally
- [ ] Navigation with arrow keys works
- [ ] Enter opens selected result
- [ ] Escape closes dropdown
- [ ] Hover shows preview panel
- [ ] Click on result navigates correctly
- [ ] Recent searches persist after reload
- [ ] Remove recent search works
- [ ] Text highlighting is accurate
- [ ] Fuzzy search tolerates typos
- [ ] Mobile layout is usable

## Future Enhancements

1. **Voice Search** - Web Speech API integration
2. **Search Filters** - Dropdown for type/status filtering
3. **Search Suggestions** - AI-powered query suggestions
4. **Advanced Syntax** - Support for "type:annonce city:Paris"
5. **Result Actions** - Quick actions (share, bookmark) in dropdown
6. **Search Analytics** - Track popular searches
7. **Internationalization** - Multi-language support
8. **Offline Mode** - Cache recent results for offline access

## Troubleshooting

### Results Not Showing
- Check backend API is running
- Verify SearchApiService endpoint configuration
- Check browser console for errors

### Keyboard Shortcuts Not Working
- Ensure no input field is focused when pressing `/`
- Check for conflicting browser extensions
- Verify KeyboardEvent handlers are registered

### Recent Searches Not Persisting
- Check localStorage is enabled in browser
- Verify localStorage quota not exceeded
- Check for browser privacy/incognito mode

### Highlighting Not Working
- Verify HighlightPipe is declared in module
- Check DomSanitizer is not stripping HTML
- Ensure innerHTML binding is used in template

## Related Files

- `frontend/src/app/components/global-search-bar.component.ts`
- `frontend/src/app/components/global-search-bar.component.html`
- `frontend/src/app/components/global-search-bar.component.scss`
- `frontend/src/app/components/global-search-bar.component.spec.ts`
- `frontend/src/app/services/search-api.service.ts`
- `frontend/src/app/services/search-history.service.ts`
- `frontend/src/app/services/fuzzy-search.service.ts`
- `frontend/src/app/pipes/highlight.pipe.ts`

## Support

For issues or questions, please refer to:
- Project documentation
- Component source code comments
- Unit test examples
