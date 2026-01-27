# Migration Guide: badge-status to badge Component

This guide helps you migrate from the legacy `badge-status` component to the new comprehensive `badge` component.

## Why Migrate?

The new `badge` component offers:
- ✅ More flexible styling (3 variants × 3 sizes)
- ✅ Better customization (pill, pulse, dot, icons)
- ✅ Improved dark mode support
- ✅ Better accessibility
- ✅ More semantic color options
- ✅ Type-safe configurations
- ✅ Cleaner API

## Breaking Changes

### Component Name
```html
<!-- Old -->
<app-badge-status status="SOLD" entityType="property"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="success-sold" icon="sell">Vendu</app-badge>
```

### Props Removed
- `status` - Use explicit `color` and content
- `entityType` - No longer needed

### Props Added
- `variant` - Style variant (solid/outline/soft)
- `size` - Size control (sm/md/lg)
- `pill` - Rounded edges
- `dot` - Notification dot
- `iconPosition` - Icon placement

## Migration Examples

### Property Statuses

#### Sold
```html
<!-- Old -->
<app-badge-status status="SOLD" entityType="property"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="success-sold" icon="sell">Vendu</app-badge>
```

#### Rented
```html
<!-- Old -->
<app-badge-status status="RENTED" entityType="property"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="success-rented" icon="key">Loué</app-badge>
```

#### Signed
```html
<!-- Old -->
<app-badge-status status="SIGNED" entityType="property"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="success-signed" icon="done_all">Signé</app-badge>
```

#### Available
```html
<!-- Old -->
<app-badge-status status="AVAILABLE" entityType="property"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="success" icon="home">Disponible</app-badge>
```

#### Pending
```html
<!-- Old -->
<app-badge-status status="PENDING" entityType="property"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="warning-attention" icon="pending">En attente</app-badge>
```

#### Reserved
```html
<!-- Old -->
<app-badge-status status="RESERVED" entityType="property"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="warning-urgent" icon="lock_clock">Réservé</app-badge>
```

#### Withdrawn
```html
<!-- Old -->
<app-badge-status status="WITHDRAWN" entityType="property"></app-badge-status>

<!-- New -->
<app-badge variant="outline" color="neutral-warmth" icon="block">Retiré</app-badge>
```

### Dossier Statuses

#### New
```html
<!-- Old -->
<app-badge-status status="NEW" entityType="dossier"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="info" icon="fiber_new" [pulse]="true">Nouveau</app-badge>
```

#### Qualifying
```html
<!-- Old -->
<app-badge-status status="QUALIFYING" entityType="dossier"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="warning-attention" icon="schedule" [pulse]="true">Qualification</app-badge>
```

#### Qualified
```html
<!-- Old -->
<app-badge-status status="QUALIFIED" entityType="dossier"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="success" icon="verified">Qualifié</app-badge>
```

#### Appointment
```html
<!-- Old -->
<app-badge-status status="APPOINTMENT" entityType="dossier"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="info" icon="event">Rendez-vous</app-badge>
```

#### Won
```html
<!-- Old -->
<app-badge-status status="WON" entityType="dossier"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="success" icon="check_circle">Gagné</app-badge>
```

#### Lost
```html
<!-- Old -->
<app-badge-status status="LOST" entityType="dossier"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="danger-soft" icon="cancel">Perdu</app-badge>
```

### Annonce Statuses

#### Draft
```html
<!-- Old -->
<app-badge-status status="DRAFT" entityType="annonce"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="neutral" icon="edit">Brouillon</app-badge>
```

#### Published
```html
<!-- Old -->
<app-badge-status status="PUBLISHED" entityType="annonce"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="success" icon="check_circle" [pulse]="true">Publié</app-badge>
```

#### Active
```html
<!-- Old -->
<app-badge-status status="ACTIVE" entityType="annonce"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="success" icon="check_circle" [pulse]="true">Actif</app-badge>
```

#### Paused
```html
<!-- Old -->
<app-badge-status status="PAUSED" entityType="annonce"></app-badge-status>

<!-- New -->
<app-badge variant="soft" color="warning-urgent" icon="pause_circle">En pause</app-badge>
```

#### Archived
```html
<!-- Old -->
<app-badge-status status="ARCHIVED" entityType="annonce"></app-badge-status>

<!-- New -->
<app-badge variant="outline" color="neutral-warmth" icon="archive">Archivé</app-badge>
```

## TypeScript Migration

### Using Helper Functions

```typescript
import { 
  getPropertyStatusBadge, 
  getDossierStatusBadgeConfig,
  getLeadUrgencyBadgeConfig 
} from './badge.types';

// Property status
const propertyBadge = getPropertyStatusBadge('SOLD');
// Returns: { status: 'SOLD', label: 'Vendu', color: 'success-sold', icon: 'sell' }

// Dossier status
const dossierConfig = getDossierStatusBadgeConfig('NEW');
// Returns: { variant: 'soft', size: 'md', color: 'info', icon: 'fiber_new', pulse: true }

// Lead urgency
const urgencyConfig = getLeadUrgencyBadgeConfig('URGENT');
// Returns: { variant: 'solid', size: 'md', color: 'warning-urgent', icon: 'warning', pulse: true }
```

