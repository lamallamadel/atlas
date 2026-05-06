import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import {
  DsBadgeComponent,
  type DsBadgeStatus,
} from '../design-system/primitives/ds-badge/ds-badge.component';

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
  styleUrls: ['./badge-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsBadgeComponent, MatTooltip, MatIcon],
})
export class BadgeStatusComponent {
  readonly status = input.required<string>();
  readonly entityType = input.required<EntityType>();

  /** Variante `ds-badge` pour l’entité courante. */
  getDsBadgeStatus(): DsBadgeStatus {
    const entityType = this.entityType();
    if (entityType === 'annonce') {
      return this.mapAnnonceToDs(this.status() as AnnonceStatusType);
    }
    if (entityType === 'dossier') {
      return this.mapDossierToDs(this.status() as DossierStatusType);
    }
    if (entityType === 'property') {
      return this.mapPropertyToDs(this.status() as PropertyStatusType);
    }
    return 'neutral';
  }

  getStatusConfig(): StatusConfig {
    const entityType = this.entityType();
    if (entityType === 'annonce') {
      return this.getAnnonceStatusConfig(this.status() as AnnonceStatusType);
    } else if (entityType === 'dossier') {
      return this.getDossierStatusConfig(this.status() as DossierStatusType);
    } else if (entityType === 'property') {
      return this.getPropertyStatusConfig(this.status() as PropertyStatusType);
    }
    return { label: this.status(), icon: 'circle', description: '' };
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

  private mapAnnonceToDs(status: AnnonceStatusType): DsBadgeStatus {
    switch (status) {
      case 'DRAFT':
        return 'draft';
      case 'PUBLISHED':
      case 'ACTIVE':
        return 'active';
      case 'PAUSED':
        return 'paused';
      case 'ARCHIVED':
        return 'archived';
      default:
        return 'neutral';
    }
  }

  private mapDossierToDs(status: DossierStatusType): DsBadgeStatus {
    switch (status) {
      case 'NEW':
        return 'new';
      case 'QUALIFYING':
        return 'qualification';
      case 'QUALIFIED':
        return 'success';
      case 'APPOINTMENT':
        return 'rdv';
      case 'WON':
        return 'won';
      case 'LOST':
        return 'lost';
      default:
        return 'neutral';
    }
  }

  private mapPropertyToDs(status: PropertyStatusType): DsBadgeStatus {
    switch (status) {
      case 'SOLD':
      case 'RENTED':
      case 'SIGNED':
        return 'success';
      case 'AVAILABLE':
        return 'active';
      case 'PENDING':
        return 'warning';
      case 'RESERVED':
        return 'warning';
      case 'WITHDRAWN':
        return 'archived';
      default:
        return 'neutral';
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
