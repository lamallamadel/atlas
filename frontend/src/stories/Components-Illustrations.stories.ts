import { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

const meta: Meta = {
  title: 'Components/Illustrations',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, MatIconModule],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Illustration components for empty states, error states, and success messages.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const EmptyStates: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Empty States</h2>
        
        <div style="display: grid; gap: 32px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
          <!-- No Data -->
          <div style="background: white; padding: 48px 32px; border-radius: 12px; box-shadow: var(--shadow-2); text-align: center;">
            <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: var(--color-neutral-100); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--color-neutral-400);">folder_open</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">No Dossiers Yet</h3>
            <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6;">
              Create your first dossier to get started
            </p>
            <button mat-raised-button color="primary">
              <mat-icon>add</mat-icon>
              Create Dossier
            </button>
          </div>

          <!-- No Results -->
          <div style="background: white; padding: 48px 32px; border-radius: 12px; box-shadow: var(--shadow-2); text-align: center;">
            <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: var(--color-neutral-100); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--color-neutral-400);">search_off</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">No Results Found</h3>
            <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6;">
              Try adjusting your search or filters
            </p>
            <button mat-stroked-button color="primary">
              Clear Filters
            </button>
          </div>

          <!-- No Messages -->
          <div style="background: white; padding: 48px 32px; border-radius: 12px; box-shadow: var(--shadow-2); text-align: center;">
            <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: var(--color-info-50); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--color-info-400);">mail_outline</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">No Messages</h3>
            <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6;">
              Your inbox is empty
            </p>
            <button mat-button color="primary">
              Refresh
            </button>
          </div>
        </div>
      </div>
    `,
  }),
};

export const ErrorStates: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Error States</h2>
        
        <div style="display: grid; gap: 32px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
          <!-- Generic Error -->
          <div style="background: white; padding: 48px 32px; border-radius: 12px; box-shadow: var(--shadow-2); text-align: center;">
            <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: var(--color-error-50); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--color-error-500);">error_outline</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">Something Went Wrong</h3>
            <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6;">
              We couldn't complete your request. Please try again.
            </p>
            <button mat-raised-button color="warn">
              Try Again
            </button>
          </div>

          <!-- Network Error -->
          <div style="background: white; padding: 48px 32px; border-radius: 12px; box-shadow: var(--shadow-2); text-align: center;">
            <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: var(--color-warning-50); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--color-warning-500);">wifi_off</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">No Internet Connection</h3>
            <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6;">
              Please check your network connection
            </p>
            <button mat-stroked-button color="primary">
              Retry
            </button>
          </div>

          <!-- 404 Error -->
          <div style="background: white; padding: 48px 32px; border-radius: 12px; box-shadow: var(--shadow-2); text-align: center;">
            <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: var(--color-neutral-100); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--color-neutral-400);">not_interested</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">Page Not Found</h3>
            <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6;">
              The page you're looking for doesn't exist
            </p>
            <button mat-raised-button color="primary">
              Go Home
            </button>
          </div>
        </div>
      </div>
    `,
  }),
};

export const SuccessStates: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Success States</h2>
        
        <div style="display: grid; gap: 32px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
          <!-- Generic Success -->
          <div style="background: white; padding: 48px 32px; border-radius: 12px; box-shadow: var(--shadow-2); text-align: center;">
            <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: var(--color-success-50); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--color-success-500);">check_circle</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">Success!</h3>
            <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6;">
              Your changes have been saved successfully
            </p>
            <button mat-raised-button color="primary">
              Continue
            </button>
          </div>

          <!-- Email Sent -->
          <div style="background: white; padding: 48px 32px; border-radius: 12px; box-shadow: var(--shadow-2); text-align: center;">
            <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: var(--color-info-50); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--color-info-500);">mark_email_read</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">Email Sent</h3>
            <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6;">
              Check your inbox for further instructions
            </p>
            <button mat-button color="primary">
              OK
            </button>
          </div>

          <!-- Upload Complete -->
          <div style="background: white; padding: 48px 32px; border-radius: 12px; box-shadow: var(--shadow-2); text-align: center;">
            <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: var(--color-success-50); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--color-success-500);">cloud_done</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">Upload Complete</h3>
            <p style="margin: 0 0 24px 0; color: var(--color-neutral-600); line-height: 1.6;">
              3 files uploaded successfully
            </p>
            <button mat-stroked-button color="primary">
              View Files
            </button>
          </div>
        </div>
      </div>
    `,
  }),
};

export const LoadingStates: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Loading States</h2>
        
        <div style="display: grid; gap: 32px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
          <!-- Loading Data -->
          <div style="background: white; padding: 48px 32px; border-radius: 12px; box-shadow: var(--shadow-2); text-align: center;">
            <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: var(--color-primary-50); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--color-primary-500); animation: spin 2s linear infinite;">refresh</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">Loading...</h3>
            <p style="margin: 0; color: var(--color-neutral-600); line-height: 1.6;">
              Please wait while we fetch your data
            </p>
          </div>

          <!-- Processing -->
          <div style="background: white; padding: 48px 32px; border-radius: 12px; box-shadow: var(--shadow-2); text-align: center;">
            <div style="width: 120px; height: 120px; margin: 0 auto 24px; background: var(--color-secondary-50); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <mat-icon style="font-size: 64px; width: 64px; height: 64px; color: var(--color-secondary-500); animation: pulse 1.5s ease-in-out infinite;">hourglass_empty</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-neutral-900);">Processing...</h3>
            <p style="margin: 0 0 16px 0; color: var(--color-neutral-600); line-height: 1.6;">
              This may take a few moments
            </p>
            <div style="width: 100%; height: 4px; background: var(--color-neutral-200); border-radius: 2px; overflow: hidden;">
              <div style="width: 60%; height: 100%; background: var(--color-primary-500); animation: progress 2s ease-in-out infinite;"></div>
            </div>
          </div>
        </div>

        <style>
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
          }
        </style>
      </div>
    `,
  }),
};

