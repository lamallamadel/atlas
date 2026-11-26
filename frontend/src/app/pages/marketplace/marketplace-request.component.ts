import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsCheckboxComponent,
  DsIconComponent,
  DsInputComponent,
  DsSelectComponent,
  DsSkeletonComponent,
  DsTextareaComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import type { DsSelectOption } from '../../design-system';
import { AgencyRequest, MarketplaceApiService, ProposalCreate } from '../../services/marketplace-api.service';
import { MANDATE_TYPE_LABELS, MarketplaceThread, PROPOSAL_STATUS, SERVICE_LABELS, commissionLabel } from '../../services/mandate-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { ConversationThreadComponent, ThreadItem } from '../owner/conversation-thread.component';

/**
 * Demande d'un propriétaire vue par l'agence (fiche anonymisée), proposition et échanges
 * (UC-P6, UC-P7). L'adresse et le téléphone n'apparaissent qu'une fois le mandat confié.
 */
@Component({
  selector: 'app-marketplace-request',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, DecimalPipe, FormsModule, RouterLink,
    DsBadgeComponent, DsButtonComponent, DsCardComponent, DsCheckboxComponent, DsIconComponent, DsInputComponent,
    DsSelectComponent, DsSkeletonComponent, DsTextareaComponent, PageHeaderComponent, ConversationThreadComponent,
  ],
  template: `
    <div class="pro-page ds-form-stack mr-page">
      <nav class="mr-breadcrumb" aria-label="Fil d'Ariane">
        <a routerLink="/pro/mandats">Bourse aux mandats</a>
        <ds-icon name="chevron-right" [size]="16"></ds-icon>
        <span aria-current="page">Demande</span>
      </nav>

      @if (req(); as r) {
        <ds-page-header [eyebrow]="r.direct ? 'Demande directe' : 'Bourse'" [titleBefore]="(r.objective === 'RENT' ? 'Location' : 'Vente') + ' à'" [titleAccent]="r.district ? r.district : r.city"
          [description]="r.ownerName + ' · ' + (r.propertyType || 'bien') + (r.surface ? ', ' + r.surface + ' m²' : '') + (r.rooms ? ', ' + r.rooms + ' pièces' : '')">
          <ng-container slot="actions">
            @if (r.direct && r.canPropose && !r.myProposal) {
              <ds-button variant="ghost" size="md" [disabled]="busy()" (dsClick)="declineDirect()">Je ne peux pas</ds-button>
            }
          </ng-container>
        </ds-page-header>

        <div class="mr-layout">
          <ds-card [pad]="true" elevation="xs">
            <div class="ds-form-stack">
              <h2 class="mr-card-title">La demande</h2>
              <dl class="mr-facts">
                <dt>Ville</dt><dd>{{ r.district ? r.district + ', ' : '' }}{{ r.city }}</dd>
                <dt>Prix souhaité</dt><dd>{{ r.expectedPrice ? (r.expectedPrice | number: '1.0-0') + ' MAD' : '—' }}</dd>
                <dt>Mandat accepté</dt><dd>{{ types(r) }}</dd>
                @if (r.deadline) { <dt>Échéance</dt><dd>{{ deadline(r.deadline) }}</dd> }
                @if (r.services.length) { <dt>Services</dt><dd>{{ services(r.services) }}</dd> }
                @if (r.availability) { <dt>Disponibilités</dt><dd>{{ r.availability }}</dd> }
                @if (r.languages) { <dt>Langues</dt><dd>{{ r.languages }}</dd> }
                @if (r.commissionNote) { <dt>Commission attendue</dt><dd>{{ r.commissionNote }}</dd> }
                @if (r.expiresAt && r.status === 'MREQ_OPEN') { <dt>Ouverte jusqu’au</dt><dd>{{ r.expiresAt | date: 'd MMMM' }}</dd> }
              </dl>
              @if (r.message) { <p class="mr-message">{{ r.message }}</p> }
              <p class="mr-hint"><ds-icon name="lock" [size]="16"></ds-icon> Adresse et téléphone vous seront transmis si le propriétaire vous confie son bien.</p>
            </div>
          </ds-card>

          <aside class="mr-side">
            @if (r.myProposal; as p) {
              <ds-card [pad]="true" elevation="xs">
                <div class="ds-form-stack">
                  <div class="mr-row">
                    <h2 class="mr-card-title mr-grow">Votre proposition</h2>
                    <ds-badge [status]="proposalStatus(p.status).status">{{ proposalStatus(p.status).label }}</ds-badge>
                  </div>
                  <dl class="mr-facts">
                    <dt>Mandat</dt><dd>{{ typeLabel(p.mandateType) }}, {{ p.durationMonths }} mois</dd>
                    <dt>Commission</dt><dd>{{ commission(p.commissionKind, p.commissionValue, p.commissionPayer) }}</dd>
                    @if (p.estimateMin || p.estimateMax) { <dt>Estimation</dt><dd>{{ p.estimateMin | number: '1.0-0' }} – {{ p.estimateMax | number: '1.0-0' }} MAD</dd> }
                  </dl>
                  @if (p.mandateId) {
                    <ds-button variant="marine" size="md" prefixIcon="check" routerLink="/pro/mandats">Mandat obtenu : voir mes mandats</ds-button>
                  } @else if (p.status === 'MPROP_SENT' || p.status === 'MPROP_SHORTLISTED') {
                    <div><ds-button variant="ghost" size="sm" [disabled]="busy()" (dsClick)="withdraw(p.id)">Retirer la proposition</ds-button></div>
                  }
                </div>
              </ds-card>
              <ds-card [pad]="true" elevation="xs">
                <h2 class="mr-card-title mr-card-title--spaced">Échanges avec {{ r.ownerName }}</h2>
                @if (thread(); as t) {
                  @if (t.masked) {
                    <p class="mr-hint mr-hint--top"><ds-icon name="lock" [size]="16"></ds-icon> Téléphones, e-mails et liens WhatsApp sont masqués tant que le propriétaire n'a pas choisi.</p>
                  }
                  <app-conversation-thread #threadCmp
                    me="AGENCY"
                    [otherName]="r.ownerName"
                    [messages]="items()"
                    [closed]="t.closed"
                    [sending]="sending()"
                    replyLabel="Écrire au propriétaire"
                    emptyText="Présentez-vous et répondez à ses questions."
                    (send)="send($event)">
                  </app-conversation-thread>
                } @else {
                  <ds-skeleton variant="rect" width="100%" height="140px"></ds-skeleton>
                }
              </ds-card>
            } @else if (r.canPropose) {
              <ds-card [pad]="true" elevation="xs">
                <form class="ds-form-stack" #f="ngForm" (ngSubmit)="propose(r)">
                  <h2 class="mr-card-title">Faire une proposition</h2>
                  <div class="mr-grid">
                    <ds-select label="Mandat" name="type" [options]="typeOptions()" [(ngModel)]="form.mandateType" required></ds-select>
                    <ds-select label="Durée" name="duration" [options]="durations" [(ngModel)]="duration"></ds-select>
                  </div>
                  <div class="mr-grid">
                    <ds-select label="Commission" name="kind" [options]="kinds" [(ngModel)]="form.commissionKind"></ds-select>
                    <ds-input [label]="form.commissionKind === 'PERCENT' ? 'Taux (%)' : 'Montant (MAD)'" name="value" type="number" [(ngModel)]="commissionValue" required></ds-input>
                  </div>
                  <ds-select label="Payée par" name="payer" [options]="payers" [(ngModel)]="form.commissionPayer"></ds-select>
                  <fieldset class="mr-services">
                    <legend class="mr-legend">Services inclus</legend>
                    @for (s of serviceKeys; track s) {
                      <ds-checkbox [name]="'svc-' + s" [label]="labels[s]" [ngModel]="selectedServices.has(s)" (ngModelChange)="toggle(s, $event)"></ds-checkbox>
                    }
                  </fieldset>
                  <div class="mr-grid">
                    <ds-input label="Estimation basse (MAD)" name="min" type="number" [(ngModel)]="estimateMin"></ds-input>
                    <ds-input label="Estimation haute (MAD)" name="max" type="number" [(ngModel)]="estimateMax"></ds-input>
                  </div>
                  <ds-textarea label="Message au propriétaire" name="message" [rows]="4" [maxLength]="2000" [(ngModel)]="message"
                    placeholder="Votre connaissance du quartier, votre méthode, vos références"></ds-textarea>
                  <div class="mr-actions">
                    <ds-button variant="marine" nativeType="submit" prefixIcon="send" [loading]="busy()" [disabled]="busy() || !commissionValue">Envoyer la proposition</ds-button>
                  </div>
                </form>
              </ds-card>
            } @else {
              <ds-card [pad]="true" elevation="xs">
                <p class="mr-muted">{{ reason(r) }}</p>
              </ds-card>
            }
          </aside>
        </div>
      } @else if (loading()) {
        <ds-skeleton variant="heading" width="40%"></ds-skeleton>
        <ds-skeleton variant="rect" width="100%" height="320px"></ds-skeleton>
      } @else {
        <ds-card [pad]="true" elevation="xs"><p class="mr-muted">Cette demande n'est pas accessible à votre agence.</p></ds-card>
      }
    </div>
  `,
  styles: [`
    .mr-page { gap: var(--ds-space-6); }
    .mr-breadcrumb { display: flex; align-items: center; gap: var(--ds-space-2); font-size: var(--ds-text-sm); color: var(--ds-text-faint); }
    .mr-breadcrumb a { padding: 0; color: var(--ds-text-faint); text-decoration: none; }
    .mr-breadcrumb a:hover, .mr-breadcrumb a:focus-visible { color: var(--ds-marine); text-decoration: underline; }
    .mr-breadcrumb span { color: var(--ds-marine); font-weight: 600; }
    .mr-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(340px, 1fr); gap: var(--ds-space-6); align-items: start; }
    @media (max-width: 1024px) { .mr-layout { grid-template-columns: 1fr; } }
    .mr-side { display: flex; flex-direction: column; gap: var(--ds-space-6); }
    .mr-card-title { margin: 0; font-size: var(--ds-text-base); font-weight: 700; color: var(--ds-marine); }
    .mr-card-title--spaced { margin-bottom: var(--ds-space-3); }
    .mr-row { display: flex; align-items: center; gap: var(--ds-space-3); }
    .mr-grow { flex: 1; }
    .mr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ds-space-3); }
    .mr-facts { display: grid; grid-template-columns: auto 1fr; gap: var(--ds-space-2) var(--ds-space-4); margin: 0; font-size: var(--ds-text-sm); }
    .mr-facts dt { color: var(--ds-text-muted); }
    .mr-facts dd { margin: 0; color: var(--ds-text); }
    .mr-message { margin: 0; padding: var(--ds-space-3); border-radius: var(--ds-radius-md); background: var(--ds-surface-2); font-size: var(--ds-text-sm); white-space: pre-line; }
    .mr-hint { display: flex; gap: var(--ds-space-2); align-items: flex-start; margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .mr-hint--top { margin-bottom: var(--ds-space-3); }
    .mr-muted { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .mr-services { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ds-space-2); margin: 0; padding: 0; border: 0; }
    .mr-legend { grid-column: 1 / -1; margin-bottom: var(--ds-space-1); padding: 0; font-size: var(--ds-text-xs); font-weight: 600; color: var(--ds-text-muted); letter-spacing: 1.2px; text-transform: uppercase; }
    .mr-actions { display: flex; justify-content: flex-end; }
  `],
})
export class MarketplaceRequestComponent implements OnInit {
  private readonly api = inject(MarketplaceApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(DsToastService);

  @ViewChild('threadCmp') private threadCmp?: ConversationThreadComponent;

  readonly req = signal<AgencyRequest | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly sending = signal(false);
  readonly thread = signal<MarketplaceThread | null>(null);
  readonly items = computed<ThreadItem[]>(() =>
    (this.thread()?.messages ?? []).map(m => ({ id: m.id, author: m.side, body: m.body, at: m.createdAt })));
  readonly typeOptions = computed<DsSelectOption[]>(() =>
    (this.req()?.mandateTypes ?? []).map(t => ({ value: t, label: MANDATE_TYPE_LABELS[t] ?? t })));

  readonly labels = SERVICE_LABELS;
  readonly serviceKeys = Object.keys(SERVICE_LABELS);
  readonly durations: DsSelectOption[] = [1, 2, 3, 6, 9, 12].map(n => ({ value: String(n), label: `${n} mois` }));
  readonly kinds: DsSelectOption[] = [{ value: 'PERCENT', label: 'Pourcentage du prix' }, { value: 'FLAT', label: 'Forfait' }];
  readonly payers: DsSelectOption[] = [{ value: 'SELLER', label: 'Le propriétaire' }, { value: 'BUYER', label: 'L’acquéreur' }, { value: 'SHARED', label: 'Les deux' }];

  form: Pick<ProposalCreate, 'mandateType' | 'commissionKind' | 'commissionPayer'> = { mandateType: 'SIMPLE', commissionKind: 'PERCENT', commissionPayer: 'SELLER' };
  duration = '3';
  commissionValue: number | null = 2.5;
  estimateMin: number | null = null;
  estimateMax: number | null = null;
  message = '';
  selectedServices = new Set<string>(['PHOTOS', 'VISITS', 'NEGOTIATION']);

  private id = 0;

  ngOnInit(): void {
    const proposalId = this.route.snapshot.paramMap.get('proposalId');
    if (proposalId) {
      // Lien d'une notification : on retrouve la demande de la proposition.
      this.api.proposal(Number(proposalId)).subscribe({
        next: p => this.router.navigate(['/pro/mandats/demandes', p.requestId], { replaceUrl: true }),
        error: () => this.loading.set(false),
      });
      return;
    }
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  typeLabel(t: string): string { return MANDATE_TYPE_LABELS[t] ?? t; }
  types(r: AgencyRequest): string { return r.mandateTypes.map(t => this.typeLabel(t)).join(' ou '); }
  services(list: string[]): string { return list.map(s => SERVICE_LABELS[s] ?? s).join(', '); }
  commission(kind: string, value: number, payer: string): string { return commissionLabel(kind, value, payer); }
  proposalStatus(s: string) { return PROPOSAL_STATUS[s] ?? { label: s, status: 'neutral' as const }; }
  deadline(d: string): string {
    return ({ ASAP: 'Dès que possible', '3_MONTHS': 'Sous 3 mois', '6_MONTHS': 'Sous 6 mois', FLEXIBLE: 'Pas pressé' } as Record<string, string>)[d] ?? d;
  }

  /** Raison lisible du refus de proposer (« CODE: texte » côté serveur). */
  reason(r: AgencyRequest): string {
    const raw = r.cannotProposeReason ?? '';
    const i = raw.indexOf(': ');
    return i > 0 ? raw.slice(i + 2) : raw || 'Cette demande n’accepte plus de proposition.';
  }

  toggle(key: string, on: boolean): void {
    const next = new Set(this.selectedServices);
    if (on) next.add(key); else next.delete(key);
    this.selectedServices = next;
  }

  propose(r: AgencyRequest): void {
    if (this.busy() || !this.commissionValue) return;
    this.busy.set(true);
    this.api.propose(r.id, {
      mandateType: this.form.mandateType,
      durationMonths: Number(this.duration),
      commissionKind: this.form.commissionKind,
      commissionValue: Number(this.commissionValue),
      commissionPayer: this.form.commissionPayer,
      services: [...this.selectedServices],
      estimateMin: this.estimateMin ? Number(this.estimateMin) : null,
      estimateMax: this.estimateMax ? Number(this.estimateMax) : null,
      message: this.message || null,
    }).subscribe({
      next: updated => { this.busy.set(false); this.setRequest(updated); this.toast.success('Proposition envoyée : le propriétaire est prévenu'); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Envoi impossible')); },
    });
  }

  withdraw(proposalId: number): void {
    this.busy.set(true);
    this.api.withdraw(proposalId).subscribe({
      next: () => { this.busy.set(false); this.toast.success('Proposition retirée'); this.load(); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Action impossible')); },
    });
  }

  declineDirect(): void {
    this.busy.set(true);
    this.api.declineDirect(this.id).subscribe({
      next: r => { this.busy.set(false); this.req.set(r); this.toast.success('Le propriétaire est prévenu'); this.router.navigate(['/pro/mandats']); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Action impossible')); },
    });
  }

  send(body: string): void {
    const p = this.req()?.myProposal;
    if (!p) return;
    this.sending.set(true);
    this.api.send(p.id, body).subscribe({
      next: t => { this.sending.set(false); this.thread.set(t); this.threadCmp?.clear(); },
      error: err => { this.sending.set(false); this.toast.error(serverMessage(err, 'Envoi impossible')); },
    });
  }

  private load(): void {
    this.api.request(this.id).subscribe({
      next: r => { this.loading.set(false); this.setRequest(r); },
      error: () => this.loading.set(false),
    });
  }

  private setRequest(r: AgencyRequest): void {
    this.req.set(r);
    if (r.mandateTypes.length && !r.mandateTypes.includes(this.form.mandateType)) {
      this.form = { ...this.form, mandateType: r.mandateTypes[0] };
    }
    if (r.myProposal) {
      this.api.thread(r.myProposal.id).subscribe({ next: t => this.thread.set(t), error: () => undefined });
    }
  }
}
