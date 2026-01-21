import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { MessagingTabComponent } from './messaging-tab.component';
import { OutboundMessageApiService, OutboundMessageStatus } from '../../services/outbound-message-api.service';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog.component';

describe('MessagingTabComponent', () => {
  let component: MessagingTabComponent;
  let fixture: ComponentFixture<MessagingTabComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockOutboundMessageService: jasmine.SpyObj<OutboundMessageApiService>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockOutboundMessageService = jasmine.createSpyObj('OutboundMessageApiService', ['retry']);

    await TestBed.configureTestingModule({
      declarations: [ MessagingTabComponent ],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: OutboundMessageApiService, useValue: mockOutboundMessageService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessagingTabComponent);
    component = fixture.componentInstance;
    component.dossierId = 1;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show success message when message is sent', () => {
    component.onMessageSent();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Message envoyé avec succès',
      'Fermer',
      jasmine.objectContaining({
        duration: 3000,
        panelClass: ['success-snackbar']
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
      updatedAt: '2024-01-15T10:00:00'
    };

    const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<ConfirmDeleteDialogComponent>>('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    mockDialog.open.and.returnValue(dialogRefSpy);

    component.onRetryMessage(message);

    expect(mockDialog.open).toHaveBeenCalledWith(
      ConfirmDeleteDialogComponent,
      jasmine.objectContaining({
        width: '400px',
        data: jasmine.objectContaining({
          title: 'Réessayer l\'envoi'
        })
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
      updatedAt: '2024-01-15T10:00:00'
    };

    const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<ConfirmDeleteDialogComponent>>('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    mockDialog.open.and.returnValue(dialogRefSpy);

    const updatedMessage = { ...message, status: OutboundMessageStatus.QUEUED, attemptCount: 2 };
    mockOutboundMessageService.retry.and.returnValue(of(updatedMessage));

    component.onRetryMessage(message);

    expect(mockOutboundMessageService.retry).toHaveBeenCalledWith(1);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Message en cours de renvoi...',
      'Fermer',
      jasmine.objectContaining({
        panelClass: ['success-snackbar']
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
      updatedAt: '2024-01-15T10:00:00'
    };

    const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<ConfirmDeleteDialogComponent>>('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    mockDialog.open.and.returnValue(dialogRefSpy);

    mockOutboundMessageService.retry.and.returnValue(throwError(() => ({ error: { message: 'Retry failed' } })));

    component.onRetryMessage(message);

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Retry failed',
      'Fermer',
      jasmine.objectContaining({
        panelClass: ['error-snackbar']
      })
    );
  });
});
