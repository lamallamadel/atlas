import { Component, Input } from '@angular/core';

export type EntityType = 'annonce' | 'dossier';

export type AnnonceStatusType = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type DossierStatusType = 'NEW' | 'QUALIFYING' | 'QUALIFIED' | 'APPOINTMENT' | 'WON' | 'LOST';

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

  getStatusLabel(): string {
    if (this.entityType === 'annonce') {
      return this.getAnnonceStatusLabel(this.status as AnnonceStatusType);
    } else if (this.entityType === 'dossier') {
      return this.getDossierStatusLabel(this.status as DossierStatusType);
    }
    return this.status;
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

  private getAnnonceStatusLabel(status: AnnonceStatusType): string {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon';
      case 'PUBLISHED':
        return 'Publié';
      case 'ACTIVE':
        return 'Actif';
      case 'PAUSED':
        return 'En pause';
      case 'ARCHIVED':
        return 'Archivé';
      default:
        return status;
    }
  }

  private getDossierStatusLabel(status: DossierStatusType): string {
    switch (status) {
      case 'NEW':
        return 'Nouveau';
      case 'QUALIFYING':
        return 'Qualification';
      case 'QUALIFIED':
        return 'Qualifié';
      case 'APPOINTMENT':
        return 'Rendez-vous';
      case 'WON':
        return 'Gagné';
      case 'LOST':
        return 'Perdu';
      default:
        return status;
    }
  }
}
