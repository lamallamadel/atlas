import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
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
    let aiAgentServiceSpy: jasmine.SpyObj<AiAgentService>;

    let mockPanelOpen$: BehaviorSubject<boolean>;
    let mockMessages$: BehaviorSubject<AgentMessage[]>;
    let mockPendingQuery$: BehaviorSubject<string | null>;

    beforeEach(async () => {
        mockPanelOpen$ = new BehaviorSubject<boolean>(false);
        mockMessages$ = new BehaviorSubject<AgentMessage[]>([]);
        mockPendingQuery$ = new BehaviorSubject<string | null>(null);

        const spy = jasmine.createSpyObj('AiAgentService', [
            'openPanel', 'closePanel', 'togglePanel', 'clearConversation', 'processQuery'
        ]);
        // Mock the properties
        spy.panelOpen$ = mockPanelOpen$.asObservable();
        spy.messages$ = mockMessages$.asObservable();
        spy.pendingQuery$ = mockPendingQuery$.asObservable();
        // Simulate internal field
        spy['_panelOpen$'] = mockPanelOpen$;

        await TestBed.configureTestingModule({
            declarations: [AiAgentPanelComponent],
            imports: [FormsModule, MatIconModule, MatTooltipModule, NoopAnimationsModule],
            providers: [
                { provide: AiAgentService, useValue: spy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AiAgentPanelComponent);
        component = fixture.componentInstance;
        aiAgentServiceSpy = TestBed.inject(AiAgentService) as jasmine.SpyObj<AiAgentService>;
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

    it('should submit query', fakeAsync(() => {
        component.inputValue = 'hello';
        aiAgentServiceSpy.processQuery.and.returnValue(of(undefined as any));

        component.submit();

        expect(aiAgentServiceSpy.processQuery).toHaveBeenCalledWith('hello');
        expect(component.inputValue).toBe('');
        tick(); // for setTimeout
    }));

    it('should auto-fill query from pendingQuery$', fakeAsync(() => {
        mockPendingQuery$.next('What was that?');
        tick(200); // 150ms timeout in ngOnInit

        expect(component.inputValue).toBe('What was that?');
    }));

    it('should format message markdown to html', () => {
        const formatted = component.formatMessage('**Bold** and *Italic*\nNext line');
        expect(formatted).toBe('<strong>Bold</strong> and <em>Italic</em><br>Next line');
    });
});
