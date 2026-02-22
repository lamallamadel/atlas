import { Directive, ElementRef, HostListener, Renderer2, OnInit, Input } from '@angular/core';

/**
 * Directive that adds pulse animation to border on focus
 */
@Directive({
  selector: 'input[appAnimatedFocus], textarea[appAnimatedFocus], select[appAnimatedFocus], [contenteditable][appAnimatedFocus]'
})
export class AnimatedFocusDirective implements OnInit {
  @Input() pulseColor = 'rgba(59, 130, 246, 0.5)';
  @Input() pulseSize = '3px';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'box-shadow 200ms ease-out');
  }

  @HostListener('focus')
  onFocus(): void {
    this.renderer.setStyle(
      this.el.nativeElement,
      'box-shadow',
      `0 0 0 ${this.pulseSize} ${this.pulseColor}`
    );
  }

  @HostListener('blur')
  onBlur(): void {
    this.renderer.setStyle(
      this.el.nativeElement,
      'box-shadow',
      '0 0 0 0 rgba(59, 130, 246, 0)'
    );
  }
}
