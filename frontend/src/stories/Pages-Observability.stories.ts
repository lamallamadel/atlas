import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { CommonModule, DecimalPipe, KeyValuePipe, DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';

import { PageHeaderComponent } from '../app/design-system/patterns/page-header/page-header.component';
import { DsButtonComponent } from '../app/design-system/primitives/ds-button/ds-button.component';
import { DsCardComponent } from '../app/design-system/primitives/ds-card/ds-card.component';
import { DsBadgeComponent } from '../app/design-system/primitives/ds-badge/ds-badge.component';
import { DsEmptyStateComponent } from '../app/design-system/primitives/ds-empty-state/ds-empty-state.component';
import { DsSkeletonComponent } from '../app/design-system/primitives/ds-skeleton/ds-skeleton.component';

interface MockMetrics {
  queueMetrics: { totalQueued: number; queueDepthByChannel: Record<string, number> };
  latencyMetrics: { latencyByChannel: Record<string, { p50: number; p95: number; p99: number; average: number }> };
  failureMetrics: { overallFailureRate: number; failuresByErrorCode: Record<string, number> };
  dlqMetrics: { dlqSize: number; alertThreshold: number; alertThresholdExceeded: boolean; dlqSizeByChannel: Record<string, number>; recentDlqMessages: any[] };
  quotaMetrics: { quotaByChannel: Record<string, { used: number; limit: number; usagePercentage: number; period: string }> };
}

const MOCK_METRICS: MockMetrics = {
  queueMetrics: {
    totalQueued: 1247,
    queueDepthByChannel: { WHATSAPP: 642, EMAIL: 318, SMS: 287 },
  },
  latencyMetrics: {
    latencyByChannel: {
      WHATSAPP: { p50: 245, p95: 890, p99: 1240, average: 312 },
      EMAIL: { p50: 1820, p95: 4560, p99: 8120, average: 2340 },
      SMS: { p50: 480, p95: 1240, p99: 2180, average: 612 },
    },
  },
  failureMetrics: {
    overallFailureRate: 2.34,
    failuresByErrorCode: { TIMEOUT: 18, INVALID_NUMBER: 12, RATE_LIMIT: 7, OTHER: 4 },
  },
  dlqMetrics: {
    dlqSize: 41,
    alertThreshold: 100,
    alertThresholdExceeded: false,
    dlqSizeByChannel: { WHATSAPP: 22, EMAIL: 14, SMS: 5 },
    recentDlqMessages: [
      { messageId: 'msg-8124', channel: 'WHATSAPP', errorCode: 'TIMEOUT', errorMessage: 'Provider timeout after 30s', attemptCount: 5, lastAttemptAt: new Date() },
      { messageId: 'msg-8120', channel: 'EMAIL', errorCode: 'INVALID_NUMBER', errorMessage: 'Recipient address rejected', attemptCount: 3, lastAttemptAt: new Date() },
    ],
  },
  quotaMetrics: {
    quotaByChannel: {
      WHATSAPP: { used: 8420, limit: 10000, usagePercentage: 84.2, period: 'day' },
      EMAIL: { used: 1240, limit: 5000, usagePercentage: 24.8, period: 'day' },
      SMS: { used: 4720, limit: 5000, usagePercentage: 94.4, period: 'day' },
    },
  },
};

@Component({
  selector: 'sb-observability-mock',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, KeyValuePipe, DatePipe,
    PageHeaderComponent, DsButtonComponent, DsCardComponent,
    DsBadgeComponent, DsEmptyStateComponent, DsSkeletonComponent,
  ],
  template: `
    <div class="pro-page" style="padding:32px;max-width:1280px;margin:0 auto;background:var(--ds-bg);min-height:100vh;display:flex;flex-direction:column;gap:24px;">

      <ds-page-header
        eyebrow="Observabilité"
        titleBefore="Outbound Message"
        titleAccent="Observability"
        titleAfter="Dashboard"
        description="Monitoring temps-réel et visualisation des métriques de la file d'envoi.">
        <div slot="actions" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <label style="display:flex;flex-direction:column;gap:2px;font-size:12px;">
            <span style="color:var(--ds-text-muted);font-weight:500;">Du</span>
            <input type="date" value="2026-05-03"
              style="height:38px;padding:0 12px;border:1px solid var(--ds-border);border-radius:8px;background:var(--ds-surface);color:var(--ds-text);font-size:14px;" />
          </label>
          <label style="display:flex;flex-direction:column;gap:2px;font-size:12px;">
            <span style="color:var(--ds-text-muted);font-weight:500;">Au</span>
            <input type="date" value="2026-05-04"
              style="height:38px;padding:0 12px;border:1px solid var(--ds-border);border-radius:8px;background:var(--ds-surface);color:var(--ds-text);font-size:14px;" />
          </label>
          <ds-button [variant]="autoRefresh ? 'copper' : 'ghost'" size="md">
            {{ autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF' }}
          </ds-button>
          <ds-button variant="marine" size="md">Actualiser</ds-button>
          <button type="button" style="height:38px;padding:0 16px;border:1px solid var(--ds-border);border-radius:8px;background:var(--ds-surface);color:var(--ds-text);font-size:14px;font-weight:500;cursor:pointer;">
            Exporter ▾
          </button>
        </div>
      </ds-page-header>

      @if (showStatus) {
        <ds-card elevation="xs" [pad]="false">
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;font-size:14px;color:var(--ds-text-muted);">
            <span style="width:8px;height:8px;border-radius:50%;background:var(--ds-success,#1f8b5b);box-shadow:0 0 0 4px rgba(31,139,91,.12);"></span>
            <span style="flex:1;">Dernière mise à jour : il y a 12 secondes</span>
            <span style="color:var(--ds-success,#1f8b5b);font-weight:500;">Auto-refresh toutes les 30s</span>
          </div>
        </ds-card>
      }

      @if (showError) {
        <ds-card elevation="sm">
          <ds-empty-state
            title="Impossible de charger les métriques"
            description="HTTP 500 — Erreur de chargement des métriques d'observabilité"
            ctaLabel="Réessayer">
          </ds-empty-state>
        </ds-card>
      }

      @if (showLoading) {
        <div style="display:flex;flex-direction:column;gap:16px;">
          <ds-skeleton variant="rect" height="80px"></ds-skeleton>
          <ds-skeleton variant="rect" height="320px"></ds-skeleton>
          <ds-skeleton variant="rect" height="320px"></ds-skeleton>
        </div>
      }

      @if (showMetrics) {
        <!-- Queue depth -->
        <ds-card elevation="sm">
          <header style="margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--ds-border);">
            <h2 style="margin:0;font-size:18px;font-weight:600;color:var(--ds-text);">File d'envoi — profondeur par canal</h2>
            <p style="margin:4px 0 0;font-size:14px;color:var(--ds-text-muted);">Courbes par intervalles de 1 minute.</p>
          </header>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;">
            <div style="padding:16px 20px;border-radius:12px;background:var(--ds-marine);color:var(--ds-text-inverse);border-left:3px solid var(--ds-copper);">
              <div style="font-size:28px;font-weight:700;line-height:1;">{{ metrics.queueMetrics.totalQueued }}</div>
              <div style="margin-top:8px;font-size:14px;opacity:.85;font-weight:500;">Total en file</div>
            </div>
            @for (ch of (metrics.queueMetrics.queueDepthByChannel | keyvalue); track ch.key) {
              <div style="padding:16px 20px;border-radius:12px;background:var(--ds-bg-soft,#f5f7fa);border-left:3px solid var(--ds-border);">
                <div style="font-size:28px;font-weight:700;color:var(--ds-text);line-height:1;">{{ ch.value }}</div>
                <div style="margin-top:8px;font-size:14px;color:var(--ds-text-muted);font-weight:500;">{{ ch.key }}</div>
              </div>
            }
          </div>
          <div style="margin-top:16px;height:280px;background:var(--ds-bg-soft,#f5f7fa);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--ds-text-muted);font-size:14px;">
            📈 Chart.js — Queue Depth Time Series
          </div>
        </ds-card>

        <!-- Failure rate -->
        <ds-card elevation="sm">
          <header style="margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--ds-border);">
            <h2 style="margin:0;font-size:18px;font-weight:600;color:var(--ds-text);">Taux d'échec & analyse d'erreurs</h2>
          </header>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;">
            <div style="padding:16px 20px;border-radius:12px;background:rgba(192,36,36,.08);border-left:3px solid var(--ds-danger,#c02424);">
              <div style="font-size:28px;font-weight:700;color:var(--ds-danger,#c02424);line-height:1;">{{ metrics.failureMetrics.overallFailureRate }}%</div>
              <div style="margin-top:8px;font-size:14px;color:var(--ds-text-muted);font-weight:500;">Taux d'échec global</div>
            </div>
          </div>
        </ds-card>

        <!-- Quota cards -->
        <ds-card elevation="sm">
          <header style="margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--ds-border);">
            <h2 style="margin:0;font-size:18px;font-weight:600;color:var(--ds-text);">Consommation des quotas fournisseurs</h2>
          </header>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;">
            @for (q of (metrics.quotaMetrics.quotaByChannel | keyvalue); track q.key) {
              <article style="padding:20px;border-radius:12px;background:var(--ds-surface);border:1px solid var(--ds-border);border-left:3px solid {{ q.value.usagePercentage >= 90 ? 'var(--ds-danger,#c02424)' : (q.value.usagePercentage >= 75 ? 'var(--ds-warning,#cc8700)' : 'var(--ds-success,#1f8b5b)') }};display:flex;flex-direction:column;gap:12px;">
                <header style="display:flex;align-items:center;justify-content:space-between;">
                  <span style="font-size:16px;font-weight:600;color:var(--ds-text);">{{ q.key }}</span>
                  <span style="font-size:22px;font-weight:700;color:{{ q.value.usagePercentage >= 90 ? 'var(--ds-danger,#c02424)' : (q.value.usagePercentage >= 75 ? 'var(--ds-warning,#cc8700)' : 'var(--ds-success,#1f8b5b)') }};">{{ q.value.usagePercentage | number:'1.0-0' }}%</span>
                </header>
                <div style="height:8px;background:rgba(13,44,74,.08);border-radius:999px;overflow:hidden;">
                  <div [style.width.%]="q.value.usagePercentage"
                       [style.background]="q.value.usagePercentage >= 90 ? 'var(--ds-danger,#c02424)' : (q.value.usagePercentage >= 75 ? 'var(--ds-warning,#cc8700)' : 'var(--ds-success,#1f8b5b)')"
                       style="height:100%;border-radius:999px;"></div>
                </div>
                <div style="display:flex;justify-content:space-between;padding:12px;background:var(--ds-bg-soft,#f5f7fa);border-radius:8px;font-size:14px;">
                  <span><strong>{{ q.value.used | number }}</strong> utilisés</span>
                  <span style="color:var(--ds-text-muted);">/ {{ q.value.limit | number }}</span>
                </div>
                <ds-badge [status]="q.value.usagePercentage >= 90 ? 'error' : (q.value.usagePercentage >= 75 ? 'warning' : 'success')" size="sm">
                  {{ q.value.usagePercentage >= 90 ? 'Critique — action requise' : (q.value.usagePercentage >= 75 ? 'Attention' : 'Normal') }}
                </ds-badge>
              </article>
            }
          </div>
        </ds-card>
      }
    </div>
  `,
})
class ObservabilityMockComponent {
  @Input() showStatus = true;
  @Input() showError = false;
  @Input() showLoading = false;
  @Input() showMetrics = true;
  @Input() autoRefresh = true;
  metrics = MOCK_METRICS;
}

const meta: Meta<ObservabilityMockComponent> = {
  title: 'Pages/Observabilité — Dashboard',
  component: ObservabilityMockComponent,
  decorators: [
    applicationConfig({ providers: [provideAnimations(), provideRouter([])] }),
    moduleMetadata({}),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<ObservabilityMockComponent>;

export const Default: Story = {
  args: { showStatus: true, showError: false, showLoading: false, showMetrics: true, autoRefresh: true },
};

export const LoadingState: Story = {
  args: { showStatus: false, showError: false, showLoading: true, showMetrics: false, autoRefresh: false },
};

export const ErrorState: Story = {
  args: { showStatus: false, showError: true, showLoading: false, showMetrics: false, autoRefresh: false },
};

export const AutoRefreshOff: Story = {
  args: { showStatus: true, showError: false, showLoading: false, showMetrics: true, autoRefresh: false },
};
