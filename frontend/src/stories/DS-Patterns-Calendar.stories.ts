import type { Meta, StoryObj } from '@storybook/angular';
import { WeekGridComponent, WeekGridEvent } from '../app/design-system/patterns/week-grid/week-grid.component';

const today = new Date();
const monday = (() => {
  const d = new Date(today);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
})();

const h = (day: number, hour: number, min = 0) => {
  const d = new Date(monday);
  d.setDate(monday.getDate() + day);
  d.setHours(hour, min, 0, 0);
  return d;
};

const DEMO_EVENTS: WeekGridEvent[] = [
  { id: 1, title: 'RDV Marie Dupont',  start: h(0, 9),  end: h(0, 10), type: 'appointment', location: '12 rue de la Paix, Paris', dossierRef: '#1042' },
  { id: 2, title: 'Visite appart T3',  start: h(0, 14), end: h(0, 15, 30), type: 'appointment', location: 'Boulogne-Billancourt' },
  { id: 3, title: 'Appel Jean Martin', start: h(1, 10), end: h(1, 10, 30), type: 'task', dossierRef: '#1041' },
  { id: 4, title: 'Réunion équipe',    start: h(1, 11), end: h(1, 12), type: 'block' },
  { id: 5, title: 'RDV notaire',       start: h(2, 9),  end: h(2, 11), type: 'appointment', location: 'Me Dupont, Paris 8e', dossierRef: '#1039' },
  { id: 6, title: 'Relance prospects', start: h(3, 15), end: h(3, 16), type: 'task' },
  { id: 7, title: 'Formation CRM',     start: h(4, 9),  end: h(4, 12), type: 'block' },
  { id: 8, title: 'Foire Immobilière', start: h(5, 0),  end: h(6, 23), type: 'appointment', allDay: true },
];

export default {
  title: 'Design System/Patterns/WeekGrid',
  component: WeekGridComponent,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} as Meta<WeekGridComponent>;

type Story = StoryObj<WeekGridComponent>;

export const ThisWeek: Story = {
  args: { events: DEMO_EVENTS, currentDate: today, startHour: 8, endHour: 19 },
  render: (args) => ({
    props: args,
    template: `
      <div style="height:700px;padding:24px;background:var(--ds-bg)">
        <ds-week-grid [events]="events" [currentDate]="currentDate" [startHour]="startHour" [endHour]="endHour"></ds-week-grid>
      </div>
    `,
  }),
};

export const Compact: Story = {
  args: { events: DEMO_EVENTS, currentDate: today, startHour: 8, endHour: 13 },
  render: (args) => ({
    props: args,
    template: `
      <div style="height:400px;padding:24px;background:var(--ds-bg)">
        <ds-week-grid [events]="events" [currentDate]="currentDate" [startHour]="startHour" [endHour]="endHour"></ds-week-grid>
      </div>
    `,
  }),
};

export const Empty: Story = {
  args: { events: [], currentDate: today, startHour: 8, endHour: 18 },
  render: (args) => ({
    props: args,
    template: `
      <div style="height:600px;padding:24px;background:var(--ds-bg)">
        <ds-week-grid [events]="events" [currentDate]="currentDate" [startHour]="startHour" [endHour]="endHour"></ds-week-grid>
      </div>
    `,
  }),
};
