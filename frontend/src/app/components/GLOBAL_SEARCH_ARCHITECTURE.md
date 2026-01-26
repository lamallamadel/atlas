# Global Search Bar - Architecture Diagram

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GlobalSearchBarComponent                      │
│                                                                  │
│  Properties:                                                     │
│  ├─ searchQuery: string                                         │
│  ├─ groupedResults: GroupedResults                              │
│  ├─ recentSearches: RecentSearch[]                              │
│  ├─ hoveredResult: EnhancedSearchResult                         │
│  ├─ selectedIndex: number                                       │
│  ├─ isLoading: boolean                                          │
│  └─ showDropdown: boolean                                       │
│                                                                  │
│  Methods:                                                        │
│  ├─ onSearchInput(event)                                        │
│  ├─ navigateToResult(result)                                    │
│  ├─ viewAllResults()                                            │
│  ├─ clearSearch()                                               │
│  ├─ handleKeyboardShortcut(event)                               │
│  ├─ enhanceResults(results, query)                              │
│  ├─ fuzzyFilter(results, query)                                 │
│  ├─ highlightText(text, query)                                  │
│  ├─ groupResults(results)                                       │
│  └─ generatePreview(result)                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Services Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ SearchApiService   │  │ SearchHistory      │                │
│  │                    │  │ Service            │                │
│  ├────────────────────┤  ├────────────────────┤                │
│  │ - autocomplete()   │  │ - getHistory()     │                │
│  │ - search()         │  │ - addToHistory()   │                │
│  └────────────────────┘  │ - removeFromHistory│                │
│                          │ - clearHistory()   │                │
│                          └────────────────────┘                │
│                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ FuzzySearchService │  │ Router             │                │
│  │                    │  │                    │                │
│  ├────────────────────┤  ├────────────────────┤                │
│  │ - search()         │  │ - navigate()       │                │
│  │ - fuzzyScore()     │  └────────────────────┘                │
│  │ - highlight()      │                                         │
│  │ - levenshtein()    │                                         │
│  └────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Pipes Layer                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────┐                │
│  │ HighlightPipe                              │                │
│  │                                            │                │
│  ├────────────────────────────────────────────┤                │
│  │ - transform(text, search): SafeHtml       │                │
│  │ - escapeRegex(str): string                │                │
│  └────────────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────┐
│ User Types   │
│ "paris"      │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Component.onSearchInput()            │
│ - Debounce 300ms                     │
│ - Emit to searchSubject              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ SearchApiService.autocomplete()      │
│ GET /api/v1/search/autocomplete?q=.. │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Backend Returns SearchResult[]       │
│ [                                    │
│   { id: 1, type: 'annonce', ... },  │
│   { id: 2, type: 'dossier', ... }   │
│ ]                                    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Component.enhanceResults()           │
│ - Fuzzy filter                       │
│ - Score calculation                  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Component.highlightText()            │
│ - Add <mark> tags                    │
│ - Sanitize HTML                      │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Component.groupResults()             │
│ {                                    │
│   annonces: [...],                   │
│   dossiers: [...],                   │
│   contacts: [...]                    │
│ }                                    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Component.generatePreview()          │
│ - Extract key details                │
│ - Format dates                       │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ Template Renders Results             │
│ - Grouped by type                    │
│ - Highlighted text                   │
│ - Preview on hover                   │
└──────────────────────────────────────┘
```

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       User Actions                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌────────┐          ┌────────────┐        ┌──────────┐
   │ Press  │          │ Type Query │        │ Press    │
   │ "/"    │          │ "paris"    │        │ Arrow    │
   │        │          │            │        │ Keys     │
   └───┬────┘          └─────┬──────┘        └────┬─────┘
       │                     │                    │
       ▼                     ▼                    ▼
   ┌─────────┐         ┌──────────┐        ┌──────────┐
   │ Focus   │         │ Search   │        │ Navigate │
   │ Input   │         │ Backend  │        │ Results  │
   └─────────┘         └────┬─────┘        └────┬─────┘
                            │                   │
                            ▼                   ▼
                      ┌──────────┐        ┌──────────┐
                      │ Display  │        │ Update   │
                      │ Results  │        │ Selected │
                      └────┬─────┘        └────┬─────┘
                           │                   │
                           ▼                   ▼
        ┌──────────────────┴───────────────────┴────────┐
        │                                                │
        ▼                                                ▼
   ┌────────┐                                      ┌──────────┐
   │ Hover  │                                      │ Press    │
   │ Result │                                      │ Enter    │
   └───┬────┘                                      └────┬─────┘
       │                                                │
       ▼                                                ▼
   ┌─────────┐                                    ┌──────────┐
   │ Show    │                                    │ Navigate │
   │ Preview │                                    │ to Page  │
   └─────────┘                                    └──────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    Component State                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  searchQuery: string                                        │
│  │                                                          │
│  ├─→ Empty → Show Recent Searches                          │
│  ├─→ 1 char → No search                                    │
│  └─→ 2+ chars → Trigger search                             │
│                                                             │
│  isLoading: boolean                                         │
│  │                                                          │
│  ├─→ true → Show spinner                                   │
│  └─→ false → Show results/error                            │
│                                                             │
│  showDropdown: boolean                                      │
│  │                                                          │
│  ├─→ true → Display dropdown                               │
│  └─→ false → Hide dropdown                                 │
│                                                             │
│  selectedIndex: number                                      │
│  │                                                          │
│  ├─→ -1 → No selection                                     │
│  └─→ 0+ → Highlight result at index                        │
│                                                             │
│  hoveredResult: EnhancedSearchResult | null                │
│  │                                                          │
│  ├─→ null → No preview                                     │
│  └─→ result → Show preview panel                           │
│                                                             │
│  groupedResults: GroupedResults                            │
│  │                                                          │
│  ├─→ annonces: []                                          │
│  ├─→ dossiers: []                                          │
│  └─→ contacts: []                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Template Structure

```
<div class="search-container">
  │
  ├─ <div class="search-input-wrapper">
  │   ├─ <input> Search Input
  │   ├─ <span> Search Icon
  │   └─ <button> Clear Button (if query)
  │
  └─ <div class="search-dropdown"> (if showDropdown)
      │
      ├─ <div class="loading"> (if isLoading)
      │   └─ Spinner + Text
      │
      ├─ <div class="error"> (if error)
      │   └─ Error Icon + Message
      │
      ├─ <div class="recent-searches"> (if no query & has recent)
      │   ├─ <div class="section-header">
      │   └─ <div class="recent-search-item"> (repeat)
      │       ├─ Search Icon
      │       ├─ Query Text
      │       └─ Remove Button
      │
      ├─ <div class="results"> (if hasResults)
      │   ├─ <div class="result-group"> Annonces
      │   │   ├─ <div class="group-header">
      │   │   └─ <div class="result-item"> (repeat)
      │   │       ├─ Result Icon
      │   │       ├─ Result Content
      │   │       │   ├─ Title (highlighted)
      │   │       │   └─ Description (highlighted)
      │   │       └─ Badge
      │   │
      │   ├─ <div class="result-group"> Dossiers
      │   │   └─ ... (same structure)
      │   │
      │   └─ <div class="result-group"> Contacts
      │       └─ ... (same structure)
      │
      ├─ <div class="no-results"> (if no results)
      │   ├─ Search Icon
      │   └─ Message
      │
      ├─ <div class="search-footer"> (if hasResults)
      │   ├─ View All Button
      │   ├─ Keyboard Hints
      │   └─ ES Status (if not available)
      │
      └─ <div class="preview-panel"> (if hoveredResult)
          ├─ Preview Header (badge + ID)
          ├─ Preview Title
          ├─ Preview Details (repeat)
          │   ├─ Label
          │   └─ Value
          └─ Preview Footer (hint)
