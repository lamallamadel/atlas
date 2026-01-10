import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { PingService } from '../../services/ping.service';
import { DashboardKpiService } from '../../services/dashboard-kpi.service';
import { DossierResponse } from '../../services/dossier-api.service';
import { AriaLiveAnnouncerService } from '../../services/aria-live-announcer.service';
import { interval, Subject, takeUntil, takeWhile } from 'rxjs';
import { Chart, ChartConfiguration } from 'chart.js/auto';

interface KpiCard {
  title: string;
  value: number;
  displayValue: number;
  loading: boolean;
  error: string;
  icon: string;
  color: string;
  chartData: number[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  
  apiStatus: 'checking' | 'connected' | 'disconnected' = 'checking';
  lastChecked: Date | null = null;
  errorMessage = '';

  kpiCards: { [key: string]: KpiCard } = {
    annoncesActives: {
      title: 'Annonces actives',
      value: 0,
      displayValue: 0,
      loading: true,
      error: '',
      icon: 'home',
      color: '#2196f3',
      chartData: [12, 19, 15, 22, 18, 25, 28]
    },
    dossiersATraiter: {
      title: 'Dossiers à traiter',
      value: 0,
      displayValue: 0,
      loading: true,
      error: '',
      icon: 'folder_open',
      color: '#ff9800',
      chartData: [8, 12, 10, 15, 13, 18, 20]
    }
  };

  recentDossiers: DossierResponse[] = [];
  loadingRecent = false;
  errorRecent = '';

  @ViewChild('annoncesChart') annoncesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dossiersChart') dossiersChartRef!: ElementRef<HTMLCanvasElement>;
  
  private annoncesChart?: Chart;
  private dossiersChart?: Chart;

  constructor(
    private pingService: PingService,
    private dashboardKpiService: DashboardKpiService,
    private router: Router,
    private ariaAnnouncer: AriaLiveAnnouncerService
  ) { }

  ngOnInit(): void {
    this.checkApiConnection();
    this.loadKpis();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.annoncesChart) {
      this.annoncesChart.destroy();
    }
    if (this.dossiersChart) {
      this.dossiersChart.destroy();
    }
  }

  checkApiConnection(): void {
    this.apiStatus = 'checking';
    this.errorMessage = '';
    this.ariaAnnouncer.announcePolite('Vérification de la connexion API en cours');

    this.pingService.ping().subscribe({
      next: () => {
        this.apiStatus = 'connected';
        this.lastChecked = new Date();
        this.ariaAnnouncer.announcePolite('Connexion API établie avec succès');
      },
      error: (error) => {
        this.apiStatus = 'disconnected';
        this.lastChecked = new Date();
        this.errorMessage = error.status ?
          `HTTP ${error.status}: ${error.statusText}` :
          'Unable to reach the API server';
        this.ariaAnnouncer.announceAssertive('Échec de la connexion API: ' + this.errorMessage);
      }
    });
  }

  loadKpis(): void {
    this.loadActiveAnnoncesCount();
    this.loadDossiersATraiterCount();
    this.loadRecentDossiers();
  }

  loadActiveAnnoncesCount(): void {
    this.kpiCards['annoncesActives'].loading = true;
    this.kpiCards['annoncesActives'].error = '';

    this.dashboardKpiService.getActiveAnnoncesCount().subscribe({
      next: (count) => {
        this.kpiCards['annoncesActives'].value = count;
        this.kpiCards['annoncesActives'].loading = false;
        this.animateCounter('annoncesActives', count);
        this.updateChart('annoncesActives', count);
        this.ariaAnnouncer.announcePolite(`${count} annonces actives chargées`);
      },
      error: () => {
        this.kpiCards['annoncesActives'].loading = false;
        this.kpiCards['annoncesActives'].error = 'Erreur lors du chargement des annonces actives';
        this.ariaAnnouncer.announceAssertive('Erreur lors du chargement des annonces actives');
      }
    });
  }

  loadDossiersATraiterCount(): void {
    this.kpiCards['dossiersATraiter'].loading = true;
    this.kpiCards['dossiersATraiter'].error = '';

    this.dashboardKpiService.getDossiersATraiterCount().subscribe({
      next: (count) => {
        this.kpiCards['dossiersATraiter'].value = count;
        this.kpiCards['dossiersATraiter'].loading = false;
        this.animateCounter('dossiersATraiter', count);
        this.updateChart('dossiersATraiter', count);
        this.ariaAnnouncer.announcePolite(`${count} dossiers à traiter chargés`);
      },
      error: () => {
        this.kpiCards['dossiersATraiter'].loading = false;
        this.kpiCards['dossiersATraiter'].error = 'Erreur lors du chargement des dossiers à traiter';
        this.ariaAnnouncer.announceAssertive('Erreur lors du chargement des dossiers à traiter');
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
        this.ariaAnnouncer.announcePolite(`${dossiers.length} dossiers récents chargés`);
      },
      error: () => {
        this.loadingRecent = false;
        this.errorRecent = 'Erreur lors du chargement des derniers dossiers';
        this.ariaAnnouncer.announceAssertive('Erreur lors du chargement des derniers dossiers');
      }
    });
  }

  animateCounter(cardKey: string, targetValue: number): void {
    const duration = 1000;
    const steps = 60;
    const increment = targetValue / steps;
    let currentStep = 0;

    interval(duration / steps)
      .pipe(
        takeWhile(() => currentStep < steps),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          currentStep++;
          this.kpiCards[cardKey].displayValue = Math.min(
            Math.round(increment * currentStep),
            targetValue
          );
        },
        complete: () => {
          this.kpiCards[cardKey].displayValue = targetValue;
        }
      });
  }

  updateChart(cardKey: string, newValue: number): void {
    const card = this.kpiCards[cardKey];
    card.chartData.push(newValue);
    if (card.chartData.length > 7) {
      card.chartData.shift();
    }

    if (cardKey === 'annoncesActives' && this.annoncesChart) {
      this.annoncesChart.data.datasets[0].data = [...card.chartData];
      this.annoncesChart.update('none');
    } else if (cardKey === 'dossiersATraiter' && this.dossiersChart) {
      this.dossiersChart.data.datasets[0].data = [...card.chartData];
      this.dossiersChart.update('none');
    }
  }

  initCharts(): void {
    if (this.annoncesChartRef) {
      this.annoncesChart = this.createChart(
        this.annoncesChartRef.nativeElement,
        this.kpiCards['annoncesActives']
      );
    }

    if (this.dossiersChartRef) {
      this.dossiersChart = this.createChart(
        this.dossiersChartRef.nativeElement,
        this.kpiCards['dossiersATraiter']
      );
    }
  }

  createChart(canvas: HTMLCanvasElement, card: KpiCard): Chart {
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'J-1', 'Aujourd\'hui'],
        datasets: [{
          label: card.title,
          data: card.chartData,
          borderColor: card.color,
          backgroundColor: this.hexToRgba(card.color, 0.1),
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: card.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              }
            }
          },
          y: {
            display: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 10
              },
              precision: 0
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    return new Chart(canvas, config);
  }

  hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  navigateToAnnoncesActives(): void {
    this.router.navigate(['/annonces'], { 
      queryParams: { status: 'ACTIVE' }
    });
  }

  navigateToDossiersATraiter(): void {
    this.router.navigate(['/dossiers'], { 
      queryParams: { status: 'NEW' }
    });
  }

  getKpiCardKeys(): string[] {
    return Object.keys(this.kpiCards);
  }
}
