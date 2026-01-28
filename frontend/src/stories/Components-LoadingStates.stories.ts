import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

const meta: Meta = {
  title: 'Components/Loading States',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, MatProgressSpinnerModule, MatProgressBarModule],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Loading state components including spinners, skeleton loaders, and progress indicators for providing feedback during async operations.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Spinners: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Spinners</h2>
        
        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Spinner Sizes</h3>
            <div style="display: flex; gap: 32px; align-items: center;">
              <div style="text-align: center;">
                <mat-spinner diameter="24"></mat-spinner>
                <div style="margin-top: 12px; font-size: 12px; color: var(--color-neutral-600);">Small (24px)</div>
              </div>
              <div style="text-align: center;">
                <mat-spinner diameter="40"></mat-spinner>
                <div style="margin-top: 12px; font-size: 12px; color: var(--color-neutral-600);">Medium (40px)</div>
              </div>
              <div style="text-align: center;">
                <mat-spinner diameter="60"></mat-spinner>
                <div style="margin-top: 12px; font-size: 12px; color: var(--color-neutral-600);">Large (60px)</div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Button Loading State</h3>
            <div style="display: flex; gap: 12px; align-items: center;">
              <button disabled style="padding: 10px 20px; background: var(--color-primary-500); color: white; border: none; border-radius: var(--radius-lg); display: flex; align-items: center; gap: 8px; cursor: not-allowed; opacity: 0.8;">
                <div style="width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                Loading...
              </button>
              <button disabled style="padding: 10px 20px; background: transparent; color: var(--color-primary-500); border: 1px solid var(--color-primary-500); border-radius: var(--radius-lg); display: flex; align-items: center; gap: 8px; cursor: not-allowed; opacity: 0.8;">
                <div style="width: 16px; height: 16px; border: 2px solid var(--color-primary-500); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                Processing...
              </button>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Inline Spinner</h3>
            <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--color-neutral-50); border-radius: var(--radius-lg);">
              <div style="width: 20px; height: 20px; border: 2px solid var(--color-primary-500); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
              <span style="color: var(--color-neutral-700);">Loading data...</span>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Full Page Loading</h3>
            <div style="position: relative; height: 300px; background: var(--color-neutral-100); border-radius: var(--radius-xl); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;">
              <mat-spinner diameter="48"></mat-spinner>
              <div style="color: var(--color-neutral-700); font-size: 16px;">Loading application...</div>
            </div>
          </div>
        </div>

        <style>
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        </style>
      </div>
    `,
  }),
};

export const SkeletonLoaders: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Skeleton Loaders</h2>
        
        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Card Skeleton</h3>
            <div style="max-width: 400px; background: white; padding: 20px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2);">
              <div style="width: 100%; height: 200px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: var(--radius-lg); margin-bottom: 16px;"></div>
              <div style="width: 60%; height: 20px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; margin-bottom: 12px;"></div>
              <div style="width: 100%; height: 16px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; margin-bottom: 8px;"></div>
              <div style="width: 80%; height: 16px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px;"></div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">List Skeleton</h3>
            <div style="max-width: 600px; background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-2); overflow: hidden;">
              <div style="padding: 16px; border-bottom: 1px solid var(--color-neutral-200); display: flex; align-items: center; gap: 16px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 50%; flex-shrink: 0;"></div>
                <div style="flex: 1;">
                  <div style="width: 40%; height: 16px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; margin-bottom: 8px;"></div>
                  <div style="width: 60%; height: 14px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px;"></div>
                </div>
              </div>
              <div style="padding: 16px; border-bottom: 1px solid var(--color-neutral-200); display: flex; align-items: center; gap: 16px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 50%; flex-shrink: 0;"></div>
                <div style="flex: 1;">
                  <div style="width: 50%; height: 16px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; margin-bottom: 8px;"></div>
                  <div style="width: 70%; height: 14px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px;"></div>
                </div>
              </div>
              <div style="padding: 16px; display: flex; align-items: center; gap: 16px;">
                <div style="width: 48px; height: 48px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 50%; flex-shrink: 0;"></div>
                <div style="flex: 1;">
                  <div style="width: 45%; height: 16px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; margin-bottom: 8px;"></div>
                  <div style="width: 65%; height: 14px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px;"></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Text Skeleton</h3>
            <div style="max-width: 600px; background: white; padding: 24px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2);">
              <div style="width: 40%; height: 24px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; margin-bottom: 16px;"></div>
              <div style="width: 100%; height: 16px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; margin-bottom: 8px;"></div>
              <div style="width: 95%; height: 16px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; margin-bottom: 8px;"></div>
              <div style="width: 90%; height: 16px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; margin-bottom: 8px;"></div>
              <div style="width: 70%; height: 16px; background: linear-gradient(90deg, var(--color-neutral-200) 25%, var(--color-neutral-100) 50%, var(--color-neutral-200) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px;"></div>
            </div>
          </div>
        </div>

        <style>
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        </style>
      </div>
    `,
  }),
};

