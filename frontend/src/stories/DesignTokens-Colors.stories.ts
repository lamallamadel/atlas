import { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Design Tokens/Colors',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Atlas Immobilier color system with WCAG AA compliant colors for accessibility.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ColorPalette: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Color Palette</h2>
        
        <!-- Primary Colors -->
        <div style="margin-bottom: 48px;">
          <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Primary Colors</h3>
          <p style="margin-bottom: 16px; color: var(--color-neutral-600); line-height: 1.6;">
            Used for brand identity, focus indicators, and primary actions. Main color: <code>--color-primary-500</code>
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px;">
            <div>
              <div style="height: 80px; background: var(--color-primary-50); border-radius: 8px; border: 1px solid var(--color-neutral-300);"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">primary-50</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#e5eaf3</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-primary-100); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">primary-100</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#becbe0</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-primary-200); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">primary-200</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#93a9cc</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-primary-300); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">primary-300</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#6787b8</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-primary-400); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">primary-400</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#476da8</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-primary-500); border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);"></div>
              <div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: var(--color-neutral-900);">primary-500 ⭐</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#2c5aa0</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-primary-600); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">primary-600</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#265192</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-primary-700); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">primary-700</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#1f4782</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-primary-800); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">primary-800</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#193d72</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-primary-900); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">primary-900</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#0f2d54</div>
            </div>
          </div>
        </div>

        <!-- Secondary/Accent Colors -->
        <div style="margin-bottom: 48px;">
          <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Secondary/Accent Colors</h3>
          <p style="margin-bottom: 16px; color: var(--color-neutral-600); line-height: 1.6;">
            Used for secondary actions, highlights, and accents. Main color: <code>--color-secondary-500</code>
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px;">
            <div>
              <div style="height: 80px; background: var(--color-secondary-50); border-radius: 8px; border: 1px solid var(--color-neutral-300);"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">secondary-50</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#fceee5</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-secondary-100); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">secondary-100</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#f8d4bd</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-secondary-200); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">secondary-200</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#f4b891</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-secondary-300); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">secondary-300</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#f09c65</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-secondary-400); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">secondary-400</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#ec8644</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-secondary-500); border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.15);"></div>
              <div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: var(--color-neutral-900);">secondary-500 ⭐</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#e67e22</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-secondary-600); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">secondary-600</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#e3731e</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-secondary-700); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">secondary-700</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#df6619</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-secondary-800); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">secondary-800</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#db5814</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-secondary-900); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">secondary-900</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#d5420c</div>
            </div>
          </div>
        </div>

        <!-- Neutral Colors -->
        <div style="margin-bottom: 48px;">
          <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Neutral Colors (WCAG AA Compliant)</h3>
          <p style="margin-bottom: 16px; color: var(--color-neutral-600); line-height: 1.6;">
            Grayscale palette with WCAG AA compliant contrast ratios (4.5:1 minimum on white background).
          </p>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px;">
            <div>
              <div style="height: 80px; background: var(--color-neutral-0); border-radius: 8px; border: 1px solid var(--color-neutral-300);"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">neutral-0</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#ffffff</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-neutral-50); border-radius: 8px; border: 1px solid var(--color-neutral-300);"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">neutral-50</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#fafafa</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-neutral-100); border-radius: 8px; border: 1px solid var(--color-neutral-300);"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">neutral-100</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#f5f5f5</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-neutral-200); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">neutral-200</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#eeeeee</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-neutral-300); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">neutral-300</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#e0e0e0</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-neutral-400); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">neutral-400</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#bdbdbd</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-neutral-500); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">neutral-500</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#9e9e9e</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-neutral-600); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">neutral-600 ✓</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#757575</div>
              <div style="font-size: 10px; color: var(--color-success-600); margin-top: 2px;">4.54:1</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-neutral-700); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">neutral-700 ✓</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#616161</div>
              <div style="font-size: 10px; color: var(--color-success-600); margin-top: 2px;">5.74:1</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-neutral-800); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">neutral-800 ✓</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#424242</div>
              <div style="font-size: 10px; color: var(--color-success-600); margin-top: 2px;">8.59:1</div>
            </div>
            <div>
              <div style="height: 80px; background: var(--color-neutral-900); border-radius: 8px;"></div>
              <div style="margin-top: 8px; font-size: 12px; color: var(--color-neutral-700);">neutral-900 ✓</div>
              <div style="font-size: 11px; color: var(--color-neutral-600); font-family: monospace;">#212121</div>
              <div style="font-size: 10px; color: var(--color-success-600); margin-top: 2px;">16.1:1</div>
            </div>
          </div>
        </div>

        <!-- Semantic Colors -->
        <div style="margin-bottom: 48px;">
          <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Semantic Colors</h3>
          <div style="display: grid; gap: 24px;">
            <!-- Success -->
            <div>
              <h4 style="margin-bottom: 8px; color: var(--color-success-700);">Success</h4>
              <p style="margin-bottom: 12px; font-size: 14px; color: var(--color-neutral-600);">
                For completed states and positive feedback
              </p>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px;">
                <div>
                  <div style="height: 60px; background: var(--color-success-500); border-radius: 8px;"></div>
                  <div style="margin-top: 6px; font-size: 11px; color: var(--color-neutral-700);">success-500</div>
                </div>
                <div>
                  <div style="height: 60px; background: var(--color-success-700); border-radius: 8px;"></div>
                  <div style="margin-top: 6px; font-size: 11px; color: var(--color-neutral-700);">success-700 ✓</div>
                  <div style="font-size: 10px; color: var(--color-success-600);">4.64:1</div>
                </div>
              </div>
            </div>

            <!-- Warning -->
            <div>
              <h4 style="margin-bottom: 8px; color: var(--color-warning-700);">Warning</h4>
              <p style="margin-bottom: 12px; font-size: 14px; color: var(--color-neutral-600);">
                For warnings and important notices
              </p>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px;">
                <div>
                  <div style="height: 60px; background: var(--color-warning-500); border-radius: 8px;"></div>
                  <div style="margin-top: 6px; font-size: 11px; color: var(--color-neutral-700);">warning-500</div>
                </div>
                <div>
                  <div style="height: 60px; background: var(--color-warning-700); border-radius: 8px;"></div>
                  <div style="margin-top: 6px; font-size: 11px; color: var(--color-neutral-700);">warning-700</div>
                </div>
              </div>
            </div>

            <!-- Error -->
            <div>
              <h4 style="margin-bottom: 8px; color: var(--color-error-700);">Error</h4>
              <p style="margin-bottom: 12px; font-size: 14px; color: var(--color-neutral-600);">
                For errors and critical alerts
              </p>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px;">
                <div>
                  <div style="height: 60px; background: var(--color-error-500); border-radius: 8px;"></div>
                  <div style="margin-top: 6px; font-size: 11px; color: var(--color-neutral-700);">error-500</div>
                </div>
                <div>
                  <div style="height: 60px; background: var(--color-error-700); border-radius: 8px;"></div>
                  <div style="margin-top: 6px; font-size: 11px; color: var(--color-neutral-700);">error-700 ✓</div>
                  <div style="font-size: 10px; color: var(--color-success-600);">4.76:1</div>
                </div>
              </div>
            </div>

            <!-- Info -->
            <div>
              <h4 style="margin-bottom: 8px; color: var(--color-info-700);">Info</h4>
              <p style="margin-bottom: 12px; font-size: 14px; color: var(--color-neutral-600);">
                For informational content
              </p>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px;">
                <div>
                  <div style="height: 60px; background: var(--color-info-500); border-radius: 8px;"></div>
                  <div style="margin-top: 6px; font-size: 11px; color: var(--color-neutral-700);">info-500</div>
                </div>
                <div>
                  <div style="height: 60px; background: var(--color-info-700); border-radius: 8px;"></div>
                  <div style="margin-top: 6px; font-size: 11px; color: var(--color-neutral-700);">info-700</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Code Examples -->
        <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px; border: 1px solid var(--color-neutral-200);">
          <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Usage in Code</h3>
          <pre style="background: white; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6; margin: 0;"><code>/* CSS */
