import { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Design Tokens/Shadows',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: '5-level elevation system for depth and visual hierarchy using soft shadows.',
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
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Shadow Elevation Levels</h2>
        
        <p style="margin-bottom: 32px; color: var(--color-neutral-600); line-height: 1.6;">
          Use shadows to create depth and hierarchy. Higher elevations indicate greater importance or interactivity.
        </p>

        <div style="display: grid; gap: 32px; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));">
          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-0);">
              <div style="font-weight: 600; color: var(--color-neutral-900);">Level 0</div>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 8px;">None</div>
            </div>
            <div style="margin-top: 12px; font-size: 12px; color: var(--color-neutral-600);">
              <code>--shadow-0</code>
            </div>
            <div style="margin-top: 4px; font-size: 11px; color: var(--color-neutral-500);">
              Flat elements
            </div>
          </div>

          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-1);">
              <div style="font-weight: 600; color: var(--color-neutral-900);">Level 1</div>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 8px;">Subtle</div>
            </div>
            <div style="margin-top: 12px; font-size: 12px; color: var(--color-neutral-600);">
              <code>--shadow-1</code>
            </div>
            <div style="margin-top: 4px; font-size: 11px; color: var(--color-neutral-500);">
              Slightly raised surfaces
            </div>
          </div>

          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-2);">
              <div style="font-weight: 600; color: var(--color-neutral-900);">Level 2</div>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 8px;">Default</div>
            </div>
            <div style="margin-top: 12px; font-size: 12px; color: var(--color-neutral-600);">
              <code>--shadow-2</code>
            </div>
            <div style="margin-top: 4px; font-size: 11px; color: var(--color-neutral-500);">
              Cards, panels ⭐
            </div>
          </div>

          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-3);">
              <div style="font-weight: 600; color: var(--color-neutral-900);">Level 3</div>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 8px;">Raised</div>
            </div>
            <div style="margin-top: 12px; font-size: 12px; color: var(--color-neutral-600);">
              <code>--shadow-3</code>
            </div>
            <div style="margin-top: 4px; font-size: 11px; color: var(--color-neutral-500);">
              Dropdowns, popovers
            </div>
          </div>

          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-4);">
              <div style="font-weight: 600; color: var(--color-neutral-900);">Level 4</div>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 8px;">Floating</div>
            </div>
            <div style="margin-top: 12px; font-size: 12px; color: var(--color-neutral-600);">
              <code>--shadow-4</code>
            </div>
            <div style="margin-top: 4px; font-size: 11px; color: var(--color-neutral-500);">
              Modals, dialogs
            </div>
          </div>

          <div style="text-align: center;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-5);">
              <div style="font-weight: 600; color: var(--color-neutral-900);">Level 5</div>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 8px;">Maximum</div>
            </div>
            <div style="margin-top: 12px; font-size: 12px; color: var(--color-neutral-600);">
              <code>--shadow-5</code>
            </div>
            <div style="margin-top: 4px; font-size: 11px; color: var(--color-neutral-500);">
              Overlays, sticky elements
            </div>
          </div>
        </div>

        <div style="margin-top: 48px;">
          <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Inner Shadow</h3>
          <div style="text-align: center; max-width: 300px;">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: var(--shadow-inner); border: 1px solid var(--color-neutral-200);">
              <div style="font-weight: 600; color: var(--color-neutral-900);">Inner Shadow</div>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 8px;">Inset depth</div>
            </div>
            <div style="margin-top: 12px; font-size: 12px; color: var(--color-neutral-600);">
              <code>--shadow-inner</code>
            </div>
            <div style="margin-top: 4px; font-size: 11px; color: var(--color-neutral-500);">
              Pressed states, wells
            </div>
          </div>
        </div>

        <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px; margin-top: 48px;">
          <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-neutral-800);">Shadow Definitions</h3>
          <pre style="background: white; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12px; line-height: 1.8; margin: 0; overflow-x: auto;"><code>--shadow-0: none;

--shadow-1: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
            0 1px 2px -1px rgba(0, 0, 0, 0.1);

--shadow-2: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -2px rgba(0, 0, 0, 0.1);

--shadow-3: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -4px rgba(0, 0, 0, 0.1);

