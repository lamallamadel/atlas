import { Component, Input, Output, EventEmitter, TemplateRef, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-virtual-scroll-list',
  templateUrl: './virtual-scroll-list.component.html',
  styleUrls: ['./virtual-scroll-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VirtualScrollListComponent {
  @Input() items: any[] = [];
  @Input() itemHeight = 60;
  @Input() itemTemplate!: TemplateRef<any>;
  @Input() loading = false;
  @Input() loadingTemplate?: TemplateRef<any>;
  @Input() emptyTemplate?: TemplateRef<any>;
  @Input() bufferSize = 5;
  
  @Output() scrollEnd = new EventEmitter<void>();
  @Output() itemClick = new EventEmitter<any>();

  trackByIndex(index: number): number {
    return index;
  }

  trackByItem(index: number, item: any): any {
    return item.id || index;
  }

  onScrollEnd(): void {
    this.scrollEnd.emit();
  }
}
