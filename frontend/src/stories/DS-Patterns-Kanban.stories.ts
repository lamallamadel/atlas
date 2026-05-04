import type { Meta, StoryObj } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KanbanColumnComponent, DsKanbanColumn } from '../app/design-system/patterns/kanban-column/kanban-column.component';

const CARDS_NEW = [
  { id: 1, title: 'Marie Dupont — Villa 5 pièces', subtitle: '+33 6 12 34 56 78', status: 'new', badge: 'Nouveau', badgeStatus: 'new', assigneeInitials: 'MD', dueDate: "Auj.", dueDateUrgent: true, tags: ['Acheteur', 'Île-de-France'], dossierRef: '#1042' },
  { id: 2, title: 'Jean Martin — Appart. T3', subtitle: '+33 7 89 01 23 45', status: 'new', badge: 'Nouveau', badgeStatus: 'new', assigneeInitials: 'JM', dueDate: 'Demain', tags: ['Locataire'] },
];

const CARDS_QUALIFY = [
  { id: 3, title: 'Sophie Bernard — Maison', subtitle: '+33 6 55 44 33 22', status: 'qualification', badge: 'Qualif.', badgeStatus: 'qualification', assigneeInitials: 'SB', dueDate: '6 mai' },
];

const CARDS_WON = [
  { id: 4, title: 'Paul Leroy — Duplex Paris 11', subtitle: '520 000 €', status: 'won', badge: 'Gagné', badgeStatus: 'won', assigneeInitials: 'PL', dossierRef: '#1039' },
];

const COL_NEW: DsKanbanColumn = {
  id: 'new', label: 'Nouveaux', color: 'marine', limit: 10, cards: CARDS_NEW,
};
const COL_QUALIFYING: DsKanbanColumn = {
  id: 'qualification', label: 'Qualification', color: 'copper', cards: CARDS_QUALIFY,
};
const COL_WON: DsKanbanColumn = {
  id: 'won', label: 'Gagnés', color: 'success', cards: CARDS_WON,
};

export default {
  title: 'Design System/Patterns/KanbanColumn',
  component: KanbanColumnComponent,
  tags: ['autodocs'],
} as Meta<KanbanColumnComponent>;

type Story = StoryObj<KanbanColumnComponent>;

export const NewColumn: Story = {
  args: { column: COL_NEW, connectedTo: ['dsk-qualification', 'dsk-won'], loading: false },
};

export const Loading: Story = {
  args: { column: { id: 'new', label: 'Nouveaux', color: 'marine', cards: [] }, loading: true },
};

export const Empty: Story = {
  args: { column: { id: 'won', label: 'Gagnés', color: 'success', cards: [] }, loading: false },
};

export const FullBoard: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => ({
    moduleMetadata: { imports: [CommonModule, DragDropModule, KanbanColumnComponent] },
    template: `
      <div style="display:flex;gap:16px;padding:24px;background:var(--ds-bg);min-height:100vh;overflow-x:auto;align-items:flex-start">
        <ds-kanban-column [column]="colNew"        [connectedTo]="['dsk-qualification','dsk-rdv','dsk-won','dsk-lost']"></ds-kanban-column>
        <ds-kanban-column [column]="colQualify"    [connectedTo]="['dsk-new','dsk-rdv','dsk-won','dsk-lost']"></ds-kanban-column>
        <ds-kanban-column [column]="colRdv"        [connectedTo]="['dsk-new','dsk-qualification','dsk-won','dsk-lost']"></ds-kanban-column>
        <ds-kanban-column [column]="colWon"        [connectedTo]="['dsk-new','dsk-qualification','dsk-rdv','dsk-lost']"></ds-kanban-column>
        <ds-kanban-column [column]="colLost"       [connectedTo]="['dsk-new','dsk-qualification','dsk-rdv','dsk-won']"></ds-kanban-column>
      </div>
    `,
    props: {
      colNew:     { id: 'new',           label: 'Nouveaux',       color: 'marine',  limit: 10, cards: CARDS_NEW },
      colQualify: { id: 'qualification', label: 'Qualification',  color: 'copper',  cards: CARDS_QUALIFY },
      colRdv:     { id: 'rdv',           label: 'RDV planifié',   color: 'warning', cards: [
        { id: 10, title: 'Claire Moreau — Studio', subtitle: '+33 6 11 22 33 44', status: 'rdv', badge: 'RDV', badgeStatus: 'rdv', assigneeInitials: 'CM', dueDate: '5 mai', tags: ['Investisseur'] },
      ]},
      colWon:     { id: 'won',           label: 'Gagnés',         color: 'success', cards: CARDS_WON },
      colLost:    { id: 'lost',          label: 'Perdus',         color: 'error',   cards: [] },
    },
  }),
};
