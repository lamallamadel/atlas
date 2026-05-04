import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PageHeaderComponent } from '../app/design-system/patterns/page-header/page-header.component';
import { FilterBarComponent } from '../app/design-system/patterns/filter-bar/filter-bar.component';
import { DsBadgeComponent } from '../app/design-system/primitives/ds-badge/ds-badge.component';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsEmptyStateComponent } from '../app/design-system/primitives/ds-empty-state/ds-empty-state.component';
import { DsSkeletonComponent } from '../app/design-system/primitives/ds-skeleton/ds-skeleton.component';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';

interface MockAnnonce {
  id: number;
  title: string;
  city: string;
  price: number;
  surface: number;
  status: 'active' | 'draft' | 'neutral';
  statusLabel: string;
  photo?: string;
}

const MOCK_ANNONCES: MockAnnonce[] = [
  { id: 1, title: 'Villa 4 pièces Almadies', city: 'Dakar', price: 120000000, surface: 280, status: 'active', statusLabel: 'ACTIVE' },
  { id: 2, title: 'Appartement T3 Plateau', city: 'Dakar', price: 45000000, surface: 85, status: 'draft', statusLabel: 'DRAFT' },
  { id: 3, title: 'Studio Mermoz', city: 'Dakar', price: 22000000, surface: 38, status: 'active', statusLabel: 'ACTIVE' },
  { id: 4, title: 'Duplex Point E', city: 'Dakar', price: 78000000, surface: 160, status: 'active', statusLabel: 'ACTIVE' },
  { id: 5, title: 'Local commercial Zone A', city: 'Dakar', price: 95000000, surface: 210, status: 'draft', statusLabel: 'DRAFT' },
  { id: 6, title: 'Terrain 500m² Yoff', city: 'Dakar', price: 35000000, surface: 500, status: 'neutral', statusLabel: 'ARCHIVED' },
];

@Component({
  selector: 'sb-annonces-mock',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe,
    PageHeaderComponent, FilterBarComponent,
    DsBadgeComponent, DsButtonComponent, DsEmptyStateComponent, DsSkeletonComponent,
  ],
  template: `
    <div style="padding:32px; max-width:1200px; margin:0 auto; background:var(--ds-bg); min-height:100vh;">
      <ds-page-header
        eyebrow="Espace Pro" titleBefore="Mes" titleAccent="annonces"
        description="Gérez votre portefeuille de biens immobiliers.">
        <ng-container slot="actions">
          <div style="display:flex;border:1px solid var(--ds-divider);border-radius:6px;overflow:hidden;">
            <button style="width:36px;height:32px;border:none;background:var(--ds-marine-hl);color:var(--ds-marine);cursor:pointer;" title="Cartes">⊞</button>
            <button style="width:36px;height:32px;border:none;background:transparent;color:var(--ds-text-muted);cursor:pointer;" title="Liste">☰</button>
          </div>
          <ds-button variant="marine" size="md">+ Nouvelle annonce</ds-button>
        </ng-container>
      </ds-page-header>

      <ds-filter-bar
        [filters]="[{value:'',label:'Toutes'},{value:'ACTIVE',label:'Actives'},{value:'DRAFT',label:'Brouillons'},{value:'ARCHIVED',label:'Archivées'}]"
        activeFilter="" [showSearch]="true" searchPlaceholder="Ville, référence, type…" [showAdvanced]="true"
        style="margin-bottom:16px;display:block;">
      </ds-filter-bar>

      <!-- Compteur -->
      <div style="font-size:12.5px;color:var(--ds-text-muted);margin-bottom:16px;display:flex;gap:8px;">
        <span style="font-weight:700;color:var(--ds-text);">6 annonces</span>
        <span>·</span><span>4 actives</span>
        <span>·</span><span>2 brouillons</span>
      </div>

      @if (loading) {
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">
          @for (i of [1,2,3,4,5,6]; track i) {
            <ds-skeleton variant="card" height="260px"></ds-skeleton>
          }
        </div>
      } @else if (empty) {
        <ds-empty-state
          title="Aucune annonce"
          description="Publiez votre premier bien pour commencer à recevoir des leads."
          ctaLabel="Créer une annonce">
        </ds-empty-state>
      } @else {
        <!-- Vue cartes -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">
          @for (a of annonces; track a.id) {
            <div style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;overflow:hidden;cursor:pointer;transition:box-shadow .15s;" tabindex="0">
              <!-- Photo -->
              <div style="height:140px;background:var(--ds-surface-offset);display:flex;align-items:center;justify-content:center;color:var(--ds-text-faint);position:relative;">
                <span style="font-size:40px;">🏠</span>
                <div style="position:absolute;top:8px;right:8px;">
                  <ds-badge [status]="a.status" size="sm">{{ a.statusLabel }}</ds-badge>
                </div>
              </div>
              <!-- Contenu -->
              <div style="padding:14px;">
                <div style="font-size:17px;font-weight:700;color:var(--ds-marine);margin-bottom:4px;">{{ a.price | number:'1.0-0' }} €</div>
                <div style="font-size:13.5px;font-weight:600;color:var(--ds-text);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ a.title }}</div>
                <div style="font-size:12px;color:var(--ds-text-muted);">{{ a.city }} · {{ a.surface }} m²</div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
class AnnoncesMockComponent {
  @Input() loading = false;
  @Input() empty = false;
  annonces = MOCK_ANNONCES;
}

const meta: Meta<AnnoncesMockComponent> = {
  title: 'Pages/Annonces',
  component: AnnoncesMockComponent,
  decorators: [
    applicationConfig({ providers: [provideAnimations(), provideRouter([])] }),
    moduleMetadata({ imports: [AnnoncesMockComponent] }),
  ],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    loading: { control: 'boolean' },
    empty: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<AnnoncesMockComponent>;

export const VueCartes: Story = {};
export const EnChargement: Story = { args: { loading: true } };
export const Vide: Story = { args: { empty: true } };
