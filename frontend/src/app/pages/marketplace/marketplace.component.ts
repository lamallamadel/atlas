import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsCellDirective,
  DsDialogService,
  DsEmptyStateComponent,
  DsIconComponent,
  DsTableComponent,
  DsTabsComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import type { DsColumn, DsTab } from '../../design-system';
import { AgencyProposal, AgencyRequest, AgencySettings, AgencyVerification, MarketplaceApiService } from '../../services/marketplace-api.service';
import { MANDATE_STATUS, MANDATE_TYPE_LABELS, MandateView, PROPOSAL_STATUS, commissionLabel } from '../../services/mandate-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { MarketplaceMandateDialogComponent } from './marketplace-mandate-dialog.component';
import { AgencyVerificationPanelComponent } from './agency-verification-panel.component';

type Tab = 'market' | 'direct' | 'proposals' | 'mandates';

/**
 * Bourse aux mandats, côté agence (cas d'usage n°1, lot B) : demandes des propriétaires dans vos
 * zones, demandes qui vous sont adressées, vos propositions, vos mandats.
 */
@Component({
  selector: 'app-marketplace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, DecimalPipe, RouterLink,
    DsBadgeComponent, DsButtonComponent, DsCardComponent, DsCellDirective, DsEmptyStateComponent,
    DsIconComponent, DsTableComponent, DsTabsComponent, PageHeaderComponent, AgencyVerificationPanelComponent,
  ],
  template: `
    <div class="pro-page ds-form-stack mk-page">
      <ds-page-header eyebrow="Propriétaires" titleBefore="Bourse aux" titleAccent="mandats"
        description="Des propriétaires cherchent une agence pour vendre ou louer : coordonnées et adresse vous sont transmises s'ils vous choisissent. Les invitations et les demandes les plus pertinentes pour vous sont en tête.">
        <ng-container slot="actions">
          <ds-button variant="ghost" size="md" prefixIcon="settings" routerLink="/pro/mandats/profil">Profil et zones</ds-button>
        </ng-container>
      </ds-page-header>

      @if (verification(); as v) {
        <app-agency-verification-panel [verification]="v" (changed)="verification.set($event)"></app-agency-verification-panel>
      } @else if (blocked(); as reason) {
        <ds-card [pad]="true" elevation="xs">
          <ds-empty-state icon="lock" [title]="reason.title" [description]="reason.text"></ds-empty-state>
        </ds-card>
      } @else {
        @if (settings(); as s) {
          @if (!s.zones.length || !s.displayName) {
            <p class="mk-hint" role="status"><ds-icon name="info" [size]="16"></ds-icon> Complétez le profil public et les zones de votre agence : c'est ce qui vous fait apparaître aux propriétaires.</p>
          }
        }

        <ds-tabs [tabs]="tabs()" [activeTab]="tab()" label="Sections de la bourse" (tabChange)="tab.set($any($event))"></ds-tabs>

        <ds-card [pad]="false" elevation="xs">
          @switch (tab()) {
            @case ('market') {
              <ds-table [columns]="requestColumns" [rows]="market()" [loading]="loading()" [rowClickable]="true" (rowClick)="openRequest($event)"
                label="Demandes ouvertes dans vos zones" emptyMessage="Aucune demande ouverte dans vos zones pour l'instant.">
                <ng-template dsCell="place" let-r>
                  <div class="mk-cell"><span class="mk-strong">{{ r.district ? r.district + ', ' : '' }}{{ r.city }}</span>
                    <span class="mk-muted">{{ r.objective === 'RENT' ? 'Location' : 'Vente' }} · {{ r.propertyType || 'Bien' }}{{ r.surface ? ' · ' + r.surface + ' m²' : '' }}</span></div>
                </ng-template>
                <ng-template dsCell="relevance" let-r>
                  <span class="mk-row">
                    <span class="mk-strong">{{ r.relevance }}</span>
                    @if (r.invited) { <ds-badge size="sm" status="won">Invitée</ds-badge> }
                  </span>
                </ng-template>
                <ng-template dsCell="price" let-r>{{ r.expectedPrice ? (r.expectedPrice | number: '1.0-0') + ' MAD' : '—' }}</ng-template>
                <ng-template dsCell="types" let-r>{{ types(r) }}</ng-template>
                <ng-template dsCell="expires" let-r>{{ r.expiresAt | date: 'd MMM' }}</ng-template>
                <ng-template dsCell="state" let-r>
                  @if (r.myProposal) { <ds-badge size="sm" [status]="proposalStatus(r.myProposal).status">{{ proposalStatus(r.myProposal).label }}</ds-badge> }
                  @else if (r.canPropose) { <ds-badge size="sm" status="info">À proposer</ds-badge> }
                  @else { <span class="mk-muted">Complet</span> }
                </ng-template>
              </ds-table>
            }
            @case ('direct') {
              <ds-table [columns]="directColumns" [rows]="direct()" [loading]="loading()" [rowClickable]="true" (rowClick)="openRequest($event)"
                label="Demandes adressées à votre agence" emptyMessage="Aucun propriétaire ne vous a encore choisi directement.">
                <ng-template dsCell="place" let-r>
                  <div class="mk-cell"><span class="mk-strong">{{ r.district ? r.district + ', ' : '' }}{{ r.city }}</span>
                    <span class="mk-muted">{{ r.ownerName }} · {{ r.objective === 'RENT' ? 'Location' : 'Vente' }}</span></div>
                </ng-template>
                <ng-template dsCell="price" let-r>{{ r.expectedPrice ? (r.expectedPrice | number: '1.0-0') + ' MAD' : '—' }}</ng-template>
                <ng-template dsCell="types" let-r>{{ types(r) }}</ng-template>
                <ng-template dsCell="received" let-r>{{ r.openedAt | date: 'd MMM' }}</ng-template>
                <ng-template dsCell="state" let-r>
                  @if (r.myProposal) { <ds-badge size="sm" [status]="proposalStatus(r.myProposal).status">{{ proposalStatus(r.myProposal).label }}</ds-badge> }
                  @else if (r.canPropose) { <ds-badge size="sm" status="warning">À répondre sous 72 h</ds-badge> }
                  @else { <span class="mk-muted">Close</span> }
                </ng-template>
              </ds-table>
            }
            @case ('proposals') {
              <ds-table [columns]="proposalColumns" [rows]="proposals()" [loading]="loading()" [rowClickable]="true" (rowClick)="openProposal($event)"
                label="Vos propositions" emptyMessage="Vous n'avez encore fait aucune proposition.">
                <ng-template dsCell="place" let-p>
                  <div class="mk-cell"><span class="mk-strong">{{ p.district ? p.district + ', ' : '' }}{{ p.city }}</span>
                    <span class="mk-muted">{{ p.agentName || '' }}</span></div>
                </ng-template>
                <ng-template dsCell="offer" let-p>{{ typeLabel(p.mandateType) }} · {{ p.durationMonths }} mois · {{ commission(p) }}</ng-template>
                <ng-template dsCell="sent" let-p>{{ p.createdAt | date: 'd MMM' }}</ng-template>
                <ng-template dsCell="state" let-p>
                  <span class="mk-row">
                    <ds-badge size="sm" [status]="proposalStatus(p).status">{{ proposalStatus(p).label }}</ds-badge>
                    @if (p.unread) { <ds-badge size="sm" status="info">{{ p.unread }} message{{ p.unread > 1 ? 's' : '' }}</ds-badge> }
                  </span>
                </ng-template>
              </ds-table>
            }
            @case ('mandates') {
              <ds-table [columns]="mandateColumns" [rows]="mandates()" [loading]="loading()" [rowClickable]="true" (rowClick)="openMandate($event)"
                label="Mandats obtenus" emptyMessage="Pas encore de mandat. Les propositions acceptées arrivent ici.">
                <ng-template dsCell="owner" let-m>
                  <div class="mk-cell"><span class="mk-strong">{{ m.owner?.name || 'Propriétaire' }}</span>
                    <span class="mk-muted">{{ m.owner?.district ? m.owner.district + ', ' : '' }}{{ m.owner?.city || '' }}</span></div>
                </ng-template>
                <ng-template dsCell="type" let-m>{{ typeLabel(m.mandateType) }} · {{ m.durationMonths }} mois</ng-template>
                <ng-template dsCell="ends" let-m>{{ m.endsAt | date: 'd MMM y' }}</ng-template>
                <ng-template dsCell="state" let-m><ds-badge size="sm" [status]="mandateStatus(m).status">{{ mandateStatus(m).label }}</ds-badge></ng-template>
              </ds-table>
            }
          }
        </ds-card>
      }
    </div>
  `,
  styles: [`
    .mk-page { gap: var(--ds-space-6); }
    .mk-hint { display: flex; gap: var(--ds-space-2); align-items: flex-start; margin: 0; padding: var(--ds-space-3) var(--ds-space-4); border-radius: var(--ds-radius-md); background: var(--ds-marine-hl); color: var(--ds-text); font-size: var(--ds-text-sm); }
    .mk-cell { display: flex; flex-direction: column; min-width: 0; }
    .mk-strong { font-size: var(--ds-text-sm); font-weight: 600; color: var(--ds-text); }
    .mk-muted { font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .mk-row { display: inline-flex; flex-wrap: wrap; gap: var(--ds-space-1); }
  `],
})
export class MarketplaceComponent implements OnInit {
  private readonly api = inject(MarketplaceApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(DsToastService);
  private readonly dialog = inject(DsDialogService);

  readonly tab = signal<Tab>('market');
  readonly loading = signal(true);
  readonly settings = signal<AgencySettings | null>(null);
  readonly market = signal<AgencyRequest[]>([]);
  readonly direct = signal<AgencyRequest[]>([]);
  readonly proposals = signal<AgencyProposal[]>([]);
  readonly mandates = signal<MandateView[]>([]);
  readonly blocked = signal<{ title: string; text: string } | null>(null);
  /** Agence non vérifiée : chemin de vérification à la place de la bourse. */
  readonly verification = signal<AgencyVerification | null>(null);

  readonly tabs = computed<DsTab[]>(() => {
    const toAnswer = this.direct().filter(r => r.canPropose).length;
    const unread = this.proposals().reduce((n, p) => n + (p.unread || 0), 0);
    const pending = this.mandates().filter(m => m.status === 'MANDATE_PENDING_SIGNATURE').length;
    return [
      { value: 'market', label: 'Bourse', badge: this.market().filter(r => r.canPropose).length || undefined },
      { value: 'direct', label: 'Demandes directes', badge: toAnswer || undefined },
      { value: 'proposals', label: 'Mes propositions', badge: unread || undefined },
      { value: 'mandates', label: 'Mandats', badge: pending || undefined },
    ];
  });

  readonly requestColumns: DsColumn<AgencyRequest>[] = [
    { key: 'place', header: 'Bien' },
    { key: 'relevance', header: 'Pertinence', width: '140px' },
    { key: 'price', header: 'Prix souhaité', width: '150px' },
    { key: 'types', header: 'Mandat accepté', width: '180px' },
    { key: 'expires', header: 'Jusqu’au', width: '110px' },
    { key: 'state', header: 'Votre réponse', width: '170px' },
  ];
  readonly directColumns: DsColumn<AgencyRequest>[] = [
    { key: 'place', header: 'Bien' },
    { key: 'price', header: 'Prix souhaité', width: '150px' },
    { key: 'types', header: 'Mandat accepté', width: '180px' },
    { key: 'received', header: 'Reçue', width: '110px' },
    { key: 'state', header: 'Votre réponse', width: '190px' },
  ];
  readonly proposalColumns: DsColumn<AgencyProposal>[] = [
    { key: 'place', header: 'Bien' },
    { key: 'offer', header: 'Votre proposition' },
    { key: 'sent', header: 'Envoyée', width: '110px' },
    { key: 'state', header: 'Statut', width: '220px' },
  ];
  readonly mandateColumns: DsColumn<MandateView>[] = [
    { key: 'owner', header: 'Propriétaire' },
    { key: 'type', header: 'Mandat', width: '200px' },
    { key: 'ends', header: 'Échéance', width: '130px' },
    { key: 'state', header: 'Statut', width: '140px' },
  ];

  ngOnInit(): void {
    this.api.settings().subscribe({
      next: s => {
        this.settings.set(s);
        if (!s.verified) {
          this.loading.set(false);
          // Chemin de vérification plutôt qu'un refus sec ; à défaut, le message d'origine.
          this.api.verification().subscribe({
            next: v => this.verification.set(v),
            error: () => this.blocked.set({
              title: 'Votre agence n’est pas encore vérifiée',
              text: 'La bourse aux mandats est réservée aux agences vérifiées par Atlas. Complétez votre profil et vos zones, puis demandez la vérification.',
            }),
          });
          return;
        }
        this.loadAll();
      },
      error: err => {
        this.loading.set(false);
        this.blocked.set(err?.status === 403
          ? { title: 'Module non activé', text: 'La bourse aux mandats n’est pas activée pour votre agence.' }
          : { title: 'Bourse indisponible', text: serverMessage(err, 'Réessayez dans un instant.') });
      },
    });
  }

  typeLabel(t: string): string { return MANDATE_TYPE_LABELS[t] ?? t; }
  types(r: AgencyRequest): string { return r.mandateTypes.map(t => t === 'EXCLUSIVE' ? 'Exclusif' : 'Simple').join(' ou '); }
  commission(p: AgencyProposal): string { return commissionLabel(p.commissionKind, p.commissionValue); }
  proposalStatus(p: AgencyProposal) { return PROPOSAL_STATUS[p.status] ?? { label: p.status, status: 'neutral' as const }; }
  mandateStatus(m: MandateView) { return MANDATE_STATUS[m.status] ?? { label: m.status, status: 'neutral' as const }; }

  openRequest(r: AgencyRequest): void { this.router.navigate(['/pro/mandats/demandes', r.id]); }
  openProposal(p: AgencyProposal): void { this.router.navigate(['/pro/mandats/demandes', p.requestId]); }

  openMandate(m: MandateView): void {
    this.dialog.open<MandateView>(MarketplaceMandateDialogComponent, { data: m, width: '680px' })
      .closed.subscribe(updated => {
        if (updated) this.mandates.set(this.mandates().map(x => x.id === updated.id ? updated : x));
      });
  }

  private loadAll(): void {
    let pending = 4;
    const done = () => { if (--pending === 0) this.loading.set(false); };
    const fail = (err: unknown) => { done(); this.toast.error(serverMessage(err, 'Chargement incomplet')); };
    this.api.market().subscribe({ next: l => { this.market.set(l); done(); }, error: fail });
    this.api.direct().subscribe({ next: l => { this.direct.set(l); done(); if (l.some(r => r.canPropose)) this.tab.set('direct'); }, error: fail });
    this.api.proposals().subscribe({ next: l => { this.proposals.set(l); done(); }, error: fail });
    this.api.mandates().subscribe({ next: l => { this.mandates.set(l); done(); }, error: fail });
  }
}
