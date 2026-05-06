import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import {
  FilterBarComponent,
  DsFilterOption,
} from '../app/design-system/patterns/filter-bar/filter-bar.component';

const FILTERS: DsFilterOption[] = [
  { value: '', label: 'Tous', count: 42 },
  { value: 'new', label: 'Nouveaux', count: 12 },
  { value: 'active', label: 'En cours', count: 18 },
  { value: 'won', label: 'Gagnés', count: 8 },
];

export default {
  title: 'Design System/Patterns/FilterBar',
  component: FilterBarComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, FilterBarComponent],
    }),
  ],
} as Meta<FilterBarComponent>;

type Story = StoryObj<FilterBarComponent>;

export const Default: Story = {
  args: {
    label: 'Dossiers',
    filters: FILTERS,
    activeFilter: '',
    showSearch: true,
    showAdvanced: true,
    searchPlaceholder: 'Rechercher un dossier…',
    searchValue: '',
  },
};

export const SearchOnly: Story = {
  args: {
    filters: [],
    showSearch: true,
    showAdvanced: false,
    searchPlaceholder: 'Recherche…',
  },
};

export const ChipsOnly: Story = {
  args: {
    filters: FILTERS,
    activeFilter: 'new',
    showSearch: false,
    showAdvanced: false,
  },
};
