import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DsBadgeComponent, DsButtonComponent, DsCardComponent, DsIconComponent, DsInputComponent, DsToastService } from '../../design-system';
import { AgencyVerification, MarketplaceApiService } from '../../services/marketplace-api.service';
import { AuthService } from '../../services/auth.service';
import { agencyRoleOf } from '../../services/agency-role';
import { serverMessage } from '../../components/annonce-publication-panel.component';

/** ICE marocain : 15 chiffres (espaces tolérés à la saisie). */
export function iceError(value: string): string | null {
  const digits = value.replace(/\s/g, '');
  if (!digits) return 'Indiquez l’ICE de l’agence.';
  return /^\d{15}$/.test(digits) ? null : 'L’ICE compte 15 chiffres.';
}

/**
 * Chemin de vérification d'une agence non vérifiée, à la place du refus de la bourse : ce qui
 * manque (profil, zones), dépôt du registre de commerce et de l'ICE, suivi de la demande.
 */
@Component({
  selector: 'app-agency-verification-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, RouterLink, DsBadgeComponent, DsButtonComponent, DsCardComponent, DsIconComponent, DsInputComponent],
  template: `
    @if (state(); as v) {
      <ds-card [pad]="true" elevation="xs">
        <div class="av">
          <header class="av-head">
            <div>
              <h2 class="av-title">Faites vérifier votre agence</h2>
              <p class="av-muted">La bourse aux mandats est réservée aux agences contrôlées par Atlas : c'est la promesse faite aux propriétaires.</p>
            </div>
            <ds-badge [status]="badge().status">{{ badge().label }}</ds-badge>
          </header>

          @if (v.openRequestsInZones > 0) {
            <p class="av-teaser" role="status">
              <ds-icon name="inbox" [size]="16"></ds-icon>
              {{ v.openRequestsInZones }} demande{{ v.openRequestsInZones > 1 ? 's' : '' }} de propriétaires {{ v.openRequestsInZones > 1 ? 'sont ouvertes' : 'est ouverte' }} dans vos zones en ce moment.
            </p>
          }

          <ol class="av-steps">
            <li class="av-step" [class.av-step--done]="!v.missing.includes('PROFILE')">
              <ds-icon [name]="v.missing.includes('PROFILE') ? 'clock' : 'check'" [size]="16"></ds-icon>
              <span>Profil public de l'agence (nom, présentation)</span>
              @if (v.missing.includes('PROFILE')) { <a routerLink="/pro/mandats/profil" class="av-link">Compléter</a> }
            </li>
            <li class="av-step" [class.av-step--done]="!v.missing.includes('ZONES')">
              <ds-icon [name]="v.missing.includes('ZONES') ? 'clock' : 'check'" [size]="16"></ds-icon>
              <span>Zones couvertes (villes, quartiers)</span>
              @if (v.missing.includes('ZONES')) { <a routerLink="/pro/mandats/profil" class="av-link">Ajouter</a> }
            </li>
            <li class="av-step" [class.av-step--done]="v.status === 'PENDING'">
              <ds-icon [name]="v.status === 'PENDING' ? 'check' : 'clock'" [size]="16"></ds-icon>
              <span>Registre de commerce et ICE</span>
            </li>
            <li class="av-step">
              <ds-icon name="clock" [size]="16"></ds-icon>
              <span>Contrôle par l'équipe Atlas, statut affiché sur cette page</span>
            </li>
          </ol>

          @if (v.status === 'REJECTED' && v.note) {
            <div class="av-note" role="alert">
              <span class="av-strong">Demande refusée :</span> {{ v.note }}
              <span class="av-muted">Corrigez les informations puis renvoyez la demande.</span>
            </div>
          }

          @if (v.status === 'PENDING') {
            <p class="av-muted">Demande envoyée le {{ v.requestedAt | date: 'd MMMM' }} · registre de commerce « {{ v.rc }} » · ICE {{ v.ice }}. Vous verrez les demandes des propriétaires dès que l'équipe Atlas aura validé ces informations.</p>
          } @else if (!canRequest) {
            <p class="av-muted">Seuls l'administrateur et les managers de l'agence peuvent demander la vérification.</p>
          } @else {
            <form class="av-form" (ngSubmit)="submit()" novalidate>
              <ds-input label="Registre de commerce" name="rc" placeholder="Ex. RC 123456 Tanger" [(ngModel)]="rc" [disabled]="v.missing.length > 0"></ds-input>
              <ds-input label="ICE (15 chiffres)" name="ice" placeholder="001234567000089" [(ngModel)]="ice" [error]="iceTouched() ? iceError(ice) : null" (ngModelChange)="iceTouched.set(false)" [disabled]="v.missing.length > 0"></ds-input>
              <ds-input label="Contact (facultatif)" name="contact" placeholder="Nom et téléphone pour le contrôle" [(ngModel)]="contact" [disabled]="v.missing.length > 0"></ds-input>
              <div class="av-actions">
                @if (v.missing.length) { <span class="av-muted">Complétez d'abord le profil et les zones.</span> }
                <ds-button variant="marine" size="md" nativeType="submit" prefixIcon="send" [loading]="busy()" [disabled]="busy() || v.missing.length > 0">
                  {{ v.status === 'REJECTED' ? 'Renvoyer la demande' : 'Demander la vérification' }}
                </ds-button>
              </div>
            </form>
          }
        </div>
      </ds-card>
    }
  `,
  styles: [`
    .av { display: flex; flex-direction: column; gap: var(--ds-space-4); }
    .av-head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--ds-space-4); flex-wrap: wrap; }
    .av-title { margin: 0; font-family: var(--ds-font-display); font-size: var(--ds-text-lg); color: var(--ds-marine); }
    .av-muted { margin: var(--ds-space-1) 0 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .av-strong { font-weight: 600; }
    .av-teaser { display: flex; align-items: center; gap: var(--ds-space-2); margin: 0; padding: var(--ds-space-3); border-radius: var(--ds-radius-md); background: var(--ds-primary-hl); font-size: var(--ds-text-sm); color: var(--ds-text); }
    .av-steps { display: flex; flex-direction: column; gap: var(--ds-space-2); margin: 0; padding: 0; list-style: none; }
    .av-step { display: flex; align-items: center; gap: var(--ds-space-2); font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .av-step--done { color: var(--ds-text); }
    .av-step--done ds-icon { color: var(--ds-success); }
    .av-link { margin-left: auto; font-weight: 600; color: var(--ds-marine); }
    .av-note { padding: var(--ds-space-3); border-radius: var(--ds-radius-md); background: var(--ds-warning-hl); font-size: var(--ds-text-sm); color: var(--ds-text); }
    .av-note .av-muted { display: block; }
    .av-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--ds-space-4); }
    .av-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; align-items: center; gap: var(--ds-space-3); }
  `],
})
export class AgencyVerificationPanelComponent {
  private readonly api = inject(MarketplaceApiService);
  private readonly toast = inject(DsToastService);
  readonly canRequest = (() => {
    const role = agencyRoleOf(inject(AuthService));
    return role === 'ADMIN' || role === 'MANAGER';
  })();

