import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { SpinnerVariant, SpinnerSize, SpinnerColor } from './spinner.component';

export type SkeletonVariant = 'card' | 'list' | 'table' | 'form' | 'dashboard-kpi' | 'detail' | 'grid' | 'message' | 'timeline' | 'spinner';

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
  
  // Spinner integration properties
  @Input() spinnerVariant: SpinnerVariant = 'circular';
  @Input() spinnerSize: SpinnerSize = 'md';
  @Input() spinnerColor: SpinnerColor = 'primary';
  @Input() spinnerMessage?: string;

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
