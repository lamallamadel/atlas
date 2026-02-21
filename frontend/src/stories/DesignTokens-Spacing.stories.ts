import { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Design Tokens/Spacing',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Consistent spacing scale based on a 4px grid system for layout and component spacing.',
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
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Spacing Scale</h2>
        
        <p style="margin-bottom: 32px; color: var(--color-neutral-600); line-height: 1.6; max-width: 800px;">
          Our spacing system uses a 4px base grid to ensure consistent spacing throughout the application. 
          All spacing values are multiples of 4px, creating a harmonious and predictable layout system.
        </p>

        <div style="display: grid; gap: 16px;">
          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px; border-bottom: 1px solid var(--color-neutral-200);">
            <div style="font-weight: 600; color: var(--color-neutral-800);">Token</div>
            <div style="font-weight: 600; color: var(--color-neutral-800);">Value</div>
            <div style="font-weight: 600; color: var(--color-neutral-800);">Visual</div>
            <div style="font-weight: 600; color: var(--color-neutral-800);">Use Case</div>
          </div>

          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px;">
            <code style="font-size: 13px; color: var(--color-primary-600);">--spacing-0</code>
            <span style="font-size: 13px; color: var(--color-neutral-700);">0</span>
            <div style="height: 4px; background: var(--color-primary-200); border-radius: 2px; width: 0;"></div>
            <span style="font-size: 12px; color: var(--color-neutral-600);">No spacing</span>
          </div>

          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <code style="font-size: 13px; color: var(--color-primary-600);">--spacing-1</code>
            <span style="font-size: 13px; color: var(--color-neutral-700);">4px</span>
            <div style="height: 4px; background: var(--color-primary-500); border-radius: 2px; width: 4px;"></div>
            <span style="font-size: 12px; color: var(--color-neutral-600);">Tiny gaps</span>
          </div>

          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px;">
            <code style="font-size: 13px; color: var(--color-primary-600);">--spacing-2</code>
            <span style="font-size: 13px; color: var(--color-neutral-700);">8px</span>
            <div style="height: 4px; background: var(--color-primary-500); border-radius: 2px; width: 8px;"></div>
            <span style="font-size: 12px; color: var(--color-neutral-600);">Icons, chips</span>
          </div>

          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <code style="font-size: 13px; color: var(--color-primary-600);">--spacing-3</code>
            <span style="font-size: 13px; color: var(--color-neutral-700);">12px</span>
            <div style="height: 4px; background: var(--color-primary-500); border-radius: 2px; width: 12px;"></div>
            <span style="font-size: 12px; color: var(--color-neutral-600);">Small gaps</span>
          </div>

          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px;">
            <code style="font-size: 13px; color: var(--color-primary-600);">--spacing-4</code>
            <span style="font-size: 13px; color: var(--color-neutral-700);">16px</span>
            <div style="height: 4px; background: var(--color-primary-500); border-radius: 2px; width: 16px;"></div>
            <span style="font-size: 12px; color: var(--color-neutral-600);">Default</span>
          </div>

          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <code style="font-size: 13px; color: var(--color-primary-600);">--spacing-5</code>
            <span style="font-size: 13px; color: var(--color-neutral-700);">20px</span>
            <div style="height: 4px; background: var(--color-primary-500); border-radius: 2px; width: 20px;"></div>
            <span style="font-size: 12px; color: var(--color-neutral-600);">Compact</span>
          </div>

          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px;">
            <code style="font-size: 13px; color: var(--color-primary-600);">--spacing-6</code>
            <span style="font-size: 13px; color: var(--color-neutral-700);">24px</span>
            <div style="height: 4px; background: var(--color-primary-500); border-radius: 2px; width: 24px;"></div>
            <span style="font-size: 12px; color: var(--color-neutral-600);">Comfortable</span>
          </div>

          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <code style="font-size: 13px; color: var(--color-primary-600);">--spacing-8</code>
            <span style="font-size: 13px; color: var(--color-neutral-700);">32px</span>
            <div style="height: 4px; background: var(--color-primary-500); border-radius: 2px; width: 32px;"></div>
            <span style="font-size: 12px; color: var(--color-neutral-600);">Sections</span>
          </div>

          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px;">
            <code style="font-size: 13px; color: var(--color-primary-600);">--spacing-10</code>
            <span style="font-size: 13px; color: var(--color-neutral-700);">40px</span>
            <div style="height: 4px; background: var(--color-primary-500); border-radius: 2px; width: 40px;"></div>
            <span style="font-size: 12px; color: var(--color-neutral-600);">Large gaps</span>
          </div>

          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px; background: var(--color-neutral-50); border-radius: 8px;">
            <code style="font-size: 13px; color: var(--color-primary-600);">--spacing-12</code>
            <span style="font-size: 13px; color: var(--color-neutral-700);">48px</span>
            <div style="height: 4px; background: var(--color-primary-500); border-radius: 2px; width: 48px;"></div>
            <span style="font-size: 12px; color: var(--color-neutral-600);">Page spacing</span>
          </div>

          <div style="display: grid; grid-template-columns: 120px 80px 1fr 100px; align-items: center; padding: 12px;">
            <code style="font-size: 13px; color: var(--color-primary-600);">--spacing-16</code>
            <span style="font-size: 13px; color: var(--color-neutral-700);">64px</span>
            <div style="height: 4px; background: var(--color-primary-500); border-radius: 2px; width: 64px;"></div>
            <span style="font-size: 12px; color: var(--color-neutral-600);">Hero sections</span>
          </div>
        </div>

        <div style="margin-top: 48px; background: var(--color-neutral-50); padding: 24px; border-radius: 12px; border: 1px solid var(--color-neutral-200);">
          <h3 style="margin-top: 0; color: var(--color-neutral-800);">Usage in Code</h3>
          <pre style="background: white; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6; margin: 0;"><code>/* CSS - Using spacing tokens */
.card {
  padding: var(--spacing-6);  /* 24px */
  margin-bottom: var(--spacing-8);  /* 32px */
  gap: var(--spacing-4);  /* 16px */
}

.button {
  padding: var(--spacing-3) var(--spacing-6);  /* 12px 24px */
}

/* Grid/Flexbox */
.grid {
  display: grid;
  gap: var(--spacing-4);
  padding: var(--spacing-8) var(--spacing-6);
}</code></pre>
        </div>

        <div style="margin-top: 32px; background: var(--color-info-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-info-500);">
          <h3 style="margin-top: 0; color: var(--color-info-700);">Best Practices</h3>
          <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
            <li>Always use spacing tokens instead of arbitrary pixel values</li>
            <li>Use smaller spacing (1-3) for component internals</li>
            <li>Use medium spacing (4-6) for component spacing</li>
            <li>Use larger spacing (8-12) for section spacing</li>
            <li>Maintain consistent spacing ratios for visual hierarchy</li>
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
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Card Spacing</h3>
            <div style="background: white; padding: var(--spacing-6); border-radius: var(--radius-xl); box-shadow: var(--shadow-2); max-width: 400px;">
              <h4 style="margin: 0 0 var(--spacing-4) 0; color: var(--color-neutral-900);">Card Title</h4>
              <p style="margin: 0 0 var(--spacing-4) 0; color: var(--color-neutral-600); line-height: 1.6;">
                This card uses spacing-6 (24px) for internal padding and spacing-4 (16px) for element gaps.
              </p>
              <div style="display: flex; gap: var(--spacing-3);">
                <button style="padding: var(--spacing-2) var(--spacing-4); background: var(--color-primary-500); color: white; border: none; border-radius: var(--radius-lg); cursor: pointer;">
                  Action
                </button>
                <button style="padding: var(--spacing-2) var(--spacing-4); background: transparent; color: var(--color-primary-500); border: 1px solid var(--color-primary-500); border-radius: var(--radius-lg); cursor: pointer;">
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">List Spacing</h3>
            <div style="background: white; padding: var(--spacing-4); border-radius: var(--radius-xl); box-shadow: var(--shadow-2); max-width: 400px;">
              <div style="padding: var(--spacing-3); border-bottom: 1px solid var(--color-neutral-200);">List Item 1</div>
              <div style="padding: var(--spacing-3); border-bottom: 1px solid var(--color-neutral-200);">List Item 2</div>
              <div style="padding: var(--spacing-3); border-bottom: 1px solid var(--color-neutral-200);">List Item 3</div>
              <div style="padding: var(--spacing-3);">List Item 4</div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Form Spacing</h3>
            <div style="background: white; padding: var(--spacing-8); border-radius: var(--radius-xl); box-shadow: var(--shadow-2); max-width: 400px;">
              <div style="margin-bottom: var(--spacing-6);">
                <label style="display: block; margin-bottom: var(--spacing-2); color: var(--color-neutral-700); font-weight: 500;">Label</label>
                <input type="text" placeholder="Input field" style="width: 100%; padding: var(--spacing-3); border: 1px solid var(--color-neutral-300); border-radius: var(--radius-lg);" />
              </div>
              <div style="margin-bottom: var(--spacing-6);">
                <label style="display: block; margin-bottom: var(--spacing-2); color: var(--color-neutral-700); font-weight: 500;">Label</label>
                <input type="text" placeholder="Input field" style="width: 100%; padding: var(--spacing-3); border: 1px solid var(--color-neutral-300); border-radius: var(--radius-lg);" />
              </div>
              <button style="width: 100%; padding: var(--spacing-3); background: var(--color-primary-500); color: white; border: none; border-radius: var(--radius-lg); cursor: pointer; font-weight: 500;">
                Submit
              </button>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Grid Spacing</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-4); max-width: 600px;">
              <div style="background: var(--color-primary-100); padding: var(--spacing-6); border-radius: var(--radius-lg); text-align: center;">Item 1</div>
              <div style="background: var(--color-primary-100); padding: var(--spacing-6); border-radius: var(--radius-lg); text-align: center;">Item 2</div>
              <div style="background: var(--color-primary-100); padding: var(--spacing-6); border-radius: var(--radius-lg); text-align: center;">Item 3</div>
              <div style="background: var(--color-primary-100); padding: var(--spacing-6); border-radius: var(--radius-lg); text-align: center;">Item 4</div>
              <div style="background: var(--color-primary-100); padding: var(--spacing-6); border-radius: var(--radius-lg); text-align: center;">Item 5</div>
              <div style="background: var(--color-primary-100); padding: var(--spacing-6); border-radius: var(--radius-lg); text-align: center;">Item 6</div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
