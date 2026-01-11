import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { PingService } from '../../services/ping.service';
import { DashboardKpiService } from '../../services/dashboard-kpi.service';
import { DossierResponse } from '../../services/dossier-api.service';
import { AriaLiveAnnouncerService } from '../../services/aria-live-announcer.service';
import { interval, Subject, takeUntil, takeWhile, BehaviorSubject, skip } from 'rxjs';
import { listStaggerAnimation, itemAnimation } from '../../animations/list-animations';

type Chart = any;
type ChartConfiguration = any;

interface KpiCard {
  title: string;
  value: number;
  displayValue: number;
  loading: boolean;
  error: string;
  icon: string;
  color: string;
  chartData: number[];
  trend: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  animations: [listStaggerAnimation, itemAnimation]
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  
  selectedPeriod$ = new BehaviorSubject<string>('TODAY');
  
  apiStatus: 'checking' | 'connected' | 'disconnected' = 'checking';
  lastChecked: Date | null = null;
  errorMessage = '';
  
  isHandset = false;
  isTablet = false;
  isDesktop = false;

  kpiCards: { [key: string]: KpiCard } = {
    annoncesActives: {
      title: 'Annonces actives',
      value: 0,
      displayValue: 0,
      loading: true,
      error: '',
      icon: 'home',
      color: '#2196f3',
      chartData: [12, 19, 15, 22, 18, 25, 28],
      trend: ''
    },
    dossiersATraiter: {
      title: 'Dossiers à traiter',
      value: 0,
      displayValue: 0,
      loading: true,
      error: '',
      icon: 'folder_open',
      color: '#ff9800',
      chartData: [8, 12, 10, 15, 13, 18, 20],
      trend: ''
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
    private ariaAnnouncer: AriaLiveAnnouncerService,
    private breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit(): void {
    this.observeBreakpoints();
    this.checkApiConnection();
    this.loadKpis();
    this.observePeriodChanges();
  }

  observePeriodChanges(): void {
    this.selectedPeriod$
      .pipe(
        skip(1),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadKpis();
      });
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod$.next(period);
  }

  observeBreakpoints(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet, Breakpoints.Web])
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isHandset = this.breakpointObserver.isMatched(Breakpoints.Handset);
        this.isTablet = this.breakpointObserver.isMatched(Breakpoints.Tablet);
        this.isDesktop = this.breakpointObserver.isMatched(Breakpoints.Web);
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadChartJsAndInitCharts();
    }, 100);
  }

  private async loadChartJsAndInitCharts(): Promise<void> {
    try {
      await import('chart.js/auto');
      this.initCharts();
    } catch (error) {
      console.error('Failed to load Chart.js:', error);
    }
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

    const period = this.selectedPeriod$.value;
    this.dashboardKpiService.getActiveAnnoncesCount(period).subscribe({
      next: (response) => {
        this.kpiCards['annoncesActives'].value = response.value;
        this.kpiCards['annoncesActives'].trend = response.trend;
        this.kpiCards['annoncesActives'].loading = false;
        this.animateCounter('annoncesActives', response.value);
        this.updateChart('annoncesActives', response.value);
        this.ariaAnnouncer.announcePolite(`${response.value} annonces actives chargées`);
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

    const period = this.selectedPeriod$.value;
    this.dashboardKpiService.getDossiersATraiterCount(period).subscribe({
      next: (response) => {
        this.kpiCards['dossiersATraiter'].value = response.value;
        this.kpiCards['dossiersATraiter'].trend = response.trend;
        this.kpiCards['dossiersATraiter'].loading = false;
        this.animateCounter('dossiersATraiter', response.value);
        this.updateChart('dossiersATraiter', response.value);
        this.ariaAnnouncer.announcePolite(`${response.value} dossiers à traiter chargés`);
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

  async initCharts(): Promise<void> {
    if (this.annoncesChartRef) {
      this.annoncesChart = await this.createChart(
        this.annoncesChartRef.nativeElement,
        this.kpiCards['annoncesActives']
      );
    }

    if (this.dossiersChartRef) {
      this.dossiersChart = await this.createChart(
        this.dossiersChartRef.nativeElement,
        this.kpiCards['dossiersATraiter']
      );
    }
  }

  async createChart(canvas: HTMLCanvasElement, card: KpiCard): Promise<Chart> {
    const chartModule = await import('chart.js/auto');
    const Chart = chartModule.Chart;
    
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

  trackByKey(index: number, key: string): string {
    return key;
  }

  trackByDossierId(index: number, dossier: DossierResponse): number {
    return dossier.id;
  }

  getPeriodLabel(period: string): string {
    switch (period) {
      case 'TODAY':
        return "aujourd'hui";
      case 'LAST_7_DAYS':
        return '7 derniers jours';
      case 'LAST_30_DAYS':
        return '30 derniers jours';
      default:
        return '';
    }
  }

  onKpiCardClick(cardKey: string): void {
    if (this.kpiCards[cardKey].loading || this.kpiCards[cardKey].error) {
      return;
    }
    
    if (cardKey === 'annoncesActives') {
      this.navigateToAnnoncesActives();
    } else if (cardKey === 'dossiersATraiter') {
      this.navigateToDossiersATraiter();
    }
  }
}
