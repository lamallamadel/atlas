import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule, NgForm } from '@angular/forms';
import {
  DsButtonComponent,
  DsDialogActionsComponent,
  DsDialogContentComponent,
  DsDialogHeaderComponent,
  DsInputComponent,
  DsSelectComponent,
  DsTextareaComponent,
  DsToastService,
} from '../../design-system';
import type { DsSelectOption } from '../../design-system';
import { OwnerApiService, OwnerProperty, OwnerPropertyRequest } from '../../services/owner-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';

export interface OwnerPropertyDialogData {
  /** Bien à modifier ; absent pour en déclarer un nouveau. */
  property?: OwnerProperty;
}

const TYPES = ['Appartement', 'Maison', 'Villa', 'Studio', 'Riad', 'Terrain', 'Local commercial', 'Bureau'];

/** Déclarer ou modifier un bien (UC-P2). L'adresse précise reste privée. */
@Component({
  selector: 'app-owner-property-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DsButtonComponent, DsDialogActionsComponent, DsDialogContentComponent, DsDialogHeaderComponent, DsInputComponent, DsSelectComponent, DsTextareaComponent],
  template: `
    <form #f="ngForm" (ngSubmit)="submit(f)">
      <ds-dialog-header [subtitle]="editing ? 'Ces informations alimentent votre annonce.' : 'Décrivez-le une fois ; vous déciderez ensuite de le publier ou de le confier à un agent.'" (close)="ref.close()">
        {{ editing ? 'Modifier le bien' : 'Déclarer un bien' }}
      </ds-dialog-header>
      <ds-dialog-content>
        <div class="ds-form-stack">
          <ds-input label="Titre" name="title" placeholder="Appartement 3 pièces vue mer" [(ngModel)]="draft.title" required></ds-input>
          <div class="pd-row">
            <ds-select label="Je souhaite" name="transactionType" [options]="transactions" [(ngModel)]="draft.transactionType" required></ds-select>
            <ds-select label="Type de bien" name="propertyType" [options]="types" [(ngModel)]="draft.propertyType"></ds-select>
          </div>
          <div class="pd-row">
            <ds-input label="Ville" name="city" prefixIcon="map-pin" [(ngModel)]="draft.city" required></ds-input>
            <ds-input label="Quartier (affiché)" name="district" [(ngModel)]="draft.district"></ds-input>
          </div>
          <ds-input label="Adresse précise (jamais affichée)" name="address" prefixIcon="lock" [(ngModel)]="draft.address"></ds-input>
          <div class="pd-row pd-row--3">
            <ds-input label="Surface (m²)" type="number" name="surface" prefixIcon="area" [(ngModel)]="draft.surface"></ds-input>
            <ds-input label="Pièces" type="number" name="rooms" [(ngModel)]="draft.rooms"></ds-input>
            <ds-input [label]="draft.transactionType === 'RENT' ? 'Loyer souhaité (MAD)' : 'Prix souhaité (MAD)'" type="number" name="expectedPrice" prefixIcon="coin" [(ngModel)]="draft.expectedPrice"></ds-input>
          </div>
          <ds-textarea label="Description" name="description" [rows]="4" [(ngModel)]="draft.description"></ds-textarea>
          <ds-input label="N° de titre foncier (facultatif, jamais affiché)" name="landTitleNumber" [(ngModel)]="draft.landTitleNumber"></ds-input>
        </div>
      </ds-dialog-content>
      <ds-dialog-actions>
        <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
        <ds-button variant="marine" nativeType="submit" [loading]="saving()" [disabled]="saving() || !!f.invalid">
          {{ editing ? 'Enregistrer' : 'Déclarer le bien' }}
        </ds-button>
      </ds-dialog-actions>
    </form>
  `,
  styles: [`
    .pd-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ds-space-4); }
    .pd-row--3 { grid-template-columns: 1fr 1fr 1fr; }
    @media (max-width: 520px) { .pd-row, .pd-row--3 { grid-template-columns: 1fr; } }
  `],
})
export class OwnerPropertyDialogComponent {
  readonly ref = inject<DialogRef<OwnerProperty>>(DialogRef);
  private readonly data = inject<OwnerPropertyDialogData>(DIALOG_DATA, { optional: true }) ?? {};
  private readonly api = inject(OwnerApiService);
  private readonly toast = inject(DsToastService);

  readonly editing = !!this.data.property;
  readonly saving = signal(false);
  readonly transactions: DsSelectOption[] = [
    { value: 'SALE', label: 'Vendre' },
    { value: 'RENT', label: 'Louer' },
  ];
  readonly types: DsSelectOption[] = TYPES.map(t => ({ value: t, label: t }));

  draft: OwnerPropertyRequest = this.data.property
    ? { ...this.data.property }
    : {
        title: '', propertyType: 'Appartement', transactionType: 'SALE', city: '', district: '', address: '',
        surface: null, rooms: null, expectedPrice: null, description: '', landTitleNumber: '',
      };

  submit(form: NgForm): void {
    if (form.invalid || this.saving()) return;
    this.saving.set(true);
    const request: OwnerPropertyRequest = {
      ...this.draft,
      surface: num(this.draft.surface),
      rooms: num(this.draft.rooms),
      expectedPrice: num(this.draft.expectedPrice),
    };
    const call = this.data.property
      ? this.api.updateProperty(this.data.property.id, request)
      : this.api.createProperty(request);
    call.subscribe({
      next: p => { this.saving.set(false); this.toast.success(this.editing ? 'Bien enregistré' : 'Bien déclaré'); this.ref.close(p); },
      error: err => { this.saving.set(false); this.toast.error(serverMessage(err, 'Enregistrement impossible')); },
    });
  }
}

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}
