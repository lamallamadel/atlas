import { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const meta: Meta = {
  title: 'Components/Buttons',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, MatButtonModule, MatIconModule],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Button components with various styles, sizes, and states. All buttons are keyboard accessible and WCAG AA compliant.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ButtonVariants: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Button Variants</h2>
        
        <div style="display: grid; gap: 32px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Primary Buttons</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <button mat-raised-button color="primary">Primary Action</button>
              <button mat-raised-button color="primary" disabled>Disabled</button>
              <button mat-raised-button color="primary">
                <mat-icon>add</mat-icon>
                With Icon
              </button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for the main action on a page or in a section
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Secondary Buttons</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <button mat-raised-button color="accent">Secondary Action</button>
              <button mat-raised-button color="accent" disabled>Disabled</button>
              <button mat-raised-button color="accent">
                <mat-icon>edit</mat-icon>
                With Icon
              </button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for secondary actions that complement the primary action
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Outlined Buttons</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <button mat-stroked-button color="primary">Outlined</button>
              <button mat-stroked-button color="accent">Outlined</button>
              <button mat-stroked-button disabled>Disabled</button>
              <button mat-stroked-button color="primary">
                <mat-icon>filter_list</mat-icon>
                With Icon
              </button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for less prominent actions or in groups of buttons
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Text Buttons</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <button mat-button color="primary">Text Button</button>
              <button mat-button color="accent">Text Button</button>
              <button mat-button disabled>Disabled</button>
              <button mat-button color="primary">
                <mat-icon>arrow_forward</mat-icon>
                With Icon
              </button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for tertiary actions or navigation
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Icon Buttons</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <button mat-icon-button color="primary" aria-label="Add">
                <mat-icon>add</mat-icon>
              </button>
              <button mat-icon-button color="accent" aria-label="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button aria-label="Delete">
                <mat-icon>delete</mat-icon>
              </button>
              <button mat-icon-button disabled aria-label="Disabled">
                <mat-icon>block</mat-icon>
              </button>
              <button mat-icon-button color="primary" aria-label="Favorite">
                <mat-icon>favorite</mat-icon>
              </button>
              <button mat-icon-button color="primary" aria-label="Share">
                <mat-icon>share</mat-icon>
              </button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for compact actions. Always include aria-label for accessibility
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">FAB (Floating Action Button)</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <button mat-fab color="primary" aria-label="Add">
                <mat-icon>add</mat-icon>
              </button>
              <button mat-fab color="accent" aria-label="Edit">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-mini-fab color="primary" aria-label="Add">
                <mat-icon>add</mat-icon>
              </button>
              <button mat-mini-fab color="accent" aria-label="Edit">
                <mat-icon>edit</mat-icon>
              </button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for primary floating actions (create, compose, etc.)
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const ButtonSizes: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Button Sizes</h2>
        
        <div style="display: grid; gap: 24px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Large Buttons</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <button mat-raised-button color="primary" style="padding: 12px 32px; font-size: 16px;">
                Large Primary
              </button>
              <button mat-stroked-button color="primary" style="padding: 12px 32px; font-size: 16px;">
                Large Outlined
              </button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for hero sections or primary page actions
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Default Buttons</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <button mat-raised-button color="primary">Default Primary</button>
              <button mat-stroked-button color="primary">Default Outlined</button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Standard size for most use cases
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Small Buttons</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
              <button mat-raised-button color="primary" style="padding: 6px 16px; font-size: 13px;">
                Small Primary
              </button>
              <button mat-stroked-button color="primary" style="padding: 6px 16px; font-size: 13px;">
                Small Outlined
              </button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use in compact layouts or dense data tables
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const ButtonStates: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Button States</h2>
        
        <div style="display: grid; gap: 24px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Default State</h3>
            <button mat-raised-button color="primary">Click Me</button>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Normal resting state
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Hover State</h3>
            <button mat-raised-button color="primary" style="filter: brightness(1.1);">Hovered</button>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Slightly brighter on hover
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Focus State</h3>
            <button mat-raised-button color="primary" style="outline: 2px solid var(--color-primary-500); outline-offset: 2px;">
              Focused
            </button>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              2px solid outline for keyboard navigation (WCAG 2.4.7)
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Active/Pressed State</h3>
            <button mat-raised-button color="primary" style="filter: brightness(0.9); transform: scale(0.98);">
              Pressed
            </button>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Slightly darker and smaller when pressed
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Disabled State</h3>
            <button mat-raised-button color="primary" disabled>Disabled</button>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Reduced opacity, not interactive
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Loading State</h3>
            <button mat-raised-button color="primary" disabled style="position: relative;">
              <span style="opacity: 0.6;">Processing...</span>
              <span style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%);">
                <mat-icon style="animation: spin 1s linear infinite;">refresh</mat-icon>
              </span>
            </button>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Shows loading indicator during async operations
            </div>
          </div>
        </div>

        <style>
          @keyframes spin {
            from { transform: translateY(-50%) rotate(0deg); }
            to { transform: translateY(-50%) rotate(360deg); }
          }
        </style>
      </div>
    `,
  }),
};

export const ButtonGroups: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Button Groups</h2>
        
        <div style="display: grid; gap: 32px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Horizontal Group</h3>
            <div style="display: flex; gap: 0;">
              <button mat-stroked-button color="primary" style="border-radius: 8px 0 0 8px;">Left</button>
              <button mat-stroked-button color="primary" style="border-radius: 0; margin-left: -1px;">Middle</button>
              <button mat-stroked-button color="primary" style="border-radius: 0 8px 8px 0; margin-left: -1px;">Right</button>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Action Group (Form Actions)</h3>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button mat-button>Cancel</button>
              <button mat-raised-button color="primary">Save</button>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Icon Button Group</h3>
            <div style="display: flex; gap: 4px;">
              <button mat-icon-button aria-label="Align left">
                <mat-icon>format_align_left</mat-icon>
              </button>
              <button mat-icon-button aria-label="Align center">
                <mat-icon>format_align_center</mat-icon>
              </button>
              <button mat-icon-button aria-label="Align right">
                <mat-icon>format_align_right</mat-icon>
              </button>
              <button mat-icon-button aria-label="Align justify">
                <mat-icon>format_align_justify</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const CodeSnippets: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Code Examples</h2>
        
        <div style="display: grid; gap: 24px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">HTML</h3>
            <pre style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6;"><code>&lt;!-- Primary Button --&gt;
&lt;button mat-raised-button color="primary"&gt;
  Primary Action
&lt;/button&gt;

&lt;!-- Button with Icon --&gt;
&lt;button mat-raised-button color="primary"&gt;
  &lt;mat-icon&gt;add&lt;/mat-icon&gt;
  Create New
&lt;/button&gt;

&lt;!-- Icon Button (Always add aria-label) --&gt;
&lt;button mat-icon-button 
        color="primary" 
        aria-label="Add to favorites"&gt;
  &lt;mat-icon&gt;favorite&lt;/mat-icon&gt;
&lt;/button&gt;</code></pre>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">TypeScript</h3>
            <pre style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6;"><code>import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  imports: [MatButtonModule, MatIconModule]
})
export class ExampleComponent {
  onButtonClick(): void {
    console.log('Button clicked');
  }
}</code></pre>
          </div>
        </div>
      </div>
    `,
  }),
};

