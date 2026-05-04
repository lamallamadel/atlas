import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PageHeaderComponent } from '../app/design-system/patterns/page-header/page-header.component';
import { KpiCardComponent } from '../app/design-system/patterns/kpi-card/kpi-card.component';
import { FilterBarComponent } from '../app/design-system/patterns/filter-bar/filter-bar.component';
import { DsAvatarComponent } from '../app/design-system/primitives/ds-avatar/ds-avatar.component';
import { DsBadgeComponent } from '../app/design-system/primitives/ds-badge/ds-badge.component';
import { DsEmptyStateComponent } from '../app/design-system/primitives/ds-empty-state/ds-empty-state.component';
import { DsSkeletonComponent } from '../app/design-system/primitives/ds-skeleton/ds-skeleton.component';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { Component } from '@angular/core';

/* ── Mock Dashboard page ─────────────────────────────────────────── */
@Component({
  selector: 'sb-dashboard-mock',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, DatePipe,
    PageHeaderComponent, KpiCardComponent, FilterBarComponent,
    DsAvatarComponent, DsBadgeComponent, DsEmptyStateComponent, DsSkeletonComponent,
  ],
  template: `
    <div style="padding:32px; max-width:1200px; margin:0 auto; background:var(--ds-bg); min-height:100vh;">
      <ds-page-header
        eyebrow="Pro Space"
        titleBefore="Tableau de"
        titleAccent="bord"
        description="Suivez vos indicateurs, gérez vos dossiers et annonces en temps réel.">
        <ng-container slot="actions">
          <div style="display:flex;border:1px solid var(--ds-divider);border-radius:99px;overflow:hidden;">
            <button style="height:32px;padding:0 14px;border:none;background:var(--ds-marine);color:#fff;font-size:12.5px;cursor:pointer;">Aujourd'hui</button>
            <button style="height:32px;padding:0 14px;border:none;background:transparent;color:var(--ds-text-muted);font-size:12.5px;cursor:pointer;">7 jours</button>
            <button style="height:32px;padding:0 14px;border:none;background:transparent;color:var(--ds-text-muted);font-size:12.5px;cursor:pointer;">30 jours</button>
          </div>
        </ng-container>
      </ds-page-header>

      <!-- KPIs -->
      <section style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:32px;">
        <ds-kpi-card value="42" label="Biens en Portefeuille" trend="up" delta="+12%"
          [sparkline]="[12,19,15,22,18,25,28]"></ds-kpi-card>
        <ds-kpi-card value="18" label="Leads Actifs" trend="up" delta="+8%"
          [sparkline]="[8,12,10,15,13,18,20]"></ds-kpi-card>
        <ds-kpi-card value="24%" label="Conversion WhatsApp" trend="up" delta="+15%"
          [sparkline]="[4,6,8,10,15,18,24]"></ds-kpi-card>
      </section>

      <!-- Main grid -->
      <div style="display:grid;grid-template-columns:1fr 380px;gap:24px;">
        <!-- Dossiers récents -->
        <section style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <h2 style="font-size:13.5px;font-weight:700;margin:0;">Derniers dossiers</h2>
          </div>
          <ds-filter-bar [filters]="[{value:'A_TRAITER',label:'À traiter'},{value:'RECENTS',label:'Récents'}]"
            activeFilter="A_TRAITER" [showSearch]="false"></ds-filter-bar>
          @for (d of dossiers; track d.id) {
            <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;cursor:pointer;">
              <ds-avatar [name]="d.name" size="md"></ds-avatar>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:13.5px;">{{ d.name }}</div>
                <div style="font-size:12px;color:var(--ds-text-muted);">{{ d.phone }}</div>
              </div>
              <ds-badge [status]="d.status">{{ d.statusLabel }}</ds-badge>
              <div style="font-size:11.5px;color:var(--ds-text-faint);">{{ d.date }}</div>
            </div>
          }
        </section>

        <!-- Colonne droite -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          <!-- Actions rapides -->
          <section style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;padding:20px;">
            <h2 style="font-size:13.5px;font-weight:700;margin:0 0 12px;">Actions rapides</h2>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              @for (a of quickActions; track a.label) {
                <button style="display:flex;align-items:center;gap:8px;padding:12px;border:1px solid var(--ds-divider);border-radius:8px;background:var(--ds-surface);cursor:pointer;font-size:13px;font-weight:600;color:var(--ds-text);">
                  <div [style.background]="a.bg" [style.color]="a.color" style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:16px;">{{ a.icon }}</span>
                  </div>
                  <span>{{ a.label }}</span>
                </button>
              }
            </div>
          </section>
          <!-- Annonces récentes -->
          <section style="background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <h2 style="font-size:13.5px;font-weight:700;margin:0;">Annonces récentes</h2>
              <a style="font-size:12.5px;color:var(--ds-marine);font-weight:600;cursor:pointer;">Voir tout →</a>
            </div>
            @for (a of annonces; track a.id) {
              <div style="display:flex;align-items:center;gap:12px;padding:8px;border-radius:8px;cursor:pointer;">
                <div style="width:48px;height:40px;border-radius:6px;background:var(--ds-surface-offset);flex:none;display:flex;align-items:center;justify-content:center;color:var(--ds-text-faint);">🏠</div>
                <div style="flex:1;">
                  <div style="font-size:13px;font-weight:600;">{{ a.title }}</div>
                  <div style="font-size:11.5px;color:var(--ds-text-muted);">{{ a.city }} · {{ a.price | number:'1.0-0' }} €</div>
                </div>
                <ds-badge [status]="a.status">{{ a.statusLabel }}</ds-badge>
              </div>
            }
          </section>
        </div>
      </div>
    </div>
  `,
})
class DashboardMockComponent {
  dossiers = [
    { id: 1, name: 'Aminata Diallo', phone: '+221 77 123 45 67', status: 'new' as const, statusLabel: 'NEW', date: '2 mai 2026' },
    { id: 2, name: 'Moussa Konaté', phone: '+221 78 987 65 43', status: 'qualification' as const, statusLabel: 'QUALIFICATION', date: '1 mai 2026' },
    { id: 3, name: 'Fatou Mbaye', phone: '+221 76 456 78 90', status: 'rdv' as const, statusLabel: 'RDV', date: '30 avr. 2026' },
    { id: 4, name: 'Ibrahima Sow', phone: '+221 77 321 54 76', status: 'won' as const, statusLabel: 'WON', date: '28 avr. 2026' },
  ];
  annonces = [
    { id: 1, title: 'Villa 4 pièces Almadies', city: 'Dakar', price: 120000000, status: 'active' as const, statusLabel: 'ACTIVE' },
    { id: 2, title: 'Appt T3 Plateau', city: 'Dakar', price: 45000000, status: 'draft' as const, statusLabel: 'DRAFT' },
    { id: 3, title: 'Studio Mermoz', city: 'Dakar', price: 22000000, status: 'active' as const, statusLabel: 'ACTIVE' },
  ];
  quickActions = [
    { icon: '➕', label: 'Nouveau dossier', bg: 'rgba(13,44,74,.1)', color: 'var(--ds-marine)' },
    { icon: '🏠', label: 'Annonces', bg: 'rgba(175,97,30,.1)', color: 'var(--ds-primary)' },
    { icon: '✅', label: 'Tâches', bg: 'rgba(46,125,50,.1)', color: 'var(--ds-success)' },
    { icon: '📅', label: 'Calendrier', bg: 'rgba(230,81,0,.1)', color: 'var(--ds-warning)' },
  ];
}

const meta: Meta<DashboardMockComponent> = {
  title: 'Pages/Dashboard',
  component: DashboardMockComponent,
  decorators: [
    applicationConfig({ providers: [provideAnimations(), provideRouter([])] }),
    moduleMetadata({ imports: [DashboardMockComponent] }),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<DashboardMockComponent>;

export const Défaut: Story = {};

export const ChargementKPIs: Story = {
  render: () => ({
    template: `
      <div style="padding:32px; max-width:1200px; margin:0 auto; background:var(--ds-bg);">
        <h2 style="margin-bottom:24px;font-size:13.5px;font-weight:700;color:var(--ds-text-muted);">État de chargement des KPIs</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
          <ds-kpi-card value="—" label="Biens en Portefeuille" [loading]="true"></ds-kpi-card>
          <ds-kpi-card value="—" label="Leads Actifs" [loading]="true"></ds-kpi-card>
          <ds-kpi-card value="—" label="Conversion WhatsApp" [loading]="true"></ds-kpi-card>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [KpiCardComponent] },
  }),
};