.primary-button {
  background-color: var(--color-primary-500);
  color: white;
}

.success-message {
  color: var(--color-success-700);
  background-color: var(--color-success-50);
}

.text-muted {
  color: var(--color-neutral-600);
}</code></pre>
        </div>
      </div>
    `,
  }),
};

export const AccessibilityCompliance: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 1200px;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">WCAG AA Compliance</h2>
        
        <div style="background: var(--color-info-50); padding: 24px; border-radius: 12px; border-left: 4px solid var(--color-info-500); margin-bottom: 32px;">
          <h3 style="margin-top: 0; color: var(--color-info-700);">Contrast Ratio Requirements</h3>
          <ul style="line-height: 1.8; color: var(--color-neutral-700);">
            <li><strong>Normal Text:</strong> 4.5:1 minimum contrast ratio</li>
            <li><strong>Large Text (≥18px or ≥14px bold):</strong> 3:1 minimum contrast ratio</li>
            <li><strong>UI Components:</strong> 3:1 minimum contrast ratio</li>
          </ul>
        </div>

        <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Text Contrast Examples</h3>
        
        <div style="display: grid; gap: 16px; margin-bottom: 32px;">
          <!-- Pass Examples -->
          <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid var(--color-success-500);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--color-neutral-700); font-size: 16px;">neutral-700 on white</span>
              <span style="background: var(--color-success-100); color: var(--color-success-700); padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                ✓ PASS 5.74:1
              </span>
            </div>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid var(--color-success-500);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--color-success-700); font-size: 16px;">success-700 on white</span>
              <span style="background: var(--color-success-100); color: var(--color-success-700); padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                ✓ PASS 4.64:1
              </span>
            </div>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid var(--color-success-500);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--color-error-700); font-size: 16px;">error-700 on white</span>
              <span style="background: var(--color-success-100); color: var(--color-success-700); padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                ✓ PASS 4.76:1
              </span>
            </div>
          </div>

          <div style="background: var(--color-primary-500); padding: 20px; border-radius: 8px; border: 2px solid var(--color-success-500);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: white; font-size: 16px;">white on primary-500</span>
              <span style="background: white; color: var(--color-success-700); padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                ✓ PASS 4.95:1
              </span>
            </div>
          </div>
        </div>

        <div style="background: var(--color-neutral-50); padding: 24px; border-radius: 12px; margin-top: 32px;">
          <h3 style="margin-top: 0; color: var(--color-neutral-800);">Best Practices</h3>
          <ul style="line-height: 1.8; color: var(--color-neutral-700);">
            <li>Use <code>neutral-700</code> or darker for body text on white backgrounds</li>
            <li>Use <code>neutral-600</code> or darker for large text (≥18px)</li>
            <li>For colored backgrounds, ensure white or very light text</li>
            <li>Always test with browser dev tools or contrast checker tools</li>
            <li>Semantic colors (700 shades) are WCAG AA compliant for text</li>
          </ul>
        </div>
      </div>
    `,
  }),
};
