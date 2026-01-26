import { Directive, ElementRef, HostListener, Renderer2, OnInit } from '@angular/core';

/**
 * Directive that adds hover animations to buttons
 * Scales to 1.02 and adds shadow-lg on hover
 */
@Directive({
  selector: 'button[appAnimatedButton], a[appAnimatedButton]'
})
export class AnimatedButtonDirective implements OnInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)');
    this.renderer.setStyle(this.el.nativeElement, 'transform-origin', 'center');
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.el.nativeElement.disabled) {
      this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1.02)');
      this.renderer.addClass(this.el.nativeElement, 'shadow-lg');
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1)');
    this.renderer.removeClass(this.el.nativeElement, 'shadow-lg');
  }

  @HostListener('mousedown')
  onMouseDown(): void {
    if (!this.el.nativeElement.disabled) {
      this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(0.98)');
    }
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    if (!this.el.nativeElement.disabled) {
      this.renderer.setStyle(this.el.nativeElement, 'transform', 'scale(1.02)');
    }
  }
}
