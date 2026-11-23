import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DsBadgeComponent,
  type DsBadgeStatus,
} from '../design-system/primitives/ds-badge/ds-badge.component';
import { DsIconComponent } from '../design-system/icons/ds-icon.component';

export type EntityType = 'annonce' | 'dossier' | 'property';

export type AnnonceStatusType = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED' | 'ARCHIVED' | 'ACTIVE' | 'PAUSED';
export type DossierStatusType = 'NEW' | 'QUALIFYING' | 'QUALIFIED' | 'APPOINTMENT' | 'WON' | 'LOST';
export type PropertyStatusType = 'SOLD' | 'RENTED' | 'SIGNED' | 'AVAILABLE' | 'PENDING' | 'RESERVED' | 'WITHDRAWN';

interface StatusConfig {
  label: string;
  icon: string;
  description: string;
  isPulse?: boolean;
}

@Component({
  selector: 'app-badge-status',
  standalone: true,
  templateUrl: './badge-status.component.html',
  styleUrls: ['./badge-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DsBadgeComponent, DsIconComponent],
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
    return { label: this.status(), icon: 'info', description: '' };
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
      case 'DRAFT': return 'draft';
      case 'PUBLISHED':
      case 'ACTIVE': return 'active';
      case 'SUSPENDED':
      case 'PAUSED': return 'paused';
      case 'ARCHIVED': return 'archived';
      default: return 'neutral';
    }
  }

  private mapDossierToDs(status: DossierStatusType): DsBadgeStatus {
    switch (status) {
      case 'NEW': return 'new';
      case 'QUALIFYING': return 'qualification';
      case 'QUALIFIED': return 'success';
      case 'APPOINTMENT': return 'rdv';
      case 'WON': return 'won';
      case 'LOST': return 'lost';
      default: return 'neutral';
    }
  }

  private mapPropertyToDs(status: PropertyStatusType): DsBadgeStatus {
    switch (status) {
      case 'SOLD':
      case 'RENTED':
      case 'SIGNED': return 'success';
      case 'AVAILABLE': return 'active';
      case 'PENDING':
      case 'RESERVED': return 'warning';
      case 'WITHDRAWN': return 'archived';
      default: return 'neutral';
    }
  }

  private getAnnonceStatusConfig(status: AnnonceStatusType): StatusConfig {
    switch (status) {
      case 'DRAFT': return { label: 'Brouillon', icon: 'edit', description: 'En rédaction' };
      case 'PUBLISHED':
      case 'ACTIVE': return { label: 'En ligne', icon: 'check', description: 'Visible sur le portail', isPulse: true };
      case 'SUSPENDED':
      case 'PAUSED': return { label: 'Suspendue', icon: 'refresh', description: 'Retirée du portail' };
      case 'ARCHIVED': return { label: 'Archivé', icon: 'clock', description: 'Archivé' };
      default: return { label: status, icon: 'info', description: '' };
    }
  }

  private getDossierStatusConfig(status: DossierStatusType): StatusConfig {
    switch (status) {
      case 'NEW': return { label: 'Nouveau', icon: 'plus', description: 'Nouveau lead', isPulse: true };
      case 'QUALIFYING': return { label: 'Qualification', icon: 'clock', description: 'En cours', isPulse: true };
      case 'QUALIFIED': return { label: 'Qualifié', icon: 'check', description: 'Prêt' };
      case 'APPOINTMENT': return { label: 'Rendez-vous', icon: 'calendar', description: 'Visite' };
      case 'WON': return { label: 'Gagné', icon: 'check', description: 'Converti' };
      case 'LOST': return { label: 'Perdu', icon: 'close', description: 'Abandonné' };
      default: return { label: status, icon: 'info', description: '' };
    }
  }

  private getPropertyStatusConfig(status: PropertyStatusType): StatusConfig {
    switch (status) {
      case 'SOLD': return { label: 'Vendu', icon: 'check', description: 'Vendu' };
      case 'RENTED': return { label: 'Loué', icon: 'check', description: 'Loué' };
      case 'SIGNED': return { label: 'Signé', icon: 'check', description: 'Signé' };
      case 'AVAILABLE': return { label: 'Disponible', icon: 'home', description: 'Libre' };
      case 'PENDING': return { label: 'En attente', icon: 'clock', description: 'Validation' };
      case 'RESERVED': return { label: 'Réservé', icon: 'lock', description: 'Réservé' };
      case 'WITHDRAWN': return { label: 'Retiré', icon: 'close', description: 'Sorti' };
      default: return { label: status, icon: 'info', description: '' };
    }
  }
}
