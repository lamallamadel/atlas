import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DsButtonComponent,
  DsCardComponent,
  DsEmptyStateComponent,
  DsInputComponent,
  DsSkeletonComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import { CoopApiService, CoopGroup } from '../../services/coop-api.service';
import { AuthService } from '../../services/auth.service';
import { isManagerOrAdmin } from '../../services/agency-role';
import { serverMessage } from '../../components/annonce-publication-panel.component';

/** Groupements d'habitat de l'agence ; le manager en crée un nouveau. */
@Component({
  selector: 'app-coop-groups',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, DsButtonComponent, DsCardComponent, DsEmptyStateComponent, DsInputComponent, DsSkeletonComponent, PageHeaderComponent],
  template: `
    <div class="coop-page">
      <ds-page-header eyebrow="Espace Pro" titleBefore="Coop habitat"
        description="Groupements d'habitat participatif : membres, cotisations, projets et lots.">
      </ds-page-header>

      @if (canEdit) {
        <ds-card [pad]="true" elevation="xs">
          <h2 class="coop-title">Nouveau groupement</h2>
          <form #f="ngForm" class="coop-form" (ngSubmit)="create(f)">
            <ds-input label="Nom" name="name" [(ngModel)]="draft.name" required></ds-input>
            <ds-input label="Ville" name="city" [(ngModel)]="draft.city"></ds-input>
            <ds-input label="N° d'enregistrement" name="registrationNumber" [(ngModel)]="draft.registrationNumber"></ds-input>
            <div class="coop-form__submit">
              <ds-button variant="marine" nativeType="submit" [disabled]="busy() || !!f.invalid">Créer</ds-button>
            </div>
          </form>
        </ds-card>
      }

      @if (loading()) {
        <ds-skeleton variant="text"></ds-skeleton>
        <ds-skeleton variant="text"></ds-skeleton>
      } @else if (groups().length === 0) {
        <ds-card [pad]="true" elevation="xs">
          <ds-empty-state title="Aucun groupement"
            [description]="canEdit ? 'Créez le premier groupement pour suivre ses membres et ses cotisations.' : 'Aucun groupement n\\'a encore été créé par votre agence.'">
          </ds-empty-state>
        </ds-card>
      } @else {
        <div class="coop-grid">
          @for (g of groups(); track g.id) {
            <a class="coop-card" [routerLink]="['/pro/coop', g.id]">
              <span class="coop-card__name">{{ g.name }}</span>
              <span class="coop-card__meta">{{ g.city || 'Ville non renseignée' }}@if (g.registrationNumber) { · {{ g.registrationNumber }} }</span>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .coop-page { display: flex; flex-direction: column; gap: var(--ds-space-6); }
    .coop-title { margin: 0 0 var(--ds-space-4); font-size: var(--ds-text-base); font-weight: 700; color: var(--ds-marine); }
    .coop-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--ds-space-4); align-items: end; }
    .coop-form__submit { display: flex; align-items: flex-end; }
    .coop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--ds-space-4); }
    .coop-card { display: flex; flex-direction: column; gap: 6px; padding: var(--ds-space-4); background: var(--ds-surface); border: 1px solid var(--ds-border); border-radius: var(--ds-radius-md); text-decoration: none; color: var(--ds-text); }
    .coop-card:hover, .coop-card:focus-visible { border-color: var(--ds-marine); }
    .coop-card__name { font-weight: 700; }
    .coop-card__meta { font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
  `],
})
export class CoopGroupsComponent implements OnInit {
  private readonly api = inject(CoopApiService);
  private readonly toast = inject(DsToastService);
  readonly canEdit = isManagerOrAdmin(inject(AuthService));

  readonly groups = signal<CoopGroup[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  draft = { name: '', city: '', registrationNumber: '' };

  ngOnInit(): void {
    this.api.groups().subscribe({
      next: g => { this.groups.set(g); this.loading.set(false); },
      error: err => { this.loading.set(false); this.toast.error(serverMessage(err, 'Impossible de charger les groupements')); },
    });
  }

  create(form: NgForm): void {
    if (form.invalid) return;
    this.busy.set(true);
    this.api.createGroup({ name: this.draft.name.trim(), city: this.draft.city || null, registrationNumber: this.draft.registrationNumber || null }).subscribe({
      next: g => {
        this.busy.set(false);
        this.groups.update(list => [...list, g]);
        this.toast.success(`Groupement « ${g.name} » créé`);
        form.resetForm();
        this.draft = { name: '', city: '', registrationNumber: '' };
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'La création a échoué')); },
    });
  }
}
