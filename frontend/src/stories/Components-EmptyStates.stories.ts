import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const meta: Meta = {
  title: 'Components/Empty States',
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
        component: 'Empty state components for displaying meaningful messages when there is no data to show, with clear calls to action.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const EmptyStateTypes: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Empty State Types</h2>
        
        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">No Data Yet</h3>
            <div style="background: white; padding: 64px 32px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2); text-align: center; max-width: 500px;">
              <div style="width: 80px; height: 80px; background: var(--color-primary-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--color-primary-500);">inbox</mat-icon>
              </div>
              <h3 style="margin: 0 0 12px 0; font-size: 20px; color: var(--color-neutral-900);">No Items Yet</h3>
              <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
                You haven't created any items yet. Get started by adding your first item.
              </p>
              <button mat-raised-button color="primary">
                <mat-icon>add</mat-icon>
                Create First Item
              </button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use when user hasn't created any data yet
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">No Search Results</h3>
            <div style="background: white; padding: 64px 32px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2); text-align: center; max-width: 500px;">
              <div style="width: 80px; height: 80px; background: var(--color-info-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--color-info-500);">search_off</mat-icon>
              </div>
              <h3 style="margin: 0 0 12px 0; font-size: 20px; color: var(--color-neutral-900);">No Results Found</h3>
              <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
                We couldn't find anything matching "<strong>searchterm</strong>". Try adjusting your search or filters.
              </p>
              <div style="display: flex; gap: 12px; justify-content: center;">
                <button mat-button>Clear Filters</button>
                <button mat-raised-button color="primary">View All</button>
              </div>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use when search or filter returns no results
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Error State</h3>
            <div style="background: white; padding: 64px 32px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2); text-align: center; max-width: 500px;">
              <div style="width: 80px; height: 80px; background: var(--color-error-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--color-error-500);">error_outline</mat-icon>
              </div>
              <h3 style="margin: 0 0 12px 0; font-size: 20px; color: var(--color-neutral-900);">Something Went Wrong</h3>
              <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
                We couldn't load the data. Please try again or contact support if the problem persists.
              </p>
              <div style="display: flex; gap: 12px; justify-content: center;">
                <button mat-button>Contact Support</button>
                <button mat-raised-button color="primary">Try Again</button>
              </div>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use when data loading fails
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">No Access</h3>
            <div style="background: white; padding: 64px 32px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2); text-align: center; max-width: 500px;">
              <div style="width: 80px; height: 80px; background: var(--color-warning-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--color-warning-600);">lock</mat-icon>
              </div>
              <h3 style="margin: 0 0 12px 0; font-size: 20px; color: var(--color-neutral-900);">Access Denied</h3>
              <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
                You don't have permission to view this content. Contact your administrator to request access.
              </p>
              <button mat-raised-button color="primary">Request Access</button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use when user lacks permissions
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Completed</h3>
            <div style="background: white; padding: 64px 32px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2); text-align: center; max-width: 500px;">
              <div style="width: 80px; height: 80px; background: var(--color-success-100); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--color-success-500);">check_circle</mat-icon>
              </div>
              <h3 style="margin: 0 0 12px 0; font-size: 20px; color: var(--color-neutral-900);">All Done!</h3>
              <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
                You've completed all tasks. Great job! Take a break or start something new.
              </p>
              <button mat-raised-button color="primary">Start New Task</button>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use when all items are completed
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const CompactEmptyStates: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Compact Empty States</h2>
        
        <div style="display: grid; gap: 32px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Inline Empty State</h3>
            <div style="background: white; padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--color-neutral-200); text-align: center;">
              <mat-icon style="font-size: 32px; width: 32px; height: 32px; color: var(--color-neutral-400); margin-bottom: 12px;">folder_open</mat-icon>
              <div style="font-size: 14px; color: var(--color-neutral-600);">No files in this folder</div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">List Empty State</h3>
            <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--color-neutral-200); overflow: hidden;">
              <div style="padding: 12px 16px; background: var(--color-neutral-50); border-bottom: 1px solid var(--color-neutral-200); font-weight: 500; color: var(--color-neutral-800);">
                Recent Activity
              </div>
              <div style="padding: 48px 32px; text-align: center;">
                <mat-icon style="font-size: 40px; width: 40px; height: 40px; color: var(--color-neutral-300); margin-bottom: 12px;">history</mat-icon>
                <div style="color: var(--color-neutral-600); font-size: 14px; margin-bottom: 8px;">No recent activity</div>
                <div style="color: var(--color-neutral-500); font-size: 13px;">Activity will appear here when you start using the app</div>
              </div>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Card Empty State</h3>
            <div style="background: white; padding: 24px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2); text-align: center; max-width: 300px;">
              <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: var(--color-neutral-300); margin-bottom: 16px;">notifications_none</mat-icon>
              <div style="font-weight: 600; margin-bottom: 8px; color: var(--color-neutral-800);">No Notifications</div>
              <div style="font-size: 14px; color: var(--color-neutral-600); line-height: 1.5;">You're all caught up!</div>
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
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Empty State Best Practices</h2>

        <div style="display: grid; gap: 24px;">
          <div style="background: var(--color-success-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; color: var(--color-success-700);">✓ Do</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Provide clear, friendly messaging</li>
              <li>Include a relevant icon or illustration</li>
              <li>Offer a clear call-to-action when appropriate</li>
              <li>Explain why the state is empty</li>
              <li>Provide guidance on what to do next</li>
              <li>Use positive, encouraging language</li>
              <li>Match the tone to the context (error vs. normal empty)</li>
            </ul>
          </div>

          <div style="background: var(--color-error-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; color: var(--color-error-700);">✗ Don't</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Don't blame the user ("You haven't done anything")</li>
              <li>Don't leave empty states completely blank</li>
              <li>Don't use technical jargon or error codes</li>
              <li>Don't forget to handle error states differently</li>
              <li>Don't make empty states look broken</li>
              <li>Don't overload with too many action buttons</li>
            </ul>
          </div>

          <div style="background: var(--color-info-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-info-500);">
            <h3 style="margin-top: 0; color: var(--color-info-700);">Content Guidelines</h3>
            <div style="display: grid; gap: 16px; color: var(--color-neutral-700);">
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Headline</div>
                <div style="font-size: 14px;">Clear, concise (2-5 words). Example: "No Items Yet"</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Description</div>
                <div style="font-size: 14px;">Explain why empty and what to do (1-2 sentences)</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Call-to-Action</div>
                <div style="font-size: 14px;">Clear button with action verb. Example: "Create First Item"</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Icon</div>
                <div style="font-size: 14px;">Relevant, not too large (48-80px), use semantic colors</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
