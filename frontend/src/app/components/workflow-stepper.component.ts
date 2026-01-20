import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DossierStatus } from '../services/dossier-api.service';

type UiStep = {
  key: DossierStatus | 'CLOSE';
  label: string;
  icon: string;
};

@Component({
  selector: 'app-workflow-stepper',
  templateUrl: './workflow-stepper.component.html',
  styleUrls: ['./workflow-stepper.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowStepperComponent implements OnChanges {
  @Input() status: DossierStatus | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  readonly steps: UiStep[] = [
    { key: DossierStatus.NEW, label: 'Nouveau', icon: 'fiber_new' },
    { key: DossierStatus.QUALIFYING, label: 'Qualification', icon: 'manage_search' },
    { key: DossierStatus.QUALIFIED, label: 'Qualifié', icon: 'verified' },
    { key: DossierStatus.APPOINTMENT, label: 'Rendez-vous', icon: 'event' },
    { key: 'CLOSE', label: 'Clôture', icon: 'flag' }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['status']) {
      this.cdr.markForCheck();
    }
  }

  get currentIndex(): number {
    const s = this.status;
    if (!s) return 0;
    switch (s) {
      case DossierStatus.NEW:
        return 0;
      case DossierStatus.QUALIFYING:
        return 1;
      case DossierStatus.QUALIFIED:
        return 2;
      case DossierStatus.APPOINTMENT:
        return 3;
      case DossierStatus.WON:
      case DossierStatus.LOST:
        return 4;
      default:
        return 0;
    }
  }

  get closeLabel(): string {
    if (this.status === DossierStatus.WON) return 'Gagné';
    if (this.status === DossierStatus.LOST) return 'Perdu';
    return 'En cours';
  }

  get closeIcon(): string {
    if (this.status === DossierStatus.WON) return 'emoji_events';
    if (this.status === DossierStatus.LOST) return 'cancel';
    return 'hourglass_top';
  }

  get progressPercent(): number {
    return Math.round((this.currentIndex / (this.steps.length - 1)) * 100);
  }

  get hint(): string {
    const s = this.status;
    switch (s) {
      case DossierStatus.NEW:
        return 'Complétez les informations du prospect et démarrez la qualification.';
      case DossierStatus.QUALIFYING:
        return 'Validez le besoin, le budget et les critères. Ajoutez une note de synthèse.';
      case DossierStatus.QUALIFIED:
        return 'Planifiez un rendez-vous et associez une annonce si besoin.';
      case DossierStatus.APPOINTMENT:
        return 'Après le rendez-vous, consignez le compte-rendu et clôturez le dossier.';
      case DossierStatus.WON:
        return 'Dossier gagné : préparez les documents et passez en phase contractualisation.';
      case DossierStatus.LOST:
        return 'Dossier perdu : indiquez la raison et gardez une trace pour l’analyse.';
      default:
        return 'Suivez l’avancement du dossier et documentez chaque étape.';
    }
  }


  get isClosed(): boolean {
    return this.status === DossierStatus.WON || this.status === DossierStatus.LOST;
  }

  get isWon(): boolean {
    return this.status === DossierStatus.WON;
  }

  get closeVariantClass(): string {
    if (this.status === DossierStatus.WON) return 'won';
    if (this.status === DossierStatus.LOST) return 'lost';
    return '';
  }

  stepIcon(step: UiStep): string {
    if (step.key === 'CLOSE') return this.closeIcon;
    return step.icon;
  }

  stepLabel(step: UiStep): string {
    if (step.key === 'CLOSE' && this.isClosed) {
      return `Clôture (${this.closeLabel})`;
    }
    return step.label;
  }

  isCompleted(index: number): boolean {
    return index < this.currentIndex;
  }

  isActive(index: number): boolean {
    return index === this.currentIndex;
  }
}
