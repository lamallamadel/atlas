import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule, NgForm } from '@angular/forms';
import {
  DsButtonComponent,
  DsDialogActionsComponent,
  DsDialogContentComponent,
  DsDialogHeaderComponent,
  DsIconComponent,
  DsInputComponent,
  DsSelectComponent,
  DsToastService,
} from '../../design-system';
import type { DsSelectOption } from '../../design-system';
import { OwnerApiService, OwnerConversation } from '../../services/owner-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';

export interface OwnerVisitDialogData {
  leadId: number;
  prospectName: string | null;
}

interface SlotDraft {
  start: string;
  minutes: string;
}

/** `yyyy-MM-ddTHH:mm` local, sans secondes ni fuseau (le format de `datetime-local`). */
export function localInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Ajoute des minutes à une valeur `datetime-local` et renvoie le même format. */
export function addMinutes(value: string, minutes: number): string {
  const d = new Date(value);
  d.setMinutes(d.getMinutes() + minutes);
  return localInputValue(d);
}

/** Proposer 1 à 3 créneaux de visite au prospect (UC-P4) ; il en choisit un par son lien. */
@Component({
  selector: 'app-owner-visit-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DsButtonComponent, DsDialogActionsComponent, DsDialogContentComponent, DsDialogHeaderComponent, DsIconComponent, DsInputComponent, DsSelectComponent],
  template: `
    <form #f="ngForm" (ngSubmit)="submit(f)">
      <ds-dialog-header [subtitle]="subtitle" (close)="ref.close()">Proposer des créneaux de visite</ds-dialog-header>
      <ds-dialog-content>
        <div class="ds-form-stack">
          @for (slot of slots; track $index; let i = $index) {
            <div class="vd-row">
              <ds-input [label]="'Créneau ' + (i + 1)" type="datetime-local" [name]="'start' + i" [(ngModel)]="slot.start" required></ds-input>
              <ds-select label="Durée" [name]="'minutes' + i" [options]="durations" [(ngModel)]="slot.minutes"></ds-select>
              @if (slots.length > 1) {
                <ds-button variant="icon" size="md" prefixIcon="trash" [ariaLabel]="'Retirer le créneau ' + (i + 1)" (dsClick)="remove(i)"></ds-button>
              }
            </div>
          }
          @if (slots.length < 3) {
            <div><ds-button variant="ghost" size="sm" prefixIcon="plus" (dsClick)="add()">Ajouter un créneau</ds-button></div>
          }
          <p class="vd-help"><ds-icon name="info" [size]="16"></ds-icon> Les créneaux encore en attente sont remplacés. L'adresse exacte n'est pas transmise : donnez-la par message si vous le souhaitez.</p>
        </div>
      </ds-dialog-content>
      <ds-dialog-actions>
        <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
        <ds-button variant="marine" nativeType="submit" prefixIcon="send" [loading]="saving()" [disabled]="saving() || !!f.invalid">Envoyer les créneaux</ds-button>
      </ds-dialog-actions>
    </form>
  `,
  styles: [`
    .vd-row { display: grid; grid-template-columns: minmax(0, 1fr) 140px auto; gap: var(--ds-space-3); align-items: end; }
    @media (max-width: 520px) { .vd-row { grid-template-columns: 1fr; } }
    .vd-help { display: flex; gap: var(--ds-space-2); align-items: flex-start; margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
  `],
})
export class OwnerVisitDialogComponent {
  readonly ref = inject<DialogRef<OwnerConversation>>(DialogRef);
  private readonly data = inject<OwnerVisitDialogData>(DIALOG_DATA);
  private readonly api = inject(OwnerApiService);
  private readonly toast = inject(DsToastService);

  readonly saving = signal(false);
  readonly subtitle = `${this.data.prospectName || 'Le prospect'} recevra un lien pour choisir le créneau qui lui convient.`;
  readonly durations: DsSelectOption[] = [
    { value: '30', label: '30 min' },
    { value: '45', label: '45 min' },
    { value: '60', label: '1 h' },
    { value: '90', label: '1 h 30' },
  ];

  slots: SlotDraft[] = [{ start: this.defaultStart(1), minutes: '45' }];

  add(): void {
    this.slots = [...this.slots, { start: this.defaultStart(this.slots.length + 1), minutes: '45' }];
  }

  remove(i: number): void {
    this.slots = this.slots.filter((_, j) => j !== i);
  }

  submit(form: NgForm): void {
    if (form.invalid || this.saving()) return;
    this.saving.set(true);
    const request = this.slots.map(s => ({ start: s.start, end: addMinutes(s.start, Number(s.minutes)) }));
    this.api.proposeVisits(this.data.leadId, request).subscribe({
      next: conv => { this.saving.set(false); this.toast.success('Créneaux envoyés'); this.ref.close(conv); },
      error: err => { this.saving.set(false); this.toast.error(serverMessage(err, 'Envoi impossible')); },
    });
  }

  /** Demain (puis les jours suivants) à 10 h. */
  private defaultStart(daysAhead: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(10, 0, 0, 0);
    return localInputValue(d);
  }
}
