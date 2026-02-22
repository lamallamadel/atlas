import { Component } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ReportApiService, CustomReportDefinition, ReportColumn, ReportExportOptions } from '../services/report-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface DimensionOption {
  id: string;
  label: string;
  description: string;
}

interface MetricOption {
  id: string;
  label: string;
  description: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

@Component({
  selector: 'app-report-builder',
  templateUrl: './report-builder.component.html',
  styleUrls: ['./report-builder.component.scss']
})
export class ReportBuilderComponent {
  availableDimensions: DimensionOption[] = [
    { id: 'date', label: 'Date', description: 'Group by date' },
    { id: 'status', label: 'Status', description: 'Group by dossier status' },
    { id: 'source', label: 'Lead Source', description: 'Group by lead source' },
    { id: 'agent', label: 'Agent', description: 'Group by assigned agent' },
    { id: 'city', label: 'City', description: 'Group by property city' },
    { id: 'propertyType', label: 'Property Type', description: 'Group by property type' }
  ];

  availableMetrics: MetricOption[] = [
    { id: 'dossierCount', label: 'Dossier Count', description: 'Total number of dossiers', aggregation: 'count' },
    { id: 'conversionRate', label: 'Conversion Rate', description: 'Won/Total ratio', aggregation: 'avg' },
    { id: 'totalValue', label: 'Total Value', description: 'Sum of property values', aggregation: 'sum' },
    { id: 'avgResponseTime', label: 'Avg Response Time', description: 'Average response time in hours', aggregation: 'avg' },
    { id: 'appointmentCount', label: 'Appointment Count', description: 'Total appointments scheduled', aggregation: 'count' },
    { id: 'messageCount', label: 'Message Count', description: 'Total messages sent', aggregation: 'count' }
  ];

  selectedDimensions: DimensionOption[] = [];
  selectedMetrics: MetricOption[] = [];

  reportData: any[] = [];
  loading = false;
  reportGenerated = false;

  exportFormat: 'csv' | 'excel' | 'pdf' = 'pdf';
  reportTitle = 'Custom Report';
  reportSubtitle = '';

  constructor(
    private reportApiService: ReportApiService,
    private snackBar: MatSnackBar
  ) {}

  dropDimension(event: CdkDragDrop<DimensionOption[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  dropMetric(event: CdkDragDrop<MetricOption[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  removeDimension(dimension: DimensionOption): void {
    const index = this.selectedDimensions.indexOf(dimension);
    if (index >= 0) {
      this.selectedDimensions.splice(index, 1);
      this.availableDimensions.push(dimension);
    }
  }

  removeMetric(metric: MetricOption): void {
    const index = this.selectedMetrics.indexOf(metric);
    if (index >= 0) {
      this.selectedMetrics.splice(index, 1);
      this.availableMetrics.push(metric);
    }
  }

  generateReport(): void {
    if (this.selectedDimensions.length === 0 || this.selectedMetrics.length === 0) {
      this.snackBar.open('Please select at least one dimension and one metric', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    const definition: CustomReportDefinition = {
      dimensions: this.selectedDimensions.map(d => d.id),
      metrics: this.selectedMetrics.map(m => m.id),
      groupBy: this.selectedDimensions.map(d => d.id)
    };

    this.reportApiService.generateCustomReport(definition).subscribe({
      next: (data) => {
        this.reportData = data.results || [];
        this.reportGenerated = true;
        this.loading = false;
        this.snackBar.open('Report generated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error generating report', error);
        this.loading = false;
        this.snackBar.open('Error generating report', 'Close', { duration: 3000 });
        this.generateMockData();
      }
    });
  }

  async exportReport(): Promise<void> {
    if (!this.reportGenerated || this.reportData.length === 0) {
      this.snackBar.open('Please generate a report first', 'Close', { duration: 3000 });
      return;
    }

    const columns: ReportColumn[] = [
      ...this.selectedDimensions.map(d => ({
        field: d.id,
        header: d.label,
        format: 'text' as const
      })),
      ...this.selectedMetrics.map(m => ({
        field: m.id,
        header: m.label,
        format: m.id.includes('Rate') ? 'percentage' as const : 
                m.id.includes('Value') ? 'currency' as const : 'number' as const
      }))
    ];

    try {
      switch (this.exportFormat) {
        case 'csv':
          await this.reportApiService.exportToCSV(
            this.reportData, 
            columns, 
            `${this.reportTitle.replace(/\s+/g, '_')}.csv`
          );
          break;
        case 'excel':
          await this.reportApiService.exportToExcel(
            this.reportData, 
            columns, 
            `${this.reportTitle.replace(/\s+/g, '_')}.xlsx`
          );
          break;
        case 'pdf':
          await this.reportApiService.exportToPDF(
            this.reportData,
            columns,
            {
              title: this.reportTitle,
              subtitle: this.reportSubtitle || `Generated on ${new Date().toLocaleDateString('fr-FR')}`,
              branding: {
                companyName: 'CRM System',
                primaryColor: '#428bca'
              }
            },
            `${this.reportTitle.replace(/\s+/g, '_')}.pdf`
          );
          break;
      }
      this.snackBar.open('Report exported successfully', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error exporting report', error);
      this.snackBar.open('Error exporting report', 'Close', { duration: 3000 });
    }
  }

  private generateMockData(): void {
    const mockData = [];
    for (let i = 0; i < 10; i++) {
      const row: any = {};
      this.selectedDimensions.forEach(dim => {
        switch (dim.id) {
          case 'date':
            row[dim.id] = new Date(2024, 0, i + 1).toISOString().split('T')[0];
            break;
          case 'status':
            row[dim.id] = ['NEW', 'QUALIFIED', 'APPOINTMENT', 'WON'][i % 4];
            break;
          case 'source':
            row[dim.id] = ['WEBSITE', 'REFERRAL', 'PHONE'][i % 3];
            break;
          case 'agent':
            row[dim.id] = `Agent ${i % 3 + 1}`;
            break;
          default:
            row[dim.id] = `Value ${i}`;
        }
      });
      this.selectedMetrics.forEach(metric => {
        switch (metric.id) {
          case 'dossierCount':
            row[metric.id] = Math.floor(Math.random() * 50) + 10;
            break;
          case 'conversionRate':
            row[metric.id] = Math.random() * 0.5 + 0.2;
            break;
          case 'totalValue':
            row[metric.id] = Math.floor(Math.random() * 500000) + 100000;
            break;
          case 'avgResponseTime':
            row[metric.id] = Math.random() * 24 + 1;
            break;
          default:
            row[metric.id] = Math.floor(Math.random() * 100);
        }
      });
      mockData.push(row);
    }
    this.reportData = mockData;
    this.reportGenerated = true;
  }

  resetReport(): void {
    this.selectedDimensions.forEach(d => this.availableDimensions.push(d));
    this.selectedMetrics.forEach(m => this.availableMetrics.push(m));
    this.selectedDimensions = [];
    this.selectedMetrics = [];
    this.reportData = [];
    this.reportGenerated = false;
  }

  getDisplayedColumns(): string[] {
    return [
      ...this.selectedDimensions.map(d => d.id),
      ...this.selectedMetrics.map(m => m.id)
    ];
  }
}
