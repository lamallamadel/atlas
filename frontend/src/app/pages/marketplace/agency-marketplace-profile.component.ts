import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  DsBadgeComponent,
  DsButtonComponent,
  DsCardComponent,
  DsCheckboxComponent,
  DsIconComponent,
  DsInputComponent,
  DsSkeletonComponent,
  DsTextareaComponent,
  DsToastService,
  PageHeaderComponent,
} from '../../design-system';
import { AgencySettings, AgencyZone, MarketplaceApiService } from '../../services/marketplace-api.service';
import { AuthService } from '../../services/auth.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';

/**
 * Profil public et zones de l'agence (cas d'usage n°1, lot B) : ce que voient les propriétaires
 * dans l'annuaire, et les villes dont l'agence reçoit les demandes de la bourse.
 */
@Component({
  selector: 'app-agency-marketplace-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, RouterLink,
    DsBadgeComponent, DsButtonComponent, DsCardComponent, DsCheckboxComponent, DsIconComponent, DsInputComponent,
    DsSkeletonComponent, DsTextareaComponent, PageHeaderComponent,
  ],
  template: `
    <div class="pro-page ds-form-stack ap-page">
      <nav class="ap-breadcrumb" aria-label="Fil d'Ariane">
        <a routerLink="/pro/mandats">Bourse aux mandats</a>
        <ds-icon name="chevron-right" [size]="16"></ds-icon>
        <span aria-current="page">Profil et zones</span>
      </nav>
      <ds-page-header eyebrow="Bourse aux mandats" titleBefore="Profil de" titleAccent="l'agence"
        description="Ce que les propriétaires voient de vous, et les villes dont vous recevez les demandes."></ds-page-header>

      @if (settings(); as s) {
        <div class="ap-status" role="status">
          @if (s.verified) {
            <ds-badge status="success">Agence vérifiée</ds-badge>
            <span class="ap-muted">Vous recevez les demandes de vos zones et apparaissez dans l'annuaire.</span>
          } @else {
            <ds-badge status="warning">Vérification en attente</ds-badge>
            <span class="ap-muted">Complétez ce profil, puis demandez la vérification à l'équipe Atlas.</span>
          }
        </div>
        @if (!canEdit) {
          <p class="ap-muted">Seuls un manager ou un administrateur de l'agence modifient ce profil.</p>
        }

        <div class="ap-layout">
          <ds-card [pad]="true" elevation="xs">
            <form class="ds-form-stack" (ngSubmit)="saveProfile()">
              <h2 class="ap-card-title">Profil public</h2>
              <ds-input label="Nom affiché" name="name" [(ngModel)]="name" required [disabled]="!canEdit"></ds-input>
              <ds-textarea label="Présentation" name="description" [rows]="4" [maxLength]="2000" [(ngModel)]="description" [disabled]="!canEdit"
                placeholder="Votre expérience, vos quartiers, votre façon de travailler"></ds-textarea>
              <ds-input label="Langues parlées" name="languages" placeholder="français, darija, anglais" [(ngModel)]="languages" [disabled]="!canEdit"></ds-input>
              <ds-input label="Types de biens" name="types" placeholder="Appartement, Villa, Terrain" [(ngModel)]="propertyTypes" [disabled]="!canEdit"></ds-input>
              <fieldset class="ap-group">
                <legend class="ap-legend">Transactions</legend>
                <ds-checkbox name="sale" label="Vente" [(ngModel)]="sale" [disabled]="!canEdit"></ds-checkbox>
                <ds-checkbox name="rent" label="Location" [(ngModel)]="rent" [disabled]="!canEdit"></ds-checkbox>
              </fieldset>
              @if (canEdit) {
                <div class="ap-actions"><ds-button variant="marine" nativeType="submit" [loading]="savingProfile()" [disabled]="savingProfile() || !name.trim()">Enregistrer le profil</ds-button></div>
              }
            </form>
          </ds-card>

          <ds-card [pad]="true" elevation="xs">
            <form class="ds-form-stack" (ngSubmit)="saveZones()">
              <h2 class="ap-card-title">Zones d'intervention</h2>
              <p class="ap-muted">Vous recevez les demandes de la bourse pour ces villes. Le quartier, facultatif, apparaît dans l'annuaire.</p>
              @for (z of zones; track $index; let i = $index) {
                <div class="ap-zone">
                  <ds-input [label]="'Ville ' + (i + 1)" [name]="'city' + i" [(ngModel)]="z.city" required [disabled]="!canEdit"></ds-input>
                  <ds-input label="Quartier" [name]="'district' + i" [(ngModel)]="z.district" [disabled]="!canEdit"></ds-input>
                  @if (canEdit && zones.length > 1) {
                    <ds-button variant="icon" size="md" prefixIcon="trash" [ariaLabel]="'Retirer la zone ' + (i + 1)" (dsClick)="removeZone(i)"></ds-button>
                  }
                </div>
              }
              @if (canEdit) {
                <div class="ap-actions ap-actions--split">
                  <ds-button variant="ghost" size="sm" prefixIcon="plus" [disabled]="zones.length >= 30" (dsClick)="addZone()">Ajouter une zone</ds-button>
                  <ds-button variant="marine" nativeType="submit" [loading]="savingZones()" [disabled]="savingZones() || !zonesValid()">Enregistrer les zones</ds-button>
                </div>
              }
            </form>
          </ds-card>
        </div>
      } @else {
        <ds-skeleton variant="rect" width="100%" height="280px"></ds-skeleton>
      }
    </div>
  `,
  styles: [`
    .ap-page { gap: var(--ds-space-6); }
    .ap-breadcrumb { display: flex; align-items: center; gap: var(--ds-space-2); font-size: var(--ds-text-sm); color: var(--ds-text-faint); }
    .ap-breadcrumb a { padding: 0; color: var(--ds-text-faint); text-decoration: none; }
    .ap-breadcrumb a:hover, .ap-breadcrumb a:focus-visible { color: var(--ds-marine); text-decoration: underline; }
    .ap-breadcrumb span { color: var(--ds-marine); font-weight: 600; }
    .ap-status { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-3); }
    .ap-layout { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ds-space-6); align-items: start; }
    @media (max-width: 1024px) { .ap-layout { grid-template-columns: 1fr; } }
    .ap-card-title { margin: 0; font-size: var(--ds-text-base); font-weight: 700; color: var(--ds-marine); }
    .ap-muted { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .ap-group { display: flex; gap: var(--ds-space-4); margin: 0; padding: 0; border: 0; }
    .ap-legend { margin-bottom: var(--ds-space-2); padding: 0; font-size: var(--ds-text-xs); font-weight: 600; color: var(--ds-text-muted); letter-spacing: 1.2px; text-transform: uppercase; }
    .ap-zone { display: grid; grid-template-columns: 1fr 1fr auto; gap: var(--ds-space-3); align-items: end; }
    .ap-actions { display: flex; justify-content: flex-end; }
    .ap-actions--split { justify-content: space-between; }
  `],
})
export class AgencyMarketplaceProfileComponent implements OnInit {
  private readonly api = inject(MarketplaceApiService);
  private readonly toast = inject(DsToastService);
  private readonly auth = inject(AuthService);

