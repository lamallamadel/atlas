import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsEmptyStateComponent,
  DsInputComponent,
  DsSelectComponent,
  DsToastService,
} from '../../design-system';
import type { DsSelectOption } from '../../design-system';
import {
  CoopApiService,
  CoopMember,
  CoopMemberStatus,
  MEMBER_STATUS_LABELS,
  toRequest,
} from '../../services/coop-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';

/** Membres du groupement : ajout, numéro d'adhésion (rang), statut. */
@Component({
  selector: 'app-coop-members-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DsBadgeComponent, DsButtonComponent, DsEmptyStateComponent, DsInputComponent, DsSelectComponent],
  template: `
    @if (canEdit()) {
      <form #f="ngForm" class="cp-form" (ngSubmit)="add(f)">
        <ds-input label="Prénom" name="firstName" [(ngModel)]="draft.firstName" required></ds-input>
        <ds-input label="Nom" name="lastName" [(ngModel)]="draft.lastName" required></ds-input>
        <ds-input label="E-mail" type="email" name="email" [(ngModel)]="draft.email" required email></ds-input>
        <ds-input label="Téléphone" name="phone" [(ngModel)]="draft.phone"></ds-input>
        <ds-input label="N° d'adhésion" name="memberNumber" [(ngModel)]="draft.memberNumber"></ds-input>
        <div class="cp-form__submit">
          <ds-button variant="marine" nativeType="submit" [disabled]="busy() || !!f.invalid">Ajouter</ds-button>
        </div>
      </form>
    }

    @if (members().length === 0) {
      <ds-empty-state [compact]="true" title="Aucun membre" description="Les membres du groupement apparaîtront ici."></ds-empty-state>
    } @else {
      <table class="cp-table" aria-label="Membres du groupement">
        <thead><tr><th scope="col">N°</th><th scope="col">Membre</th><th scope="col">Adhésion</th><th scope="col">Statut</th></tr></thead>
        <tbody>
          @for (m of members(); track m.id) {
            <tr>
              <td>{{ m.memberNumber || '—' }}</td>
              <td><span class="cp-strong">{{ m.firstName }} {{ m.lastName }}</span><span class="cp-muted">{{ m.email }}@if (m.phone) { · {{ m.phone }} }</span></td>
              <td>{{ m.joinDate || '—' }}</td>
              <td>
                @if (canEdit()) {
                  <ds-select [ariaLabelSelect]="'Statut de ' + m.firstName + ' ' + m.lastName" [options]="statusOptions"
                    [ngModel]="m.status" (ngModelChange)="setStatus(m, $event)" [disabled]="busy()"></ds-select>
                } @else {
                  <ds-badge size="sm" [status]="m.status === 'ACTIVE' ? 'active' : 'neutral'">{{ label(m.status) }}</ds-badge>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
  styleUrls: ['./coop-panel.scss'],
})
export class CoopMembersPanelComponent {
  readonly groupId = input.required<number>();
  readonly members = input.required<CoopMember[]>();
  readonly canEdit = input(false);
  readonly changed = output<void>();

  private readonly api = inject(CoopApiService);
  private readonly toast = inject(DsToastService);

  readonly busy = signal(false);
  readonly statusOptions: DsSelectOption[] = (Object.keys(MEMBER_STATUS_LABELS) as CoopMemberStatus[])
    .map(s => ({ value: s, label: MEMBER_STATUS_LABELS[s] }));
  draft = this.empty();

  label(s: CoopMemberStatus): string {
    return MEMBER_STATUS_LABELS[s] ?? s;
  }

  add(form: NgForm): void {
    if (form.invalid) return;
    this.busy.set(true);
    this.api.createMember({
      groupId: this.groupId(),
      firstName: this.draft.firstName.trim(),
      lastName: this.draft.lastName.trim(),
      email: this.draft.email.trim(),
      phone: this.draft.phone || null,
      memberNumber: this.draft.memberNumber || null,
      joinDate: new Date().toISOString().slice(0, 10),
      status: 'PENDING',
    }).subscribe({
      next: m => {
        this.busy.set(false);
        this.toast.success(`${m.firstName} ${m.lastName} ajouté au groupement`);
        form.resetForm();
        this.draft = this.empty();
        this.changed.emit();
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, "L'ajout a échoué")); },
    });
  }

  setStatus(member: CoopMember, status: CoopMemberStatus): void {
    if (member.status === status) return;
    this.busy.set(true);
    this.api.updateMember(member.id, { ...toRequest(member), status }).subscribe({
      next: () => { this.busy.set(false); this.toast.success(`Statut : ${this.label(status)}`); this.changed.emit(); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Le changement de statut a échoué')); this.changed.emit(); },
    });
  }

  private empty() {
    return { firstName: '', lastName: '', email: '', phone: '', memberNumber: '' };
  }
}
