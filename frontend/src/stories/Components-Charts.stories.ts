import { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
  title: 'Components/Charts',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Chart visualization components using Chart.js for displaying data insights with accessible color schemes and responsive layouts.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ChartTypes: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Chart Types</h2>
        
        <p style="margin-bottom: 32px; color: var(--color-neutral-600); line-height: 1.6; max-width: 800px;">
          The application uses Chart.js for data visualization with ng2-charts wrapper. All charts use our design system colors and are responsive.
        </p>

        <div style="display: grid; gap: 48px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Line Chart</h3>
            <div style="background: white; padding: 24px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2);">
              <svg viewBox="0 0 600 300" style="width: 100%; height: 300px;">
                <line x1="50" y1="250" x2="550" y2="250" stroke="var(--color-neutral-300)" stroke-width="2"/>
                <line x1="50" y1="50" x2="50" y2="250" stroke="var(--color-neutral-300)" stroke-width="2"/>
                <polyline points="50,200 150,150 250,180 350,100 450,130 550,80" fill="none" stroke="var(--color-primary-500)" stroke-width="3"/>
                <circle cx="50" cy="200" r="4" fill="var(--color-primary-500)"/>
                <circle cx="150" cy="150" r="4" fill="var(--color-primary-500)"/>
                <circle cx="250" cy="180" r="4" fill="var(--color-primary-500)"/>
                <circle cx="350" cy="100" r="4" fill="var(--color-primary-500)"/>
                <circle cx="450" cy="130" r="4" fill="var(--color-primary-500)"/>
                <circle cx="550" cy="80" r="4" fill="var(--color-primary-500)"/>
              </svg>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for trends over time (sales, traffic, performance)
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Bar Chart</h3>
            <div style="background: white; padding: 24px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2);">
              <svg viewBox="0 0 600 300" style="width: 100%; height: 300px;">
                <line x1="50" y1="250" x2="550" y2="250" stroke="var(--color-neutral-300)" stroke-width="2"/>
                <line x1="50" y1="50" x2="50" y2="250" stroke="var(--color-neutral-300)" stroke-width="2"/>
                <rect x="80" y="180" width="60" height="70" fill="var(--color-primary-500)" rx="4"/>
                <rect x="170" y="150" width="60" height="100" fill="var(--color-primary-500)" rx="4"/>
                <rect x="260" y="120" width="60" height="130" fill="var(--color-primary-500)" rx="4"/>
                <rect x="350" y="100" width="60" height="150" fill="var(--color-primary-500)" rx="4"/>
                <rect x="440" y="140" width="60" height="110" fill="var(--color-primary-500)" rx="4"/>
              </svg>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for comparing values across categories
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Pie/Doughnut Chart</h3>
            <div style="background: white; padding: 24px; border-radius: var(--radius-xl); box-shadow: var(--shadow-2);">
              <svg viewBox="0 0 600 300" style="width: 100%; height: 300px;">
                <circle cx="300" cy="150" r="100" fill="var(--color-primary-500)"/>
                <path d="M 300 150 L 400 150 A 100 100 0 0 1 350 235.3 Z" fill="var(--color-success-500)"/>
                <path d="M 300 150 L 350 235.3 A 100 100 0 0 1 250 235.3 Z" fill="var(--color-warning-500)"/>
                <path d="M 300 150 L 250 235.3 A 100 100 0 0 1 200 150 Z" fill="var(--color-error-500)"/>
                <circle cx="300" cy="150" r="60" fill="white"/>
              </svg>
            </div>
            <div style="margin-top: 12px; font-size: 14px; color: var(--color-neutral-600);">
              Use for showing proportions of a whole
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};

