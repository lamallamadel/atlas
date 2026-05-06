import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { DsBadgeComponent } from '../app/design-system/primitives/ds-badge/ds-badge.component';
import { DsIconComponent } from '../app/design-system/icons/ds-icon.component';
import { DsFilterChipComponent } from '../app/design-system/primitives/ds-filter-chip/ds-filter-chip.component';

const meta: Meta = {
  title: 'Design System/Recipes/Badges & chips',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, DsBadgeComponent, DsIconComponent, DsFilterChipComponent],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Statuts CRM et indicateurs avec ds-badge, pastilles sur icônes, filtres avec ds-filter-chip. Voir aussi Design System / Primitives / DsBadge pour les props détaillées.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const CrmStatuses: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Statuts dossier (CRM)</h2>
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
          <ds-badge status="new">Nouveau</ds-badge>
          <ds-badge status="qualification">Qualification</ds-badge>
          <ds-badge status="rdv">RDV</ds-badge>
          <ds-badge status="won">Gagné</ds-badge>
          <ds-badge status="lost">Perdu</ds-badge>
          <ds-badge status="archived">Archivé</ds-badge>
        </div>
      </div>
    `,
  }),
};

export const SemanticStatuses: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Sémantique générique</h2>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          <ds-badge status="success">Succès</ds-badge>
          <ds-badge status="warning">Attention</ds-badge>
          <ds-badge status="error">Erreur</ds-badge>
          <ds-badge status="info">Info</ds-badge>
          <ds-badge status="neutral">Neutre</ds-badge>
        </div>
      </div>
    `,
  }),
};

export const WithIcons: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Badges avec icône DS</h2>
        <p style="color:var(--ds-text-muted);font-size:14px;margin-bottom:16px;">Désactiver le point intégré : showDot=false</p>
        <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
          <ds-badge status="success" [showDot]="false">
            <span style="display:inline-flex;align-items:center;gap:6px;">
              <ds-icon name="check" [size]="16"></ds-icon> Vérifié
            </span>
          </ds-badge>
          <ds-badge status="warning" [showDot]="false">
            <span style="display:inline-flex;align-items:center;gap:6px;">
              <ds-icon name="calendar" [size]="16"></ds-icon> En attente
            </span>
          </ds-badge>
          <ds-badge status="info" [showDot]="false">
            <span style="display:inline-flex;align-items:center;gap:6px;">
              <ds-icon name="star" [size]="16"></ds-icon> À la une
            </span>
          </ds-badge>
        </div>
      </div>
    `,
  }),
};

export const IconCounts: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Compteurs sur icônes</h2>
        <div style="display:flex;flex-wrap:wrap;gap:32px;align-items:center;">
          <div style="position:relative;display:inline-flex;">
            <ds-icon name="mail" [size]="24" style="color:var(--ds-text-muted)"></ds-icon>
            <span style="position:absolute;top:-6px;right:-8px;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;background:var(--ds-error);color:var(--ds-text-inverse);border-radius:var(--ds-radius-pill);font-size:11px;font-weight:700;padding:0 6px;">5</span>
          </div>
          <div style="position:relative;display:inline-flex;">
            <ds-icon name="tasks" [size]="24" style="color:var(--ds-text-muted)"></ds-icon>
            <span style="position:absolute;top:-6px;right:-8px;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;background:var(--ds-marine);color:var(--ds-text-inverse);border-radius:var(--ds-radius-pill);font-size:11px;font-weight:700;padding:0 6px;">12</span>
          </div>
          <div style="position:relative;display:inline-flex;">
            <ds-icon name="building" [size]="24" style="color:var(--ds-text-muted)"></ds-icon>
            <span style="position:absolute;top:0;right:0;width:10px;height:10px;background:var(--ds-error);border-radius:50%;border:2px solid var(--ds-surface);"></span>
          </div>
        </div>
      </div>
    `,
  }),
};

export const FilterChips: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Filtres (ds-filter-chip)</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <ds-filter-chip [active]="true">Tous</ds-filter-chip>
          <ds-filter-chip>Nouveaux</ds-filter-chip>
          <ds-filter-chip [count]="4">En cours</ds-filter-chip>
          <ds-filter-chip>Gagnés</ds-filter-chip>
        </div>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 24px;">Tailles ds-badge</h2>
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
          <ds-badge status="new" size="sm">SM</ds-badge>
          <ds-badge status="new" size="md">MD</ds-badge>
        </div>
      </div>
    `,
  }),
};

export const UsageSnippet: Story = {
  render: () => ({
    template: `
      <div style="font-family: var(--ds-font-body, system-ui); color: var(--ds-text);">
        <h2 style="margin-bottom: 16px;">Exemple Angular</h2>
        <pre style="background:var(--ds-surface-2);padding:16px;border-radius:var(--ds-radius-md);overflow-x:auto;font-family:monospace;font-size:13px;line-height:1.55;border:1px solid var(--ds-divider);"><code>&lt;ds-badge status="won" size="sm"&gt;Gagné&lt;/ds-badge&gt;
&lt;ds-badge status="success" [showDot]="false"&gt;
  &lt;ds-icon name="check" [size]="16" /&gt; OK
&lt;/ds-badge&gt;</code></pre>
      </div>
    `,
  }),
};
