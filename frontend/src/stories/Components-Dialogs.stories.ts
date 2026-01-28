import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const meta: Meta = {
  title: 'Components/Dialogs',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Dialog components for modal interactions, confirmations, and forms. All dialogs are accessible with proper focus management and keyboard navigation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const DialogTypes: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Dialog Types</h2>
        
        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Confirmation Dialog</h3>
            <div style="max-width: 400px; background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-5); padding: 24px;">
              <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
                <div style="width: 48px; height: 48px; background: var(--color-error-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <mat-icon style="color: var(--color-error-600);">warning</mat-icon>
                </div>
                <div>
                  <h4 style="margin: 0 0 8px 0; font-size: 18px; color: var(--color-neutral-900);">Delete Item?</h4>
                  <p style="margin: 0; color: var(--color-neutral-600); font-size: 14px; line-height: 1.6;">
                    This action cannot be undone. This will permanently delete the item and remove all associated data.
                  </p>
                </div>
              </div>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button mat-button>Cancel</button>
                <button mat-raised-button color="warn">Delete</button>
              </div>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for destructive or irreversible actions
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Information Dialog</h3>
            <div style="max-width: 400px; background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-5); padding: 24px;">
              <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
                <div style="width: 48px; height: 48px; background: var(--color-info-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <mat-icon style="color: var(--color-info-600);">info</mat-icon>
                </div>
                <div>
                  <h4 style="margin: 0 0 8px 0; font-size: 18px; color: var(--color-neutral-900);">Feature Update</h4>
                  <p style="margin: 0; color: var(--color-neutral-600); font-size: 14px; line-height: 1.6;">
                    We've added new features to improve your experience. Check out the latest updates in the changelog.
                  </p>
                </div>
              </div>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button mat-button>Learn More</button>
                <button mat-raised-button color="primary">Got it</button>
              </div>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for providing information or updates
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Success Dialog</h3>
            <div style="max-width: 400px; background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-5); padding: 24px;">
              <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
                <div style="width: 48px; height: 48px; background: var(--color-success-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <mat-icon style="color: var(--color-success-600);">check_circle</mat-icon>
                </div>
                <div>
                  <h4 style="margin: 0 0 8px 0; font-size: 18px; color: var(--color-neutral-900);">Successfully Saved</h4>
                  <p style="margin: 0; color: var(--color-neutral-600); font-size: 14px; line-height: 1.6;">
                    Your changes have been saved successfully. You can continue editing or close this dialog.
                  </p>
                </div>
              </div>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button mat-button>Continue Editing</button>
                <button mat-raised-button color="primary">Close</button>
              </div>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for success confirmation
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Form Dialog</h3>
            <div style="max-width: 500px; background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-5);">
              <div style="padding: 24px; border-bottom: 1px solid var(--color-neutral-200);">
                <h4 style="margin: 0; font-size: 20px; color: var(--color-neutral-900);">Add New Item</h4>
              </div>
              <div style="padding: 24px;">
                <div style="margin-bottom: 20px;">
                  <label style="display: block; margin-bottom: 8px; color: var(--color-neutral-700); font-weight: 500; font-size: 14px;">Name</label>
                  <input type="text" placeholder="Enter name" style="width: 100%; padding: 10px 12px; border: 1px solid var(--color-neutral-300); border-radius: var(--radius-lg); font-size: 14px;" />
                </div>
                <div style="margin-bottom: 20px;">
                  <label style="display: block; margin-bottom: 8px; color: var(--color-neutral-700); font-weight: 500; font-size: 14px;">Description</label>
                  <textarea placeholder="Enter description" rows="3" style="width: 100%; padding: 10px 12px; border: 1px solid var(--color-neutral-300); border-radius: var(--radius-lg); font-size: 14px; font-family: inherit; resize: vertical;"></textarea>
                </div>
              </div>
              <div style="padding: 16px 24px; background: var(--color-neutral-50); border-top: 1px solid var(--color-neutral-200); border-radius: 0 0 var(--radius-xl) var(--radius-xl); display: flex; gap: 12px; justify-content: flex-end;">
                <button mat-button>Cancel</button>
                <button mat-raised-button color="primary">Save</button>
              </div>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for collecting user input
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const DialogSizes: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Dialog Sizes</h2>
        
        <div style="display: grid; gap: 32px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Small (320px)</h3>
            <div style="max-width: 320px; background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-5); padding: 24px;">
              <h4 style="margin: 0 0 12px 0; font-size: 18px; color: var(--color-neutral-900);">Small Dialog</h4>
              <p style="margin: 0 0 20px 0; color: var(--color-neutral-600); font-size: 14px; line-height: 1.6;">
                Used for simple confirmations and quick actions.
              </p>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button mat-button>Cancel</button>
                <button mat-raised-button color="primary">OK</button>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Medium (480px)</h3>
            <div style="max-width: 480px; background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-5); padding: 24px;">
              <h4 style="margin: 0 0 12px 0; font-size: 18px; color: var(--color-neutral-900);">Medium Dialog</h4>
              <p style="margin: 0 0 20px 0; color: var(--color-neutral-600); font-size: 14px; line-height: 1.6;">
                Used for forms, settings, and detailed confirmations. This is the most common dialog size and provides good balance between content space and screen real estate.
              </p>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button mat-button>Cancel</button>
                <button mat-raised-button color="primary">OK</button>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Large (640px)</h3>
            <div style="max-width: 640px; background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-5); padding: 24px;">
              <h4 style="margin: 0 0 12px 0; font-size: 18px; color: var(--color-neutral-900);">Large Dialog</h4>
              <p style="margin: 0 0 20px 0; color: var(--color-neutral-600); font-size: 14px; line-height: 1.6;">
                Used for complex forms, multi-step wizards, and content-heavy dialogs. Large dialogs provide ample space for detailed information and complex interactions while remaining focused.
              </p>
              <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button mat-button>Cancel</button>
                <button mat-raised-button color="primary">OK</button>
              </div>
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
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">TypeScript - Opening a Dialog</h3>
            <pre style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6;"><code>import { MatDialog } from '@angular/material/dialog';

export class ExampleComponent {
  constructor(private dialog: MatDialog) {}

  openDialog(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Confirmed');
      }
    });
  }
}</code></pre>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">HTML - Dialog Template</h3>
            <pre style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6;"><code>&lt;h2 mat-dialog-title&gt;{{ data.title }}&lt;/h2&gt;

