import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { MLService } from '../../services/ml.service';

@Component({
  selector: 'app-ml-insights-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ml-insights-dashboard.component.html',
  styleUrls: ['./ml-insights-dashboard.component.scss']
})
export class MLInsightsDashboardComponent implements OnInit {
  modelInfo: any = null;
  featureImportance: any[] = [];
  modelVersions: any[] = [];
  activeExperiments: any[] = [];
  loading = false;
  error: string | null = null;

  featureImportanceChart: Chart | null = null;
  modelMetricsChart: Chart | null = null;
  experimentComparisonChart: Chart | null = null;

  constructor(private mlService: MLService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      await Promise.all([
        this.loadModelInfo(),
        this.loadFeatureImportance(),
        this.loadModelVersions(),
        this.loadExperiments()
      ]);

      setTimeout(() => this.renderCharts(), 100);
    } catch (error: any) {
      this.error = error.message || 'Failed to load dashboard data';
      console.error('Error loading dashboard:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadModelInfo(): Promise<void> {
    this.modelInfo = await this.mlService.getModelInfo().toPromise();
  }

  async loadFeatureImportance(): Promise<void> {
    const data = await this.mlService.getFeatureImportance().toPromise();
    this.featureImportance = data.features || [];
  }

  async loadModelVersions(): Promise<void> {
    this.modelVersions = await this.mlService.getModelVersions().toPromise();
  }

  async loadExperiments(): Promise<void> {
    this.activeExperiments = await this.mlService.getExperiments().toPromise();
  }

  renderCharts(): void {
    this.renderFeatureImportanceChart();
    this.renderModelMetricsChart();
    this.renderExperimentComparisonChart();
  }

  renderFeatureImportanceChart(): void {
    const canvas = document.getElementById('featureImportanceChart') as HTMLCanvasElement;
    if (!canvas || this.featureImportance.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.featureImportanceChart) {
      this.featureImportanceChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.featureImportance.slice(0, 10).map(f => this.formatFeatureName(f.feature)),
        datasets: [{
          label: 'Feature Importance',
          data: this.featureImportance.slice(0, 10).map(f => f.importance),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Top 10 Most Important Features'
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Importance Score'
            }
          }
        }
      }
    };

    this.featureImportanceChart = new Chart(ctx, config);
  }

  renderModelMetricsChart(): void {
    const canvas = document.getElementById('modelMetricsChart') as HTMLCanvasElement;
    if (!canvas || !this.modelInfo?.metrics) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.modelMetricsChart) {
      this.modelMetricsChart.destroy();
    }

    const metrics = this.modelInfo.metrics;
    const config: ChartConfiguration = {
      type: 'radar',
      data: {
        labels: ['Precision', 'Recall', 'F1 Score', 'ROC-AUC', 'Accuracy'],
        datasets: [{
          label: 'Model Performance',
          data: [
            metrics.precision || 0,
            metrics.recall || 0,
            metrics.f1_score || 0,
            metrics.roc_auc || 0,
            metrics.accuracy || 0
          ],
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(255, 99, 132, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Model Performance Metrics'
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 1,
            ticks: {
              stepSize: 0.2
            }
          }
        }
      }
    };

    this.modelMetricsChart = new Chart(ctx, config);
  }

  renderExperimentComparisonChart(): void {
    const canvas = document.getElementById('experimentComparisonChart') as HTMLCanvasElement;
    if (!canvas || this.activeExperiments.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.experimentComparisonChart) {
      this.experimentComparisonChart.destroy();
    }

    const experimentWithMetrics = this.activeExperiments.filter(e => 
      e.control_metrics && e.treatment_metrics
    );

    if (experimentWithMetrics.length === 0) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: experimentWithMetrics.map(e => e.experiment_name),
        datasets: [
          {
            label: 'Control (Rule-Based)',
            data: experimentWithMetrics.map(e => e.control_metrics.conversion_rate || 0),
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Treatment (ML)',
            data: experimentWithMetrics.map(e => e.treatment_metrics.conversion_rate || 0),
            backgroundColor: 'rgba(153, 102, 255, 0.8)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'A/B Test Conversion Rates'
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            title: {
              display: true,
              text: 'Conversion Rate'
            },
            ticks: {
              callback: (value) => `${(Number(value) * 100).toFixed(0)}%`
            }
          }
        }
      }
    };

    this.experimentComparisonChart = new Chart(ctx, config);
  }

  formatFeatureName(feature: string): string {
    return feature
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  formatMetric(value: number): string {
    return (value * 100).toFixed(2) + '%';
  }

  async trainNewModel(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      await this.mlService.trainModel().toPromise();
      alert('Model training started. This may take several minutes.');
      await this.loadDashboardData();
    } catch (error: any) {
      this.error = error.message || 'Failed to train model';
      console.error('Error training model:', error);
    } finally {
      this.loading = false;
    }
  }

  async rollbackToVersion(version: string): Promise<void> {
    if (!confirm(`Are you sure you want to rollback to version ${version}?`)) {
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      await this.mlService.rollbackModel(version).toPromise();
      alert('Model rolled back successfully.');
      await this.loadDashboardData();
    } catch (error: any) {
      this.error = error.message || 'Failed to rollback model';
      console.error('Error rolling back model:', error);
    } finally {
      this.loading = false;
    }
  }

  getConfidenceLevel(experiment: any): string {
    const controlRate = experiment.control_metrics?.conversion_rate || 0;
    const treatmentRate = experiment.treatment_metrics?.conversion_rate || 0;
    const improvement = ((treatmentRate - controlRate) / controlRate * 100);
    
    if (Math.abs(improvement) < 5) return 'Low';
    if (Math.abs(improvement) < 15) return 'Medium';
    return 'High';
  }

  ngOnDestroy(): void {
    if (this.featureImportanceChart) {
      this.featureImportanceChart.destroy();
    }
    if (this.modelMetricsChart) {
      this.modelMetricsChart.destroy();
    }
    if (this.experimentComparisonChart) {
      this.experimentComparisonChart.destroy();
    }
  }
}
