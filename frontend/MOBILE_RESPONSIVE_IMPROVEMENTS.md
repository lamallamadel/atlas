# Mobile Responsive Improvements

## Overview

Comprehensive mobile-first responsive enhancements with touch-optimized interactions, swipe gestures, Material Design bottom sheets, and sticky headers for optimal mobile UX on iOS and Android.

## Features Implemented

### 1. **Swipe Gesture Directive**
**File**: `src/app/directives/swipe-gesture.directive.ts`

Touch-enabled swipe gesture recognition with configurable thresholds and directions.

**Features**:
- ✅ Horizontal swipe (left/right) support
- ✅ Vertical swipe (up/down) support
- ✅ Configurable swipe threshold (default: 50px)
- ✅ Velocity-based detection
- ✅ Progress tracking during swipe
- ✅ Cancel/abort detection
- ✅ Multi-directional support

**Usage**:
```html
<div 
  appSwipeGesture
  [swipeThreshold]="80"
  [enableSwipeLeft]="true"
  [enableSwipeRight]="true"
  (swipeLeft)="onSwipeLeft($event)"
  (swipeRight)="onSwipeRight($event)"
  (swipeMove)="onSwipeMove($event)">
  Content
</div>
```

**Events**:
- `swipeLeft`, `swipeRight`, `swipeUp`, `swipeDown`: Fired on completed swipe
- `swipeStart`: Touch begins
- `swipeMove`: During swipe (with progress)
- `swipeCancel`: Swipe aborted

### 2. **Mobile Action Sheet**
**File**: `src/app/components/mobile-action-sheet.component.ts`

Material Design bottom sheet for contextual actions on mobile.

**Features**:
- ✅ Drag handle indicator
- ✅ Touch-friendly 56px minimum hit areas
- ✅ Color-coded action items (primary, accent, warn, success)
- ✅ Disabled state support
- ✅ Divider support between actions
- ✅ Cancel button

**Usage**:
```typescript
const actions: MobileAction[] = [
  { icon: 'phone', label: 'Appeler', action: 'call', color: 'success' },
  { icon: 'message', label: 'Message', action: 'message', divider: true },
  { icon: 'delete', label: 'Supprimer', action: 'delete', color: 'warn' }
];

this.bottomSheet.open(MobileActionSheetComponent, {
  data: {
    title: 'Actions',
    subtitle: 'Choisissez une action',
    actions,
    cancelLabel: 'Annuler'
  }
});
```

### 3. **Mobile Dossier Card**
**File**: `src/app/components/mobile-dossier-card.component.ts`

Swipe-enabled card for dossier list items with visual feedback.

**Features**:
- ✅ Swipe left to delete (red indicator)
- ✅ Swipe right to call (green indicator)
- ✅ Touch-friendly 48px minimum buttons
- ✅ Visual swipe progress feedback
- ✅ Smooth animations
- ✅ Status badge integration
- ✅ Metadata display (source, last updated)
- ✅ Quick action buttons (call, message, more)

**Swipe Actions**:
- **Swipe Right**: Quick call action
- **Swipe Left**: Delete with confirmation

### 4. **Mobile-First List View**
**Updated**: `src/app/pages/dossiers/dossiers.component.*`

Responsive dossier list with mobile-optimized card layout.

**Features**:
- ✅ Automatically switches to card view on mobile (<768px)
- ✅ Sticky header with count and filter badges
- ✅ Touch-optimized pagination
- ✅ Native phone/SMS integration
- ✅ Confirm delete with Material dialog
- ✅ Empty state handling

### 5. **Sticky Headers with Scroll Detection**
**Updated**: `src/app/pages/dossiers/dossier-detail.component.css`

Enhanced sticky positioning for mobile navigation.

**Features**:
- ✅ Sticky back button (z-index: 101)
- ✅ Sticky dossier header (z-index: 100)
- ✅ Smooth shadow transitions on scroll
- ✅ Mobile viewport optimized spacing
- ✅ Touch-friendly 56px minimum heights

### 6. **Touch-Friendly Hit Areas**

All interactive elements follow **Material Design touch target guidelines**:
- ✅ **Minimum 48x48px** for standard buttons
- ✅ **56px height** for primary actions
- ✅ **Icon buttons**: 48x48px
- ✅ **FAB**: 56x56px (standard), 40x40px (mini)
- ✅ **List items**: 56px minimum height

### 7. **Responsive Layout Improvements**

**Desktop** (>768px):
- Full table view with all columns
- Advanced filter panel
- Horizontal action buttons

**Tablet** (768px):
- Reduced columns in table
- Collapsible filters
- Stacked action buttons

