import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { SpinnerVariant, SpinnerSize, SpinnerColor, SpinnerComponent } from './spinner.component';
import { NgClass } from '@angular/common';

export type SkeletonVariant = 'card' | 'list' | 'table' | 'form' | 'dashboard-kpi' | 'detail' | 'grid' | 'message' | 'timeline' | 'spinner';

@Component({
    selector: 'app-loading-skeleton',
    templateUrl: './loading-skeleton.component.html',
    styleUrls: ['./loading-skeleton.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, SpinnerComponent]
})
export class LoadingSkeletonComponent {
  readonly variant = input<SkeletonVariant>('card');
  readonly rows = input(3);
  readonly columns = input(8);
  readonly animate = input(true);
  
  // Spinner integration properties
  readonly spinnerVariant = input<SpinnerVariant>('circular');
  readonly spinnerSize = input<SpinnerSize>('md');
  readonly spinnerColor = input<SpinnerColor>('primary');
  readonly spinnerMessage = input<string>();

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
