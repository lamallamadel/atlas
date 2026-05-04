import type { Meta, StoryObj } from '@storybook/angular';
import { DsIconComponent } from '../app/design-system/icons/ds-icon.component';

const ALL_ICONS = DsIconComponent.available;

export default {
  title: 'Design System/Icons/DsIcon',
  component: DsIconComponent,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'select', options: ALL_ICONS },
    size: { control: 'select', options: [16, 20, 24] },
  },
} as Meta<DsIconComponent>;

type Story = StoryObj<DsIconComponent>;

export const Single: Story = {
  args: { name: 'home', size: 24 },
};

export const Gallery: Story = {
  render: () => ({
    template: `
      <div style="padding:24px;background:var(--ds-bg)">
        <p style="font-size:11px;color:var(--ds-text-faint);letter-spacing:1px;text-transform:uppercase;margin-bottom:16px">Icônes disponibles — 24px</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px">
          @for (icon of icons; track icon) {
            <div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;background:var(--ds-surface);border:1px solid var(--ds-divider);border-radius:10px">
              <ds-icon [name]="icon" [size]="24" style="color:var(--ds-marine)"></ds-icon>
              <span style="font-size:10px;color:var(--ds-text-faint);text-align:center;line-height:1.3">{{icon}}</span>
            </div>
          }
        </div>
      </div>
    `,
    props: { icons: ALL_ICONS },
  }),
};

export const Sizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:24px;align-items:flex-end;padding:24px;background:var(--ds-bg)">
        @for (size of [16, 20, 24]; track size) {
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
            <ds-icon name="home" [size]="size" style="color:var(--ds-marine)"></ds-icon>
            <span style="font-size:11px;color:var(--ds-text-faint)">{{size}}px</span>
          </div>
        }
      </div>
    `,
  }),
};
