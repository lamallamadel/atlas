import { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Design Tokens/Typography',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Typography system with modular scale (Perfect Fourth ratio 1.25) and semantic type styles.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const TypeScale: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Type Scale</h2>
        
        <p style="margin-bottom: 32px; color: var(--color-neutral-600); line-height: 1.6;">
          Perfect Fourth ratio (1.25) starting from 14px base size. Each level is 1.25× the previous size.
        </p>

        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div style="border-bottom: 1px solid var(--color-neutral-200); padding-bottom: 16px;">
            <div style="font-size: var(--font-size-base); line-height: var(--line-height-body);">
              Base (14px / 0.875rem) - Body text, form inputs, buttons
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-600); font-family: monospace;">
              --font-size-base: 0.875rem; /* 14px */
            </div>
          </div>

          <div style="border-bottom: 1px solid var(--color-neutral-200); padding-bottom: 16px;">
            <div style="font-size: var(--font-size-1); line-height: var(--line-height-body);">
              Level 1 (17.5px / 1.09375rem) - Subtitles, emphasized text
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-600); font-family: monospace;">
              --font-size-1: 1.09375rem; /* 17.5px */
            </div>
          </div>

          <div style="border-bottom: 1px solid var(--color-neutral-200); padding-bottom: 16px;">
            <div style="font-size: var(--font-size-2); line-height: var(--line-height-heading);">
              Level 2 (21.9px / 1.367rem) - H6, Card titles
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-600); font-family: monospace;">
              --font-size-2: 1.3671875rem; /* 21.875px */
            </div>
          </div>

          <div style="border-bottom: 1px solid var(--color-neutral-200); padding-bottom: 16px;">
            <div style="font-size: var(--font-size-3); line-height: var(--line-height-heading);">
              Level 3 (27.4px / 1.709rem) - H5, Section headings
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-600); font-family: monospace;">
              --font-size-3: 1.708984375rem; /* 27.34px */
            </div>
          </div>

          <div style="border-bottom: 1px solid var(--color-neutral-200); padding-bottom: 16px;">
            <div style="font-size: var(--font-size-4); line-height: var(--line-height-heading);">
              Level 4 (34.2px / 2.136rem) - H4, H3
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-600); font-family: monospace;">
              --font-size-4: 2.13623046875rem; /* 34.18px */
            </div>
          </div>

          <div style="border-bottom: 1px solid var(--color-neutral-200); padding-bottom: 16px;">
            <div style="font-size: var(--font-size-5); line-height: var(--line-height-heading); letter-spacing: var(--letter-spacing-tight);">
              Level 5 (42.7px / 2.67rem) - H2, H1
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-600); font-family: monospace;">
              --font-size-5: 2.6702880859375rem; /* 42.72px */
            </div>
          </div>
        </div>

        <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px; margin-top: 32px;">
          <h3 style="margin-top: 0; margin-bottom: 16px; color: var(--color-neutral-800);">Usage Examples</h3>
          <pre style="background: white; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; line-height: 1.6; margin: 0; overflow-x: auto;"><code>/* CSS */
h1 { font-size: var(--font-size-5); }
h2 { font-size: var(--font-size-4); }
h3 { font-size: var(--font-size-3); }
body { font-size: var(--font-size-base); }

.large-text {
  font-size: var(--font-size-2);
  line-height: var(--line-height-body);
}</code></pre>
        </div>
      </div>
    `,
  }),
};

export const FontWeights: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Font Weights</h2>

        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div>
            <div style="font-weight: var(--font-weight-light); font-size: 24px; margin-bottom: 8px;">
              Light (300) - Rarely used, special emphasis
            </div>
            <code style="font-size: 12px; color: var(--color-neutral-600);">--font-weight-light: 300</code>
          </div>

          <div>
            <div style="font-weight: var(--font-weight-normal); font-size: 24px; margin-bottom: 8px;">
              Normal (400) - Body text, paragraphs, default
            </div>
            <code style="font-size: 12px; color: var(--color-neutral-600);">--font-weight-normal: 400</code>
          </div>

          <div>
            <div style="font-weight: var(--font-weight-medium); font-size: 24px; margin-bottom: 8px;">
              Medium (500) - Field labels, H5, H6, buttons
            </div>
            <code style="font-size: 12px; color: var(--color-neutral-600);">--font-weight-medium: 500</code>
          </div>

          <div>
            <div style="font-weight: var(--font-weight-semibold); font-size: 24px; margin-bottom: 8px;">
              Semibold (600) - Page titles, H3, H4
            </div>
            <code style="font-size: 12px; color: var(--color-neutral-600);">--font-weight-semibold: 600</code>
          </div>

          <div>
            <div style="font-weight: var(--font-weight-bold); font-size: 24px; margin-bottom: 8px;">
              Bold (700) - H1, H2, strong emphasis
            </div>
            <code style="font-size: 12px; color: var(--color-neutral-600);">--font-weight-bold: 700</code>
          </div>
        </div>
      </div>
    `,
  }),
};

