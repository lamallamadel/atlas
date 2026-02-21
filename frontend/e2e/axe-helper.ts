import { Page } from '@playwright/test';
import { injectAxe, checkA11y, getViolations, reportViolations } from 'axe-playwright';
import * as fs from 'fs';
import * as path from 'path';

export interface AxeResults {
  violations: any[];
  passes: any[];
  incomplete: any[];
  inapplicable: any[];
  timestamp: string;
  url: string;
  testName: string;
}

export class AxeHelper {
  private page: Page;
  private violationsByTest: Map<string, AxeResults> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  async injectAxe(): Promise<void> {
    await injectAxe(this.page);
  }

  async checkA11y(
    testName: string,
    context?: any,
    options?: any
  ): Promise<void> {
    try {
      await checkA11y(this.page, context, options);
    } catch (error) {
      const violations = await getViolations(this.page, context, options);
      
      const results: AxeResults = {
        violations,
        passes: [],
        incomplete: [],
        inapplicable: [],
        timestamp: new Date().toISOString(),
        url: this.page.url(),
        testName,
      };

      this.violationsByTest.set(testName, results);
      
      await this.saveViolationsReport(testName, results);
      
      throw error;
    }
  }

  async scanForViolations(
    testName: string,
    context?: any,
    options?: any
  ): Promise<AxeResults> {
    await this.injectAxe();
    
    const axeResults = await this.page.evaluate(
      async ({ context, options }) => {
        const axe = (window as any).axe;
        if (!axe) {
          throw new Error('axe-core not loaded');
        }
        return await axe.run(context || document, options || {});
      },
      { context, options }
    );

    const results: AxeResults = {
      violations: axeResults.violations || [],
      passes: axeResults.passes || [],
      incomplete: axeResults.incomplete || [],
      inapplicable: axeResults.inapplicable || [],
      timestamp: new Date().toISOString(),
      url: this.page.url(),
      testName,
    };

    this.violationsByTest.set(testName, results);
    
    await this.saveViolationsReport(testName, results);

    return results;
  }

  async assertNoViolations(
    testName: string,
    allowedViolations: string[] = []
  ): Promise<void> {
    const results = this.violationsByTest.get(testName);
    
    if (!results) {
      throw new Error(`No accessibility results found for test: ${testName}`);
    }

    const filteredViolations = results.violations.filter(
      (v) => !allowedViolations.includes(v.id)
    );

    if (filteredViolations.length > 0) {
      const summary = this.formatViolationsSummary(filteredViolations);
      throw new Error(
        `Accessibility violations found:\n${summary}\n\nSee detailed report in a11y-reports/${this.sanitizeFileName(testName)}.json`
      );
    }
  }

