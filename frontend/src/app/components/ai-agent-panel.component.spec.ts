import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { AiAgentPanelComponent } from './ai-agent-panel.component';
import { AiAgentService, AgentMessage } from '../services/ai-agent.service';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AiAgentPanelComponent', () => {
  let component: AiAgentPanelComponent;
  let fixture: ComponentFixture<AiAgentPanelComponent>;
  let aiAgentServiceSpy: AngularVitestPartialMock<AiAgentService>;

  let mockPanelOpen$: BehaviorSubject<boolean>;
  let mockMessages$: BehaviorSubject<AgentMessage[]>;
  let mockPendingQuery$: BehaviorSubject<string | null>;

  beforeEach(async () => {
    mockPanelOpen$ = new BehaviorSubject<boolean>(false);
    mockMessages$ = new BehaviorSubject<AgentMessage[]>([]);
    mockPendingQuery$ = new BehaviorSubject<string | null>(null);

    const spy = {
      openPanel: vi.fn().mockName('AiAgentService.openPanel'),
      closePanel: vi.fn().mockName('AiAgentService.closePanel'),
      togglePanel: vi.fn().mockName('AiAgentService.togglePanel'),
      clearConversation: vi.fn().mockName('AiAgentService.clearConversation'),
      processQuery: vi.fn().mockName('AiAgentService.processQuery'),
    } as Record<string, unknown>;
    // Mock the properties (via bracket notation: Record<> index signature TS4111)
    spy['panelOpen$'] = mockPanelOpen$.asObservable();
    spy['messages$'] = mockMessages$.asObservable();
    spy['pendingQuery$'] = mockPendingQuery$.asObservable();
    // Simulate internal field
    spy['_panelOpen$'] = mockPanelOpen$;

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        MatIconModule,
        MatTooltipModule,
        NoopAnimationsModule,
        AiAgentPanelComponent,
      ],
      providers: [{ provide: AiAgentService, useValue: spy as unknown as AiAgentService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AiAgentPanelComponent);
    component = fixture.componentInstance;
    aiAgentServiceSpy = TestBed.inject(
      AiAgentService
    ) as AngularVitestPartialMock<AiAgentService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open panel', () => {
    component.openPanel();
    expect(aiAgentServiceSpy.openPanel).toHaveBeenCalled();
  });

  it('should clear conversation', () => {
    component.clearConversation();
    expect(aiAgentServiceSpy.clearConversation).toHaveBeenCalled();
  });

  it('should submit query', async () => {
    component.inputValue = 'hello';
    aiAgentServiceSpy.processQuery.mockReturnValue(of(undefined as any));

    component.submit();

    expect(aiAgentServiceSpy.processQuery).toHaveBeenCalledWith('hello');
    expect(component.inputValue).toBe('');
  });

  it('should auto-fill query from pendingQuery$', async () => {
    mockPendingQuery$.next('What was that?');
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(component.inputValue).toBe('What was that?');
  });

  it('should format message markdown to html', () => {
    const formatted = component.formatMessage(
      '**Bold** and *Italic*\nNext line'
    );
    expect(formatted).toBe(
      '<strong>Bold</strong> and <em>Italic</em><br>Next line'
    );
  });
});
