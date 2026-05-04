import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsBadgeComponent, DsBadgeStatus } from '../app/design-system/primitives/ds-badge/ds-badge.component';
import { DsCardComponent } from '../app/design-system/primitives/ds-card/ds-card.component';
import { DsSkeletonComponent } from '../app/design-system/primitives/ds-skeleton/ds-skeleton.component';
import { DsEmptyStateComponent } from '../app/design-system/primitives/ds-empty-state/ds-empty-state.component';

interface MockAnnonce {
  id: number;
  title: string;
  city: string;
  category: string;
  price: number;
  surface: number;
  rooms: number;
  status: string;
  statusBadge: DsBadgeStatus;
  description: string;
  photos: string[];
  orgId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

const ANNONCE_FULL: MockAnnonce = {
  id: 142,
  title: 'Villa moderne 4 chambres avec piscine — Almadies, Dakar',
  city: 'Dakar',
  category: 'Vente — Villa',
  price: 120000000,
  surface: 280,
  rooms: 6,
  status: 'ACTIVE',
  statusBadge: 'active',
  description: `Magnifique villa contemporaine de 280 m² située dans le quartier prisé des Almadies.

— 4 chambres dont une suite parentale avec dressing
— Salon double avec vue sur l'océan
— Cuisine équipée moderne (granit, électroménager neuf)
— Piscine privée 8 × 4 m
— Jardin paysager 200 m²
— Garage 2 voitures, alarme et caméras

Quartier sécurisé 24/7, à 5 min des écoles internationales et 15 min de l'aéroport AIBD.`,
  photos: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop',
  ],
  orgId: 'atlasia-pro',
  createdAt: '2 mai 2026',
  createdBy: 'Aïcha Ba',
  updatedAt: '3 mai 2026',
  updatedBy: 'Moussa Diop',
};

