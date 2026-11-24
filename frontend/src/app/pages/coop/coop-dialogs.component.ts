import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule, NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import {
  DsButtonComponent,
  DsDialogActionsComponent,
  DsDialogContentComponent,
  DsDialogHeaderComponent,
  DsInputComponent,
  DsSelectComponent,
  DsToastService,
} from '../../design-system';
import type { DsSelectOption } from '../../design-system';
import {
  CONTRIBUTION_TYPE_LABELS,
  CoopApiService,
  CoopContribution,
  CoopContributionType,
  CoopGroup,
  CoopLot,
  CoopMember,
  CoopProject,
} from '../../services/coop-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';

const DIALOG_IMPORTS = [
  FormsModule,
  DsButtonComponent,
  DsDialogActionsComponent,
  DsDialogContentComponent,
  DsDialogHeaderComponent,
  DsInputComponent,
];
const DIALOG_IMPORTS_WITH_SELECT = [...DIALOG_IMPORTS, DsSelectComponent];

const DIALOG_STYLES = `
  .cd-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ds-space-4); }
  @media (max-width: 480px) { .cd-row { grid-template-columns: 1fr; } }
`;

/** Envoi commun : bouton occupé, toast de succès, fermeture avec l'objet créé ; la boîte reste ouverte en cas d'erreur. */
abstract class CoopDialogBase<R> {
  readonly ref = inject<DialogRef<R>>(DialogRef);
  protected readonly api = inject(CoopApiService);
  private readonly toast = inject(DsToastService);
  readonly saving = signal(false);

  protected send(form: NgForm, call: Observable<R>, success: (r: R) => string, failure: string): void {
    if (form.invalid || this.saving()) return;
    this.saving.set(true);
    call.subscribe({
      next: r => {
        this.saving.set(false);
        this.toast.success(success(r));
        this.ref.close(r);
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(serverMessage(err, failure));
      },
    });
  }
}

/** Nombre strictement positif, sinon `null` (champ vide ou invalide). */
const positive = (v: number | string | null | undefined): number | null => {
  const n = Number(v);
  return v !== '' && v != null && n > 0 ? n : null;
};

/** Nouveau groupement d'habitat. */
@Component({
  selector: 'app-coop-group-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: DIALOG_IMPORTS,
  template: `
    <form #f="ngForm" (ngSubmit)="submit(f)">
      <ds-dialog-header subtitle="Coopérative ou association d'habitat suivie par l'agence." (close)="ref.close()">
        Nouveau groupement
      </ds-dialog-header>
      <ds-dialog-content>
        <div class="ds-form-stack">
          <ds-input label="Nom" name="name" [(ngModel)]="draft.name" required></ds-input>
          <div class="cd-row">
            <ds-input label="Ville" name="city" prefixIcon="map-pin" [(ngModel)]="draft.city"></ds-input>
            <ds-input label="N° d'enregistrement" name="registrationNumber" [(ngModel)]="draft.registrationNumber"></ds-input>
          </div>
        </div>
      </ds-dialog-content>
      <ds-dialog-actions>
        <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
        <ds-button variant="marine" nativeType="submit" [loading]="saving()" [disabled]="saving() || !!f.invalid">Créer le groupement</ds-button>
      </ds-dialog-actions>
    </form>
  `,
  styles: [DIALOG_STYLES],
})
export class CoopGroupDialogComponent extends CoopDialogBase<CoopGroup> {
  draft = { name: '', city: '', registrationNumber: '' };

  submit(form: NgForm): void {
    this.send(
      form,
      this.api.createGroup({
        name: this.draft.name.trim(),
        city: this.draft.city.trim() || null,
        registrationNumber: this.draft.registrationNumber.trim() || null,
      }),
      g => `Groupement « ${g.name} » créé`,
      'La création a échoué',
    );
  }
}

export interface CoopMemberDialogData {
  groupId: number;
}

