import { MatSnackBar } from '@angular/material/snack-bar';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import {} from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { QuickActionsComponent } from './quick-actions.component';
import { QuickActionsService } from '../services/quick-actions.service';
import { VoipService } from '../services/voip.service';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { MessageApiService } from '../services/message-api.service';
import { AppointmentApiService } from '../services/appointment-api.service';
import { DossierApiService } from '../services/dossier-api.service';
import {
  DossierResponse,
  DossierStatus,
} from '../services/dossier-api.service';
import { of } from 'rxjs';

describe('QuickActionsComponent', () => {
  let component: QuickActionsComponent;
  let fixture: ComponentFixture<QuickActionsComponent>;
  let mockQuickActionsService: AngularVitestPartialMock<QuickActionsService>;
  let mockVoipService: AngularVitestPartialMock<VoipService>;
  let mockKeyboardShortcutService: AngularVitestPartialMock<KeyboardShortcutService>;
  let mockMessageApiService: AngularVitestPartialMock<MessageApiService>;
  let mockAppointmentApiService: AngularVitestPartialMock<AppointmentApiService>;
  let mockDossierApiService: AngularVitestPartialMock<DossierApiService>;

  const mockDossier: DossierResponse = {
    id: 1,
    orgId: 'org-1',
    status: DossierStatus.NEW,
    leadName: 'John Doe',
    leadPhone: '+33612345678',
    leadSource: 'Website',
    score: 80,
    annonceId: undefined,
    parties: [],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  };

  beforeEach(async () => {
    mockQuickActionsService = {
      addRecentAction: vi.fn().mockName('QuickActionsService.addRecentAction'),
      getRecentActions: vi
        .fn()
        .mockName('QuickActionsService.getRecentActions'),
    };
    mockQuickActionsService.recentActions$ = of([]);

    mockVoipService = {
      isConfigured: vi.fn().mockName('VoipService.isConfigured'),
      initiateCall: vi.fn().mockName('VoipService.initiateCall'),
    };
    mockVoipService.isConfigured.mockReturnValue(true);

    mockKeyboardShortcutService = {
      registerShortcut: vi
        .fn()
        .mockName('KeyboardShortcutService.registerShortcut'),
    };

    mockMessageApiService = {
      create: vi.fn().mockName('MessageApiService.create'),
    };
    mockAppointmentApiService = {
      create: vi.fn().mockName('AppointmentApiService.create'),
    };
    mockDossierApiService = {
      patchStatus: vi.fn().mockName('DossierApiService.patchStatus'),
    };

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule,

        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        QuickActionsComponent,
      ],
      providers: [
        {
          provide: MatSnackBar,
          useValue: {
            open: () => ({
              onAction: () => of(null),
              afterDismissed: () => of(null),
            }),
            dismiss: () => {},
          },
        },
        { provide: QuickActionsService, useValue: mockQuickActionsService },
        { provide: VoipService, useValue: mockVoipService },
        {
          provide: KeyboardShortcutService,
          useValue: mockKeyboardShortcutService,
        },
        { provide: MessageApiService, useValue: mockMessageApiService },
        { provide: AppointmentApiService, useValue: mockAppointmentApiService },
        { provide: DossierApiService, useValue: mockDossierApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickActionsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dossier', mockDossier);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle menu', () => {
    expect(component.menuOpen).toBe(false);
    component.toggleMenu();
    expect(component.menuOpen).toBe(true);
    component.toggleMenu();
    expect(component.menuOpen).toBe(false);
  });

  it('should close menu', () => {
    component.menuOpen = true;
    component.closeMenu();
    expect(component.menuOpen).toBe(false);
  });

  it('should initialize with VoIP configured', () => {
    fixture.detectChanges();
    expect(component.voipConfigured).toBe(true);
  });

  it('should register keyboard shortcuts on init', () => {
    fixture.detectChanges();
    expect(mockKeyboardShortcutService.registerShortcut).toHaveBeenCalledTimes(
      5
    );
  });

  it('should call client when VoIP is configured and phone available', () => {
    fixture.detectChanges(); // triggers ngOnInit, sets voipConfigured
    component.callClient();
    expect(mockVoipService.initiateCall).toHaveBeenCalledWith(
      '+33612345678',
      'John Doe'
    );
  });

  it('should format action timestamp correctly', () => {
    const timestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const formatted = component.formatActionTimestamp(timestamp);
    expect(formatted).toContain('Il y a 5 min');
  });
});
