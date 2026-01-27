import { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const meta: Meta = {
  title: 'Guidelines/Do and Don\'t',
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
        component: 'Visual examples of correct and incorrect component usage patterns.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ButtonUsage: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 32px; color: var(--color-neutral-900);">Button Usage</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
          <!-- DO -->
          <div style="background: var(--color-success-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-success-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-success-500);">check_circle</mat-icon>
              Do: Clear, Action-Oriented Text
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px; display: flex; gap: 12px;">
              <button mat-raised-button color="primary">Save Changes</button>
              <button mat-raised-button color="primary">
                <mat-icon>add</mat-icon>
                Create Dossier
              </button>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Use descriptive, action-oriented button text that clearly indicates what will happen.
            </p>
          </div>

          <!-- DON'T -->
          <div style="background: var(--color-error-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-error-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-error-500);">cancel</mat-icon>
              Don't: Vague or Generic Text
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px; display: flex; gap: 12px;">
              <button mat-raised-button color="primary">OK</button>
              <button mat-raised-button color="primary">
                <mat-icon>add</mat-icon>
                Click Here
              </button>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Avoid vague text like "OK", "Click here", or "Submit" without context.
            </p>
          </div>

          <!-- DO -->
          <div style="background: var(--color-success-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-success-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-success-500);">check_circle</mat-icon>
              Do: Icon Buttons with Labels
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px; display: flex; gap: 12px;">
              <button mat-icon-button color="primary" aria-label="Add to favorites">
                <mat-icon>favorite</mat-icon>
              </button>
              <button mat-icon-button color="primary" aria-label="Share">
                <mat-icon>share</mat-icon>
              </button>
              <button mat-icon-button color="primary" aria-label="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Always include aria-label for icon-only buttons for screen reader users.
            </p>
          </div>

          <!-- DON'T -->
          <div style="background: var(--color-error-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-error-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-error-500);">cancel</mat-icon>
              Don't: Icon Buttons Without Labels
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px; display: flex; gap: 12px;">
              <button mat-icon-button color="primary">
                <mat-icon>favorite</mat-icon>
              </button>
              <button mat-icon-button color="primary">
                <mat-icon>share</mat-icon>
              </button>
              <button mat-icon-button color="primary">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Icon buttons without aria-label are inaccessible to screen reader users.
            </p>
          </div>
        </div>
      </div>
    `,
  }),
};

export const ColorUsage: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 32px; color: var(--color-neutral-900);">Color Usage</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
          <!-- DO -->
          <div style="background: var(--color-success-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-success-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-success-500);">check_circle</mat-icon>
              Do: Color + Icon + Text
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 8px; padding: 12px; background: var(--color-success-50); border-radius: 8px;">
                  <mat-icon style="color: var(--color-success-600);">check_circle</mat-icon>
                  <span style="color: var(--color-success-700); font-weight: 500;">Active</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; padding: 12px; background: var(--color-error-50); border-radius: 8px;">
                  <mat-icon style="color: var(--color-error-600);">cancel</mat-icon>
                  <span style="color: var(--color-error-700); font-weight: 500;">Inactive</span>
                </div>
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Use color combined with icons and text to convey status.
            </p>
          </div>

          <!-- DON'T -->
          <div style="background: var(--color-error-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-error-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-error-500);">cancel</mat-icon>
              Don't: Color Only
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="padding: 12px; background: var(--color-success-100); border-radius: 8px; text-align: center;">
                  <span style="font-weight: 500;">Active</span>
                </div>
                <div style="padding: 12px; background: var(--color-error-100); border-radius: 8px; text-align: center;">
                  <span style="font-weight: 500;">Inactive</span>
                </div>
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Don't rely solely on color to convey information (fails for color-blind users).
            </p>
          </div>

          <!-- DO -->
          <div style="background: var(--color-success-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-success-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-success-500);">check_circle</mat-icon>
              Do: High Contrast Text
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <p style="color: var(--color-neutral-800); font-size: 16px; margin: 0;">
                This text has 8.59:1 contrast ratio, easily readable for all users.
              </p>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Ensure text meets WCAG AA standard (4.5:1 for normal text).
            </p>
          </div>

          <!-- DON'T -->
          <div style="background: var(--color-error-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-error-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-error-500);">cancel</mat-icon>
              Don't: Low Contrast Text
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <p style="color: #bdbdbd; font-size: 16px; margin: 0;">
                This text has poor contrast and is hard to read.
              </p>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Low contrast text fails accessibility standards and is hard to read.
            </p>
          </div>
        </div>
      </div>
    `,
  }),
};