export const LineHeights: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Line Heights</h2>

        <div style="display: grid; gap: 24px;">
          <div>
            <h4 style="margin-bottom: 12px; color: var(--color-neutral-800);">Heading Line Height (1.2)</h4>
            <div style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px;">
              <p style="font-size: 24px; line-height: var(--line-height-heading); margin: 0; font-weight: 600;">
                The quick brown fox jumps over the lazy dog. This is heading text with tight line height.
              </p>
            </div>
            <code style="font-size: 12px; color: var(--color-neutral-600); display: block; margin-top: 8px;">
              --line-height-heading: 1.2
            </code>
          </div>

          <div>
            <h4 style="margin-bottom: 12px; color: var(--color-neutral-800);">Body Line Height (1.6)</h4>
            <div style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px;">
              <p style="font-size: 16px; line-height: var(--line-height-body); margin: 0;">
                The quick brown fox jumps over the lazy dog. This is body text with comfortable line height for readability. Multiple lines of text benefit from increased spacing for better scanning and comprehension.
              </p>
            </div>
            <code style="font-size: 12px; color: var(--color-neutral-600); display: block; margin-top: 8px;">
              --line-height-body: 1.6
            </code>
          </div>

          <div>
            <h4 style="margin-bottom: 12px; color: var(--color-neutral-800);">Tight (1.25)</h4>
            <div style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px;">
              <p style="font-size: 16px; line-height: var(--line-height-tight); margin: 0;">
                The quick brown fox jumps over the lazy dog. Tight line height for compact layouts.
              </p>
            </div>
            <code style="font-size: 12px; color: var(--color-neutral-600); display: block; margin-top: 8px;">
              --line-height-tight: 1.25
            </code>
          </div>

          <div>
            <h4 style="margin-bottom: 12px; color: var(--color-neutral-800);">Relaxed (1.75)</h4>
            <div style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px;">
              <p style="font-size: 16px; line-height: var(--line-height-relaxed); margin: 0;">
                The quick brown fox jumps over the lazy dog. Relaxed line height for easier reading of longer content.
              </p>
            </div>
            <code style="font-size: 12px; color: var(--color-neutral-600); display: block; margin-top: 8px;">
              --line-height-relaxed: 1.75
            </code>
          </div>
        </div>
      </div>
    `,
  }),
};

export const LetterSpacing: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Letter Spacing</h2>

        <div style="display: grid; gap: 24px;">
          <div>
            <h4 style="margin-bottom: 12px; color: var(--color-neutral-800);">Normal (0em)</h4>
            <div style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px;">
              <p style="font-size: 20px; letter-spacing: var(--letter-spacing-normal); margin: 0;">
                Body text and smaller headings use normal letter spacing
              </p>
            </div>
            <code style="font-size: 12px; color: var(--color-neutral-600); display: block; margin-top: 8px;">
              --letter-spacing-normal: 0em
            </code>
          </div>

          <div>
            <h4 style="margin-bottom: 12px; color: var(--color-neutral-800);">Tight (-0.02em)</h4>
            <div style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px;">
              <p style="font-size: 32px; letter-spacing: var(--letter-spacing-tight); margin: 0; font-weight: 700;">
                Large Text Uses Tight Spacing
              </p>
            </div>
            <code style="font-size: 12px; color: var(--color-neutral-600); display: block; margin-top: 8px;">
              --letter-spacing-tight: -0.02em
            </code>
            <p style="font-size: 14px; color: var(--color-neutral-600); margin-top: 8px;">
              Used for large text (≥27.4px) to improve optical balance
            </p>
          </div>
        </div>

        <div style="background: var(--color-info-50); padding: 20px; border-radius: 12px; margin-top: 32px; border-left: 4px solid var(--color-info-500);">
          <h4 style="margin-top: 0; color: var(--color-info-700);">When to Use</h4>
          <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
            <li>Normal spacing for body text and headings up to 27px</li>
            <li>Tight spacing (-0.02em) for large headings (≥27.4px) to prevent letter sprawl</li>
            <li>Never use positive letter spacing except for special cases (all-caps labels)</li>
          </ul>
        </div>
      </div>
    `,
  }),
};

