import { Injectable } from '@angular/core';
import { OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface JwtPayload {
  sub?: string;
  roles?: string[];
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
  exp?: number;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly AUTH_MODE_KEY = 'auth_mode'; // 'manual' | 'oidc'
  private readonly DEFAULT_ORG_ID = 'ORG-001';

  /**
   * Prevents navigation ping-pong when multiple concurrent API calls return 401.
   */
  private handlingSessionExpired = false;

  private readonly authConfig: AuthConfig = {
    issuer: environment.oidc.issuer,
    redirectUri: environment.oidc.redirectUri,
    clientId: environment.oidc.clientId,
    responseType: 'code',
    scope: environment.oidc.scope,
    requireHttps: environment.oidc.requireHttps,
    showDebugInformation: !environment.production,
    strictDiscoveryDocumentValidation: false,
    useSilentRefresh: false,
    sessionChecksEnabled: false,
    clearHashAfterLogin: true
  };

  constructor(
    private readonly oauthService: OAuthService,
    private readonly router: Router
  ) {
    // Configure OAuthService once at startup.
    this.oauthService.configure(this.authConfig);
    this.oauthService.setStorage(localStorage);
  }

  /**
   * App initializer: loads the discovery document and tries to finalize a code-flow login.
   * Never throws (to avoid blocking bootstrap).
   */
  async init(): Promise<void> {
    if (!environment.oidc.enabled) {
      return;
    }

    try {
      await this.oauthService.loadDiscoveryDocumentAndTryLogin();

      // If OIDC login succeeded, mark the mode.
      if (this.oauthService.hasValidAccessToken()) {
        localStorage.setItem(this.AUTH_MODE_KEY, 'oidc');
      }
    } catch {
      // Ignore - OIDC may not be available in all environments.
    }
  }

  /** Manual / mock token login (kept for development). */
  login(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.AUTH_MODE_KEY, 'manual');

    // Ensure an org id exists to avoid 400 Bad Request from the API.
    if (!localStorage.getItem('org_id')) {
      localStorage.setItem('org_id', this.DEFAULT_ORG_ID);
    }
  }

  /**
   * Start Keycloak login using Authorization Code Flow (PKCE).
   * Note: org id is not part of the OIDC protocol; we keep a local default.
   */
  loginWithKeycloak(): void {
    if (!environment.oidc.enabled) {
      return;
    }

    // Ensure org id exists before the user lands on authenticated pages.
    if (!localStorage.getItem('org_id')) {
      localStorage.setItem('org_id', this.DEFAULT_ORG_ID);
    }

    // Clear any manual token to avoid mixing modes.
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.setItem(this.AUTH_MODE_KEY, 'oidc');

    this.oauthService.initCodeFlow();
  }

  /**
   * Logout of both modes.
   * - Removes manual token
   * - Clears OIDC tokens
   */
  logout(): void {
    this.logoutLocal();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  /**
   * Local logout only (no redirect to Keycloak).
   * This is the safest option to break infinite redirect loops on 401.
   */
  logoutLocal(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.AUTH_MODE_KEY);

    try {
      // "true" = noRedirectToLogoutUrl (avoids Keycloak end_session redirect issues)
      this.oauthService.logOut(true);
    } catch {
      // ignore
    }
  }

  /**
   * Called by HTTP interceptor on 401.
   * Clears tokens and performs a single navigation to /login.
   */
  handleSessionExpired(): void {
    if (this.handlingSessionExpired) {
      return;
    }
    this.handlingSessionExpired = true;

    this.logoutLocal();

    // replaceUrl prevents the browser history from replaying protected routes.
    this.router.navigate(['/login'], { replaceUrl: true }).finally(() => {
      // Release lock after navigation tick.
      setTimeout(() => (this.handlingSessionExpired = false), 0);
    });
  }

  /**
   * Prefer Keycloak access token if present, otherwise fall back to manual/mock token.
   */
  getToken(): string | null {
    if (this.oauthService.hasValidAccessToken()) {
      const t = this.oauthService.getAccessToken();
      return t || null;
    }

    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    if (this.oauthService.hasValidAccessToken()) {
      return true;
    }

    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return false;
    }

    try {
      const payload = this.decodeToken(token);
      if (payload.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp > currentTime;
      }
      return true;
    } catch {
      return false;
    }
  }

  getUserRoles(): string[] {
    const token = this.getToken();
    if (!token) {
      return [];
    }

    try {
      const payload = this.decodeToken(token);
      const direct = Array.isArray(payload.roles) ? payload.roles : [];
      const realm = Array.isArray(payload.realm_access?.roles) ? payload.realm_access?.roles! : [];

      const clientId = environment.oidc.clientId;
      const clientRoles = payload.resource_access?.[clientId]?.roles || [];

      // Merge and unique
      return Array.from(new Set([...(direct || []), ...(realm || []), ...(clientRoles || [])]));
    } catch {
      return [];
    }
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payload = this.decodeToken(token);
      return payload.sub || null;
    } catch {
      return null;
    }
  }

  private decodeToken(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = parts[1];
    // base64url -> base64
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  }
}
