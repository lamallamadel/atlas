import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type SkeletonVariant = 'card' | 'list' | 'table' | 'form' | 'dashboard-kpi' | 'detail' | 'grid' | 'message' | 'timeline';

@Component({
  selector: 'app-loading-skeleton',
  templateUrl: './loading-skeleton.component.html',
  styleUrls: ['./loading-skeleton.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSkeletonComponent {
  @Input() variant: SkeletonVariant = 'card';
  @Input() rows = 3;
  @Input() columns = 8;
  @Input() animate = true;

  get rowsArray(): number[] {
    return Array(this.rows).fill(0).map((_, i) => i);
  }

  get columnsArray(): number[] {
    return Array(this.columns).fill(0).map((_, i) => i);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
