import { Component, Input } from '@angular/core';

export type DsSkeletonVariant = 'text' | 'heading' | 'rect' | 'circle' | 'card';

@Component({
  selector: 'ds-skeleton',
  standalone: true,
  template: `<div [class]="classes" [style.width]="width" [style.height]="height" [attr.aria-hidden]="true"></div>`,
  styleUrls: ['./ds-skeleton.component.scss'],
})
export class DsSkeletonComponent {
  @Input() variant: DsSkeletonVariant = 'text';
  @Input() width: string | null = null;
  @Input() height: string | null = null;
  @Input() lines: number = 1;

  get classes(): string {
    return `ds-skeleton ds-skeleton--${this.variant}`;
  }
}
