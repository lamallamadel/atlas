import { Component, Input } from '@angular/core';

export type EntityType = 'annonce' | 'dossier';

export type AnnonceStatusType = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type DossierStatusType = 'NEW' | 'QUALIFYING' | 'QUALIFIED' | 'APPOINTMENT' | 'WON' | 'LOST';

interface StatusConfig {
  label: string;
  icon: string;
  description: string;
  isPulse?: boolean;
}

@Component({
  selector: 'app-badge-status',
  templateUrl: './badge-status.component.html',
  styleUrls: ['./badge-status.component.css']
})
export class BadgeStatusComponent {
  @Input() status!: string;
  @Input() entityType!: EntityType;

  getStatusClass(): string {
    if (this.entityType === 'annonce') {
      return this.getAnnonceStatusClass(this.status as AnnonceStatusType);
    } else if (this.entityType === 'dossier') {
      return this.getDossierStatusClass(this.status as DossierStatusType);
    }
    return '';
  }

  getStatusConfig(): StatusConfig {
    if (this.entityType === 'annonce') {
      return this.getAnnonceStatusConfig(this.status as AnnonceStatusType);
    } else if (this.entityType === 'dossier') {
      return this.getDossierStatusConfig(this.status as DossierStatusType);
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

  private getAnnonceStatusConfig(status: AnnonceStatusType): StatusConfig {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Brouillon',
          icon: 'edit',
          description: 'Annonce en cours de rédaction'
        };
      case 'PUBLISHED':
        return {
          label: 'Publié',
          icon: 'check_circle',
          description: 'Annonce publiée et visible',
          isPulse: true
        };
      case 'ACTIVE':
        return {
          label: 'Actif',
          icon: 'check_circle',
          description: 'Annonce active et visible',
          isPulse: true
        };
      case 'PAUSED':
        return {
          label: 'En pause',
          icon: 'pause_circle',
          description: 'Annonce temporairement suspendue'
        };
      case 'ARCHIVED':
        return {
          label: 'Archivé',
          icon: 'archive',
          description: 'Annonce archivée'
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
          isPulse: true
        };
      case 'QUALIFYING':
        return {
          label: 'Qualification',
          icon: 'schedule',
          description: 'Dossier en cours de qualification',
          isPulse: true
        };
      case 'QUALIFIED':
        return {
          label: 'Qualifié',
          icon: 'verified',
          description: 'Dossier qualifié et prêt'
        };
      case 'APPOINTMENT':
        return {
          label: 'Rendez-vous',
          icon: 'event',
          description: 'Rendez-vous programmé'
        };
      case 'WON':
        return {
          label: 'Gagné',
          icon: 'check_circle',
          description: 'Dossier gagné avec succès'
        };
      case 'LOST':
        return {
          label: 'Perdu',
          icon: 'cancel',
          description: 'Dossier perdu ou annulé'
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
