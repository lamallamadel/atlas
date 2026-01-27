import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
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
import { DossierResponse, DossierStatus } from '../services/dossier-api.service';
import { of } from 'rxjs';

describe('QuickActionsComponent', () => {
  let component: QuickActionsComponent;
  let fixture: ComponentFixture<QuickActionsComponent>;
  let mockQuickActionsService: jasmine.SpyObj<QuickActionsService>;
  let mockVoipService: jasmine.SpyObj<VoipService>;
  let mockKeyboardShortcutService: jasmine.SpyObj<KeyboardShortcutService>;
  let mockMessageApiService: jasmine.SpyObj<MessageApiService>;
  let mockAppointmentApiService: jasmine.SpyObj<AppointmentApiService>;
  let mockDossierApiService: jasmine.SpyObj<DossierApiService>;

  const mockDossier: DossierResponse = {
    id: 1,
    status: DossierStatus.NEW,
    leadName: 'John Doe',
    leadPhone: '+33612345678',
    leadSource: 'Website',
    score: 80,
    annonceId: null,
    parties: [],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  };

  beforeEach(async () => {
    mockQuickActionsService = jasmine.createSpyObj('QuickActionsService', [
      'addRecentAction',
      'getRecentActions'
    ]);
    mockQuickActionsService.recentActions$ = of([]);

    mockVoipService = jasmine.createSpyObj('VoipService', [
      'isConfigured',
      'initiateCall'
    ]);
    mockVoipService.isConfigured.and.returnValue(true);

    mockKeyboardShortcutService = jasmine.createSpyObj('KeyboardShortcutService', [
      'registerShortcut'
    ]);

    mockMessageApiService = jasmine.createSpyObj('MessageApiService', ['create']);
    mockAppointmentApiService = jasmine.createSpyObj('AppointmentApiService', ['create']);
    mockDossierApiService = jasmine.createSpyObj('DossierApiService', ['patchStatus']);

    await TestBed.configureTestingModule({
      declarations: [QuickActionsComponent],
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        MatSnackBarModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule
      ],
      providers: [
        { provide: QuickActionsService, useValue: mockQuickActionsService },
        { provide: VoipService, useValue: mockVoipService },
        { provide: KeyboardShortcutService, useValue: mockKeyboardShortcutService },
        { provide: MessageApiService, useValue: mockMessageApiService },
        { provide: AppointmentApiService, useValue: mockAppointmentApiService },
        { provide: DossierApiService, useValue: mockDossierApiService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(QuickActionsComponent);
    component = fixture.componentInstance;
    component.dossier = mockDossier;
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
    expect(mockKeyboardShortcutService.registerShortcut).toHaveBeenCalledTimes(5);
  });

  it('should call client when VoIP is configured and phone available', () => {
    component.callClient();
    expect(mockVoipService.initiateCall).toHaveBeenCalledWith('+33612345678', 'John Doe');
  });

  it('should format action timestamp correctly', () => {
    const timestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const formatted = component.formatActionTimestamp(timestamp);
    expect(formatted).toContain('Il y a 5 min');
  });
});
