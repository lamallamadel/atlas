import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DsButtonComponent, DsIconComponent, DsTextareaComponent } from '../../design-system';
/** Message affiché : `author` est comparé à `me`. */
export interface ThreadItem {
  id: number;
  author: string;
  body: string;
  at: string;
}

/**
 * Fil d'échanges propriétaire ↔ prospect et zone de réponse (cas d'usage n°1, UC-P4). Partagé par
 * l'espace propriétaire et la page du prospect : `me` dit de quel côté on regarde. Le texte est
 * affiché par interpolation (jamais en HTML).
 */
@Component({
  selector: 'app-conversation-thread',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, DsButtonComponent, DsIconComponent, DsTextareaComponent],
  template: `
    <div class="ct">
      <ol class="ct-list" #list role="log" aria-live="polite" [attr.aria-label]="'Échanges avec ' + otherName">
        @if (initialMessage) {
          <li class="ct-item" [class.ct-item--mine]="initialMine">
            <span class="ct-meta">{{ initialMine ? 'Votre demande' : 'Demande de ' + otherName }}</span>
            <p class="ct-bubble ct-bubble--first">{{ initialMessage }}</p>
          </li>
        }
        @for (m of messages; track m.id) {
          <li class="ct-item" [class.ct-item--mine]="m.author === me">
            <span class="ct-meta">{{ m.author === me ? 'Vous' : otherName }} · {{ m.at | date: 'd MMM, HH:mm' }}</span>
            <p class="ct-bubble">{{ m.body }}</p>
          </li>
        }
        @if (!messages.length) {
          <li class="ct-empty">{{ emptyText }}</li>
        }
      </ol>

      @if (closed) {
        <p class="ct-closed"><ds-icon name="lock" [size]="16"></ds-icon> Cette conversation est close.</p>
      } @else {
        <form class="ct-reply" #f="ngForm" (ngSubmit)="submit()">
          <ds-textarea [label]="replyLabel" name="body" [rows]="3" [maxLength]="2000" [(ngModel)]="draft" required [disabled]="sending"></ds-textarea>
          <div class="ct-reply__actions">
            <span class="ct-hint">{{ hint }}</span>
            <ds-button variant="marine" size="md" nativeType="submit" prefixIcon="send" [loading]="sending" [disabled]="sending || !draft.trim()">Envoyer</ds-button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .ct { display: flex; flex-direction: column; gap: var(--ds-space-4); }
    .ct-list { display: flex; flex-direction: column; gap: var(--ds-space-3); max-height: 460px; overflow-y: auto; margin: 0; padding: 0; list-style: none; }
    .ct-item { display: flex; flex-direction: column; align-items: flex-start; gap: var(--ds-space-1); max-width: 80%; }
    .ct-item--mine { align-self: flex-end; align-items: flex-end; }
    .ct-meta { font-size: var(--ds-text-xs); color: var(--ds-text-faint); }
    .ct-bubble { margin: 0; padding: var(--ds-space-3) var(--ds-space-4); border-radius: var(--ds-radius-lg); background: var(--ds-surface-2); color: var(--ds-text); font-size: var(--ds-text-sm); line-height: 1.5; white-space: pre-line; overflow-wrap: anywhere; }
    .ct-item--mine .ct-bubble { background: var(--ds-marine); color: var(--ds-text-inverse); }
    .ct-bubble--first { border: 1px dashed var(--ds-divider); }
    .ct-item--mine .ct-bubble--first { border-color: transparent; }
    .ct-empty { padding: var(--ds-space-4) 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .ct-reply { display: flex; flex-direction: column; gap: var(--ds-space-2); padding-top: var(--ds-space-4); border-top: 1px solid var(--ds-divider); }
    .ct-reply__actions { display: flex; align-items: center; justify-content: space-between; gap: var(--ds-space-3); }
    .ct-hint { font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
    .ct-closed { display: flex; align-items: center; gap: var(--ds-space-2); margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
  `],
})
export class ConversationThreadComponent implements AfterViewChecked {
  @Input() messages: ThreadItem[] = [];
  /** Auteur des messages de celui qui regarde (comparé à `author`). */
  @Input() me = 'OWNER';
  @Input() otherName = '';
  @Input() initialMessage: string | null = null;
  /** Le message initial est-il de celui qui regarde ? */
  @Input() initialMine = false;
  @Input() closed = false;
  @Input() sending = false;
  @Input() replyLabel = 'Votre message';
  @Input() hint = '';
  @Input() emptyText = 'Pas encore d’échange.';
  @Output() send = new EventEmitter<string>();

  @ViewChild('list') private list?: ElementRef<HTMLElement>;
  draft = '';
  private lastCount = -1;

  ngAfterViewChecked(): void {
    // Fait défiler jusqu'au dernier message quand il en arrive un.
    if (this.list && this.messages.length !== this.lastCount) {
      this.lastCount = this.messages.length;
      const el = this.list.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  submit(): void {
    const body = this.draft.trim();
    if (!body || this.sending) return;
    this.send.emit(body);
  }

  /** Appelé par la page une fois le message enregistré. */
  clear(): void {
    this.draft = '';
  }
}