/** Ajout d'un membre au groupement (statut « en attente », adhésion datée du jour). */
@Component({
  selector: 'app-coop-member-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: DIALOG_IMPORTS,
  template: `
    <form #f="ngForm" (ngSubmit)="submit(f)">
      <ds-dialog-header subtitle="Le membre est ajouté « en attente » ; son adhésion est datée d'aujourd'hui." (close)="ref.close()">
        Ajouter un membre
      </ds-dialog-header>
      <ds-dialog-content>
        <div class="ds-form-stack">
          <div class="cd-row">
            <ds-input label="Prénom" name="firstName" [(ngModel)]="draft.firstName" required></ds-input>
            <ds-input label="Nom" name="lastName" [(ngModel)]="draft.lastName" required></ds-input>
          </div>
          <ds-input label="E-mail" type="email" name="email" prefixIcon="mail" [(ngModel)]="draft.email" required email></ds-input>
          <div class="cd-row">
            <ds-input label="Téléphone" name="phone" prefixIcon="phone" [(ngModel)]="draft.phone"></ds-input>
            <ds-input label="N° d'adhésion" name="memberNumber" [(ngModel)]="draft.memberNumber"></ds-input>
          </div>
        </div>
      </ds-dialog-content>
      <ds-dialog-actions>
        <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
        <ds-button variant="marine" nativeType="submit" [loading]="saving()" [disabled]="saving() || !!f.invalid">Ajouter le membre</ds-button>
      </ds-dialog-actions>
    </form>
  `,
  styles: [DIALOG_STYLES],
})
export class CoopMemberDialogComponent extends CoopDialogBase<CoopMember> {
  private readonly data = inject<CoopMemberDialogData>(DIALOG_DATA);
  draft = { firstName: '', lastName: '', email: '', phone: '', memberNumber: '' };

  submit(form: NgForm): void {
    this.send(
      form,
      this.api.createMember({
        groupId: this.data.groupId,
        firstName: this.draft.firstName.trim(),
        lastName: this.draft.lastName.trim(),
        email: this.draft.email.trim(),
        phone: this.draft.phone.trim() || null,
        memberNumber: this.draft.memberNumber.trim() || null,
        joinDate: new Date().toISOString().slice(0, 10),
        status: 'PENDING',
      }),
      m => `${m.firstName} ${m.lastName} ajouté au groupement`,
      "L'ajout a échoué",
    );
  }
}

export interface CoopContributionDialogData {
  members: CoopMember[];
}

/** Appel de fonds auprès d'un membre (journal déclaratif, pas de paiement intégré). */
@Component({
  selector: 'app-coop-contribution-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: DIALOG_IMPORTS_WITH_SELECT,
  template: `
    <form #f="ngForm" (ngSubmit)="submit(f)">
      <ds-dialog-header subtitle="La cotisation est enregistrée « à payer » jusqu'à son règlement." (close)="ref.close()">
        Appeler une cotisation
      </ds-dialog-header>
      <ds-dialog-content>
        <div class="ds-form-stack">
          <ds-select label="Membre" name="memberId" [options]="memberOptions" [(ngModel)]="draft.memberId" required></ds-select>
          <ds-select label="Type" name="type" [options]="typeOptions" [(ngModel)]="draft.type" required></ds-select>
          <div class="cd-row">
            <ds-input label="Montant (MAD)" type="number" name="amount" prefixIcon="coin" [(ngModel)]="draft.amount" required></ds-input>
            <ds-input label="Échéance" type="date" name="dueDate" [(ngModel)]="draft.dueDate"></ds-input>
          </div>
        </div>
      </ds-dialog-content>
      <ds-dialog-actions>
        <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
        <ds-button variant="marine" nativeType="submit" [loading]="saving()"
          [disabled]="saving() || !!f.invalid || !(+draft.amount > 0)">Appeler</ds-button>
      </ds-dialog-actions>
    </form>
  `,
  styles: [DIALOG_STYLES],
})
export class CoopContributionDialogComponent extends CoopDialogBase<CoopContribution> {
  private readonly data = inject<CoopContributionDialogData>(DIALOG_DATA);
  readonly memberOptions: DsSelectOption[] = this.data.members.map(m => ({ value: m.id, label: `${m.firstName} ${m.lastName}` }));
  readonly typeOptions: DsSelectOption[] = (Object.keys(CONTRIBUTION_TYPE_LABELS) as CoopContributionType[])
    .map(t => ({ value: t, label: CONTRIBUTION_TYPE_LABELS[t] }));
  draft: { memberId: number | null; type: CoopContributionType; amount: number | string; dueDate: string } = {
    memberId: this.data.members[0]?.id ?? null,
    type: 'INITIAL',
    amount: '',
    dueDate: '',
  };

