import { Component, OnInit } from '@angular/core';
import { ChartDataset } from './chart.component';
import { ChartColorPaletteService } from '../../services/chart-color-palette.service';

@Component({
  selector: 'app-chart-demo',
  templateUrl: './chart-demo.component.html',
  styleUrls: ['./chart-demo.component.css']
})
export class ChartDemoComponent implements OnInit {
  darkMode = false;
  selectedPalette = 'default';
  
  barChartLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
  barChartDatasets: ChartDataset[] = [];

  lineChartLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  lineChartDatasets: ChartDataset[] = [];

  pieChartLabels = ['Vente', 'Location', 'Gestion', 'Syndic'];
  pieChartDatasets: ChartDataset[] = [];

  doughnutChartLabels = ['Nouveau', 'En cours', 'Gagné', 'Perdu'];
  doughnutChartDatasets: ChartDataset[] = [];

  areaChartLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
  areaChartDatasets: ChartDataset[] = [];

  radarChartLabels = ['Réactivité', 'Qualité', 'Prix', 'Service', 'Communication'];
  radarChartDatasets: ChartDataset[] = [];

  stackedBarLabels = ['T1', 'T2', 'T3', 'T4'];
  stackedBarDatasets: ChartDataset[] = [];

  multiLineLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
  multiLineDatasets: ChartDataset[] = [];

  kpiData = [
    { label: 'Ventes Totales', value: '€3.2M', trend: '+12.5%', trendType: 'positive' },
    { label: 'Transactions', value: '847', trend: '+8.3%', trendType: 'positive' },
    { label: 'Taux Conversion', value: '24.5%', trend: '-2.1%', trendType: 'negative' },
    { label: 'Leads Actifs', value: '1,234', trend: '+15.7%', trendType: 'positive' }
  ];

  palettes: string[] = [];

  constructor(private colorService: ChartColorPaletteService) {}

  ngOnInit(): void {
    this.palettes = this.colorService.getAllPalettes().map(p => p.name.toLowerCase());
    this.initializeChartData();
  }

  initializeChartData(): void {
    this.updateBarChart();
    this.updateLineChart();
    this.updatePieChart();
    this.updateDoughnutChart();
    this.updateAreaChart();
    this.updateRadarChart();
    this.updateStackedBarChart();
    this.updateMultiLineChart();
  }

  updateBarChart(): void {
    const color = this.colorService.getChartColor(this.selectedPalette, 0);
    this.barChartDatasets = [
      {
        label: 'Ventes Mensuelles',
        data: [65, 78, 90, 81, 56, 95],
        backgroundColor: color.alpha20,
        borderColor: color.solid,
        borderWidth: 2
      }
    ];
  }

  updateLineChart(): void {
    const color = this.colorService.getChartColor(this.selectedPalette, 1);
    this.lineChartDatasets = [
      {
        label: 'Visites',
        data: [45, 52, 48, 65, 72, 68, 85],
        backgroundColor: color.alpha20,
        borderColor: color.solid,
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ];
  }

  updatePieChart(): void {
    const colors = [0, 1, 2, 3].map(i => 
      this.colorService.getChartColor(this.selectedPalette, i)
    );
    this.pieChartDatasets = [
      {
        label: 'Répartition',
        data: [45, 30, 15, 10],
        backgroundColor: colors.map(c => c.solid),
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ];
  }

  updateDoughnutChart(): void {
    const colors = [0, 1, 2, 3].map(i => 
      this.colorService.getChartColor(this.selectedPalette, i)
    );
    this.doughnutChartDatasets = [
      {
        label: 'Statut Dossiers',
        data: [150, 95, 70, 35],
        backgroundColor: colors.map(c => c.solid),
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ];
  }

  updateAreaChart(): void {
    const color = this.colorService.getChartColor(this.selectedPalette, 2);
    this.areaChartDatasets = [
      {
        label: 'Revenus',
        data: [120, 150, 180, 165, 190, 210],
        backgroundColor: color.alpha40,
        borderColor: color.solid,
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ];
  }

  updateRadarChart(): void {
    const colors = [0, 1].map(i => 
      this.colorService.getChartColor(this.selectedPalette, i)
    );
    this.radarChartDatasets = [
      {
        label: 'Agent A',
        data: [85, 90, 75, 80, 95],
        backgroundColor: colors[0].alpha40,
        borderColor: colors[0].solid,
        borderWidth: 2
      },
      {
        label: 'Agent B',
        data: [70, 85, 90, 75, 80],
        backgroundColor: colors[1].alpha40,
        borderColor: colors[1].solid,
        borderWidth: 2
      }
    ];
  }

  updateStackedBarChart(): void {
    const colors = [0, 1, 2].map(i => 
      this.colorService.getChartColor(this.selectedPalette, i)
    );
    this.stackedBarDatasets = [
      {
        label: 'Appartements',
        data: [30, 45, 40, 50],
        backgroundColor: colors[0].solid
      },
      {
        label: 'Maisons',
        data: [20, 25, 30, 28],
        backgroundColor: colors[1].solid
      },
      {
        label: 'Commerces',
        data: [10, 15, 12, 18],
        backgroundColor: colors[2].solid
      }
    ];
  }

  updateMultiLineChart(): void {
    const colors = [0, 1, 2].map(i => 
      this.colorService.getChartColor(this.selectedPalette, i)
    );
    this.multiLineDatasets = [
      {
        label: '2023',
        data: [50, 60, 55, 70, 65, 80],
        borderColor: colors[0].solid,
        backgroundColor: colors[0].alpha20,
        borderWidth: 2,
        fill: false,
        tension: 0.4
      },
      {
        label: '2024',
        data: [65, 75, 70, 85, 90, 100],
        borderColor: colors[1].solid,
        backgroundColor: colors[1].alpha20,
        borderWidth: 2,
        fill: false,
        tension: 0.4
      },
      {
        label: 'Objectif',
        data: [60, 70, 75, 80, 85, 95],
        borderColor: colors[2].solid,
        backgroundColor: colors[2].alpha20,
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.4
      }
    ];
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
  }

  onPaletteChange(): void {
    this.initializeChartData();
  }

  onChartClick(event: any): void {
    console.log('Chart clicked:', event);
  }

  onChartHover(event: any): void {
    console.log('Chart hovered:', event);
  }

  onExportComplete(event: { format: string; blob: Blob }): void {
    console.log(`Chart exported as ${event.format}`, event.blob);
  }
}
