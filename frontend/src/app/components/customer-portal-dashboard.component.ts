import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerPortalDossier } from '../models/customer-portal.models';
import { CustomerPortalService } from '../services/customer-portal.service';

@Component({
  selector: 'app-customer-portal-dashboard',
  template: `
    <div class="dashboard-container" [class.branded]="brandingApplied">
      <header class="dashboard-header">
        <div class="header-left">
          @if (branding?.logoUrl) {
            <img [src]="branding.logoUrl" alt="Logo" class="logo">
          }
          @if (!branding?.logoUrl) {
            <h1>Portail Client</h1>
          }
        </div>
        <div class="header-right">
          <span class="user-name">{{ dossier?.leadName }}</span>
          <button (click)="logout()" class="logout-button">Déconnexion</button>
        </div>
      </header>
    
      @if (loading) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Chargement de votre dossier...</p>
        </div>
      }
    
      @if (!loading && dossier) {
        <div class="dashboard-content">
          <div class="status-banner">
            <div class="status-info">
              <h2>Statut de votre dossier</h2>
              <div class="status-badge">{{ dossier.statusDisplay }}</div>
            </div>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="dossier.progressPercentage"></div>
              </div>
              <span class="progress-text">{{ dossier.progressPercentage }}% complété</span>
            </div>
          </div>
          <div class="tabs">
            @for (tab of tabs; track tab) {
              <button
                [class.active]="activeTab === tab.id"
                (click)="activeTab = tab.id"
                class="tab-button">
                {{ tab.icon }} {{ tab.label }}
                @if (tab.id === 'messages' && dossier.unreadMessagesCount > 0) {
                  <span
                  class="badge">{{ dossier.unreadMessagesCount }}</span>
                }
              </button>
            }
          </div>
          <div class="tab-content">
            @if (activeTab === 'overview') {
              <div class="tab-pane">
                <div class="grid-2">
                  <app-dossier-timeline-view [activities]="dossier.activities"></app-dossier-timeline-view>
                  <app-client-document-library [documents]="dossier.documents"></app-client-document-library>
                </div>
              </div>
            }
            @if (activeTab === 'messages') {
              <div class="tab-pane">
                <app-secure-message-thread [dossierId]="dossier.id"></app-secure-message-thread>
              </div>
            }
            @if (activeTab === 'appointments') {
              <div class="tab-pane">
                <app-appointment-request [dossierId]="dossier.id"></app-appointment-request>
              </div>
            }
            @if (activeTab === 'documents') {
              <div class="tab-pane">
                <app-client-document-library [documents]="dossier.documents"></app-client-document-library>
              </div>
            }
            @if (activeTab === 'recommendations') {
              <div class="tab-pane">
                <app-property-recommendation [dossierId]="dossier.id"></app-property-recommendation>
              </div>
            }
            @if (activeTab === 'feedback') {
              <div class="tab-pane">
                <app-client-satisfaction-survey [dossierId]="dossier.id"></app-client-satisfaction-survey>
              </div>
            }
            @if (activeTab === 'settings') {
              <div class="tab-pane">
                <app-consent-management [dossierId]="dossier.id"></app-consent-management>
              </div>
            }
          </div>
        </div>
      }
    </div>
    `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: var(--ds-bg);
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--ds-space-4) var(--ds-space-6);
      background: var(--ds-surface);
      box-shadow: var(--ds-shadow-sm);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo {
      height: 40px;
    }

    h1 {
      margin: 0;
      font-size: 20px;
      color: var(--ds-text);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--ds-space-4);
    }

    .user-name {
      font-weight: 500;
      color: var(--ds-text);
    }

    .logout-button {
      padding: var(--ds-space-2) var(--ds-space-4);
      background: var(--ds-surface-offset);
      color: var(--ds-text);
      border: none;
      border-radius: var(--ds-radius-sm);
      cursor: pointer;
      font-size: 14px;
      transition: background var(--ds-transition-fast);
    }

    .logout-button:hover {
      background: var(--ds-divider);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--ds-surface-offset);
      border-top: 4px solid var(--ds-marine);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: var(--ds-space-4);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .dashboard-content {
      max-width: var(--ds-content-full);
      margin: 0 auto;
      padding: var(--ds-space-6);
    }

    .status-banner {
      background: linear-gradient(135deg, var(--ds-marine) 0%, var(--ds-marine-light) 100%);
      color: var(--ds-text-inverse);
      padding: var(--ds-space-8);
      border-radius: var(--ds-radius-lg);
      margin-bottom: var(--ds-space-6);
    }

    .status-info {
      margin-bottom: 16px;
    }

    .status-info h2 {
      margin: 0 0 8px 0;
      font-size: 18px;
      opacity: 0.9;
    }

    .status-badge {
      display: inline-block;
      background: color-mix(in srgb, var(--ds-text-inverse) 22%, transparent);
      padding: var(--ds-space-2) var(--ds-space-4);
      border-radius: var(--ds-radius-sm);
      font-size: 16px;
      font-weight: 500;
    }

    .progress-container {
      margin-top: 16px;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: color-mix(in srgb, var(--ds-text-inverse) 22%, transparent);
      border-radius: var(--ds-radius-sm);
      overflow: hidden;
      margin-bottom: var(--ds-space-2);
    }

    .progress-fill {
      height: 100%;
      background: var(--ds-text-inverse);
      transition: width 0.5s ease;
    }

    .progress-text {
      font-size: 14px;
      opacity: 0.9;
    }

    .tabs {
      display: flex;
      gap: var(--ds-space-2);
      background: var(--ds-surface);
      padding: var(--ds-space-4);
      border-radius: var(--ds-radius-md);
      margin-bottom: var(--ds-space-6);
      overflow-x: auto;
    }

    .tab-button {
      position: relative;
      padding: var(--ds-space-3) var(--ds-space-5);
      background: transparent;
      color: var(--ds-text-muted);
      border: none;
      border-radius: var(--ds-radius-sm);
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background var(--ds-transition-fast), color var(--ds-transition-fast);
      white-space: nowrap;
    }

    .tab-button:hover {
      background: var(--ds-surface-offset);
      color: var(--ds-text);
    }

    .tab-button.active {
      background: var(--ds-marine);
      color: var(--ds-text-inverse);
    }

    .badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: var(--ds-error);
      color: var(--ds-text-inverse);
      font-size: 11px;
      padding: 2px 6px;
      border-radius: var(--ds-radius-pill);
      min-width: 18px;
      text-align: center;
    }

    .tab-content {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    @media (max-width: 768px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }

      .dashboard-content {
        padding: 16px;
      }

      .tabs {
        flex-wrap: wrap;
      }
    }
  `]
})
export class CustomerPortalDashboardComponent implements OnInit {
  loading = true;
  dossier: CustomerPortalDossier | null = null;
  branding: any = null;
  brandingApplied = false;
  activeTab = 'overview';

  tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: '🏠' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'appointments', label: 'Rendez-vous', icon: '📅' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'recommendations', label: 'Recommandations', icon: '⭐' },
    { id: 'feedback', label: 'Évaluation', icon: '⭐' },
    { id: 'settings', label: 'Préférences', icon: '⚙️' }
  ];

  constructor(
    private portalService: CustomerPortalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const dossierId = this.portalService.currentDossierId;
    const orgId = this.portalService.currentOrgId;

    if (!dossierId || !orgId) {
      this.router.navigate(['/customer-portal/auth']);
      return;
    }

    this.loadBranding(orgId);
    this.loadDossier(dossierId);
  }

  loadBranding(orgId: string): void {
    this.portalService.getBranding(orgId).subscribe({
      next: (branding) => {
        this.branding = branding;
        this.applyBranding();
      },
      error: () => console.log('No custom branding')
    });
  }

  loadDossier(dossierId: number): void {
    this.portalService.getDossier(dossierId).subscribe({
      next: (dossier) => {
        this.dossier = dossier;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dossier:', err);
        this.loading = false;
      }
    });
  }

  applyBranding(): void {
    if (!this.branding) return;

    const root = document.documentElement;
    if (this.branding.primaryColor) {
      root.style.setProperty('--primary-color', this.branding.primaryColor);
    }
    if (this.branding.secondaryColor) {
      root.style.setProperty('--secondary-color', this.branding.secondaryColor);
    }
    if (this.branding.accentColor) {
      root.style.setProperty('--accent-color', this.branding.accentColor);
    }
    if (this.branding.customCss) {
      const style = document.createElement('style');
      style.textContent = this.branding.customCss;
      document.head.appendChild(style);
    }
    this.brandingApplied = true;
  }

  logout(): void {
    this.portalService.logout();
    this.router.navigate(['/customer-portal/auth']);
  }
}