  submit(form: NgForm): void {
    if (this.draft.memberId == null || !(+this.draft.amount > 0)) return;
    this.send(
      form,
      this.api.createContribution({
        memberId: this.draft.memberId,
        type: this.draft.type,
        amount: +this.draft.amount,
        currency: 'MAD',
        status: 'PENDING',
        dueDate: this.draft.dueDate || null,
      }),
      () => 'Appel de fonds enregistré',
      "L'enregistrement a échoué",
    );
  }
}

export interface CoopProjectDialogData {
  groupId: number;
}

/** Nouveau projet de construction du groupement. */
@Component({
  selector: 'app-coop-project-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: DIALOG_IMPORTS,
  template: `
    <form #f="ngForm" (ngSubmit)="submit(f)">
      <ds-dialog-header subtitle="Le projet démarre « en préparation » ; ses lots s'ajoutent ensuite." (close)="ref.close()">
        Nouveau projet
      </ds-dialog-header>
      <ds-dialog-content>
        <div class="ds-form-stack">
          <ds-input label="Nom du projet" name="name" [(ngModel)]="draft.name" required></ds-input>
          <div class="cd-row">
            <ds-input label="Ville" name="city" prefixIcon="map-pin" [(ngModel)]="draft.city"></ds-input>
            <ds-input label="Budget (MAD)" type="number" name="budget" prefixIcon="coin" [(ngModel)]="draft.budget"></ds-input>
          </div>
        </div>
      </ds-dialog-content>
      <ds-dialog-actions>
        <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
        <ds-button variant="marine" nativeType="submit" [loading]="saving()" [disabled]="saving() || !!f.invalid">Créer le projet</ds-button>
      </ds-dialog-actions>
    </form>
  `,
  styles: [DIALOG_STYLES],
})
export class CoopProjectDialogComponent extends CoopDialogBase<CoopProject> {
  private readonly data = inject<CoopProjectDialogData>(DIALOG_DATA);
  draft = { name: '', city: '', budget: '' as number | string };

  submit(form: NgForm): void {
    this.send(
      form,
      this.api.createProject({
        groupId: this.data.groupId,
        name: this.draft.name.trim(),
        city: this.draft.city.trim() || null,
        status: 'PLANNING',
        totalBudget: positive(this.draft.budget),
        currency: 'MAD',
      }),
      p => `Projet « ${p.name} » créé`,
      'La création du projet a échoué',
    );
  }
}

export interface CoopLotDialogData {
  project: CoopProject;
}

/** Nouveau lot d'un projet, disponible jusqu'à son attribution à un membre. */
@Component({
  selector: 'app-coop-lot-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: DIALOG_IMPORTS,
  template: `
    <form #f="ngForm" (ngSubmit)="submit(f)">
      <ds-dialog-header [subtitle]="data.project.name" (close)="ref.close()">
        Ajouter un lot
      </ds-dialog-header>
      <ds-dialog-content>
        <div class="ds-form-stack">
          <ds-input label="N° de lot" name="lotNumber" [(ngModel)]="draft.lotNumber" required></ds-input>
          <div class="cd-row">
            <ds-input label="Surface (m²)" type="number" name="surface" prefixIcon="area" [(ngModel)]="draft.surface"></ds-input>
            <ds-input label="Prix (MAD)" type="number" name="price" prefixIcon="coin" [(ngModel)]="draft.price"></ds-input>
          </div>
        </div>
      </ds-dialog-content>
      <ds-dialog-actions>
        <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
        <ds-button variant="marine" nativeType="submit" [loading]="saving()" [disabled]="saving() || !!f.invalid">Ajouter le lot</ds-button>
      </ds-dialog-actions>
    </form>
  `,
  styles: [DIALOG_STYLES],
})
export class CoopLotDialogComponent extends CoopDialogBase<CoopLot> {
  readonly data = inject<CoopLotDialogData>(DIALOG_DATA);
  draft = { lotNumber: '', surface: '' as number | string, price: '' as number | string };

  submit(form: NgForm): void {
    this.send(
      form,
      this.api.createLot({
        projectId: this.data.project.id,
        lotNumber: this.draft.lotNumber.trim(),
        surfaceArea: positive(this.draft.surface),
        price: positive(this.draft.price),
        currency: 'MAD',
        status: 'AVAILABLE',
        memberId: null,
      }),
      l => `Lot ${l.lotNumber} ajouté`,
      "L'ajout du lot a échoué",
    );
  }
}
