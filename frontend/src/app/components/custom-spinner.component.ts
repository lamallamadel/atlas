import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-custom-spinner',
  template: `
    <svg 
      class="custom-spinner"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 50 50"
      [style.display]="'inline-block'"
      [style.vertical-align]="'middle'">
      <circle
        class="spinner-track"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        [attr.stroke]="trackColor"
        stroke-width="4">
      </circle>
      <circle
        class="spinner-path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        [attr.stroke]="color"
        stroke-width="4"
        stroke-linecap="round">
      </circle>
    </svg>
  `,
  styles: [`
    .custom-spinner {
      animation: rotate 1.4s linear infinite;
    }

    .spinner-track {
      opacity: 0.1;
    }

    .spinner-path {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: 0;
      animation: dash 1.4s ease-in-out infinite;
    }

    @keyframes rotate {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    @keyframes dash {
      0% {
        stroke-dasharray: 1, 150;
        stroke-dashoffset: 0;
      }
      50% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -35;
      }
      100% {
        stroke-dasharray: 90, 150;
        stroke-dashoffset: -124;
      }
    }
  `]
})
export class CustomSpinnerComponent {
  @Input() size: number = 24;
  @Input() color: string = '#3b82f6';
  @Input() trackColor: string = '#e5e7eb';
}
