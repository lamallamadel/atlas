import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsDialogService,
  DsIconComponent,
  DsSelectComponent,
  DsSkeletonComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import type { DsSelectOption } from '../../design-system';
import { OwnerApiService, OwnerConversation } from '../../services/owner-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { ConversationThreadComponent } from './conversation-thread.component';
import { OwnerVisitDialogComponent } from './owner-visit-dialog.component';

/**
 * Un contact reçu par le propriétaire (UC-P4) : échanges par la plateforme, créneaux de visite,
 * statut simplifié. Le prospect est prévenu par WhatsApp ou e-mail à chaque réponse.
 */
@Component({
  selector: 'app-owner-lead',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, FormsModule, RouterLink,
    DsBadgeComponent, DsButtonComponent, DsCardComponent, DsIconComponent, DsSelectComponent,
    DsSkeletonComponent, PageHeaderComponent, ConversationThreadComponent,
  ],
  template: `
    <div class="pro-page ds-form-stack ol-page">
      <nav class="ol-breadcrumb" aria-label="Fil d'Ariane">
        <a routerLink="/proprietaire">Mon espace</a>
        <ds-icon name="chevron-right" [size]="16"></ds-icon>
        <span aria-current="page">{{ conv()?.prospectName || 'Contact' }}</span>
      </nav>

      @if (conv(); as c) {
        <ds-page-header eyebrow="Contact" [titleBefore]="c.prospectName || 'Visiteur'" [description]="c.annonceTitle ? 'Au sujet de « ' + c.annonceTitle + ' »' : null">
          <ng-container slot="actions">
            @if (!c.closed) {
              <ds-button variant="marine" size="md" prefixIcon="calendar" (dsClick)="proposeVisit(c)">Proposer une visite</ds-button>
            }
          </ng-container>
        </ds-page-header>

        <div class="ol-layout">
          <ds-card [pad]="true" elevation="xs">
            <h2 class="ol-card-title">Échanges</h2>
            <app-conversation-thread #thread
              me="OWNER"
              [otherName]="c.prospectName || 'le visiteur'"
              [messages]="c.messages"
              [initialMessage]="c.initialMessage"
              [closed]="c.closed"
              [sending]="sending()"
              replyLabel="Répondre"
              hint="Le visiteur est prévenu par WhatsApp ou e-mail."
              emptyText="Répondez à sa demande : il recevra un lien pour vous lire et vous répondre."
              (send)="send($event)">
            </app-conversation-thread>
          </ds-card>

          <aside class="ol-side">
            <ds-card [pad]="true" elevation="xs">
              <div class="ds-form-stack">
                <h2 class="ol-card-title">Statut</h2>
                @if (statusOptions().length > 1) {
                  <ds-select [ariaLabelSelect]="'Statut du contact'" [options]="statusOptions()" [ngModel]="c.statusCode" (ngModelChange)="changeStatus($event)" [disabled]="busy()"></ds-select>
                } @else {
                  <div><ds-badge [status]="c.statusCode === 'CRM_CLOSED_WON' ? 'won' : 'neutral'">{{ c.statusLabel }}</ds-badge></div>
                }
                <dl class="ol-facts">
                  @if (c.prospectPhone) {
                    <dt><ds-icon name="phone" [size]="16"></ds-icon><span class="ol-sr">Téléphone</span></dt>
                    <dd><a class="ol-link" [href]="'tel:' + c.prospectPhone">{{ c.prospectPhone }}</a></dd>
                  }
                  @if (c.prospectEmail) {
                    <dt><ds-icon name="mail" [size]="16"></ds-icon><span class="ol-sr">E-mail</span></dt>
                    <dd><a class="ol-link" [href]="'mailto:' + c.prospectEmail">{{ c.prospectEmail }}</a></dd>
                  }
                </dl>
              </div>
            </ds-card>

            <ds-card [pad]="true" elevation="xs">
              <div class="ds-form-stack">
                <h2 class="ol-card-title">Visite</h2>
                @for (v of c.visits; track v.id) {
                  <div class="ol-visit">
                    <ds-icon name="calendar" [size]="20"></ds-icon>
                    <div class="ol-visit__text">
                      <span class="ol-strong">{{ v.start | date: 'EEEE d MMMM' }}</span>
                      <span class="ol-muted">{{ v.start | date: 'HH:mm' }} – {{ v.end | date: 'HH:mm' }}</span>
                    </div>
                    <ds-button variant="ghost" size="sm" [disabled]="busy()" (dsClick)="cancelVisit(v.id)">Annuler</ds-button>
                  </div>
                }
                @if (c.proposals.length) {
                  <p class="ol-subtitle">En attente de son choix</p>
                  <ul class="ol-slots" role="list">
                    @for (s of c.proposals; track s.id) {
                      <li><ds-icon name="clock" [size]="16"></ds-icon> {{ s.start | date: 'EEE d MMM, HH:mm' }} – {{ s.end | date: 'HH:mm' }}</li>
                    }
                  </ul>
                  <div><ds-button variant="ghost" size="sm" [disabled]="busy()" (dsClick)="withdraw()">Retirer les créneaux</ds-button></div>
                }
                @if (!c.visits.length && !c.proposals.length) {
                  <p class="ol-muted">Aucune visite prévue. Proposez jusqu'à 3 créneaux : le visiteur choisit celui qui lui convient.</p>
                }
              </div>
            </ds-card>
          </aside>
        </div>
      } @else if (loading()) {
        <ds-skeleton variant="heading" width="40%"></ds-skeleton>
        <ds-skeleton variant="rect" width="100%" height="320px"></ds-skeleton>
      } @else {
        <ds-card [pad]="true" elevation="xs"><p class="ol-muted">Ce contact est introuvable.</p></ds-card>
      }
    </div>
  `,
  styles: [`
    .ol-page { gap: var(--ds-space-6); }
    .ol-breadcrumb { display: flex; align-items: center; gap: var(--ds-space-2); font-size: var(--ds-text-sm); color: var(--ds-text-faint); }
    .ol-breadcrumb a { padding: 0; color: var(--ds-text-faint); text-decoration: none; }
    .ol-breadcrumb a:hover, .ol-breadcrumb a:focus-visible { color: var(--ds-marine); text-decoration: underline; }
    .ol-breadcrumb span { color: var(--ds-marine); font-weight: 600; }
    .ol-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: var(--ds-space-6); align-items: start; }
    @media (max-width: 960px) { .ol-layout { grid-template-columns: 1fr; } }
    .ol-side { display: flex; flex-direction: column; gap: var(--ds-space-6); }
    .ol-card-title { margin: 0 0 var(--ds-space-3); font-size: var(--ds-text-base); font-weight: 700; color: var(--ds-marine); }
    .ol-side .ol-card-title { margin: 0; }
    .ol-muted { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .ol-strong { font-weight: 600; color: var(--ds-text); }
    .ol-strong::first-letter { text-transform: uppercase; }
    .ol-subtitle { margin: 0; font-size: var(--ds-text-sm); font-weight: 600; color: var(--ds-text); }
    .ol-facts { display: grid; grid-template-columns: auto 1fr; gap: var(--ds-space-2) var(--ds-space-3); align-items: center; margin: 0; font-size: var(--ds-text-sm); }
    .ol-facts dt { display: inline-flex; color: var(--ds-text-muted); }
    .ol-facts dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
    .ol-link { display: inline; padding: 0; color: var(--ds-marine); }
    .ol-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    .ol-visit { display: flex; align-items: center; gap: var(--ds-space-3); padding: var(--ds-space-3); border-radius: var(--ds-radius-md); background: var(--ds-success-hl); color: var(--ds-success); }
    .ol-visit__text { display: flex; flex-direction: column; flex: 1; min-width: 0; font-size: var(--ds-text-sm); }
    .ol-slots { display: flex; flex-direction: column; gap: var(--ds-space-1); margin: 0; padding: 0; list-style: none; font-size: var(--ds-text-sm); color: var(--ds-text); }
    .ol-slots li { display: flex; align-items: center; gap: var(--ds-space-2); }
  `],
})
export class OwnerLeadComponent implements OnInit {
  private readonly api = inject(OwnerApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(DsToastService);
  private readonly dialog = inject(DsDialogService);

  @ViewChild('thread') private thread?: ConversationThreadComponent;

  readonly conv = signal<OwnerConversation | null>(null);
  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly busy = signal(false);
  readonly statusOptions = computed<DsSelectOption[]>(() => {
    const c = this.conv();
    return c ? [{ value: c.statusCode, label: c.statusLabel }, ...c.next.map(o => ({ value: o.code, label: o.label }))] : [];
  });

  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.conversation(this.id).subscribe({
      next: c => { this.conv.set(c); this.loading.set(false); },
      error: err => { this.loading.set(false); if (err?.status !== 404) this.toast.error(serverMessage(err, 'Impossible de charger le contact')); },
    });
  }