@Component({
  selector: 'sb-annonce-detail-mock',
  standalone: true,
  imports: [
    CommonModule,
    DsButtonComponent, DsBadgeComponent, DsCardComponent,
    DsSkeletonComponent, DsEmptyStateComponent,
  ],
  template: `
    <div class="ad-detail-page" style="max-width:900px;margin:0 auto;padding:20px 24px 48px;background:var(--ds-bg);min-height:100vh;">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
        <button style="display:inline-flex;align-items:center;gap:6px;padding:6px 0;background:transparent;border:none;cursor:pointer;font-size:13.5px;font-weight:500;color:var(--ds-text-muted);">
          <span aria-hidden="true">←</span> Annonces
        </button>
        @if (!loading && !error) {
          <div style="display:flex;gap:8px;">
            <ds-button variant="ghost" size="sm">Modifier</ds-button>
          </div>
        }
      </div>

      <!-- Loading -->
      @if (loading) {
        <div style="display:flex;flex-direction:column;gap:12px;">
          <ds-skeleton variant="text" width="40%" height="28px"></ds-skeleton>
          <ds-skeleton variant="text" width="20%" height="18px"></ds-skeleton>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:24px;">
            @for (i of [1,2,3,4]; track i) {
              <ds-skeleton variant="card" height="120px"></ds-skeleton>
            }
          </div>
        </div>
      }

      <!-- Error -->
      @if (error && !loading) {
        <ds-empty-state
          icon="alert-circle"
          title="Annonce introuvable"
          description="L'annonce demandée n'existe plus ou a été supprimée."
          ctaLabel="Réessayer">
        </ds-empty-state>
      }

      <!-- Contenu -->
      @if (!loading && !error) {
        <!-- Titre + statut -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:28px;flex-wrap:wrap;">
          <div>
            <h1 style="font-family:var(--ds-font-display,var(--ds-font-body));font-size:22px;font-weight:700;color:var(--ds-text);margin:0 0 4px;letter-spacing:-0.3px;line-height:1.25;">
              {{ annonce.title }}
            </h1>
            <p style="font-size:13.5px;color:var(--ds-text-muted);margin:0;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
              <span>{{ annonce.city }}</span>
              <span style="opacity:.4;">·</span>
              <span>{{ annonce.category }}</span>
              <span style="opacity:.4;">·</span>
              <span>{{ annonce.surface }} m²</span>
              <span style="opacity:.4;">·</span>
              <span>{{ annonce.rooms }} pièces</span>
            </p>
          </div>
          <ds-badge [status]="annonce.statusBadge">{{ annonce.status }}</ds-badge>
        </div>

        <!-- Grille d'infos -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:20px;">
          <ds-card elevation="xs" style="padding:16px 18px;display:block;">
            <div style="font-size:11px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--ds-text-faint);margin-bottom:4px;">Prix</div>
            <div style="font-size:18px;font-weight:700;color:var(--ds-marine);">{{ annonce.price | number }} €</div>
          </ds-card>

          <ds-card elevation="xs" style="padding:16px 18px;display:block;">
            <div style="font-size:11px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--ds-text-faint);margin-bottom:4px;">Référence</div>
            <div style="font-size:14px;font-weight:500;color:var(--ds-text);">#{{ annonce.id }}</div>
            <div style="font-size:11px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--ds-text-faint);margin:12px 0 4px;">Organisation</div>
            <div style="font-size:14px;font-weight:500;color:var(--ds-text);">{{ annonce.orgId }}</div>
          </ds-card>

          <ds-card elevation="xs" style="padding:16px 18px;display:block;">
            <div style="font-size:11px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--ds-text-faint);margin-bottom:4px;">Créé le</div>
            <div style="font-size:14px;font-weight:500;color:var(--ds-text);">{{ annonce.createdAt }}</div>
            <div style="font-size:11px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--ds-text-faint);margin:12px 0 4px;">Créé par</div>
            <div style="font-size:14px;font-weight:500;color:var(--ds-text);">{{ annonce.createdBy }}</div>
          </ds-card>

          <ds-card elevation="xs" style="padding:16px 18px;display:block;">
            <div style="font-size:11px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--ds-text-faint);margin-bottom:4px;">Modifié le</div>
            <div style="font-size:14px;font-weight:500;color:var(--ds-text);">{{ annonce.updatedAt }}</div>
            <div style="font-size:11px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--ds-text-faint);margin:12px 0 4px;">Modifié par</div>
            <div style="font-size:14px;font-weight:500;color:var(--ds-text);">{{ annonce.updatedBy }}</div>
          </ds-card>
        </div>

        <!-- Description -->
        @if (annonce.description) {
          <ds-card elevation="xs" style="padding:20px;margin-bottom:16px;display:block;">
            <h2 style="font-size:13px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--ds-text-faint);margin:0 0 12px;">Description</h2>
            <p style="font-size:14px;line-height:1.6;color:var(--ds-text);margin:0;white-space:pre-line;">{{ annonce.description }}</p>
          </ds-card>
        }

        <!-- Photos -->
        @if (annonce.photos.length > 0) {
          <ds-card elevation="xs" style="padding:20px;margin-bottom:16px;display:block;">
            <h2 style="font-size:13px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--ds-text-faint);margin:0 0 12px;">
              Photos ({{ annonce.photos.length }})
            </h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;">
              @for (photo of annonce.photos; track photo) {
                <div style="aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:var(--ds-surface-offset);border:1px solid var(--ds-divider);cursor:zoom-in;">
                  <img [src]="photo" [alt]="annonce.title" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" />
                </div>
              }
            </div>
          </ds-card>
        }
      }
    </div>
  `,
})
class AnnonceDetailMockComponent {
  @Input() loading = false;
  @Input() error = false;
  annonce = ANNONCE_FULL;
}

const meta: Meta<AnnonceDetailMockComponent> = {
  title: 'Pages/Annonce — Détail',
  component: AnnonceDetailMockComponent,
  decorators: [
    applicationConfig({ providers: [provideAnimations(), provideRouter([])] }),
    moduleMetadata({ imports: [AnnonceDetailMockComponent] }),
  ],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    loading: { control: 'boolean' },
    error: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<AnnonceDetailMockComponent>;

export const VillaComplète: Story = {};
export const EnChargement: Story = { args: { loading: true } };
export const Erreur404: Story = { args: { error: true } };
