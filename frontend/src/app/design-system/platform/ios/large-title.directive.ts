import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

/**
 * Directive iOS — Large Title pattern (Cupertino HIG).
 * Ajoute la classe `ios-large-title` et gère la transition
 * vers le titre compact à l'usage de `(scroll)`.
 *
 * Usage : <h1 dsLargeTitle [compact]="isScrolled">Titre</h1>
 */
@Directive({
  selector: '[dsLargeTitle]',
  standalone: true,
  host: {
    class: 'ds-ios-large-title',
    '[class.ds-ios-large-title--compact]': 'compact',
  },
})
export class LargeTitleDirective implements OnInit {
  @Input() compact = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.renderer.setStyle(this.el.nativeElement, 'font-family', 'var(--ds-font-display)');
    this.renderer.setStyle(this.el.nativeElement, 'font-size', this.compact ? '17px' : '34px');
    this.renderer.setStyle(this.el.nativeElement, 'font-weight', '700');
    this.renderer.setStyle(this.el.nativeElement, 'letter-spacing', this.compact ? '-0.2px' : '-0.5px');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'font-size 200ms ease, letter-spacing 200ms ease');
  }
}
