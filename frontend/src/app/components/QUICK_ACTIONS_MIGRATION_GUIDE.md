# Quick Actions - Migration Guide

## Overview

This guide helps you integrate the Quick Actions feature into existing Angular applications.

## Prerequisites

- Angular 15+ (tested with Angular 15-16)
- Angular Material 15+
- TypeScript 4.8+
- RxJS 7+

## Installation Steps

### Step 1: Copy Required Files

Copy the following files to your project:

#### Components
```
src/app/components/
├── quick-actions.component.ts
├── quick-actions.component.html
├── quick-actions.component.css
├── quick-actions.component.spec.ts
├── voip-config-dialog.component.ts
└── voip-config-dialog.component.spec.ts
```

#### Services
```
src/app/services/
├── quick-actions.service.ts
├── quick-actions.service.spec.ts
├── voip.service.ts
└── voip.service.spec.ts
```

#### Documentation
```
src/app/components/
├── QUICK_ACTIONS_README.md
├── QUICK_ACTIONS_USAGE_EXAMPLE.md
└── QUICK_ACTIONS_MIGRATION_GUIDE.md
```

### Step 2: Update app.module.ts

Add the new components to your module declarations:

```typescript
import { QuickActionsComponent } from './components/quick-actions.component';
import { VoipConfigDialogComponent } from './components/voip-config-dialog.component';

@NgModule({
  declarations: [
    // ... existing declarations
    QuickActionsComponent,
    VoipConfigDialogComponent
  ],
  // ... rest of module
})
export class AppModule { }
```

### Step 3: Verify Dependencies

Ensure you have the required Material modules imported:

```typescript
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    // ... existing imports
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    FormsModule
  ]
})
```

### Step 4: Add to Detail Pages

Add the Quick Actions component to your detail pages:

```html
<!-- dossier-detail.component.html -->
<div class="page-container">
  <div class="page-content">
    <!-- Your existing content -->
  </div>
  
  <!-- Add Quick Actions -->
  <app-quick-actions 
    *ngIf="dossier" 
    [dossier]="dossier">
  </app-quick-actions>
</div>
```

### Step 5: Adjust Existing CSS (if needed)

Ensure your detail pages have proper positioning:

```css
/* dossier-detail.component.css */
.page-container {
  position: relative; /* Important for FAB positioning */
  min-height: 100vh;
}

.page-content {
  padding-bottom: 80px; /* Space for FAB */
}
```

## Integration with Existing Services

### If You Have Existing Message Service

Update the Quick Actions component to use your existing service:

```typescript
// quick-actions.component.ts
import { YourMessageService } from '../services/your-message.service';

constructor(
  // ... other services
  private messageService: YourMessageService
) {}

sendMessage(): void {
  // Use your existing message service
  this.messageService.openMessageDialog(this.dossier);
}
```

### If You Have Existing Appointment Service

```typescript
// quick-actions.component.ts
import { YourAppointmentService } from '../services/your-appointment.service';

constructor(
  // ... other services
  private appointmentService: YourAppointmentService
) {}

scheduleAppointment(): void {
  // Use your existing appointment service
  this.appointmentService.openAppointmentDialog(this.dossier);
}
```

### If You Have Existing Status Service

```typescript
// quick-actions.component.ts
import { YourStatusService } from '../services/your-status.service';

constructor(
  // ... other services
  private statusService: YourStatusService
) {}

changeStatus(): void {
  // Use your existing status service
  this.statusService.openStatusDialog(this.dossier);
}
```

## Customization

### Customize Available Actions

Edit `quick-actions.component.ts` to add/remove actions:

```typescript
private setupActions(): void {
  this.actions = [
    // Keep existing actions or add new ones
    {
      id: 'send-email',
      icon: 'email',
      label: 'Envoyer un email',
      shortcut: 'Alt+E',
      color: 'primary',
      action: () => this.sendEmail()
    },
    // Add your custom actions
  ];
}
```

### Customize Keyboard Shortcuts

Modify shortcuts in `registerKeyboardShortcuts()`:

```typescript
private registerKeyboardShortcuts(): void {
  // Change 'Alt+C' to your preferred shortcut
  this.keyboardShortcutService.registerShortcut({
    key: 'Ctrl+Shift+C', // Your custom shortcut
    description: 'Appeler le client',
    category: 'actions',
    action: () => this.callClient()
  });
}
```

### Customize Styling

Override styles in your global styles or component CSS:

```css
/* styles.css or quick-actions.component.css */
.quick-actions-fab {
  /* Change position */
  bottom: 80px !important;
  right: 40px !important;
}

.quick-actions-menu {
  /* Change menu width */
  width: 450px !important;
}

.action-button {
  /* Customize action buttons */
  font-size: 16px !important;
}
```

## Keyboard Shortcut Integration

### If You Have Existing Keyboard Shortcut Service

Replace the imported `KeyboardShortcutService` with your existing service:

```typescript
// quick-actions.component.ts
import { YourKeyboardService } from '../services/your-keyboard.service';

constructor(
  // ... other services
  private keyboardService: YourKeyboardService
) {}

private registerKeyboardShortcuts(): void {
  // Use your existing keyboard service API
  this.keyboardService.register('Alt+C', () => this.callClient());
  this.keyboardService.register('Alt+M', () => this.sendMessage());
  // ... etc
}
```

### If You Don't Have Keyboard Shortcut Service

The bundled `KeyboardShortcutService` will work out of the box. Just ensure it's imported and registered globally:

