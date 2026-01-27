# Quick Actions Component

## Overview

The Quick Actions component provides a floating action button (FAB) that offers contextual quick actions for dossier details. It includes keyboard shortcuts, recent action history, and VoIP integration for click-to-call functionality.

## Features

### 1. Floating Action Button (FAB)
- Fixed position in bottom-right corner
- Smooth open/close animations
- Material Design elevation and hover effects
- Accessible with keyboard navigation

### 2. Quick Actions Menu
- **Call Client** (Alt+C) - Initiate VoIP call if configured
- **Send Message** (Alt+M) - Open message dialog
- **Schedule Appointment** (Alt+R) - Open appointment dialog
- **Change Status** (Alt+S) - Navigate to status change section

### 3. Keyboard Shortcuts
All actions are accessible via keyboard shortcuts:
- `Alt+Q` - Toggle quick actions menu
- `Alt+C` - Call client
- `Alt+M` - Send message
- `Alt+R` - Schedule appointment
- `Alt+S` - Change status

### 4. Recent Actions History
- Displays last 5 actions performed
- Timestamp with relative time formatting
- Persisted to localStorage
- Filtered by dossier ID

### 5. VoIP Integration
- Click-to-call functionality
- Support for multiple providers: Twilio, Asterisk, Custom
- Configurable phone number formatting
- Call session tracking
- Visual indicator when VoIP is configured

## Usage

### Basic Integration

```html
<app-quick-actions [dossier]="dossier"></app-quick-actions>
```

### Input Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `dossier` | `DossierResponse` | Yes | The dossier object for which actions are displayed |

## Services

### QuickActionsService

Manages recent action history and persistence.

```typescript
interface RecentAction {
  dossierId: number;
  actionId: string;
  actionLabel: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Add a recent action
quickActionsService.addRecentAction({
  dossierId: 1,
  actionId: 'call-client',
  actionLabel: 'Appel client',
  timestamp: new Date().toISOString()
});

// Get recent actions for a dossier
const actions = quickActionsService.getRecentActions(dossierId);

// Clear all recent actions
quickActionsService.clearRecentActions();

// Clear actions for a specific dossier
quickActionsService.clearDossierActions(dossierId);
```

### VoipService

Manages VoIP configuration and call sessions.

```typescript
interface VoipConfiguration {
  enabled: boolean;
  provider: 'twilio' | 'asterisk' | 'custom' | null;
  clickToCallUrl?: string;
  apiKey?: string;
  phoneNumberFormat?: string;
}

// Configure VoIP
voipService.setConfiguration({
  enabled: true,
  provider: 'custom',
  clickToCallUrl: 'tel:{phone}',
  phoneNumberFormat: 'international'
});

// Check if configured
const isConfigured = voipService.isConfigured();

// Initiate a call
voipService.initiateCall('+33612345678', 'John Doe');

// End active call
voipService.endCall();

// Get call history
const history = voipService.getCallHistory();
```

## VoIP Configuration

### Provider Options

#### 1. Custom Click-to-Call
Simple URL-based calling:
```typescript
{
  enabled: true,
  provider: 'custom',
  clickToCallUrl: 'tel:{phone}'
}
```

#### 2. Twilio Integration
```typescript
{
  enabled: true,
  provider: 'twilio',
  apiKey: 'your-twilio-api-key',
  phoneNumberFormat: 'international'
}
```

#### 3. Asterisk Integration
```typescript
{
  enabled: true,
  provider: 'asterisk',
  clickToCallUrl: 'https://your-asterisk-server.com/call/{phone}',
  apiKey: 'your-api-key'
}
```

### Phone Number Formatting

The service supports automatic phone number formatting:
```typescript
// French format: 0612345678 -> +33612345678
voipService.formatPhoneNumber('0612345678');
```

## Styling

The component supports:
- Light and dark mode (via `prefers-color-scheme`)
- Responsive design (mobile-friendly)
- Material Design elevation and shadows
- Smooth animations and transitions

