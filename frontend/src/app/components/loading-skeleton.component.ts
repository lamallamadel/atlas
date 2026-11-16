import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { SpinnerVariant, SpinnerSize, SpinnerColor, SpinnerComponent } from './spinner.component';
import { NgClass } from '@angular/common';
import { DsSkeletonComponent } from '../design-system/primitives/ds-skeleton/ds-skeleton.component';

export type SkeletonVariant = 'card' | 'list' | 'table' | 'form' | 'dashboard-kpi' | 'detail' | 'grid' | 'message' | 'timeline' | 'spinner';

@Component({
    selector: 'app-loading-skeleton',
    standalone: true,
    templateUrl: './loading-skeleton.component.html',
    styleUrls: ['./loading-skeleton.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, SpinnerComponent, DsSkeletonComponent],
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

  readonly rowsArray = computed(() => {
    return Array(this.rows()).fill(0).map((_, i) => i);
  });

  readonly columnsArray = computed(() => {
    return Array(this.columns()).fill(0).map((_, i) => i);
  });

  trackByIndex(index: number): number {
    return index;
  }
}
