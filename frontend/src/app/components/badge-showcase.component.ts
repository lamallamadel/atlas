import { Component } from '@angular/core';
import { BadgeVariant, BadgeSize, BadgeColor } from './badge.component';

interface BadgeExample {
  label: string;
  variant: BadgeVariant;
  color: BadgeColor;
  size: BadgeSize;
  pill?: boolean;
  pulse?: boolean;
  dot?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

@Component({
  selector: 'app-badge-showcase',
  templateUrl: './badge-showcase.component.html',
  styleUrls: ['./badge-showcase.component.css']
})
export class BadgeShowcaseComponent {
  variants: BadgeVariant[] = ['solid', 'outline', 'soft'];
  sizes: BadgeSize[] = ['sm', 'md', 'lg'];
  colors: BadgeColor[] = [
    'primary',
    'success',
    'success-sold',
    'success-rented',
    'success-signed',
    'warning',
    'warning-attention',
    'warning-urgent',
    'warning-critical',
    'danger',
    'danger-soft',
    'info',
    'neutral',
    'neutral-warmth'
  ];

  realEstateExamples: BadgeExample[] = [
    {
      label: 'Vendu',
      variant: 'soft',
      color: 'success-sold',
      size: 'md',
      icon: 'sell',
      iconPosition: 'left'
    },
    {
      label: 'Loué',
      variant: 'soft',
      color: 'success-rented',
      size: 'md',
      icon: 'key',
      iconPosition: 'left'
    },
    {
      label: 'Signé',
      variant: 'soft',
      color: 'success-signed',
      size: 'md',
      icon: 'done_all',
      iconPosition: 'left'
    },
    {
      label: 'Disponible',
      variant: 'soft',
      color: 'success',
      size: 'md',
      icon: 'home',
      iconPosition: 'left'
    },
    {
      label: 'En attente',
      variant: 'soft',
      color: 'warning-attention',
      size: 'md',
      icon: 'pending',
      iconPosition: 'left'
    },
    {
      label: 'Réservé',
      variant: 'soft',
      color: 'warning-urgent',
      size: 'md',
      icon: 'lock_clock',
      iconPosition: 'left'
    },
    {
      label: 'Urgent',
      variant: 'solid',
      color: 'warning-critical',
      size: 'md',
      icon: 'warning',
      iconPosition: 'left',
      pulse: true
    },
    {
      label: 'Retiré',
      variant: 'outline',
      color: 'neutral-warmth',
      size: 'md',
      icon: 'block',
      iconPosition: 'left'
    }
  ];

  notificationExamples: BadgeExample[] = [
    {
      label: '3',
      variant: 'solid',
      color: 'danger',
      size: 'sm',
      pill: true,
      pulse: true
    },
    {
      label: 'Nouveau',
      variant: 'soft',
      color: 'info',
      size: 'sm',
      dot: true
    },
    {
      label: '12 messages',
      variant: 'soft',
      color: 'primary',
      size: 'sm',
      dot: true,
      icon: 'mail',
      iconPosition: 'left'
    },
    {
      label: 'En ligne',
      variant: 'soft',
      color: 'success',
      size: 'sm',
      dot: true,
      pulse: true
    }
  ];

  pillExamples: BadgeExample[] = [
    {
      label: 'Nouveau client',
      variant: 'solid',
      color: 'primary',
      size: 'md',
      pill: true
    },
    {
      label: 'Premium',
      variant: 'solid',
      color: 'warning-attention',
      size: 'md',
      pill: true,
      icon: 'star',
      iconPosition: 'left'
    },
    {
      label: 'Vérifié',
      variant: 'soft',
      color: 'success',
      size: 'md',
      pill: true,
      icon: 'verified',
      iconPosition: 'left'
    },
    {
      label: 'Beta',
      variant: 'outline',
      color: 'info',
      size: 'sm',
      pill: true
    }
  ];

  pulseExamples: BadgeExample[] = [
    {
      label: 'Nouveau',
      variant: 'solid',
      color: 'info',
      size: 'md',
      pulse: true,
      icon: 'fiber_new',
      iconPosition: 'left'
    },
    {
      label: 'Action requise',
      variant: 'solid',
      color: 'warning-critical',
      size: 'md',
      pulse: true,
      icon: 'warning',
      iconPosition: 'left'
    },
    {
      label: 'En direct',
      variant: 'soft',
      color: 'danger',
      size: 'md',
      pulse: true,
      dot: true
    },
    {
      label: 'Actif',
      variant: 'soft',
      color: 'success',
      size: 'md',
      pulse: true,
      dot: true
    }
  ];

  getColorLabel(color: BadgeColor): string {
    const labels: Record<BadgeColor, string> = {
      'primary': 'Primary',
      'success': 'Success',
      'success-sold': 'Success Sold',
      'success-rented': 'Success Rented',
      'success-signed': 'Success Signed',
      'warning': 'Warning',
      'warning-attention': 'Warning Attention',
      'warning-urgent': 'Warning Urgent',
      'warning-critical': 'Warning Critical',
      'danger': 'Danger',
      'danger-soft': 'Danger Soft',
      'info': 'Info',
      'neutral': 'Neutral',
      'neutral-warmth': 'Neutral Warmth'
    };
    return labels[color];
  }
}
