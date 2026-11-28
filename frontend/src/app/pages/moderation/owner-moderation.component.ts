import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsEmptyStateComponent,
  DsInputComponent,
  DsSelectComponent,
  DsSkeletonComponent,
  DsTextareaComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import type { DsSelectOption } from '../../design-system';
import { OwnerModerationApiService, PendingOwnerAnnonce } from '../../services/owner-moderation-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { MarketplaceApiService, PendingAgencyVerification, PendingPropertyVerification } from '../../services/marketplace-api.service';

/**
 * Modération a priori des annonces de particuliers (cas d'usage n°1, R-PROP-04), réservée à la
 * plateforme. Refuser exige un message : le propriétaire le lit sur sa fiche.
 */
@Component({
  selector: 'app-owner-moderation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, FormsModule, DsBadgeComponent, DsButtonComponent, DsCardComponent, DsEmptyStateComponent, DsInputComponent, DsSelectComponent, DsSkeletonComponent, DsTextareaComponent, PageHeaderComponent],
  template: `
    <div class="pro-page ds-form-stack om-page">
      <ds-page-header eyebrow="Plateforme" titleBefore="Annonces de" titleAccent="particuliers"
        description="Premières annonces des propriétaires, ou annonces au score de fraude élevé, à valider avant mise en ligne."></ds-page-header>

      <ds-card [pad]="true" elevation="xs">
        <form class="om-verify" (ngSubmit)="verifyAgency(true)">
          <div class="om-verify__text">
            <h2 class="om-title">Vérification des comptes</h2>
            <p class="om-meta">{{ accountKind === 'OWNER'
              ? 'Badge « Propriétaire vérifié » après contrôle de la pièce d\\'identité. La pièce n\\'est jamais conservée.'
              : 'Une agence vérifiée accède à la bourse aux mandats et apparaît dans l\\'annuaire des propriétaires.' }}</p>
          </div>
          <div class="om-verify__fields">
            <ds-select label="Compte" name="accountKind" [options]="accountKinds" [(ngModel)]="accountKind"></ds-select>
            <ds-input label="Identifiant de l'organisation" name="agencyOrg" [placeholder]="accountKind === 'OWNER' ? 'OWN-…' : 'ORG-…'" [(ngModel)]="agencyOrg"></ds-input>
          </div>
          <div class="om-verify__actions">
            <ds-button variant="ghost" size="md" [disabled]="!agencyOrg.trim() || verifying()" (dsClick)="verifyAgency(false)">Retirer</ds-button>
            <ds-button variant="marine" size="md" nativeType="submit" [loading]="verifying()" [disabled]="!agencyOrg.trim() || verifying()">Vérifier</ds-button>
          </div>
        </form>
      </ds-card>

      @if (agencies().length) {
        <ds-card [pad]="true" elevation="xs">
          <h2 class="om-title">Agences à vérifier</h2>
          <p class="om-meta">Contrôlez le registre de commerce et l'ICE (registre du commerce, simpl.ma), puis décidez. Une agence vérifiée accède à la bourse aux mandats ; un refus doit dire à l'agence quoi corriger.</p>
          <ul class="om-props" role="list">
            @for (a of agencies(); track a.orgId) {
              <li class="om-prop om-prop--agency">
                <div class="om-prop__text">
                  <span class="om-strong">{{ a.name }} · {{ a.rc }} · ICE {{ a.ice }}</span>
                  <span class="om-meta">{{ a.cities.join(', ') || 'Aucune zone' }}{{ a.contact ? ' · ' + a.contact : '' }} · demandé le {{ a.requestedAt | date: 'd MMM' }}</span>
                </div>
                <div class="om-agency__decision">
                  <ds-input [ariaLabelInput]="'Motif du refus pour ' + a.name" name="note-{{ a.orgId }}" placeholder="Motif du refus (montré à l'agence)" [ngModel]="agencyNotes()[a.orgId] || ''" (ngModelChange)="setAgencyNote(a.orgId, $event)"></ds-input>
                  <ds-button variant="ghost" size="sm" [disabled]="busyAgency() === a.orgId || !(agencyNotes()[a.orgId] || '').trim()" (dsClick)="decideAgency(a, false)">Refuser</ds-button>
                  <ds-button variant="marine" size="sm" prefixIcon="check" [disabled]="busyAgency() === a.orgId" (dsClick)="decideAgency(a, true)">Vérifier l'agence</ds-button>
                </div>
              </li>
            }
          </ul>
        </ds-card>
      }

      @if (properties().length) {
        <ds-card [pad]="true" elevation="xs">
          <h2 class="om-title">Titres fonciers à contrôler</h2>
          <p class="om-meta">Vérifiez le numéro auprès de la Conservation foncière, puis décidez. Le badge « Bien vérifié » apparaît sur le portail et dans la bourse.</p>
          <ul class="om-props" role="list">
            @for (p of properties(); track p.id) {
              <li class="om-prop">
                <div class="om-prop__text">
                  <span class="om-strong">{{ p.title || 'Bien n°' + p.id }} · {{ p.landTitleNumber }}</span>
                  <span class="om-meta">{{ p.ownerName || p.ownerOrgId }}{{ p.ownerPhone ? ' · ' + p.ownerPhone : '' }} · {{ p.city }}{{ p.district ? ', ' + p.district : '' }} · demandé le {{ p.requestedAt | date: 'd MMM' }}</span>
                </div>
                @if (!p.ownerVerified) {
                  <ds-button variant="ghost" size="sm" [disabled]="busyProperty() === p.id" (dsClick)="verifyOwner(p)">Vérifier le propriétaire</ds-button>
                } @else {
                  <ds-badge size="sm" status="success">Propriétaire vérifié</ds-badge>
                }
                <ds-button variant="ghost" size="sm" [disabled]="busyProperty() === p.id" (dsClick)="decideProperty(p, false)">Non confirmé</ds-button>
                <ds-button variant="marine" size="sm" prefixIcon="check" [loading]="busyProperty() === p.id" [disabled]="busyProperty() === p.id" (dsClick)="decideProperty(p, true)">Bien vérifié</ds-button>
              </li>
            }
          </ul>
        </ds-card>
      }

      @if (loading()) {
        <ds-card [pad]="true" elevation="xs"><ds-skeleton variant="heading" width="40%"></ds-skeleton><ds-skeleton variant="text" width="70%"></ds-skeleton></ds-card>
      } @else if (items().length === 0) {
        <ds-card [pad]="true" elevation="xs">
          <ds-empty-state icon="check" title="Rien à vérifier" description="Les annonces de particuliers en attente apparaîtront ici."></ds-empty-state>
        </ds-card>
      } @else {
        <p class="om-count">{{ items().length }} annonce{{ items().length > 1 ? 's' : '' }} en attente</p>
        @for (a of items(); track a.id) {
          <ds-card [pad]="true" elevation="xs">
            <article class="om-item" [attr.aria-label]="a.title">
              <header class="om-head">
                <div>
                  <h2 class="om-title">{{ a.title }}</h2>
                  <p class="om-meta">{{ a.ownerName }} · {{ a.city }}@if (a.district) { · {{ a.district }} } · demandé le {{ a.requestedAt | date: 'd MMM, HH:mm' }}</p>
                </div>
                <div class="om-badges">
                  @if (a.price) { <span class="om-price">{{ a.price | number: '1.0-0' }} MAD</span> }
                  @if (a.fraudScore !== null && a.fraudScore !== undefined) {
                    <ds-badge size="sm" [status]="a.fraudScore >= 50 ? 'error' : 'neutral'">Fraude {{ a.fraudScore }}</ds-badge>
                  }
                  @if (a.duplicateStatut) { <ds-badge size="sm" status="warning">Doublon : {{ a.duplicateStatut }}</ds-badge> }
                </div>
              </header>
              <ul class="om-photos" role="list">
                @for (id of a.photoIds; track id) {
                  <li>@if (photos()[a.id + '-' + id]; as url) { <img [src]="url" [alt]="'Photo de ' + a.title"> } @else { <ds-skeleton variant="rect" width="100%" height="100%"></ds-skeleton> }</li>
                }
              </ul>
              <p class="om-desc">{{ a.description }}</p>
              <div class="om-decision">
                <ds-textarea [label]="'Message au propriétaire (obligatoire pour refuser)'" [rows]="2" [ngModel]="notes()[a.id] || ''" (ngModelChange)="setNote(a.id, $event)"></ds-textarea>
                <div class="om-buttons">
                  <ds-button variant="ghost" [disabled]="busy() === a.id || !(notes()[a.id] || '').trim()" (dsClick)="reject(a)">Refuser</ds-button>
                  <ds-button variant="marine" prefixIcon="check" [loading]="busy() === a.id" [disabled]="busy() === a.id" (dsClick)="approve(a)">Valider et publier</ds-button>
                </div>
              </div>
            </article>
          </ds-card>
        }
      }
    </div>
  `,
  styles: [`
    .om-verify__fields { display: grid; grid-template-columns: 150px 250px; gap: var(--ds-space-3); }
    @media (max-width: 900px) { .om-verify__fields { grid-template-columns: 1fr; } }
    .om-agency__decision { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-2); flex: 1 1 420px; justify-content: flex-end; }
    .om-agency__decision ds-input { flex: 1 1 240px; }
    .om-props { display: flex; flex-direction: column; gap: var(--ds-space-4); margin: var(--ds-space-4) 0 0; padding: 0; list-style: none; }
    .om-prop { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-2) var(--ds-space-3); }
    .om-prop__text { display: flex; flex-direction: column; flex: 1 1 320px; min-width: 0; }
    .om-prop__text .om-meta { margin: 0; }
    .om-strong { font-size: var(--ds-text-sm); font-weight: 600; color: var(--ds-text); }
    .om-verify { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: var(--ds-space-4); align-items: end; }
    @media (max-width: 900px) { .om-verify { grid-template-columns: 1fr; } }
    .om-verify__text { display: flex; flex-direction: column; gap: var(--ds-space-1); }
    .om-verify__actions { display: flex; gap: var(--ds-space-2); }
    .om-page { gap: var(--ds-space-6); }
    .om-count { margin: 0; font-size: var(--ds-text-xs); font-weight: 700; color: var(--ds-marine); }
    .om-item { display: flex; flex-direction: column; gap: var(--ds-space-4); }
    .om-head { display: flex; justify-content: space-between; gap: var(--ds-space-4); flex-wrap: wrap; }
    .om-title { margin: 0; font-family: var(--ds-font-display); font-size: var(--ds-text-lg); color: var(--ds-marine); }
    .om-meta { margin: var(--ds-space-1) 0 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .om-badges { display: flex; align-items: center; gap: var(--ds-space-2); flex-wrap: wrap; }
    .om-price { font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ds-text); }
    .om-photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--ds-space-3); margin: 0; padding: 0; list-style: none; }
    .om-photos li { aspect-ratio: 4 / 3; overflow: hidden; border-radius: var(--ds-radius-md); background: var(--ds-surface-2); }
    .om-photos img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .om-desc { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text); white-space: pre-line; }
    .om-decision { display: flex; flex-direction: column; gap: var(--ds-space-3); }
    .om-buttons { display: flex; justify-content: flex-end; gap: var(--ds-space-3); }
  `],
})
export class OwnerModerationComponent implements OnInit, OnDestroy {
  private readonly api = inject(OwnerModerationApiService);
  private readonly toast = inject(DsToastService);
  private readonly marketplace = inject(MarketplaceApiService);
  readonly verifying = signal(false);
  agencyOrg = '';
  accountKind: 'AGENCY' | 'OWNER' = 'AGENCY';
  readonly accountKinds: DsSelectOption[] = [{ value: 'AGENCY', label: 'Agence' }, { value: 'OWNER', label: 'Propriétaire' }];

