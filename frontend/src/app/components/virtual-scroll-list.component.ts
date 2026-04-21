import { Component, TemplateRef, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, CdkVirtualForOf } from '@angular/cdk/scrolling';
import { NgTemplateOutlet } from '@angular/common';
import { LoadingSkeletonComponent } from './loading-skeleton.component';

@Component({
    selector: 'app-virtual-scroll-list',
    templateUrl: './virtual-scroll-list.component.html',
    styleUrls: ['./virtual-scroll-list.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CdkVirtualScrollViewport, CdkFixedSizeVirtualScroll, NgTemplateOutlet, CdkVirtualForOf, LoadingSkeletonComponent]
})
export class VirtualScrollListComponent {
  readonly items = input<any[]>([]);
  readonly itemHeight = input(60);
  readonly itemTemplate = input.required<TemplateRef<any>>();
  readonly loading = input(false);
  readonly loadingTemplate = input<TemplateRef<any>>();
  readonly emptyTemplate = input<TemplateRef<any>>();
  readonly bufferSize = input(5);
  
  readonly scrollEnd = output<void>();
  readonly itemClick = output<any>();

  trackByIndex(index: number): number {
    return index;
  }

  trackByItem(index: number, item: any): any {
    return item.id || index;
  }

  onScrollEnd(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.scrollEnd.emit();
  }
}