&lt;mat-dialog-content&gt;
  &lt;p&gt;{{ data.message }}&lt;/p&gt;
&lt;/mat-dialog-content&gt;

&lt;mat-dialog-actions align="end"&gt;
  &lt;button mat-button [mat-dialog-close]="false"&gt;
    Cancel
  &lt;/button&gt;
  &lt;button mat-raised-button 
          color="primary" 
          [mat-dialog-close]="true"&gt;
    Confirm
  &lt;/button&gt;
&lt;/mat-dialog-actions&gt;</code></pre>
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
              <li>Trap focus within the dialog (Material Dialog handles this)</li>
              <li>Return focus to trigger element when dialog closes</li>
              <li>Provide clear dialog titles with <code>mat-dialog-title</code></li>
              <li>Use <code>role="dialog"</code> and <code>aria-labelledby</code></li>
              <li>Allow closing with <kbd>Esc</kbd> key</li>
              <li>Provide clear "Cancel" and action buttons</li>
              <li>Use appropriate ARIA attributes for alerts</li>
            </ul>
          </div>

          <div style="background: var(--color-error-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; color: var(--color-error-700);">✗ Don't</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Don't allow focus to escape the dialog</li>
              <li>Don't prevent closing with Esc key</li>
              <li>Don't use dialogs for non-critical content</li>
              <li>Don't nest dialogs (use sequential dialogs instead)</li>
              <li>Don't make dialogs too large or complex</li>
              <li>Don't use dialogs for persistent UI elements</li>
            </ul>
          </div>

          <div style="background: var(--color-info-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-info-500);">
            <h3 style="margin-top: 0; color: var(--color-info-700);">Keyboard Navigation</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li><kbd>Esc</kbd> - Close dialog</li>
              <li><kbd>Tab</kbd> - Move focus forward</li>
              <li><kbd>Shift + Tab</kbd> - Move focus backward</li>
              <li><kbd>Enter</kbd> - Activate focused button</li>
              <li>Focus is automatically trapped within dialog</li>
            </ul>
          </div>
        </div>
      </div>
    `,
  }),
};