### CSS Classes

- `.quick-actions-container` - Main container
- `.quick-actions-fab` - Floating action button
- `.quick-actions-menu` - Actions menu panel
- `.action-button` - Individual action button
- `.recent-action-item` - Recent action history item
- `.voip-status` - VoIP connection indicator

## Accessibility

- Full keyboard navigation support
- ARIA labels for screen readers
- Focus management
- High contrast support
- Tooltip hints for all actions

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Performance

- Lazy component loading
- Efficient change detection (OnPush strategy possible)
- LocalStorage for persistence
- Minimal re-renders

## Examples

### Complete Dossier Detail Integration

```typescript
import { Component, OnInit } from '@angular/core';
import { DossierResponse } from '../../services/dossier-api.service';

@Component({
  selector: 'app-dossier-detail',
  template: `
    <div class="page-content">
      <!-- Dossier content -->
      <h1>{{ dossier?.leadName }}</h1>
      
      <!-- Quick Actions FAB -->
      <app-quick-actions [dossier]="dossier"></app-quick-actions>
    </div>
  `
})
export class DossierDetailComponent implements OnInit {
  dossier: DossierResponse | null = null;
  
  ngOnInit(): void {
    this.loadDossier();
  }
}
```

### VoIP Configuration Example

```typescript
import { Component, OnInit } from '@angular/core';
import { VoipService } from '../../services/voip.service';

@Component({
  selector: 'app-voip-settings',
  template: `
    <form (ngSubmit)="saveConfig()">
      <mat-slide-toggle [(ngModel)]="config.enabled" name="enabled">
        Enable VoIP
      </mat-slide-toggle>
      
      <mat-form-field>
        <mat-label>Provider</mat-label>
        <mat-select [(ngModel)]="config.provider" name="provider">
          <mat-option value="twilio">Twilio</mat-option>
          <mat-option value="asterisk">Asterisk</mat-option>
          <mat-option value="custom">Custom</mat-option>
        </mat-select>
      </mat-form-field>
      
      <mat-form-field>
        <mat-label>Click-to-Call URL</mat-label>
        <input matInput [(ngModel)]="config.clickToCallUrl" 
               name="url" placeholder="tel:{phone}">
      </mat-form-field>
      
      <button mat-raised-button color="primary" type="submit">
        Save Configuration
      </button>
    </form>
  `
})
export class VoipSettingsComponent implements OnInit {
  config: VoipConfiguration = {
    enabled: false,
    provider: null
  };
  
  constructor(private voipService: VoipService) {}
  
  ngOnInit(): void {
    const currentConfig = this.voipService.getConfiguration();
    if (currentConfig) {
      this.config = { ...currentConfig };
    }
  }
  
  saveConfig(): void {
    this.voipService.setConfiguration(this.config);
  }
}
```

## Testing

The component includes comprehensive unit tests:

```bash
# Run tests
ng test

# Test files
- quick-actions.component.spec.ts
- quick-actions.service.spec.ts
- voip.service.spec.ts
```

## Known Limitations

1. **VoIP Providers**: Currently supports basic integration. Full WebRTC support requires additional implementation.
2. **Call Recording**: Not implemented in current version.
3. **Multi-line Support**: Single active call session only.

## Future Enhancements

- [ ] WebRTC support for in-browser calls
- [ ] Call recording and transcription
- [ ] SMS quick action
- [ ] Custom action templates
- [ ] Action analytics and reporting
- [ ] Multi-language support for keyboard shortcuts
- [ ] Mobile app deep linking

## Contributing

When adding new actions:

1. Define action in `setupActions()` method
2. Register keyboard shortcut in `registerKeyboardShortcuts()`
3. Add action icon in `getActionIcon()` method
4. Update tests
5. Update this README

## Support

For issues or questions:
- Check existing GitHub issues
- Review AGENTS.md for development guidelines
- Contact the development team