--shadow-4: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 8px 10px -6px rgba(0, 0, 0, 0.1);

--shadow-5: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);</code></pre>
        </div>
      </div>
    `,
  }),
};

export const InteractiveShadows: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Interactive Shadow Transitions</h2>
        
        <p style="margin-bottom: 32px; color: var(--color-neutral-600); line-height: 1.6;">
          Hover over cards to see smooth elevation transitions. Useful for interactive elements.
        </p>

        <div style="display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
          <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: var(--shadow-1); transition: all 0.3s ease; cursor: pointer;"
               onmouseover="this.style.boxShadow='var(--shadow-3)'; this.style.transform='translateY(-4px)';"
               onmouseout="this.style.boxShadow='var(--shadow-1)'; this.style.transform='translateY(0)';">
            <h4 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">Level 1 → 3</h4>
            <p style="font-size: 14px; color: var(--color-neutral-600); margin: 0;">
              Subtle elevation increase on hover
            </p>
            <code style="display: block; margin-top: 12px; font-size: 11px; color: var(--color-neutral-500);">
              shadow-1 → shadow-3
            </code>
          </div>

          <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: var(--shadow-2); transition: all 0.3s ease; cursor: pointer;"
               onmouseover="this.style.boxShadow='var(--shadow-4)'; this.style.transform='translateY(-6px)';"
               onmouseout="this.style.boxShadow='var(--shadow-2)'; this.style.transform='translateY(0)';">
            <h4 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">Level 2 → 4</h4>
            <p style="font-size: 14px; color: var(--color-neutral-600); margin: 0;">
              Default card hover effect
            </p>
            <code style="display: block; margin-top: 12px; font-size: 11px; color: var(--color-neutral-500);">
              shadow-2 → shadow-4
            </code>
          </div>

          <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: var(--shadow-3); transition: all 0.3s ease; cursor: pointer;"
               onmouseover="this.style.boxShadow='var(--shadow-5)'; this.style.transform='translateY(-8px)';"
               onmouseout="this.style.boxShadow='var(--shadow-3)'; this.style.transform='translateY(0)';">
            <h4 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">Level 3 → 5</h4>
            <p style="font-size: 14px; color: var(--color-neutral-600); margin: 0;">
              Dramatic elevation for emphasis
            </p>
            <code style="display: block; margin-top: 12px; font-size: 11px; color: var(--color-neutral-500);">
              shadow-3 → shadow-5
            </code>
          </div>
        </div>

        <div style="background: var(--color-info-50); padding: 24px; border-radius: 12px; margin-top: 32px; border-left: 4px solid var(--color-info-500);">
          <h3 style="margin-top: 0; color: var(--color-info-700);">Best Practices</h3>
          <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
            <li>Use <code>shadow-2</code> for default card elevation</li>
            <li>Increase by 2 levels on hover (shadow-2 → shadow-4)</li>
            <li>Combine with <code>translateY(-2px)</code> for lift effect</li>
            <li>Use <code>transition: all 0.3s ease</code> for smooth animations</li>
            <li>Reserve <code>shadow-5</code> for modals and critical overlays</li>
          </ul>
        </div>

        <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px; margin-top: 24px;">
          <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-neutral-800);">Code Example</h3>
          <pre style="background: white; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; line-height: 1.6; margin: 0; overflow-x: auto;"><code>/* CSS */
.card {
  box-shadow: var(--shadow-2);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.card:hover {
  box-shadow: var(--shadow-4);
  transform: translateY(-2px);
}

.modal {
  box-shadow: var(--shadow-5);
}

.pressed {
  box-shadow: var(--shadow-inner);
}</code></pre>
        </div>
      </div>
    `,
  }),
};

