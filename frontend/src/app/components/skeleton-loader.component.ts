import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { NgClass } from '@angular/common';

export type SkeletonVariant = 'card' | 'list' | 'table' | 'form' | 'dashboard-kpi' | 'detail' | 'grid' | 'message' | 'timeline';

@Component({
    selector: 'app-skeleton-loader',
    templateUrl: './skeleton-loader.component.html',
    styleUrls: ['./skeleton-loader.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass]
})
export class SkeletonLoaderComponent {
  readonly variant = input<SkeletonVariant>('card');
  readonly rows = input(3);
  readonly columns = input(8);
  readonly animate = input(true);

  get rowsArray(): number[] {
    return Array(this.rows()).fill(0).map((_, i) => i);
  }

  get columnsArray(): number[] {
    return Array(this.columns()).fill(0).map((_, i) => i);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
