import type { Meta, StoryObj } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent }  from '../app/design-system/patterns/page-header/page-header.component';
import { KpiCardComponent }     from '../app/design-system/patterns/kpi-card/kpi-card.component';
import { DsButtonComponent }    from '../app/design-system/primitives/ds-button/ds-button.component';
import { FilterBarComponent }   from '../app/design-system/patterns/filter-bar/filter-bar.component';
import { StageStepperComponent } from '../app/design-system/patterns/stage-stepper/stage-stepper.component';

/* ═══════════════════════════════════════
   PAGE HEADER
   ═══════════════════════════════════════ */
export const PageHeaderDefault: StoryObj = {
  name: 'PageHeader / Default',
  render: () => ({
    moduleMetadata: { imports: [PageHeaderComponent] },
    template: `<div style="padding:32px;background:var(--ds-bg)">
      <ds-page-header
        eyebrow="CRM Immobilier"
        titleBefore="Tableau de"
        titleAccent="bord"
        description="Vue synthétique de votre activité commerciale">
      </ds-page-header>
    </div>`,
  }),
};

export const PageHeaderWithActions: StoryObj = {
  name: 'PageHeader / With Actions',
  render: () => ({
    moduleMetadata: { imports: [PageHeaderComponent, DsButtonComponent] },
    template: `<div style="padding:32px;background:var(--ds-bg)">
      <ds-page-header
        eyebrow="Dossiers"
        titleBefore="Pipeline"
        titleAccent="commercial"
        description="137 dossiers actifs · 12 relances en attente">
        <ds-button slot="actions" size="sm" variant="secondary">Exporter</ds-button>
        <ds-button slot="actions" size="sm">Nouveau dossier</ds-button>
      </ds-page-header>
    </div>`,
  }),
};

export const PageHeaderCompact: StoryObj = {
  name: 'PageHeader / Compact',
  render: () => ({
    moduleMetadata: { imports: [PageHeaderComponent] },
    template: `<div style="padding:16px;background:var(--ds-surface);border-bottom:1px solid var(--ds-divider)">
      <ds-page-header titleBefore="Dossier #1042" [compact]="true"></ds-page-header>
    </div>`,
  }),
};

/* ═══════════════════════════════════════
   KPI CARDS
   ═══════════════════════════════════════ */
export const KpiCardsRow: StoryObj = {
  name: 'KpiCard / Dashboard row',
  render: () => ({
    moduleMetadata: { imports: [CommonModule, KpiCardComponent] },
    template: `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:32px;background:var(--ds-bg)">
        <ds-kpi-card value="137" label="Dossiers actifs" delta="+14 ce mois" trend="up" [sparkline]="[80,90,85,110,125,130,137]"></ds-kpi-card>
        <ds-kpi-card value="12" label="Relances en attente" delta="-3 vs hier" trend="down" valueColor="var(--ds-warning)"></ds-kpi-card>
        <ds-kpi-card value="8" label="RDV cette semaine" delta="→ stable" trend="flat"></ds-kpi-card>
        <ds-kpi-card value="4.2 M€" label="Volume signé" delta="+18%" trend="up" valueColor="var(--ds-success)"></ds-kpi-card>
      </div>`,
  }),
};

export const KpiCardLoading: StoryObj = {
  name: 'KpiCard / Loading',
  render: () => ({
    moduleMetadata: { imports: [KpiCardComponent] },
    template: `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:32px;background:var(--ds-bg)">
        <ds-kpi-card [loading]="true" label="Chargement..."></ds-kpi-card>
        <ds-kpi-card [loading]="true" label="Chargement..."></ds-kpi-card>
        <ds-kpi-card [loading]="true" label="Chargement..."></ds-kpi-card>
      </div>`,
  }),
};

/* ═══════════════════════════════════════
   STAGE STEPPER
   ═══════════════════════════════════════ */
export const StageStepperStory: StoryObj = {
  name: 'StageStepper / CRM pipeline',
  render: () => ({
    moduleMetadata: { imports: [StageStepperComponent] },
    template: `
      <div style="padding:32px;background:var(--ds-bg)">
        <ds-stage-stepper [stages]="stages" [activeStage]="'appointment'"></ds-stage-stepper>
      </div>`,
    props: {
      stages: [
        { id: 'new',          label: 'Nouveau',       status: 'done' },
        { id: 'qualifying',   label: 'Qualification', status: 'done' },
        { id: 'qualified',    label: 'Qualifié',      status: 'done' },
        { id: 'appointment',  label: 'RDV',           status: 'active' },
        { id: 'won',          label: 'Gagné',         status: 'pending' },
      ],
    },
  }),
};

/* ═══════════════════════════════════════
   FILTER BAR
   ═══════════════════════════════════════ */
export const FilterBarStory: StoryObj = {
  name: 'FilterBar / Multi-select',
  render: () => ({
    moduleMetadata: { imports: [FilterBarComponent] },
    template: `
      <div style="padding:32px;background:var(--ds-bg)">
        <ds-filter-bar [filters]="filters" [activeFilters]="['acheteur']"></ds-filter-bar>
      </div>`,
    props: {
      filters: [
        { id: 'all',       label: 'Tous',      count: 137 },
        { id: 'acheteur',  label: 'Acheteurs', count: 89 },
        { id: 'locataire', label: 'Locataires',count: 34 },
        { id: 'vendeur',   label: 'Vendeurs',  count: 14 },
      ],
    },
  }),
};

/* meta required by Storybook */
export default {
  title: 'Design System/Patterns/Layout & Data',
  tags: ['autodocs'],
} as Meta;
