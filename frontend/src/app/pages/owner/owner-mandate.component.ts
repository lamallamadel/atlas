import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsDialogService,
  DsEmptyStateComponent,
  DsIconComponent,
  DsRadioGroupComponent,
  DsRadioOption,
  DsSkeletonComponent,
  DsTextareaComponent,
  DsTimelineEvent,
  DsToastService,
  PageHeaderComponent,
  TimelineComponent,
} from '../../design-system';
import {
  END_REASON_LABELS,
  MANDATE_STATUS,
  MANDATE_TYPE_LABELS,
  MandateFollowUp,
  MandateOffer,
  OFFER_STATUS,
  OwnerMandateApiService,
  commissionLabel,
  madLabel,
} from '../../services/mandate-api.service';
import { OfferDialogData, OfferDialogResult, OwnerOfferDialogComponent } from './owner-offer-dialog.component';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { EndMandateDialogData, OwnerEndMandateDialogComponent } from './owner-end-mandate-dialog.component';

const EVENT_TITLES: Record<string, string> = {
  NOTE: 'Point de l\'agence',
  STATUS_CHANGE: 'Avancement',
  APPOINTMENT_CREATED: 'Visite prévue',
  APPOINTMENT_SCHEDULED: 'Visite prévue',
  APPOINTMENT_CONFIRMED: 'Visite confirmée',
  APPOINTMENT_COMPLETED: 'Visite faite',
  APPOINTMENT_CANCELLED_BY_CLIENT: 'Visite annulée',
  APPOINTMENT_RESCHEDULED_BY_CLIENT: 'Visite déplacée',
  MESSAGE_SENT: 'Message',
};

const LISTING_STATUS: Record<string, { label: string; status: 'info' | 'warning' | 'success' | 'neutral' }> = {
  PUBLISHED: { label: 'En ligne', status: 'success' },
  DRAFT: { label: 'En préparation', status: 'info' },
  SUSPENDED: { label: 'Retirée', status: 'neutral' },
  ARCHIVED: { label: 'Archivée', status: 'neutral' },
};

/**
 * Suivi du mandat par le propriétaire (UC-P8, UC-P9) : ce que l'agence partage, ses annonces et
 * les contacts reçus, la fin du mandat avec un motif, puis l'avis vérifié.
 */
