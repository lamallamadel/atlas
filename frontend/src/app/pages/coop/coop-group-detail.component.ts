import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DsCardComponent,
  DsFilterChipComponent,
  DsSkeletonComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import { CoopApiService, CoopGroup, CoopMember } from '../../services/coop-api.service';
import { AuthService } from '../../services/auth.service';
import { isManagerOrAdmin } from '../../services/agency-role';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { CoopMembersPanelComponent } from './coop-members-panel.component';
import { CoopContributionsPanelComponent } from './coop-contributions-panel.component';
import { CoopProjectsPanelComponent } from './coop-projects-panel.component';

type Tab = 'members' | 'contributions' | 'projects';

/** Fiche d'un groupement : membres, journal des cotisations, projets et lots. */
@Component({
  selector: 'app-coop-group-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DsCardComponent,
    DsFilterChipComponent,
    DsSkeletonComponent,
    PageHeaderComponent,
    CoopMembersPanelComponent,
    CoopContributionsPanelComponent,
    CoopProjectsPanelComponent,
  ],
  template: `
    <div class="cg-page">
      <a class="cg-back" routerLink="/pro/coop">← Groupements</a>
      @if (group(); as g) {
        <ds-page-header eyebrow="Coop habitat" [titleBefore]="g.name"
          [description]="subtitle(g)">
        </ds-page-header>

        <div class="cg-tabs" role="tablist">
          <ds-filter-chip [active]="tab() === 'members'" [count]="members().length || null" (toggled)="tab.set('members')">Membres</ds-filter-chip>
          <ds-filter-chip [active]="tab() === 'contributions'" (toggled)="tab.set('contributions')">Cotisations</ds-filter-chip>
          <ds-filter-chip [active]="tab() === 'projects'" (toggled)="tab.set('projects')">Projets et lots</ds-filter-chip>
        </div>

        <ds-card [pad]="true" elevation="xs">
          @switch (tab()) {
            @case ('members') {
              <app-coop-members-panel [groupId]="g.id" [members]="members()" [canEdit]="canEdit"
                (changed)="loadMembers()"></app-coop-members-panel>
            }
            @case ('contributions') {
              <app-coop-contributions-panel [groupId]="g.id" [members]="members()" [canEdit]="canEdit"></app-coop-contributions-panel>
            }
            @case ('projects') {
              <app-coop-projects-panel [groupId]="g.id" [members]="members()" [canEdit]="canEdit"></app-coop-projects-panel>
            }
          }
        </ds-card>
      } @else if (loading()) {
        <ds-skeleton variant="text"></ds-skeleton>
      }
    </div>
  `,
  styles: [`
    .cg-page { display: flex; flex-direction: column; gap: var(--ds-space-4); }
    .cg-back { font-size: var(--ds-text-sm); color: var(--ds-text-muted); text-decoration: none; }
    .cg-back:hover { color: var(--ds-marine); }
    .cg-tabs { display: flex; gap: var(--ds-space-2); flex-wrap: wrap; }
  `],
})
export class CoopGroupDetailComponent implements OnInit {
  private readonly api = inject(CoopApiService);
  private readonly toast = inject(DsToastService);
  private readonly route = inject(ActivatedRoute);
  readonly canEdit = isManagerOrAdmin(inject(AuthService));

  readonly group = signal<CoopGroup | null>(null);
  readonly members = signal<CoopMember[]>([]);
  readonly loading = signal(true);
  readonly tab = signal<Tab>('members');

  private groupId = 0;

  ngOnInit(): void {
    this.groupId = Number(this.route.snapshot.paramMap.get('id'));
    this.api.group(this.groupId).subscribe({
      next: g => { this.group.set(g); this.loading.set(false); },
      error: err => { this.loading.set(false); this.toast.error(serverMessage(err, 'Groupement introuvable')); },
    });
    this.loadMembers();
  }

  subtitle(g: CoopGroup): string {
    return [g.city, g.registrationNumber].filter(v => !!v).join(' · ') || "Groupement d'habitat";
  }

  loadMembers(): void {
    this.api.members(this.groupId).subscribe({ next: m => this.members.set(m), error: () => this.members.set([]) });
  }
}
