import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PageHeaderComponent } from '../app/design-system/patterns/page-header/page-header.component';
import { FilterBarComponent } from '../app/design-system/patterns/filter-bar/filter-bar.component';
import { DsAvatarComponent } from '../app/design-system/primitives/ds-avatar/ds-avatar.component';
import { DsBadgeComponent } from '../app/design-system/primitives/ds-badge/ds-badge.component';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsEmptyStateComponent } from '../app/design-system/primitives/ds-empty-state/ds-empty-state.component';
import { DsSkeletonComponent } from '../app/design-system/primitives/ds-skeleton/ds-skeleton.component';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

interface MockDossier {
  id: number;
  leadName: string;
  leadPhone: string;
  status: string;
  statusBadge: 'new' | 'qualification' | 'rdv' | 'won' | 'lost' | 'neutral';
  createdAt: string;
  annonceId: number | null;
}

const MOCK_DOSSIERS: MockDossier[] = [
  { id: 1, leadName: 'Aminata Diallo', leadPhone: '+221 77 123 45 67', status: 'NEW', statusBadge: 'new', createdAt: '02/05/2026', annonceId: 12 },
  { id: 2, leadName: 'Moussa Konaté', leadPhone: '+221 78 987 65 43', status: 'QUALIFICATION', statusBadge: 'qualification', createdAt: '01/05/2026', annonceId: null },
  { id: 3, leadName: 'Fatou Mbaye', leadPhone: '+221 76 456 78 90', status: 'RDV', statusBadge: 'rdv', createdAt: '30/04/2026', annonceId: 8 },
  { id: 4, leadName: 'Ibrahima Sow', leadPhone: '+221 77 321 54 76', status: 'WON', statusBadge: 'won', createdAt: '28/04/2026', annonceId: 5 },
  { id: 5, leadName: 'Mariama Balde', leadPhone: '+221 78 654 32 10', status: 'LOST', statusBadge: 'lost', createdAt: '25/04/2026', annonceId: null },
];

/* ── Liste dossiers ─────────────────────────────────────────────── */
@Component({
  selector: 'sb-dossiers-list-mock',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent, FilterBarComponent,
    DsAvatarComponent, DsBadgeComponent, DsButtonComponent,
    DsEmptyStateComponent, DsSkeletonComponent,
  ],
  template: `
    <div style="padding:32px; max-width:1200px; margin:0 auto; background:var(--ds-bg); min-height:100vh;">
      <ds-page-header
        eyebrow="Espace Pro" titleBefore="Mes" titleAccent="dossiers"
        description="Gérez vos leads et transactions immobilières.">
        <ng-container slot="actions">
          <ds-button variant="ghost" size="sm">Importer</ds-button>
          <ds-button variant="ghost" size="sm">Exporter</ds-button>
          <ds-button variant="marine" size="md">+ Nouveau dossier</ds-button>
        </ng-container>
      </ds-page-header>

      <ds-filter-bar
        [filters]="[{value:'NEW',label:'Nouveaux'},{value:'QUALIFICATION',label:'Qualification'},{value:'RDV',label:'RDV'},{value:'WON',label:'Gagnés'},{value:'LOST',label:'Perdus'}]"
        activeFilter="NEW" [showSearch]="true" searchPlaceholder="Rechercher lead, téléphone…"
        [showAdvanced]="true" style="margin-bottom:20px;display:block;">
      </ds-filter-bar>

      @if (loading) {
        <div style="display:flex;flex-direction:column;gap:8px;">
          @for (i of [1,2,3,4,5]; track i) {
            <ds-skeleton variant="rect" height="60px"></ds-skeleton>
          }
        </div>
      } @else if (empty) {
        <ds-empty-state
          title="Aucun dossier trouvé"
          description="Ajustez vos filtres ou créez votre premier dossier."
          ctaLabel="Nouveau dossier">
        </ds-empty-state>
      } @else {
        <div style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;overflow:hidden;">
          <!-- Header table -->
          <div style="display:grid;grid-template-columns:1fr 140px 130px 110px 90px 88px;padding:10px 16px;background:var(--ds-surface-offset);border-bottom:1px solid var(--ds-divider);font-size:10.5px;font-weight:700;color:var(--ds-text-faint);letter-spacing:1px;text-transform:uppercase;">
            <span>Lead</span><span>Téléphone</span><span>Statut</span><span>Créé le</span><span>Annonce</span><span>Actions</span>
          </div>
          @for (d of dossiers; track d.id) {
            <div style="display:grid;grid-template-columns:1fr 140px 130px 110px 90px 88px;align-items:center;padding:0 16px;min-height:60px;border-bottom:1px solid var(--ds-divider);cursor:pointer;">
              <div style="display:flex;align-items:center;gap:12px;">
                <ds-avatar [name]="d.leadName" size="sm"></ds-avatar>
                <div>
                  <div style="font-size:13.5px;font-weight:600;">{{ d.leadName }}</div>
                  <div style="font-size:11px;color:var(--ds-text-faint);">#{{ d.id }}</div>
                </div>
              </div>
              <div style="font-size:13px;color:var(--ds-text-muted);">{{ d.leadPhone }}</div>
              <div><ds-badge [status]="d.statusBadge">{{ d.status }}</ds-badge></div>
              <div style="font-size:12px;color:var(--ds-text-faint);">{{ d.createdAt }}</div>
              <div style="font-size:12.5px;color:var(--ds-marine);">{{ d.annonceId ? '#' + d.annonceId : '—' }}</div>
              <div style="display:flex;gap:4px;justify-content:flex-end;">
                <button style="width:32px;height:32px;border:1px solid var(--ds-divider);border-radius:6px;background:transparent;cursor:pointer;color:var(--ds-text-muted);display:flex;align-items:center;justify-content:center;" aria-label="Modifier">✏️</button>
                <button style="width:32px;height:32px;border:1px solid var(--ds-divider);border-radius:6px;background:transparent;cursor:pointer;color:var(--ds-error);display:flex;align-items:center;justify-content:center;" aria-label="Supprimer">🗑️</button>
              </div>
            </div>
          }
          <!-- Pagination -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid var(--ds-divider);">
            <span style="font-size:12.5px;color:var(--ds-text-muted);">5 dossiers · Page 1 / 1</span>
            <div style="display:flex;gap:4px;">
              <button style="width:32px;height:32px;border:1px solid var(--ds-divider);border-radius:6px;background:var(--ds-surface);opacity:.4;cursor:not-allowed;" disabled>←</button>
              <button style="width:32px;height:32px;border:1px solid var(--ds-divider);border-radius:6px;background:var(--ds-surface);opacity:.4;cursor:not-allowed;" disabled>→</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
class DossiersListMockComponent {
  @Input() loading = false;
  @Input() empty = false;
  dossiers = MOCK_DOSSIERS;
}

const meta: Meta<DossiersListMockComponent> = {
  title: 'Pages/Dossiers',
  component: DossiersListMockComponent,
  decorators: [
    applicationConfig({ providers: [provideAnimations(), provideRouter([])] }),
    moduleMetadata({ imports: [DossiersListMockComponent] }),
  ],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    loading: { control: 'boolean' },
    empty: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<DossiersListMockComponent>;

export const ListeComplète: Story = {};
export const EnChargement: Story = { args: { loading: true } };
export const Vide: Story = { args: { empty: true } };
