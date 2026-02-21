# Badge Component System - Documentation Index

Complete badge system for Atlas Immobilier with variants, sizes, colors, animations, and dark mode support.

## 🚀 Quick Start

```html
<!-- Import in your component -->
import { BadgeComponent } from './components/badge.component';

<!-- Use in template -->
<app-badge variant="soft" color="success" icon="check">
  Approved
</app-badge>
```

## 📚 Documentation Files

### 1. [BADGE_SYSTEM_README.md](./BADGE_SYSTEM_README.md)
**Main documentation** - Start here!

- Complete feature overview
- All props and options explained
- Basic and advanced usage examples
- Real estate specific examples
- TypeScript integration
- Accessibility guidelines
- Dark mode support
- Browser compatibility

**When to read**: First time using the component or need full reference

---

### 2. [BADGE_QUICK_REFERENCE.md](./BADGE_QUICK_REFERENCE.md)
**Cheat sheet** - Quick lookup

- Syntax reference
- Common patterns
- Props table
- Color list
- Size guide
- Dos and don'ts

**When to read**: When you know what you want, just need syntax

---

### 3. [BADGE_USAGE_EXAMPLES.md](./BADGE_USAGE_EXAMPLES.md)
**Real-world examples** - Copy and paste ready

- Property listing cards
- Lead management dashboard
- Notification center
- Data tables
- Sidebar navigation
- Timeline components
- Complete TypeScript implementations

**When to read**: When implementing specific UI patterns

---

### 4. [BADGE_MIGRATION_GUIDE.md](./BADGE_MIGRATION_GUIDE.md)
**Migration guide** - From badge-status

- Step-by-step migration
- Before/after comparisons
- Status mapping
- Helper function usage
- Testing strategy
- Common issues

**When to read**: When migrating from old badge-status component

---

### 5. [BADGE_DESIGN_SPEC.md](./BADGE_DESIGN_SPEC.md)
**Design specification** - Technical details

- Typography specs
- Color specifications
- Spacing and sizing
- Animation details
- Accessibility requirements
- Performance guidelines
- Design tokens

**When to read**: When customizing, extending, or designing with badges

---

### 6. [BADGE_SYSTEM_SUMMARY.md](./BADGE_SYSTEM_SUMMARY.md)
**Implementation summary** - What was built

- Features implemented
- Files created
- Integration details
- Success metrics
- Next steps

**When to read**: For project overview and completion status

---

## 🎯 Quick Navigation

### By Task

**"I want to..."**

- ✅ **Start using badges** → [README](./BADGE_SYSTEM_README.md) → Basic Usage section
- ✅ **See quick syntax** → [Quick Reference](./BADGE_QUICK_REFERENCE.md)
- ✅ **Copy examples** → [Usage Examples](./BADGE_USAGE_EXAMPLES.md)
- ✅ **Migrate old code** → [Migration Guide](./BADGE_MIGRATION_GUIDE.md)
- ✅ **Customize design** → [Design Spec](./BADGE_DESIGN_SPEC.md)
- ✅ **See what's built** → [Summary](./BADGE_SYSTEM_SUMMARY.md)

### By Role

**"I am a..."**

- 👨‍💻 **Developer** → Start with [README](./BADGE_SYSTEM_README.md), reference [Quick Reference](./BADGE_QUICK_REFERENCE.md)
- 🎨 **Designer** → Read [Design Spec](./BADGE_DESIGN_SPEC.md), view showcase component
- 📊 **Product Manager** → Review [Summary](./BADGE_SYSTEM_SUMMARY.md), check [Usage Examples](./BADGE_USAGE_EXAMPLES.md)
- 🧪 **QA Engineer** → Reference [Design Spec](./BADGE_DESIGN_SPEC.md) accessibility section
- 🔧 **Maintainer** → Study [Migration Guide](./BADGE_MIGRATION_GUIDE.md), [Design Spec](./BADGE_DESIGN_SPEC.md)

### By Component

**"I need badges for..."**

- 🏠 **Property Status** → [README](./BADGE_SYSTEM_README.md) → Real Estate Examples
- 📋 **Lead Management** → [Usage Examples](./BADGE_USAGE_EXAMPLES.md) → Lead Dashboard
- 🔔 **Notifications** → [Quick Reference](./BADGE_QUICK_REFERENCE.md) → Notification Patterns
- 📊 **Data Tables** → [Usage Examples](./BADGE_USAGE_EXAMPLES.md) → Table Example
- 🎨 **Custom Design** → [Design Spec](./BADGE_DESIGN_SPEC.md) → Color System

## 🎨 Visual Showcase

View all badge variations:

```typescript
import { BadgeShowcaseComponent } from './components/badge-showcase.component';
```

```html
<app-badge-showcase></app-badge-showcase>
```

The showcase includes:
- All variant × color combinations
- Size demonstrations
- Real estate status examples
- Notification examples
- Pill badges
- Pulse animations
- Dark mode preview
- Contextual usage examples

