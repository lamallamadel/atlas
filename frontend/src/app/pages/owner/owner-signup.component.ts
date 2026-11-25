import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  DsButtonComponent,
  DsCardComponent,
  DsCheckboxComponent,
  DsIconComponent,
  DsInputComponent,
  PageHeaderComponent,
} from '../../design-system';
import { OwnerApiService } from '../../services/owner-api.service';
import { serverMessage } from '../../components/annonce-publication-panel.component';

type Step = 'phone' | 'details' | 'done';

/**
 * Inscription d'un propriétaire (cas d'usage n°1, UC-P1) : téléphone, code reçu, identité et mot
 * de passe. L'identifiant de connexion est le numéro de téléphone.
 */
@Component({
  selector: 'app-owner-signup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, DsButtonComponent, DsCardComponent, DsCheckboxComponent, DsIconComponent, DsInputComponent, PageHeaderComponent],
  template: `
    <div class="pro-page owner-signup">
      <ds-page-header
        eyebrow="Propriétaires"
        titleBefore="Vendez ou louez"
        titleAccent="sans agence"
        description="Publiez votre bien vous-même, ou confiez-le à l'agent de votre choix. Gratuit, sans vous déplacer.">
      </ds-page-header>

      <ds-card [pad]="true" elevation="sm">
        @switch (step()) {
          @case ('phone') {
            <form class="ds-form-stack" #fp="ngForm" (ngSubmit)="sendCode(fp)">
              <h2 class="os-title">Votre numéro de téléphone</h2>
              <p class="os-help">Nous vous envoyons un code de vérification par WhatsApp ou SMS.</p>
              <ds-input label="Téléphone" name="phone" type="tel" prefixIcon="phone" placeholder="06 12 34 56 78"
                [(ngModel)]="phone" required [error]="error()"></ds-input>
              <ds-button variant="marine" nativeType="submit" [loading]="busy()" [disabled]="busy() || !phone.trim()">Recevoir le code</ds-button>
            </form>
          }
          @case ('details') {
            <form class="ds-form-stack" #fd="ngForm" (ngSubmit)="complete(fd)">
              <h2 class="os-title">Créer votre compte</h2>
              <p class="os-help">Code envoyé au {{ phone }} par {{ channelLabel() }}.
                <button type="button" class="os-link" (click)="restart()">Changer de numéro</button></p>
              <ds-input label="Code reçu" name="code" [(ngModel)]="code" required></ds-input>
              <div class="os-row">
                <ds-input label="Prénom" name="firstName" [(ngModel)]="firstName" required></ds-input>
                <ds-input label="Nom" name="lastName" [(ngModel)]="lastName" required></ds-input>
              </div>
              <ds-input label="E-mail (facultatif)" type="email" name="email" prefixIcon="mail" [(ngModel)]="email" email></ds-input>
              <ds-input label="Mot de passe (8 caractères au moins)" type="password" name="password" prefixIcon="lock" [(ngModel)]="password" required minlength="8"></ds-input>
              <ds-checkbox [checked]="acceptTerms" (checkedChange)="acceptTerms = $event"
                label="J'accepte les conditions d'utilisation et la politique de confidentialité"></ds-checkbox>
              <p class="os-legal">Vos coordonnées ne sont jamais affichées sur le portail. Elles ne sont transmises à une agence que si vous acceptez sa proposition.
                <a routerLink="/confidentialite">Confidentialité</a></p>
              @if (error()) { <p class="os-error" role="alert">{{ error() }}</p> }
              <ds-button variant="marine" nativeType="submit" [loading]="busy()"
                [disabled]="busy() || !!fd.invalid || !acceptTerms || password.length < 8">Créer mon compte</ds-button>
            </form>
          }
          @case ('done') {
            <div class="os-done">
              <span class="os-done__icon" aria-hidden="true"><ds-icon name="check" [size]="28"></ds-icon></span>
              <h2 class="os-title">Votre compte est prêt</h2>
              <p class="os-help">Connectez-vous avec votre numéro <strong>{{ username() }}</strong> et votre mot de passe, puis déclarez votre bien.</p>
              <ds-button variant="marine" (dsClick)="login()">Se connecter</ds-button>
            </div>
          }
        }
      </ds-card>

      @if (step() !== 'done') {
        <p class="os-footnote">Déjà inscrit ? <button type="button" class="os-link" (click)="login()">Se connecter</button></p>
      }
    </div>
  `,
  styles: [`
    .owner-signup { max-width: 560px; display: flex; flex-direction: column; gap: var(--ds-space-6); }
    .os-title { margin: 0; font-size: var(--ds-text-lg); font-weight: 700; color: var(--ds-marine); }
    .os-help { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .os-legal { margin: 0; font-size: var(--ds-text-xs); color: var(--ds-text-muted); }
    .os-legal a { color: var(--ds-marine); }
    .os-error { margin: 0; font-size: var(--ds-text-sm); color: var(--ds-error); }
    .os-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ds-space-4); }
    @media (max-width: 480px) { .os-row { grid-template-columns: 1fr; } }
    .os-link { padding: 0; border: none; background: none; color: var(--ds-marine); font: inherit; text-decoration: underline; cursor: pointer; }
    .os-footnote { margin: 0; text-align: center; font-size: var(--ds-text-sm); color: var(--ds-text-muted); }
    .os-done { display: flex; flex-direction: column; align-items: center; gap: var(--ds-space-4); text-align: center; padding: var(--ds-space-4) 0; }
    .os-done__icon { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: var(--ds-success-hl); color: var(--ds-success); }
  `],
})
export class OwnerSignupComponent {
  private readonly api = inject(OwnerApiService);
  private readonly router = inject(Router);

  readonly step = signal<Step>('phone');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly channel = signal<string>('SMS');
  readonly username = signal('');

  phone = '';
  code = '';
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  acceptTerms = false;

  channelLabel(): string {
    return this.channel() === 'WHATSAPP' ? 'WhatsApp' : 'SMS';
  }

  sendCode(form: NgForm): void {
    if (form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.startSignup(this.phone.trim()).subscribe({
      next: res => { this.busy.set(false); this.channel.set(res.channel); this.step.set('details'); },
      error: err => { this.busy.set(false); this.error.set(serverMessage(err, 'Envoi du code impossible, réessayez.')); },
    });
  }

  complete(form: NgForm): void {
    if (form.invalid || !this.acceptTerms || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.api.completeSignup({
      phone: this.phone.trim(),
      code: this.code.trim(),
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim() || null,
      password: this.password,
      acceptTerms: this.acceptTerms,
    }).subscribe({
      next: res => { this.busy.set(false); this.username.set(res.username); this.step.set('done'); },
      error: err => { this.busy.set(false); this.error.set(serverMessage(err, 'Création du compte impossible.')); },
    });
  }

  restart(): void {
    this.code = '';
    this.error.set(null);
    this.step.set('phone');
  }

  /** La page de connexion commune ; un compte propriétaire est ensuite dirigé vers son espace. */
  login(): void {
    sessionStorage.setItem('returnUrl', '/proprietaire');
    this.router.navigate(['/login']);
  }
}
