import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsDialogService,
  DsEmptyStateComponent,
  DsIconComponent,
  DsSkeletonComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import {
  MANDATE_STATUS,
  MANDATE_TYPE_LABELS,
  MandateView,
  MarketplaceThread,
  OwnerMandateApiService,
  OwnerProposal,
  OwnerRequest,
  PROPOSAL_STATUS,
  REQUEST_STATUS,
  SERVICE_LABELS,
  commissionLabel,
} from '../../services/mandate-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { ConversationThreadComponent, ThreadItem } from './conversation-thread.component';
import { OwnerAcceptDialogComponent } from './owner-accept-dialog.component';

/**
 * Demande d'accompagnement du propriétaire (UC-P5 à UC-P7) : propositions des agences côte à côte,
 * échanges avec chacune (coordonnées masquées avant acceptation), acceptation par code.
 */
@Component({
  selector: 'app-owner-request',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, DecimalPipe, RouterLink,
    DsBadgeComponent, DsButtonComponent, DsCardComponent, DsEmptyStateComponent, DsIconComponent,
    DsSkeletonComponent, PageHeaderComponent, ConversationThreadComponent,
  ],
  template: `
    <div class="pro-page ds-form-stack or-page">
      <nav class="or-breadcrumb" aria-label="Fil d'Ariane">
        <a routerLink="/proprietaire">Mon espace</a>
        <ds-icon name="chevron-right" [size]="16"></ds-icon>
        @if (req(); as r) {
          <a [routerLink]="['/proprietaire/biens', r.propertyId]">{{ r.propertyTitle || 'Mon bien' }}</a>
          <ds-icon name="chevron-right" [size]="16"></ds-icon>
        }
        <span aria-current="page">Accompagnement</span>
      </nav>

      @if (req(); as r) {
        <ds-page-header eyebrow="Confier à un agent" titleBefore="Propositions des" titleAccent="agences" [description]="intro()">
          <ng-container slot="actions">
            @if (r.canOpenToMarket) {
              <ds-button variant="marine" size="md" prefixIcon="megaphone" [disabled]="busy()" (dsClick)="openToMarket()">Ouvrir à toutes les agences</ds-button>
            }
            @if (r.status === 'MREQ_OPEN') {
              <ds-button variant="ghost" size="md" [disabled]="busy()" (dsClick)="cancel()">Annuler la demande</ds-button>
            }
          </ng-container>
        </ds-page-header>

        @for (m of r.mandates; track m.id) {
          <div class="or-mandate" role="status">
            <ds-icon name="check" [size]="20"></ds-icon>
            <div class="or-mandate__text">
              <span class="or-strong">{{ typeLabel(m.mandateType) }} confié à {{ m.agencyName }}</span>
              <span class="or-muted">{{ mandateStatus(m).label }} · {{ m.durationMonths }} mois · commission {{ commission(m) }}{{ m.signedAt ? ' · signé le ' + (m.signedAt | date: 'd MMM y') : '' }}</span>
            </div>
            <ds-badge [status]="mandateStatus(m).status">{{ mandateStatus(m).label }}</ds-badge>
          </div>
        }

        <div class="or-layout">
          <section class="or-proposals" aria-label="Propositions reçues">
            @if (!r.proposals.length) {
              <ds-card [pad]="true" elevation="xs">
                <ds-empty-state icon="inbox" title="Pas encore de proposition"
                  [description]="r.visibility === 'MREQ_DIRECT' ? (r.targetAgencyName + ' a 72 h pour vous répondre.') : 'Les agences vérifiées de ' + r.city + ' ont 14 jours pour vous faire une proposition.'"></ds-empty-state>
              </ds-card>
            }
            @for (p of r.proposals; track p.id) {
              <ds-card [pad]="true" elevation="xs" [class.or-card--on]="selected()?.id === p.id">
                <div class="or-card">
                  <div class="or-card__top">
                    <div class="or-card__who">
                      <span class="or-strong">{{ p.agencyName }}</span>
                      @if (p.agentName) { <span class="or-muted">{{ p.agentName }}</span> }
                    </div>
                    <ds-badge [status]="proposalStatus(p).status">{{ proposalStatus(p).label }}</ds-badge>
                  </div>
                  <dl class="or-facts">
                    <dt>Mandat</dt><dd>{{ typeLabel(p.mandateType) }}, {{ p.durationMonths }} mois</dd>
                    <dt>Commission</dt><dd>{{ commission(p) }}</dd>
                    @if (p.estimateMin || p.estimateMax) {
                      <dt>Estimation</dt><dd>{{ p.estimateMin | number: '1.0-0' }} – {{ p.estimateMax | number: '1.0-0' }} MAD</dd>
                    }
                    @if (p.services.length) {
                      <dt>Services</dt><dd>{{ services(p.services) }}</dd>
                    }
                  </dl>
                  @if (p.message) { <p class="or-message">{{ p.message }}</p> }
                  <div class="or-card__actions">
                    <ds-button variant="ghost" size="sm" prefixIcon="send" (dsClick)="openThread(p)">
                      Échanger{{ p.unread ? ' (' + p.unread + ')' : '' }}
                    </ds-button>
                    @if (pending(p)) {
                      @if (p.status === 'MPROP_SENT') {
                        <ds-button variant="ghost" size="sm" prefixIcon="star" [disabled]="busy()" (dsClick)="shortlist(p)">Présélectionner</ds-button>
                      }
                      <ds-button variant="ghost" size="sm" [disabled]="busy()" (dsClick)="decline(p)">Refuser</ds-button>
                      <ds-button variant="marine" size="sm" prefixIcon="check" [disabled]="busy()" (dsClick)="accept(p)">Accepter</ds-button>
                    }
                  </div>
                </div>
              </ds-card>
            }
          </section>

          <aside class="or-side">
            @if (selected(); as p) {
              <ds-card [pad]="true" elevation="xs">
                <h2 class="or-card-title">Échanges avec {{ p.agencyName }}</h2>
                @if (thread(); as t) {
                  @if (t.masked) {
                    <p class="or-hint"><ds-icon name="lock" [size]="16"></ds-icon> Téléphones et e-mails sont masqués jusqu'à ce que vous confiiez votre bien.</p>
                  }
                  <app-conversation-thread #threadCmp
                    me="OWNER"
                    [otherName]="p.agencyName"
                    [messages]="items()"
                    [closed]="t.closed"
                    [sending]="sending()"
                    [replyLabel]="'Écrire à ' + p.agencyName"
                    emptyText="Posez vos questions à l'agence avant de choisir."
                    (send)="send($event)">
                  </app-conversation-thread>
                } @else {
                  <ds-skeleton variant="rect" width="100%" height="160px"></ds-skeleton>
                }
              </ds-card>
            } @else {
              <ds-card [pad]="true" elevation="xs">
                <div class="ds-form-stack">
                  <h2 class="or-card-title">Votre demande</h2>
                  <dl class="or-facts">
                    <dt>Statut</dt><dd><ds-badge [status]="requestStatus(r).status">{{ requestStatus(r).label }}</ds-badge></dd>
                    <dt>Adressée à</dt><dd>{{ r.visibility === 'MREQ_DIRECT' ? r.targetAgencyName : 'Toutes les agences de ' + r.city }}</dd>
                    <dt>Mandat</dt><dd>{{ types(r) }}</dd>
                    @if (r.expectedPrice) { <dt>Prix souhaité</dt><dd>{{ r.expectedPrice | number: '1.0-0' }} MAD</dd> }
                    @if (r.expiresAt && r.status === 'MREQ_OPEN') { <dt>Jusqu'au</dt><dd>{{ r.expiresAt | date: 'd MMMM' }}</dd> }
                  </dl>
                  <p class="or-hint">Choisissez « Échanger » sur une proposition pour poser vos questions à l'agence.</p>
                </div>
              </ds-card>
            }
          </aside>
        </div>
      } @else if (loading()) {
        <ds-skeleton variant="heading" width="40%"></ds-skeleton>
        <ds-skeleton variant="rect" width="100%" height="320px"></ds-skeleton>
      } @else {
        <ds-card [pad]="true" elevation="xs"><p class="or-muted">Cette demande est introuvable.</p></ds-card>
      }
    </div>
  `,
  styles: [`
    .or-page { gap: var(--ds-space-6); }
    .or-breadcrumb { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-2); font-size: var(--ds-text-sm); color: var(--ds-text-faint); }
    .or-breadcrumb a { padding: 0; color: var(--ds-text-faint); text-decoration: none; }
    .or-breadcrumb a:hover, .or-breadcrumb a:focus-visible { color: var(--ds-marine); text-decoration: underline; }
    .or-breadcrumb span { color: var(--ds-marine); font-weight: 600; }
    .or-layout { display: grid; grid-template-columns: minmax(0, 3fr) minmax(300px, 2fr); gap: var(--ds-space-6); align-items: start; }
    @media (max-width: 1024px) { .or-layout { grid-template-columns: 1fr; } }
    .or-proposals, .or-side { display: flex; flex-direction: column; gap: var(--ds-space-4); }
    .or-card { display: flex; flex-direction: column; gap: var(--ds-space-3); }
    .or-card--on { outline: 2px solid var(--ds-marine); border-radius: var(--ds-radius-lg); }
    .or-card__top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ds-space-3); }
    .or-card__top ds-badge { flex: none; }
    .or-card__who { display: flex; flex-direction: column; min-width: 0; }
    .or-card__actions { display: flex; flex-wrap: wrap; gap: var(--ds-space-2); justify-content: flex-end; }
    .or-card-title { margin: 0 0 var(--ds-space-3); font-size: var(--ds-text-base); font-weight: 700; color: var(--ds-marine); }
    .or-strong { font-weight: 600; color: var(--ds-text); }
    .or-muted { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .or-hint { display: flex; gap: var(--ds-space-2); align-items: flex-start; margin: 0 0 var(--ds-space-3); font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .or-facts { display: grid; grid-template-columns: auto 1fr; gap: var(--ds-space-2) var(--ds-space-4); margin: 0; font-size: var(--ds-text-sm); }
    .or-facts dt { color: var(--ds-text-muted); }
    .or-facts dd { margin: 0; color: var(--ds-text); }
    .or-message { margin: 0; padding: var(--ds-space-3); border-radius: var(--ds-radius-md); background: var(--ds-surface-2); font-size: var(--ds-text-sm); white-space: pre-line; }
    .or-mandate { display: flex; align-items: center; gap: var(--ds-space-3); padding: var(--ds-space-4); border-radius: var(--ds-radius-md); background: var(--ds-success-hl); color: var(--ds-success); }
    .or-mandate__text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .or-mandate .or-strong { color: var(--ds-text); }
  `],
})
export class OwnerRequestComponent implements OnInit {
  private readonly api = inject(OwnerMandateApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(DsToastService);
  private readonly dialog = inject(DsDialogService);

  @ViewChild('threadCmp') private threadCmp?: ConversationThreadComponent;

  readonly req = signal<OwnerRequest | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly sending = signal(false);
  readonly selected = signal<OwnerProposal | null>(null);
  readonly thread = signal<MarketplaceThread | null>(null);
  readonly items = computed<ThreadItem[]>(() =>
    (this.thread()?.messages ?? []).map(m => ({ id: m.id, author: m.side, body: m.body, at: m.createdAt })));
  readonly intro = computed(() => {
    const r = this.req();
    if (!r) return null;
    const n = r.proposals.length;
    return n === 0 ? 'Les propositions arrivent ici : comparez-les, posez vos questions, puis choisissez.'
      : `${n} proposition${n > 1 ? 's' : ''} pour ${r.propertyTitle ?? 'votre bien'}. Comparez, échangez, puis choisissez.`;
  });

  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.reload();
  }

