import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsCellDirective,
  DsDialogService,
  DsEmptyStateComponent,
  DsIconComponent,
  DsSelectComponent,
  DsSkeletonComponent,
  DsTableComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import type { DsColumn, DsSelectOption } from '../../design-system';
import { OwnerApiService, OwnerLead, OwnerProfile, OwnerProperty, ownerAnnonceState } from '../../services/owner-api.service';
import { AuthService } from '../../services/auth.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { OwnerPropertyDialogComponent } from './owner-property-dialog.component';

/** Contact avec ses options de statut calculées une fois (le sélecteur ne doit pas recevoir un nouveau tableau à chaque rendu). */
type LeadRow = OwnerLead & { options: DsSelectOption[] };

function row(l: OwnerLead): LeadRow {
  return { ...l, options: [{ value: l.statusCode, label: l.statusLabel }, ...l.next.map(o => ({ value: o.code, label: o.label }))] };
}

/** Espace propriétaire (cas d'usage n°1) : mes biens et les contacts reçus. */
@Component({
  selector: 'app-owner-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, DecimalPipe, FormsModule, RouterLink,
    DsBadgeComponent, DsButtonComponent, DsCardComponent, DsCellDirective, DsEmptyStateComponent, DsIconComponent,
    DsSelectComponent, DsSkeletonComponent, DsTableComponent, PageHeaderComponent,
  ],
  template: `
    <div class="pro-page ds-form-stack oh-page">
      <ds-page-header
        eyebrow="Espace propriétaire"
        titleBefore="Mes"
        titleAccent="biens"
        [description]="profile() ? 'Bonjour ' + profile()!.displayName + '. Publiez vous-même ou, bientôt, confiez votre bien à un agent.' : null">
        <ng-container slot="actions">
          <ds-button variant="ghost" size="md" (dsClick)="logout()">Se déconnecter</ds-button>
          <ds-button variant="marine" size="md" prefixIcon="plus" (dsClick)="declare()">Déclarer un bien</ds-button>
        </ng-container>
      </ds-page-header>

      @if (loading()) {
        <div class="oh-grid">
          @for (i of [1, 2]; track i) {
            <ds-card [pad]="true" elevation="xs"><ds-skeleton variant="heading" width="60%"></ds-skeleton><ds-skeleton variant="text" width="40%"></ds-skeleton></ds-card>
          }
        </div>
      } @else if (properties().length === 0) {
        <ds-card [pad]="true" elevation="xs">
          <ds-empty-state icon="home" title="Aucun bien pour l'instant"
            description="Décrivez votre bien une fois : vous pourrez ensuite le publier sur le portail."
            ctaLabel="Déclarer un bien" (ctaClick)="declare()"></ds-empty-state>
        </ds-card>
      } @else {
        <div class="oh-grid">
          @for (p of properties(); track p.id) {
            <a class="oh-link" [routerLink]="['/proprietaire/biens', p.id]" [attr.aria-label]="'Ouvrir ' + p.title">
              <ds-card [pad]="true" elevation="xs" [interactive]="true">
                <div class="oh-card">
                  <div class="oh-card__top">
                    <span class="oh-card__name" [title]="p.title">{{ p.title }}</span>
                    <ds-badge size="sm" [status]="state(p).status">{{ state(p).label }}</ds-badge>
                  </div>
                  <span class="oh-card__meta"><ds-icon name="map-pin" [size]="16"></ds-icon>{{ p.city }}@if (p.district) { · {{ p.district }} }</span>
                  <span class="oh-card__price">
                    @if (p.annonce?.price ?? p.expectedPrice; as price) { {{ price | number: '1.0-0' }} MAD } @else { Prix à définir }
                    <span class="oh-card__tx">{{ p.transactionType === 'RENT' ? '· location' : '· vente' }}</span>
                  </span>
                </div>
              </ds-card>
            </a>
          }
        </div>
      }

      <section class="oh-section" aria-labelledby="oh-leads-title">
        <h2 class="oh-section__title" id="oh-leads-title">Contacts reçus</h2>
        <ds-card [pad]="false" elevation="xs">
          <ds-table [columns]="columns" [rows]="leads()" [loading]="loading()" [loadingRowCount]="2" [trackBy]="trackLead"
            label="Contacts reçus sur vos annonces"
            emptyMessage="Pas encore de contact. Les demandes des visiteurs de vos annonces arriveront ici.">
            <ng-template dsCell="name" let-l>
              <div class="oh-person">
                <span class="oh-strong">{{ l.name || 'Visiteur' }}</span>
                <span class="oh-muted">
                  @if (l.phone) { <a [href]="'tel:' + l.phone">{{ l.phone }}</a> }
                  @if (l.email) { · <a [href]="'mailto:' + l.email">{{ l.email }}</a> }
                </span>
              </div>
            </ng-template>
            <ng-template dsCell="message" let-l><span class="oh-message">{{ l.message || '—' }}</span></ng-template>
            <ng-template dsCell="property" let-l>{{ propertyTitle(l.annonceId) }}</ng-template>
            <ng-template dsCell="createdAt" let-l>{{ l.createdAt | date: 'd MMM, HH:mm' }}</ng-template>
            <ng-template dsCell="status" let-l>
              @if (l.next.length) {
                <div class="oh-select">
                  <ds-select [ariaLabelSelect]="'Statut du contact ' + (l.name || '')" [options]="l.options"
                    [ngModel]="l.statusCode" (ngModelChange)="changeStatus(l, $event)" [disabled]="busyLead() === l.id"></ds-select>
                </div>
              } @else {
                <ds-badge size="sm" [status]="l.statusCode === 'CRM_CLOSED_WON' ? 'won' : 'neutral'">{{ l.statusLabel }}</ds-badge>
              }
            </ng-template>
          </ds-table>
        </ds-card>
      </section>
    </div>
  `,
  styles: [`
    .oh-page { gap: var(--ds-space-6); }
    .oh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--ds-space-6); }
    .oh-link { display: block; padding: 0; text-decoration: none; color: inherit; border-radius: var(--ds-radius-lg); }
    .oh-link:focus-visible { outline: 2px solid var(--ds-marine); outline-offset: 2px; }
    .oh-card { display: flex; flex-direction: column; gap: var(--ds-space-2); text-align: left; min-height: 84px; }
    .oh-card__top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--ds-space-3); }
    .oh-card__top ds-badge { flex: none; white-space: nowrap; }
    .oh-card__name { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-family: var(--ds-font-display); font-size: var(--ds-text-lg); font-weight: 700; color: var(--ds-marine); }
    .oh-card__meta { display: inline-flex; align-items: center; gap: var(--ds-space-1); font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .oh-card__price { font-weight: 700; color: var(--ds-text); font-variant-numeric: tabular-nums; }
    .oh-card__tx { font-weight: 400; color: var(--ds-text-muted); }
    .oh-section { display: flex; flex-direction: column; gap: var(--ds-space-3); }
    .oh-section__title { margin: 0; font-size: var(--ds-text-base); font-weight: 700; color: var(--ds-marine); }
    .oh-person { display: flex; flex-direction: column; }
    .oh-strong { font-weight: 600; color: var(--ds-text); }
    .oh-muted { font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
    .oh-muted a { display: inline; padding: 0; color: inherit; }
    .oh-message { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: var(--ds-text-sm); }
    .oh-select { min-width: 150px; max-width: 190px; }
  `],
})
export class OwnerHomeComponent implements OnInit {
  private readonly api = inject(OwnerApiService);
  private readonly dialog = inject(DsDialogService);
  private readonly toast = inject(DsToastService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly profile = signal<OwnerProfile | null>(null);
  readonly properties = signal<OwnerProperty[]>([]);
  readonly leads = signal<LeadRow[]>([]);
  readonly loading = signal(true);
  readonly busyLead = signal<number | null>(null);

  private readonly titleByAnnonce = computed(() => {
    const map = new Map<number, string>();
    this.properties().forEach(p => { if (p.annonce) map.set(p.annonce.id, p.title); });
    return map;
  });

  readonly columns: DsColumn<LeadRow>[] = [
    { key: 'name', header: 'Contact' },
    { key: 'message', header: 'Message' },
    { key: 'property', header: 'Bien', width: '200px' },
    { key: 'createdAt', header: 'Reçu', width: '130px' },
    { key: 'status', header: 'Statut', width: '200px' },
  ];
  readonly trackLead = (_: number, l: LeadRow) => l.id;
  state(p: OwnerProperty): ReturnType<typeof ownerAnnonceState> {
    return ownerAnnonceState(p.annonce);
  }

  ngOnInit(): void {
    this.api.me().subscribe({ next: p => this.profile.set(p), error: () => undefined });
    this.load();
  }

  load(): void {
    this.api.properties().subscribe({
      next: list => { this.properties.set(list); this.loading.set(false); },
      error: err => { this.loading.set(false); this.toast.error(serverMessage(err, 'Impossible de charger vos biens')); },
    });
    this.api.leads().subscribe({ next: l => this.leads.set(l.map(row)), error: () => this.leads.set([]) });
  }

  declare(): void {
    this.dialog.open<OwnerProperty>(OwnerPropertyDialogComponent, { data: {}, width: '640px' })
      .closed.subscribe(p => { if (p) this.router.navigate(['/proprietaire/biens', p.id]); });
  }

  propertyTitle(annonceId: number | null): string {
    return (annonceId != null && this.titleByAnnonce().get(annonceId)) || '—';
  }

  changeStatus(lead: LeadRow, statusCode: string): void {
    if (statusCode === lead.statusCode) return;
    this.busyLead.set(lead.id);
    this.api.changeLeadStatus(lead.id, statusCode).subscribe({
      next: updated => { this.busyLead.set(null); this.leads.update(list => list.map(x => (x.id === updated.id ? row(updated) : x))); },
      error: err => { this.busyLead.set(null); this.toast.error(serverMessage(err, 'Changement impossible')); this.load(); },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