@Component({
  selector: 'app-owner-mandate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, FormsModule, RouterLink,
    DsBadgeComponent, DsButtonComponent, DsCardComponent, DsEmptyStateComponent, DsIconComponent,
    DsRadioGroupComponent, DsSkeletonComponent, DsTextareaComponent, PageHeaderComponent, TimelineComponent,
  ],
  template: `
    <div class="pro-page ds-form-stack om-page">
      <nav class="om-breadcrumb" aria-label="Fil d'Ariane">
        <a routerLink="/proprietaire">Mon espace</a>
        <ds-icon name="chevron-right" [size]="16"></ds-icon>
        @if (f(); as x) {
          <a [routerLink]="['/proprietaire/biens', x.mandate.propertyId]">{{ x.propertyTitle || 'Mon bien' }}</a>
          <ds-icon name="chevron-right" [size]="16"></ds-icon>
        }
        <span aria-current="page">Mandat</span>
      </nav>

      @if (f(); as x) {
        <ds-page-header eyebrow="Suivi du mandat" titleBefore="Confié à" [titleAccent]="x.mandate.agencyName" [description]="summary()">
          <ng-container slot="actions">
            @if (x.requestId) {
              <ds-button variant="ghost" size="md" prefixIcon="send" [routerLink]="['/proprietaire/demandes', x.requestId]">Échanges avec l'agence</ds-button>
            }
            @if (x.canEnd) {
              <ds-button variant="ghost" size="md" [disabled]="busy()" (dsClick)="end()">Terminer le mandat</ds-button>
            }
          </ng-container>
        </ds-page-header>

        @if (x.mandate.status === 'MANDATE_PENDING_SIGNATURE') {
          <p class="om-banner om-banner--warning" role="status">
            <ds-icon name="clock" [size]="16"></ds-icon>
            <span>{{ x.mandate.agencyName }} doit vous faire signer le mandat avant le {{ signatureDeadline() | date: 'd MMMM' }}. Sans signature, il prend fin de lui-même.</span>
          </p>
        }

        <div class="om-layout">
          <div class="om-main">
            @if (x.offers.length) {
              <ds-card [pad]="true" elevation="xs">
                <h2 class="om-card-title">Offres reçues</h2>
                <ul class="om-offers" role="list">
                  @for (o of x.offers; track o.id) {
                    <li class="om-offer" [class.om-offer--pending]="o.status === 'OFFER_PENDING'">
                      <div class="om-offer__head">
                        <span class="om-offer__amount">{{ mad(o.amount) }}</span>
                        <ds-badge [status]="offerStatus(o).status">{{ offerStatus(o).label }}</ds-badge>
                      </div>
                      @if (o.buyerSummary) { <span class="om-strong">{{ o.buyerSummary }}</span> }
                      @if (o.conditions) { <span class="om-muted om-pre">{{ o.conditions }}</span> }
                      <span class="om-muted">Reçue le {{ o.createdAt | date: 'd MMMM' }}{{ o.validUntil ? ' · valable jusqu\\'au ' + (o.validUntil | date: 'd MMMM') : '' }}</span>
                      @if (o.status === 'OFFER_COUNTERED') {
                        <span class="om-muted">Votre contre-proposition : <strong>{{ mad(o.counterAmount) }}</strong></span>
                      }
                      @if (o.ownerComment) { <p class="om-quote">{{ o.ownerComment }}</p> }
                      @if (o.status === 'OFFER_PENDING' && x.mandate.status === 'MANDATE_ACTIVE') {
                        <div class="om-actions">
                          <ds-button variant="marine" size="sm" [disabled]="busy()" (dsClick)="answer(o)">Répondre</ds-button>
                        </div>
                      }
                    </li>
                  }
                </ul>
              </ds-card>
            }

            <ds-card [pad]="true" elevation="xs">
              <h2 class="om-card-title">Ce que l'agence partage avec vous</h2>
              @if (timeline().length) {
                <ds-timeline [events]="timeline()"></ds-timeline>
              } @else {
                <ds-empty-state icon="calendar" title="Rien de partagé pour l'instant"
                  description="Visites, retours des acquéreurs et offres apparaissent ici dès que l'agence les partage avec vous."></ds-empty-state>
              }
            </ds-card>

            <ds-card [pad]="true" elevation="xs">
              <h2 class="om-card-title">Annonces de l'agence</h2>
              @if (x.listings.length) {
                <ul class="om-listings" role="list">
                  @for (l of x.listings; track l.annonceId) {
                    <li class="om-listing">
                      <div class="om-listing__text">
                        <span class="om-strong">{{ l.title || 'Annonce n°' + l.annonceId }}</span>
                        <span class="om-muted">{{ l.contacts }} contact{{ l.contacts > 1 ? 's' : '' }} reçu{{ l.contacts > 1 ? 's' : '' }}</span>
                      </div>
                      <ds-badge [status]="listingStatus(l.status).status">{{ listingStatus(l.status).label }}</ds-badge>
                      @if (l.status === 'PUBLISHED') {
                        <ds-button variant="ghost" size="sm" [routerLink]="['/annonces', l.annonceId]">Voir</ds-button>
                      }
                    </li>
                  }
                </ul>
              } @else {
                <p class="om-muted">L'agence n'a pas encore mis votre bien en ligne.</p>
              }
            </ds-card>
          </div>

          <aside class="om-side">
            <ds-card [pad]="true" elevation="xs">
              <h2 class="om-card-title">Le mandat</h2>
              <dl class="om-facts">
                <dt>Statut</dt><dd><ds-badge [status]="status().status">{{ status().label }}</ds-badge></dd>
                <dt>Type</dt><dd>{{ typeLabel() }}</dd>
                <dt>Commission</dt><dd>{{ commission() }}</dd>
                <dt>Signé</dt><dd>{{ x.mandate.signedAt ? (x.mandate.signedAt | date: 'd MMM y') : 'Pas encore' }}</dd>
                <dt>Jusqu'au</dt><dd>{{ x.mandate.endsAt | date: 'd MMM y' }}</dd>
                @if (x.mandate.endedAt) {
                  <dt>Terminé le</dt><dd>{{ x.mandate.endedAt | date: 'd MMM y' }}</dd>
                  <dt>Motif</dt><dd>{{ endReason() }}</dd>
                }
              </dl>
            </ds-card>

            <ds-card [pad]="true" elevation="xs">
              <h2 class="om-card-title">Votre avis</h2>
              @if (x.review; as rv) {
                <div class="om-review">
                  <span class="om-rating"><ds-icon name="star" [size]="16"></ds-icon><span>{{ rv.rating }} / 5</span></span>
                  @if (rv.comment) { <p class="om-quote">{{ rv.comment }}</p> }
                  <span class="om-muted">Donné le {{ rv.createdAt | date: 'd MMM y' }}. Il compte dans la note de l'agence.</span>
                </div>
              } @else if (x.canReview) {
                <form class="ds-form-stack" (ngSubmit)="review()">
                  <ds-radio-group name="rating" label="Note" [inline]="true" [options]="ratings" [(ngModel)]="rating"></ds-radio-group>
                  <ds-textarea label="Commentaire (facultatif)" name="comment" [rows]="4" [maxLength]="1000" [showCount]="true" [(ngModel)]="comment"></ds-textarea>
                  <p class="om-muted">Votre note compte dans la moyenne affichée aux autres propriétaires. Elle ne pourra plus être modifiée.</p>
                  <div class="om-actions">
                    <ds-button variant="marine" nativeType="submit" [loading]="busy()" [disabled]="busy() || !rating">Publier mon avis</ds-button>
                  </div>
                </form>
              } @else {
                <p class="om-muted">{{ x.mandate.signedAt ? 'Vous pourrez noter l\\'agence à la fin du mandat.' : 'Seul un mandat signé peut être noté.' }}</p>
              }
            </ds-card>
          </aside>
        </div>
      } @else if (loading()) {
        <ds-skeleton variant="heading" width="40%"></ds-skeleton>
        <ds-skeleton variant="rect" width="100%" height="320px"></ds-skeleton>
      } @else {
        <ds-card [pad]="true" elevation="xs"><p class="om-muted">Ce mandat est introuvable.</p></ds-card>
      }
    </div>
  `,
  styles: [`
    .om-page { gap: var(--ds-space-6); }
    .om-breadcrumb { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-2); font-size: var(--ds-text-sm); color: var(--ds-text-faint); }
    .om-breadcrumb a { padding: 0; color: var(--ds-text-faint); text-decoration: none; }
    .om-breadcrumb a:hover, .om-breadcrumb a:focus-visible { color: var(--ds-marine); text-decoration: underline; }
    .om-breadcrumb span { color: var(--ds-marine); font-weight: 600; }
    .om-layout { display: grid; grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr); gap: var(--ds-space-6); align-items: start; }
    @media (max-width: 960px) { .om-layout { grid-template-columns: 1fr; } }
    .om-main, .om-side { display: flex; flex-direction: column; gap: var(--ds-space-6); }
    .om-card-title { margin: 0 0 var(--ds-space-3); font-size: var(--ds-text-base); font-weight: 700; color: var(--ds-marine); }
    .om-strong { font-weight: 600; color: var(--ds-text); }
    .om-muted { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .om-banner { display: flex; gap: var(--ds-space-2); align-items: flex-start; margin: 0; padding: var(--ds-space-3) var(--ds-space-4); border-radius: var(--ds-radius-md); font-size: var(--ds-text-sm); }
    .om-banner ds-icon { flex: none; margin-top: 2px; }
    .om-banner--warning { background: var(--ds-warning-hl); color: var(--ds-text); }
    .om-facts { display: grid; grid-template-columns: auto 1fr; gap: var(--ds-space-2) var(--ds-space-4); margin: 0; font-size: var(--ds-text-sm); }
    .om-facts dt { color: var(--ds-text-muted); }
    .om-facts dd { margin: 0; color: var(--ds-text); }
    .om-listings { display: flex; flex-direction: column; gap: var(--ds-space-3); margin: 0; padding: 0; list-style: none; }
    .om-listing { display: flex; align-items: center; gap: var(--ds-space-3); }
    .om-listing__text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .om-listing ds-badge { flex: none; }
    .om-review { display: flex; flex-direction: column; gap: var(--ds-space-2); }
    .om-rating { display: inline-flex; align-items: center; gap: var(--ds-space-1); font-weight: 700; color: var(--ds-primary); }
    .om-quote { margin: 0; padding: var(--ds-space-3); border-radius: var(--ds-radius-md); background: var(--ds-surface-2); font-size: var(--ds-text-sm); white-space: pre-line; }
    .om-actions { display: flex; justify-content: flex-end; }
    .om-offers { display: flex; flex-direction: column; gap: var(--ds-space-4); margin: 0; padding: 0; list-style: none; }
    .om-offer { display: flex; flex-direction: column; gap: var(--ds-space-1); padding: var(--ds-space-4); border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); }
    .om-offer--pending { border-color: var(--ds-primary); }
    .om-offer__head { display: flex; align-items: center; justify-content: space-between; gap: var(--ds-space-3); }
    .om-offer__head ds-badge { flex: none; }
    .om-offer__amount { font-size: var(--ds-text-lg); font-weight: 700; color: var(--ds-marine); font-variant-numeric: tabular-nums; }
    .om-pre { white-space: pre-line; }
  `],
})
export class OwnerMandateComponent implements OnInit {
  private readonly api = inject(OwnerMandateApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(DsToastService);
  private readonly dialog = inject(DsDialogService);

  readonly f = signal<MandateFollowUp | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly ratings: DsRadioOption[] = [1, 2, 3, 4, 5].map(n => ({ value: n, label: String(n) }));
  rating: number | null = null;
  comment = '';

  readonly status = computed(() => {
    const s = this.f()?.mandate.status ?? '';
    return MANDATE_STATUS[s] ?? { label: s, status: 'neutral' as const };
  });
  readonly typeLabel = computed(() => {
    const m = this.f()?.mandate;
    return m ? `${MANDATE_TYPE_LABELS[m.mandateType] ?? m.mandateType}, ${m.durationMonths} mois` : '';
  });
  readonly commission = computed(() => {
    const m = this.f()?.mandate;
    return m ? commissionLabel(m.commissionKind, m.commissionValue, m.commissionPayer) : '';
  });
  readonly endReason = computed(() => {
    const r = this.f()?.mandate.endReason;
    return r ? END_REASON_LABELS[r] ?? r : '—';
  });
  /** R-PROP : 7 jours pour signer après l'acceptation. */
  readonly signatureDeadline = computed(() => {
    const m = this.f()?.mandate;
    if (!m) return null;
    const d = new Date(m.startsAt);
    d.setDate(d.getDate() + 7);
    return d;
  });
  readonly summary = computed(() => {
    const x = this.f();
    if (!x) return null;
    const contacts = x.listings.reduce((n, l) => n + l.contacts, 0);
    const parts = [`${this.typeLabel()}`];
    const pending = x.offers.filter(o => o.status === 'OFFER_PENDING').length;
    if (pending) parts.push(`${pending} offre${pending > 1 ? 's' : ''} à examiner`);
    if (x.listings.length) parts.push(`${contacts} contact${contacts > 1 ? 's' : ''} sur ${x.listings.length > 1 ? 'ses annonces' : 'son annonce'}`);
    parts.push(`${x.events.length} événement${x.events.length > 1 ? 's' : ''} partagé${x.events.length > 1 ? 's' : ''}`);
    return parts.join(' · ');
  });
  readonly timeline = computed<DsTimelineEvent[]>(() =>
    (this.f()?.events ?? []).map(e => ({
      date: e.createdAt,
      dateDisplay: new Date(e.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      title: EVENT_TITLES[e.type] ?? 'Point de l\'agence',
      description: e.content,
      variant: 'marine',
    })));

  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.mandate(this.id).subscribe({
      next: f => { this.f.set(f); this.loading.set(false); },
      error: err => { this.loading.set(false); if (err?.status !== 404) this.toast.error(serverMessage(err, 'Impossible de charger le mandat')); },
    });
  }

  mad(v: number | null): string { return madLabel(v); }
  offerStatus(o: MandateOffer) { return OFFER_STATUS[o.status] ?? { label: o.status, status: 'neutral' as const }; }

  answer(o: MandateOffer): void {
    const x = this.f();
    if (!x) return;
    const data: OfferDialogData = { offer: o, agencyName: x.mandate.agencyName, acceptBlocked: x.offers.some(y => y.status === 'OFFER_ACCEPTED') };
    this.dialog.open<OfferDialogResult>(OwnerOfferDialogComponent, { data, width: '560px' }).closed.subscribe(r => {
      if (!r) return;
      this.busy.set(true);
      this.api.decideOffer(this.id, o.id, r).subscribe({
        next: f => {
          this.busy.set(false);
          this.f.set(f);
          this.toast.success(r.decision === 'ACCEPT' ? 'Offre acceptée, l’agence est prévenue'
            : r.decision === 'COUNTER' ? 'Contre-proposition envoyée à l’agence' : 'Offre refusée, l’agence est prévenue');
        },
        error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Réponse impossible')); },
      });
    });
  }

  listingStatus(s: string) { return LISTING_STATUS[s] ?? { label: s, status: 'neutral' as const }; }

  end(): void {
    const x = this.f();
    if (!x) return;
    const data: EndMandateDialogData = { agencyName: x.mandate.agencyName, exclusive: x.mandate.mandateType === 'EXCLUSIVE', signed: !!x.mandate.signedAt, reasons: x.endReasons };
    this.dialog.open<string>(OwnerEndMandateDialogComponent, { data, width: '520px' }).closed.subscribe(reason => {
      if (!reason) return;
      this.busy.set(true);
      this.api.endMandate(this.id, reason).subscribe({
        next: f => { this.busy.set(false); this.f.set(f); this.toast.success(`Mandat terminé, ${x.mandate.agencyName} est prévenue`); },
        error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Action impossible')); },
      });
    });
  }

  review(): void {
    if (!this.rating) return;
    this.busy.set(true);
    this.api.review(this.id, this.rating, this.comment.trim() || null).subscribe({
      next: f => { this.busy.set(false); this.f.set(f); this.toast.success('Merci, votre avis est publié'); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Avis impossible')); },
    });
  }
}
