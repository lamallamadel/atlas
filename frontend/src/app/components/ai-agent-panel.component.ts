import {
    Component,
    OnInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    AfterViewChecked,
    HostListener
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AiAgentService, AgentMessage, AgentAction } from '../services/ai-agent.service';

/**
 * AiAgentPanelComponent — Atlas 2026 Phase 2
 *
 * Floating conversational AI panel (bottom-right).
 * Opens from CMD+K or the toolbar button.
 * Renders user/agent bubbles, typing indicator, and quick-action chips.
 *
 * Usage (in app-layout.component.html):
 *   <app-ai-agent-panel></app-ai-agent-panel>
 */
@Component({
    selector: 'app-ai-agent-panel',
    template: `
    <div
      class="ai-panel-fab"
      *ngIf="!(panelOpen$ | async)"
      (click)="openPanel()"
      (keydown.enter)="openPanel()"
      (keydown.space)="$event.preventDefault(); openPanel()"
      tabindex="0"
      role="button"
      aria-label="Ouvrir l'assistant IA"
      matTooltip="Assistant IA (Alt+A)"
      matTooltipPosition="left">
      <mat-icon>auto_awesome</mat-icon>
    </div>

    <div
      class="ai-panel glass-card-elevated"
      *ngIf="panelOpen$ | async"
      role="dialog"
      aria-modal="false"
      aria-label="Assistant IA Atlas"
      aria-labelledby="ai-panel-title">

      <!-- Header -->
      <div class="ai-panel-header">
        <div class="ai-panel-title-group">
          <div class="ai-panel-avatar">
            <mat-icon>auto_awesome</mat-icon>
          </div>
          <div>
            <div class="ai-panel-title" id="ai-panel-title">Atlas IA</div>
            <div class="ai-panel-status">
              <span class="status-dot"></span>
              En ligne
            </div>
          </div>
        </div>
        <div class="ai-panel-actions">
          <button
            mat-icon-button
            (click)="clearConversation()"
            matTooltip="Effacer la conversation"
            aria-label="Effacer la conversation">
            <mat-icon>delete_sweep</mat-icon>
          </button>
          <button
            mat-icon-button
            (click)="closePanel()"
            matTooltip="Fermer l'assistant (Esc)"
            aria-label="Fermer l'assistant IA">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Welcome message if no messages -->
      <div class="ai-panel-welcome" *ngIf="(messages$ | async)?.length === 0">
        <div class="welcome-icon">
          <mat-icon>auto_awesome</mat-icon>
        </div>
        <h3 class="welcome-title">Bonjour ! Je suis Atlas IA</h3>
        <p class="welcome-text">
          Dites-moi ce que vous cherchez en langage naturel.<br>
          Je peux naviguer, rechercher, créer et envoyer des messages pour vous.
        </p>
        <div class="welcome-examples">
          <button
            *ngFor="let ex of examples"
            class="example-chip"
            (click)="submitExample(ex)"
            type="button">
            {{ ex }}
          </button>
        </div>
      </div>

      <!-- Conversation -->
      <div
        class="ai-panel-conversation"
        #conversationEl
        *ngIf="(messages$ | async)?.length! > 0"
        aria-live="polite"
        aria-label="Conversation avec l'assistant">
        <div
          *ngFor="let msg of messages$ | async; trackBy: trackById"
          class="message-row"
          [class.user-row]="msg.role === 'user'"
          [class.agent-row]="msg.role === 'agent'">

          <!-- Agent avatar -->
          <div class="agent-avatar" *ngIf="msg.role === 'agent' && !msg.isTyping">
            <mat-icon>auto_awesome</mat-icon>
          </div>

          <!-- Typing indicator -->
          <div class="typing-bubble" *ngIf="msg.isTyping" aria-label="L'agent analyse votre demande">
            <span></span><span></span><span></span>
          </div>

          <!-- Message bubble -->
          <div
            class="message-bubble"
            *ngIf="!msg.isTyping"
            [class.user-bubble]="msg.role === 'user'"
            [class.agent-bubble]="msg.role === 'agent'"
            [innerHTML]="formatMessage(msg.content)">
          </div>

          <!-- Action chips -->
          <div class="action-chips" *ngIf="msg.role === 'agent' && msg.actions?.length && !msg.isTyping">
            <button
              *ngFor="let action of msg.actions"
              class="action-chip"
              (click)="executeAction(action)"
              type="button">
              <mat-icon>{{ action.icon }}</mat-icon>
              {{ action.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="ai-panel-input">
        <textarea
          #inputEl
          class="ai-input"
          [(ngModel)]="inputValue"
          (keydown)="onKeyDown($event)"
          (input)="onInput()"
          placeholder="Ex: Trouve des T3 à Casablanca sous 2M MAD…"
          rows="1"
          aria-label="Message pour l'assistant IA"
          aria-multiline="true">
        </textarea>
        <button
          class="send-btn"
          [class.active]="inputValue.trim().length > 0"
          [disabled]="!inputValue.trim()"
          (click)="submit()"
          aria-label="Envoyer la demande à l'agent">
          <mat-icon>send</mat-icon>
        </button>
      </div>

      <div class="ai-panel-hint">
        <kbd>Enter</kbd> pour envoyer &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> pour nouvelle ligne
      </div>
    </div>
  `,
    styles: [`
    /* ── FAB button ───────────────────────────────────────── */
    .ai-panel-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2c5aa0, #7c3aed);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 8000;
      box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                  box-shadow 0.2s ease;
      animation: fabIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ai-panel-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(124, 58, 237, 0.55);
    }
    .ai-panel-fab mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      animation: rotateStar 8s linear infinite;
    }
    @keyframes fabIn {
      from { transform: scale(0) rotate(-90deg); opacity: 0; }
      to   { transform: scale(1) rotate(0deg);   opacity: 1; }
    }
    @keyframes rotateStar {
      0%   { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* ── Panel ────────────────────────────────────────────── */
    .ai-panel {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 32px);
      max-height: 560px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      z-index: 8001;
      overflow: hidden;
      animation: panelIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid rgba(255,255,255,0.15);
    }
    @keyframes panelIn {
      from { transform: translateY(20px) scale(0.95); opacity: 0; }
      to   { transform: translateY(0)    scale(1);    opacity: 1; }
    }

    /* ── Header ───────────────────────────────────────────── */
    .ai-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 8px 12px 16px;
      background: linear-gradient(135deg, rgba(44,90,160,0.12), rgba(124,58,237,0.08));
      border-bottom: 1px solid rgba(255,255,255,0.1);
      flex-shrink: 0;
    }
    .ai-panel-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ai-panel-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2c5aa0, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
    }
    .ai-panel-avatar mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .ai-panel-title {
      font-family: 'Urbanist', sans-serif;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--color-neutral-900, #111);
      line-height: 1.2;
    }
    .ai-panel-status {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 0.6875rem;
      color: var(--color-neutral-500, #777);
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #27ae60;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .ai-panel-actions {
      display: flex;
      gap: 2px;
    }

    /* ── Welcome ──────────────────────────────────────────── */
    .ai-panel-welcome {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 20px;
      text-align: center;
      gap: 8px;
    }
    .welcome-icon mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #7c3aed;
      opacity: 0.85;
    }
    .welcome-title {
      font-family: 'Urbanist', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-neutral-900, #111);
      margin: 4px 0 0;
    }
    .welcome-text {
      font-size: 0.8125rem;
      color: var(--color-neutral-500, #777);
      line-height: 1.5;
      margin: 0 0 8px;
    }
    .welcome-examples {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: center;
    }
    .example-chip {
      border: 1px solid rgba(124,58,237,0.25);
      background: rgba(124,58,237,0.06);
      color: #7c3aed;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 0.75rem;
      cursor: pointer;
      font-family: 'Urbanist', sans-serif;
      transition: all 0.15s ease;
    }
    .example-chip:hover {
      background: rgba(124,58,237,0.14);
      transform: translateY(-1px);
    }

    /* ── Conversation ─────────────────────────────────────── */
    .ai-panel-conversation {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    .ai-panel-conversation::-webkit-scrollbar {
      width: 4px;
    }
    .ai-panel-conversation::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.12);
      border-radius: 4px;
    }
    .message-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .user-row {
      align-items: flex-end;
    }
    .agent-row {
      align-items: flex-start;
    }
    .agent-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2c5aa0, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;
      margin-bottom: 2px;
    }
    .agent-avatar mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }
    .message-bubble {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 0.8125rem;
      line-height: 1.5;
      word-break: break-word;
    }
    .user-bubble {
      background: linear-gradient(135deg, #2c5aa0, #7c3aed);
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .agent-bubble {
      background: var(--color-neutral-100, #f4f4f5);
      color: var(--color-neutral-900, #111);
      border-bottom-left-radius: 4px;
    }

    /* ── Typing indicator ─────────────────────────────────── */
    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 10px 14px;
      background: var(--color-neutral-100, #f4f4f5);
      border-radius: 14px;
      border-bottom-left-radius: 4px;
    }
    .typing-bubble span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #9ca3af;
      animation: typingBounce 1.2s ease-in-out infinite;
    }
    .typing-bubble span:nth-child(2) { animation-delay: 0.2s; }
    .typing-bubble span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    /* ── Action chips ─────────────────────────────────────── */
    .action-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-width: 90%;
    }
    .action-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px 4px 7px;
      border: 1px solid rgba(44,90,160,0.2);
      background: rgba(44,90,160,0.06);
      color: #2c5aa0;
      border-radius: 999px;
      font-size: 0.7rem;
      cursor: pointer;
      font-family: 'Urbanist', sans-serif;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .action-chip:hover {
      background: rgba(44,90,160,0.14);
      transform: translateY(-1px);
    }
    .action-chip mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* ── Input ────────────────────────────────────────────── */
    .ai-panel-input {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 10px 12px;
      border-top: 1px solid var(--color-neutral-200, #e5e7eb);
      flex-shrink: 0;
    }
    .ai-input {
      flex: 1;
      border: none;
      outline: none;
      resize: none;
      background: transparent;
      font-family: 'Urbanist', sans-serif;
      font-size: 0.875rem;
      color: var(--color-neutral-900, #111);
      line-height: 1.4;
      max-height: 96px;
      overflow-y: auto;
    }
    .ai-input::placeholder {
      color: var(--color-neutral-400, #9ca3af);
      font-size: 0.8125rem;
    }
    .send-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: var(--color-neutral-200, #e5e7eb);
      color: var(--color-neutral-400, #9ca3af);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: not-allowed;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    .send-btn.active {
      background: linear-gradient(135deg, #2c5aa0, #7c3aed);
      color: #fff;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(124,58,237,0.3);
    }
    .send-btn.active:hover {
      transform: scale(1.08);
    }
    .send-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ── Hint ─────────────────────────────────────────────── */
    .ai-panel-hint {
      text-align: center;
      font-size: 0.6875rem;
      color: var(--color-neutral-400, #9ca3af);
      padding: 4px 0 8px;
      flex-shrink: 0;
    }
    .ai-panel-hint kbd {
      background: var(--color-neutral-200, #e5e7eb);
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 0.625rem;
    }

    /* ── Dark theme ───────────────────────────────────────── */
    :host-context(.dark-theme) .ai-panel-title { color: #f0f0f0; }
    :host-context(.dark-theme) .ai-panel-header {
      border-bottom-color: rgba(255,255,255,0.06);
    }
    :host-context(.dark-theme) .agent-bubble {
      background: rgba(255,255,255,0.07);
      color: #e0e0e0;
    }
    :host-context(.dark-theme) .typing-bubble {
      background: rgba(255,255,255,0.07);
    }
    :host-context(.dark-theme) .ai-input { color: #e0e0e0; }
    :host-context(.dark-theme) .ai-panel-input {
      border-top-color: rgba(255,255,255,0.08);
    }
    :host-context(.dark-theme) .welcome-title { color: #f0f0f0; }

    /* ── Mobile ───────────────────────────────────────────── */
    @media (max-width: 480px) {
      .ai-panel {
        bottom: 0;
        right: 0;
        width: 100vw;
        max-width: 100vw;
        border-radius: 16px 16px 0 0;
        max-height: 70vh;
      }
      .ai-panel-fab {
        bottom: 16px;
        right: 16px;
      }
    }
  `]
})
export class AiAgentPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('conversationEl') conversationEl?: ElementRef<HTMLDivElement>;
    @ViewChild('inputEl') inputEl?: ElementRef<HTMLTextAreaElement>;

    panelOpen$ = this.agentService.panelOpen$;
    messages$ = this.agentService.messages$;
    inputValue = '';
    private shouldScroll = false;
    private destroy$ = new Subject<void>();

    examples = [
        'Trouve des T3 à Casablanca',
        'Crée un dossier pour Ahmed',
        'Envoie un message à M. Alami',
        'Montre les dossiers en cours'
    ];

    constructor(private agentService: AiAgentService) { }

    ngOnInit(): void {
        // Auto-fill query from CMD+K
        this.agentService.pendingQuery$
            .pipe(takeUntil(this.destroy$))
            .subscribe(q => {
                if (q) {
                    this.inputValue = q;
                    setTimeout(() => {
                        this.adjustHeight();
                        this.inputEl?.nativeElement?.focus();
                    }, 150);
                }
            });

        // Scroll on new messages
        this.agentService.messages$
            .pipe(takeUntil(this.destroy$))
            .subscribe(() => { this.shouldScroll = true; });
    }

    ngAfterViewChecked(): void {
        if (this.shouldScroll) {
            this.scrollToBottom();
            this.shouldScroll = false;
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.agentService['_panelOpen$']?.value) {
            this.closePanel();
        }
    }

    @HostListener('document:keydown.alt.a', ['$event'])
    onAltA(e: KeyboardEvent): void {
        e.preventDefault();
        this.agentService.togglePanel();
    }

    openPanel(): void { this.agentService.openPanel(); }
    closePanel(): void { this.agentService.closePanel(); }
    clearConversation(): void { this.agentService.clearConversation(); }

    submit(): void {
        const query = this.inputValue.trim();
        if (!query) return;
        this.inputValue = '';
        this.agentService.processQuery(query)
            .pipe(takeUntil(this.destroy$))
            .subscribe();
        setTimeout(() => this.adjustHeight(), 0);
    }

    submitExample(ex: string): void {
        this.inputValue = ex;
        this.submit();
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.submit();
        }
    }

    onInput(): void {
        this.adjustHeight();
    }

    executeAction(action: AgentAction): void {
        action.handler();
        this.closePanel();
    }

    formatMessage(content: string): string {
        // Markdown-lite: ** → bold, * → italic, newlines → <br>
        return content
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    trackById(_: number, msg: AgentMessage): string {
        return msg.id;
    }

    private adjustHeight(): void {
        const ta = this.inputEl?.nativeElement;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 96) + 'px';
    }

    private scrollToBottom(): void {
        const el = this.conversationEl?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
    }
}
