import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { trigger, transition, style, animate, query, animateChild } from '@angular/animations';
import { AuthHeroComponent } from '../../design-system/patterns/auth-hero/auth-hero.component';
import { DsButtonComponent } from '../../design-system/primitives/ds-button/ds-button.component';
import { CommonModule } from '@angular/common';

export type SignupStep = 'email' | 'otp' | 'role' | 'org';

export type UserRole = 'agent' | 'manager' | 'admin' | 'promoteur';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; description: string; icon: string }> = [
  { value: 'agent',     label: 'Agent immobilier',   description: 'Gérez vos prospects et dossiers en autonomie', icon: '🏠' },
  { value: 'manager',   label: 'Manager d\'agence',  description: 'Supervisez votre équipe et pilotez les résultats', icon: '📊' },
  { value: 'admin',     label: 'Administrateur',     description: 'Configurez la plateforme pour toute l\'organisation', icon: '⚙️' },
  { value: 'promoteur', label: 'Promoteur',          description: 'Gérez vos programmes et ventes en VEFA', icon: '🏗️' },
];

const slideAnimation = trigger('slide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(32px)' }),
    animate('280ms cubic-bezier(0.25,0.8,0.25,1)', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
  transition(':leave', [
    animate('200ms cubic-bezier(0.25,0.8,0.25,1)', style({ opacity: 0, transform: 'translateX(-32px)' })),
  ]),
]);

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthHeroComponent, DsButtonComponent],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  animations: [slideAnimation],
})
export class SignupComponent implements OnInit {
  /* ── State ── */
  step: SignupStep = 'email';
  isLoading = false;
  errorMessage = '';
  resendCooldown = 0;
  resendTimer?: ReturnType<typeof setInterval>;

  /* ── Forms ── */
  emailForm!: FormGroup;
  otpForm!: FormGroup;
  orgForm!: FormGroup;

  /* ── Selections ── */
  selectedRole: UserRole | null = null;
  readonly roleOptions = ROLE_OPTIONS;

  /* ── Steps meta ── */
  readonly steps: SignupStep[] = ['email', 'otp', 'role', 'org'];
  get stepIndex(): number { return this.steps.indexOf(this.step); }
  get progressPct(): number { return ((this.stepIndex + 1) / this.steps.length) * 100; }

  /* ── Hero meta per step ── */
  get heroConfig() {
    const map: Record<SignupStep, { eyebrow: string; titleBefore: string; titleAccent: string; subtitle: string }> = {
      email: { eyebrow: 'Inscription — Étape 1/4', titleBefore: 'Créez votre', titleAccent: 'compte',      subtitle: 'Commencez avec votre adresse e-mail professionnelle.' },
      otp:   { eyebrow: 'Inscription — Étape 2/4', titleBefore: 'Vérifiez votre', titleAccent: 'identité',  subtitle: 'Un code à 6 chiffres a été envoyé à votre e-mail.' },
      role:  { eyebrow: 'Inscription — Étape 3/4', titleBefore: 'Choisissez votre', titleAccent: 'profil',  subtitle: 'Votre rôle détermine les fonctionnalités disponibles.' },
      org:   { eyebrow: 'Inscription — Étape 4/4', titleBefore: 'Votre', titleAccent: 'organisation',       subtitle: 'Configurez votre espace de travail Atlasia.' },
    };
    return map[this.step];
  }

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), this.strongPassword]],
    });
    this.otpForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
    this.orgForm = this.fb.group({
      orgName:  ['', [Validators.required, Validators.minLength(2)]],
      orgId:    ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]{3,20}$/)]],
      phone:    ['', []],
      city:     ['', []],
    });
    /* Auto-generate orgId from orgName */
    this.orgForm.get('orgName')?.valueChanges.subscribe((name: string) => {
      const slug = (name || '').toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').slice(0, 16);
      this.orgForm.get('orgId')?.setValue(slug, { emitEvent: false });
    });
  }

  /* ── Step navigation ── */
  submitEmail(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMessage = '';
    /* Simulate API call */
    setTimeout(() => {
      this.isLoading = false;
      this.step = 'otp';
      this.startResendCooldown();
    }, 800);
  }

  submitOtp(): void {
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMessage = '';
    setTimeout(() => {
      this.isLoading = false;
      /* Simulate wrong code for demo */
      if (this.otpForm.value.code === '000000') {
        this.errorMessage = 'Code invalide. Veuillez réessayer.';
      } else {
        this.step = 'role';
      }
    }, 700);
  }

  selectRole(role: UserRole): void {
    this.selectedRole = role;
  }

  submitRole(): void {
    if (!this.selectedRole) { this.errorMessage = 'Veuillez sélectionner un rôle.'; return; }
    this.errorMessage = '';
    this.step = 'org';
  }

  submitOrg(): void {
    if (this.orgForm.invalid) { this.orgForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMessage = '';
    setTimeout(() => {
      this.isLoading = false;
      /* Provision org and redirect */
      const orgId = this.orgForm.value.orgId || 'ORG-001';
      localStorage.setItem('org_id', orgId);
      this.router.navigate(['/login'], { queryParams: { registered: 'true' } });
    }, 1200);
  }

  resendCode(): void {
    if (this.resendCooldown > 0) return;
    this.startResendCooldown();
  }

  back(): void {
    const prev: Record<SignupStep, SignupStep | null> = { email: null, otp: 'email', role: 'otp', org: 'role' };
    const p = prev[this.step];
    if (p) this.step = p;
  }

  /* ── Helpers ── */
  get emailError(): string {
    const c = this.emailForm.get('email');
    if (c?.touched && c.errors?.['required']) return 'L\'e-mail est requis.';
    if (c?.touched && c.errors?.['email']) return 'Adresse e-mail invalide.';
    return '';
  }

  get passwordError(): string {
    const c = this.emailForm.get('password');
    if (c?.touched && c.errors?.['required']) return 'Le mot de passe est requis.';
    if (c?.touched && c.errors?.['minlength']) return 'Minimum 8 caractères.';
    if (c?.touched && c.errors?.['strongPassword']) return 'Doit contenir majuscule, chiffre et symbole.';
    return '';
  }

  get maskedEmail(): string {
    const raw = this.emailForm.value.email as string || '';
    const [user, domain] = raw.split('@');
    if (!user || !domain) return raw;
    return `${user.slice(0, 2)}***@${domain}`;
  }

  private strongPassword(c: AbstractControl): ValidationErrors | null {
    const v = c.value as string || '';
    if (/^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/.test(v)) return null;
    return { strongPassword: true };
  }

  private startResendCooldown(): void {
    clearInterval(this.resendTimer);
    this.resendCooldown = 60;
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.resendTimer);
    }, 1000);
  }
}
