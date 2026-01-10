import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

export type AnnounceMode = 'polite' | 'assertive' | 'off';

@Injectable({
  providedIn: 'root'
})
export class AriaLiveAnnouncerService {
  private renderer: Renderer2;
  private politeElement: HTMLElement | null = null;
  private assertiveElement: HTMLElement | null = null;

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.createLiveRegions();
  }

  private createLiveRegions(): void {
    if (typeof document !== 'undefined') {
      this.politeElement = this.createLiveRegion('polite');
      this.assertiveElement = this.createLiveRegion('assertive');
    }
  }

  private createLiveRegion(mode: 'polite' | 'assertive'): HTMLElement {
    const element = this.renderer.createElement('div');
    this.renderer.setAttribute(element, 'aria-live', mode);
    this.renderer.setAttribute(element, 'aria-atomic', 'true');
    this.renderer.setAttribute(element, 'class', `cdk-visually-hidden aria-live-${mode}`);
    this.renderer.setStyle(element, 'position', 'absolute');
    this.renderer.setStyle(element, 'width', '1px');
    this.renderer.setStyle(element, 'height', '1px');
    this.renderer.setStyle(element, 'margin', '-1px');
    this.renderer.setStyle(element, 'padding', '0');
    this.renderer.setStyle(element, 'overflow', 'hidden');
    this.renderer.setStyle(element, 'clip', 'rect(0, 0, 0, 0)');
    this.renderer.setStyle(element, 'white-space', 'nowrap');
    this.renderer.setStyle(element, 'border', '0');
    this.renderer.appendChild(document.body, element);
    return element;
  }

  announce(message: string, mode: AnnounceMode = 'polite', clearDelay = 100): void {
    if (!message || mode === 'off') {
      return;
    }

    const element = mode === 'assertive' ? this.assertiveElement : this.politeElement;
    
    if (element) {
      this.renderer.setProperty(element, 'textContent', '');
      
      setTimeout(() => {
        this.renderer.setProperty(element, 'textContent', message);
        
        if (clearDelay > 0) {
          setTimeout(() => {
            this.renderer.setProperty(element, 'textContent', '');
          }, clearDelay);
        }
      }, 50);
    }
  }

  announcePolite(message: string): void {
    this.announce(message, 'polite');
  }

  announceAssertive(message: string): void {
    this.announce(message, 'assertive');
  }

  clear(mode?: AnnounceMode): void {
    if (mode === 'assertive' && this.assertiveElement) {
      this.renderer.setProperty(this.assertiveElement, 'textContent', '');
    } else if (mode === 'polite' && this.politeElement) {
      this.renderer.setProperty(this.politeElement, 'textContent', '');
    } else if (!mode) {
      if (this.politeElement) {
        this.renderer.setProperty(this.politeElement, 'textContent', '');
      }
      if (this.assertiveElement) {
        this.renderer.setProperty(this.assertiveElement, 'textContent', '');
      }
    }
  }
}