### Component Usage with Types

```typescript
import { Component } from '@angular/core';
import { PropertyStatus, getPropertyStatusBadge } from './badge.types';

@Component({
  selector: 'app-property-card',
  template: `
    <app-badge 
      [variant]="badgeConfig.variant || 'soft'"
      [color]="badgeConfig.color"
      [icon]="badgeConfig.icon">
      {{ badgeConfig.label }}
    </app-badge>
  `
})
export class PropertyCardComponent {
  status: PropertyStatus = 'SOLD';
  
  get badgeConfig() {
    const badge = getPropertyStatusBadge(this.status);
    return {
      variant: 'soft' as const,
      ...badge
    };
  }
}
```

## Dynamic Migration Strategy

### Create a Wrapper Component (Temporary)

```typescript
// badge-status-wrapper.component.ts
import { Component, Input } from '@angular/core';
import { 
  PropertyStatus, 
  DossierStatus, 
  getPropertyStatusBadge,
  getDossierStatusBadgeConfig 
} from './badge.types';

@Component({
  selector: 'app-badge-status-compat',
  template: `
    <app-badge 
      [variant]="config.variant || 'soft'"
      [color]="config.color"
      [size]="config.size || 'md'"
      [icon]="config.icon"
      [pulse]="config.pulse || false">
      {{ config.label }}
    </app-badge>
  `
})
export class BadgeStatusCompatComponent {
  @Input() status!: string;
  @Input() entityType!: 'property' | 'dossier' | 'annonce';
  
  get config() {
    if (this.entityType === 'property') {
      const badge = getPropertyStatusBadge(this.status as PropertyStatus);
      return {
        variant: 'soft' as const,
        ...badge
      };
    }
    // Add other entity types...
    return { label: this.status, color: 'neutral' as const, icon: 'circle' };
  }
}
```

### Use Wrapper for Gradual Migration

```html
<!-- Step 1: Replace app-badge-status with wrapper -->
<app-badge-status-compat status="SOLD" entityType="property"></app-badge-status-compat>

<!-- Step 2: Once all usage is verified, replace with direct badge component -->
<app-badge variant="soft" color="success-sold" icon="sell">Vendu</app-badge>
```

## Testing Migration

### Unit Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';
import { getPropertyStatusBadge } from './badge.types';

describe('Badge Migration', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BadgeComponent ]
    }).compileComponents();
  });

  it('should display SOLD status correctly', () => {
    const badge = getPropertyStatusBadge('SOLD');
    component.variant = 'soft';
    component.color = badge.color;
    component.icon = badge.icon;
    
    expect(component.color).toBe('success-sold');
    expect(component.icon).toBe('sell');
  });
});
```

## Checklist

Use this checklist for migration:

- [ ] Identify all `<app-badge-status>` usage in templates
- [ ] Map each status to new badge configuration
- [ ] Update template syntax
- [ ] Import `BadgeComponent` in modules
- [ ] Test visual appearance in light mode
- [ ] Test visual appearance in dark mode
- [ ] Verify accessibility with screen readers
- [ ] Update unit tests
- [ ] Update integration tests
- [ ] Remove old `BadgeStatusComponent` imports
- [ ] Delete `badge-status.component.*` files (after full migration)

## Common Issues

### Issue: Missing icon

**Problem**: Icon not showing up

**Solution**: 
```html
<!-- Ensure MatIconModule is imported -->
import { MatIconModule } from '@angular/material/icon';

<!-- Use valid Material icon name -->
<app-badge icon="check">Valid</app-badge>
```

### Issue: Wrong colors in dark mode

**Problem**: Badge colors don't adapt to dark theme

**Solution**: Wrap in dark theme class
```html
<div class="dark-theme">
  <app-badge color="success">Auto-adapts</app-badge>
</div>
```

### Issue: Text truncation

**Problem**: Badge text is cut off

**Solution**: Keep text short or adjust container width
```html
<!-- Good -->
<app-badge>Vendu</app-badge>

<!-- Too long -->
<app-badge>Propriété vendue avec succès</app-badge>
```

## Benefits After Migration

1. **More Control**: Customize variant, size, icons independently
2. **Better UX**: Pulse animations, notification dots, pill shapes
3. **Maintainability**: Single source of truth for badge styling
4. **Type Safety**: Full TypeScript support with helper functions
5. **Performance**: OnPush change detection strategy
6. **Accessibility**: Built-in ARIA support and semantic HTML

## Support

If you encounter issues during migration:

1. Check `BADGE_SYSTEM_README.md` for full documentation
2. Review `BADGE_QUICK_REFERENCE.md` for syntax examples
3. Examine `badge-showcase.component` for visual examples
4. Consult `badge.types.ts` for helper functions
5. Test with the showcase component first

## Timeline

Recommended migration timeline:

- **Week 1-2**: Create wrapper component, test in dev
- **Week 3-4**: Migrate high-traffic pages
- **Week 5-6**: Migrate remaining pages
- **Week 7**: Remove old component, update documentation
- **Week 8**: Final testing and cleanup
