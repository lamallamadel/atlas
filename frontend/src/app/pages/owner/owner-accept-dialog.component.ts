import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import {
  DsButtonComponent,
  DsDialogActionsComponent,
  DsDialogContentComponent,
  DsDialogHeaderComponent,
  DsIconComponent,
  DsInputComponent,
  DsToastService,
} from '../../design-system';
import { MANDATE_TYPE_LABELS, MandateView, OwnerMandateApiService, OwnerProposal, commissionLabel } from '../../services/mandate-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';

/**
 * Accepter une proposition (UC-P7) : récapitulatif, consentement explicite au partage des
 * coordonnées avec cette seule agence, puis confirmation par le code reçu (R-PROP-09).
 */
@Component({
  selector: 'app-owner-accept-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DsButtonComponent, DsDialogActionsComponent, DsDialogContentComponent, DsDialogHeaderComponent, DsIconComponent, DsInputComponent],
  template: `
    <ds-dialog-header [subtitle]="p.agencyName" (close)="ref.close()">Confier mon bien à cette agence</ds-dialog-header>
    <ds-dialog-content>
      <div class="ds-form-stack">
        <dl class="ad-facts">
          <dt>Mandat</dt><dd>{{ typeLabel }} · {{ p.durationMonths }} mois</dd>
          <dt>Commission</dt><dd>{{ commission }}</dd>
          @if (p.estimateMin || p.estimateMax) {
            <dt>Estimation</dt><dd>{{ estimate }}</dd>
          }
        </dl>
        @if (p.mandateType === 'EXCLUSIVE') {
          <p class="ad-warn"><ds-icon name="alert-circle" [size]="16"></ds-icon><span>Exclusif : votre annonce sera suspendue et les autres propositions écartées pendant {{ p.durationMonths }} mois.</span></p>
        }
        <p class="ad-consent"><ds-icon name="lock" [size]="16"></ds-icon><span>En confirmant, vous acceptez que votre nom, votre téléphone et l'adresse du bien soient transmis à <strong>{{ p.agencyName }}</strong>, et à elle seule. La signature du mandat se fait ensuite avec l'agence.</span></p>

        @if (step() === 'code') {
          <ds-input label="Code reçu par {{ channel() === 'WHATSAPP' ? 'WhatsApp' : 'SMS' }}" name="code" inputmode="numeric" autocomplete="one-time-code" [(ngModel)]="code" placeholder="6 chiffres"></ds-input>
          <div><ds-button variant="ghost" size="sm" [disabled]="busy()" (dsClick)="sendCode()">Renvoyer le code</ds-button></div>
        }
      </div>
    </ds-dialog-content>
    <ds-dialog-actions>
      <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
      @if (step() === 'confirm') {
        <ds-button variant="marine" prefixIcon="send" [loading]="busy()" [disabled]="busy()" (dsClick)="sendCode()">Recevoir le code</ds-button>
      } @else {
        <ds-button variant="marine" prefixIcon="check" [loading]="busy()" [disabled]="busy() || code.trim().length < 6" (dsClick)="confirm()">Confirmer</ds-button>
      }
    </ds-dialog-actions>
  `,
  styles: [`
    .ad-facts { display: grid; grid-template-columns: auto 1fr; gap: var(--ds-space-2) var(--ds-space-4); margin: 0; font-size: var(--ds-text-sm); }
    .ad-facts dt { color: var(--ds-text-muted); }
    .ad-facts dd { margin: 0; font-weight: 600; color: var(--ds-text); }
    .ad-warn ds-icon, .ad-consent ds-icon { flex: none; margin-top: 2px; }
    .ad-warn, .ad-consent { display: flex; gap: var(--ds-space-2); align-items: flex-start; margin: 0; font-size: var(--ds-text-sm); }
    .ad-warn { color: var(--ds-warning); }
    .ad-consent { color: var(--ds-text-muted); }
  `],
})
export class OwnerAcceptDialogComponent {
  readonly ref = inject<DialogRef<MandateView>>(DialogRef);
  readonly p = inject<OwnerProposal>(DIALOG_DATA);
  private readonly api = inject(OwnerMandateApiService);
  private readonly toast = inject(DsToastService);

  readonly step = signal<'confirm' | 'code'>('confirm');
  readonly busy = signal(false);
  readonly channel = signal('SMS');
  readonly typeLabel = MANDATE_TYPE_LABELS[this.p.mandateType] ?? this.p.mandateType;
  readonly commission = commissionLabel(this.p.commissionKind, this.p.commissionValue, this.p.commissionPayer);
  readonly estimate = [this.p.estimateMin, this.p.estimateMax].filter(v => v != null).map(v => Number(v).toLocaleString('fr-FR')).join(' – ') + ' MAD';
  code = '';

  sendCode(): void {
    this.busy.set(true);
    this.api.startAccept(this.p.id).subscribe({
      next: r => { this.busy.set(false); this.channel.set(r.channel); this.step.set('code'); this.toast.success('Code envoyé'); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Envoi du code impossible')); },
    });
  }

  confirm(): void {
    this.busy.set(true);
    this.api.accept(this.p.id, this.code.trim()).subscribe({
      next: m => { this.busy.set(false); this.toast.success('Mandat confié : l’agence va vous contacter'); this.ref.close(m); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Code incorrect')); },
    });
  }
}