  typeLabel(t: string): string { return MANDATE_TYPE_LABELS[t] ?? t; }
  types(r: OwnerRequest): string { return r.mandateTypes.map(t => this.typeLabel(t)).join(' ou '); }
  commission(p: { commissionKind: string; commissionValue: number; commissionPayer: string }): string {
    return commissionLabel(p.commissionKind, p.commissionValue, p.commissionPayer);
  }
  services(list: string[]): string { return list.map(s => SERVICE_LABELS[s] ?? s).join(', '); }
  proposalStatus(p: OwnerProposal) { return PROPOSAL_STATUS[p.status] ?? { label: p.status, status: 'neutral' as const }; }
  requestStatus(r: OwnerRequest) { return REQUEST_STATUS[r.status] ?? { label: r.status, status: 'neutral' as const }; }
  mandateStatus(m: MandateView) { return MANDATE_STATUS[m.status] ?? { label: m.status, status: 'neutral' as const }; }

  /** Proposition encore acceptable (y compris une autre proposition simple après un premier mandat simple). */
  pending(p: OwnerProposal): boolean {
    const r = this.req();
    if (!r || (p.status !== 'MPROP_SENT' && p.status !== 'MPROP_SHORTLISTED')) return false;
    return r.status === 'MREQ_OPEN' || (r.status === 'MREQ_AWARDED' && p.mandateType === 'SIMPLE');
  }

