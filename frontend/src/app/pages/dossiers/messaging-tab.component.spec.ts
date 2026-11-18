import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessagingTabComponent } from './messaging-tab.component';
import { OutboundMessageFormComponent } from './outbound-message-form.component';
import { OutboundMessageListComponent } from './outbound-message-list.component';
import {
  OutboundMessageApiService,
  OutboundMessageStatus} from '../../services/outbound-message-api.service';
import { ConfirmDeleteDialogComponent } from '../../components/confirm-delete-dialog.component';
import { CommonTestingModule } from '../../testing/common-testing.module';
import { DsDialogService, DsToastService } from '../../design-system';

describe('MessagingTabComponent', () => {
  let component: MessagingTabComponent;
  let fixture: ComponentFixture<MessagingTabComponent>;
  let mockDsDialog: AngularVitestPartialMock<DsDialogService>;
  let mockToastService: AngularVitestPartialMock<DsToastService>;
  let mockOutboundMessageService: AngularVitestPartialMock<OutboundMessageApiService>;

  beforeEach(async () => {
    mockDsDialog = {
      open: vi.fn().mockName('DsDialogService.open')};
    mockToastService = {
      success: vi.fn().mockName('DsToastService.success'),
      error: vi.fn().mockName('DsToastService.error'),
      info: vi.fn().mockName('DsToastService.info')};
    mockOutboundMessageService = {
      retry: vi.fn().mockName('OutboundMessageApiService.retry'),
      listTemplates: vi
        .fn()
        .mockName('OutboundMessageApiService.listTemplates'),
      create: vi.fn().mockName('OutboundMessageApiService.create'),
      list: vi.fn().mockName('OutboundMessageApiService.list')};

    await TestBed.configureTestingModule({
      imports: [
        CommonTestingModule,
        MessagingTabComponent,
        OutboundMessageFormComponent,
        OutboundMessageListComponent],
      providers: [
        { provide: DsDialogService, useValue: mockDsDialog },
        { provide: DsToastService, useValue: mockToastService },
        {
          provide: OutboundMessageApiService,
          useValue: mockOutboundMessageService}]}).compileComponents();

    fixture = TestBed.createComponent(MessagingTabComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dossierId', 1);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show success message when message is sent', () => {
    component.onMessageSent();

    expect(mockToastService.success).toHaveBeenCalledWith('Message envoyé avec succès');
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
      updatedAt: '2024-01-15T10:00:00'};

    mockDsDialog.open.mockReturnValue({ closed: of(false) });

    component.onRetryMessage(message);

    expect(mockDsDialog.open).toHaveBeenCalledWith(
      ConfirmDeleteDialogComponent,
      expect.objectContaining({
        width: '400px',
        data: expect.objectContaining({
          title: "Réessayer l'envoi"})})
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
      updatedAt: '2024-01-15T10:00:00'};

    mockDsDialog.open.mockReturnValue({ closed: of(true) });

    const updatedMessage = {
      ...message,
      status: OutboundMessageStatus.QUEUED,
      attemptCount: 2};
    mockOutboundMessageService.retry.mockReturnValue(of(updatedMessage));

    component.onRetryMessage(message);

    expect(mockOutboundMessageService.retry).toHaveBeenCalledWith(1);
    expect(mockToastService.info).toHaveBeenCalledWith('Message en cours de renvoi...');
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
      updatedAt: '2024-01-15T10:00:00'};

    mockDsDialog.open.mockReturnValue({ closed: of(true) });

    mockOutboundMessageService.retry.mockReturnValue(
      throwError(() => ({ error: { message: 'Retry failed' } }))
    );

    component.onRetryMessage(message);

    expect(mockToastService.error).toHaveBeenCalledWith('Retry failed');
  });
});