  send(body: string): void {
    this.sending.set(true);
    this.api.sendMessage(this.id, body).subscribe({
      next: c => { this.sending.set(false); this.conv.set(c); this.thread?.clear(); },
      error: err => { this.sending.set(false); this.toast.error(serverMessage(err, 'Envoi impossible')); },
    });
  }

  proposeVisit(c: OwnerConversation): void {
    this.dialog.open<OwnerConversation>(OwnerVisitDialogComponent, { data: { leadId: c.leadId, prospectName: c.prospectName }, width: '560px' })
      .closed.subscribe(updated => { if (updated) this.conv.set(updated); });
  }

  withdraw(): void {
    this.run(this.api.withdrawProposals(this.id), 'Créneaux retirés');
  }

  cancelVisit(visitId: number): void {
    this.run(this.api.cancelVisit(this.id, visitId), 'Visite annulée, le visiteur est prévenu');
  }

  changeStatus(code: string): void {
    const c = this.conv();
    if (!c || code === c.statusCode) return;
    this.busy.set(true);
    this.api.changeLeadStatus(this.id, code).subscribe({
      next: () => this.reload(),
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Changement impossible')); this.reload(); },
    });
  }

  private run(call: ReturnType<OwnerApiService['withdrawProposals']>, done: string): void {
    this.busy.set(true);
    call.subscribe({
      next: c => { this.busy.set(false); this.conv.set(c); this.toast.success(done); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Action impossible')); },
    });
  }

  private reload(): void {
    this.api.conversation(this.id).subscribe({
      next: c => { this.busy.set(false); this.conv.set(c); },
      error: () => this.busy.set(false),
    });
  }
}
