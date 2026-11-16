import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DsProgressBarMode = 'determinate' | 'indeterminate' | 'buffer';
export type DsProgressBarVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

@Component({
  selector: 'ds-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="ds-progress" 
      [class]="variantClass()" 
      role="progressbar" 
      [attr.aria-valuenow]="mode === 'determinate' ? value : null" 
      [attr.aria-valuemin]="mode === 'determinate' ? 0 : null" 
      [attr.aria-valuemax]="mode === 'determinate' ? 100 : null">
      
      @if (mode === 'indeterminate') {
        <div class="ds-progress__indeterminate"></div>
      } @else {
        <div 
          class="ds-progress__bar" 
          [style.width.%]="value">
        </div>
        @if (mode === 'buffer') {
          <div 
            class="ds-progress__buffer" 
            [style.width.%]="bufferValue">
          </div>
        }
      }
    </div>
  `,
  styleUrls: ['./ds-progress-bar.component.scss']
})
export class DsProgressBarComponent {
  @Input() value = 0;
  @Input() bufferValue = 0;
  @Input() mode: DsProgressBarMode = 'determinate';
  @Input() variant: DsProgressBarVariant = 'primary';

  variantClass = computed(() => `ds-progress--${this.variant}`);
}