## 📦 Component Files

### Production Files

```
badge.component.ts          - Component logic (80 lines)
badge.component.html        - Template (10 lines)
badge.component.css         - Styles (1,100 lines)
badge.types.ts             - TypeScript types & utilities (220 lines)
```

### Showcase Files

```
badge-showcase.component.ts    - Showcase logic (150 lines)
badge-showcase.component.html  - Showcase template
badge-showcase.component.css   - Showcase styles
```

### Test Files

```
badge.component.spec.ts     - Unit tests (150 lines)
```

## 🎯 Features at a Glance

### Variants (3)
- **Solid** - Filled background, high contrast
- **Outline** - Border with transparent background
- **Soft** - Subtle 10% opacity background

### Sizes (3)
- **sm** - Compact (11px font)
- **md** - Default (12px font)
- **lg** - Large (14px font)

### Colors (14)
- Standard: primary, success, warning, danger, info, neutral, neutral-warmth
- Real Estate: success-sold, success-rented, success-signed
- Warning Levels: warning-attention, warning-urgent, warning-critical
- Soft Error: danger-soft

### Special Features
- ✅ Pill shape (fully rounded)
- ✅ Pulse animation
- ✅ Dot indicator
- ✅ Icon support (left/right)
- ✅ Dark mode
- ✅ WCAG compliant
- ✅ Smooth transitions

## 🚦 Status

| Feature | Status | Notes |
|---------|--------|-------|
| Component | ✅ Complete | All variants implemented |
| Styles | ✅ Complete | 1000+ lines CSS |
| Types | ✅ Complete | TypeScript definitions |
| Tests | ✅ Complete | Unit tests included |
| Documentation | ✅ Complete | 6 comprehensive docs |
| Showcase | ✅ Complete | Visual examples |
| Dark Mode | ✅ Complete | Full support |
| Accessibility | ✅ Complete | WCAG AA/AAA |
| Integration | ✅ Complete | Ready to use |

## 🔗 Related Components

- `BadgeStatusComponent` - Legacy component (deprecated, use new BadgeComponent)
- `MatBadge` - Material badge (different use case - overlays on elements)
- `MatChip` - Material chip (interactive tags, different pattern)

## 📖 Common Patterns

### Property Status
```html
<app-badge variant="soft" color="success-sold" icon="sell">Vendu</app-badge>
```

### Notification Count
```html
<app-badge variant="solid" color="danger" size="sm" [pill]="true" [pulse]="true">5</app-badge>
```

### Online Status
```html
<app-badge variant="soft" color="success" size="sm" [dot]="true" [pulse]="true">En ligne</app-badge>
```

### Tag
```html
<app-badge variant="soft" color="primary" size="sm" [pill]="true">Premium</app-badge>
```

### Urgent Alert
```html
<app-badge variant="solid" color="warning-critical" icon="warning" [pulse]="true">Urgent</app-badge>
```

## 💡 Pro Tips

1. **Use semantic colors** - Choose colors based on meaning, not appearance
2. **Keep text short** - 1-3 words maximum
3. **Soft variant first** - Default to soft for non-critical badges
4. **Pulse sparingly** - Only for truly urgent items
5. **Consistent sizing** - Use same size within a context
6. **Icon clarity** - Only use icons that add meaning
7. **Accessibility matters** - Always add ariaLabel for counts

## 🐛 Troubleshooting

### Badge not showing?
- ✅ Check `BadgeComponent` is imported in module
- ✅ Check `MatIconModule` is imported (for icons)
- ✅ Verify component is declared in module

### Wrong colors in dark mode?
- ✅ Ensure parent has `.dark-theme` class
- ✅ Check color system CSS is loaded

### Icon not appearing?
- ✅ Use valid Material icon name
- ✅ Check `MatIconModule` is imported
- ✅ Verify icon font is loaded

### Animation not working?
- ✅ Check `[pulse]="true"` is set
- ✅ Verify animations aren't disabled globally
- ✅ Check `prefers-reduced-motion` setting

## 📞 Support

Need help? Check these resources in order:

1. **Quick Reference** - Common syntax and patterns
2. **README** - Full feature documentation
3. **Usage Examples** - Real-world implementations
4. **Design Spec** - Technical specifications
5. **Showcase** - Visual examples

## 🎉 Ready to Use!

The badge system is **production-ready** and can be used immediately in your application.

**Start here**: [BADGE_SYSTEM_README.md](./BADGE_SYSTEM_README.md)

**Quick syntax**: [BADGE_QUICK_REFERENCE.md](./BADGE_QUICK_REFERENCE.md)

**Examples**: [BADGE_USAGE_EXAMPLES.md](./BADGE_USAGE_EXAMPLES.md)

**Showcase**: `<app-badge-showcase></app-badge-showcase>`

---

*Built for Atlas Immobilier with ❤️*
