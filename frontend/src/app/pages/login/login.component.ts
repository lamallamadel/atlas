import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  logoPath: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
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

  login(): void {
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
      const orgIdValue = this.loginForm.get('orgId')?.value?.trim() || 'ORG-001';
      localStorage.setItem('org_id', orgIdValue);
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
      const orgIdValue = this.loginForm.get('orgId')?.value?.trim() || 'ORG-001';
      localStorage.setItem('org_id', orgIdValue);
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
