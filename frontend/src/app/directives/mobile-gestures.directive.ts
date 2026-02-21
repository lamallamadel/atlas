import { Directive, ElementRef, EventEmitter, HostListener, Input, Output, OnDestroy } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

export interface PinchEvent {
  scale: number;
  centerX: number;
  centerY: number;
}

/**
 * Directive for mobile gesture handling
 * Provides swipe, long-press, pinch-zoom, and double-tap gestures
 */
@Directive({
  selector: '[appMobileGestures]',
  standalone: true
})
export class MobileGesturesDirective implements OnDestroy {
  @Input() swipeThreshold: number = 50; // pixels
  @Input() longPressDelay: number = 500; // ms
  @Input() doubleTapDelay: number = 300; // ms
  @Input() enableHaptics: boolean = true;
  @Input() preventContextMenu: boolean = true;

  @Output() swipe = new EventEmitter<SwipeEvent>();
  @Output() swipeLeft = new EventEmitter<SwipeEvent>();
  @Output() swipeRight = new EventEmitter<SwipeEvent>();
  @Output() swipeUp = new EventEmitter<SwipeEvent>();
  @Output() swipeDown = new EventEmitter<SwipeEvent>();
  @Output() longPress = new EventEmitter<TouchEvent>();
  @Output() doubleTap = new EventEmitter<TouchEvent>();
  @Output() pinch = new EventEmitter<PinchEvent>();

  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private lastTapTime: number = 0;
  private longPressTimer: any;
  private initialPinchDistance: number = 0;
  private isNative = Capacitor.isNativePlatform();

  constructor(private el: ElementRef) {
    if (this.preventContextMenu) {
      this.el.nativeElement.style.webkitTouchCallout = 'none';
      this.el.nativeElement.style.webkitUserSelect = 'none';
      this.el.nativeElement.style.userSelect = 'none';
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.handleSingleTouchStart(event);
    } else if (event.touches.length === 2) {
      this.handlePinchStart(event);
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 2) {
      this.handlePinchMove(event);
    } else if (this.longPressTimer) {
      // Cancel long press if finger moves
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (event.changedTouches.length === 1) {
      this.handleSingleTouchEnd(event);
    }

    this.initialPinchDistance = 0;
  }

  @HostListener('touchcancel', ['$event'])
  onTouchCancel(event: TouchEvent): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.initialPinchDistance = 0;
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: Event): void {
    if (this.preventContextMenu) {
      event.preventDefault();
      return;
    }
  }

  private handleSingleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();

    // Setup long press detection
    this.longPressTimer = setTimeout(() => {
      this.handleLongPress(event);
    }, this.longPressDelay);
  }

  private handleSingleTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    const touchEndTime = Date.now();

    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;
    const deltaTime = touchEndTime - this.touchStartTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check for swipe
    if (distance > this.swipeThreshold && deltaTime < 1000) {
      this.handleSwipe(deltaX, deltaY, distance, deltaTime);
      return;
    }

    // Check for double tap
    const timeSinceLastTap = touchEndTime - this.lastTapTime;
    if (timeSinceLastTap < this.doubleTapDelay && distance < 10) {
      this.handleDoubleTap(event);
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = touchEndTime;
    }
  }

  private handleSwipe(deltaX: number, deltaY: number, distance: number, deltaTime: number): void {
    const velocity = distance / deltaTime;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    let direction: 'left' | 'right' | 'up' | 'down';

    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const swipeEvent: SwipeEvent = { direction, distance, velocity };

    if (this.enableHaptics && this.isNative) {
      Haptics.impact({ style: ImpactStyle.Light });
    }

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

  private handleLongPress(event: TouchEvent): void {
    if (this.enableHaptics && this.isNative) {
      Haptics.impact({ style: ImpactStyle.Medium });
    }

    this.longPress.emit(event);
    this.longPressTimer = null;
  }

  private handleDoubleTap(event: TouchEvent): void {
    if (this.enableHaptics && this.isNative) {
      Haptics.impact({ style: ImpactStyle.Light });
    }

    this.doubleTap.emit(event);
  }

  private handlePinchStart(event: TouchEvent): void {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    this.initialPinchDistance = this.getDistance(
      touch1.clientX, touch1.clientY,
      touch2.clientX, touch2.clientY
    );
  }

  private handlePinchMove(event: TouchEvent): void {
    if (this.initialPinchDistance === 0) {
      return;
    }

    event.preventDefault();

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    const currentDistance = this.getDistance(
      touch1.clientX, touch1.clientY,
      touch2.clientX, touch2.clientY
    );

    const scale = currentDistance / this.initialPinchDistance;
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;

    this.pinch.emit({ scale, centerX, centerY });
  }

  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  ngOnDestroy(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }
  }
}