  openThread(p: OwnerProposal): void {
    this.selected.set(p);
    this.thread.set(null);
    this.api.thread(p.id).subscribe({
      next: t => { this.thread.set(t); this.clearUnread(p.id); },
      error: err => this.toast.error(serverMessage(err, 'Impossible de charger les échanges')),
    });
  }

  send(body: string): void {
    const p = this.selected();
    if (!p) return;
    this.sending.set(true);
    this.api.send(p.id, body).subscribe({
      next: t => { this.sending.set(false); this.thread.set(t); this.threadCmp?.clear(); },
      error: err => { this.sending.set(false); this.toast.error(serverMessage(err, 'Envoi impossible')); },
    });
  }

  shortlist(p: OwnerProposal): void { this.run(this.api.shortlist(p.id), 'Proposition présélectionnée'); }
  decline(p: OwnerProposal): void { this.run(this.api.decline(p.id), 'Proposition refusée, l’agence est prévenue'); }
  cancel(): void { this.run(this.api.cancel(this.id), 'Demande annulée'); }
  openToMarket(): void { this.run(this.api.openToMarket(this.id), 'Demande ouverte à toutes les agences'); }

  accept(p: OwnerProposal): void {
    this.dialog.open<MandateView>(OwnerAcceptDialogComponent, { data: p, width: '520px' })
      .closed.subscribe(m => { if (m) this.reload(); });
  }

  private run(call: ReturnType<OwnerMandateApiService['cancel']>, done: string): void {
    this.busy.set(true);
    call.subscribe({
      next: r => { this.busy.set(false); this.req.set(r); this.toast.success(done); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Action impossible')); },
    });
  }

  private clearUnread(proposalId: number): void {
    const r = this.req();
    if (!r) return;
    this.req.set({ ...r, proposals: r.proposals.map(x => x.id === proposalId ? { ...x, unread: 0 } : x) });
  }

  private reload(): void {
    this.api.request(this.id).subscribe({
      next: r => { this.req.set(r); this.loading.set(false); },
      error: err => { this.loading.set(false); if (err?.status !== 404) this.toast.error(serverMessage(err, 'Impossible de charger la demande')); },
    });
  }
}
