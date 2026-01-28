import { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Design Tokens/Shadows',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Material Design inspired shadow system with 6 elevation levels for creating depth and hierarchy.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ShadowLevels: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Shadow Elevations</h2>
        
        <p style="margin-bottom: 32px; color: var(--color-neutral-600); line-height: 1.6; max-width: 800px;">
          Our shadow system uses Material Design elevation principles to create visual hierarchy and depth. 
          Higher elevations indicate elements that are closer to the user or more important.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; margin-bottom: 48px;">
          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-0); margin-bottom: 16px;">
              <div style="font-size: 24px; color: var(--color-neutral-400);">0</div>
            </div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--shadow-0</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">No elevation</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Flat surfaces</div>
          </div>

          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-1); margin-bottom: 16px;">
              <div style="font-size: 24px; color: var(--color-neutral-700);">1</div>
            </div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--shadow-1</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">Subtle elevation</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Cards, lists</div>
          </div>

          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-2); margin-bottom: 16px;">
              <div style="font-size: 24px; color: var(--color-neutral-800);">2</div>
            </div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--shadow-2</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">Low elevation</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Raised cards</div>
          </div>

          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-3); margin-bottom: 16px;">
              <div style="font-size: 24px; color: var(--color-neutral-900);">3</div>
            </div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--shadow-3</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">Medium elevation</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Dropdowns, menus</div>
          </div>

          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-4); margin-bottom: 16px;">
              <div style="font-size: 24px; font-weight: 600; color: var(--color-neutral-900);">4</div>
            </div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--shadow-4</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">High elevation</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Dialogs, popovers</div>
          </div>

          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-5); margin-bottom: 16px;">
              <div style="font-size: 24px; font-weight: 700; color: var(--color-neutral-900);">5</div>
            </div>
            <code style="font-size: 13px; color: var(--color-primary-600); display: block; margin-bottom: 8px;">--shadow-5</code>
            <div style="font-size: 12px; color: var(--color-neutral-600);">Maximum elevation</div>
            <div style="font-size: 12px; color: var(--color-neutral-500); margin-top: 4px;">Modals, drawers</div>
          </div>
        </div>

        <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Shadow Aliases</h3>
        <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px; margin-bottom: 32px;">
          <div style="display: grid; gap: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px;">
              <code style="color: var(--color-primary-600);">--shadow-sm</code>
              <span style="color: var(--color-neutral-600);">→</span>
              <code style="color: var(--color-neutral-700);">--shadow-1</code>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px;">
              <code style="color: var(--color-primary-600);">--shadow-md</code>
              <span style="color: var(--color-neutral-600);">→</span>
              <code style="color: var(--color-neutral-700);">--shadow-2</code>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px;">
              <code style="color: var(--color-primary-600);">--shadow-lg</code>
              <span style="color: var(--color-neutral-600);">→</span>
              <code style="color: var(--color-neutral-700);">--shadow-3</code>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px;">
              <code style="color: var(--color-primary-600);">--shadow-xl</code>
              <span style="color: var(--color-neutral-600);">→</span>
              <code style="color: var(--color-neutral-700);">--shadow-4</code>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px;">
              <code style="color: var(--color-primary-600);">--shadow-2xl</code>
              <span style="color: var(--color-neutral-600);">→</span>
              <code style="color: var(--color-neutral-700);">--shadow-5</code>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px;">
              <code style="color: var(--color-primary-600);">--shadow-inner</code>
              <span style="color: var(--color-neutral-600);">→</span>
              <code style="color: var(--color-neutral-700);">inset shadow</code>
            </div>
          </div>
        </div>

        <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px; border: 1px solid var(--color-neutral-200);">
          <h3 style="margin-top: 0; color: var(--color-neutral-800);">Usage in Code</h3>
          <pre style="background: white; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6; margin: 0;"><code>/* CSS - Using shadow tokens */
.card {
  box-shadow: var(--shadow-2);
}

.dropdown-menu {
  box-shadow: var(--shadow-3);
}

.modal {
  box-shadow: var(--shadow-5);
}

