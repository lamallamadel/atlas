import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsEmptyStateComponent,
  DsInputComponent,
  DsSelectComponent,
  DsSkeletonComponent,
  DsSwitchComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import type { DsSelectOption } from '../../design-system';
import { AuthService } from '../../services/auth.service';
import { TeamApiService, TeamMember } from '../../services/team-api.service';
import {
  AGENCY_ROLE_LABELS,
  AGENCY_ROLES,
  AgencyRole,
  agencyRoleOf,
  invitableRoles,
} from '../../services/agency-role';
import { serverMessage } from '../../components/annonce-publication-panel.component';

/**
 * Écran « Équipe » : membres de l'agence et leur rôle. Le manager invite des agents ;
 * l'administrateur invite tous les rôles, change les rôles et désactive des comptes.
 */
@Component({
  selector: 'app-team',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DsBadgeComponent,
    DsButtonComponent,
    DsCardComponent,
    DsEmptyStateComponent,
    DsInputComponent,
    DsSelectComponent,
    DsSkeletonComponent,
    DsSwitchComponent,
    PageHeaderComponent,
  ],
  template: `
    <div class="team-page">
      <ds-page-header
        eyebrow="Espace Pro"
        titleBefore="Équipe"
        description="Membres de l'agence, rôles et invitations.">
      </ds-page-header>

      <ds-card [pad]="true" elevation="xs" class="team-card">
        <h2 class="team-title">Visibilité des dossiers</h2>
        @if (canManage) {
          <ds-switch
            label="Chaque agent ne voit que ses dossiers"
            description="Plus les dossiers à attribuer. Les managers et les administrateurs voient toujours tout."
            [checked]="restricted() === true"
            [disabled]="savingSettings() || restricted() === null"
            (checkedChange)="setRestricted($event)">
          </ds-switch>
        } @else {
          <p class="team-hint team-hint--flat">
            {{ restricted()
              ? 'Chaque agent ne voit que ses dossiers et ceux à attribuer.'
              : 'Tous les agents voient tous les dossiers de l’agence.' }}
          </p>
        }
      </ds-card>

      @if (inviteRoles.length) {
        <ds-card [pad]="true" elevation="xs" class="team-card">
          <h2 class="team-title">Inviter un membre</h2>
          <form #inviteForm="ngForm" class="team-invite" (ngSubmit)="invite(inviteForm)">
            <ds-input label="Prénom" name="firstName" [(ngModel)]="draft.firstName" required></ds-input>
            <ds-input label="Nom" name="lastName" [(ngModel)]="draft.lastName" required></ds-input>
            <ds-input label="E-mail" type="email" name="email" [(ngModel)]="draft.email" required email></ds-input>
            <ds-select
              label="Rôle"
              name="role"
              [options]="inviteRoleOptions"
              [(ngModel)]="draft.role"
              [disabled]="inviteRoles.length === 1">
            </ds-select>
            <div class="team-invite__submit">
              <ds-button variant="marine" nativeType="submit" [loading]="inviting()" [disabled]="inviting() || !!inviteForm.invalid">
                Envoyer l'invitation
              </ds-button>
            </div>
          </form>
          <p class="team-hint">Le membre reçoit un e-mail pour choisir son mot de passe.</p>
        </ds-card>
      }

      <ds-card [pad]="true" elevation="xs" class="team-card">
        <h2 class="team-title">Membres</h2>
        @if (loading()) {
          <ds-skeleton variant="text"></ds-skeleton>
          <ds-skeleton variant="text"></ds-skeleton>
          <ds-skeleton variant="text"></ds-skeleton>
        } @else if (members().length === 0) {
          <ds-empty-state
            [compact]="true"
            title="Aucun membre"
            description="L'annuaire de l'agence est vide ou indisponible.">
          </ds-empty-state>
        } @else {
          @if (rolesUnknown()) {
            <p class="team-hint team-hint--warn">
              Rôles indisponibles : l'annuaire Keycloak ne répond pas. La liste montre les agents déjà vus dans les dossiers.
            </p>
          }
          <table class="team-table" aria-label="Membres de l'agence">
            <thead>
              <tr><th scope="col">Membre</th><th scope="col">Rôle</th><th scope="col">Statut</th>
                @if (canManage) { <th scope="col"><span class="sr-only">Actions</span></th> }
              </tr>
            </thead>
            <tbody>
              @for (m of members(); track m.userId) {
                <tr [class.team-row--disabled]="m.enabled === false">
                  <td>
                    <span class="team-name">{{ m.name }}@if (m.userId === me) { <span class="team-me"> (vous)</span> }</span>
                    @if (m.email) { <span class="team-email">{{ m.email }}</span> }
                  </td>
                  <td>
                    @if (canManage && m.role && m.userId !== me) {
                      <ds-select
                        [ariaLabelSelect]="'Rôle de ' + m.name"
                        [options]="roleOptions"
                        [ngModel]="m.role"
                        (ngModelChange)="changeRole(m, $event)"
                        [disabled]="busy() === m.userId">
                      </ds-select>
                    } @else {
                      {{ roleLabel(m.role) }}
                    }
                  </td>
                  <td>
                    <ds-badge size="sm" [status]="m.enabled === false ? 'archived' : 'active'">
                      {{ m.enabled === false ? 'Désactivé' : 'Actif' }}
                    </ds-badge>
                  </td>
                  @if (canManage) {
                    <td class="team-actions">
                      @if (m.role && m.userId !== me) {
                        <ds-button
                          size="sm"
                          [variant]="m.enabled === false ? 'ghost' : 'danger'"
                          [disabled]="busy() === m.userId"
                          (dsClick)="toggleEnabled(m)">
                          {{ m.enabled === false ? 'Réactiver' : 'Désactiver' }}
                        </ds-button>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        }
      </ds-card>
    </div>
  `,
  styles: [`
    .team-page { display: flex; flex-direction: column; gap: var(--ds-space-6); }
    .team-title { margin: 0 0 var(--ds-space-4); font-size: var(--ds-text-base); font-weight: 700; color: var(--ds-marine); }
    .team-invite { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--ds-space-4); align-items: end; }
    .team-invite__submit { display: flex; align-items: flex-end; }
    .team-hint { margin: var(--ds-space-3) 0 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .team-hint--warn { margin: 0 0 var(--ds-space-4); }
    .team-hint--flat { margin: 0; color: var(--ds-text); }
    .team-table { width: 100%; border-collapse: collapse; font-size: var(--ds-text-sm); }
    .team-table th { text-align: left; font-weight: 600; color: var(--ds-text-muted); padding: var(--ds-space-2) var(--ds-space-3); border-bottom: 1px solid var(--ds-border); }
    .team-table td { padding: var(--ds-space-3); border-bottom: 1px solid var(--ds-divider); vertical-align: middle; }
    .team-name { display: block; font-weight: 600; color: var(--ds-text); }
    .team-me { font-weight: 400; color: var(--ds-text-muted); }
    .team-email { display: block; color: var(--ds-text-muted); }
    .team-row--disabled .team-name, .team-row--disabled .team-email { color: var(--ds-text-faint); }
    .team-actions { text-align: right; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  `],
})
export class TeamComponent implements OnInit {
  private readonly api = inject(TeamApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(DsToastService);

  readonly me = this.auth.getUserId();
  readonly canManage = agencyRoleOf(this.auth) === 'ADMIN';
  readonly inviteRoles = invitableRoles(this.auth);
  readonly inviteRoleOptions: DsSelectOption[] = this.inviteRoles.map(r => ({ value: r, label: AGENCY_ROLE_LABELS[r] }));
  readonly roleOptions: DsSelectOption[] = AGENCY_ROLES.map(r => ({ value: r, label: AGENCY_ROLE_LABELS[r] }));

  readonly members = signal<TeamMember[]>([]);
  readonly loading = signal(true);
  readonly busy = signal<string | null>(null);
  readonly inviting = signal(false);
  /** `null` tant que le réglage n'est pas chargé. */
  readonly restricted = signal<boolean | null>(null);
  readonly savingSettings = signal(false);
  readonly rolesUnknown = computed(() => this.members().length > 0 && this.members().every(m => !m.role));

  draft: { firstName: string; lastName: string; email: string; role: AgencyRole } = this.emptyDraft();

  ngOnInit(): void {
    this.load();
    this.api.settings().subscribe({
      next: s => this.restricted.set(s.restrictAgentsToOwnDossiers),
      error: () => this.restricted.set(null),
    });
  }

  setRestricted(on: boolean): void {
    const previous = this.restricted();
    this.restricted.set(on);
    this.savingSettings.set(true);
    this.api.updateSettings({ restrictAgentsToOwnDossiers: on }).subscribe({
      next: s => {
        this.savingSettings.set(false);
        this.restricted.set(s.restrictAgentsToOwnDossiers);
        this.toast.success(on
          ? 'Les agents ne voient plus que leurs dossiers et ceux à attribuer'
          : 'Tous les agents voient de nouveau tous les dossiers');
      },
      error: err => {
        this.savingSettings.set(false);
        this.restricted.set(previous);
        this.toast.error(serverMessage(err, "Le réglage n'a pas été enregistré"));
      },
    });
  }

  roleLabel(role: AgencyRole | null | undefined): string {
    return role ? AGENCY_ROLE_LABELS[role] : '—';
  }

  invite(form: NgForm): void {
    if (form.invalid || this.inviting()) return;
    this.inviting.set(true);
    this.api.invite({ ...this.draft, email: this.draft.email.trim() }).subscribe({
      next: res => {
        this.inviting.set(false);
        this.toast.success(`Invitation envoyée à ${res.email}`);
        form.resetForm();
        this.draft = this.emptyDraft();
        this.load();
      },
      error: err => {
        this.inviting.set(false);
        this.toast.error(serverMessage(err, "L'invitation a échoué"));
      },
    });
  }

  changeRole(member: TeamMember, role: AgencyRole): void {
    if (member.role === role) return;
    const previous = member.role;
    this.patch(member.userId, { role });
    this.busy.set(member.userId);
    this.api.changeRole(member.userId, role).subscribe({
      next: () => {
        this.busy.set(null);
        this.toast.success(`${member.name} est maintenant ${AGENCY_ROLE_LABELS[role].toLowerCase()}`);
      },
      error: err => {
        this.busy.set(null);
        this.patch(member.userId, { role: previous });
        this.toast.error(serverMessage(err, 'Le changement de rôle a échoué'));
      },
    });
  }

  toggleEnabled(member: TeamMember): void {
    const enabled = member.enabled === false;
    this.busy.set(member.userId);
    this.api.setEnabled(member.userId, enabled).subscribe({
      next: () => {
        this.busy.set(null);
        this.patch(member.userId, { enabled });
        this.toast.success(enabled ? `${member.name} est réactivé` : `${member.name} est désactivé`);
      },
      error: err => {
        this.busy.set(null);
        this.toast.error(serverMessage(err, enabled ? 'La réactivation a échoué' : 'La désactivation a échoué'));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.api.allMembers().subscribe({
      next: list => { this.members.set(list); this.loading.set(false); },
      error: err => {
        this.members.set([]);
        this.loading.set(false);
        this.toast.error(serverMessage(err, "Impossible de charger l'équipe"));
      },
    });
  }

  private patch(userId: string, change: Partial<TeamMember>): void {
    this.members.update(list => list.map(m => (m.userId === userId ? { ...m, ...change } : m)));
  }

  private emptyDraft(): { firstName: string; lastName: string; email: string; role: AgencyRole } {
    return { firstName: '', lastName: '', email: '', role: this.inviteRoles.includes('AGENT') ? 'AGENT' : this.inviteRoles[0] };
  }
}
