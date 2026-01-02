import { Component, OnInit } from '@angular/core';
import { PingService } from '../../services/ping.service';
import { DashboardKpiService } from '../../services/dashboard-kpi.service';
import { DossierResponse } from '../../services/dossier-api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  apiStatus: 'checking' | 'connected' | 'disconnected' = 'checking';
  lastChecked: Date | null = null;
  errorMessage = '';

  annoncesActivesCount: number | null = null;
  dossiersATraiterCount: number | null = null;
  recentDossiers: DossierResponse[] = [];

  loadingAnnonces = false;
  loadingDossiers = false;
  loadingRecent = false;

  errorAnnonces = '';
  errorDossiers = '';
  errorRecent = '';

  constructor(
    private pingService: PingService,
    private dashboardKpiService: DashboardKpiService
  ) { }

  ngOnInit(): void {
    this.checkApiConnection();
    this.loadKpis();
  }

  checkApiConnection(): void {
    this.apiStatus = 'checking';
    this.errorMessage = '';

    this.pingService.ping().subscribe({
      next: (response) => {
        this.apiStatus = 'connected';
        this.lastChecked = new Date();
      },
      error: (error) => {
        this.apiStatus = 'disconnected';
        this.lastChecked = new Date();
        this.errorMessage = error.status ?
          `HTTP ${error.status}: ${error.statusText}` :
          'Unable to reach the API server';
      }
    });
  }

  loadKpis(): void {
    this.loadActiveAnnoncesCount();
    this.loadDossiersATraiterCount();
    this.loadRecentDossiers();
  }

  loadActiveAnnoncesCount(): void {
    this.loadingAnnonces = true;
    this.errorAnnonces = '';

    this.dashboardKpiService.getActiveAnnoncesCount().subscribe({
      next: (count) => {
        this.annoncesActivesCount = count;
        this.loadingAnnonces = false;
      },
      error: (error) => {
        this.loadingAnnonces = false;
        this.errorAnnonces = 'Erreur lors du chargement des annonces actives';
      }
    });
  }

  loadDossiersATraiterCount(): void {
    this.loadingDossiers = true;
    this.errorDossiers = '';

    this.dashboardKpiService.getDossiersATraiterCount().subscribe({
      next: (count) => {
        this.dossiersATraiterCount = count;
        this.loadingDossiers = false;
      },
      error: (error) => {
        this.loadingDossiers = false;
        this.errorDossiers = 'Erreur lors du chargement des dossiers à traiter';
      }
    });
  }

  loadRecentDossiers(): void {
    this.loadingRecent = true;
    this.errorRecent = '';

    this.dashboardKpiService.getRecentDossiers().subscribe({
      next: (dossiers) => {
        this.recentDossiers = dossiers;
        this.loadingRecent = false;
      },
      error: (error) => {
        this.loadingRecent = false;
        this.errorRecent = 'Erreur lors du chargement des derniers dossiers';
      }
    });
  }
}