  async assertNoCriticalViolations(testName: string): Promise<void> {
    const results = this.violationsByTest.get(testName);
    
    if (!results) {
      throw new Error(`No accessibility results found for test: ${testName}`);
    }

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      const summary = this.formatViolationsSummary(criticalViolations);
      throw new Error(
        `Critical accessibility violations found:\n${summary}\n\nSee detailed report in a11y-reports/${this.sanitizeFileName(testName)}.json`
      );
    }
  }

  private formatViolationsSummary(violations: any[]): string {
    let summary = '';
    
    const bySeverity: Record<string, any[]> = {
      critical: [],
      serious: [],
      moderate: [],
      minor: [],
    };

    violations.forEach((v) => {
      bySeverity[v.impact]?.push(v);
    });

    Object.entries(bySeverity).forEach(([severity, items]) => {
      if (items.length > 0) {
        summary += `\n${severity.toUpperCase()}: ${items.length} violation(s)\n`;
        items.forEach((v) => {
          summary += `  - ${v.id}: ${v.description}\n`;
          summary += `    Affected elements: ${v.nodes.length}\n`;
          if (v.nodes.length > 0) {
            summary += `    Example: ${v.nodes[0].html.substring(0, 100)}...\n`;
          }
        });
      }
    });

    return summary;
  }

  private async saveViolationsReport(
    testName: string,
    results: AxeResults
  ): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'a11y-reports');
    
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `${this.sanitizeFileName(testName)}.json`;
    const filePath = path.join(reportsDir, fileName);

    const report = {
      ...results,
      summary: {
        total: results.violations.length,
        critical: results.violations.filter((v) => v.impact === 'critical').length,
        serious: results.violations.filter((v) => v.impact === 'serious').length,
        moderate: results.violations.filter((v) => v.impact === 'moderate').length,
        minor: results.violations.filter((v) => v.impact === 'minor').length,
      },
    };

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

    const htmlReport = this.generateHtmlReport(report);
    fs.writeFileSync(
      path.join(reportsDir, `${this.sanitizeFileName(testName)}.html`),
      htmlReport
    );
  }

  private sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private generateHtmlReport(report: any): string {
    const violations = report.violations || [];
    const summary = report.summary || {};

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report - ${report.testName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; margin-top: 0; }
    .meta { color: #666; margin-bottom: 20px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
    .summary-card { padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card.critical { background: #fee; border-left: 4px solid #c00; }
    .summary-card.serious { background: #fef5e7; border-left: 4px solid #f39c12; }
    .summary-card.moderate { background: #e8f4f8; border-left: 4px solid #3498db; }
    .summary-card.minor { background: #f0f0f0; border-left: 4px solid #95a5a6; }
    .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; }
    .summary-card .count { font-size: 32px; font-weight: bold; }
    .violation { margin: 20px 0; padding: 20px; border-radius: 8px; background: #fafafa; border-left: 4px solid #ddd; }
    .violation.critical { border-left-color: #c00; background: #fff5f5; }
    .violation.serious { border-left-color: #f39c12; background: #fffbf0; }
    .violation.moderate { border-left-color: #3498db; background: #f0f8ff; }
    .violation h3 { margin-top: 0; color: #333; }
    .impact { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    .impact.critical { background: #c00; color: white; }
    .impact.serious { background: #f39c12; color: white; }
    .impact.moderate { background: #3498db; color: white; }
    .impact.minor { background: #95a5a6; color: white; }
    .node { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; border: 1px solid #ddd; }
    .node pre { margin: 5px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; overflow-x: auto; }
    .help { color: #666; font-size: 14px; }
    .wcag { display: inline-block; margin: 5px 5px 5px 0; padding: 3px 8px; background: #e8f4f8; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Accessibility Report</h1>
    <div class="meta">
      <strong>Test:</strong> ${report.testName}<br>
      <strong>URL:</strong> ${report.url}<br>
      <strong>Timestamp:</strong> ${report.timestamp}
    </div>
    
    <div class="summary">
      <div class="summary-card critical">
        <h3>Critical</h3>
        <div class="count">${summary.critical || 0}</div>
      </div>
      <div class="summary-card serious">
        <h3>Serious</h3>
        <div class="count">${summary.serious || 0}</div>
      </div>
      <div class="summary-card moderate">
        <h3>Moderate</h3>
        <div class="count">${summary.moderate || 0}</div>
      </div>
      <div class="summary-card minor">
        <h3>Minor</h3>
        <div class="count">${summary.minor || 0}</div>
      </div>
    </div>

    ${violations.length === 0 ? '<p style="text-align: center; color: #27ae60; font-size: 18px; padding: 40px;">✅ No accessibility violations found!</p>' : ''}
    
    ${violations.map((v: any) => `
      <div class="violation ${v.impact}">
        <h3>
          <span class="impact ${v.impact}">${v.impact}</span>
          ${v.id}
        </h3>
        <p><strong>Description:</strong> ${v.description}</p>
        <p class="help">${v.help}</p>
        <p><strong>Help URL:</strong> <a href="${v.helpUrl}" target="_blank">${v.helpUrl}</a></p>
        <p><strong>WCAG Tags:</strong> ${v.tags.map((t: string) => `<span class="wcag">${t}</span>`).join('')}</p>
        <p><strong>Affected Elements:</strong> ${v.nodes.length}</p>
        ${v.nodes.slice(0, 3).map((node: any) => `
          <div class="node">
            <strong>Element:</strong>
            <pre>${this.escapeHtml(node.html)}</pre>
            <p><strong>Target:</strong> ${node.target.join(' > ')}</p>
            ${node.failureSummary ? `<p><strong>Failure:</strong> ${node.failureSummary}</p>` : ''}
          </div>
        `).join('')}
        ${v.nodes.length > 3 ? `<p><em>... and ${v.nodes.length - 3} more element(s)</em></p>` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;
  }

  private escapeHtml(html: string): string {
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async generateSummaryReport(): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'a11y-reports');
    
    if (!fs.existsSync(reportsDir)) {
      return;
    }

    const allResults = Array.from(this.violationsByTest.values());
    
    const summary = {
      totalTests: allResults.length,
      testsWithViolations: allResults.filter((r) => r.violations.length > 0).length,
      totalViolations: allResults.reduce((sum, r) => sum + r.violations.length, 0),
      bySeverity: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
      },
      byTest: allResults.map((r) => ({
        testName: r.testName,
        url: r.url,
        violations: r.violations.length,
        critical: r.violations.filter((v) => v.impact === 'critical').length,
        serious: r.violations.filter((v) => v.impact === 'serious').length,
        moderate: r.violations.filter((v) => v.impact === 'moderate').length,
        minor: r.violations.filter((v) => v.impact === 'minor').length,
      })),
    };

    allResults.forEach((r) => {
      r.violations.forEach((v) => {
        summary.bySeverity[v.impact as keyof typeof summary.bySeverity]++;
      });
    });

    fs.writeFileSync(
      path.join(reportsDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
  }
}
