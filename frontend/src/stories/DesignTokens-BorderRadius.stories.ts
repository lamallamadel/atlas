import { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Design Tokens/Border Radius',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Border radius tokens for creating consistent rounded corners across the application.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const RadiusScale: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Border Radius Scale</h2>
        
        <p style="margin-bottom: 32px; color: var(--color-neutral-600); line-height: 1.6; max-width: 800px;">
          Consistent border radius values for creating visual hierarchy and softness in the UI.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 24px; margin-bottom: 48px;">
          <div style="text-align: center;">
            <div style="background: var(--color-primary-500); height: 120px; width: 120px; margin: 0 auto 16px; border-radius: var(--radius-none);"></div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--radius-none</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">0px</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">No rounding</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-500); height: 120px; width: 120px; margin: 0 auto 16px; border-radius: var(--radius-sm);"></div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--radius-sm</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">2px</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Subtle rounding</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-500); height: 120px; width: 120px; margin: 0 auto 16px; border-radius: var(--radius-base);"></div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--radius-base</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">4px</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Default buttons</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-500); height: 120px; width: 120px; margin: 0 auto 16px; border-radius: var(--radius-md);"></div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--radius-md</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">6px</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Badges, chips</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-500); height: 120px; width: 120px; margin: 0 auto 16px; border-radius: var(--radius-lg);"></div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--radius-lg</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">8px</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Inputs, cards</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-500); height: 120px; width: 120px; margin: 0 auto 16px; border-radius: var(--radius-xl);"></div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--radius-xl</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">12px</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Modals, cards</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-500); height: 120px; width: 120px; margin: 0 auto 16px; border-radius: var(--radius-2xl);"></div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--radius-2xl</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">16px</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Large cards</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-500); height: 120px; width: 120px; margin: 0 auto 16px; border-radius: var(--radius-3xl);"></div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--radius-3xl</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">24px</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Hero sections</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-500); height: 120px; width: 120px; margin: 0 auto 16px; border-radius: var(--radius-full);"></div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--radius-full</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">9999px</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Pills, avatars</div>
          </div>
        </div>

        <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px; border: 1px solid var(--color-neutral-200);">
          <h3 style="margin-top: 0; color: var(--color-neutral-800);">Usage in Code</h3>
          <pre style="background: white; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6; margin: 0;"><code>/* CSS - Using border radius tokens */
.button {
  border-radius: var(--radius-lg);  /* 8px */
}

.card {
  border-radius: var(--radius-xl);  /* 12px */
}

.badge {
  border-radius: var(--radius-full);  /* Fully rounded */
}