  /** Lots B et C : l'équipe Atlas vérifie une agence (accès à la bourse) ou un propriétaire (badge). */
  verifyAgency(verified: boolean): void {
    const orgId = this.agencyOrg.trim();
    if (!orgId) return;
    const owner = this.accountKind === 'OWNER';
    this.verifying.set(true);
    (owner ? this.marketplace.setOwnerVerified(orgId, verified) : this.marketplace.setVerified(orgId, verified)).subscribe({
      next: r => {
        this.verifying.set(false);
        this.toast.success(r.verified ? `${orgId} est ${owner ? 'vérifié' : 'vérifiée'}` : `${orgId} n'est plus ${owner ? 'vérifié' : 'vérifiée'}`);
      },
      error: err => { this.verifying.set(false); this.toast.error(serverMessage(err, 'Action impossible')); },
    });
  }

  /** Demandes de vérification déposées par les agences (chemin de vérification). */
  readonly agencies = signal<PendingAgencyVerification[]>([]);
  readonly busyAgency = signal<string | null>(null);
  readonly agencyNotes = signal<Record<string, string>>({});

  setAgencyNote(orgId: string, note: string): void {
    this.agencyNotes.update(n => ({ ...n, [orgId]: note }));
  }

  decideAgency(a: PendingAgencyVerification, verified: boolean): void {
    this.busyAgency.set(a.orgId);
    this.marketplace.setVerified(a.orgId, verified, verified ? null : this.agencyNotes()[a.orgId]).subscribe({
      next: () => {
        this.busyAgency.set(null);
        this.agencies.update(list => list.filter(x => x.orgId !== a.orgId));
        this.toast.success(verified ? `${a.name} est vérifiée` : `Demande de ${a.name} refusée`);
      },
      error: err => { this.busyAgency.set(null); this.toast.error(serverMessage(err, 'Action impossible')); },
    });
  }

