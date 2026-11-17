import { Directive, ElementRef, HostListener, Input, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[dsRipple]',
  standalone: true,
})
export class DsRippleDirective {
  @Input('dsRippleColor') color = 'rgba(255,255,255,0.3)';
  @Input('dsRippleDisabled') disabled = false;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (this.disabled) {
      return;
    }

    const el = this.host.nativeElement;
    const rect = el.getBoundingClientRect();
    const diameter = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - diameter / 2;
    const y = event.clientY - rect.top - diameter / 2;

    const ripple: HTMLSpanElement = this.renderer.createElement('span');
    const s = ripple.style;
    s.position = 'absolute';
    s.left = `${x}px`;
    s.top = `${y}px`;
    s.width = `${diameter}px`;
    s.height = `${diameter}px`;
    s.borderRadius = '50%';
    s.background = this.color;
    s.pointerEvents = 'none';
    s.transform = 'scale(0)';
    s.opacity = '1';
    s.transition = 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms linear';

    this.renderer.appendChild(el, ripple);

    requestAnimationFrame(() => {
      s.transform = 'scale(1)';
      s.opacity = '0';
    });

    window.setTimeout(() => {
      if (ripple.parentNode === el) {
        this.renderer.removeChild(el, ripple);
      }
    }, 550);
  }
}
