import type { Meta, StoryObj } from '@storybook/angular';
import { DsTabsComponent } from '../app/design-system/primitives/ds-tabs/ds-tabs.component';

const DEMO_TABS = [
  { value: 'overview', label: 'Vue d\'ensemble', badge: undefined },
  { value: 'messages', label: 'Messages', badge: 3 },
  { value: 'documents', label: 'Documents' },
  { value: 'timeline', label: 'Historique' },
  { value: 'tasks', label: 'Tâches', disabled: true },
];

export default {
  title: 'Design System/Primitives/DsTabs',
  component: DsTabsComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['underline', 'pills', 'segment'] },
  },
} as Meta<DsTabsComponent>;

type Story = StoryObj<DsTabsComponent>;

export const Underline: Story = {
  args: { tabs: DEMO_TABS, activeTab: 'overview', variant: 'underline' },
};

export const Pills: Story = {
  args: { tabs: DEMO_TABS, activeTab: 'messages', variant: 'pills' },
};

export const Segment: Story = {
  args: {
    tabs: [
      { value: 'list', label: 'Liste' },
      { value: 'kanban', label: 'Kanban' },
      { value: 'calendar', label: 'Calendrier' },
    ],
    activeTab: 'list',
    variant: 'segment',
  },
};

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:32px;padding:24px;background:var(--ds-bg)">
        <div>
          <p style="font-size:11px;color:var(--ds-text-faint);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">Underline (page tabs)</p>
          <ds-tabs [tabs]="tabs" activeTab="overview" variant="underline"></ds-tabs>
        </div>
        <div>
          <p style="font-size:11px;color:var(--ds-text-faint);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">Pills (filters)</p>
          <ds-tabs [tabs]="tabs" activeTab="messages" variant="pills"></ds-tabs>
        </div>
        <div>
          <p style="font-size:11px;color:var(--ds-text-faint);letter-spacing:1px;text-transform:uppercase;margin-bottom:12px">Segment (view toggle)</p>
          <ds-tabs [tabs]="viewTabs" activeTab="list" variant="segment"></ds-tabs>
        </div>
      </div>
    `,
    props: {
      tabs: DEMO_TABS,
      viewTabs: [{ value: 'list', label: 'Liste' }, { value: 'kanban', label: 'Kanban' }, { value: 'calendar', label: 'Calendrier' }],
    },
  }),
};