export const FormUsage: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 32px; color: var(--color-neutral-900);">Form Usage</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
          <!-- DO -->
          <div style="background: var(--color-success-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-success-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-success-500);">check_circle</mat-icon>
              Do: Labels Above Inputs
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--color-neutral-800);">
                  Email Address *
                </label>
                <input type="email" 
                       placeholder="email@example.com"
                       style="width: 100%; padding: 10px 12px; border: 1px solid var(--color-neutral-300); border-radius: 8px; font-size: 14px;">
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Always use visible labels above inputs, not just placeholders.
            </p>
          </div>

          <!-- DON'T -->
          <div style="background: var(--color-error-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-error-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-error-500);">cancel</mat-icon>
              Don't: Placeholder as Label
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <div>
                <input type="email" 
                       placeholder="Email Address *"
                       style="width: 100%; padding: 10px 12px; border: 1px solid var(--color-neutral-300); border-radius: 8px; font-size: 14px;">
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Placeholders disappear when typing and are not accessible labels.
            </p>
          </div>

          <!-- DO -->
          <div style="background: var(--color-success-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-success-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-success-500);">check_circle</mat-icon>
              Do: Specific Error Messages
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <div>
                <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--color-neutral-800);">
                  Password *
                </label>
                <input type="password" 
                       value="123"
                       style="width: 100%; padding: 10px 12px; border: 2px solid var(--color-error-500); border-radius: 8px; font-size: 14px;">
                <div style="display: flex; align-items: start; gap: 6px; margin-top: 8px; color: var(--color-error-700);">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px;">error</mat-icon>
                  <span style="font-size: 13px;">Password must be at least 8 characters long</span>
                </div>
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Provide clear, specific error messages that help users fix the issue.
            </p>
          </div>

          <!-- DON'T -->
          <div style="background: var(--color-error-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-error-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-error-500);">cancel</mat-icon>
              Don't: Vague Error Messages
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <div>
                <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--color-neutral-800);">
                  Password *
                </label>
                <input type="password" 
                       value="123"
                       style="width: 100%; padding: 10px 12px; border: 2px solid var(--color-error-500); border-radius: 8px; font-size: 14px;">
                <div style="margin-top: 8px; color: var(--color-error-700); font-size: 13px;">
                  Invalid input
                </div>
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Generic error messages don't help users understand what's wrong.
            </p>
          </div>
        </div>
      </div>
    `,
  }),
};

export const LayoutUsage: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 32px; color: var(--color-neutral-900);">Layout & Spacing</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
          <!-- DO -->
          <div style="background: var(--color-success-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-success-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-success-500);">check_circle</mat-icon>
              Do: Consistent Spacing
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="padding: 16px; background: var(--color-neutral-100); border-radius: 8px;">Section 1</div>
                <div style="padding: 16px; background: var(--color-neutral-100); border-radius: 8px;">Section 2</div>
                <div style="padding: 16px; background: var(--color-neutral-100); border-radius: 8px;">Section 3</div>
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Use consistent spacing from the spacing scale (4px grid).
            </p>
          </div>

          <!-- DON'T -->
          <div style="background: var(--color-error-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-error-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-error-500);">cancel</mat-icon>
              Don't: Random Spacing
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <div style="display: flex; flex-direction: column;">
                <div style="padding: 16px; background: var(--color-neutral-100); border-radius: 8px; margin-bottom: 7px;">Section 1</div>
                <div style="padding: 16px; background: var(--color-neutral-100); border-radius: 8px; margin-bottom: 23px;">Section 2</div>
                <div style="padding: 16px; background: var(--color-neutral-100); border-radius: 8px;">Section 3</div>
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Inconsistent spacing creates visual chaos and poor rhythm.
            </p>
          </div>

          <!-- DO -->
          <div style="background: var(--color-success-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-success-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-success-500);">check_circle</mat-icon>
              Do: Touch-Friendly Targets
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <div style="display: flex; gap: 12px;">
                <button mat-raised-button color="primary" style="min-width: 44px; min-height: 44px;">
                  <mat-icon>favorite</mat-icon>
                </button>
                <button mat-raised-button color="primary" style="min-width: 44px; min-height: 44px;">
                  <mat-icon>share</mat-icon>
                </button>
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Ensure touch targets are at least 44×44px for mobile.
            </p>
          </div>

          <!-- DON'T -->
          <div style="background: var(--color-error-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-error-700); display: flex; align-items: center; gap: 8px;">
              <mat-icon style="color: var(--color-error-500);">cancel</mat-icon>
              Don't: Tiny Touch Targets
            </h3>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <div style="display: flex; gap: 4px;">
                <button style="width: 24px; height: 24px; padding: 0; border: none; background: var(--color-primary-500); border-radius: 4px; cursor: pointer;">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: white;">favorite</mat-icon>
                </button>
                <button style="width: 24px; height: 24px; padding: 0; border: none; background: var(--color-primary-500); border-radius: 4px; cursor: pointer;">
                  <mat-icon style="font-size: 16px; width: 16px; height: 16px; color: white;">share</mat-icon>
                </button>
              </div>
            </div>
            <p style="margin: 12px 0 0 0; font-size: 14px; color: var(--color-neutral-700);">
              Tiny buttons are hard to tap on mobile devices.
            </p>
          </div>
        </div>
      </div>
    `,
  }),
};
