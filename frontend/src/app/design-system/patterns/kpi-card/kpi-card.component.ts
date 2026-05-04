import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsSkeletonComponent } from '../../primitives/ds-skeleton/ds-skeleton.component';

export type DsTrend = 'up' | 'down' | 'flat' | null;

@Component({
  selector: 'ds-kpi-card',
  standalone: true,
  imports: [CommonModule, DsSkeletonComponent],
  template: `
    <div class="ds-kpi" [class.ds-kpi--loading]="loading">
      @if (loading) {
        <ds-skeleton variant="text" width="40%" height="38px"></ds-skeleton>
        <ds-skeleton variant="text" width="70%"></ds-skeleton>
      } @else {
        <div class="ds-kpi__value" [style.color]="valueColor || 'var(--ds-marine)'">{{ value }}</div>
        <div class="ds-kpi__label">{{ label }}</div>
        @if (trend || delta) {
          <div class="ds-kpi__delta" [class]="trendClass" [attr.aria-label]="deltaAriaLabel">
            <span class="ds-kpi__delta-arrow" aria-hidden="true">{{ trendArrow }}</span>
            {{ delta }}
          </div>
        }
        @if (sparkline) {
          <svg class="ds-kpi__spark" viewBox="0 0 100 36" fill="none" aria-hidden="true">
            <polyline
              [attr.points]="sparklinePoints"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none" />
          </svg>
        }
        <ng-content></ng-content>
      }
    </div>
  `,
  styleUrls: ['./kpi-card.component.scss'],
})
export class KpiCardComponent {
  @Input() value: string | number = '—';
  @Input() label = '';
  @Input() delta: string | null = null;
  @Input() trend: DsTrend = null;
  @Input() loading = false;
  @Input() valueColor: string | null = null;
  @Input() sparkline: number[] | null = null;

  get trendClass(): string {
    const map: Record<string, string> = { up: 'ds-kpi__delta--up', down: 'ds-kpi__delta--down', flat: '' };
    return this.trend ? (map[this.trend] ?? '') : '';
  }

  get trendArrow(): string {
    const map: Record<string, string> = { up: '↑', down: '↓', flat: '→' };
    return this.trend ? (map[this.trend] ?? '') : '';
  }

  get deltaAriaLabel(): string {
    const dir = this.trend === 'up' ? 'hausse' : this.trend === 'down' ? 'baisse' : '';
    return this.delta ? `${dir} ${this.delta}` : '';
  }

  get sparklinePoints(): string {
    if (!this.sparkline || this.sparkline.length < 2) return '';
    const min = Math.min(...this.sparkline);
    const max = Math.max(...this.sparkline);
    const range = max - min || 1;
    const xStep = 100 / (this.sparkline.length - 1);
    return this.sparkline
      .map((v, i) => `${i * xStep},${36 - ((v - min) / range) * 32}`)
      .join(' ');
  }
}
