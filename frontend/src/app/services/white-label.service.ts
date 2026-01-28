import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WhiteLabelConfig {
  id?: number;
  orgId: string;
  logoUrl?: string;
  logoUrlDark?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customCss?: string;
  customDomain?: string;
  emailFromName?: string;
  emailFromAddress?: string;
  emailFooterHtml?: string;
  features?: any;
}

export interface FeatureFlag {
  id: number;
  orgId: string;
  featureKey: string;
  featureName: string;
  featureDescription: string;
  enabled: boolean;
  availableInPlans: string;
  requiresAddon: boolean;
  rolloutPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class WhiteLabelService {
  private baseUrl = '/api/v1/admin/white-label';

  constructor(private http: HttpClient) {}

  getConfig(orgId: string): Observable<WhiteLabelConfig> {
    return this.http.get<WhiteLabelConfig>(`${this.baseUrl}/${orgId}`);
  }

  updateConfig(orgId: string, config: WhiteLabelConfig): Observable<WhiteLabelConfig> {
    return this.http.put<WhiteLabelConfig>(`${this.baseUrl}/${orgId}`, config);
  }

  getTheme(orgId: string): Observable<{ [key: string]: string }> {
    return this.http.get<{ [key: string]: string }>(`${this.baseUrl}/${orgId}/theme`);
  }

  getThemeCss(orgId: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/${orgId}/theme/css`, { responseType: 'text' });
  }

  getFeatureFlags(orgId: string): Observable<FeatureFlag[]> {
    return this.http.get<FeatureFlag[]>(`${this.baseUrl}/${orgId}/features`);
  }

  toggleFeature(orgId: string, featureKey: string, enabled: boolean): Observable<FeatureFlag> {
    return this.http.put<FeatureFlag>(
      `${this.baseUrl}/${orgId}/features/${featureKey}`,
      null,
      { params: { enabled: enabled.toString() } }
    );
  }

  applyTheme(theme: { [key: string]: string }): void {
    const root = document.documentElement;
    Object.keys(theme).forEach(key => {
      if (key.startsWith('--')) {
        root.style.setProperty(key, theme[key]);
      }
    });
  }

  loadTenantTheme(orgId: string): void {
    this.getTheme(orgId).subscribe({
      next: (theme) => this.applyTheme(theme),
      error: (error) => console.error('Failed to load tenant theme', error)
    });
  }
}
