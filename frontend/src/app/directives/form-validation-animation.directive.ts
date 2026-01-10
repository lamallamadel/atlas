import { Directive, ElementRef, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appFormValidationAnimation]'
})
export class FormValidationAnimationDirective implements OnInit, OnDestroy {
  private statusChangeSubscription?: Subscription;
  private errorContainer?: HTMLElement;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private control: NgControl
  ) {}

  ngOnInit(): void {
    if (this.control && this.control.control) {
      this.statusChangeSubscription = this.control.control.statusChanges.subscribe(() => {
        this.updateValidationState();
      });

      const formField = this.findFormField();
      if (formField) {
        this.errorContainer = this.renderer.createElement('div');
        this.renderer.addClass(this.errorContainer, 'validation-error-container');
        this.renderer.setStyle(this.errorContainer, 'overflow', 'hidden');
        this.renderer.setStyle(this.errorContainer, 'transition', 'max-height 300ms cubic-bezier(0.4, 0, 0.2, 1)');
        this.renderer.setStyle(this.errorContainer, 'max-height', '0');
        this.renderer.insertBefore(formField, this.errorContainer, this.el.nativeElement.nextSibling);
      }
    }
  }

  ngOnDestroy(): void {
    this.statusChangeSubscription?.unsubscribe();
    if (this.errorContainer) {
      this.renderer.removeChild(this.errorContainer.parentNode, this.errorContainer);
    }
  }

  private findFormField(): HTMLElement | null {
    let element = this.el.nativeElement;
    while (element && element.parentElement) {
      if (element.parentElement.classList.contains('mat-mdc-form-field') ||
          element.parentElement.classList.contains('form-field')) {
        return element.parentElement;
      }
      element = element.parentElement;
    }
    return null;
  }

  private updateValidationState(): void {
    if (!this.control || !this.control.control || !this.errorContainer) {
      return;
    }

    const control = this.control.control;
    const isInvalid = control.invalid && (control.dirty || control.touched);

    if (isInvalid) {
      this.renderer.addClass(this.el.nativeElement, 'validation-error');
      
      const errorMessage = this.getErrorMessage();
      if (errorMessage) {
        this.errorContainer.innerHTML = `<div class="error-message">${errorMessage}</div>`;
        this.renderer.setStyle(this.errorContainer, 'max-height', `${this.errorContainer.scrollHeight}px`);
        
        setTimeout(() => {
          if (this.errorContainer) {
            this.renderer.setStyle(this.errorContainer, 'max-height', 'none');
          }
        }, 300);
      }
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'validation-error');
      this.renderer.setStyle(this.errorContainer, 'max-height', '0');
      
      setTimeout(() => {
        if (this.errorContainer) {
          this.errorContainer.innerHTML = '';
        }
      }, 300);
    }
  }

  private getErrorMessage(): string {
    if (!this.control || !this.control.control || !this.control.errors) {
      return '';
    }

    const errors = this.control.errors;
    
    if (errors['required']) {
      return 'Ce champ est requis';
    }
    if (errors['email']) {
      return 'Email invalide';
    }
    if (errors['minlength']) {
      return `Minimum ${errors['minlength'].requiredLength} caractères requis`;
    }
    if (errors['maxlength']) {
      return `Maximum ${errors['maxlength'].requiredLength} caractères autorisés`;
    }
    if (errors['pattern']) {
      return 'Format invalide';
    }
    if (errors['min']) {
      return `La valeur minimum est ${errors['min'].min}`;
    }
    if (errors['max']) {
      return `La valeur maximum est ${errors['max'].max}`;
    }

    return 'Champ invalide';
  }
}
