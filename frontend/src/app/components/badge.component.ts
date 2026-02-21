import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'soft';
  @Input() size: BadgeSize = 'md';
  @Input() color: BadgeColor = 'neutral';
  @Input() pill = false;
  @Input() pulse = false;
  @Input() dot = false;
  @Input() icon?: string;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() ariaLabel?: string;

  getBadgeClasses(): string {
    const classes: string[] = ['badge'];
    
    classes.push(`badge-${this.variant}`);
    classes.push(`badge-${this.size}`);
    classes.push(`badge-${this.color}`);
    
    if (this.pill) {
      classes.push('badge-pill');
    }
    
    if (this.pulse) {
      classes.push('badge-pulse');
    }
    
    if (this.dot) {
      classes.push('badge-with-dot');
    }
    
    if (this.icon) {
      classes.push('badge-with-icon');
    }
    
    return classes.join(' ');
  }

  getDotClasses(): string {
    return `badge-dot badge-dot-${this.color}`;
  }

  get hasIcon(): boolean {
    return !!this.icon;
  }

  get showIconLeft(): boolean {
    return this.hasIcon && this.iconPosition === 'left';
  }

  get showIconRight(): boolean {
    return this.hasIcon && this.iconPosition === 'right';
  }
}