export const AccessibilityGuidelines: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Accessibility Guidelines</h2>
        
        <div style="display: grid; gap: 24px;">
          <div style="background: var(--color-success-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; color: var(--color-success-700);">✓ Do</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Use <code>aria-label</code> for icon-only buttons</li>
              <li>Ensure 44×44px minimum touch target size</li>
              <li>Provide clear, descriptive button text</li>
              <li>Use semantic HTML <code>&lt;button&gt;</code> element</li>
              <li>Show visible focus indicator (2px outline)</li>
              <li>Maintain 4.5:1 contrast ratio for text</li>
              <li>Disable pointer-events when button is disabled</li>
            </ul>
          </div>

          <div style="background: var(--color-error-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; color: var(--color-error-700);">✗ Don't</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Use <code>&lt;div&gt;</code> or <code>&lt;span&gt;</code> as buttons</li>
              <li>Create buttons smaller than 44×44px on mobile</li>
              <li>Remove focus outlines without replacement</li>
              <li>Use icon-only buttons without labels</li>
              <li>Rely solely on color to convey state</li>
              <li>Make buttons that trigger on hover</li>
            </ul>
          </div>

          <div style="background: var(--color-info-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-info-500);">
            <h3 style="margin-top: 0; color: var(--color-info-700);">Keyboard Navigation</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li><kbd>Tab</kbd> - Move focus to button</li>
              <li><kbd>Shift + Tab</kbd> - Move focus backward</li>
              <li><kbd>Enter</kbd> or <kbd>Space</kbd> - Activate button</li>
              <li>Focus must be visible with 2px outline</li>
            </ul>
          </div>
        </div>
      </div>
    `,
  }),
};