export const ChartColors: Story = {
  render: () => ({
    template: `
      <div style="font-family: system-ui, -apple-system, sans-serif;">
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Chart Color Palettes</h2>
        
        <div style="display: grid; gap: 32px;">
          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Primary Palette</h3>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <div style="width: 60px; height: 60px; background: var(--color-primary-500); border-radius: 8px;"></div>
              <div style="width: 60px; height: 60px; background: var(--color-primary-400); border-radius: 8px;"></div>
              <div style="width: 60px; height: 60px; background: var(--color-primary-300); border-radius: 8px;"></div>
              <div style="width: 60px; height: 60px; background: var(--color-primary-200); border-radius: 8px;"></div>
            </div>
            <div style="font-size: 14px; color: var(--color-neutral-600);">
              Use for single-series charts
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Semantic Palette</h3>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <div style="width: 60px; height: 60px; background: var(--color-success-500); border-radius: 8px;"></div>
              <div style="width: 60px; height: 60px; background: var(--color-info-500); border-radius: 8px;"></div>
              <div style="width: 60px; height: 60px; background: var(--color-warning-500); border-radius: 8px;"></div>
              <div style="width: 60px; height: 60px; background: var(--color-error-500); border-radius: 8px;"></div>
            </div>
            <div style="font-size: 14px; color: var(--color-neutral-600);">
              Use for status/category indicators
            </div>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">Multi-Series Palette</h3>
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <div style="width: 60px; height: 60px; background: var(--color-primary-500); border-radius: 8px;"></div>
              <div style="width: 60px; height: 60px; background: var(--color-secondary-500); border-radius: 8px;"></div>
              <div style="width: 60px; height: 60px; background: var(--color-success-500); border-radius: 8px;"></div>
              <div style="width: 60px; height: 60px; background: var(--color-info-500); border-radius: 8px;"></div>
              <div style="width: 60px; height: 60px; background: var(--color-warning-500); border-radius: 8px;"></div>
            </div>
            <div style="font-size: 14px; color: var(--color-neutral-600);">
              Use for multi-series comparisons
            </div>
          </div>
        </div>

        <div style="margin-top: 32px; background: var(--color-info-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-info-500);">
          <h3 style="margin-top: 0; color: var(--color-info-700);">Accessibility Note</h3>
          <p style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
            All chart colors meet WCAG AA contrast requirements. Don't rely on color alone - use patterns, labels, and legends to convey information.
          </p>
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
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">TypeScript - Chart Configuration</h3>
            <pre style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6;"><code>import { ChartConfiguration } from 'chart.js';

export class ChartComponent {
  chartConfig: ChartConfiguration = {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Sales',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: 'var(--color-primary-500)',
        backgroundColor: 'var(--color-primary-alpha-20)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom'
        }
      }
    }
  };
}</code></pre>
          </div>

          <div>
            <h3 style="margin-bottom: 16px; color: var(--color-neutral-800);">HTML - Chart Template</h3>
            <pre style="background: var(--color-neutral-50); padding: 16px; border-radius: 8px; overflow-x: auto; font-family: monospace; font-size: 13px; line-height: 1.6;"><code>&lt;div class="chart-container"&gt;
  &lt;canvas baseChart
          [type]="chartConfig.type"
          [data]="chartConfig.data"
          [options]="chartConfig.options"&gt;
  &lt;/canvas&gt;
&lt;/div&gt;

&lt;!-- Import ng2-charts module --&gt;
import { NgChartsModule } from 'ng2-charts';</code></pre>
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
        <h2 style="margin-bottom: 24px; color: var(--color-neutral-900);">Chart Best Practices</h2>

        <div style="display: grid; gap: 24px;">
          <div style="background: var(--color-success-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-success-500);">
            <h3 style="margin-top: 0; color: var(--color-success-700);">✓ Do</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Use clear, descriptive labels and titles</li>
              <li>Provide legends for multi-series charts</li>
              <li>Use appropriate chart type for your data</li>
              <li>Make charts responsive (use maintainAspectRatio: false)</li>
              <li>Use design system colors for consistency</li>
              <li>Provide tooltips for detailed information</li>
              <li>Add axis labels when relevant</li>
            </ul>
          </div>

          <div style="background: var(--color-error-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-error-500);">
            <h3 style="margin-top: 0; color: var(--color-error-700);">✗ Don't</h3>
            <ul style="line-height: 1.8; color: var(--color-neutral-700); margin: 0;">
              <li>Don't use 3D charts or excessive effects</li>
              <li>Don't use too many colors (max 5-6)</li>
              <li>Don't rely on color alone for meaning</li>
              <li>Don't make charts too small to read</li>
              <li>Don't use pie charts for more than 5-6 categories</li>
              <li>Don't forget loading states for async data</li>
            </ul>
          </div>

          <div style="background: var(--color-info-50); padding: 20px; border-radius: 12px; border-left: 4px solid var(--color-info-500);">
            <h3 style="margin-top: 0; color: var(--color-info-700);">When to Use</h3>
            <div style="display: grid; gap: 16px; color: var(--color-neutral-700);">
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Line Chart</div>
                <div style="font-size: 14px;">Trends over time, continuous data</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Bar Chart</div>
                <div style="font-size: 14px;">Comparing discrete categories, rankings</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Pie/Doughnut</div>
                <div style="font-size: 14px;">Parts of a whole, percentages (max 5-6 slices)</div>
              </div>
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">Area Chart</div>
                <div style="font-size: 14px;">Cumulative data, volume over time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
};
