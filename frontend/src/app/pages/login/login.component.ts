import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  token = '';
  orgId = 'ORG-001';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If we land here after a successful OIDC redirect (or we still have a valid token),
    // go straight to the dashboard.
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  loginWithKeycloak(): void {
    this.errorMessage = '';
    this.isLoading = true;

    try {
      localStorage.setItem('org_id', this.orgId.trim() || 'ORG-001');
      this.authService.loginWithKeycloak();
    } catch {
      this.isLoading = false;
      this.errorMessage = 'Erreur lors de la redirection vers Keycloak';
    }
  }

  login(): void {
    this.errorMessage = '';
    
    if (!this.token.trim()) {
      this.errorMessage = 'Veuillez entrer un token';
      return;
    }

    this.isLoading = true;

    try {
      localStorage.setItem('org_id', this.orgId.trim() || 'ORG-001');
      this.authService.login(this.token);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = 'Token invalide';
      this.isLoading = false;
    }
  }

  mockOidcLogin(): void {
    this.errorMessage = '';
    this.isLoading = true;

    const mockToken = this.generateMockToken();
    
    try {
      localStorage.setItem('org_id', this.orgId.trim() || 'ORG-001');
      this.authService.login(mockToken);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = 'Erreur lors de la génération du token';
      this.isLoading = false;
    }
  }

  mockAdminLogin(): void {
    this.errorMessage = '';
    this.isLoading = true;

    const mockAdminToken = this.generateMockToken(['ADMIN', 'USER']);
    
    try {
      localStorage.setItem('org_id', this.orgId.trim() || 'ORG-001');
      this.authService.login(mockAdminToken);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage = 'Erreur lors de la génération du token';
      this.isLoading = false;
    }
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

    return `${base64Header}.${base64Payload}.${signature}`;
  }
}
