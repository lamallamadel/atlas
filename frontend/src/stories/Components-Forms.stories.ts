import { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

const meta: Meta = {
  title: 'Components/Forms',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatRadioModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Form components with validation, error states, and accessibility support.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const TextInputs: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Text Inputs</h2>
        
        <div style="display: grid; gap: 32px; max-width: 500px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Standard Input</h3>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Full Name</mat-label>
              <input matInput placeholder="Enter your full name">
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">With Hint</h3>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Email</mat-label>
              <input matInput placeholder="email@example.com" type="email">
              <mat-icon matPrefix>email</mat-icon>
              <mat-hint>We'll never share your email</mat-hint>
            </mat-form-field>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">With Error</h3>
            <mat-form-field appearance="outline" style="width: 100%;" class="mat-form-field-invalid">
              <mat-label>Phone Number</mat-label>
              <input matInput placeholder="+33 6 12 34 56 78" type="tel">
              <mat-icon matPrefix>phone</mat-icon>
              <mat-error>Please enter a valid phone number</mat-error>
            </mat-form-field>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Disabled</h3>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Disabled Input</mat-label>
              <input matInput value="Cannot edit" disabled>
            </mat-form-field>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Textarea</h3>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Description</mat-label>
              <textarea matInput rows="4" placeholder="Enter description..."></textarea>
              <mat-hint align="end">0 / 500</mat-hint>
            </mat-form-field>
          </div>
        </div>
      </div>
    `,
  }),
};

export const SelectDropdowns: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Select Dropdowns</h2>
        
        <div style="display: grid; gap: 32px; max-width: 500px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Single Select</h3>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Property Type</mat-label>
              <mat-select>
                <mat-option value="apartment">Apartment</mat-option>
                <mat-option value="house">House</mat-option>
                <mat-option value="villa">Villa</mat-option>
                <mat-option value="office">Office</mat-option>
                <mat-option value="land">Land</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">With Icon</h3>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>City</mat-label>
              <mat-select>
                <mat-option value="paris">Paris</mat-option>
                <mat-option value="lyon">Lyon</mat-option>
                <mat-option value="marseille">Marseille</mat-option>
                <mat-option value="toulouse">Toulouse</mat-option>
              </mat-select>
              <mat-icon matPrefix>location_city</mat-icon>
            </mat-form-field>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Multiple Select</h3>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Amenities</mat-label>
              <mat-select multiple>
                <mat-option value="parking">Parking</mat-option>
                <mat-option value="balcony">Balcony</mat-option>
                <mat-option value="garden">Garden</mat-option>
                <mat-option value="pool">Swimming Pool</mat-option>
                <mat-option value="gym">Gym</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
      </div>
    `,
  }),
};

export const CheckboxesAndRadios: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Checkboxes & Radio Buttons</h2>
        
        <div style="display: grid; gap: 32px; max-width: 500px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Checkboxes</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <mat-checkbox>Accept terms and conditions</mat-checkbox>
              <mat-checkbox checked>Send me promotional emails</mat-checkbox>
              <mat-checkbox disabled>Disabled option</mat-checkbox>
              <mat-checkbox indeterminate>Indeterminate state</mat-checkbox>
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Radio Buttons</h3>
            <mat-radio-group>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <mat-radio-button value="sale">For Sale</mat-radio-button>
                <mat-radio-button value="rent">For Rent</mat-radio-button>
                <mat-radio-button value="both" checked>Both</mat-radio-button>
                <mat-radio-button value="other" disabled>Other (disabled)</mat-radio-button>
              </div>
            </mat-radio-group>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Inline Radio Buttons</h3>
            <mat-radio-group>
              <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                <mat-radio-button value="1">1 Room</mat-radio-button>
                <mat-radio-button value="2">2 Rooms</mat-radio-button>
                <mat-radio-button value="3">3 Rooms</mat-radio-button>
                <mat-radio-button value="4+">4+ Rooms</mat-radio-button>
              </div>
            </mat-radio-group>
          </div>
        </div>
      </div>
    `,
  }),
};

export const ValidationStates: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Validation States</h2>
        
        <div style="display: grid; gap: 32px; max-width: 500px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Required Field</h3>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Email *</mat-label>
              <input matInput placeholder="email@example.com" required>
              <mat-hint>Required field</mat-hint>
            </mat-form-field>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Error State</h3>
            <mat-form-field appearance="outline" style="width: 100%;" class="mat-form-field-invalid">
              <mat-label>Password</mat-label>
              <input matInput type="password" value="123">
              <mat-error>
                <mat-icon style="font-size: 16px; width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;">error</mat-icon>
                Password must be at least 8 characters
              </mat-error>
            </mat-form-field>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Success State</h3>
            <mat-form-field appearance="outline" style="width: 100%;">
              <mat-label>Email</mat-label>
              <input matInput value="user@example.com">
              <mat-icon matSuffix style="color: var(--color-success-500);">check_circle</mat-icon>
              <mat-hint style="color: var(--color-success-600);">
                Valid email address
              </mat-hint>
            </mat-form-field>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Multiple Errors</h3>
            <mat-form-field appearance="outline" style="width: 100%;" class="mat-form-field-invalid">
              <mat-label>Username</mat-label>
              <input matInput value="ab">
              <mat-error>
                <ul style="margin: 4px 0; padding-left: 20px; font-size: 12px;">
                  <li>Must be at least 3 characters</li>
                  <li>Can only contain letters and numbers</li>
                </ul>
              </mat-error>
            </mat-form-field>
          </div>
        </div>
      </div>
    `,
  }),
};

