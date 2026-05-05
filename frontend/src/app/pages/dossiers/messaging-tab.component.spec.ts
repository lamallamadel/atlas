import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { MessagingTabComponent } from './messaging-tab.component';
import { OutboundMessageFormComponent } from './outbound-message-form.component';
import { OutboundMessageListComponent } from './outbound-message-list.component';
import {
  OutboundMessageApiService,
  OutboundMessageStatus,
} from '../../services/outbound-message-api.service';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog.component';
import { MaterialTestingModule } from '../../testing/material-testing.module';

describe('MessagingTabComponent', () => {
  let component: MessagingTabComponent;
  let fixture: ComponentFixture<MessagingTabComponent>;
  let mockDialog: AngularVitestPartialMock<MatDialog>;
  let mockSnackBar: AngularVitestPartialMock<MatSnackBar>;
  let mockOutboundMessageService: AngularVitestPartialMock<OutboundMessageApiService>;

  beforeEach(async () => {
    mockDialog = {
      open: vi.fn().mockName('MatDialog.open'),
    };
    mockSnackBar = {
      open: vi.fn().mockName('MatSnackBar.open'),
    };
    mockOutboundMessageService = {
      retry: vi.fn().mockName('OutboundMessageApiService.retry'),
      listTemplates: vi
        .fn()
        .mockName('OutboundMessageApiService.listTemplates'),
      create: vi.fn().mockName('OutboundMessageApiService.create'),
      list: vi.fn().mockName('OutboundMessageApiService.list'),
    };

    await TestBed.configureTestingModule({
      imports: [
        MaterialTestingModule,
        MessagingTabComponent,
        OutboundMessageFormComponent,
        OutboundMessageListComponent,
      ],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        {
          provide: OutboundMessageApiService,
          useValue: mockOutboundMessageService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MessagingTabComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dossierId', 1);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show success message when message is sent', () => {
    component.onMessageSent();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Message envoyé avec succès',
      'Fermer',
      expect.objectContaining({
        duration: 3000,
        panelClass: ['success-snackbar'],
      })
    );
  });

  it('should open confirmation dialog on retry', () => {
    const message = {
      id: 1,
      orgId: 'org1',
      dossierId: 1,
      recipientPhone: '+33612345678',
      content: 'Test',
      status: OutboundMessageStatus.FAILED,
      channel: 'WHATSAPP',
      attemptCount: 1,
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2024-01-15T10:00:00',
    };

    const dialogRefSpy = {
      afterClosed: vi.fn().mockName('MatDialogRef.afterClosed'),
    };
    dialogRefSpy.afterClosed.mockReturnValue(of(false));
    mockDialog.open.mockReturnValue(dialogRefSpy);

    component.onRetryMessage(message);

    expect(mockDialog.open).toHaveBeenCalledWith(
      ConfirmDeleteDialogComponent,
      expect.objectContaining({
        width: '400px',
        data: expect.objectContaining({
          title: "Réessayer l'envoi",
        }),
      })
    );
  });

  it('should retry message when confirmed', () => {
    const message = {
      id: 1,
      orgId: 'org1',
      dossierId: 1,
      recipientPhone: '+33612345678',
      content: 'Test',
      status: OutboundMessageStatus.FAILED,
      channel: 'WHATSAPP',
      attemptCount: 1,
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2024-01-15T10:00:00',
    };

    const dialogRefSpy = {
      afterClosed: vi.fn().mockName('MatDialogRef.afterClosed'),
    };
    dialogRefSpy.afterClosed.mockReturnValue(of(true));
    mockDialog.open.mockReturnValue(dialogRefSpy);

    const updatedMessage = {
      ...message,
      status: OutboundMessageStatus.QUEUED,
      attemptCount: 2,
    };
    mockOutboundMessageService.retry.mockReturnValue(of(updatedMessage));

    component.onRetryMessage(message);

    expect(mockOutboundMessageService.retry).toHaveBeenCalledWith(1);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Message en cours de renvoi...',
      'Fermer',
      expect.objectContaining({
        panelClass: ['success-snackbar'],
      })
    );
  });

  it('should show error message when retry fails', () => {
    const message = {
      id: 1,
      orgId: 'org1',
      dossierId: 1,
      recipientPhone: '+33612345678',
      content: 'Test',
      status: OutboundMessageStatus.FAILED,
      channel: 'WHATSAPP',
      attemptCount: 1,
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2024-01-15T10:00:00',
    };

    const dialogRefSpy = {
      afterClosed: vi.fn().mockName('MatDialogRef.afterClosed'),
    };
    dialogRefSpy.afterClosed.mockReturnValue(of(true));
    mockDialog.open.mockReturnValue(dialogRefSpy);

    mockOutboundMessageService.retry.mockReturnValue(
      throwError(() => ({ error: { message: 'Retry failed' } }))
    );

    component.onRetryMessage(message);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Retry failed',
      'Fermer',
      expect.objectContaining({
        panelClass: ['error-snackbar'],
      })
    );
  });
});