export const HeadingHierarchy: Story = {
  render: () => ({
    template: `
      <div style="font-family: 'Roboto', system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 32px; color: var(--color-neutral-900);">Heading Hierarchy</h2>

        <div style="display: grid; gap: 32px;">
          <div>
            <h1 style="font-size: var(--font-size-5); font-weight: var(--font-weight-bold); line-height: var(--line-height-heading); letter-spacing: var(--letter-spacing-tight); margin: 0 0 8px 0; color: var(--color-neutral-900);">
              Heading 1 - Page Title
            </h1>
            <code style="font-size: 12px; color: var(--color-neutral-600);">
              42.8px / 700 / 1.2 line-height / -0.02em tracking
            </code>
          </div>

          <div>
            <h2 style="font-size: var(--font-size-4); font-weight: var(--font-weight-bold); line-height: var(--line-height-heading); letter-spacing: var(--letter-spacing-tight); margin: 0 0 8px 0; color: var(--color-neutral-900);">
              Heading 2 - Section Title
            </h2>
            <code style="font-size: 12px; color: var(--color-neutral-600);">
              34.2px / 700 / 1.2 line-height / -0.02em tracking
            </code>
          </div>

          <div>
            <h3 style="font-size: var(--font-size-3); font-weight: var(--font-weight-semibold); line-height: var(--line-height-heading); letter-spacing: var(--letter-spacing-tight); margin: 0 0 8px 0; color: var(--color-neutral-900);">
              Heading 3 - Subsection Title
            </h3>
            <code style="font-size: 12px; color: var(--color-neutral-600);">
              27.4px / 600 / 1.2 line-height / -0.02em tracking
            </code>
          </div>

          <div>
            <h4 style="font-size: var(--font-size-2); font-weight: var(--font-weight-semibold); line-height: var(--line-height-heading); margin: 0 0 8px 0; color: var(--color-neutral-900);">
              Heading 4 - Card Title
            </h4>
            <code style="font-size: 12px; color: var(--color-neutral-600);">
              21.9px / 600 / 1.2 line-height / normal tracking
            </code>
          </div>

          <div>
            <h5 style="font-size: var(--font-size-1); font-weight: var(--font-weight-medium); line-height: var(--line-height-heading); margin: 0 0 8px 0; color: var(--color-neutral-900);">
              Heading 5 - List Item Title
            </h5>
            <code style="font-size: 12px; color: var(--color-neutral-600);">
              17.5px / 500 / 1.2 line-height / normal tracking
            </code>
          </div>

          <div>
            <h6 style="font-size: var(--font-size-base); font-weight: var(--font-weight-medium); line-height: var(--line-height-heading); margin: 0 0 8px 0; color: var(--color-neutral-900);">
              Heading 6 - Smallest Heading
            </h6>
            <code style="font-size: 12px; color: var(--color-neutral-600);">
              14px / 500 / 1.2 line-height / normal tracking
            </code>
          </div>

          <div style="border-top: 2px solid var(--color-neutral-200); padding-top: 24px; margin-top: 8px;">
            <p style="font-size: var(--font-size-1); line-height: var(--line-height-body); margin: 0 0 8px 0; color: var(--color-neutral-700);">
              Body Large - Subtitle, lead paragraph
            </p>
            <code style="font-size: 12px; color: var(--color-neutral-600);">
              17.5px / 400 / 1.6 line-height
            </code>
          </div>

          <div>
            <p style="font-size: var(--font-size-base); line-height: var(--line-height-body); margin: 0 0 8px 0; color: var(--color-neutral-700);">
              Body - Default body text, paragraphs
            </p>
            <code style="font-size: 12px; color: var(--color-neutral-600);">
              14px / 400 / 1.6 line-height
            </code>
          </div>

          <div>
            <p style="font-size: var(--font-size-sm); line-height: var(--line-height-body); margin: 0 0 8px 0; color: var(--color-neutral-600);">
              Small - Captions, helper text, metadata
            </p>
            <code style="font-size: 12px; color: var(--color-neutral-600);">
              13px / 400 / 1.6 line-height
            </code>
          </div>

          <div>
            <p style="font-size: var(--font-size-xs); line-height: var(--line-height-body); margin: 0 0 8px 0; color: var(--color-neutral-600);">
              Extra Small - Legal text, fine print
            </p>
            <code style="font-size: 12px; color: var(--color-neutral-600);">
              11.2px / 400 / 1.6 line-height
            </code>
          </div>
        </div>
      </div>
    `,
  }),
};