**Mobile** (<768px):
- Card-based layout
- Bottom sheet filters
- Vertical action buttons
- Sticky headers and pagination
- Native gestures (tel:, sms:)

## CSS Variables for Touch Targets

```scss
// Minimum touch target sizes (WCAG AA compliant)
--touch-target-min: 48px;
--touch-target-comfortable: 56px;
--touch-target-small: 40px;

// Z-index layers
--z-index-sticky: 100;
--z-index-fab: 200;
--z-index-bottom-sheet: 300;
--z-index-dialog: 400;
```

## Mobile-Specific Styles

### Sticky Elements
```scss
.mobile-header {
  position: sticky;
  top: 0;
  z-index: var(--z-index-sticky);
  background: var(--color-neutral-0);
  box-shadow: var(--shadow-sm);
}
```

### Touch Feedback
```scss
.touch-target {
  min-width: 48px;
  min-height: 48px;
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out);
}

.touch-target:active {
  transform: scale(0.95);
}
```

### Swipe Indicators
```scss
.swipe-action-left {
  background: var(--color-error-500);
  color: white;
  // Revealed on swipe left
}

.swipe-action-right {
  background: var(--color-success-500);
  color: white;
  // Revealed on swipe right
}
```

## Testing on Real Devices

### iOS Testing
```bash
# Connect device via USB
# Enable Web Inspector on iOS device
# Safari > Develop > [Device Name] > [Page]
```

### Android Testing
```bash
# Enable USB debugging
# Chrome > chrome://inspect#devices
```

### Responsive Design Mode
```bash
# Chrome DevTools
Cmd/Ctrl + Shift + M

# Test viewports:
- iPhone SE (375x667)
- iPhone 12/13/14 (390x844)
- iPhone 14 Pro Max (430x932)
- Samsung Galaxy S21 (360x800)
- iPad (768x1024)
```

## Accessibility (A11Y)

All mobile enhancements maintain WCAG AA compliance:
- ✅ **Touch targets**: Minimum 48x48px
- ✅ **Color contrast**: 4.5:1 for text, 3:1 for UI
- ✅ **Keyboard navigation**: Full support
- ✅ **Screen readers**: ARIA labels and roles
- ✅ **Focus indicators**: Visible on all interactive elements

## Performance Optimizations

1. **Hardware Acceleration**
   - `transform` and `opacity` for animations
   - `will-change` hint for swipe gestures

2. **Touch Action**
   - `touch-action: pan-y` for horizontal swipes
   - Prevents default zoom behavior

3. **Passive Event Listeners**
   - Improves scroll performance
   - Reduces jank during gestures

## Browser Compatibility

- ✅ iOS Safari 13+
- ✅ Chrome Mobile 90+
- ✅ Firefox Mobile 90+
- ✅ Samsung Internet 15+
- ✅ Edge Mobile 90+

## Known Limitations

1. **iOS Momentum Scrolling**: May interfere with swipe gestures in some cases
2. **Android Back Gesture**: May conflict with swipe-right in edge cases
3. **Small Screens**: < 320px width may have layout issues

## Future Enhancements

- [ ] Pull-to-refresh gesture
- [ ] Long-press context menus
- [ ] Haptic feedback (Vibration API)
- [ ] Progressive Web App (PWA) install prompt
- [ ] Offline mode indicators
- [ ] Voice input support
- [ ] Biometric authentication

## Migration Guide

### From Desktop-Only to Mobile-Responsive

1. **Import Directives**
```typescript
import { SwipeGestureDirective } from './directives/swipe-gesture.directive';
```

2. **Add to Module**
```typescript
declarations: [SwipeGestureDirective, MobileActionSheetComponent, MobileDossierCardComponent]
```

3. **Update Templates**
```html
<!-- Before -->
<table>...</table>

<!-- After -->
<div *ngIf="isMobile; else desktopView">
  <app-mobile-dossier-card
    *ngFor="let item of items"
    [dossier]="item"
    (action)="onAction($event)">
  </app-mobile-dossier-card>
</div>

<ng-template #desktopView>
  <table>...</table>
</ng-template>
```

4. **Handle Actions**
```typescript
onAction(action: DossierAction): void {
  switch (action.type) {
    case 'call': window.location.href = `tel:${action.dossier.leadPhone}`; break;
    case 'message': window.location.href = `sms:${action.dossier.leadPhone}`; break;
    case 'delete': this.confirmDelete(action.dossier); break;
  }
}
```

## Resources

- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Android Touch Targets](https://developer.android.com/guide/topics/ui/accessibility/apps#touch-targets)
- [WCAG 2.1 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

## Support

For issues or questions:
1. Check browser console for errors
2. Test on multiple devices/viewports
3. Verify touch target sizes with DevTools
4. Review accessibility with Lighthouse
