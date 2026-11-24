import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DsButtonComponent,
  DsCardComponent,
  DsDialogService,
  DsEmptyStateComponent,
  DsIconComponent,
  DsSkeletonComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import { CoopApiService, CoopGroup } from '../../services/coop-api.service';
import { AuthService } from '../../services/auth.service';
import { isManagerOrAdmin } from '../../services/agency-role';
import { serverMessage } from '../../components/annonce-publication-panel.component';
import { CoopGroupDialogComponent } from './coop-dialogs.component';

/** Groupements d'habitat de l'agence ; le manager en crée un nouveau. */
@Component({
  selector: 'app-coop-groups',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DsButtonComponent, DsCardComponent, DsEmptyStateComponent, DsIconComponent, DsSkeletonComponent, PageHeaderComponent],
  template: `
    <div class="pro-page ds-form-stack coop-page">
      <ds-page-header
        eyebrow="Espace Pro"
        titleBefore="Coop"
        titleAccent="habitat"
        description="Groupements d'habitat participatif : membres, cotisations, projets et lots.">
        <ng-container slot="actions">
          @if (canEdit) {
            <ds-button variant="marine" size="md" prefixIcon="plus" (dsClick)="openCreate()">Nouveau groupement</ds-button>
          }
        </ng-container>
      </ds-page-header>

      @if (loading()) {
        <div class="coop-grid">
          @for (i of [1, 2, 3]; track i) {
            <ds-card [pad]="true" elevation="xs">
              <ds-skeleton variant="heading" width="60%"></ds-skeleton>
              <ds-skeleton variant="text" width="40%"></ds-skeleton>
            </ds-card>
          }
        </div>
      } @else if (groups().length === 0) {
        <ds-card [pad]="true" elevation="xs">
          <ds-empty-state
            icon="users"
            title="Aucun groupement"
            [description]="emptyText"
            [ctaLabel]="canEdit ? 'Créer un groupement' : null"
            (ctaClick)="openCreate()">
          </ds-empty-state>
        </ds-card>
      } @else {
        <div class="coop-stats">
          <span class="coop-stats__total">{{ groups().length }} groupement{{ groups().length > 1 ? 's' : '' }}</span>
        </div>
        <div class="coop-grid">
          @for (g of groups(); track g.id) {
            <a class="coop-link" [routerLink]="['/pro/coop', g.id]" [attr.aria-label]="'Ouvrir ' + g.name">
              <ds-card [pad]="true" elevation="xs" [interactive]="true">
                <div class="coop-card">
                  <span class="coop-card__icon" aria-hidden="true"><ds-icon name="building" [size]="20"></ds-icon></span>
                  <div class="coop-card__body">
                    <span class="coop-card__name" [title]="g.name">{{ g.name }}</span>
                    <span class="coop-card__meta">
                      <ds-icon name="map-pin" [size]="16"></ds-icon>
                      {{ g.city || 'Ville non renseignée' }}
                    </span>
                    @if (g.registrationNumber) {
                      <span class="coop-card__ref">N° {{ g.registrationNumber }}</span>
                    }
                  </div>
                  <ds-icon class="coop-card__chevron" name="chevron-right" [size]="20"></ds-icon>
                </div>
              </ds-card>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .coop-page { gap: var(--ds-space-6); }
    .coop-stats { font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
    .coop-stats__total { font-weight: 700; color: var(--ds-marine); }
    .coop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--ds-space-6); }
    .coop-link { display: block; padding: 0; text-decoration: none; color: inherit; border-radius: var(--ds-radius-lg); }
    .coop-link:focus-visible { outline: 2px solid var(--ds-marine); outline-offset: 2px; }
    .coop-card { display: flex; align-items: flex-start; gap: var(--ds-space-4); min-height: 76px; text-align: left; }
    .coop-card__icon { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 40px; height: 40px; border-radius: var(--ds-radius-md); background: var(--ds-marine-hl); color: var(--ds-marine); }
    .coop-card__body { display: flex; flex-direction: column; gap: var(--ds-space-1); flex: 1; min-width: 0; }
    .coop-card__name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-family: var(--ds-font-display); font-size: var(--ds-text-lg); font-weight: 700; color: var(--ds-marine); }
    .coop-card__meta { display: inline-flex; align-items: center; gap: var(--ds-space-1); font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .coop-card__ref { font-size: var(--ds-text-xs); color: var(--ds-text-faint); }
    .coop-card__chevron { flex: none; color: var(--ds-text-faint); align-self: center; }
  `],
})
export class CoopGroupsComponent implements OnInit {
  private readonly api = inject(CoopApiService);
  private readonly toast = inject(DsToastService);
  readonly canEdit = isManagerOrAdmin(inject(AuthService));
  readonly emptyText = this.canEdit
    ? 'Créez le premier groupement pour suivre ses membres et ses cotisations.'
    : "Aucun groupement n'a encore été créé par votre agence.";

  readonly groups = signal<CoopGroup[]>([]);
  readonly loading = signal(true);
  private readonly dialog = inject(DsDialogService);

  ngOnInit(): void {
    this.api.groups().subscribe({
      next: g => { this.groups.set(g); this.loading.set(false); },
      error: err => { this.loading.set(false); this.toast.error(serverMessage(err, 'Impossible de charger les groupements')); },
    });
  }

  openCreate(): void {
    this.dialog
      .open<CoopGroup>(CoopGroupDialogComponent, { width: '520px' })
      .closed.subscribe(g => { if (g) this.groups.update(list => [...list, g]); });
  }
}
