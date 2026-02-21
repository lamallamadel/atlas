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

export interface BadgeConfig {
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  pill?: boolean;
  pulse?: boolean;
  dot?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  ariaLabel?: string;
}

export interface PropertyStatusBadge {
  status: PropertyStatus;
  label: string;
  color: BadgeColor;
  icon: string;
}

export type PropertyStatus = 
  | 'SOLD'
  | 'RENTED'
  | 'SIGNED'
  | 'AVAILABLE'
  | 'PENDING'
  | 'RESERVED'
  | 'WITHDRAWN';

export type DossierStatus = 
  | 'NEW'
  | 'QUALIFYING'
  | 'QUALIFIED'
  | 'APPOINTMENT'
  | 'WON'
  | 'LOST';

export type LeadUrgency = 
  | 'NORMAL'
  | 'ATTENTION'
  | 'URGENT'
  | 'CRITICAL';

export const PROPERTY_STATUS_BADGES: Record<PropertyStatus, PropertyStatusBadge> = {
  SOLD: {
    status: 'SOLD',
    label: 'Vendu',
    color: 'success-sold',
    icon: 'sell'
  },
  RENTED: {
    status: 'RENTED',
    label: 'Loué',
    color: 'success-rented',
    icon: 'key'
  },
  SIGNED: {
    status: 'SIGNED',
    label: 'Signé',
    color: 'success-signed',
    icon: 'done_all'
  },
  AVAILABLE: {
    status: 'AVAILABLE',
    label: 'Disponible',
    color: 'success',
    icon: 'home'
  },
  PENDING: {
    status: 'PENDING',
    label: 'En attente',
    color: 'warning-attention',
    icon: 'pending'
  },
  RESERVED: {
    status: 'RESERVED',
    label: 'Réservé',
    color: 'warning-urgent',
    icon: 'lock_clock'
  },
  WITHDRAWN: {
    status: 'WITHDRAWN',
    label: 'Retiré',
    color: 'neutral-warmth',
    icon: 'block'
  }
};

export const DOSSIER_STATUS_BADGES = {
  NEW: {
    label: 'Nouveau',
    color: 'info' as BadgeColor,
    icon: 'fiber_new',
    pulse: true
  },
  QUALIFYING: {
    label: 'Qualification',
    color: 'warning-attention' as BadgeColor,
    icon: 'schedule',
    pulse: true
  },
  QUALIFIED: {
    label: 'Qualifié',
    color: 'success' as BadgeColor,
    icon: 'verified',
    pulse: false
  },
  APPOINTMENT: {
    label: 'Rendez-vous',
    color: 'info' as BadgeColor,
    icon: 'event',
    pulse: false
  },
  WON: {
    label: 'Gagné',
    color: 'success' as BadgeColor,
    icon: 'check_circle',
    pulse: false
  },
  LOST: {
    label: 'Perdu',
    color: 'danger-soft' as BadgeColor,
    icon: 'cancel',
    pulse: false
  }
};

export const LEAD_URGENCY_BADGES = {
  NORMAL: {
    label: 'Normal',
    color: 'neutral' as BadgeColor,
    icon: 'schedule',
    pulse: false
  },
  ATTENTION: {
    label: 'À suivre',
    color: 'warning-attention' as BadgeColor,
    icon: 'schedule',
    pulse: false
  },
  URGENT: {
    label: 'Urgent',
    color: 'warning-urgent' as BadgeColor,
    icon: 'warning',
    pulse: true
  },
  CRITICAL: {
    label: 'Critique',
    color: 'warning-critical' as BadgeColor,
    icon: 'error',
    pulse: true
  }
};

export function getPropertyStatusBadge(status: PropertyStatus): PropertyStatusBadge {
  return PROPERTY_STATUS_BADGES[status];
}

export function getDossierStatusBadgeConfig(status: DossierStatus): BadgeConfig {
  const config = DOSSIER_STATUS_BADGES[status];
  return {
    variant: 'soft',
    size: 'md',
    ...config
  };
}

export function getLeadUrgencyBadgeConfig(urgency: LeadUrgency): BadgeConfig {
  const config = LEAD_URGENCY_BADGES[urgency];
  return {
    variant: urgency === 'URGENT' || urgency === 'CRITICAL' ? 'solid' : 'soft',
    size: 'md',
    ...config
  };
}

export function createNotificationBadge(count: number): BadgeConfig {
  return {
    variant: 'solid',
    color: count > 0 ? 'danger' : 'neutral',
    size: 'sm',
    pill: true,
    pulse: count > 0,
    ariaLabel: `${count} notification${count > 1 ? 's' : ''} non lue${count > 1 ? 's' : ''}`
  };
}

export function createOnlineStatusBadge(isOnline: boolean): BadgeConfig {
  return {
    variant: 'soft',
    color: isOnline ? 'success' : 'neutral',
    size: 'sm',
    dot: true,
    pulse: isOnline,
    ariaLabel: isOnline ? 'En ligne' : 'Hors ligne'
  };
}

export function createTagBadge(label: string, color?: BadgeColor): BadgeConfig {
  return {
    variant: 'soft',
    color: color || 'primary',
    size: 'sm',
    pill: true
  };
}
