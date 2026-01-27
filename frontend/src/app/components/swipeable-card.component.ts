import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';

export interface SwipeAction {
  icon: string;
  label: string;
  color: string;
  action: string;
}

@Component({
  selector: 'app-swipeable-card',
  template: `
    <div class="swipeable-container" 
         [class.swiping]="isSwiping"
         [style.transform]="getTransform()">
      
      <!-- Left swipe action -->
      <div class="swipe-action swipe-left" 
           [class.revealed]="swipeDistance < -50"
           [style.background-color]="leftAction?.color">
        <mat-icon>{{ leftAction?.icon }}</mat-icon>
        <span class="action-label">{{ leftAction?.label }}</span>
      </div>

      <!-- Card content -->
      <div class="card-content" 
           (touchstart)="onTouchStart($event)"
           (touchmove)="onTouchMove($event)"
           (touchend)="onTouchEnd()"
           (mousedown)="onMouseDown($event)"
           [style.transform]="getContentTransform()">
        <ng-content></ng-content>
      </div>

      <!-- Right swipe action -->
      <div class="swipe-action swipe-right" 
           [class.revealed]="swipeDistance > 50"
           [style.background-color]="rightAction?.color">
        <mat-icon>{{ rightAction?.icon }}</mat-icon>
        <span class="action-label">{{ rightAction?.label }}</span>
      </div>
    </div>
  `,
  styles: [`
    .swipeable-container {
      position: relative;
      overflow: hidden;
      touch-action: pan-y;
      user-select: none;
      -webkit-user-select: none;
      transition: transform 0.3s ease;
    }

    .swipeable-container.swiping {
      transition: none;
    }

    .card-content {
      position: relative;
      z-index: 2;
      background: var(--color-neutral-0, #ffffff);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: grab;
      will-change: transform;
    }

    .card-content:active {
      cursor: grabbing;
    }

    .swipeable-container.swiping .card-content {
      transition: none;
    }

    .swipe-action {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .swipe-action.revealed {
      opacity: 1;
    }

    .swipe-left {
      left: 0;
    }

    .swipe-right {
      right: 0;
    }

    .swipe-action mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      margin-bottom: 4px;
    }

    .action-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Dark theme */
    .dark-theme .card-content {
      background: var(--color-neutral-800, #424242);
    }
  `]
})
export class SwipeableCardComponent {
  @Input() leftAction?: SwipeAction;
  @Input() rightAction?: SwipeAction;
  @Input() swipeThreshold = 100;
  
  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();

  isSwiping = false;
  swipeDistance = 0;
  startX = 0;
  startY = 0;
  currentX = 0;

  constructor(private elementRef: ElementRef) {}

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    
    this.isSwiping = true;
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isSwiping || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;

    // Only swipe horizontally if horizontal movement is greater
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
      this.currentX = deltaX;
      this.updateSwipeDistance();
    }
  }

  onTouchEnd(): void {
    if (!this.isSwiping) return;

    this.isSwiping = false;
    this.handleSwipeEnd();
  }

  onMouseDown(event: MouseEvent): void {
    this.isSwiping = true;
    this.startX = event.clientX;
    this.startY = event.clientY;

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isSwiping) return;
      
      const deltaX = e.clientX - this.startX;
      const deltaY = e.clientY - this.startY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault();
        this.currentX = deltaX;
        this.updateSwipeDistance();
      }
    };

    const onMouseUp = () => {
      this.isSwiping = false;
      this.handleSwipeEnd();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  private updateSwipeDistance(): void {
    const maxDistance = 150;
    
    // Limit swipe distance
    if (this.currentX > 0 && this.rightAction) {
      this.swipeDistance = Math.min(this.currentX, maxDistance);
    } else if (this.currentX < 0 && this.leftAction) {
      this.swipeDistance = Math.max(this.currentX, -maxDistance);
    } else {
      this.swipeDistance = 0;
    }
  }

  private handleSwipeEnd(): void {
    if (Math.abs(this.swipeDistance) > this.swipeThreshold) {
      // Trigger action
      if (this.swipeDistance > 0) {
        this.swipeRight.emit();
      } else {
        this.swipeLeft.emit();
      }
    }

    // Reset
    this.swipeDistance = 0;
    this.currentX = 0;
  }

  getTransform(): string {
    return '';
  }

  getContentTransform(): string {
    if (this.swipeDistance !== 0) {
      return `translateX(${this.swipeDistance}px)`;
    }
    return '';
  }
}
