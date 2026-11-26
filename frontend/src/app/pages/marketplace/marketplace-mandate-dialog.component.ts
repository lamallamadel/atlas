import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsDialogActionsComponent,
  DsDialogContentComponent,
  DsDialogHeaderComponent,
  DsIconComponent,
  DsRadioGroupComponent,
  DsRadioOption,
  DsToastService,
} from '../../design-system';
import { MarketplaceApiService } from '../../services/marketplace-api.service';
import { AGENCY_END_REASON_CHOICES, END_REASON_LABELS, MANDATE_STATUS, MANDATE_TYPE_LABELS, MandateView, commissionLabel } from '../../services/mandate-api.service';

/** Motifs de fin côté agence (UC-P9), dans l'ordre de l'API. */
const AGENCY_END_REASONS = ['DEAL_CLOSED_AGENCY', 'SOLD_THIRD_PARTY', 'WITHDRAWN_AGENCY'];
import { serverMessage } from '../../components/annonce-publication-panel.component';

/**
 * Mandat obtenu : coordonnées du propriétaire et adresse du bien (révélées à la seule agence
 * mandatée), signature déclarée, annonce de l'agence liée au bien.
 */
@Component({
  selector: 'app-marketplace-mandate-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, FormsModule, DsBadgeComponent, DsRadioGroupComponent, DsButtonComponent, DsDialogActionsComponent, DsDialogContentComponent, DsDialogHeaderComponent, DsIconComponent],
  template: `
    <ds-dialog-header [subtitle]="typeLabel + ' · ' + m().durationMonths + ' mois'" (close)="ref.close(m())">Mandat n°{{ m().id }}</ds-dialog-header>
    <ds-dialog-content>
      <div class="ds-form-stack">
        <div><ds-badge [status]="status().status">{{ status().label }}</ds-badge></div>
        @if (m().owner; as o) {
          <dl class="mm-facts">
            <dt>Propriétaire</dt><dd>{{ o.name }}</dd>
            <dt>Téléphone</dt><dd><a class="mm-link" [href]="'tel:' + o.phone">{{ o.phone }}</a></dd>
            <dt>Bien</dt><dd>{{ o.propertyTitle }}{{ o.surface ? ' · ' + o.surface + ' m²' : '' }}{{ o.rooms ? ' · ' + o.rooms + ' pièces' : '' }}</dd>
            <dt>Adresse</dt><dd>{{ o.address || '—' }}{{ o.district ? ', ' + o.district : '' }}, {{ o.city }}</dd>
            @if (o.landTitleNumber) { <dt>Titre foncier</dt><dd>{{ o.landTitleNumber }}</dd> }
            @if (o.expectedPrice) { <dt>Prix souhaité</dt><dd>{{ o.expectedPrice | number: '1.0-0' }} MAD</dd> }
            <dt>Commission</dt><dd>{{ commission }}</dd>
            <dt>Échéance</dt><dd>{{ m().endsAt | date: 'd MMMM y' }}</dd>
          </dl>
        } @else {
          <p class="mm-muted">Ce mandat est terminé : les coordonnées du propriétaire ne sont plus affichées ici. Elles restent dans le dossier.</p>
        }
        @if (m().endReason) {
          <p class="mm-hint"><ds-icon name="info" [size]="16"></ds-icon><span>{{ endedLine() }}</span></p>
        }
        @if (ending()) {
          <ds-radio-group name="endReason" label="Motif de fin" [options]="endOptions" [(ngModel)]="endReason"></ds-radio-group>
          <p class="mm-hint"><ds-icon name="info" [size]="16"></ds-icon><span>Le propriétaire est prévenu du motif et pourra noter votre agence. Le dossier est clos et vos annonces du bien quittent le portail.</span></p>
        } @else if (m().status === 'MANDATE_PENDING_SIGNATURE') {
          <p class="mm-hint"><ds-icon name="info" [size]="16"></ds-icon> Faites signer le mandat au propriétaire sous 7 jours, puis déclarez-le signé : vous pourrez alors publier le bien.</p>
        }
      </div>
    </ds-dialog-content>
    <ds-dialog-actions>
      @if (ending()) {
        <ds-button variant="ghost" (dsClick)="ending.set(false)">Retour</ds-button>
        <ds-button variant="marine" prefixIcon="check" [loading]="busy()" [disabled]="busy() || !endReason()" (dsClick)="end()">Terminer le mandat</ds-button>
      } @else {
      @if (live()) {
        <ds-button variant="ghost" [disabled]="busy()" (dsClick)="ending.set(true)">Terminer le mandat</ds-button>
      }
      @if (m().dossierId) {
        <ds-button variant="ghost" prefixIcon="folder" (dsClick)="openDossier()">Ouvrir le dossier</ds-button>
      }
      @if (m().status === 'MANDATE_PENDING_SIGNATURE') {
        <ds-button variant="marine" prefixIcon="check" [loading]="busy()" [disabled]="busy()" (dsClick)="signed()">Déclarer le mandat signé</ds-button>
      }
      @if (m().status === 'MANDATE_ACTIVE') {
        <ds-button variant="marine" prefixIcon="megaphone" [loading]="busy()" [disabled]="busy()" (dsClick)="annonce()">{{ m().annonceId ? 'Ouvrir l’annonce' : 'Créer l’annonce du bien' }}</ds-button>
      }
      }
    </ds-dialog-actions>
  `,
  styles: [`
    .mm-facts { display: grid; grid-template-columns: auto 1fr; gap: var(--ds-space-2) var(--ds-space-4); margin: 0; font-size: var(--ds-text-sm); }
    .mm-facts dt { color: var(--ds-text-muted); }
    .mm-facts dd { margin: 0; color: var(--ds-text); overflow-wrap: anywhere; }
    .mm-link { display: inline; padding: 0; color: var(--ds-marine); }
    .mm-muted { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .mm-hint { display: flex; gap: var(--ds-space-2); align-items: flex-start; margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
  `],
})
export class MarketplaceMandateDialogComponent {
  readonly ref = inject<DialogRef<MandateView>>(DialogRef);
  private readonly api = inject(MarketplaceApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(DsToastService);

  readonly m = signal(inject<MandateView>(DIALOG_DATA));
  readonly busy = signal(false);
  readonly ending = signal(false);
  readonly endReason = signal<string | null>(null);
  readonly endOptions: DsRadioOption[] = AGENCY_END_REASONS.map(r => ({ value: r, label: AGENCY_END_REASON_CHOICES[r] ?? r }));
  readonly typeLabel = MANDATE_TYPE_LABELS[this.m().mandateType] ?? this.m().mandateType;
  readonly commission = commissionLabel(this.m().commissionKind, this.m().commissionValue, this.m().commissionPayer);

  status() {
    return MANDATE_STATUS[this.m().status] ?? { label: this.m().status, status: 'neutral' as const };
  }

  live(): boolean {
    return this.m().status === 'MANDATE_PENDING_SIGNATURE' || this.m().status === 'MANDATE_ACTIVE';
  }

  endedLine(): string {
    const m = this.m();
    const by = m.endedBy === 'OWNER' ? 'par le propriétaire' : m.endedBy === 'AGENCY' ? 'par votre agence' : '';
    const reason = m.endReason ? END_REASON_LABELS[m.endReason] ?? m.endReason : '';
    return `Terminé${by ? ' ' + by : ''} : ${reason.charAt(0).toLowerCase()}${reason.slice(1)}.`;
  }

  end(): void {
    const reason = this.endReason();
    if (!reason) return;
    this.busy.set(true);
    this.api.endMandate(this.m().id, reason).subscribe({
      next: updated => { this.busy.set(false); this.ending.set(false); this.m.set(updated); this.toast.success('Mandat terminé, le propriétaire est prévenu'); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Action impossible')); },
    });
  }

  signed(): void {
    this.busy.set(true);
    this.api.markSigned(this.m().id).subscribe({
      next: updated => { this.busy.set(false); this.m.set(updated); this.toast.success('Mandat signé : vous pouvez publier le bien'); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Action impossible')); },
    });
  }

  annonce(): void {
    this.busy.set(true);
    this.api.createAnnonce(this.m().id).subscribe({
      next: r => {
        this.busy.set(false);
        this.ref.close({ ...this.m(), annonceId: r.annonceId });
        this.router.navigate(['/pro/annonces', r.annonceId, 'edit']);
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Création impossible')); },
    });
  }

  openDossier(): void {
    this.ref.close(this.m());
    this.router.navigate(['/pro/dossiers', this.m().dossierId]);
  }
}
