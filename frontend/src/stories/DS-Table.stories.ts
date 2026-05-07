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

const RICH_COLUMNS = [
  { key: 'id', header: '#', width: '56px' },
  {
    key: 'name',
    header: 'Contact',
    sortable: true,
    cell: (row: Record<string, unknown>) =>
      `<strong>${row['name']}</strong><br><small style="color:var(--ds-text-muted)">${row['phone']}</small>`,
  },
  {
    key: 'status',
    header: 'Statut',
    sortable: true,
    cell: (row: Record<string, unknown>) =>
      `<span class="ds-badge ds-badge--info">${row['status']}</span>`,
  },
  { key: 'date', header: 'Dernière activité', sortable: true, align: 'right' as const },
];

const ROW_ACTIONS = [
  { icon: 'eye', label: 'Voir', action: 'view' },
  { icon: 'edit', label: 'Éditer', action: 'edit', show: (row: Record<string, unknown>) => row['status'] !== 'Perdu' },
  { icon: 'trash', label: 'Supprimer', action: 'delete' },
];

export default {
  title: 'Design System/Patterns/Table',
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

export const AdvancedGenericTableLike: Story = {
  args: {
    columns: RICH_COLUMNS,
    rows: ROWS,
    bordered: true,
    rowClickable: true,
    selectableRows: true,
    selectedRows: [ROWS[0], ROWS[2]],
    sortColumn: 'name',
    sortDirection: 'asc',
    rowActions: ROW_ACTIONS,
    label: 'Tableau dossiers style generic-table',
  },
};
