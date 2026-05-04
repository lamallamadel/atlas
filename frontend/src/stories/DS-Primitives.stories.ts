import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsBadgeComponent } from '../app/design-system/primitives/ds-badge/ds-badge.component';
import { DsCardComponent } from '../app/design-system/primitives/ds-card/ds-card.component';
import { DsAvatarComponent } from '../app/design-system/primitives/ds-avatar/ds-avatar.component';
import { DsSkeletonComponent } from '../app/design-system/primitives/ds-skeleton/ds-skeleton.component';
import { DsEmptyStateComponent } from '../app/design-system/primitives/ds-empty-state/ds-empty-state.component';
import { DsInputComponent } from '../app/design-system/primitives/ds-input/ds-input.component';
import { DsFilterChipComponent } from '../app/design-system/primitives/ds-filter-chip/ds-filter-chip.component';
import { DsTabsComponent } from '../app/design-system/primitives/ds-tabs/ds-tabs.component';
import { DsTableComponent } from '../app/design-system/primitives/ds-table/ds-table.component';
import { DsIconComponent } from '../app/design-system/icons/ds-icon.component';

// ────────────────────────────────────────────────────────────────────
// ds-button
// ────────────────────────────────────────────────────────────────────
export default {
  title: 'Design System/Primitives/DsButton',
  component: DsButtonComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['marine', 'copper', 'ghost', 'danger', 'icon'] },
    size:    { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} as Meta<DsButtonComponent>;

type Story = StoryObj<DsButtonComponent>;

export const Marine: Story = {
  args: { variant: 'marine', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<ds-button [variant]="variant" [size]="size">Nouveau dossier</ds-button>`,
  }),
};

export const Copper: Story = {
  args: { variant: 'copper', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<ds-button [variant]="variant" [size]="size">Publier l'annonce</ds-button>`,
  }),
};

export const Ghost: Story = {
  args: { variant: 'ghost', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<ds-button [variant]="variant" [size]="size">Annuler</ds-button>`,
  }),
};

export const Danger: Story = {
  args: { variant: 'danger', size: 'md' },
  render: (args) => ({
    props: args,
    template: `<ds-button [variant]="variant" [size]="size">Supprimer</ds-button>`,
  }),
};

export const Loading: Story = {
  args: { variant: 'marine', size: 'md', loading: true },
  render: (args) => ({
    props: args,
    template: `<ds-button [variant]="variant" [size]="size" [loading]="loading">Envoi…</ds-button>`,
  }),
};

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px;flex-wrap:wrap;padding:16px">
        <ds-button variant="marine" size="sm">Marine SM</ds-button>
        <ds-button variant="marine" size="md">Marine MD</ds-button>
        <ds-button variant="marine" size="lg">Marine LG</ds-button>
        <ds-button variant="copper" size="md">Copper</ds-button>
        <ds-button variant="ghost" size="md">Ghost</ds-button>
        <ds-button variant="danger" size="md">Danger</ds-button>
        <ds-button variant="marine" size="md" [loading]="true">Loading</ds-button>
        <ds-button variant="marine" size="md" [disabled]="true">Disabled</ds-button>
      </div>
    `,
  }),
};