/* Hover effects */
.card:hover {
  box-shadow: var(--shadow-3);
  transition: box-shadow 0.3s ease;
}</code></pre>
        </div>
      </div>
    `,
  }),
};

export const ShadowExamples: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Shadow Examples</h2>

        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Card with Shadow</h3>
            <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: var(--shadow-2); max-width: 400px; transition: box-shadow 0.3s ease; cursor: pointer;" onmouseover="this.style.boxShadow='var(--shadow-3)'" onmouseout="this.style.boxShadow='var(--shadow-2)'">
              <h4 style="margin: 0 0 12px 0; color: var(--color-neutral-900);">Interactive Card</h4>
              <p style="margin: 0; color: var(--color-neutral-600); line-height: 1.6;">
                This card uses shadow-2 and elevates to shadow-3 on hover, creating a subtle interaction feedback.
              </p>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Floating Action Button</h3>
            <button style="width: 56px; height: 56px; border-radius: 50%; background: var(--color-primary-500); color: white; border: none; box-shadow: var(--shadow-4); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='var(--shadow-5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-4)'">
              +
            </button>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Dropdown Menu</h3>
            <div style="background: white; border-radius: 8px; box-shadow: var(--shadow-3); max-width: 240px; overflow: hidden;">
              <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-neutral-200); cursor: pointer;" onmouseover="this.style.background='var(--color-neutral-50)'" onmouseout="this.style.background='white'">Menu Item 1</div>
              <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-neutral-200); cursor: pointer;" onmouseover="this.style.background='var(--color-neutral-50)'" onmouseout="this.style.background='white'">Menu Item 2</div>
              <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-neutral-200); cursor: pointer;" onmouseover="this.style.background='var(--color-neutral-50)'" onmouseout="this.style.background='white'">Menu Item 3</div>
              <div style="padding: 12px 16px; cursor: pointer;" onmouseover="this.style.background='var(--color-neutral-50)'" onmouseout="this.style.background='white'">Menu Item 4</div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Input with Inner Shadow</h3>
            <input type="text" placeholder="Type something..." style="width: 100%; max-width: 400px; padding: 12px 16px; border: 1px solid var(--color-neutral-300); border-radius: 8px; box-shadow: var(--shadow-inner); font-size: 14px;" />
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Layered Shadows</h3>
            <div style="position: relative; height: 300px; max-width: 600px;">
              <div style="position: absolute; top: 0; left: 0; background: white; padding: 32px; border-radius: 12px; box-shadow: var(--shadow-1); width: 300px;">
                <div style="font-weight: 600; margin-bottom: 8px;">Layer 1 (shadow-1)</div>
                <div style="color: var(--color-neutral-600);">Base layer with subtle elevation</div>
              </div>
              <div style="position: absolute; top: 60px; left: 40px; background: white; padding: 32px; border-radius: 12px; box-shadow: var(--shadow-3); width: 300px;">
                <div style="font-weight: 600; margin-bottom: 8px;">Layer 2 (shadow-3)</div>
                <div style="color: var(--color-neutral-600);">Middle layer with medium elevation</div>
              </div>
              <div style="position: absolute; top: 120px; left: 80px; background: white; padding: 32px; border-radius: 12px; box-shadow: var(--shadow-5); width: 300px;">
                <div style="font-weight: 600; margin-bottom: 8px;">Layer 3 (shadow-5)</div>
                <div style="color: var(--color-neutral-600);">Top layer with maximum elevation</div>
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
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Shadow Best Practices</h2>

        <div style="display: grid; gap: 24px;">
          <div style="background: var(--color-success-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; color: var(--color-success-700);">✓ Do</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Use shadows to indicate elevation and hierarchy</li>
              <li>Increase shadow on hover for interactive elements</li>
              <li>Use consistent shadow levels across similar components</li>
              <li>Keep shadows subtle for most UI elements (shadow-1 to shadow-3)</li>
              <li>Reserve higher shadows (shadow-4, shadow-5) for modals and overlays</li>
              <li>Combine shadows with transitions for smooth interactions</li>
            </ul>
          </div>

          <div style="background: var(--color-error-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; color: var(--color-error-700);">✗ Don't</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Don't use too many different shadow levels on one page</li>
              <li>Don't apply heavy shadows to small elements</li>
              <li>Don't use shadows for decorative purposes only</li>
              <li>Don't forget to consider dark mode shadow adjustments</li>
              <li>Don't stack multiple box-shadows unless necessary</li>
              <li>Don't use shadows that impair readability</li>
            </ul>
          </div>

          <div style="background: var(--color-info-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-info-500);">
            <h3 style="margin-top: 0; color: var(--color-info-700);">Usage Guidelines</h3>
            <div style="display: grid; gap: 16px; color: var(--color-neutral-700);">
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Cards and Lists</div>
                <div style="font-size: 14px;">Use shadow-1 or shadow-2 for subtle elevation</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Dropdowns and Menus</div>
                <div style="font-size: 14px;">Use shadow-3 for medium elevation</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Popovers and Tooltips</div>
                <div style="font-size: 14px;">Use shadow-3 or shadow-4 for prominence</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Dialogs and Modals</div>
                <div style="font-size: 14px;">Use shadow-4 or shadow-5 for maximum elevation</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Floating Action Buttons</div>
                <div style="font-size: 14px;">Use shadow-4 to indicate interactive floating element</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