export const OnboardingIllustrations: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Onboarding Illustrations</h2>
        
        <div style="display: grid; gap: 32px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
          <!-- Step 1 -->
          <div style="background: linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100)); padding: 40px 24px; border-radius: 12px; text-align: center;">
            <div style="width: 100px; height: 100px; margin: 0 auto 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-2);">
              <mat-icon style="font-size: 56px; width: 56px; height: 56px; color: var(--color-primary-500);">person_add</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-primary-900);">Create Account</h3>
            <p style="margin: 0; color: var(--color-primary-800); line-height: 1.6; font-size: 14px;">
              Sign up in seconds and get started
            </p>
          </div>

          <!-- Step 2 -->
          <div style="background: linear-gradient(135deg, var(--color-secondary-50), var(--color-secondary-100)); padding: 40px 24px; border-radius: 12px; text-align: center;">
            <div style="width: 100px; height: 100px; margin: 0 auto 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-2);">
              <mat-icon style="font-size: 56px; width: 56px; height: 56px; color: var(--color-secondary-500);">business_center</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-secondary-900);">Add Properties</h3>
            <p style="margin: 0; color: var(--color-secondary-800); line-height: 1.6; font-size: 14px;">
              Upload your property listings
            </p>
          </div>

          <!-- Step 3 -->
          <div style="background: linear-gradient(135deg, var(--color-success-50), var(--color-success-100)); padding: 40px 24px; border-radius: 12px; text-align: center;">
            <div style="width: 100px; height: 100px; margin: 0 auto 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-2);">
              <mat-icon style="font-size: 56px; width: 56px; height: 56px; color: var(--color-success-500);">rocket_launch</mat-icon>
            </div>
            <h3 style="margin: 0 0 8px 0; color: var(--color-success-900);">Start Selling</h3>
            <p style="margin: 0; color: var(--color-success-800); line-height: 1.6; font-size: 14px;">
              Manage leads and close deals
            </p>
          </div>
        </div>
      </div>
    `,
  }),
};

export const CodeExamples: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Code Examples</h2>
        
        <div style="display: grid; gap: 24px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Empty State HTML</h3>
            <pre style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6;"><code>&lt;div class="empty-state"&gt;
  &lt;div class="empty-state__icon"&gt;
    &lt;mat-icon&gt;folder_open&lt;/mat-icon&gt;
  &lt;/div&gt;
  &lt;h3 class="empty-state__title"&gt;No Dossiers Yet&lt;/h3&gt;
  &lt;p class="empty-state__message"&gt;
    Create your first dossier to get started
  &lt;/p&gt;
  &lt;button mat-raised-button color="primary"&gt;
    &lt;mat-icon&gt;add&lt;/mat-icon&gt;
    Create Dossier
  &lt;/button&gt;
&lt;/div&gt;</code></pre>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">CSS Styling</h3>
            <pre style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6;"><code>.empty-state {
  text-align: center;
  padding: 48px 32px;
}

.empty-state__icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  background: var(--color-neutral-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state__title {
  margin: 0 0 8px 0;
  color: var(--color-neutral-900);
}

.empty-state__message {
  margin: 0 0 24px 0;
  color: var(--color-neutral-600);
  line-height: 1.6;
}</code></pre>
          </div>
        </div>
      </div>
    `,
  }),
};
