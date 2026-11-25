import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DsButtonComponent,
  DsCardComponent,
  DsIconComponent,
  DsSkeletonComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../../design-system';
import { PortalConversationApiService, ProspectConversation } from '../../../services/portal-conversation-api.service';
import { serverMessage } from '../../../components/annonce-publication-panel.component';
import { ConversationThreadComponent } from '../../owner/conversation-thread.component';

/**
 * Page du prospect, ouverte depuis le lien reçu par WhatsApp ou e-mail (cas d'usage n°1, UC-P4) :
 * lire les réponses du propriétaire, lui écrire, choisir un créneau de visite. Pas de compte.
 */
@Component({
  selector: 'app-contact-conversation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, DsButtonComponent, DsCardComponent, DsIconComponent, DsSkeletonComponent, PageHeaderComponent, ConversationThreadComponent],
  template: `
    <div class="pro-page ds-form-stack cc-page">
      @if (conv(); as c) {
        <ds-page-header eyebrow="Votre demande" titleBefore="Échange avec" [titleAccent]="c.ownerName"
          [description]="c.annonceTitle ? 'Au sujet de « ' + c.annonceTitle + ' »' + (c.annonceCity ? ', ' + c.annonceCity : '') : null">
          <ng-container slot="actions">
            @if (c.annonceId) {
              <ds-button variant="ghost" size="md" [routerLink]="['/annonces', c.annonceId]">Revoir l'annonce</ds-button>
            }
          </ng-container>
        </ds-page-header>

        @if (c.proposals.length && !c.closed) {
          <ds-card [pad]="true" elevation="sm">
            <div class="ds-form-stack">
              <h2 class="cc-card-title">Choisissez un créneau de visite</h2>
              <ul class="cc-slots" role="list">
                @for (s of c.proposals; track s.id) {
                  <li class="cc-slot">
                    <ds-icon name="calendar" [size]="20"></ds-icon>
                    <span class="cc-slot__text">
                      <span class="cc-strong">{{ s.start | date: 'EEEE d MMMM' }}</span>
                      <span class="cc-muted">{{ s.start | date: 'HH:mm' }} – {{ s.end | date: 'HH:mm' }}</span>
                    </span>
                    <ds-button variant="marine" size="sm" [loading]="accepting() === s.id" [disabled]="accepting() !== null" (dsClick)="accept(s.id)">Choisir</ds-button>
                  </li>
                }
              </ul>
              <p class="cc-muted">Aucun ne vous convient ? Écrivez-le à {{ c.ownerName }} ci-dessous.</p>
            </div>
          </ds-card>
        }

        @for (v of c.visits; track v.id) {
          <div class="cc-visit" role="status">
            <ds-icon name="check" [size]="20"></ds-icon>
            <span>Visite prévue le <strong>{{ v.start | date: 'EEEE d MMMM' }}</strong> de {{ v.start | date: 'HH:mm' }} à {{ v.end | date: 'HH:mm' }}. {{ c.ownerName }} vous précisera le lieu.</span>
          </div>
        }

        <ds-card [pad]="true" elevation="xs">
          <h2 class="cc-card-title">Messages</h2>
          <app-conversation-thread #thread
            me="PROSPECT"
            [otherName]="c.ownerName"
            [messages]="c.messages"
            [initialMessage]="c.initialMessage"
            [closed]="c.closed"
            [sending]="sending()"
            [replyLabel]="'Écrire à ' + c.ownerName"
            [hint]="'Votre message sera signalé à ' + c.ownerName + '.'"
            (send)="send($event)">
          </app-conversation-thread>
        </ds-card>
        <p class="cc-legal">Gardez ce lien pour revenir à la conversation. Il est personnel : ne le partagez pas.</p>
      } @else if (loading()) {
        <ds-skeleton variant="heading" width="50%"></ds-skeleton>
        <ds-skeleton variant="rect" width="100%" height="320px"></ds-skeleton>
      } @else {
        <ds-card [pad]="true" elevation="sm">
          <div class="cc-invalid">
            <ds-icon name="alert-circle" [size]="32"></ds-icon>
            <h1 class="cc-card-title">Ce lien n'est plus valable</h1>
            <p class="cc-muted">Utilisez le lien du dernier message reçu, ou recontactez l'annonceur depuis son annonce.</p>
            <ds-button variant="ghost" routerLink="/recherche">Voir les annonces</ds-button>
          </div>
        </ds-card>
      }
    </div>
  `,
  styles: [`
    .cc-page { max-width: 760px; gap: var(--ds-space-6); }
    .cc-card-title { margin: 0 0 var(--ds-space-3); font-size: var(--ds-text-base); font-weight: 700; color: var(--ds-marine); }
    .cc-muted { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .cc-strong { font-weight: 600; color: var(--ds-text); }
    .cc-strong::first-letter { text-transform: uppercase; }
    .cc-slots { display: flex; flex-direction: column; gap: var(--ds-space-2); margin: 0; padding: 0; list-style: none; }
    .cc-slot { display: flex; align-items: center; gap: var(--ds-space-3); padding: var(--ds-space-3); border: 1px solid var(--ds-divider); border-radius: var(--ds-radius-md); color: var(--ds-marine); }
    .cc-slot__text { display: flex; flex-direction: column; flex: 1; min-width: 0; font-size: var(--ds-text-sm); }
    .cc-visit { display: flex; align-items: flex-start; gap: var(--ds-space-3); padding: var(--ds-space-4); border-radius: var(--ds-radius-md); background: var(--ds-success-hl); color: var(--ds-success); font-size: var(--ds-text-sm); }
    .cc-visit span { color: var(--ds-text); }
    .cc-legal { margin: 0; font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
    .cc-invalid { display: flex; flex-direction: column; align-items: center; gap: var(--ds-space-3); padding: var(--ds-space-4) 0; text-align: center; color: var(--ds-text-muted); }
  `],
})
export class ContactConversationComponent implements OnInit {
  private readonly api = inject(PortalConversationApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(DsToastService);

  @ViewChild('thread') private thread?: ConversationThreadComponent;

  readonly conv = signal<ProspectConversation | null>(null);
  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly accepting = signal<number | null>(null);
  private token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.api.view(this.token).subscribe({
      next: c => { this.conv.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  send(body: string): void {
    this.sending.set(true);
    this.api.send(this.token, body).subscribe({
      next: c => { this.sending.set(false); this.conv.set(c); this.thread?.clear(); },
      error: err => { this.sending.set(false); this.toast.error(serverMessage(err, 'Envoi impossible')); },
    });
  }

  accept(proposalId: number): void {
    this.accepting.set(proposalId);
    this.api.accept(this.token, proposalId).subscribe({
      next: c => { this.accepting.set(null); this.conv.set(c); this.toast.success('Visite confirmée'); },
      error: err => {
        this.accepting.set(null);
        this.toast.error(serverMessage(err, 'Ce créneau n’est plus disponible'));
        this.api.view(this.token).subscribe({ next: c => this.conv.set(c), error: () => undefined });
      },
    });
  }
}
