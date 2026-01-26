# Illustration Library

A comprehensive library of 17+ custom SVG illustrations for empty states with consistent design and smooth animations.

## Features

- **17+ Illustrations**: Covering all common empty states (dossiers, annonces, messages, documents, errors, success, maintenance, etc.)
- **Consistent Design**: 
  - 2px stroke width throughout
  - Limited brand color palette (#667eea, #764ba2, #48bb78, #f093fb, #f5576c, #4facfe, #00f2fe)
  - Simple, clear compositions
  - 200x200px viewbox standard
- **Smooth Animations**: Fade-in effects, floating, pulsing, rotating elements
- **Accessible**: Optimized for screen readers and reduced motion preferences
- **Reusable**: Can be used directly via service or integrated into components

## Available Illustrations

| Name | Context | Description |
|------|---------|-------------|
| `dossier` | NO_DOSSIERS | Folder with documents and plus icon |
| `annonce` | NO_ANNONCES | House with windows and plus icon |
| `message` | NO_MESSAGES | Chat bubbles with typing dots |
| `search` | NO_SEARCH_RESULTS | Magnifying glass with question mark |
| `calendar` | NO_APPOINTMENTS | Calendar with clock icon |
| `task` | NO_TASKS | Clipboard with checklist items |
| `document` | NO_DOCUMENTS | Document stack with upload icon |
| `activity` | NO_ACTIVITIES | Activity pulse rings |
| `notification` | NO_NOTIFICATIONS | Bell with checkmark |
| `network-error` | NETWORK_ERROR | Cloud with WiFi error and cross |
| `import-success` | IMPORT_SUCCESS | Folder with down arrow and checkmark |
| `export-success` | EXPORT_SUCCESS | Document with up arrow and checkmark |
| `maintenance` | MAINTENANCE | Tools, gears, and traffic cones |
| `no-data` | NO_DATA | Empty database icon |
| `empty-search` | EMPTY_SEARCH | Search bar with blinking cursor |
| `favorites` | NO_FAVORITES | Heart outline with sparkles |
| `calendar-events` | NO_CALENDAR_EVENTS | Empty calendar with plus icon |

## Usage

### Via IllustrationLibraryService

```typescript
import { Component } from '@angular/core';
import { IllustrationLibraryService } from './components/illustrations';

@Component({
  selector: 'app-example',
  template: `
    <div class="empty-state">
      <div [innerHTML]="illustration"></div>
      <h2>No items found</h2>
    </div>
  `
})
export class ExampleComponent {
  illustration: SafeHtml;

  constructor(private illustrationService: IllustrationLibraryService) {
    this.illustration = this.illustrationService.getIllustration('dossier');
  }
}
```

### Via EmptyStateIllustrationsService (Integrated)

The `IllustrationLibraryService` powers the `EmptyStateIllustrationsService`, which provides context-aware configurations:

```typescript
import { Component } from '@angular/core';
import { EmptyStateIllustrationsService, EmptyStateContext } from '../services/empty-state-illustrations.service';

@Component({
  selector: 'app-dossier-list',
  template: `
    <app-empty-state 
      [context]="EmptyStateContext.NO_DOSSIERS"
      [isNewUser]="isNewUser"
      [primaryAction]="{ label: 'Create', handler: onCreate.bind(this) }">
    </app-empty-state>
  `
})
export class DossierListComponent {
  EmptyStateContext = EmptyStateContext;
  isNewUser = true;

  onCreate() {
    // Handle creation
  }
}
```

### Standalone Illustration Component

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-illustration-viewer',
  template: `
    <div [innerHTML]="illustration" class="illustration-wrapper"></div>
  `,
  styles: [`
    .illustration-wrapper {
      width: 200px;
      height: 200px;
      margin: 0 auto;
    }
  `]
})
export class IllustrationViewerComponent {
  illustration: SafeHtml;

