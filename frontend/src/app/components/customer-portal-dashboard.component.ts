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
          <img *ngIf="branding?.logoUrl" [src]="branding.logoUrl" alt="Logo" class="logo">
          <h1 *ngIf="!branding?.logoUrl">Portail Client</h1>
        </div>
        <div class="header-right">
          <span class="user-name">{{ dossier?.leadName }}</span>
          <button (click)="logout()" class="logout-button">Déconnexion</button>
        </div>
      </header>

      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Chargement de votre dossier...</p>
      </div>

      <div *ngIf="!loading && dossier" class="dashboard-content">
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
          <button *ngFor="let tab of tabs" 
                  [class.active]="activeTab === tab.id"
                  (click)="activeTab = tab.id"
                  class="tab-button">
            {{ tab.icon }} {{ tab.label }}
            <span *ngIf="tab.id === 'messages' && dossier.unreadMessagesCount > 0" 
                  class="badge">{{ dossier.unreadMessagesCount }}</span>
          </button>
        </div>

        <div class="tab-content">
          <div *ngIf="activeTab === 'overview'" class="tab-pane">
            <div class="grid-2">
              <app-dossier-timeline-view [activities]="dossier.activities"></app-dossier-timeline-view>
              <app-client-document-library [documents]="dossier.documents"></app-client-document-library>
            </div>
          </div>

          <div *ngIf="activeTab === 'messages'" class="tab-pane">
            <app-secure-message-thread [dossierId]="dossier.id"></app-secure-message-thread>
          </div>

          <div *ngIf="activeTab === 'appointments'" class="tab-pane">
            <app-appointment-request [dossierId]="dossier.id"></app-appointment-request>
          </div>

          <div *ngIf="activeTab === 'documents'" class="tab-pane">
            <app-client-document-library [documents]="dossier.documents"></app-client-document-library>
          </div>

          <div *ngIf="activeTab === 'recommendations'" class="tab-pane">
            <app-property-recommendation [dossierId]="dossier.id"></app-property-recommendation>
          </div>

          <div *ngIf="activeTab === 'feedback'" class="tab-pane">
            <app-client-satisfaction-survey [dossierId]="dossier.id"></app-client-satisfaction-survey>
          </div>

          <div *ngIf="activeTab === 'settings'" class="tab-pane">
            <app-consent-management [dossierId]="dossier.id"></app-consent-management>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: #f5f7fa;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
      color: #333;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .logout-button {
      padding: 8px 16px;
      background: #f0f0f0;
      color: #333;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .logout-button:hover {
      background: #e0e0e0;
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
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .dashboard-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .status-banner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px;
      border-radius: 12px;
      margin-bottom: 24px;
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
      background: rgba(255,255,255,0.2);
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
    }

    .progress-container {
      margin-top: 16px;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background: white;
      transition: width 0.5s ease;
    }

    .progress-text {
      font-size: 14px;
      opacity: 0.9;
    }

    .tabs {
      display: flex;
      gap: 8px;
      background: white;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      overflow-x: auto;
    }

    .tab-button {
      position: relative;
      padding: 12px 20px;
      background: transparent;
      color: #666;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .tab-button:hover {
      background: #f0f0f0;
      color: #333;
    }

    .tab-button.active {
      background: #667eea;
      color: white;
    }

    .badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #ff4444;
      color: white;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
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
      error: (err) => console.log('No custom branding')
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
