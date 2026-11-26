import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import {
  DsButtonComponent,
  DsCheckboxComponent,
  DsDialogActionsComponent,
  DsDialogContentComponent,
  DsDialogHeaderComponent,
  DsIconComponent,
  DsInputComponent,
  DsRadioGroupComponent,
  DsSelectComponent,
  DsSkeletonComponent,
  DsTextareaComponent,
  DsToastService,
} from '../../design-system';
import type { DsRadioOption, DsSelectOption } from '../../design-system';
import { AgencyCard, MandateType, OwnerMandateApiService, OwnerRequest, RequestVisibility, SERVICE_LABELS, ratingLabel } from '../../services/mandate-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';

export interface OwnerMandateRequestDialogData {
  propertyId: number;
  propertyTitle: string;
  city: string;
  transactionType: 'SALE' | 'RENT';
  expectedPrice: number | null;
}

/**
 * Confier son bien à un agent (UC-P5) : à toutes les agences vérifiées de la ville (bourse) ou à
 * une agence choisie dans l'annuaire (demande directe). Les agences ne voient ni l'adresse ni le
 * téléphone avant que le propriétaire accepte une proposition.
 */
@Component({
  selector: 'app-owner-mandate-request-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DsButtonComponent, DsCheckboxComponent, DsDialogActionsComponent, DsDialogContentComponent,
    DsDialogHeaderComponent, DsIconComponent, DsInputComponent, DsRadioGroupComponent, DsSelectComponent,
    DsSkeletonComponent, DsTextareaComponent,
  ],
  template: `
    <form #f="ngForm" (ngSubmit)="submit()">
      <ds-dialog-header [subtitle]="data.propertyTitle" (close)="ref.close()">Confier mon bien à un agent</ds-dialog-header>
      <ds-dialog-content>
        <div class="ds-form-stack">
          <ds-radio-group label="À qui s'adresse votre demande ?" name="visibility" [options]="visibilityOptions" [(ngModel)]="visibility" (valueChange)="onVisibility($event)"></ds-radio-group>

          @if (visibility === 'MREQ_DIRECT') {
            <fieldset class="md-agencies">
              <legend class="md-legend">Agences vérifiées à {{ data.city }}</legend>
              @if (loadingAgencies()) {
                <ds-skeleton variant="rect" width="100%" height="88px"></ds-skeleton>
              } @else if (!agencies().length) {
                <p class="md-muted">Aucune agence vérifiée ne couvre encore {{ data.city }}. Adressez votre demande à toutes les agences.</p>
              } @else {
                @for (a of agencies(); track a.orgId) {
                  <label class="md-agency" [class.md-agency--on]="target === a.orgId">
                    <input type="radio" name="target" [value]="a.orgId" [(ngModel)]="target" required />
                    <span class="md-agency__body">
                      <span class="md-strong">{{ a.name }}@if (rating(a); as rl) { <span class="md-rating"> · {{ rl }}</span> }</span>
                      @if (a.description) { <span class="md-muted">{{ a.description }}</span> }
                      @if (a.districts.length) { <span class="md-faint">Quartiers : {{ a.districts.join(', ') }}</span> }
                    </span>
                  </label>
                }
              }
            </fieldset>
          }

          <fieldset class="md-group">
            <legend class="md-legend">Mandat accepté</legend>
            <ds-checkbox name="simple" label="Mandat simple" description="Plusieurs agences peuvent vendre ; vous gardez votre annonce." [(ngModel)]="simple"></ds-checkbox>
            <ds-checkbox name="exclusive" label="Mandat exclusif" description="Une seule agence ; votre annonce est suspendue pendant le mandat." [(ngModel)]="exclusive"></ds-checkbox>
          </fieldset>

          <fieldset class="md-group md-services">
            <legend class="md-legend">Services attendus</legend>
            @for (s of serviceKeys; track s) {
              <ds-checkbox [name]="'svc-' + s" [label]="labels[s]" [ngModel]="services.has(s)" (ngModelChange)="toggleService(s, $event)"></ds-checkbox>
            }
          </fieldset>

          <div class="md-row">
            <ds-input [label]="data.transactionType === 'RENT' ? 'Loyer souhaité (MAD)' : 'Prix souhaité (MAD)'" name="price" type="number" [(ngModel)]="price"></ds-input>
            <ds-select label="Échéance" name="deadline" [options]="deadlines" [(ngModel)]="deadline"></ds-select>
          </div>
          <ds-input label="Vos disponibilités pour les visites" name="availability" placeholder="Ex. le samedi matin, en semaine après 18 h" [(ngModel)]="availability"></ds-input>
          <div class="md-row">
            <ds-input label="Langues souhaitées" name="languages" placeholder="Ex. français, darija" [(ngModel)]="languages"></ds-input>
            <ds-input label="Commission attendue" name="commission" placeholder="Ex. 2 % au plus" [(ngModel)]="commissionNote"></ds-input>
          </div>
          <ds-textarea label="Message aux agences" name="message" [rows]="3" [maxLength]="2000" [(ngModel)]="message"
            placeholder="Ce qui compte pour vous (vos coordonnées écrites ici seront masquées)"></ds-textarea>
          <p class="md-help"><ds-icon name="lock" [size]="16"></ds-icon> Les agences voient la ville, le quartier et les caractéristiques du bien. Votre adresse et votre téléphone ne sont transmis qu'à l'agence que vous choisirez, après confirmation par code.</p>
        </div>
      </ds-dialog-content>
      <ds-dialog-actions>
        <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
        <ds-button variant="marine" nativeType="submit" prefixIcon="send" [loading]="saving()" [disabled]="saving() || !valid()">Envoyer la demande</ds-button>
      </ds-dialog-actions>
    </form>
  `,
  styles: [`
    .md-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ds-space-3); }
    @media (max-width: 560px) { .md-row { grid-template-columns: 1fr; } }
    .md-group, .md-agencies { display: flex; flex-direction: column; gap: var(--ds-space-2); margin: 0; padding: 0; border: 0; }
    .md-services { display: grid; grid-template-columns: 1fr 1fr; }
    .md-services .md-legend { grid-column: 1 / -1; }
    .md-legend { margin-bottom: var(--ds-space-1); padding: 0; font-size: var(--ds-text-xs); font-weight: 600; color: var(--ds-text-muted); letter-spacing: 1.2px; text-transform: uppercase; }
    .md-agency { display: flex; gap: var(--ds-space-3); align-items: flex-start; padding: var(--ds-space-3); border: 1px solid var(--ds-divider); border-radius: var(--ds-radius-md); cursor: pointer; }
    .md-agency--on { border-color: var(--ds-marine); background: var(--ds-surface-2); }
    .md-agency input { margin-top: 3px; accent-color: var(--ds-marine); }
    .md-agency__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .md-rating { font-weight: 400; color: var(--ds-text-muted); }
    .md-strong { font-weight: 600; color: var(--ds-text); }
    .md-muted { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .md-faint { font-size: var(--ds-text-xs); color: var(--ds-text-faint); }
    .md-help { display: flex; gap: var(--ds-space-2); align-items: flex-start; margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
  `],
})
export class OwnerMandateRequestDialogComponent implements OnInit {
  rating(a: AgencyCard): string | null { return ratingLabel(a.rating, a.reviews); }
  readonly ref = inject<DialogRef<OwnerRequest>>(DialogRef);
  readonly data = inject<OwnerMandateRequestDialogData>(DIALOG_DATA);
  private readonly api = inject(OwnerMandateApiService);
  private readonly toast = inject(DsToastService);

