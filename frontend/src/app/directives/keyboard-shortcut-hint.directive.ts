import { Directive, Input, OnInit, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { KeyboardShortcutService } from '../services/keyboard-shortcut.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appKeyboardShortcutHint]'
})
export class KeyboardShortcutHintDirective implements OnInit, OnDestroy {
  @Input() appKeyboardShortcutHint = '';
  
  private hintElement: HTMLElement | null = null;
  private subscription: Subscription | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private keyboardShortcutService: KeyboardShortcutService
  ) {}

  ngOnInit(): void {
    this.subscription = this.keyboardShortcutService.preferences$.subscribe(prefs => {
      if (prefs.showShortcutHints && this.appKeyboardShortcutHint) {
        this.addHint();
      } else {
        this.removeHint();
      }
    });
  }

  ngOnDestroy(): void {
    this.removeHint();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private addHint(): void {
    if (this.hintElement) {
      return;
    }

    this.hintElement = this.renderer.createElement('span');
    this.renderer.addClass(this.hintElement, 'keyboard-hint');
    
    const text = this.renderer.createText(this.appKeyboardShortcutHint);
    this.renderer.appendChild(this.hintElement, text);
    
    const hostElement = this.el.nativeElement;
    this.renderer.setStyle(hostElement, 'position', 'relative');
    this.renderer.appendChild(hostElement, this.hintElement);
  }

  private removeHint(): void {
    if (this.hintElement) {
      this.renderer.removeChild(this.el.nativeElement, this.hintElement);
      this.hintElement = null;
    }
  }
}
