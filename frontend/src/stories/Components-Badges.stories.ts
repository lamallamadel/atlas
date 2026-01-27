import { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

const meta: Meta = {
  title: 'Components/Badges',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, MatChipsModule, MatIconModule],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Badge and chip components for status indicators, tags, and labels with semantic colors.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const StatusBadges: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Status Badges</h2>
        
        <div style="display: grid; gap: 32px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Semantic Status</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-success-100); color: var(--color-success-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                ● Success
              </span>
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-warning-100); color: var(--color-warning-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                ● Warning
              </span>
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-error-100); color: var(--color-error-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                ● Error
              </span>
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-info-100); color: var(--color-info-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                ● Info
              </span>
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-neutral-200); color: var(--color-neutral-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                ● Neutral
              </span>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Dossier Status</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-info-100); color: var(--color-info-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                New
              </span>
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-warning-100); color: var(--color-warning-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                In Progress
              </span>
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-primary-100); color: var(--color-primary-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                Under Review
              </span>
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-success-100); color: var(--color-success-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                Completed
              </span>
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-error-100); color: var(--color-error-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                Rejected
              </span>
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-neutral-200); color: var(--color-neutral-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                Archived
              </span>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Property Type</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-primary-100); color: var(--color-primary-800); border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                Sale
              </span>
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-secondary-100); color: var(--color-secondary-800); border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                Rent
              </span>
              <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-info-100); color: var(--color-info-800); border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                Commercial
              </span>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">With Icons</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--color-success-100); color: var(--color-success-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">check_circle</mat-icon>
                Verified
              </span>
              <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--color-warning-100); color: var(--color-warning-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">schedule</mat-icon>
                Pending
              </span>
              <span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: var(--color-info-100); color: var(--color-info-800); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px;">star</mat-icon>
                Featured
              </span>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const CountBadges: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Count Badges</h2>
        
        <div style="display: grid; gap: 32px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Notification Counts</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: center;">
              <div style="position: relative; display: inline-flex;">
                <mat-icon style="font-size: 32px; width: 32px; height: 32px; color: var(--color-neutral-600);">notifications</mat-icon>
                <span style="position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: var(--color-error-500); color: white; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; padding: 0 6px;">
                  5
                </span>
              </div>

              <div style="position: relative; display: inline-flex;">
                <mat-icon style="font-size: 32px; width: 32px; height: 32px; color: var(--color-neutral-600);">mail</mat-icon>
                <span style="position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: var(--color-primary-500); color: white; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; padding: 0 6px;">
                  12
                </span>
              </div>

              <div style="position: relative; display: inline-flex;">
                <mat-icon style="font-size: 32px; width: 32px; height: 32px; color: var(--color-neutral-600);">shopping_cart</mat-icon>
                <span style="position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; background: var(--color-success-500); color: white; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; padding: 0 6px;">
                  3
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">High Count (99+)</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: center;">
              <div style="position: relative; display: inline-flex;">
                <mat-icon style="font-size: 32px; width: 32px; height: 32px; color: var(--color-neutral-600);">inbox</mat-icon>
                <span style="position: absolute; top: -4px; right: -4px; min-width: 24px; height: 20px; display: flex; align-items: center; justify-content: center; background: var(--color-error-500); color: white; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; padding: 0 6px;">
                  99+
                </span>
              </div>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Show "99+" for counts over 99 to prevent layout overflow
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Dot Indicator (No Count)</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: center;">
              <div style="position: relative; display: inline-flex;">
                <mat-icon style="font-size: 32px; width: 32px; height: 32px; color: var(--color-neutral-600);">notifications</mat-icon>
                <span style="position: absolute; top: 2px; right: 2px; width: 10px; height: 10px; background: var(--color-error-500); border-radius: var(--radius-full); border: 2px solid white;">
                </span>
              </div>
              <div style="position: relative; display: inline-flex;">
                <mat-icon style="font-size: 32px; width: 32px; height: 32px; color: var(--color-neutral-600);">message</mat-icon>
                <span style="position: absolute; top: 2px; right: 2px; width: 10px; height: 10px; background: var(--color-primary-500); border-radius: var(--radius-full); border: 2px solid white;">
                </span>
              </div>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use when you only need to indicate presence, not quantity
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const Tags: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Tags & Chips</h2>
        
        <div style="display: grid; gap: 32px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Basic Tags</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <mat-chip-set>
                <mat-chip>JavaScript</mat-chip>
                <mat-chip>TypeScript</mat-chip>
                <mat-chip>Angular</mat-chip>
                <mat-chip>RxJS</mat-chip>
                <mat-chip>Material</mat-chip>
              </mat-chip-set>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Removable Tags</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <mat-chip-set>
                <mat-chip>
                  Paris
                  <button matChipRemove aria-label="Remove Paris">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
                <mat-chip>
                  Lyon
                  <button matChipRemove aria-label="Remove Lyon">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
                <mat-chip>
                  Marseille
                  <button matChipRemove aria-label="Remove Marseille">
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip>
              </mat-chip-set>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Colored Tags</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--color-primary-500); color: white; border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                Primary
              </span>
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--color-secondary-500); color: white; border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                Secondary
              </span>
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--color-success-500); color: white; border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                Success
              </span>
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--color-warning-500); color: white; border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                Warning
              </span>
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; background: var(--color-error-500); color: white; border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                Error
              </span>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Outlined Tags</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid var(--color-primary-500); color: var(--color-primary-700); border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                Primary
              </span>
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid var(--color-secondary-500); color: var(--color-secondary-700); border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                Secondary
              </span>
              <span style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px solid var(--color-success-500); color: var(--color-success-700); border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                Success
              </span>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const BadgeSizes: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Badge Sizes</h2>
        
        <div style="display: grid; gap: 24px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Small</h3>
            <span style="display: inline-flex; align-items: center; padding: 4px 8px; background: var(--color-primary-100); color: var(--color-primary-800); border-radius: var(--radius-md); font-size: 11px; font-weight: 500;">
              Small Badge
            </span>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Medium (Default)</h3>
            <span style="display: inline-flex; align-items: center; padding: 6px 12px; background: var(--color-primary-100); color: var(--color-primary-800); border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
              Medium Badge
            </span>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Large</h3>
            <span style="display: inline-flex; align-items: center; padding: 8px 16px; background: var(--color-primary-100); color: var(--color-primary-800); border-radius: var(--radius-lg); font-size: 14px; font-weight: 500;">
              Large Badge
            </span>
          </div>
        </div>
      </div>
    `,
  }),
};

export const CodeExamples: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Code Examples</h2>
        
        <div style="display: grid; gap: 24px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">HTML - Status Badge</h3>
            <pre style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6;"><code>&lt;span class="badge badge--success"&gt;
  Active
&lt;/span&gt;

&lt;!-- CSS --&gt;
.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
}

.badge--success {
  background: var(--color-success-100);
  color: var(--color-success-800);
}</code></pre>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">HTML - Count Badge</h3>
            <pre style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6;"><code>&lt;div class="icon-with-badge"&gt;
  &lt;mat-icon&gt;notifications&lt;/mat-icon&gt;
  &lt;span class="count-badge"&gt;5&lt;/span&gt;
&lt;/div&gt;

&lt;!-- CSS --&gt;
.icon-with-badge {
  position: relative;
  display: inline-flex;
}

.count-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-error-500);
  color: white;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  padding: 0 6px;
}</code></pre>
          </div>
        </div>
      </div>
    `,
  }),
};
