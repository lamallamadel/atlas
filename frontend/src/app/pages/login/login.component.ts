import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AuthHeroComponent } from '../../design-system/patterns/auth-hero/auth-hero.component';
import { environment } from '../../../environments/environment';
import { DEMO_ACCOUNTS, DemoAccount } from './demo-accounts';
import { demoLanding, demoToken } from './demo-token';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    imports: [FormsModule, ReactiveFormsModule, AuthHeroComponent]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  logoPath: string | null = null;

  /** Comptes démo (seed db/demo) : hors production, le backend doit être en mode mock. */
  readonly demoEnabled = !environment.production;
  readonly demoQuick: { label: string; account: DemoAccount }[] = [
    ['Agent', 'demo-detroit-agent1'],
    ['Manager', 'demo-detroit-manager'],
    ['Directeur', 'demo-detroit-directeur'],
    ['Propriétaire', 'demo-owner-01'],
    ['Super-admin', 'demo-superadmin'],
  ].map(([label, sub]) => ({ label, account: DEMO_ACCOUNTS.find(a => a.sub === sub)! }));
  readonly demoGroups: { name: string; accounts: DemoAccount[] }[] = DEMO_ACCOUNTS.reduce(
    (groups, a) => {
      const g = groups.find(x => x.name === a.group);
      if (g) g.accounts.push(a); else groups.push({ name: a.group, accounts: [a] });
      return groups;
    },
    [] as { name: string; accounts: DemoAccount[] }[]);
  demoSelected = 'demo-detroit-agent1';

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      orgId: ['ORG-001', [Validators.required]],
      token: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  get orgId() {
    return this.loginForm.get('orgId');
  }

  get token() {
    return this.loginForm.get('token');
  }

  loginWithKeycloak(): void {
    this.errorMessage = '';
    this.isLoading = true;

    try {
      const orgIdValue = this.loginForm.get('orgId')?.value?.trim() || 'ORG-001';
      localStorage.setItem('org_id', orgIdValue);
      this.authService.loginWithKeycloak();
    } catch {
      this.isLoading = false;
      this.errorMessage = 'Erreur lors de la redirection vers Keycloak';
    }
  }

  async login(): Promise<void> {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const orgIdValue = this.loginForm.get('orgId')?.value?.trim() || 'ORG-001';
      const tokenValue = this.loginForm.get('token')?.value?.trim();

      localStorage.setItem('org_id', orgIdValue);
      this.authService.login(tokenValue);
      const ok = await this.router.navigate(['/dashboard']);
      if (!ok) {
        this.errorMessage = 'Erreur de navigation. Veuillez réessayer.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    } catch (error) {
      this.errorMessage = 'Token invalide';
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async mockOidcLogin(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;

    const mockToken = this.generateMockToken();

    try {
      const orgIdValue = this.loginForm.get('orgId')?.value?.trim() || 'ORG-001';
      localStorage.setItem('org_id', orgIdValue);
      this.authService.login(mockToken);
      const ok = await this.router.navigate(['/dashboard']);
      if (!ok) {
        this.errorMessage = 'Erreur de navigation. Veuillez réessayer.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    } catch (error) {
      this.errorMessage = 'Erreur lors de la génération du token';
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async mockAdminLogin(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;

    const mockAdminToken = this.generateMockToken(['ADMIN', 'USER']);

    try {
      const orgIdValue = this.loginForm.get('orgId')?.value?.trim() || 'ORG-001';
      localStorage.setItem('org_id', orgIdValue);
      this.authService.login(mockAdminToken);
      const ok = await this.router.navigate(['/dashboard']);
      if (!ok) {
        this.errorMessage = 'Erreur de navigation. Veuillez réessayer.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    } catch (error) {
      this.errorMessage = 'Erreur lors de la génération du token';
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  /** Connexion avec un compte démo : jeton mock-demo, organisation du compte, page d'arrivée. */
  async demoLogin(account: DemoAccount | undefined): Promise<void> {
    if (!account) return;
    this.errorMessage = '';
    this.isLoading = true;
    localStorage.setItem('org_id', account.orgId);
    this.authService.login(demoToken(account));
    const ok = await this.router.navigate([demoLanding(account)]);
    if (!ok) {
      this.errorMessage = 'Erreur de navigation. Veuillez réessayer.';
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  optionLabel(a: DemoAccount): string {
    return a.roles.includes('OWNER') ? a.name : `${a.label} — ${a.name}`;
  }

  demoAccount(sub: string): DemoAccount | undefined {
    return DEMO_ACCOUNTS.find(a => a.sub === sub);
  }

  private generateMockToken(roles: string[] = ['USER']): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: 'mock-user-' + Date.now(),
      roles: roles,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8)
    };

    const base64Header = btoa(JSON.stringify(header));
    const base64Payload = btoa(JSON.stringify(payload));
    const signature = 'mock-signature';

    return `mock-${base64Header}.${base64Payload}.${signature}`;
  }
}
