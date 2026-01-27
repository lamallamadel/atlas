import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  deltaX: number;
  deltaY: number;
  target: HTMLElement;
}

@Directive({
  selector: '[appSwipeGesture]'
})
export class SwipeGestureDirective {
  @Input() swipeThreshold = 50;
  @Input() swipeVelocityThreshold = 0.3;
  @Input() enableSwipeLeft = true;
  @Input() enableSwipeRight = true;
  @Input() enableSwipeUp = false;
  @Input() enableSwipeDown = false;
  
  @Output() swipe = new EventEmitter<SwipeEvent>();
  @Output() swipeLeft = new EventEmitter<SwipeEvent>();
  @Output() swipeRight = new EventEmitter<SwipeEvent>();
  @Output() swipeUp = new EventEmitter<SwipeEvent>();
  @Output() swipeDown = new EventEmitter<SwipeEvent>();
  @Output() swipeStart = new EventEmitter<TouchEvent>();
  @Output() swipeMove = new EventEmitter<{ progress: number; direction: string }>();
  @Output() swipeCancel = new EventEmitter<void>();

  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private isSwiping = false;
  private currentDirection: 'left' | 'right' | 'up' | 'down' | null = null;

  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
    this.startTime = Date.now();
    this.isSwiping = true;
    this.currentDirection = null;
    this.swipeStart.emit(event);
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isSwiping) return;

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;
    const deltaX = currentX - this.startX;
    const deltaY = currentY - this.startY;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine direction
    if (absDeltaX > absDeltaY) {
      this.currentDirection = deltaX > 0 ? 'right' : 'left';
      const progress = Math.min(Math.abs(deltaX) / this.swipeThreshold, 1);
      this.swipeMove.emit({ progress, direction: this.currentDirection });
    } else {
      this.currentDirection = deltaY > 0 ? 'down' : 'up';
      const progress = Math.min(Math.abs(deltaY) / this.swipeThreshold, 1);
      this.swipeMove.emit({ progress, direction: this.currentDirection });
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (!this.isSwiping) return;

    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;
    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const deltaTime = Date.now() - this.startTime;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const velocity = Math.max(absDeltaX, absDeltaY) / deltaTime;

    // Determine if it's a valid swipe
    if (velocity >= this.swipeVelocityThreshold || absDeltaX >= this.swipeThreshold || absDeltaY >= this.swipeThreshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && this.enableSwipeRight) {
          this.emitSwipe('right', deltaX, deltaY);
        } else if (deltaX < 0 && this.enableSwipeLeft) {
          this.emitSwipe('left', deltaX, deltaY);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && this.enableSwipeDown) {
          this.emitSwipe('down', deltaX, deltaY);
        } else if (deltaY < 0 && this.enableSwipeUp) {
          this.emitSwipe('up', deltaX, deltaY);
        }
      }
    } else {
      this.swipeCancel.emit();
    }

    this.isSwiping = false;
    this.currentDirection = null;
  }

  @HostListener('touchcancel', ['$event'])
  onTouchCancel(): void {
    this.isSwiping = false;
    this.currentDirection = null;
    this.swipeCancel.emit();
  }

  private emitSwipe(direction: 'left' | 'right' | 'up' | 'down', deltaX: number, deltaY: number): void {
    const swipeEvent: SwipeEvent = {
      direction,
      deltaX,
      deltaY,
      target: this.el.nativeElement
    };

    this.swipe.emit(swipeEvent);

    switch (direction) {
      case 'left':
        this.swipeLeft.emit(swipeEvent);
        break;
      case 'right':
        this.swipeRight.emit(swipeEvent);
        break;
      case 'up':
        this.swipeUp.emit(swipeEvent);
        break;
      case 'down':
        this.swipeDown.emit(swipeEvent);
        break;
    }
  }
}
