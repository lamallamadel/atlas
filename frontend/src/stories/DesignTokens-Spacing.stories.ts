import { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Design Tokens/Spacing',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '4px base grid system with consistent spacing tokens for margins, padding, and gaps.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const SpacingScale: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Spacing Scale (4px Grid)</h2>
        
        <p style="margin-bottom: 32px; color: var(--color-neutral-600); line-height: 1.6;">
          All spacing follows a 4px base grid. Each step multiplies the base by a consistent factor.
        </p>

        <div style="display: grid; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-0</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">0 / 0px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: 0;"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-1</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">0.25rem / 4px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-1);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-2</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">0.5rem / 8px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-2);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-3</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">0.75rem / 12px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-3);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-4</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">1rem / 16px ⭐</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-4);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-5</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">1.25rem / 20px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-5);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-6</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">1.5rem / 24px ⭐</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-6);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-8</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">2rem / 32px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-8);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-10</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">2.5rem / 40px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-10);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-12</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">3rem / 48px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-12);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-16</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">4rem / 64px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-16);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-20</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">5rem / 80px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-20);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-24</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">6rem / 96px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-24);"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="width: 200px;">
              <code style="font-weight: 600;">--spacing-32</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">8rem / 128px</div>
            </div>
            <div style="background: var(--color-primary-500); height: 24px; width: var(--spacing-32);"></div>
          </div>
        </div>

        <div style="background: var(--color-info-50); padding: 24px; border-radius: 12px; margin-top: 32px; border-left: 4px solid var(--color-info-500);">
          <h3 style="margin-top: 0; color: var(--color-info-700);">Most Common Values</h3>
          <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
            <li><code>--spacing-4</code> (16px): Default padding for buttons, form inputs</li>
            <li><code>--spacing-6</code> (24px): Card padding, section spacing</li>
            <li><code>--spacing-8</code> (32px): Page margins, large gaps</li>
            <li><code>--spacing-2</code> (8px): Small gaps, tight spacing</li>
          </ul>
        </div>
      </div>
    `,
  }),
};

export const SpacingExamples: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Spacing Examples</h2>

        <div style="display: grid; gap: 32px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Card Padding</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
              <div style="background: var(--color-neutral-50); border: 2px solid var(--color-neutral-300); border-radius: 8px; padding: var(--spacing-4);">
                <div style="font-weight: 600; margin-bottom: 4px;">Compact (16px)</div>
                <div style="font-size: 14px; color: var(--color-neutral-600);">padding: var(--spacing-4)</div>
              </div>
              <div style="background: var(--color-neutral-50); border: 2px solid var(--color-neutral-300); border-radius: 8px; padding: var(--spacing-6);">
                <div style="font-weight: 600; margin-bottom: 4px;">Default (24px)</div>
                <div style="font-size: 14px; color: var(--color-neutral-600);">padding: var(--spacing-6)</div>
              </div>
              <div style="background: var(--color-neutral-50); border: 2px solid var(--color-neutral-300); border-radius: 8px; padding: var(--spacing-8);">
                <div style="font-weight: 600; margin-bottom: 4px;">Spacious (32px)</div>
                <div style="font-size: 14px; color: var(--color-neutral-600);">padding: var(--spacing-8)</div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Gap Spacing</h3>
            <div style="background: var(--color-neutral-50); padding: 20px; border-radius: 8px;">
              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; margin-bottom: 8px;">Small Gap (8px)</div>
                <div style="display: flex; gap: var(--spacing-2);">
                  <div style="background: var(--color-primary-500); padding: 12px; border-radius: 4px; color: white; font-size: 12px;">Item 1</div>
                  <div style="background: var(--color-primary-500); padding: 12px; border-radius: 4px; color: white; font-size: 12px;">Item 2</div>
                  <div style="background: var(--color-primary-500); padding: 12px; border-radius: 4px; color: white; font-size: 12px;">Item 3</div>
                </div>
              </div>

              <div style="margin-bottom: 16px;">
                <div style="font-weight: 600; margin-bottom: 8px;">Medium Gap (16px)</div>
                <div style="display: flex; gap: var(--spacing-4);">
                  <div style="background: var(--color-secondary-500); padding: 12px; border-radius: 4px; color: white; font-size: 12px;">Item 1</div>
                  <div style="background: var(--color-secondary-500); padding: 12px; border-radius: 4px; color: white; font-size: 12px;">Item 2</div>
                  <div style="background: var(--color-secondary-500); padding: 12px; border-radius: 4px; color: white; font-size: 12px;">Item 3</div>
                </div>
              </div>

              <div>
                <div style="font-weight: 600; margin-bottom: 8px;">Large Gap (24px)</div>
                <div style="display: flex; gap: var(--spacing-6);">
                  <div style="background: var(--color-info-500); padding: 12px; border-radius: 4px; color: white; font-size: 12px;">Item 1</div>
                  <div style="background: var(--color-info-500); padding: 12px; border-radius: 4px; color: white; font-size: 12px;">Item 2</div>
                  <div style="background: var(--color-info-500); padding: 12px; border-radius: 4px; color: white; font-size: 12px;">Item 3</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Margin Spacing</h3>
            <div style="background: var(--color-neutral-50); padding: 20px; border-radius: 8px;">
              <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: var(--spacing-2);">
                <div style="font-weight: 600;">Section 1</div>
                <div style="font-size: 14px; color: var(--color-neutral-600);">margin-bottom: var(--spacing-2) / 8px</div>
              </div>
              <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: var(--spacing-4);">
                <div style="font-weight: 600;">Section 2</div>
                <div style="font-size: 14px; color: var(--color-neutral-600);">margin-bottom: var(--spacing-4) / 16px</div>
              </div>
              <div style="background: white; padding: 16px; border-radius: 8px;">
                <div style="font-weight: 600;">Section 3</div>
                <div style="font-size: 14px; color: var(--color-neutral-600);">No margin</div>
              </div>
            </div>
          </div>
        </div>

        <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px; margin-top: 32px;">
          <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-neutral-800);">Code Example</h3>
          <pre style="background: white; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; line-height: 1.6; margin: 0; overflow-x: auto;"><code>/* CSS */
.card {
  padding: var(--spacing-6); /* 24px */
  margin-bottom: var(--spacing-4); /* 16px */
}

.grid {
  display: grid;
  gap: var(--spacing-4); /* 16px */
}

.button {
  padding: var(--spacing-3) var(--spacing-6); /* 12px 24px */
}</code></pre>
        </div>
      </div>
    `,
  }),
};
