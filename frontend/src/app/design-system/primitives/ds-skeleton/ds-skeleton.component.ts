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
  /** Désactive le shimmer (placeholder statique). */
  @Input() animate = true;

  get classes(): string {
    const base = `ds-skeleton ds-skeleton--${this.variant}`;
    return this.animate ? base : `${base} ds-skeleton--static`;
  }
}