  readonly saving = signal(false);
  readonly agencies = signal<AgencyCard[]>([]);
  readonly loadingAgencies = signal(false);
  readonly labels = SERVICE_LABELS;
  readonly serviceKeys = Object.keys(SERVICE_LABELS).filter(k =>
    this.data.transactionType === 'RENT' ? k !== 'LEGAL' : k !== 'TENANT_SELECTION' && k !== 'RENT_MANAGEMENT');
  readonly visibilityOptions: DsRadioOption[] = [
    { value: 'MREQ_OPEN_MARKET', label: 'Toutes les agences vérifiées de ma ville', description: 'Jusqu’à 5 propositions à comparer, pendant 14 jours.' },
    { value: 'MREQ_DIRECT', label: 'Une agence que je choisis', description: 'Elle a 72 h pour répondre ; vous pourrez ensuite ouvrir la demande à toutes.' },
  ];
  readonly deadlines: DsSelectOption[] = [
    { value: 'ASAP', label: 'Dès que possible' },
    { value: '3_MONTHS', label: 'Sous 3 mois' },
    { value: '6_MONTHS', label: 'Sous 6 mois' },
    { value: 'FLEXIBLE', label: 'Pas pressé' },
  ];

  visibility: RequestVisibility = 'MREQ_OPEN_MARKET';
  target: string | null = null;
  simple = true;
  exclusive = true;
  services = new Set<string>(['VISITS', 'PHOTOS']);
  price: number | null = this.data.expectedPrice;
  deadline = '3_MONTHS';
  availability = '';
  languages = '';
  commissionNote = '';
  message = '';

  ngOnInit(): void {
    this.loadingAgencies.set(true);
    this.api.agencies(this.data.city, this.data.transactionType).subscribe({
      next: list => { this.agencies.set(list); this.loadingAgencies.set(false); },
      error: () => this.loadingAgencies.set(false),
    });
  }

  onVisibility(value: RequestVisibility): void {
    if (value !== 'MREQ_DIRECT') this.target = null;
  }

  toggleService(key: string, on: boolean): void {
    const next = new Set(this.services);
    if (on) next.add(key); else next.delete(key);
    this.services = next;
  }

  valid(): boolean {
    return (this.simple || this.exclusive) && (this.visibility !== 'MREQ_DIRECT' || !!this.target);
  }

  submit(): void {
    if (!this.valid() || this.saving()) return;
    const types: MandateType[] = [];
    if (this.simple) types.push('SIMPLE');
    if (this.exclusive) types.push('EXCLUSIVE');
    this.saving.set(true);
    this.api.create({
      propertyId: this.data.propertyId,
      visibility: this.visibility,
      targetAgencyOrgId: this.target,
      expectedPrice: this.price ? Number(this.price) : null,
      deadline: this.deadline,
      mandateTypes: types,
      services: [...this.services],
      availability: this.availability || null,
      languages: this.languages || null,
      commissionNote: this.commissionNote || null,
      message: this.message || null,
    }).subscribe({
      next: r => { this.saving.set(false); this.toast.success('Demande envoyée aux agences'); this.ref.close(r); },
      error: err => { this.saving.set(false); this.toast.error(serverMessage(err, 'Envoi impossible')); },
    });
  }
}
