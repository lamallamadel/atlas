import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../../icons/ds-icon.component';
import { DsRippleDirective } from './ds-ripple.directive';

export type DsButtonVariant = 'marine' | 'copper' | 'ghost' | 'danger' | 'icon';
export type DsButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ds-button',
  standalone: true,
  imports: [CommonModule, DsRippleDirective, DsIconComponent],
  template: `
    <button
      [attr.type]="nativeType"
      [class]="classes"
      [disabled]="disabled || loading"
      [attr.aria-busy]="loading"
      [attr.aria-label]="ariaLabel || null"
      dsRipple
      [dsRippleColor]="rippleColor"
      [dsRippleDisabled]="disabled || loading"
      (click)="onClick($event)">
      @if (loading) {
        <span class="ds-btn__spinner" aria-hidden="true"></span>
      }
      @if (!loading && prefixIcon) {
        <span class="ds-btn__icon" aria-hidden="true"><ds-icon [name]="prefixIcon!" [size]="16"></ds-icon></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styleUrls: ['./ds-button.component.scss'],
})
export class DsButtonComponent {
  /** Par défaut `button` pour éviter une soumission involontaire dans les <form>. */
  @Input() nativeType: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: DsButtonVariant = 'marine';
  @Input() size: DsButtonSize = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() prefixIcon: string | null = null;
  @Input() ariaLabel: string | null = null;
  @Output() dsClick = new EventEmitter<MouseEvent>();

  get classes(): string {
    return [
      'ds-btn',
      `ds-btn--${this.variant}`,
      `ds-btn--${this.size}`,
      this.loading ? 'ds-btn--loading' : '',
      this.disabled ? 'ds-btn--disabled' : '',
    ].filter(Boolean).join(' ');
  }

  get rippleColor(): string {
    const map: Record<DsButtonVariant, string> = {
      marine:  'rgba(255,255,255,0.15)',
      copper:  'rgba(255,255,255,0.15)',
      ghost:   'rgba(13,44,74,0.08)',
      danger:  'rgba(255,255,255,0.15)',
      icon:    'rgba(13,44,74,0.08)',
    };
    return map[this.variant] ?? 'rgba(0,0,0,0.06)';
  }

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.dsClick.emit(event);
    }
  }
}