```typescript
// app.component.ts
import { Component, HostListener } from '@angular/core';
import { KeyboardShortcutService } from './services/keyboard-shortcut.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  constructor(private keyboardShortcutService: KeyboardShortcutService) {}

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    this.keyboardShortcutService.handleKeyDown(event);
  }
}
```

## VoIP Configuration

### For Development/Testing

Use the simple click-to-call configuration:

```typescript
// In your settings or initialization
voipService.setConfiguration({
  enabled: true,
  provider: 'custom',
  clickToCallUrl: 'tel:{phone}'
});
```

### For Production with Twilio

```typescript
voipService.setConfiguration({
  enabled: true,
  provider: 'twilio',
  apiKey: environment.twilioApiKey,
  clickToCallUrl: environment.twilioCallUrl,
  phoneNumberFormat: 'international'
});
```

### For Production with Asterisk

```typescript
voipService.setConfiguration({
  enabled: true,
  provider: 'asterisk',
  apiKey: environment.asteriskApiKey,
  clickToCallUrl: environment.asteriskUrl + '/originate?number={phone}',
  phoneNumberFormat: 'international'
});
```

## Testing

### Run Unit Tests

```bash
ng test
```

### Test Specific Components

```bash
# Test Quick Actions
ng test --include='**/quick-actions.component.spec.ts'

# Test VoIP Service
ng test --include='**/voip.service.spec.ts'

# Test Quick Actions Service
ng test --include='**/quick-actions.service.spec.ts'
```

### Manual Testing Checklist

- [ ] FAB appears in bottom-right corner
- [ ] FAB opens/closes menu on click
- [ ] All actions are visible in menu
- [ ] Keyboard shortcuts work (Alt+Q, Alt+C, Alt+M, Alt+R, Alt+S)
- [ ] Recent actions history displays correctly
- [ ] VoIP status indicator shows when configured
- [ ] Actions are disabled appropriately (e.g., call when no phone)
- [ ] Mobile responsive design works
- [ ] Dark mode (if supported) looks correct
- [ ] Backdrop closes menu when clicked

## Troubleshooting

### FAB Not Appearing

**Problem:** The floating action button doesn't appear.

**Solutions:**
1. Check that dossier object is not null: `*ngIf="dossier"`
2. Verify CSS z-index isn't being overridden
3. Ensure Material Icons are loaded:
   ```html
   <!-- index.html -->
   <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
   ```

### Keyboard Shortcuts Not Working

**Problem:** Keyboard shortcuts don't trigger actions.

**Solutions:**
1. Verify global keyboard listener is registered in `app.component.ts`
2. Check that shortcuts aren't conflicting with browser shortcuts
3. Ensure KeyboardShortcutService is properly imported and injected

### VoIP Calls Not Working

**Problem:** Click-to-call doesn't work.

**Solutions:**
1. Verify VoIP is configured: `voipService.isConfigured()`
2. Check browser console for errors
3. Test with simple `tel:` URL first
4. Verify phone number format is correct

### Recent Actions Not Persisting

**Problem:** Recent actions disappear on page refresh.

**Solutions:**
1. Check browser localStorage is enabled
2. Verify localStorage quota isn't exceeded
3. Check console for localStorage errors
4. Try clearing localStorage: `localStorage.clear()`

### TypeScript Compilation Errors

**Problem:** TypeScript shows type errors.

**Solutions:**
1. Ensure all interfaces are properly imported
2. Update `tsconfig.json` if needed:
   ```json
   {
     "compilerOptions": {
       "strict": false,
       "strictPropertyInitialization": false
     }
   }
   ```
3. Add type assertions where needed: `as DossierResponse`

## Performance Optimization

### Lazy Loading

If you want to lazy load the Quick Actions feature:

```typescript
// Create quick-actions.module.ts
@NgModule({
  declarations: [
    QuickActionsComponent,
    VoipConfigDialogComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    FormsModule
  ],
  exports: [
    QuickActionsComponent,
    VoipConfigDialogComponent
  ]
})
export class QuickActionsModule { }

// In your routing module
{
  path: 'dossiers/:id',
  loadChildren: () => import('./dossiers/dossiers.module').then(m => m.DossiersModule)
}
```

### Change Detection Strategy

For better performance, use OnPush strategy:

```typescript
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-quick-actions',
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionsComponent {
  // Component code
}
```

## Migration Checklist

- [ ] Copy all required files
- [ ] Update app.module.ts
- [ ] Add Material dependencies
- [ ] Add to detail pages
- [ ] Adjust CSS for FAB positioning
- [ ] Test keyboard shortcuts
- [ ] Configure VoIP (if needed)
- [ ] Test on mobile devices
- [ ] Run unit tests
- [ ] Update documentation
- [ ] Train users on new feature

## Rollback Plan

If you need to rollback the feature:

1. Remove `<app-quick-actions>` from templates
2. Remove component imports from app.module.ts
3. Delete component files
4. Clear localStorage: `localStorage.removeItem('quick_actions_history')`
5. Clear VoIP config: `localStorage.removeItem('voip_configuration')`

## Support

For questions or issues:
- Review README: `QUICK_ACTIONS_README.md`
- Check examples: `QUICK_ACTIONS_USAGE_EXAMPLE.md`
- Open GitHub issue with details
- Contact development team

## Version History

### v1.0.0 (Current)
- Initial release
- Basic quick actions (call, message, appointment, status)
- Keyboard shortcuts
- Recent actions history
- VoIP integration
- Mobile responsive design