  /** Lot C : titres fonciers déclarés par les propriétaires. */
  readonly properties = signal<PendingPropertyVerification[]>([]);
  readonly busyProperty = signal<number | null>(null);

  decideProperty(p: PendingPropertyVerification, verified: boolean): void {
    this.busyProperty.set(p.id);
    this.marketplace.decideProperty(p.id, verified).subscribe({
      next: () => {
        this.busyProperty.set(null);
        this.properties.update(list => list.filter(x => x.id !== p.id));
        this.toast.success(verified ? 'Bien vérifié' : 'Titre foncier non confirmé');
      },
      error: err => { this.busyProperty.set(null); this.toast.error(serverMessage(err, 'Action impossible')); },
    });
  }

  verifyOwner(p: PendingPropertyVerification): void {
    this.busyProperty.set(p.id);
    this.marketplace.setOwnerVerified(p.ownerOrgId, true).subscribe({
      next: () => {
        this.busyProperty.set(null);
        this.properties.update(list => list.map(x => x.ownerOrgId === p.ownerOrgId ? { ...x, ownerVerified: true } : x));
        this.toast.success(`${p.ownerName || p.ownerOrgId} est vérifié`);
      },
      error: err => { this.busyProperty.set(null); this.toast.error(serverMessage(err, 'Action impossible')); },
    });
  }

