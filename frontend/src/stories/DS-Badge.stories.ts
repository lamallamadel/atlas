import type { Meta, StoryObj } from '@storybook/angular';
import { DsBadgeComponent } from '../app/design-system/primitives/ds-badge/ds-badge.component';

export default {
  title: 'Design System/Primitives/DsBadge',
  component: DsBadgeComponent,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['new', 'qualification', 'rdv', 'won', 'lost', 'archived', 'draft', 'active', 'paused', 'neutral'],
    },
    size: { control: 'select', options: ['sm', 'md'] },
  },
} as Meta<DsBadgeComponent>;

type Story = StoryObj<DsBadgeComponent>;

export const All: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:10px;flex-wrap:wrap;padding:16px;background:var(--ds-bg)">
        <ds-badge status="new">Nouveau</ds-badge>
        <ds-badge status="qualification">Qualification</ds-badge>
        <ds-badge status="rdv">RDV</ds-badge>
        <ds-badge status="won">Gagné</ds-badge>
        <ds-badge status="lost">Perdu</ds-badge>
        <ds-badge status="archived">Archivé</ds-badge>
        <ds-badge status="draft">Brouillon</ds-badge>
        <ds-badge status="active">Actif</ds-badge>
        <ds-badge status="paused">En pause</ds-badge>
        <ds-badge status="neutral">Neutre</ds-badge>
      </div>
    `,
  }),
};

export const CRMPipeline: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;padding:16px;background:var(--ds-bg);max-width:360px">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--ds-surface);border-radius:10px;border:1px solid var(--ds-divider)">
          <span style="font-size:14px;font-weight:500">Dossier #1042</span>
          <ds-badge status="new">Nouveau</ds-badge>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--ds-surface);border-radius:10px;border:1px solid var(--ds-divider)">
          <span style="font-size:14px;font-weight:500">Dossier #1037</span>
          <ds-badge status="rdv">RDV</ds-badge>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--ds-surface);border-radius:10px;border:1px solid var(--ds-divider)">
          <span style="font-size:14px;font-weight:500">Dossier #1031</span>
          <ds-badge status="won">Gagné</ds-badge>
        </div>
      </div>
    `,
  }),
};
