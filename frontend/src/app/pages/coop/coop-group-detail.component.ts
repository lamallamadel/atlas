import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  DsButtonComponent,
  DsCardComponent,
  DsEmptyStateComponent,
  DsIconComponent,
  DsSkeletonComponent,
  DsTabsComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import type { DsTab } from '../../design-system';
import { CoopApiService, CoopGroup, CoopMember } from '../../services/coop-api.service';
import { AuthService } from '../../services/auth.service';
import { isManagerOrAdmin } from '../../services/agency-role';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { CoopMembersPanelComponent } from './coop-members-panel.component';
import { CoopContributionsPanelComponent } from './coop-contributions-panel.component';
import { CoopProjectsPanelComponent } from './coop-projects-panel.component';

type Tab = 'members' | 'contributions' | 'projects';

/** Action principale de l'en-tête, selon l'onglet ouvert. */
const TAB_ACTION: Record<Tab, string> = {
  members: 'Ajouter un membre',
  contributions: 'Appeler une cotisation',
  projects: 'Nouveau projet',
};

/** Fiche d'un groupement : membres, journal des cotisations, projets et lots. */
@Component({
  selector: 'app-coop-group-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DsButtonComponent,
    DsCardComponent,
    DsEmptyStateComponent,
    DsIconComponent,
    DsSkeletonComponent,
    DsTabsComponent,
    PageHeaderComponent,
    CoopMembersPanelComponent,
    CoopContributionsPanelComponent,
    CoopProjectsPanelComponent,
  ],
  template: `
    <div class="pro-page ds-form-stack cg-page">
      <nav class="cg-breadcrumb" aria-label="Fil d'Ariane">
        <a routerLink="/pro/coop">Coop habitat</a>
        <ds-icon name="chevron-right" [size]="16"></ds-icon>
        <span aria-current="page">{{ group()?.name || 'Groupement' }}</span>
      </nav>

      @if (group(); as g) {
        <ds-page-header eyebrow="Coop habitat" [titleBefore]="g.name" [description]="subtitle(g)">
          <ng-container slot="actions">
            @if (canEdit && !(tab() === 'contributions' && members().length === 0)) {
              <ds-button variant="marine" size="md" prefixIcon="plus" (dsClick)="primaryAction()">{{ actionLabel() }}</ds-button>
            }
          </ng-container>
        </ds-page-header>

        <ds-tabs [tabs]="tabs()" [activeTab]="tab()" label="Sections du groupement" (tabChange)="selectTab($event)"></ds-tabs>

        @switch (tab()) {
          @case ('members') {
            <app-coop-members-panel [groupId]="g.id" [members]="members()" [loading]="membersLoading()" [canEdit]="canEdit"
              (changed)="loadMembers()"></app-coop-members-panel>
          }
          @case ('contributions') {
            <app-coop-contributions-panel [groupId]="g.id" [members]="members()" [canEdit]="canEdit"></app-coop-contributions-panel>
          }
          @case ('projects') {
            <app-coop-projects-panel [groupId]="g.id" [members]="members()" [canEdit]="canEdit"></app-coop-projects-panel>
          }
        }
      } @else if (loading()) {
        <ds-skeleton variant="heading" width="40%"></ds-skeleton>
        <ds-skeleton variant="rect" width="100%" height="240px"></ds-skeleton>
      } @else {
        <ds-card [pad]="true" elevation="xs">
          <ds-empty-state icon="users" title="Groupement introuvable"
            description="Il a peut-être été supprimé, ou il appartient à une autre agence."></ds-empty-state>
        </ds-card>
      }
    </div>
  `,
  styles: [`
    .cg-page { gap: var(--ds-space-6); }
    .cg-breadcrumb { display: flex; align-items: center; gap: var(--ds-space-2); font-size: var(--ds-text-sm); color: var(--ds-text-faint); }
    .cg-breadcrumb a { padding: 0; color: var(--ds-text-faint); text-decoration: none; }
    .cg-breadcrumb a:hover, .cg-breadcrumb a:focus-visible { color: var(--ds-marine); text-decoration: underline; }
    .cg-breadcrumb span { color: var(--ds-marine); font-weight: 600; }
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
  readonly membersLoading = signal(true);
  readonly tab = signal<Tab>('members');

  readonly tabs = computed<DsTab[]>(() => [
    { value: 'members', label: 'Membres', badge: this.membersLoading() ? undefined : this.members().length },
    { value: 'contributions', label: 'Cotisations' },
    { value: 'projects', label: 'Projets et lots' },
  ]);
  readonly actionLabel = computed(() => TAB_ACTION[this.tab()]);

  private readonly membersPanel = viewChild(CoopMembersPanelComponent);
  private readonly contributionsPanel = viewChild(CoopContributionsPanelComponent);
  private readonly projectsPanel = viewChild(CoopProjectsPanelComponent);

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
    return [g.city, g.registrationNumber ? `N° ${g.registrationNumber}` : null].filter(v => !!v).join(' · ') || "Groupement d'habitat";
  }

  selectTab(value: string): void {
    this.tab.set(value as Tab);
  }

  primaryAction(): void {
    switch (this.tab()) {
      case 'members': this.membersPanel()?.openAdd(); break;
      case 'contributions': this.contributionsPanel()?.openAdd(); break;
      case 'projects': this.projectsPanel()?.openAdd(); break;
    }
  }

  loadMembers(): void {
    this.api.members(this.groupId).subscribe({
      next: m => { this.members.set(m); this.membersLoading.set(false); },
      error: () => { this.members.set([]); this.membersLoading.set(false); },
    });
  }
}
