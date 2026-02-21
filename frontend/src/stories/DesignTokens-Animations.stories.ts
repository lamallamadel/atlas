import { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Design Tokens/Animations',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Animation timing and easing functions for creating smooth, consistent motion throughout the application.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const DurationScale: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Animation Durations</h2>
        
        <p style="margin-bottom: 32px; color: var(--color-neutral-600); line-height: 1.6; max-width: 800px;">
          Consistent animation durations create predictable and pleasant user experiences. Use shorter durations for 
          small, frequent interactions and longer durations for substantial state changes.
        </p>

        <div style="display: grid; gap: 24px;">
          <div style="display: flex; align-items: center; gap: 24px; padding: 16px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="flex: 0 0 180px;">
              <code style="font-size: 13px; color: var(--color-primary-600);">--duration-instant</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">0ms</div>
            </div>
            <div style="flex: 1;">
              <div id="anim-instant" style="width: 60px; height: 60px; background: var(--color-primary-500); border-radius: 8px; cursor: pointer;" onclick="this.style.transform='translateX(200px)'; setTimeout(() => this.style.transform='translateX(0)', 100);"></div>
            </div>
            <div style="flex: 0 0 200px; font-size: 14px; color: var(--color-neutral-600);">
              No animation
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 24px; padding: 16px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="flex: 0 0 180px;">
              <code style="font-size: 13px; color: var(--color-primary-600);">--duration-fast</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">100ms</div>
            </div>
            <div style="flex: 1;">
              <div style="width: 60px; height: 60px; background: var(--color-primary-500); border-radius: 8px; cursor: pointer; transition: transform 100ms ease-in-out;" onclick="this.style.transform='translateX(200px)'; setTimeout(() => this.style.transform='translateX(0)', 300);"></div>
            </div>
            <div style="flex: 0 0 200px; font-size: 14px; color: var(--color-neutral-600);">
              Tooltips, hover
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 24px; padding: 16px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="flex: 0 0 180px;">
              <code style="font-size: 13px; color: var(--color-primary-600);">--duration-normal</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">200ms</div>
            </div>
            <div style="flex: 1;">
              <div style="width: 60px; height: 60px; background: var(--color-primary-500); border-radius: 8px; cursor: pointer; transition: transform 200ms ease-in-out;" onclick="this.style.transform='translateX(200px)'; setTimeout(() => this.style.transform='translateX(0)', 400);"></div>
            </div>
            <div style="flex: 0 0 200px; font-size: 14px; color: var(--color-neutral-600);">
              Default transitions
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 24px; padding: 16px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="flex: 0 0 180px;">
              <code style="font-size: 13px; color: var(--color-primary-600);">--duration-moderate</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">300ms</div>
            </div>
            <div style="flex: 1;">
              <div style="width: 60px; height: 60px; background: var(--color-primary-500); border-radius: 8px; cursor: pointer; transition: transform 300ms ease-in-out;" onclick="this.style.transform='translateX(200px)'; setTimeout(() => this.style.transform='translateX(0)', 500);"></div>
            </div>
            <div style="flex: 0 0 200px; font-size: 14px; color: var(--color-neutral-600);">
              Dropdowns, menus
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 24px; padding: 16px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="flex: 0 0 180px;">
              <code style="font-size: 13px; color: var(--color-primary-600);">--duration-slow</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">400ms</div>
            </div>
            <div style="flex: 1;">
              <div style="width: 60px; height: 60px; background: var(--color-primary-500); border-radius: 8px; cursor: pointer; transition: transform 400ms ease-in-out;" onclick="this.style.transform='translateX(200px)'; setTimeout(() => this.style.transform='translateX(0)', 600);"></div>
            </div>
            <div style="flex: 0 0 200px; font-size: 14px; color: var(--color-neutral-600);">
              Modals, drawers
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 24px; padding: 16px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="flex: 0 0 180px;">
              <code style="font-size: 13px; color: var(--color-primary-600);">--duration-slower</code>
              <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">500ms</div>
            </div>
            <div style="flex: 1;">
              <div style="width: 60px; height: 60px; background: var(--color-primary-500); border-radius: 8px; cursor: pointer; transition: transform 500ms ease-in-out;" onclick="this.style.transform='translateX(200px)'; setTimeout(() => this.style.transform='translateX(0)', 700);"></div>
            </div>
            <div style="flex: 0 0 200px; font-size: 14px; color: var(--color-neutral-600);">
              Page transitions
            </div>
          </div>
        </div>

        <div style="margin-top: 32px; padding: 16px; background: var(--color-info-50); border-radius: 8px; border-left: 4px solid var(--color-info-500);">
          <p style="margin: 0; color: var(--color-info-700); font-weight: 500;">
            💡 Click each box to see the animation duration
          </p>
        </div>
      </div>
    `,
  }),
};

export const EasingFunctions: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Easing Functions</h2>
        
        <p style="margin-bottom: 32px; color: var(--color-neutral-600); line-height: 1.6; max-width: 800px;">
          Easing functions control the acceleration curve of animations, creating more natural and engaging motion.
        </p>

        <div style="display: grid; gap: 24px;">
          <div style="padding: 16px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div>
                <code style="font-size: 13px; color: var(--color-primary-600);">--ease-in</code>
                <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">cubic-bezier(0.4, 0, 1, 1)</div>
              </div>
              <div style="font-size: 14px; color: var(--color-neutral-600);">Slow start, fast end</div>
            </div>
            <div style="width: 60px; height: 60px; background: var(--color-success-500); border-radius: 8px; cursor: pointer; transition: transform 400ms cubic-bezier(0.4, 0, 1, 1);" onclick="this.style.transform='translateX(400px)'; setTimeout(() => this.style.transform='translateX(0)', 600);"></div>
          </div>

          <div style="padding: 16px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div>
                <code style="font-size: 13px; color: var(--color-primary-600);">--ease-out</code>
                <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">cubic-bezier(0, 0, 0.2, 1)</div>
              </div>
              <div style="font-size: 14px; color: var(--color-neutral-600);">Fast start, slow end</div>
            </div>
            <div style="width: 60px; height: 60px; background: var(--color-info-500); border-radius: 8px; cursor: pointer; transition: transform 400ms cubic-bezier(0, 0, 0.2, 1);" onclick="this.style.transform='translateX(400px)'; setTimeout(() => this.style.transform='translateX(0)', 600);"></div>
          </div>

          <div style="padding: 16px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div>
                <code style="font-size: 13px; color: var(--color-primary-600);">--ease-in-out</code>
                <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">cubic-bezier(0.4, 0, 0.2, 1)</div>
              </div>
              <div style="font-size: 14px; color: var(--color-neutral-600);">Slow both ends (default)</div>
            </div>
            <div style="width: 60px; height: 60px; background: var(--color-warning-500); border-radius: 8px; cursor: pointer; transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);" onclick="this.style.transform='translateX(400px)'; setTimeout(() => this.style.transform='translateX(0)', 600);"></div>
          </div>

          <div style="padding: 16px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div>
                <code style="font-size: 13px; color: var(--color-primary-600);">--ease-sharp</code>
                <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">cubic-bezier(0.4, 0, 0.6, 1)</div>
              </div>
              <div style="font-size: 14px; color: var(--color-neutral-600);">Quick, snappy</div>
            </div>
            <div style="width: 60px; height: 60px; background: var(--color-error-500); border-radius: 8px; cursor: pointer; transition: transform 400ms cubic-bezier(0.4, 0, 0.6, 1);" onclick="this.style.transform='translateX(400px)'; setTimeout(() => this.style.transform='translateX(0)', 600);"></div>
          </div>

          <div style="padding: 16px; background: var(--color-neutral-50); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div>
                <code style="font-size: 13px; color: var(--color-primary-600);">--ease-bounce</code>
                <div style="font-size: 12px; color: var(--color-neutral-600); margin-top: 4px;">cubic-bezier(0.68, -0.55, 0.265, 1.55)</div>
              </div>
              <div style="font-size: 14px; color: var(--color-neutral-600);">Playful bounce</div>
            </div>
            <div style="width: 60px; height: 60px; background: var(--color-secondary-500); border-radius: 8px; cursor: pointer; transition: transform 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);" onclick="this.style.transform='translateX(400px)'; setTimeout(() => this.style.transform='translateX(0)', 600);"></div>
          </div>
        </div>

        <div style="margin-top: 32px; padding: 16px; background: var(--color-info-50); border-radius: 8px; border-left: 4px solid var(--color-info-500);">
          <p style="margin: 0; color: var(--color-info-700); font-weight: 500;">
            💡 Click each box to see the easing function in action
          </p>
        </div>
      </div>
    `,
  }),
};