</div>
```

## Event Handling

```
┌─────────────────────────────────────────────────────────────┐
│                      Keyboard Events                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  "/" (global)                                               │
│  └─→ Focus search input                                     │
│                                                             │
│  "Tab"                                                      │
│  └─→ Navigate to next result                               │
│                                                             │
│  "Shift+Tab"                                                │
│  └─→ Navigate to previous result                           │
│                                                             │
│  "ArrowDown"                                                │
│  └─→ Navigate to next result                               │
│                                                             │
│  "ArrowUp"                                                  │
│  └─→ Navigate to previous result                           │
│                                                             │
│  "Enter"                                                    │
│  └─→ Open selected result                                  │
│                                                             │
│  "Escape"                                                   │
│  └─→ Close dropdown & clear search                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       Mouse Events                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  input.focus()                                              │
│  └─→ Show dropdown                                          │
│                                                             │
│  input.blur()                                               │
│  └─→ Hide dropdown (200ms delay)                           │
│                                                             │
│  result-item.mouseenter()                                   │
│  └─→ Show preview panel                                     │
│                                                             │
│  result-item.mouseleave()                                   │
│  └─→ Hide preview panel                                     │
│                                                             │
│  result-item.mousedown()                                    │
│  └─→ Navigate to result page                               │
│                                                             │
│  clear-button.click()                                       │
│  └─→ Clear search query                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────────┐
│                   Optimization Strategy                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Debouncing (300ms)                                      │
│     └─→ Prevents excessive API calls                        │
│                                                             │
│  2. Fuzzy Filtering (Frontend)                              │
│     └─→ Reduces server load                                 │
│                                                             │
│  3. Virtual Scrolling (Optional)                            │
│     └─→ Handles large result sets                           │
│                                                             │
│  4. Lazy Preview Generation                                 │
│     └─→ Only on hover                                       │
│                                                             │
│  5. Efficient Grouping                                      │
│     └─→ Single pass through results                         │
│                                                             │
│  6. Scroll Optimization                                     │
│     └─→ Smooth scrolling with CSS                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Backend API                                                │
│  ├─ GET /api/v1/search/autocomplete                        │
│  └─ GET /api/v1/search                                      │
│                                                             │
│  Browser localStorage                                       │
│  ├─ Key: 'globalSearchRecent'                              │
│  └─ Max: 5 items                                            │
│                                                             │
│  Angular Router                                             │
│  ├─ /annonces/:id                                          │
│  ├─ /dossiers/:id                                          │
│  ├─ /parties-prenantes/:id                                 │
│  └─ /search?q=...                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

This architecture provides a clear separation of concerns, efficient data flow, and excellent user experience.
