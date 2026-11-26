import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import {
  DsButtonComponent,
  DsDialogActionsComponent,
  DsDialogContentComponent,
  DsDialogHeaderComponent,
  DsIconComponent,
  DsRadioGroupComponent,
  DsRadioOption,
} from '../../design-system';
import { END_REASON_LABELS, OWNER_END_REASON_CHOICES } from '../../services/mandate-api.service';

export interface EndMandateDialogData {
  agencyName: string;
  exclusive: boolean;
  signed: boolean;
  reasons: string[];
}

/** Fin de mandat (UC-P9) : un motif est obligatoire, il est communiqué à l'autre partie. */
@Component({
  selector: 'app-owner-end-mandate-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DsButtonComponent, DsDialogActionsComponent, DsDialogContentComponent, DsDialogHeaderComponent, DsIconComponent, DsRadioGroupComponent],
  template: `
    <ds-dialog-header [subtitle]="d.agencyName" (close)="ref.close()">Terminer le mandat</ds-dialog-header>
    <ds-dialog-content>
      <div class="ds-form-stack">
        <ds-radio-group name="reason" label="Motif" [options]="options" [(ngModel)]="reason"></ds-radio-group>
        <p class="em-hint">
          <ds-icon name="info" [size]="16"></ds-icon>
          <span>{{ hint }}</span>
        </p>
      </div>
    </ds-dialog-content>
    <ds-dialog-actions>
      <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
      <ds-button variant="marine" prefixIcon="check" [disabled]="!reason()" (dsClick)="ref.close(reason() ?? undefined)">Terminer le mandat</ds-button>
    </ds-dialog-actions>
  `,
  styles: [`
    .em-hint { display: flex; gap: var(--ds-space-2); align-items: flex-start; margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .em-hint ds-icon { flex: none; margin-top: 2px; }
  `],
})
export class OwnerEndMandateDialogComponent {
  readonly ref = inject<DialogRef<string>>(DialogRef);
  readonly d = inject<EndMandateDialogData>(DIALOG_DATA);
  readonly reason = signal<string | null>(null);
  readonly options: DsRadioOption[] = this.d.reasons.map(r => ({ value: r, label: OWNER_END_REASON_CHOICES[r] ?? END_REASON_LABELS[r] ?? r }));
  readonly hint = [
    `${this.d.agencyName} est prévenue du motif.`,
    this.d.exclusive ? 'Vous pourrez republier votre annonce ou demander d\'autres propositions.' : '',
    this.d.signed ? 'Vous pourrez ensuite noter l\'agence.' : '',
  ].filter(Boolean).join(' ');
}