export const CompleteForm: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Complete Form Example</h2>
        
        <form style="max-width: 600px; background: white; padding: 32px; border-radius: 12px; box-shadow: var(--shadow-2);">
          <h3 style="margin-top: 0; margin-bottom: 24px; color: var(--color-neutral-900);">Property Inquiry</h3>
          
          <div style="display: grid; gap: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <mat-form-field appearance="outline">
                <mat-label>First Name *</mat-label>
                <input matInput required>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Last Name *</mat-label>
                <input matInput required>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Email *</mat-label>
              <input matInput type="email" required>
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone</mat-label>
              <input matInput type="tel">
              <mat-icon matPrefix>phone</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Property Type *</mat-label>
              <mat-select required>
                <mat-option value="apartment">Apartment</mat-option>
                <mat-option value="house">House</mat-option>
                <mat-option value="villa">Villa</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Budget Range</mat-label>
              <mat-select>
                <mat-option value="100k-200k">€100k - €200k</mat-option>
                <mat-option value="200k-300k">€200k - €300k</mat-option>
                <mat-option value="300k-500k">€300k - €500k</mat-option>
                <mat-option value="500k+">€500k+</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Message</mat-label>
              <textarea matInput rows="4" placeholder="Tell us about your requirements..."></textarea>
            </mat-form-field>

            <div>
              <mat-checkbox>I agree to the terms and conditions *</mat-checkbox>
            </div>

            <div>
              <mat-checkbox checked>Send me property updates via email</mat-checkbox>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px;">
              <button mat-button type="button">Cancel</button>
              <button mat-raised-button color="primary" type="submit">Submit Inquiry</button>
            </div>
          </div>
        </form>
      </div>
    `,
  }),
};

export const AccessibilityGuidelines: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Form Accessibility Guidelines</h2>
        
        <div style="display: grid; gap: 24px;">
          <div style="background: var(--color-success-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; color: var(--color-success-700);">✓ Do</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Always use <code>&lt;label&gt;</code> elements for form inputs</li>
              <li>Mark required fields with asterisk (*) and aria-required</li>
              <li>Provide clear, specific error messages</li>
              <li>Use aria-describedby for hints and errors</li>
              <li>Ensure form inputs have sufficient color contrast (4.5:1)</li>
              <li>Group related form fields with <code>&lt;fieldset&gt;</code></li>
              <li>Make error messages programmatically associated with inputs</li>
              <li>Provide validation feedback on blur, not just on submit</li>
            </ul>
          </div>

          <div style="background: var(--color-error-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; color: var(--color-error-700);">✗ Don't</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Use placeholder text as a replacement for labels</li>
              <li>Rely solely on color to indicate errors</li>
              <li>Make labels too small or low contrast</li>
              <li>Disable form submission button permanently</li>
              <li>Use vague error messages like "Invalid input"</li>
              <li>Remove focus indicators from form fields</li>
            </ul>
          </div>

          <div style="background: var(--color-info-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-info-500);">
            <h3 style="margin-top: 0; color: var(--color-info-700);">Keyboard Navigation</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li><kbd>Tab</kbd> - Move focus to next field</li>
              <li><kbd>Shift + Tab</kbd> - Move focus to previous field</li>
              <li><kbd>Space</kbd> - Toggle checkboxes and radio buttons</li>
              <li><kbd>Arrow Keys</kbd> - Navigate radio button groups</li>
              <li><kbd>Enter</kbd> - Submit form (when on submit button)</li>
              <li>Focus order should match visual order</li>
            </ul>
          </div>

          <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px;">
            <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-neutral-800);">Error Message Example</h3>
            <pre style="background: white; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6; margin: 0;"><code>&lt;mat-form-field&gt;
  &lt;mat-label&gt;Email *&lt;/mat-label&gt;
  &lt;input matInput 
         type="email"
         required
         aria-required="true"
         aria-describedby="email-error"&gt;
  &lt;mat-error id="email-error"&gt;
    Please enter a valid email address
  &lt;/mat-error&gt;
&lt;/mat-form-field&gt;</code></pre>
          </div>
        </div>
      </div>
    `,
  }),
};