  @Input() set verification(v: AgencyVerification | null) {
    this.state.set(v);
    if (v) { this.rc = v.rc ?? ''; this.ice = v.ice ?? ''; this.contact = v.contact ?? ''; }
  }
  @Output() readonly changed = new EventEmitter<AgencyVerification>();

  readonly state = signal<AgencyVerification | null>(null);
  readonly busy = signal(false);
  readonly iceTouched = signal(false);
  readonly iceError = iceError;
  readonly badge = computed(() => {
    switch (this.state()?.status) {
      case 'PENDING': return { label: 'En cours d’examen', status: 'info' as const };
      case 'REJECTED': return { label: 'À corriger', status: 'warning' as const };
      default: return { label: 'Non vérifiée', status: 'neutral' as const };
    }
  });
  rc = '';
  ice = '';
  contact = '';

  submit(): void {
    this.iceTouched.set(true);
    if (!this.rc.trim()) { this.toast.error('Indiquez le registre de commerce.'); return; }
    if (iceError(this.ice)) return;
    this.busy.set(true);
    this.api.requestVerification({ rc: this.rc.trim(), ice: this.ice, contact: this.contact.trim() || null }).subscribe({
      next: v => {
        this.busy.set(false);
        this.state.set(v);
        this.changed.emit(v);
        this.toast.success('Demande envoyée à l’équipe Atlas');
      },
      error: err => { this.busy.set(false); this.toast.error(serverMessage(err, 'La demande n’a pas été envoyée')); },
    });
  }
}
