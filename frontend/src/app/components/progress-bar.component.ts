import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-progress-bar',
  template: `
    <div class="progress-bar-container" *ngIf="isNavigating" [@slideDown]>
      <div class="progress-bar" [style.width.%]="progress"></div>
    </div>
  `,
  styles: [`
    .progress-bar-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: transparent;
      z-index: 10000;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #06b6d4, #10b981);
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
      transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
      will-change: width;
    }

    @media (prefers-reduced-motion: reduce) {
      .progress-bar {
        transition: none;
      }
    }

    :host-context(.dark-theme) .progress-bar {
      background: linear-gradient(90deg, #60a5fa, #22d3ee, #34d399);
    }
  `],
  animations: [
    trigger('slideDown', [
      state('void', style({
        transform: 'translateY(-100%)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translateY(0)',
        opacity: 1
      })),
      transition('void => *', [
        animate('150ms ease-out')
      ]),
      transition('* => void', [
        animate('150ms ease-in')
      ])
    ])
  ]
})
export class ProgressBarComponent implements OnChanges, OnDestroy {
  @Input() isNavigating = false;
  progress = 0;
  private progressInterval: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isNavigating']) {
      if (this.isNavigating) {
        this.startProgress();
      } else {
        this.completeProgress();
      }
    }
  }

  private startProgress(): void {
    this.progress = 0;
    this.clearInterval();

    this.progressInterval = setInterval(() => {
      if (this.progress < 90) {
        const increment = Math.random() * 10;
        this.progress = Math.min(this.progress + increment, 90);
      }
    }, 200);
  }

  private completeProgress(): void {
    this.clearInterval();
    this.progress = 100;
    
    setTimeout(() => {
      this.progress = 0;
    }, 200);
  }

  private clearInterval(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.clearInterval();
  }
}
