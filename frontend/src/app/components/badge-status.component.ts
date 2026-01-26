import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type EntityType = 'annonce' | 'dossier' | 'property';

export type AnnonceStatusType = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type DossierStatusType = 'NEW' | 'QUALIFYING' | 'QUALIFIED' | 'APPOINTMENT' | 'WON' | 'LOST';
export type PropertyStatusType = 'SOLD' | 'RENTED' | 'SIGNED' | 'AVAILABLE' | 'PENDING' | 'RESERVED' | 'WITHDRAWN';

interface StatusConfig {
  label: string;
  icon: string;
  description: string;
  isPulse?: boolean;
  variant?: 'success-sold' | 'success-rented' | 'success-signed' | 'success' | 
            'warning-attention' | 'warning-urgent' | 'warning-critical' | 
            'danger-soft' | 'danger' | 'neutral' | 'neutral-warmth' | 'info';
}

@Component({
  selector: 'app-badge-status',
  templateUrl: './badge-status.component.html',
  styleUrls: ['./badge-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeStatusComponent {
  @Input() status!: string;
  @Input() entityType!: EntityType;

  getStatusClass(): string {
    if (this.entityType === 'annonce') {
      return this.getAnnonceStatusClass(this.status as AnnonceStatusType);
    } else if (this.entityType === 'dossier') {
      return this.getDossierStatusClass(this.status as DossierStatusType);
    } else if (this.entityType === 'property') {
      return this.getPropertyStatusClass(this.status as PropertyStatusType);
    }
    return '';
  }

  getStatusConfig(): StatusConfig {
    if (this.entityType === 'annonce') {
      return this.getAnnonceStatusConfig(this.status as AnnonceStatusType);
    } else if (this.entityType === 'dossier') {
      return this.getDossierStatusConfig(this.status as DossierStatusType);
    } else if (this.entityType === 'property') {
      return this.getPropertyStatusConfig(this.status as PropertyStatusType);
    }
    return { label: this.status, icon: 'circle', description: '' };
  }

  getStatusLabel(): string {
    return this.getStatusConfig().label;
  }

  getStatusIcon(): string {
    return this.getStatusConfig().icon;
  }

  getStatusDescription(): string {
    return this.getStatusConfig().description;
  }

  shouldPulse(): boolean {
    return this.getStatusConfig().isPulse || false;
  }

  private getAnnonceStatusClass(status: AnnonceStatusType): string {
    switch (status) {
      case 'DRAFT':
        return 'badge-status badge-draft';
      case 'PUBLISHED':
        return 'badge-status badge-active';
      case 'ACTIVE':
        return 'badge-status badge-active';
      case 'PAUSED':
        return 'badge-status badge-paused';
      case 'ARCHIVED':
        return 'badge-status badge-archived';
      default:
        return 'badge-status';
    }
  }

  private getDossierStatusClass(status: DossierStatusType): string {
    switch (status) {
      case 'NEW':
        return 'badge-status badge-new';
      case 'QUALIFYING':
        return 'badge-status badge-qualifying';
      case 'QUALIFIED':
        return 'badge-status badge-qualified';
      case 'APPOINTMENT':
        return 'badge-status badge-appointment';
      case 'WON':
        return 'badge-status badge-won';
      case 'LOST':
        return 'badge-status badge-lost';
      default:
        return 'badge-status';
    }
  }

  private getPropertyStatusClass(status: PropertyStatusType): string {
    switch (status) {
      case 'SOLD':
        return 'badge-status badge-property-sold';
      case 'RENTED':
        return 'badge-status badge-property-rented';
      case 'SIGNED':
        return 'badge-status badge-property-signed';
      case 'AVAILABLE':
        return 'badge-status badge-property-available';
      case 'PENDING':
        return 'badge-status badge-property-pending';
      case 'RESERVED':
        return 'badge-status badge-property-reserved';
      case 'WITHDRAWN':
        return 'badge-status badge-property-withdrawn';
      default:
        return 'badge-status';
    }
  }

  private getAnnonceStatusConfig(status: AnnonceStatusType): StatusConfig {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Brouillon',
          icon: 'edit',
          description: 'Annonce en cours de rédaction',
          variant: 'neutral'
        };
      case 'PUBLISHED':
        return {
          label: 'Publié',
          icon: 'check_circle',
          description: 'Annonce publiée et visible',
          isPulse: true,
          variant: 'success'
        };
      case 'ACTIVE':
        return {
          label: 'Actif',
          icon: 'check_circle',
          description: 'Annonce active et visible',
          isPulse: true,
          variant: 'success'
        };
      case 'PAUSED':
        return {
          label: 'En pause',
          icon: 'pause_circle',
          description: 'Annonce temporairement suspendue',
          variant: 'warning-urgent'
        };
      case 'ARCHIVED':
        return {
          label: 'Archivé',
          icon: 'archive',
          description: 'Annonce archivée',
          variant: 'neutral-warmth'
        };
      default:
        return {
          label: status,
          icon: 'circle',
          description: ''
        };
    }
  }

  private getDossierStatusConfig(status: DossierStatusType): StatusConfig {
    switch (status) {
      case 'NEW':
        return {
          label: 'Nouveau',
          icon: 'fiber_new',
          description: 'Nouveau dossier créé',
          isPulse: true,
          variant: 'info'
        };
      case 'QUALIFYING':
        return {
          label: 'Qualification',
          icon: 'schedule',
          description: 'Dossier en cours de qualification',
          isPulse: true,
          variant: 'warning-attention'
        };
      case 'QUALIFIED':
        return {
          label: 'Qualifié',
          icon: 'verified',
          description: 'Dossier qualifié et prêt',
          variant: 'success'
        };
      case 'APPOINTMENT':
        return {
          label: 'Rendez-vous',
          icon: 'event',
          description: 'Rendez-vous programmé',
          variant: 'info'
        };
      case 'WON':
        return {
          label: 'Gagné',
          icon: 'check_circle',
          description: 'Dossier gagné avec succès',
          variant: 'success'
        };
      case 'LOST':
        return {
          label: 'Perdu',
          icon: 'cancel',
          description: 'Dossier perdu ou annulé',
          variant: 'danger-soft'
        };
      default:
        return {
          label: status,
          icon: 'circle',
          description: ''
        };
    }
  }

  private getPropertyStatusConfig(status: PropertyStatusType): StatusConfig {
    switch (status) {
      case 'SOLD':
        return {
          label: 'Vendu',
          icon: 'sell',
          description: 'Bien vendu avec succès',
          variant: 'success-sold'
        };
      case 'RENTED':
        return {
          label: 'Loué',
          icon: 'key',
          description: 'Bien loué avec succès',
          variant: 'success-rented'
        };
      case 'SIGNED':
        return {
          label: 'Signé',
          icon: 'done_all',
          description: 'Contrat signé',
          variant: 'success-signed'
        };
      case 'AVAILABLE':
        return {
          label: 'Disponible',
          icon: 'home',
          description: 'Bien disponible à la vente/location',
          variant: 'success'
        };
      case 'PENDING':
        return {
          label: 'En attente',
          icon: 'pending',
          description: 'En attente de validation',
          variant: 'warning-attention'
        };
      case 'RESERVED':
        return {
          label: 'Réservé',
          icon: 'lock_clock',
          description: 'Bien réservé par un client',
          variant: 'warning-urgent'
        };
      case 'WITHDRAWN':
        return {
          label: 'Retiré',
          icon: 'block',
          description: 'Bien retiré du marché',
          variant: 'neutral-warmth'
        };
      default:
        return {
          label: status,
          icon: 'circle',
          description: ''
        };
    }
  }
}
