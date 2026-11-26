import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsEmptyStateComponent,
  DsInputComponent,
  DsSkeletonComponent,
  DsTextareaComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import { OwnerModerationApiService, PendingOwnerAnnonce } from '../../services/owner-moderation-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { MarketplaceApiService } from '../../services/marketplace-api.service';

/**
 * Modération a priori des annonces de particuliers (cas d'usage n°1, R-PROP-04), réservée à la
 * plateforme. Refuser exige un message : le propriétaire le lit sur sa fiche.
 */
@Component({
  selector: 'app-owner-moderation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, FormsModule, DsBadgeComponent, DsButtonComponent, DsCardComponent, DsEmptyStateComponent, DsInputComponent, DsSkeletonComponent, DsTextareaComponent, PageHeaderComponent],
  template: `
    <div class="pro-page ds-form-stack om-page">
      <ds-page-header eyebrow="Plateforme" titleBefore="Annonces de" titleAccent="particuliers"
        description="Premières annonces des propriétaires, ou annonces au score de fraude élevé, à valider avant mise en ligne."></ds-page-header>

      <ds-card [pad]="true" elevation="xs">
        <form class="om-verify" (ngSubmit)="verifyAgency(true)">
          <div class="om-verify__text">
            <h2 class="om-title">Vérification des agences</h2>
            <p class="om-meta">Une agence vérifiée accède à la bourse aux mandats et apparaît dans l'annuaire des propriétaires.</p>
          </div>
          <ds-input label="Identifiant de l'organisation" name="agencyOrg" placeholder="ORG-…" [(ngModel)]="agencyOrg"></ds-input>
          <div class="om-verify__actions">
            <ds-button variant="ghost" size="md" [disabled]="!agencyOrg.trim() || verifying()" (dsClick)="verifyAgency(false)">Retirer</ds-button>
            <ds-button variant="marine" size="md" nativeType="submit" [loading]="verifying()" [disabled]="!agencyOrg.trim() || verifying()">Vérifier</ds-button>
          </div>
        </form>
      </ds-card>

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
    .om-verify { display: grid; grid-template-columns: minmax(0, 2fr) minmax(200px, 1fr) auto; gap: var(--ds-space-4); align-items: end; }
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

  /** Lot B : l'équipe Atlas vérifie une agence avant son accès à la bourse aux mandats. */
  verifyAgency(verified: boolean): void {
    const orgId = this.agencyOrg.trim();
    if (!orgId) return;
    this.verifying.set(true);
    this.marketplace.setVerified(orgId, verified).subscribe({
      next: r => { this.verifying.set(false); this.toast.success(r.verified ? `${orgId} est vérifiée` : `${orgId} n'est plus vérifiée`); },
      error: err => { this.verifying.set(false); this.toast.error(serverMessage(err, 'Action impossible')); },
    });
  }

  readonly items = signal<PendingOwnerAnnonce[]>([]);
  readonly loading = signal(true);
  readonly busy = signal<number | null>(null);
  readonly notes = signal<Record<number, string>>({});
  readonly photos = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.load();
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
