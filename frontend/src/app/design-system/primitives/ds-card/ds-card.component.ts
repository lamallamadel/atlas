import { Component, Input } from '@angular/core';

export type DsCardElevation = 'flat' | 'xs' | 'sm' | 'md';

@Component({
  selector: 'ds-card',
  standalone: true,
  template: `
    <div [class]="classes">
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./ds-card.component.scss'],
})
export class DsCardComponent {
  @Input() elevation: DsCardElevation = 'sm';
  @Input() pad: boolean = true;
  @Input() hover: boolean = false;
  @Input() interactive: boolean = false;

  get classes(): string {
    return [
      'ds-card',
      `ds-card--${this.elevation}`,
      this.pad ? 'ds-card--pad' : '',
      this.hover ? 'ds-card--hover' : '',
      this.interactive ? 'ds-card--interactive' : '',
    ].filter(Boolean).join(' ');
  }
}
