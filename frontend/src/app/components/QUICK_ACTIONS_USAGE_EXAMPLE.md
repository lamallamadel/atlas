# Quick Actions - Usage Examples

## Table of Contents
1. [Basic Integration](#basic-integration)
2. [VoIP Configuration](#voip-configuration)
3. [Custom Actions](#custom-actions)
4. [Keyboard Shortcuts](#keyboard-shortcuts)
5. [Recent Actions History](#recent-actions-history)

## Basic Integration

### Adding Quick Actions to Dossier Detail Page

```typescript
// dossier-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { DossierResponse } from '../../services/dossier-api.service';

@Component({
  selector: 'app-dossier-detail',
  template: `
    <div class="page-container">
      <div class="page-content">
        <!-- Your dossier content here -->
        <h1>{{ dossier?.leadName }}</h1>
        <!-- ... -->
      </div>
      
      <!-- Add Quick Actions FAB -->
      <app-quick-actions 
        *ngIf="dossier" 
        [dossier]="dossier">
      </app-quick-actions>
    </div>
  `
})
export class DossierDetailComponent implements OnInit {
  dossier: DossierResponse | null = null;

  ngOnInit(): void {
    this.loadDossier();
  }

  loadDossier(): void {
    // Your dossier loading logic
  }
}
```

## VoIP Configuration

### Opening VoIP Configuration Dialog

```typescript
// settings.component.ts
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { VoipConfigDialogComponent } from './voip-config-dialog.component';
import { VoipService } from '../services/voip.service';

@Component({
  selector: 'app-settings',
  template: `
    <div class="settings-page">
      <h2>Paramètres</h2>
      
      <mat-card>
        <mat-card-header>
          <mat-card-title>Configuration VoIP</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p *ngIf="!voipConfigured" class="warning">
            ⚠️ VoIP non configuré. Les appels rapides ne sont pas disponibles.
          </p>
          <p *ngIf="voipConfigured" class="success">
            ✓ VoIP configuré avec {{ voipProvider }}
          </p>
        </mat-card-content>
        <mat-card-actions>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="openVoipConfig()">
            Configurer VoIP
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `
})
export class SettingsComponent {
  voipConfigured = false;
  voipProvider = '';

  constructor(
    private dialog: MatDialog,
    private voipService: VoipService
  ) {
    this.checkVoipStatus();
  }

  checkVoipStatus(): void {
    this.voipConfigured = this.voipService.isConfigured();
    const config = this.voipService.getConfiguration();
    this.voipProvider = config?.provider || '';
  }

  openVoipConfig(): void {
    const dialogRef = this.dialog.open(VoipConfigDialogComponent, {
      width: '600px',
      maxWidth: '100vw',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('VoIP configuration saved:', result);
        this.checkVoipStatus();
      }
    });
  }
}
```

### VoIP Configuration Examples

#### Example 1: Mobile Click-to-Call
```typescript
voipService.setConfiguration({
  enabled: true,
  provider: 'custom',
  clickToCallUrl: 'tel:{phone}',
  phoneNumberFormat: 'international'
});
```

#### Example 2: Twilio Integration
```typescript
voipService.setConfiguration({
  enabled: true,
  provider: 'twilio',
  apiKey: 'your-twilio-api-key',
  clickToCallUrl: 'https://api.twilio.com/call',
  phoneNumberFormat: 'international'
});
```

#### Example 3: Asterisk PBX
```typescript
voipService.setConfiguration({
  enabled: true,
  provider: 'asterisk',
  apiKey: 'your-asterisk-key',
  clickToCallUrl: 'https://pbx.example.com/originate?number={phone}',
  phoneNumberFormat: 'international'
});
```

#### Example 4: Zoom Phone
```typescript
voipService.setConfiguration({
  enabled: true,
  provider: 'custom',
  clickToCallUrl: 'zoommtg://zoom.us/call?number={phone}'
});
```

## Custom Actions

### Adding Custom Quick Actions

```typescript
// custom-quick-actions.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { QuickActionsService, QuickAction } from '../services/quick-actions.service';
import { DossierResponse } from '../services/dossier-api.service';

@Component({
  selector: 'app-custom-quick-actions',
  template: `
    <div class="custom-actions">
      <button 
        *ngFor="let action of customActions"
        mat-raised-button
        [color]="action.color"
        (click)="action.action()">
        <mat-icon>{{ action.icon }}</mat-icon>
        {{ action.label }}
      </button>
    </div>
  `
})
export class CustomQuickActionsComponent implements OnInit {
  @Input() dossier!: DossierResponse;
  
  customActions: QuickAction[] = [];

  constructor(private quickActionsService: QuickActionsService) {}

  ngOnInit(): void {
    this.setupCustomActions();
  }

  private setupCustomActions(): void {
    this.customActions = [
      {
        id: 'send-email',
        icon: 'email',
        label: 'Envoyer un email',
        shortcut: 'Alt+E',
        color: 'primary',
        action: () => this.sendEmail()
      },
      {
        id: 'create-task',
        icon: 'assignment',
        label: 'Créer une tâche',
        shortcut: 'Alt+T',
        color: 'accent',
        action: () => this.createTask()
      },
      {
        id: 'export-pdf',
        icon: 'picture_as_pdf',
        label: 'Exporter en PDF',
        shortcut: 'Alt+P',
        color: 'warn',
        action: () => this.exportPdf()
      }
    ];
  }

  private sendEmail(): void {
    // Your email logic
    this.quickActionsService.addRecentAction({
      dossierId: this.dossier.id,
      actionId: 'send-email',
      actionLabel: 'Email envoyé',
      timestamp: new Date().toISOString()
    });
  }

  private createTask(): void {
    // Your task creation logic
    this.quickActionsService.addRecentAction({
      dossierId: this.dossier.id,
      actionId: 'create-task',
      actionLabel: 'Tâche créée',
      timestamp: new Date().toISOString()
    });
  }

  private exportPdf(): void {
    // Your PDF export logic
    this.quickActionsService.addRecentAction({
      dossierId: this.dossier.id,
      actionId: 'export-pdf',
      actionLabel: 'PDF exporté',
      timestamp: new Date().toISOString()
    });
  }
}
```

## Keyboard Shortcuts

### Registering Custom Keyboard Shortcuts

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';

@Component({
  selector: 'app-my-component',
  template: `<div>Component with keyboard shortcuts</div>`
})
export class MyComponent implements OnInit, OnDestroy {
  constructor(private keyboardShortcutService: KeyboardShortcutService) {}

  ngOnInit(): void {
    // Register custom shortcuts
    this.keyboardShortcutService.registerShortcut({
      key: 'Alt+N',
      description: 'Create new note',
      category: 'actions',
      action: () => this.createNote()
    });

    this.keyboardShortcutService.registerShortcut({
      key: 'Alt+D',
      description: 'Toggle dark mode',
      category: 'actions',
      action: () => this.toggleDarkMode()
    });

    // Register sequence shortcut (two keys in sequence)
    this.keyboardShortcutService.registerShortcut({
      key: 'g+n',
      description: 'Go to notes',
      category: 'navigation',
      sequence: true,
      action: () => this.navigateToNotes()
    });
  }

  ngOnDestroy(): void {
    // Note: Add unregister method to KeyboardShortcutService if needed
  }

  createNote(): void {
    console.log('Creating note...');
  }

  toggleDarkMode(): void {
    console.log('Toggling dark mode...');
  }

  navigateToNotes(): void {
    console.log('Navigating to notes...');
  }
}
```

### Handling Keyboard Events

```typescript
import { Component, HostListener } from '@angular/core';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  constructor(private keyboardShortcutService: KeyboardShortcutService) {}

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const handled = this.keyboardShortcutService.handleKeyDown(event);
    if (handled) {
      event.preventDefault();
    }
  }
}
```

## Recent Actions History

### Displaying Recent Actions

```typescript
import { Component, OnInit } from '@angular/core';
import { QuickActionsService, RecentAction } from '../services/quick-actions.service';

@Component({
  selector: 'app-recent-actions',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Actions récentes</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-list>
          <mat-list-item *ngFor="let action of recentActions">
            <mat-icon mat-list-icon>{{ getActionIcon(action.actionId) }}</mat-icon>
            <div mat-line>{{ action.actionLabel }}</div>
            <div mat-line class="secondary">
              Dossier #{{ action.dossierId }} - {{ formatTimestamp(action.timestamp) }}
            </div>
          </mat-list-item>
        </mat-list>
        
        <button 
          mat-button 
          color="warn" 
          (click)="clearHistory()"
          *ngIf="recentActions.length > 0">
          Effacer l'historique
        </button>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .secondary {
      font-size: 12px;
      color: #666;
    }
  `]
})
export class RecentActionsComponent implements OnInit {
  recentActions: RecentAction[] = [];

  constructor(private quickActionsService: QuickActionsService) {}

  ngOnInit(): void {
    this.quickActionsService.recentActions$.subscribe(actions => {
      this.recentActions = actions;
    });
  }

  getActionIcon(actionId: string): string {
    const icons: Record<string, string> = {
      'call-client': 'phone',
      'send-message': 'message',
      'schedule-appointment': 'event',
      'change-status': 'swap_horiz',
      'send-email': 'email',
      'create-task': 'assignment',
      'export-pdf': 'picture_as_pdf'
    };
    return icons[actionId] || 'history';
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  clearHistory(): void {
    if (confirm('Êtes-vous sûr de vouloir effacer l\'historique ?')) {
      this.quickActionsService.clearRecentActions();
    }
  }
}
```

### Filtering Recent Actions by Dossier

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { QuickActionsService, RecentAction } from '../services/quick-actions.service';

@Component({
  selector: 'app-dossier-recent-actions',
  template: `
    <div class="recent-actions-sidebar">
      <h3>Actions récentes pour ce dossier</h3>
      <div *ngFor="let action of dossierActions" class="action-item">
        <mat-icon>{{ getActionIcon(action.actionId) }}</mat-icon>
        <div class="action-content">
          <span class="action-label">{{ action.actionLabel }}</span>
          <span class="action-time">{{ formatTimestamp(action.timestamp) }}</span>
        </div>
      </div>
      
      <div *ngIf="dossierActions.length === 0" class="empty-state">
        Aucune action récente pour ce dossier
      </div>
    </div>
  `
})
export class DossierRecentActionsComponent implements OnInit {
  @Input() dossierId!: number;
  
  dossierActions: RecentAction[] = [];

  constructor(private quickActionsService: QuickActionsService) {}

  ngOnInit(): void {
    // Get actions filtered by dossier ID
    this.dossierActions = this.quickActionsService.getRecentActions(this.dossierId);
    
    // Subscribe to updates
    this.quickActionsService.recentActions$.subscribe(actions => {
      this.dossierActions = actions.filter(a => a.dossierId === this.dossierId);
    });
  }

  getActionIcon(actionId: string): string {
    // Same as previous example
    return 'history';
  }

  formatTimestamp(timestamp: string): string {
    // Same as previous example
    return timestamp;
  }
}
```

## Advanced Examples

### Tracking Action Metadata

```typescript
quickActionsService.addRecentAction({
  dossierId: 123,
  actionId: 'send-message',
  actionLabel: 'Message WhatsApp envoyé',
  timestamp: new Date().toISOString(),
  metadata: {
    messageChannel: 'WHATSAPP',
    messageLength: 150,
    recipientPhone: '+33612345678',
    templateUsed: 'greeting'
  }
});
```

### Call History Tracking

```typescript
import { Component, OnInit } from '@angular/core';
import { VoipService, CallSession } from '../services/voip.service';

@Component({
  selector: 'app-call-history',
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Historique des appels</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="callHistory">
          <ng-container matColumnDef="contactName">
            <th mat-header-cell *matHeaderCellDef>Contact</th>
            <td mat-cell *matCellDef="let call">{{ call.contactName }}</td>
          </ng-container>

          <ng-container matColumnDef="phoneNumber">
            <th mat-header-cell *matHeaderCellDef>Numéro</th>
            <td mat-cell *matCellDef="let call">{{ call.phoneNumber }}</td>
          </ng-container>

          <ng-container matColumnDef="startTime">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let call">
              {{ call.startTime | date:'dd/MM/yyyy HH:mm' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="duration">
            <th mat-header-cell *matHeaderCellDef>Durée</th>
            <td mat-cell *matCellDef="let call">
              {{ formatDuration(call.duration) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Statut</th>
            <td mat-cell *matCellDef="let call">
              <mat-chip [class]="'status-' + call.status">
                {{ call.status }}
              </mat-chip>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `
})
export class CallHistoryComponent implements OnInit {
  callHistory: CallSession[] = [];
  displayedColumns = ['contactName', 'phoneNumber', 'startTime', 'duration', 'status'];

  constructor(private voipService: VoipService) {}

  ngOnInit(): void {
    this.voipService.callHistory$.subscribe(history => {
      this.callHistory = history;
    });
  }

  formatDuration(seconds?: number): string {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
```

## Testing Examples

### Unit Testing Quick Actions

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuickActionsComponent } from './quick-actions.component';
import { QuickActionsService } from '../services/quick-actions.service';
import { VoipService } from '../services/voip.service';

describe('QuickActionsComponent', () => {
  let component: QuickActionsComponent;
  let fixture: ComponentFixture<QuickActionsComponent>;
  let mockQuickActionsService: jasmine.SpyObj<QuickActionsService>;
  let mockVoipService: jasmine.SpyObj<VoipService>;

  beforeEach(async () => {
    mockQuickActionsService = jasmine.createSpyObj('QuickActionsService', [
      'addRecentAction',
      'getRecentActions'
    ]);
    
    mockVoipService = jasmine.createSpyObj('VoipService', [
      'isConfigured',
      'initiateCall'
    ]);

    await TestBed.configureTestingModule({
      declarations: [QuickActionsComponent],
      providers: [
        { provide: QuickActionsService, useValue: mockQuickActionsService },
        { provide: VoipService, useValue: mockVoipService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuickActionsComponent);
    component = fixture.componentInstance;
  });

  it('should call client when button is clicked', () => {
    mockVoipService.isConfigured.and.returnValue(true);
    component.dossier = {
      id: 1,
      leadPhone: '+33612345678',
      leadName: 'John Doe'
      // ... other fields
    };

    component.callClient();

    expect(mockVoipService.initiateCall).toHaveBeenCalledWith(
      '+33612345678',
      'John Doe'
    );
  });
});
```

## Best Practices

1. **Always check VoIP configuration** before initiating calls
2. **Track all actions** in recent history for audit purposes
3. **Use keyboard shortcuts** for power users
4. **Provide visual feedback** for all actions
5. **Handle errors gracefully** with user-friendly messages
6. **Test on mobile devices** for responsive design
7. **Persist configuration** to localStorage
8. **Clear sensitive data** (API keys) from logs
