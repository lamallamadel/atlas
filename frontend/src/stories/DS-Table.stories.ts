import type { Meta, StoryObj } from '@storybook/angular';
import { DsTableComponent } from '../app/design-system/primitives/ds-table/ds-table.component';

const COLUMNS = [
  { key: 'id',     header: '#',         width: '60px', sortable: true },
  { key: 'name',   header: 'Prospect',  sortable: true },
  { key: 'phone',  header: 'Téléphone' },
  { key: 'status', header: 'Statut',    sortable: true },
  { key: 'date',   header: 'Créé le',   sortable: true },
];

const ROWS = [
  { id: 1042, name: 'Marie Dupont',    phone: '+33 6 12 34 56 78', status: 'Nouveau',       date: '3 mai 2026' },
  { id: 1041, name: 'Jean Martin',     phone: '+33 7 89 01 23 45', status: 'Qualification', date: '2 mai 2026' },
  { id: 1040, name: 'Sophie Bernard',  phone: '+33 6 55 44 33 22', status: 'RDV',           date: '1 mai 2026' },
  { id: 1039, name: 'Paul Leroy',      phone: '+33 6 11 22 33 44', status: 'Gagné',         date: '28 avr. 2026' },
  { id: 1038, name: 'Claire Moreau',   phone: '+33 7 66 77 88 99', status: 'Perdu',         date: '25 avr. 2026' },
];

export default {
  title: 'Design System/Primitives/DsTable',
  component: DsTableComponent,
  tags: ['autodocs'],
} as Meta<DsTableComponent>;

type Story = StoryObj<DsTableComponent>;

export const Default: Story = {
  args: { columns: COLUMNS, rows: ROWS, bordered: true, rowClickable: true },
};

export const Loading: Story = {
  args: { columns: COLUMNS, rows: [], loading: true, loadingRowCount: 5, bordered: true },
};

export const Empty: Story = {
  args: { columns: COLUMNS, rows: [], bordered: true, emptyMessage: 'Aucun dossier trouvé. Ajustez vos filtres.' },
};
