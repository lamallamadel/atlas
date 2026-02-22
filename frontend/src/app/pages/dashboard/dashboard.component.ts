import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DashboardKpiService } from '../../services/dashboard-kpi.service';
import { DossierResponse } from '../../services/dossier-api.service';
import { AnnonceApiService, AnnonceResponse } from '../../services/annonce-api.service';
import { AriaLiveAnnouncerService } from '../../services/aria-live-announcer.service';
import { ActionButtonConfig } from '../../components/empty-state.component';
import { DossierCreateDialogComponent } from '../dossiers/dossier-create-dialog.component';
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
  trendValue: number;
  badgeColor?: string;
  description?: string;
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
  selectedDossierFilter$ = new BehaviorSubject<string>('A_TRAITER');

  isHandset = false;
  isTablet = false;
  isDesktop = false;

  kpiCards: { [key: string]: KpiCard } = {
    annoncesActives: {
      title: 'Biens en Portefeuille',
      value: 0,
      displayValue: 0,
      loading: true,
      error: '',
      icon: 'home',
      color: '#2196f3',
      chartData: [12, 19, 15, 22, 18, 25, 28],
      trend: '',
      trendValue: 0,
      badgeColor: '#e67e22',
      description: 'Propriétés disponibles'
    },
    dossiersATraiter: {
      title: 'Leads Actifs',
      value: 0,
      displayValue: 0,
      loading: true,
      error: '',
      icon: 'person_add',
      color: '#ff9800',
      chartData: [8, 12, 10, 15, 13, 18, 20],

      trend: '',
      trendValue: 0,
      badgeColor: '#4caf50',
      description: 'Leads en attente'
    },
    conversionWhatsApp: {
      title: 'Conversion WhatsApp %',
      value: 0,
      displayValue: 0,
      loading: true,
      error: '',
      icon: 'connect_without_contact',
      color: '#25D366',
      chartData: [4, 6, 8, 10, 15, 18, 24],
      trend: '',
      trendValue: 0
    }
  };

  recentDossiers: DossierResponse[] = [];
  loadingRecent = false;
  errorRecent = '';

  yieldAnnonces: AnnonceResponse[] = [];
  loadingYield = false;

  @ViewChild('annoncesChart') annoncesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dossiersChart') dossiersChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('conversionWhatsAppChart') conversionWhatsAppChartRef!: ElementRef<HTMLCanvasElement>;

  private annoncesChart?: Chart;
  private dossiersChart?: Chart;
  private conversionWhatsAppChart?: Chart;

  constructor(
    private dashboardKpiService: DashboardKpiService,
    private router: Router,
    private ariaAnnouncer: AriaLiveAnnouncerService,
    private breakpointObserver: BreakpointObserver,
    private dialog: MatDialog,
    private annonceApiService: AnnonceApiService
  ) { }

  ngOnInit(): void {
    this.observeBreakpoints();
    this.loadKpis();
    this.observePeriodChanges();
    this.observeDossierFilterChanges();
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

  observeDossierFilterChanges(): void {
    this.selectedDossierFilter$
      .pipe(
        skip(1),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadRecentDossiers();
      });
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod$.next(period);
  }

  onDossierFilterChange(filter: string): void {
    this.selectedDossierFilter$.next(filter);
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
    if (this.conversionWhatsAppChart) {
      this.conversionWhatsAppChart.destroy();
    }
  }

  loadKpis(): void {
    this.loadTrends();
    this.loadRecentDossiers();
    this.loadYieldAnnonces();
  }

  loadTrends(): void {
    this.kpiCards['annoncesActives'].loading = true;
    this.kpiCards['annoncesActives'].error = '';
    this.kpiCards['dossiersATraiter'].loading = true;
    this.kpiCards['dossiersATraiter'].error = '';

    this.kpiCards['conversionWhatsApp'].loading = true;
    this.kpiCards['conversionWhatsApp'].error = '';

    const period = this.selectedPeriod$.value;
    this.dashboardKpiService.getTrends(period).subscribe({
      next: (trends) => {
        if (trends['annoncesActives']) {
          const annoncesData = trends['annoncesActives'];
          this.kpiCards['annoncesActives'].value = annoncesData.currentValue;
          this.kpiCards['annoncesActives'].trend = this.formatTrend(annoncesData.percentageChange);
          this.kpiCards['annoncesActives'].trendValue = annoncesData.percentageChange;
          this.kpiCards['annoncesActives'].loading = false;
          this.animateCounter('annoncesActives', annoncesData.currentValue);
          this.updateChart('annoncesActives', annoncesData.currentValue);
          this.ariaAnnouncer.announcePolite(`${annoncesData.currentValue} biens chargés`);
        }

        if (trends['dossiersATraiter']) {
          const dossiersData = trends['dossiersATraiter'];
          this.kpiCards['dossiersATraiter'].value = dossiersData.currentValue;
          this.kpiCards['dossiersATraiter'].trend = this.formatTrend(dossiersData.percentageChange);
          this.kpiCards['dossiersATraiter'].trendValue = dossiersData.percentageChange;
          this.kpiCards['dossiersATraiter'].loading = false;
          this.animateCounter('dossiersATraiter', dossiersData.currentValue);
          this.updateChart('dossiersATraiter', dossiersData.currentValue);
          this.ariaAnnouncer.announcePolite(`${dossiersData.currentValue} leads chargés`);
        }

        // Mock WhatsApp Conversion Rate
        const mockConversion = period === 'TODAY' ? 12 : period === 'LAST_7_DAYS' ? 18 : 24;
        this.kpiCards['conversionWhatsApp'].value = mockConversion;
        this.kpiCards['conversionWhatsApp'].trend = '+15%';
        this.kpiCards['conversionWhatsApp'].loading = false;
        this.animateCounter('conversionWhatsApp', mockConversion);
        this.updateChart('conversionWhatsApp', mockConversion);
      },
      error: () => {
        this.kpiCards['annoncesActives'].loading = false;
        this.kpiCards['annoncesActives'].error = 'Erreur lors du chargement des données';
        this.kpiCards['dossiersATraiter'].loading = false;
        this.kpiCards['dossiersATraiter'].error = 'Erreur lors du chargement des données';
        this.kpiCards['conversionWhatsApp'].loading = false;
        this.kpiCards['conversionWhatsApp'].error = 'Erreur serveur';
        this.ariaAnnouncer.announceAssertive('Erreur lors du chargement des données du tableau de bord');
      }
    });
  }

  formatTrend(percentageChange: number): string {
    if (percentageChange > 0) {
      return `+${Math.round(percentageChange)}%`;
    } else if (percentageChange < 0) {
      return `${Math.round(percentageChange)}%`;
    } else {
      return '0%';
    }
  }

  loadRecentDossiers(): void {
    this.loadingRecent = true;
    this.errorRecent = '';

    const filter = this.selectedDossierFilter$.value;
    this.dashboardKpiService.getRecentDossiers(filter).subscribe({
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

  loadYieldAnnonces(): void {
    this.loadingYield = true;
    this.annonceApiService.list({ size: 100, sort: 'updatedAt,desc' }).subscribe({
      next: (page) => {
        this.yieldAnnonces = page.content.filter(a => a.aiScoreDetails && a.aiScoreDetails.includes('Yield Management'));
        this.loadingYield = false;
      },
      error: () => {
        this.loadingYield = false;
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
    } else if (cardKey === 'conversionWhatsApp' && this.conversionWhatsAppChart) {
      this.conversionWhatsAppChart.data.datasets[0].data = [...card.chartData];
      this.conversionWhatsAppChart.update('none');
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

    if (this.conversionWhatsAppChartRef) {
      this.conversionWhatsAppChart = await this.createChart(
        this.conversionWhatsAppChartRef.nativeElement,
        this.kpiCards['conversionWhatsApp']
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

  onKpiCardClick(cardKey: string, event?: Event): void {
    if (this.kpiCards[cardKey].loading || this.kpiCards[cardKey].error) {
      return;
    }

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (cardKey === 'annoncesActives') {
      this.navigateToAnnoncesActives();
    } else if (cardKey === 'dossiersATraiter') {
      this.navigateToDossiersATraiter();
    }
  }

  getEmptyStatePrimaryAction(): ActionButtonConfig {
    return {
      label: 'Créer un dossier',
      handler: () => this.openCreateDossierDialog()
    };
  }

  getEmptyStateSecondaryAction(): ActionButtonConfig {
    return {
      label: 'Importer des leads',
      handler: () => this.openCreateDossierDialog()
    };
  }

  private openCreateDossierDialog(): void {
    const dialogRef = this.dialog.open(DossierCreateDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.openExisting) {
          this.router.navigate(['/dossiers', result.openExisting]);
        } else {
          this.loadRecentDossiers();
          if (result.id) {
            this.router.navigate(['/dossiers', result.id]);
          }
        }
      }
    });
  }

  isExportingToCSV = false;
  isExportingToPDF = false;

  async exportToCSV(): Promise<void> {
    if (this.isExportingToCSV) {
      return;
    }

    this.isExportingToCSV = true;

    try {
      const Papa = await import('papaparse');

      const csvData = this.recentDossiers.map(dossier => ({
        ID: dossier.id,
        'Lead Name': dossier.leadName,
        'Lead Phone': dossier.leadPhone,
        'Status': dossier.status,
        'Created At': dossier.createdAt
      }));

      const csv = Papa.unparse(csvData);

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `dossiers_${new Date().toISOString()}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.ariaAnnouncer.announcePolite('Export CSV terminé avec succès');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      this.ariaAnnouncer.announceAssertive('Erreur lors de l\'export CSV');
    } finally {
      this.isExportingToCSV = false;
    }
  }

  async exportToPDF(): Promise<void> {
    if (this.isExportingToPDF) {
      return;
    }

    this.isExportingToPDF = true;

    try {
      const [jsPDF, autoTable] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      const { jsPDF: JsPDFClass } = jsPDF;
      const doc = new JsPDFClass();

      doc.setFontSize(18);
      doc.text('Dashboard Report', 14, 20);

      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

      let yPosition = 45;

      doc.setFontSize(14);
      doc.text('KPI Summary', 14, yPosition);
      yPosition += 10;

      const kpiData = [
        ['Annonces Actives', this.kpiCards['annoncesActives'].value.toString(), this.kpiCards['annoncesActives'].trend],
        ['Dossiers à Traiter', this.kpiCards['dossiersATraiter'].value.toString(), this.kpiCards['dossiersATraiter'].trend]
      ];

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Metric', 'Value', 'Trend']],
        body: kpiData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      if (this.recentDossiers.length > 0) {
        doc.setFontSize(14);
        doc.text('Recent Dossiers', 14, yPosition);
        yPosition += 10;

        const dossierData = this.recentDossiers.map(dossier => [
          dossier.id.toString(),
          dossier.leadName || 'N/A',
          dossier.leadPhone || 'N/A',
          dossier.status,
          new Date(dossier.createdAt).toLocaleDateString()
        ]);

        (doc as any).autoTable({
          startY: yPosition,
          head: [['ID', 'Lead Name', 'Lead Phone', 'Status', 'Created At']],
          body: dossierData,
          theme: 'striped',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [66, 139, 202] }
        });
      }

      doc.save(`dashboard_report_${new Date().toISOString()}.pdf`);

      this.ariaAnnouncer.announcePolite('Export PDF terminé avec succès');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      this.ariaAnnouncer.announceAssertive('Erreur lors de l\'export PDF');
    } finally {
      this.isExportingToPDF = false;
    }
  }
}
