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
  DsToastService,
} from '../../design-system';
import type { DsSelectOption } from '../../design-system';
import { InviteResponse, TeamApiService } from '../../services/team-api.service';
import { AGENCY_ROLE_LABELS, AgencyRole } from '../../services/agency-role';
import { serverMessage } from '../../components/annonce-publication-panel.component';

export interface TeamInviteDialogData {
  /** Rôles que l'utilisateur connecté peut attribuer (le manager : agent seulement). */
  roles: AgencyRole[];
}

/** Invitation d'un membre : le membre reçoit un e-mail pour choisir son mot de passe. */
@Component({
  selector: 'app-team-invite-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DsButtonComponent,
    DsDialogActionsComponent,
    DsDialogContentComponent,
    DsDialogHeaderComponent,
    DsInputComponent,
    DsSelectComponent,
  ],
  template: `
    <form #f="ngForm" (ngSubmit)="submit(f)">
      <ds-dialog-header subtitle="Il recevra un e-mail pour choisir son mot de passe." (close)="ref.close()">
        Inviter un membre
      </ds-dialog-header>
      <ds-dialog-content>
        <div class="ds-form-stack">
          <div class="invite-row">
            <ds-input label="Prénom" name="firstName" [(ngModel)]="draft.firstName" required></ds-input>
            <ds-input label="Nom" name="lastName" [(ngModel)]="draft.lastName" required></ds-input>
          </div>
          <ds-input label="E-mail" type="email" name="email" prefixIcon="mail" [(ngModel)]="draft.email" required email></ds-input>
          <ds-select label="Rôle" name="role" [options]="roleOptions" [(ngModel)]="draft.role"
            [disabled]="roleOptions.length === 1"></ds-select>
        </div>
      </ds-dialog-content>
      <ds-dialog-actions>
        <ds-button variant="ghost" (dsClick)="ref.close()">Annuler</ds-button>
        <ds-button variant="marine" nativeType="submit" prefixIcon="send" [loading]="sending()"
          [disabled]="sending() || !!f.invalid">Envoyer l'invitation</ds-button>
      </ds-dialog-actions>
    </form>
  `,
  styles: [`
    .invite-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ds-space-4); }
    @media (max-width: 480px) { .invite-row { grid-template-columns: 1fr; } }
  `],
})
export class TeamInviteDialogComponent {
  readonly ref = inject<DialogRef<InviteResponse>>(DialogRef);
  private readonly data = inject<TeamInviteDialogData>(DIALOG_DATA);
  private readonly api = inject(TeamApiService);
  private readonly toast = inject(DsToastService);

  readonly roleOptions: DsSelectOption[] = this.data.roles.map(r => ({ value: r, label: AGENCY_ROLE_LABELS[r] }));
  readonly sending = signal(false);
  draft: { firstName: string; lastName: string; email: string; role: AgencyRole } = {
    firstName: '',
    lastName: '',
    email: '',
    role: this.data.roles.includes('AGENT') ? 'AGENT' : this.data.roles[0],
  };

  submit(form: NgForm): void {
    if (form.invalid || this.sending()) return;
    this.sending.set(true);
    this.api.invite({ ...this.draft, email: this.draft.email.trim() }).subscribe({
      next: res => {
        this.sending.set(false);
        this.toast.success(`Invitation envoyée à ${res.email}`);
        this.ref.close(res);
      },
      error: err => {
        this.sending.set(false);
        this.toast.error(serverMessage(err, "L'invitation a échoué"));
      },
    });
  }
}