.avatar {
  border-radius: var(--radius-full);
}</code></pre>
        </div>
      </div>
    `,
  }),
};

export const RadiusExamples: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Border Radius Examples</h2>

        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Buttons</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <button style="padding: 10px 20px; background: var(--color-primary-500); color: white; border: none; border-radius: var(--radius-base); cursor: pointer; font-size: 14px; font-weight: 500;">
                radius-base (4px)
              </button>
              <button style="padding: 10px 20px; background: var(--color-primary-500); color: white; border: none; border-radius: var(--radius-lg); cursor: pointer; font-size: 14px; font-weight: 500;">
                radius-lg (8px)
              </button>
              <button style="padding: 10px 20px; background: var(--color-primary-500); color: white; border: none; border-radius: var(--radius-full); cursor: pointer; font-size: 14px; font-weight: 500;">
                radius-full (pill)
              </button>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Cards</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
              <div style="background: white; padding: 20px; box-shadow: var(--shadow-2); border-radius: var(--radius-lg);">
                <div style="font-weight: 600; margin-bottom: 8px;">radius-lg (8px)</div>
                <div style="color: var(--color-neutral-600); font-size: 14px;">Standard card</div>
              </div>
              <div style="background: white; padding: 20px; box-shadow: var(--shadow-2); border-radius: var(--radius-xl);">
                <div style="font-weight: 600; margin-bottom: 8px;">radius-xl (12px)</div>
                <div style="color: var(--color-neutral-600); font-size: 14px;">Emphasized card</div>
              </div>
              <div style="background: white; padding: 20px; box-shadow: var(--shadow-2); border-radius: var(--radius-2xl);">
                <div style="font-weight: 600; margin-bottom: 8px;">radius-2xl (16px)</div>
                <div style="color: var(--color-neutral-600); font-size: 14px;">Hero card</div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Form Inputs</h3>
            <div style="display: grid; gap: 12px; max-width: 400px;">
              <input type="text" placeholder="radius-base (4px)" style="padding: 10px 12px; border: 1px solid var(--color-neutral-300); border-radius: var(--radius-base); font-size: 14px; width: 100%;" />
              <input type="text" placeholder="radius-md (6px)" style="padding: 10px 12px; border: 1px solid var(--color-neutral-300); border-radius: var(--radius-md); font-size: 14px; width: 100%;" />
              <input type="text" placeholder="radius-lg (8px)" style="padding: 10px 12px; border: 1px solid var(--color-neutral-300); border-radius: var(--radius-lg); font-size: 14px; width: 100%;" />
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Badges & Chips</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <span style="padding: 4px 12px; background: var(--color-success-100); color: var(--color-success-700); border-radius: var(--radius-base); font-size: 13px; font-weight: 500;">
                radius-base
              </span>
              <span style="padding: 4px 12px; background: var(--color-info-100); color: var(--color-info-700); border-radius: var(--radius-md); font-size: 13px; font-weight: 500;">
                radius-md
              </span>
              <span style="padding: 4px 12px; background: var(--color-warning-100); color: var(--color-warning-700); border-radius: var(--radius-lg); font-size: 13px; font-weight: 500;">
                radius-lg
              </span>
              <span style="padding: 4px 12px; background: var(--color-error-100); color: var(--color-error-700); border-radius: var(--radius-full); font-size: 13px; font-weight: 500;">
                radius-full
              </span>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Avatars</h3>
            <div style="display: flex; gap: 16px; align-items: center;">
              <div style="width: 48px; height: 48px; background: var(--color-primary-300); border-radius: var(--radius-none); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                A
              </div>
              <div style="width: 48px; height: 48px; background: var(--color-secondary-400); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                B
              </div>
              <div style="width: 48px; height: 48px; background: var(--color-info-400); border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                C
              </div>
              <div style="width: 48px; height: 48px; background: var(--color-success-400); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                D
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
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Border Radius Best Practices</h2>

        <div style="display: grid; gap: 24px;">
          <div style="background: var(--color-success-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; color: var(--color-success-700);">✓ Do</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Use consistent border radius across similar components</li>
              <li>Use larger radius for larger components</li>
              <li>Use radius-full for pills, badges, and circular elements</li>
              <li>Match border radius to component size and purpose</li>
              <li>Use subtle radius (4-8px) for most UI elements</li>
            </ul>
          </div>

          <div style="background: var(--color-error-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; color: var(--color-error-700);">✗ Don't</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Don't use too many different radius values on one page</li>
              <li>Don't mix sharp and rounded styles inconsistently</li>
              <li>Don't use very large radius on small elements</li>
              <li>Don't forget to round child elements appropriately</li>
              <li>Don't use arbitrary radius values</li>
            </ul>
          </div>

          <div style="background: var(--color-info-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-info-500);">
            <h3 style="margin-top: 0; color: var(--color-info-700);">Usage Guidelines</h3>
            <div style="display: grid; gap: 16px; color: var(--color-neutral-700);">
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Buttons & Inputs</div>
                <div style="font-size: 14px;">radius-base (4px) or radius-lg (8px)</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Cards & Panels</div>
                <div style="font-size: 14px;">radius-lg (8px) to radius-xl (12px)</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Badges & Tags</div>
                <div style="font-size: 14px;">radius-md (6px) or radius-full (pill)</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Modals & Dialogs</div>
                <div style="font-size: 14px;">radius-xl (12px) or radius-2xl (16px)</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Avatars</div>
                <div style="font-size: 14px;">radius-full (circular) or radius-lg (rounded square)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