export const TransitionPresets: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Transition Presets</h2>
        
        <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px; border: 1px solid var(--color-neutral-200);">
          <h3 style="margin-top: 0; color: var(--color-neutral-800);">Usage in Code</h3>
          <pre style="background: white; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6; margin: 0;"><code>/* CSS - Using animation tokens */

/* Duration */
.button {
  transition: all var(--duration-normal) ease-in-out;
}

/* Easing */
.card {
  transition: transform var(--duration-moderate) var(--ease-out);
}

/* Preset transitions */
.element {
  transition: var(--transition-base);  /* all 200ms ease-in-out */
}

.colors-only {
  transition: var(--transition-colors);  /* color, bg, border 200ms */
}

.transform-only {
  transition: var(--transition-transform);  /* transform 200ms */
}

.opacity-fade {
  transition: var(--transition-opacity);  /* opacity 200ms */
}

.shadow-elevation {
  transition: var(--transition-shadow);  /* box-shadow 200ms */
}

/* Respecting reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}</code></pre>
        </div>

        <div style="margin-top: 32px; background: var(--color-warning-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-warning-500);">
          <h3 style="margin-top: 0; color: var(--color-warning-700);">⚠️ Accessibility Note</h3>
          <p style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
            Always respect the <code>prefers-reduced-motion</code> media query for users who prefer minimal motion. 
            Our design system automatically disables animations for users with this preference enabled.
          </p>
        </div>
      </div>
    `,
  }),
};

export const BestPractices: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Animation Best Practices</h2>

        <div style="display: grid; gap: 24px;">
          <div style="background: var(--color-success-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; color: var(--color-success-700);">✓ Do</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Use shorter durations (100-200ms) for frequent interactions</li>
              <li>Use ease-out for entering elements</li>
              <li>Use ease-in for exiting elements</li>
              <li>Use ease-in-out for state changes</li>
              <li>Respect user's motion preferences</li>
              <li>Keep animations subtle and purposeful</li>
              <li>Use consistent timing across similar interactions</li>
            </ul>
          </div>

          <div style="background: var(--color-error-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; color: var(--color-error-700);">✗ Don't</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Don't use animations longer than 500ms</li>
              <li>Don't animate too many properties at once</li>
              <li>Don't use animations that block user interaction</li>
              <li>Don't ignore prefers-reduced-motion</li>
              <li>Don't use arbitrary timing values</li>
              <li>Don't make animations distracting or excessive</li>
              <li>Don't use linear easing (except for specific cases)</li>
            </ul>
          </div>

          <div style="background: var(--color-info-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-info-500);">
            <h3 style="margin-top: 0; color: var(--color-info-700);">Performance Tips</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Prefer <code>transform</code> and <code>opacity</code> for best performance</li>
              <li>Avoid animating <code>width</code>, <code>height</code>, <code>top</code>, or <code>left</code></li>
              <li>Use <code>will-change</code> sparingly for complex animations</li>
              <li>Remove <code>will-change</code> after animation completes</li>
              <li>Use CSS transitions over JavaScript when possible</li>
            </ul>
          </div>
        </div>
      </div>
    `,
  }),
};
