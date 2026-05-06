import { MatSnackBar } from '@angular/material/snack-bar';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import {} from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { WhatsappMessagingUiComponent } from './whatsapp-messaging-ui.component';
import {
  MessageApiService,
  MessageChannel,
  MessageDirection,
  MessageDeliveryStatus,
} from '../services/message-api.service';
import { OutboundMessageApiService } from '../services/outbound-message-api.service';
import {
  ConsentementApiService,
  ConsentementChannel,
  ConsentementStatus,
} from '../services/consentement-api.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('WhatsappMessagingUiComponent', () => {
  let component: WhatsappMessagingUiComponent;
  let fixture: ComponentFixture<WhatsappMessagingUiComponent>;
  let messageApiService: AngularVitestPartialMock<MessageApiService>;
  let outboundMessageApiService: AngularVitestPartialMock<OutboundMessageApiService>;
  let consentementApiService: AngularVitestPartialMock<ConsentementApiService>;

  beforeEach(async () => {
    const messageApiServiceSpy = {
      list: vi.fn().mockName('MessageApiService.list'),
      create: vi.fn().mockName('MessageApiService.create'),
      getById: vi.fn().mockName('MessageApiService.getById'),
      retry: vi.fn().mockName('MessageApiService.retry'),
    };
    const outboundMessageApiServiceSpy = {
      listTemplates: vi
        .fn()
        .mockName('OutboundMessageApiService.listTemplates'),
    };
    const consentementApiServiceSpy = {
      list: vi.fn().mockName('ConsentementApiService.list'),
    };

    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MatBottomSheetModule,

        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatInputModule,
        MatChipsModule,
        ScrollingModule,
        TextFieldModule,
        WhatsappMessagingUiComponent,
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
        { provide: MessageApiService, useValue: messageApiServiceSpy },
        {
          provide: OutboundMessageApiService,
          useValue: outboundMessageApiServiceSpy,
        },
        {
          provide: ConsentementApiService,
          useValue: consentementApiServiceSpy,
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    messageApiService = TestBed.inject(
      MessageApiService
    ) as AngularVitestPartialMock<MessageApiService>;
    outboundMessageApiService = TestBed.inject(
      OutboundMessageApiService
    ) as AngularVitestPartialMock<OutboundMessageApiService>;
    consentementApiService = TestBed.inject(
      ConsentementApiService
    ) as AngularVitestPartialMock<ConsentementApiService>;

    messageApiService.list.mockReturnValue(
      of({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 0,
        number: 0,
      } as any)
    );
    outboundMessageApiService.listTemplates.mockReturnValue(of([]));
    consentementApiService.list.mockReturnValue(
      of({
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 0,
        number: 0,
      } as any)
    );

    fixture = TestBed.createComponent(WhatsappMessagingUiComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dossierId', 1);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load messages on init', () => {
    fixture.detectChanges();
    expect(messageApiService.list).toHaveBeenCalledWith({
      dossierId: 1,
      channel: MessageChannel.WHATSAPP,
      size: 100,
      sort: 'timestamp,asc',
    });
  });

  it('should load consent on init', () => {
    fixture.detectChanges();
    expect(consentementApiService.list).toHaveBeenCalledWith({
      dossierId: 1,
      channel: ConsentementChannel.WHATSAPP,
    });
  });

  it('should load templates on init', () => {
    fixture.detectChanges();
    expect(outboundMessageApiService.listTemplates).toHaveBeenCalled();
  });

  it('should disable send when no valid consent', () => {
    component.hasValidConsent = false;
    component.messageContent = 'Test message';
    component.isOnline = true;
    expect(component.canSend()).toBe(false);
  });

  it('should disable send when message is empty', () => {
    component.hasValidConsent = true;
    component.messageContent = '';
    component.isOnline = true;
    expect(component.canSend()).toBe(false);
  });

  it('should enable send when all conditions are met', () => {
    component.hasValidConsent = true;
    component.messageContent = 'Test message';
    component.isOnline = true;
    component.sending = false;
    expect(component.canSend()).toBe(true);
  });

  it('should format timestamp correctly', () => {
    const now = new Date();
    const result = component.formatTimestamp(now.toISOString());
    expect(result).toBe("À l'instant");
  });

  it('should return correct delivery status icon', () => {
    expect(component.getDeliveryStatusIcon(MessageDeliveryStatus.PENDING)).toBe(
      'schedule'
    );
    expect(component.getDeliveryStatusIcon(MessageDeliveryStatus.SENT)).toBe(
      'done'
    );
    expect(
      component.getDeliveryStatusIcon(MessageDeliveryStatus.DELIVERED)
    ).toBe('done_all');
    expect(component.getDeliveryStatusIcon(MessageDeliveryStatus.READ)).toBe(
      'done_all'
    );
    expect(component.getDeliveryStatusIcon(MessageDeliveryStatus.FAILED)).toBe(
      'error'
    );
  });

  it('should validate image file size', () => {
    const largeFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.jpg', {
      type: 'image/jpeg',
    });
    const result = component['validateAndCreateAttachment'](largeFile);
    expect(result).toBeNull();
  });

  it('should accept valid image file', () => {
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const result = component['validateAndCreateAttachment'](validFile);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('image');
  });

  it('should accept valid document file', () => {
    const validFile = new File(['test'], 'test.pdf', {
      type: 'application/pdf',
    });
    const result = component['validateAndCreateAttachment'](validFile);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('document');
  });

  it('should show date divider for first message', () => {
    component.messages = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        content: 'Test',
        channel: MessageChannel.WHATSAPP,
        direction: MessageDirection.OUTBOUND,
        dossierId: 1,
        orgId: 'org1',
        createdAt: new Date().toISOString(),
      },
    ];
    expect(component.showDateDivider(0)).toBe(true);
  });

  it('should update template variables and preview', () => {
    component.selectedTemplate = {
      id: 'template1',
      name: 'Test Template',
      content: 'Hello {{name}}, your appointment is on {{date}}',
      variables: ['name', 'date'],
      channel: 'WHATSAPP',
    };
    component.templateVariables = { name: 'John', date: '2024-01-15' };
    component.updateMessagePreview();
    expect(component.messageContent).toBe(
      'Hello John, your appointment is on 2024-01-15'
    );
  });

  it('should clear template and variables on remove', () => {
    component.selectedTemplate = {
      id: 'template1',
      name: 'Test Template',
      content: 'Hello {{name}}',
      variables: ['name'],
      channel: 'WHATSAPP',
    };
    component.templateVariables = { name: 'John' };
    component.messageContent = 'Hello John';

    component.removeTemplate();

    expect(component.selectedTemplate).toBeNull();
    expect(component.templateVariables).toEqual({});
    expect(component.messageContent).toBe('');
  });

  it('should remove attachment by index', () => {
    const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
    component.attachments = [
      { file: file1, type: 'image' },
      { file: file2, type: 'image' },
    ];

    component.removeAttachment(0);

    expect(component.attachments.length).toBe(1);
    expect(component.attachments[0].file).toBe(file2);
  });

  it('should get correct consent warning message', () => {
    component.consentChecked = true;
    component.consent = null;
    expect(component.getConsentWarningMessage()).toContain(
      'Aucun consentement'
    );

    component.consent = {
      id: 1,
      dossierId: 1,
      orgId: 'org1',
      channel: ConsentementChannel.WHATSAPP,
      status: ConsentementStatus.DENIED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(component.getConsentWarningMessage()).toContain('refusé');
  });
});