export const BorderRadius: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Border Radius</h2>
        
        <p style="margin-bottom: 32px; color: var(--color-neutral-600); line-height: 1.6;">
          Consistent corner rounding for a cohesive visual language.
        </p>

        <div style="display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));">
          <div style="text-align: center;">
            <div style="background: var(--color-primary-100); width: 120px; height: 120px; margin: 0 auto 12px; border-radius: var(--radius-none);"></div>
            <div style="font-weight: 600; font-size: 14px; color: var(--color-neutral-900);">None</div>
            <code style="font-size: 11px; color: var(--color-neutral-600);">--radius-none</code>
            <div style="font-size: 11px; color: var(--color-neutral-500); margin-top: 4px;">0</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-100); width: 120px; height: 120px; margin: 0 auto 12px; border-radius: var(--radius-sm);"></div>
            <div style="font-weight: 600; font-size: 14px; color: var(--color-neutral-900);">Small</div>
            <code style="font-size: 11px; color: var(--color-neutral-600);">--radius-sm</code>
            <div style="font-size: 11px; color: var(--color-neutral-500); margin-top: 4px;">2px</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-100); width: 120px; height: 120px; margin: 0 auto 12px; border-radius: var(--radius-base);"></div>
            <div style="font-weight: 600; font-size: 14px; color: var(--color-neutral-900);">Base</div>
            <code style="font-size: 11px; color: var(--color-neutral-600);">--radius-base</code>
            <div style="font-size: 11px; color: var(--color-neutral-500); margin-top: 4px;">4px</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-100); width: 120px; height: 120px; margin: 0 auto 12px; border-radius: var(--radius-md);"></div>
            <div style="font-weight: 600; font-size: 14px; color: var(--color-neutral-900);">Medium</div>
            <code style="font-size: 11px; color: var(--color-neutral-600);">--radius-md</code>
            <div style="font-size: 11px; color: var(--color-neutral-500); margin-top: 4px;">6px</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-100); width: 120px; height: 120px; margin: 0 auto 12px; border-radius: var(--radius-lg);"></div>
            <div style="font-weight: 600; font-size: 14px; color: var(--color-neutral-900);">Large</div>
            <code style="font-size: 11px; color: var(--color-neutral-600);">--radius-lg</code>
            <div style="font-size: 11px; color: var(--color-neutral-500); margin-top: 4px;">8px</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-100); width: 120px; height: 120px; margin: 0 auto 12px; border-radius: var(--radius-xl);"></div>
            <div style="font-weight: 600; font-size: 14px; color: var(--color-neutral-900);">Extra Large ⭐</div>
            <code style="font-size: 11px; color: var(--color-neutral-600);">--radius-xl</code>
            <div style="font-size: 11px; color: var(--color-neutral-500); margin-top: 4px;">12px</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-100); width: 120px; height: 120px; margin: 0 auto 12px; border-radius: var(--radius-2xl);"></div>
            <div style="font-weight: 600; font-size: 14px; color: var(--color-neutral-900);">2X Large</div>
            <code style="font-size: 11px; color: var(--color-neutral-600);">--radius-2xl</code>
            <div style="font-size: 11px; color: var(--color-neutral-500); margin-top: 4px;">16px</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-100); width: 120px; height: 120px; margin: 0 auto 12px; border-radius: var(--radius-3xl);"></div>
            <div style="font-weight: 600; font-size: 14px; color: var(--color-neutral-900);">3X Large</div>
            <code style="font-size: 11px; color: var(--color-neutral-600);">--radius-3xl</code>
            <div style="font-size: 11px; color: var(--color-neutral-500); margin-top: 4px;">24px</div>
          </div>

          <div style="text-align: center;">
            <div style="background: var(--color-primary-100); width: 120px; height: 60px; margin: 0 auto 12px; border-radius: var(--radius-full);"></div>
            <div style="font-weight: 600; font-size: 14px; color: var(--color-neutral-900);">Full</div>
            <code style="font-size: 11px; color: var(--color-neutral-600);">--radius-full</code>
            <div style="font-size: 11px; color: var(--color-neutral-500); margin-top: 4px;">9999px (pill)</div>
          </div>
        </div>

        <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px; margin-top: 32px;">
          <h3 style="margin-top: 0; color: var(--color-neutral-800);">Usage Guidelines</h3>
          <ul style="line-height: 1.8; color: var(--color-neutral-700);">
            <li><code>--radius-xl</code> (12px): Default for cards and panels</li>
            <li><code>--radius-lg</code> (8px): Buttons and form inputs</li>
            <li><code>--radius-md</code> (6px): Small components, badges</li>
            <li><code>--radius-full</code>: Pill buttons, avatars, tags</li>
          </ul>
        </div>
      </div>
    `,
  }),
};
