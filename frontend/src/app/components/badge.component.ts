import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

export type BadgeVariant = 'solid' | 'outline' | 'soft';
export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeColor = 
  | 'primary' 
  | 'success' 
  | 'success-sold' 
  | 'success-rented' 
  | 'success-signed'
  | 'warning' 
  | 'warning-attention' 
  | 'warning-urgent' 
  | 'warning-critical'
  | 'danger' 
  | 'danger-soft'
  | 'info' 
  | 'neutral' 
  | 'neutral-warmth';

@Component({
    selector: 'app-badge',
    templateUrl: './badge.component.html',
    styleUrls: ['./badge.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIcon]
})
export class BadgeComponent {
  readonly variant = input<BadgeVariant>('soft');
  readonly size = input<BadgeSize>('md');
  readonly color = input<BadgeColor>('neutral');
  readonly pill = input(false);
  readonly pulse = input(false);
  readonly dot = input(false);
  readonly icon = input<string>();
  readonly iconPosition = input<'left' | 'right'>('left');
  readonly ariaLabel = input<string>();

  getBadgeClasses(): string {
    const classes: string[] = ['badge'];
    
    classes.push(`badge-${this.variant()}`);
    classes.push(`badge-${this.size()}`);
    classes.push(`badge-${this.color()}`);
    
    if (this.pill()) {
      classes.push('badge-pill');
    }
    
    if (this.pulse()) {
      classes.push('badge-pulse');
    }
    
    if (this.dot()) {
      classes.push('badge-with-dot');
    }
    
    if (this.icon()) {
      classes.push('badge-with-icon');
    }
    
    return classes.join(' ');
  }

  getDotClasses(): string {
    return `badge-dot badge-dot-${this.color()}`;
  }

  get hasIcon(): boolean {
    return !!this.icon();
  }

  get showIconLeft(): boolean {
    return this.hasIcon && this.iconPosition() === 'left';
  }

  get showIconRight(): boolean {
    return this.hasIcon && this.iconPosition() === 'right';
  }
}
