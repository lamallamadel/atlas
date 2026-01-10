import { Component, Input, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';

@Component({
  selector: 'app-success-animation',
  template: `
    <div class="success-animation-container" [@checkmark]="animationState">
      <div class="checkmark-circle">
        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle class="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none"/>
          <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
      </div>
      <div class="success-message" *ngIf="message">{{ message }}</div>
    </div>
  `,
  styles: [`
    .success-animation-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }

    .checkmark-circle {
      width: 80px;
      height: 80px;
      position: relative;
    }

    .checkmark {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }

    .checkmark-circle-bg {
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      stroke-width: 2;
      stroke-miterlimit: 10;
      stroke: var(--color-success-500, #4caf50);
      fill: none;
      animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    }

    .checkmark-check {
      transform-origin: 50% 50%;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      stroke-width: 3;
      stroke: var(--color-success-500, #4caf50);
      animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
    }

    @keyframes stroke {
      100% {
        stroke-dashoffset: 0;
      }
    }

    .success-message {
      font-size: 18px;
      font-weight: 500;
      color: var(--color-success-700, #388e3c);
      text-align: center;
      max-width: 300px;
    }
  `],
  animations: [
    trigger('checkmark', [
      state('void', style({ transform: 'scale(0)', opacity: 0 })),
      state('*', style({ transform: 'scale(1)', opacity: 1 })),
      transition('void => *', [
        animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', keyframes([
          style({ transform: 'scale(0)', opacity: 0, offset: 0 }),
          style({ transform: 'scale(1.1)', opacity: 1, offset: 0.7 }),
          style({ transform: 'scale(1)', opacity: 1, offset: 1 })
        ]))
      ])
    ])
  ]
})
export class SuccessAnimationComponent implements OnInit {
  @Input() message?: string;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  animationState = 'in';

  ngOnInit(): void {
    this.animationState = 'in';
  }
}