  readonly settings = signal<AgencySettings | null>(null);
  readonly savingProfile = signal(false);
  readonly savingZones = signal(false);
  readonly canEdit = this.auth.hasRole('ADMIN') || this.auth.hasRole('MANAGER') || this.auth.hasRole('SUPER_ADMIN');

  name = '';
  description = '';
  languages = '';
  propertyTypes = '';
  sale = true;
  rent = true;
  zones: AgencyZone[] = [{ city: '', district: null }];

  ngOnInit(): void {
    this.api.settings().subscribe({
      next: s => this.apply(s),
      error: err => this.toast.error(serverMessage(err, 'Profil indisponible')),
    });
  }

  addZone(): void { this.zones = [...this.zones, { city: '', district: null }]; }
  removeZone(i: number): void { this.zones = this.zones.filter((_, j) => j !== i); }
  zonesValid(): boolean { return this.zones.length > 0 && this.zones.every(z => !!z.city?.trim()); }

  saveProfile(): void {
    if (!this.name.trim()) return;
    const transactions = [...(this.sale ? ['SALE'] : []), ...(this.rent ? ['RENT'] : [])];
    this.savingProfile.set(true);
    this.api.saveProfile({
      displayName: this.name.trim(),
      description: this.description || null,
      languages: split(this.languages),
      propertyTypes: split(this.propertyTypes),
      transactions,
    }).subscribe({
      next: s => { this.savingProfile.set(false); this.apply(s); this.toast.success('Profil enregistré'); },
      error: err => { this.savingProfile.set(false); this.toast.error(serverMessage(err, 'Enregistrement impossible')); },
    });
  }

  saveZones(): void {
    if (!this.zonesValid()) return;
    this.savingZones.set(true);
    this.api.saveZones(this.zones.map(z => ({ city: z.city.trim(), district: z.district?.trim() || null }))).subscribe({
      next: s => { this.savingZones.set(false); this.apply(s); this.toast.success('Zones enregistrées'); },
      error: err => { this.savingZones.set(false); this.toast.error(serverMessage(err, 'Enregistrement impossible')); },
    });
  }

  private apply(s: AgencySettings): void {
    this.settings.set(s);
    this.name = s.displayName ?? '';
    this.description = s.description ?? '';
    this.languages = s.languages.join(', ');
    this.propertyTypes = s.propertyTypes.join(', ');
    this.sale = !s.transactions.length || s.transactions.includes('SALE');
    this.rent = !s.transactions.length || s.transactions.includes('RENT');
    this.zones = s.zones.length ? s.zones.map(z => ({ ...z })) : [{ city: '', district: null }];
  }
}

function split(value: string): string[] {
  return value.split(',').map(v => v.trim()).filter(Boolean);
}