  constructor(private illustrationService: IllustrationLibraryService) {
    // Get by name
    this.illustration = this.illustrationService.getIllustration('message');
    
    // Or get by context
    this.illustration = this.illustrationService.getIllustrationByContext('NO_MESSAGES');
  }
}
```

## Design Guidelines

### Colors

The illustrations use a limited brand palette:

- **Primary Purple**: `#667eea` → `#764ba2` (gradients)
- **Success Green**: `#48bb78` → `#38a169`
- **Error Red**: `#f56565` → `#c53030`
- **Info Blue**: `#4facfe` → `#00f2fe`
- **Warning Orange**: `#ed8936` → `#dd6b20`
- **Accent Pink**: `#f093fb` → `#f5576c`
- **Accent Yellow**: `#fa709a` → `#fee140`

### Stroke Width

All strokes use **2px width** for consistency, except for:
- Icon lines: 3px (for emphasis)
- Subtle lines: 1px (for detail)

### Animation Principles

1. **Subtle**: Animations should enhance, not distract
2. **Smooth**: Use `ease-in-out` timing functions
3. **Looping**: Most animations loop infinitely at 2-4 second intervals
4. **Accessible**: Respect `prefers-reduced-motion` (automatically disabled in CSS)

## Accessibility

All illustrations include:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
  }
}
```

This automatically disables animations for users who prefer reduced motion.

## Customization

### Size

Illustrations use a viewBox of `0 0 200 200` and scale responsively. To customize size:

```html
<div [innerHTML]="illustration" style="width: 150px; height: 150px;"></div>
```

### Colors

To override colors, modify the gradient definitions or stroke colors in the SVG markup within the service methods.

### Animations

To disable animations globally, add `.no-animation` class wrapper:

```html
<div class="no-animation" [innerHTML]="illustration"></div>
```

```css
.no-animation * {
  animation: none !important;
}
```

## Adding New Illustrations

To add a new illustration:

1. Create SVG following design guidelines (200x200 viewBox, 2px strokes, brand colors)
2. Add a new method in `IllustrationLibraryService`:

```typescript
private getYourNewIllustrationSvg(): string {
  return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="illustration-svg">
      <!-- Your SVG content -->
      <style>
        /* Animations */
      </style>
    </svg>
  `;
}
```

3. Register in `initializeLibrary()`:

```typescript
{
  name: 'your-illustration',
  context: 'YOUR_CONTEXT',
  description: 'Description of illustration',
  svg: this.getYourNewIllustrationSvg()
}
```

4. Optionally add to `EmptyStateContext` enum if it's a new context

## Performance

- **Lazy Loading**: Illustrations are generated on-demand, not preloaded
- **Sanitization**: All SVG content is sanitized via Angular's `DomSanitizer`
- **Inline SVG**: No external file dependencies, reducing HTTP requests
- **Optimized Animations**: CSS animations are GPU-accelerated where possible

## Browser Support

Fully supported in:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Graceful degradation for older browsers (animations may not work but illustrations display).

## Examples

### Empty Dossier List

```typescript
<app-empty-state 
  [context]="EmptyStateContext.NO_DOSSIERS"
  [primaryAction]="{ label: 'Nouveau dossier', icon: 'add_circle', handler: onCreate }">
</app-empty-state>
```

### Network Error

```typescript
<app-empty-state 
  [context]="EmptyStateContext.NETWORK_ERROR"
  [primaryAction]="{ label: 'Réessayer', icon: 'refresh', handler: onRetry }">
</app-empty-state>
```

### Import Success

```typescript
<app-empty-state 
  [context]="EmptyStateContext.IMPORT_SUCCESS"
  [primaryAction]="{ label: 'Voir les données', icon: 'visibility', handler: onView }">
</app-empty-state>
```

## Related Components

- **EmptyStateComponent**: Uses illustrations with full UI (title, message, buttons)
- **EmptyStateIllustrationsService**: Provides context-aware configurations
- **LoadingSkeletonComponent**: Alternative for loading states

## License

Part of the Atlasia project. Internal use only.