  readonly items = signal<PendingOwnerAnnonce[]>([]);
  readonly loading = signal(true);
  readonly busy = signal<number | null>(null);
  readonly notes = signal<Record<number, string>>({});
  readonly photos = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.load();
    this.marketplace.pendingProperties().subscribe({ next: l => this.properties.set(l), error: () => undefined });
    this.marketplace.pendingAgencies().subscribe({ next: l => this.agencies.set(l), error: () => undefined });
  }

  ngOnDestroy(): void {
    Object.values(this.photos()).forEach(url => URL.revokeObjectURL(url));
  }

  load(): void {
    this.api.pending().subscribe({
      next: list => {
        this.items.set(list);
        this.loading.set(false);
        for (const a of list) {
          for (const id of a.photoIds) {
            const key = `${a.id}-${id}`;
            if (this.photos()[key]) continue;
            this.api.photoBlobUrl(a.id, id).subscribe({ next: url => this.photos.update(m => ({ ...m, [key]: url })), error: () => undefined });
          }
        }
      },
      error: err => { this.loading.set(false); this.toast.error(serverMessage(err, 'Impossible de charger la file')); },
    });
  }

  setNote(id: number, value: string): void {
    this.notes.update(n => ({ ...n, [id]: value }));
  }

  approve(a: PendingOwnerAnnonce): void {
    this.busy.set(a.id);
    this.api.approve(a.id, this.notes()[a.id]).subscribe({
      next: () => { this.busy.set(null); this.toast.success('Annonce publiée'); this.remove(a.id); },
      error: err => { this.busy.set(null); this.toast.error(serverMessage(err, 'Validation impossible')); },
    });
  }

  reject(a: PendingOwnerAnnonce): void {
    const note = (this.notes()[a.id] || '').trim();
    if (!note) return;
    this.busy.set(a.id);
    this.api.reject(a.id, note).subscribe({
      next: () => { this.busy.set(null); this.toast.success('Annonce refusée, le propriétaire est informé sur sa fiche'); this.remove(a.id); },
      error: err => { this.busy.set(null); this.toast.error(serverMessage(err, 'Refus impossible')); },
    });
  }

  private remove(id: number): void {
    this.items.update(list => list.filter(x => x.id !== id));
  }
}
