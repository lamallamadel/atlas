import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DsAvatarComponent,
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsCellDirective,
  DsDialogService,
  DsSelectComponent,
  DsSwitchComponent,
  DsTableComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import type { DsColumn, DsSelectOption } from '../../design-system';
import { AuthService } from '../../services/auth.service';
import { InviteResponse, TeamApiService, TeamMember } from '../../services/team-api.service';
import {
  AGENCY_ROLE_LABELS,
  AGENCY_ROLES,
  AgencyRole,
  agencyRoleOf,
  invitableRoles,
} from '../../services/agency-role';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { TeamInviteDialogComponent, TeamInviteDialogData } from './team-invite-dialog.component';

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
    DsAvatarComponent,
    DsBadgeComponent,
    DsButtonComponent,
    DsCardComponent,
    DsCellDirective,
    DsSelectComponent,
    DsSwitchComponent,
    DsTableComponent,
    PageHeaderComponent,
  ],
  template: `
    <div class="pro-page ds-form-stack team-page">
      <ds-page-header
        eyebrow="Espace Pro"
        titleBefore="Mon"
        titleAccent="équipe"
        description="Membres de l'agence, rôles et accès aux dossiers.">
        <ng-container slot="actions">
          @if (inviteRoles.length) {
            <ds-button variant="marine" size="md" prefixIcon="plus" (dsClick)="openInvite()">Inviter un membre</ds-button>
          }
        </ng-container>
      </ds-page-header>

      @if (!loading() && members().length) {
        <div class="team-stats">
          <span class="team-stats__total">{{ members().length }} membre{{ members().length > 1 ? 's' : '' }}</span>
          <span class="team-stats__sep" aria-hidden="true">|</span>
          <span>{{ activeCount() }} actif{{ activeCount() > 1 ? 's' : '' }}</span>
          @if (disabledCount()) {
            <span class="team-stats__sep" aria-hidden="true">|</span>
            <span>{{ disabledCount() }} désactivé{{ disabledCount() > 1 ? 's' : '' }}</span>
          }
        </div>
      }

      @if (rolesUnknown()) {
        <div class="team-alert" role="status">
          Rôles indisponibles : l'annuaire Keycloak ne répond pas. La liste montre les agents déjà vus dans les dossiers.
        </div>
      }

      <ds-card [pad]="false" elevation="xs">
        <ds-table
          [columns]="columns"
          [rows]="members()"
          [loading]="loading()"
          [loadingRowCount]="4"
          [trackBy]="trackMember"
          label="Membres de l'agence"
          emptyMessage="L'annuaire de l'agence est vide ou indisponible.">
          <ng-template dsCell="name" let-m>
            <div class="team-member" [class.team-member--disabled]="m.enabled === false">
              <ds-avatar [name]="m.name" size="sm" [variant]="m.enabled === false ? 'neutral' : 'marine'"></ds-avatar>
              <div class="team-member__text">
                <span class="team-member__name">{{ m.name }}@if (m.userId === me) { <span class="team-member__me"> (vous)</span> }</span>
                @if (m.email) { <span class="team-member__email">{{ m.email }}</span> }
              </div>
            </div>
          </ng-template>
          <ng-template dsCell="role" let-m>
            @if (canManage && m.role && m.userId !== me) {
              <div class="team-role">
                <ds-select
                  [ariaLabelSelect]="'Rôle de ' + m.name"
                  [options]="roleOptions"
                  [ngModel]="m.role"
                  (ngModelChange)="changeRole(m, $event)"
                  [disabled]="busy() === m.userId">
                </ds-select>
              </div>
            } @else {
              <span class="team-role-label">{{ roleLabel(m.role) }}</span>
            }
          </ng-template>
          <ng-template dsCell="status" let-m>
            <ds-badge size="sm" [status]="m.enabled === false ? 'archived' : 'active'">
              {{ m.enabled === false ? 'Désactivé' : 'Actif' }}
            </ds-badge>
          </ng-template>
          <ng-template dsCell="actions" let-m>
            @if (canManage && m.role && m.userId !== me) {
              <ds-button
                size="sm"
                variant="ghost"
                [disabled]="busy() === m.userId"
                [ariaLabel]="(m.enabled === false ? 'Réactiver ' : 'Désactiver ') + m.name"
                (dsClick)="toggleEnabled(m)">
                {{ m.enabled === false ? 'Réactiver' : 'Désactiver' }}
              </ds-button>
            }
          </ng-template>
        </ds-table>
      </ds-card>

      <ds-card [pad]="true" elevation="xs">
        <div class="team-section">
          <div class="team-section__head">
            <h2 class="team-section__title">Accès aux dossiers</h2>
            <p class="team-section__desc">Les managers et les administrateurs voient toujours tous les dossiers de l'agence.</p>
          </div>
          @if (canManage) {
            <ds-switch
              label="Chaque agent ne voit que ses dossiers"
              description="Plus les dossiers à attribuer."
              [checked]="restricted() === true"
              [disabled]="savingSettings() || restricted() === null"
              (checkedChange)="setRestricted($event)">
            </ds-switch>
          } @else {
            <p class="team-section__value">
              {{ restricted()
                ? 'Chaque agent ne voit que ses dossiers et ceux à attribuer.'
                : 'Tous les agents voient tous les dossiers de l’agence.' }}
            </p>
          }
        </div>
      </ds-card>
    </div>
  `,
  styles: [`
    .team-page { gap: var(--ds-space-6); }
    .team-stats { display: flex; gap: var(--ds-space-3); font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
    .team-stats__total { font-weight: 700; color: var(--ds-marine); }
    .team-stats__sep { opacity: 0.3; }
    .team-alert { padding: var(--ds-space-3) var(--ds-space-4); border-radius: var(--ds-radius-md); background: var(--ds-warning-hl); color: var(--ds-text); font-size: var(--ds-text-sm); }
    .team-member { display: flex; align-items: center; gap: var(--ds-space-3); }
    .team-member__text { display: flex; flex-direction: column; min-width: 0; }
    .team-member__name { font-weight: 600; color: var(--ds-text); }
    .team-member__me { font-weight: 400; color: var(--ds-text-muted); }
    .team-member__email { font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
    .team-member--disabled .team-member__name, .team-member--disabled .team-member__email { color: var(--ds-text-faint); }
    .team-role { min-width: 150px; max-width: 200px; }
    .team-role-label { color: var(--ds-text); }
    .team-section { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--ds-space-4) var(--ds-space-8); }
    .team-section__head { flex: 1 1 280px; }
    .team-section__title { margin: 0; font-size: var(--ds-text-base); font-weight: 700; color: var(--ds-marine); }
    .team-section__desc { margin: var(--ds-space-1) 0 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .team-section__value { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text); }
  `],
})
export class TeamComponent implements OnInit {
  private readonly api = inject(TeamApiService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(DsToastService);
  private readonly dialog = inject(DsDialogService);

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
  readonly disabledCount = computed(() => this.members().filter(m => m.enabled === false).length);
  readonly activeCount = computed(() => this.members().length - this.disabledCount());

  readonly columns: DsColumn<TeamMember>[] = [
    { key: 'name', header: 'Membre' },
    { key: 'role', header: 'Rôle', width: '240px' },
    { key: 'status', header: 'Statut', width: '140px' },
    ...(this.canManage ? [{ key: 'actions', header: '', width: '140px', align: 'right' as const }] : []),
  ];
  readonly trackMember = (_: number, m: TeamMember) => m.userId;

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

  openInvite(): void {
    const data: TeamInviteDialogData = { roles: this.inviteRoles };
    this.dialog
      .open<InviteResponse>(TeamInviteDialogComponent, { data, width: '520px' })
      .closed.subscribe(res => { if (res) this.load(); });
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
}
