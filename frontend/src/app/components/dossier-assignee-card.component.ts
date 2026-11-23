import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DsButtonComponent,
  DsCardComponent,
  DsSelectComponent,
  DsToastService,
} from '../design-system';
import type { DsSelectOption } from '../design-system';
import { DossierApiService, DossierResponse } from '../services/dossier-api.service';
import { TeamApiService, TeamMember } from '../services/team-api.service';
import { AuthService } from '../services/auth.service';
import { serverMessage } from './annonce-publication-panel.component';

/** Valeur du sélecteur pour « à attribuer ». */
export const UNASSIGNED = '__unassigned__';

/**
 * Agent du dossier. Un dossier à attribuer peut être pris par l'utilisateur connecté ; un manager
 * ou un administrateur peut le réassigner à un membre de l'agence ou le remettre à attribuer.
 */
@Component({
  selector: 'app-dossier-assignee-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DsButtonComponent, DsCardComponent, DsSelectComponent],
  template: `
    <ds-card [pad]="true" elevation="xs">
      <h3 class="asg-title">Agent</h3>
      <p class="asg-name" [class.asg-name--none]="!dossier().assignedTo">
        {{ dossier().assignedTo ? (dossier().assignedToName || dossier().assignedTo) : 'À attribuer' }}
      </p>
      @if (!dossier().assignedTo) {
        <ds-button variant="marine" size="sm" [disabled]="busy()" (dsClick)="claim()">Je prends ce dossier</ds-button>
      }
      @if (canReassign) {
        <ds-select
          class="asg-select"
          label="Réassigner"
          [options]="options()"
          [ngModel]="dossier().assignedTo || unassigned"
          (ngModelChange)="reassign($event)"
          [disabled]="busy()">
        </ds-select>
      }
    </ds-card>
  `,
  styles: [`
    .asg-title { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: var(--ds-marine); }
    .asg-name { margin: 0 0 12px; font-weight: 600; font-size: 14px; }
    .asg-name--none { color: var(--ds-text-muted); font-style: italic; }
    .asg-select { display: block; margin-top: 12px; }
  `],
})
export class DossierAssigneeCardComponent implements OnInit {
  readonly dossier = input.required<DossierResponse>();
  /** Émis avec le dossier à jour après un changement d'agent. */
  readonly changed = output<DossierResponse>();

  private readonly api = inject(DossierApiService);
  private readonly team = inject(TeamApiService);
  private readonly toast = inject(DsToastService);
  private readonly auth = inject(AuthService);

  readonly unassigned = UNASSIGNED;
  readonly busy = signal(false);
  readonly members = signal<TeamMember[]>([]);
  readonly canReassign = this.auth.hasRole('ADMIN') || this.auth.hasRole('MANAGER');

  readonly options = computed<DsSelectOption[]>(() => {
    const list: DsSelectOption[] = [{ value: UNASSIGNED, label: 'À attribuer' }];
    const current = this.dossier();
    const members = this.members();
    for (const m of members) list.push({ value: m.userId, label: m.name });
    // L'agent actuel peut manquer de l'annuaire (compte désactivé, annuaire indisponible).
    if (current.assignedTo && !members.some(m => m.userId === current.assignedTo)) {
      list.push({ value: current.assignedTo, label: current.assignedToName || current.assignedTo });
    }
    return list;
  });

  ngOnInit(): void {
    if (this.canReassign) {
      this.team.members().subscribe({ next: m => this.members.set(m), error: () => this.members.set([]) });
    }
  }

  claim(): void {
    this.busy.set(true);
    this.api.claim(this.dossier().id).subscribe({
      next: d => { this.busy.set(false); this.toast.success('Le dossier vous est assigné'); this.changed.emit(d); },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, "Impossible de prendre ce dossier")); },
    });
  }

  reassign(value: string): void {
    const userId = value === UNASSIGNED ? null : value;
    if ((this.dossier().assignedTo ?? null) === userId) return;
    this.busy.set(true);
    this.api.assign(this.dossier().id, userId).subscribe({
      next: d => {
        this.busy.set(false);
        this.toast.success(userId ? `Dossier assigné à ${d.assignedToName || userId}` : 'Dossier remis à attribuer');
        this.changed.emit(d);
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'La réassignation a échoué')); },
    });
  }
}
