import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import {
  DsButtonComponent,
  DsDialogActionsComponent,
  DsDialogContentComponent,
  DsDialogHeaderComponent,
  DsIconComponent,
  DsInputComponent,
  DsRadioGroupComponent,
  DsRadioOption,
  DsTextareaComponent,
} from '../../design-system';
import { MandateOffer, OfferDecision, madLabel } from '../../services/mandate-api.service';

export interface OfferDialogData {
  offer: MandateOffer;
  agencyName: string;
  /** Une offre est déjà acceptée : on ne peut pas en accepter une seconde. */
  acceptBlocked: boolean;
}

export interface OfferDialogResult {
  decision: OfferDecision;
  counterAmount: number | null;
  comment: string | null;
}

/** Réponse du propriétaire à une offre (UC-P8) : accepter, refuser ou contre-proposer. */
@Component({
  selector: 'app-owner-offer-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, DsButtonComponent, DsDialogActionsComponent, DsDialogContentComponent, DsDialogHeaderComponent, DsIconComponent, DsInputComponent, DsRadioGroupComponent, DsTextareaComponent],
  template: `
    <ds-dialog-header [subtitle]="'Transmise par ' + d.agencyName" (close)="ref.close()">Offre de {{ amount }}</ds-dialog-header>
    <ds-dialog-content>
      <div class="ds-form-stack">
        <dl class="of-facts">
          @if (d.offer.buyerSummary) { <dt>Acquéreur</dt><dd>{{ d.offer.buyerSummary }}</dd> }
          @if (d.offer.conditions) { <dt>Conditions</dt><dd>{{ d.offer.conditions }}</dd> }
          @if (d.offer.validUntil) { <dt>Valable jusqu'au</dt><dd>{{ d.offer.validUntil | date: 'd MMMM y' }}</dd> }
          <dt>Reçue le</dt><dd>{{ d.offer.createdAt | date: 'd MMMM' }}</dd>
        </dl>
        <ds-radio-group name="decision" label="Votre réponse" [options]="options" [ngModel]="decision()" (ngModelChange)="decision.set($event)"></ds-radio-group>
        @if (decision() === 'COUNTER') {
          <ds-input label="Votre prix (MAD)" name="counter" type="number" prefixIcon="coin" [ngModel]="counter()" (ngModelChange)="counter.set($event)"
            [error]="counterError()"></ds-input>
        }
        <ds-textarea label="Message à l'agence (facultatif)" name="comment" [rows]="3" [maxLength]="1000" [(ngModel)]="comment"></ds-textarea>
        <p class="of-hint">
          <ds-icon name="info" [size]="16"></ds-icon>
          <span>{{ hint() }}</span>
        </p>
      </div>
    </ds-dialog-content>
    <ds-dialog-actions>
      <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
      <ds-button variant="marine" prefixIcon="check" [disabled]="!valid()" (dsClick)="confirm()">Envoyer ma réponse</ds-button>
    </ds-dialog-actions>
  `,
  styles: [`
    .of-facts { display: grid; grid-template-columns: auto 1fr; gap: var(--ds-space-2) var(--ds-space-4); margin: 0; font-size: var(--ds-text-sm); }
    .of-facts dt { color: var(--ds-text-muted); }
    .of-facts dd { margin: 0; color: var(--ds-text); white-space: pre-line; }
    .of-hint { display: flex; gap: var(--ds-space-2); align-items: flex-start; margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .of-hint ds-icon { flex: none; margin-top: 2px; }
  `],
})
export class OwnerOfferDialogComponent {
  readonly ref = inject<DialogRef<OfferDialogResult>>(DialogRef);
  readonly d = inject<OfferDialogData>(DIALOG_DATA);
  readonly amount = madLabel(this.d.offer.amount);

  readonly options: DsRadioOption[] = [
    { value: 'ACCEPT', label: 'J\'accepte cette offre', disabled: this.d.acceptBlocked,
      description: this.d.acceptBlocked ? 'Vous avez déjà accepté une autre offre.' : 'L\'agence prépare le compromis avec l\'acquéreur.' },
    { value: 'COUNTER', label: 'Je fais une contre-proposition', description: 'Vous indiquez votre prix, l\'agence le transmet.' },
    { value: 'REFUSE', label: 'Je refuse cette offre' },
  ];

  readonly decision = signal<OfferDecision | null>(null);
  readonly counter = signal<number | string | null>(null);
  comment = '';

  readonly counterValue = computed(() => {
    const v = Number(this.counter());
    return Number.isFinite(v) && v > 0 ? v : null;
  });
  readonly counterError = computed(() => {
    const v = this.counterValue();
    return v != null && v <= this.d.offer.amount ? 'Indiquez un prix supérieur à l\'offre, sinon acceptez-la.' : null;
  });
  readonly valid = computed(() => {
    const dec = this.decision();
    if (!dec) return false;
    if (dec === 'COUNTER') return this.counterValue() != null && !this.counterError();
    return true;
  });
  readonly hint = computed(() => {
    switch (this.decision()) {
      case 'ACCEPT': return 'Accepter ne vaut pas vente : rien n\'est signé avant le compromis.';
      case 'COUNTER': return `${this.d.agencyName} transmet votre prix à l'acquéreur, qui peut faire une nouvelle offre.`;
      case 'REFUSE': return `${this.d.agencyName} est prévenue ; le bien reste en vente.`;
      default: return `Votre réponse est transmise à ${this.d.agencyName}. Elle ne peut plus être modifiée.`;
    }
  });

  confirm(): void {
    const decision = this.decision();
    if (!decision || !this.valid()) return;
    this.ref.close({
      decision,
      counterAmount: decision === 'COUNTER' ? this.counterValue() : null,
      comment: this.comment.trim() || null,
    });
  }
}
