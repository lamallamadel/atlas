import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DsAvatarComponent,
  DsBadgeComponent,
  DsCardComponent,
  DsCellDirective,
  DsDialogService,
  DsSelectComponent,
  DsTableComponent,
  DsToastService,
} from '../../design-system';
import type { DsBadgeStatus, DsColumn, DsSelectOption } from '../../design-system';
import {
  CoopApiService,
  CoopMember,
  CoopMemberStatus,
  MEMBER_STATUS_LABELS,
  toRequest,
} from '../../services/coop-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { CoopMemberDialogComponent, CoopMemberDialogData } from './coop-dialogs.component';

const STATUS_BADGE: Record<CoopMemberStatus, DsBadgeStatus> = {
  ACTIVE: 'active',
  PENDING: 'warning',
  INACTIVE: 'archived',
  SUSPENDED: 'error',
};

/** Membres du groupement : numéro d'adhésion (rang), contact, statut. */
@Component({
  selector: 'app-coop-members-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, DsAvatarComponent, DsBadgeComponent, DsCardComponent, DsCellDirective, DsSelectComponent, DsTableComponent],
  template: `
    <ds-card [pad]="false" elevation="xs">
      <ds-table
        [columns]="columns"
        [rows]="members()"
        [loading]="loading()"
        [loadingRowCount]="3"
        [trackBy]="trackMember"
        label="Membres du groupement"
        emptyMessage="Aucun membre pour l'instant.">
        <ng-template dsCell="memberNumber" let-m>
          <span class="cp-number">{{ m.memberNumber || '—' }}</span>
        </ng-template>
        <ng-template dsCell="name" let-m>
          <div class="cp-person">
            <ds-avatar [name]="m.firstName + ' ' + m.lastName" size="sm"></ds-avatar>
            <div class="cp-person__text">
              <span class="cp-strong">{{ m.firstName }} {{ m.lastName }}</span>
              <span class="cp-muted">{{ m.email }}@if (m.phone) { · {{ m.phone }} }</span>
            </div>
          </div>
        </ng-template>
        <ng-template dsCell="joinDate" let-m>
          {{ m.joinDate ? (m.joinDate | date: 'd MMM y') : '—' }}
        </ng-template>
        <ng-template dsCell="status" let-m>
          @if (canEdit()) {
            <div class="cp-inline-select">
              <ds-select [ariaLabelSelect]="'Statut de ' + m.firstName + ' ' + m.lastName" [options]="statusOptions"
                [ngModel]="m.status" (ngModelChange)="setStatus(m, $event)" [disabled]="busy()"></ds-select>
            </div>
          } @else {
            <ds-badge size="sm" [status]="badge(m.status)">{{ label(m.status) }}</ds-badge>
          }
        </ng-template>
      </ds-table>
    </ds-card>
  `,
  styleUrls: ['./coop-panel.scss'],
})
export class CoopMembersPanelComponent {
  readonly groupId = input.required<number>();
  readonly members = input.required<CoopMember[]>();
  readonly loading = input(false);
  readonly canEdit = input(false);
  readonly changed = output<void>();

  private readonly api = inject(CoopApiService);
  private readonly toast = inject(DsToastService);
  private readonly dialog = inject(DsDialogService);

  readonly busy = signal(false);
  readonly statusOptions: DsSelectOption[] = (Object.keys(MEMBER_STATUS_LABELS) as CoopMemberStatus[])
    .map(s => ({ value: s, label: MEMBER_STATUS_LABELS[s] }));
  readonly columns: DsColumn<CoopMember>[] = [
    { key: 'memberNumber', header: 'N°', width: '72px' },
    { key: 'name', header: 'Membre' },
    { key: 'joinDate', header: 'Adhésion', width: '140px' },
    { key: 'status', header: 'Statut', width: '200px' },
  ];
  readonly trackMember = (_: number, m: CoopMember) => m.id;

  label(s: CoopMemberStatus): string {
    return MEMBER_STATUS_LABELS[s] ?? s;
  }

  badge(s: CoopMemberStatus): DsBadgeStatus {
    return STATUS_BADGE[s] ?? 'neutral';
  }

  /** Ouvre la boîte d'ajout ; la liste est rechargée par le parent. */
  openAdd(): void {
    const data: CoopMemberDialogData = { groupId: this.groupId() };
    this.dialog
      .open<CoopMember>(CoopMemberDialogComponent, { data, width: '560px' })
      .closed.subscribe(m => { if (m) this.changed.emit(); });
  }

  setStatus(member: CoopMember, status: CoopMemberStatus): void {
    if (member.status === status) return;
    this.busy.set(true);
    this.api.updateMember(member.id, { ...toRequest(member), status }).subscribe({
      next: () => { this.busy.set(false); this.toast.success(`Statut : ${this.label(status)}`); this.changed.emit(); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'Le changement de statut a échoué')); this.changed.emit(); },
    });
  }
}