export const ProgressBars: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Progress Bars</h2>
        
        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Determinate Progress</h3>
            <div style="max-width: 500px;">
              <div style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: var(--color-neutral-700);">Upload Progress</span>
                  <span style="font-size: 14px; font-weight: 500; color: var(--color-primary-600);">65%</span>
                </div>
                <div style="height: 8px; background: var(--color-neutral-200); border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: 65%; height: 100%; background: var(--color-primary-500); border-radius: var(--radius-full); transition: width 0.3s ease;"></div>
                </div>
              </div>
              
              <div style="margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 14px; color: var(--color-neutral-700);">Processing</span>
                  <span style="font-size: 14px; font-weight: 500; color: var(--color-success-600);">100%</span>
                </div>
                <div style="height: 8px; background: var(--color-neutral-200); border-radius: var(--radius-full); overflow: hidden;">
                  <div style="width: 100%; height: 100%; background: var(--color-success-500); border-radius: var(--radius-full);"></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Indeterminate Progress</h3>
            <div style="max-width: 500px;">
              <div style="margin-bottom: 24px;">
                <div style="margin-bottom: 8px;">
                  <span style="font-size: 14px; color: var(--color-neutral-700);">Loading...</span>
                </div>
                <mat-progress-bar mode="indeterminate" color="primary"></mat-progress-bar>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Step Progress</h3>
            <div style="max-width: 600px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="text-align: center; flex: 1;">
                  <div style="width: 40px; height: 40px; background: var(--color-success-500); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 600;">✓</div>
                  <div style="font-size: 12px; color: var(--color-neutral-700);">Step 1</div>
                </div>
                <div style="flex: 1; height: 2px; background: var(--color-success-500); margin: 0 8px;"></div>
                <div style="text-align: center; flex: 1;">
                  <div style="width: 40px; height: 40px; background: var(--color-primary-500); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 600;">2</div>
                  <div style="font-size: 12px; color: var(--color-neutral-900); font-weight: 500;">Step 2</div>
                </div>
                <div style="flex: 1; height: 2px; background: var(--color-neutral-300); margin: 0 8px;"></div>
                <div style="text-align: center; flex: 1;">
                  <div style="width: 40px; height: 40px; background: var(--color-neutral-300); color: var(--color-neutral-600); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; font-weight: 600;">3</div>
                  <div style="font-size: 12px; color: var(--color-neutral-600);">Step 3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const BestPractices: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Loading States Best Practices</h2>

        <div style="display: grid; gap: 24px;">
          <div style="background: var(--color-success-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; color: var(--color-success-700);">✓ Do</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Show loading state immediately for operations over 200ms</li>
              <li>Use skeleton loaders for content-heavy sections</li>
              <li>Use spinners for quick operations or button states</li>
              <li>Provide progress feedback for long operations (>5s)</li>
              <li>Disable interactive elements during loading</li>
              <li>Add descriptive text when possible ("Loading...")</li>
              <li>Use appropriate ARIA attributes (aria-busy, aria-live)</li>
            </ul>
          </div>

          <div style="background: var(--color-error-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; color: var(--color-error-700);">✗ Don't</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Don't show loading for operations under 200ms</li>
              <li>Don't use multiple spinners on same page</li>
              <li>Don't block the entire UI unless necessary</li>
              <li>Don't forget to remove loading state on error</li>
              <li>Don't use progress bars for unknown durations</li>
              <li>Don't make loading states distracting</li>
            </ul>
          </div>

          <div style="background: var(--color-info-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-info-500);">
            <h3 style="margin-top: 0; color: var(--color-info-700);">When to Use</h3>
            <div style="display: grid; gap: 16px; color: var(--color-neutral-700);">
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Spinners</div>
                <div style="font-size: 14px;">Quick operations (< 5s), button states, inline loading</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Skeleton Loaders</div>
                <div style="font-size: 14px;">Page/section loading, maintaining layout, content-heavy areas</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Progress Bars</div>
                <div style="font-size: 14px;">File uploads, known duration operations, multi-step processes</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Full Page Loading</div>
                <div style="font-size: 14px;">Initial app load, major state changes, authentication</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
