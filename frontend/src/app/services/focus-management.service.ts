import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class FocusManagementService {
  private focusStack: HTMLElement[] = [];
  private lastFocusedElement: HTMLElement | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  saveFocus(): void {
    if (isPlatformBrowser(this.platformId) && document.activeElement instanceof HTMLElement) {
      this.lastFocusedElement = document.activeElement;
      this.focusStack.push(this.lastFocusedElement);
    }
  }

  restoreFocus(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const previousElement = this.focusStack.pop();
    if (previousElement && typeof previousElement.focus === 'function') {
      setTimeout(() => {
        previousElement.focus();
      }, 100);
    }
  }

  focusElement(selector: string): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const element = document.querySelector(selector) as HTMLElement;
    if (element && typeof element.focus === 'function') {
      setTimeout(() => {
        element.focus();
      }, 100);
      return true;
    }
    return false;
  }

  focusFirstFocusableElement(container: HTMLElement): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      return true;
    }
    return false;
  }

  focusLastFocusableElement(container: HTMLElement): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
      return true;
    }
    return false;
  }

  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    const elements = container.querySelectorAll(focusableSelectors.join(','));
    return Array.from(elements).filter((element) => {
      return element instanceof HTMLElement && 
             !element.hasAttribute('disabled') &&
             element.offsetParent !== null;
    }) as HTMLElement[];
  }

  trapFocus(container: HTMLElement): () => void {
    if (!isPlatformBrowser(this.platformId)) {
      return () => {
        // No-op cleanup function for non-browser platforms
      };
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = this.getFocusableElements(container);
      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    this.focusFirstFocusableElement(container);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }
}
