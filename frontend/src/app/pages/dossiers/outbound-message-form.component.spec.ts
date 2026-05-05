import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { OutboundMessageFormComponent } from './outbound-message-form.component';
import { OutboundMessageApiService } from '../../services/outbound-message-api.service';

describe('OutboundMessageFormComponent', () => {
  let component: OutboundMessageFormComponent;
  let fixture: ComponentFixture<OutboundMessageFormComponent>;
  let mockOutboundMessageService: AngularVitestPartialMock<OutboundMessageApiService>;

  beforeEach(async () => {
    mockOutboundMessageService = {
      listTemplates: vi
        .fn()
        .mockName('OutboundMessageApiService.listTemplates'),
      create: vi.fn().mockName('OutboundMessageApiService.create'),
    };

    await TestBed.configureTestingModule({
      imports: [FormsModule, OutboundMessageFormComponent],
      providers: [
        {
          provide: OutboundMessageApiService,
          useValue: mockOutboundMessageService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OutboundMessageFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dossierId', 1);
    fixture.componentRef.setInput('recipientPhone', '+33612345678');
    fixture.componentRef.setInput('leadName', 'John Doe');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load templates on init', () => {
    const mockTemplates = [
      {
        id: 'greeting',
        name: 'Salutation',
        content: 'Bonjour {{name}}',
        variables: ['name'],
        channel: 'WHATSAPP',
      },
    ];

    mockOutboundMessageService.listTemplates.mockReturnValue(of(mockTemplates));

    component.ngOnInit();

    expect(component.templates.length).toBe(1);
    expect(component.templates[0].id).toBe('greeting');
  });

  it('should initialize template variables when template is selected', () => {
    const template = {
      id: 'greeting',
      name: 'Salutation',
      content: 'Bonjour {{name}}',
      variables: ['name'],
      channel: 'WHATSAPP',
    };

    component.selectedTemplate = template;
    component.onTemplateSelect();

    expect(component.templateVariables['name']).toBe('John Doe');
    expect(component.messageContent).toContain('Bonjour John Doe');
  });

  it('should update message preview when variables change', () => {
    const template = {
      id: 'greeting',
      name: 'Salutation',
      content: 'Bonjour {{name}}, votre rendez-vous est à {{time}}',
      variables: ['name', 'time'],
      channel: 'WHATSAPP',
    };

    component.selectedTemplate = template;
    component.templateVariables = { name: 'John', time: '14:00' };
    component.updateMessagePreview();

    expect(component.messageContent).toBe(
      'Bonjour John, votre rendez-vous est à 14:00'
    );
  });

  it('should validate form correctly', () => {
    fixture.componentRef.setInput('recipientPhone', '+33612345678');
    component.messageContent = 'Test message';
    expect(component.canSendMessage()).toBe(true);

    component.messageContent = '';
    expect(component.canSendMessage()).toBe(false);

    component.messageContent = 'Test';
    fixture.componentRef.setInput('recipientPhone', '');
    expect(component.canSendMessage()).toBe(false);
  });

  it('should send message and emit event on success', () => {
    const mockResponse = {
      id: 1,
      orgId: 'org1',
      dossierId: 1,
      recipientPhone: '+33612345678',
      content: 'Test message',
      status: 'QUEUED' as any,
      channel: 'WHATSAPP',
      attemptCount: 0,
      createdAt: '2024-01-15T10:00:00',
      updatedAt: '2024-01-15T10:00:00',
    };

    mockOutboundMessageService.create.mockReturnValue(of(mockResponse));
    vi.spyOn(component.messageSent, 'emit');

    fixture.componentRef.setInput('recipientPhone', '+33612345678');
    component.messageContent = 'Test message';
    component.sendMessage();

    expect(component.messageSent.emit).toHaveBeenCalled();
    expect(component.messageContent).toBe('');
  });

  it('should handle error when sending message', () => {
    mockOutboundMessageService.create.mockReturnValue(
      throwError(() => ({ error: { message: 'Send failed' } }))
    );

    fixture.componentRef.setInput('recipientPhone', '+33612345678');
    component.messageContent = 'Test message';
    component.sendMessage();

    expect(component.error).toBe('Send failed');
    expect(component.sending).toBe(false);
  });
});
