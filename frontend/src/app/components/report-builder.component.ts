import { Component, inject } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { ReportApiService, CustomReportDefinition, ReportColumn } from '../services/report-api.service';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, CurrencyPipe, CommonModule } from '@angular/common';
import { DS_CHART_FALLBACK_HEX } from '../design-system/chart-ds-colors';
import { 
  DsCardComponent, 
  DsSkeletonComponent, 
  DsButtonComponent, 
  DsIconComponent, 
  DsSelectComponent, 
  DsSelectOption,
  DsInputComponent,
  DsToastService,
  DsTableComponent,
  DsColumn
} from '../design-system';

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
    standalone: true,
    templateUrl: './report-builder.component.html',
    styleUrls: ['./report-builder.component.scss'],
    imports: [
      CommonModule,
      DsCardComponent, 
      DsSkeletonComponent, 
      CdkDropList, 
      CdkDrag, 
      FormsModule, 
      DecimalPipe, 
      CurrencyPipe,
      DsButtonComponent,
      DsIconComponent,
      DsSelectComponent,
      DsInputComponent,
      DsTableComponent
    ]
})
export class ReportBuilderComponent {
  private reportApiService = inject(ReportApiService);
  private toastService = inject(DsToastService);

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
  dsColumns: DsColumn<any>[] = [];
  loading = false;
  reportGenerated = false;

  exportFormat: 'csv' | 'excel' | 'pdf' = 'pdf';
  reportTitle = 'Custom Report';
  reportSubtitle = '';

  readonly exportFormatOptions: DsSelectOption[] = [
    { value: 'csv', label: 'CSV' },
    { value: 'excel', label: 'Excel (.xlsx)' },
    { value: 'pdf', label: 'PDF' }
  ];

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
      this.toastService.warning('Veuillez sélectionner au moins une dimension et une métrique');
      return;
    }

    this.loading = true;
    const definition: CustomReportDefinition = {
      dimensions: this.selectedDimensions.map(d => d.id),
      metrics: this.selectedMetrics.map(m => m.id),
      groupBy: this.selectedDimensions.map(d => d.id)
    };

    this.updateDsColumns();

    this.reportApiService.generateCustomReport(definition).subscribe({
      next: (data) => {
        this.reportData = data.results || [];
        this.reportGenerated = true;
        this.loading = false;
        this.toastService.success('Rapport généré avec succès');
      },
      error: (error) => {
        console.error('Error generating report', error);
        this.loading = false;
        this.toastService.error('Erreur lors de la génération du rapport');
        this.generateMockData();
      }
    });
  }

  private updateDsColumns(): void {
    this.dsColumns = [
      ...this.selectedDimensions.map(d => ({
        key: d.id,
        header: d.label
      })),
      ...this.selectedMetrics.map(m => ({
        key: m.id,
        header: m.label,
        align: 'right' as const
      }))
    ];
  }

  async exportReport(): Promise<void> {
    if (!this.reportGenerated || this.reportData.length === 0) {
      this.toastService.warning('Veuillez d\'abord générer un rapport');
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
          await this.reportApiService.exportToCSV(this.reportData, columns, `${this.reportTitle.replace(/\s+/g, '_')}.csv`);
          break;
        case 'excel':
          await this.reportApiService.exportToExcel(this.reportData, columns, `${this.reportTitle.replace(/\s+/g, '_')}.xlsx`);
          break;
        case 'pdf':
          await this.reportApiService.exportToPDF(
            this.reportData,
            columns,
            {
              title: this.reportTitle,
              subtitle: this.reportSubtitle || `Generated on ${new Date().toLocaleDateString('fr-FR')}`,
              branding: {
                companyName: 'Atlasia CRM',
                primaryColor: DS_CHART_FALLBACK_HEX['--ds-marine'],
              }
            },
            `${this.reportTitle.replace(/\s+/g, '_')}.pdf`
          );
          break;
      }
      this.toastService.success('Rapport exporté avec succès');
    } catch (error) {
      console.error('Error exporting report', error);
      this.toastService.error('Erreur lors de l\'export du rapport');
    }
  }

  private generateMockData(): void {
    const mockData = [];
    for (let i = 0; i < 10; i++) {
      const row: any = {};
      this.selectedDimensions.forEach(dim => {
        switch (dim.id) {
          case 'date': row[dim.id] = new Date(2024, 0, i + 1).toISOString().split('T')[0]; break;
          case 'status': row[dim.id] = ['NEW', 'QUALIFIED', 'APPOINTMENT', 'WON'][i % 4]; break;
          case 'source': row[dim.id] = ['WEBSITE', 'REFERRAL', 'PHONE'][i % 3]; break;
          case 'agent': row[dim.id] = `Agent ${i % 3 + 1}`; break;
          default: row[dim.id] = `Value ${i}`;
        }
      });
      this.selectedMetrics.forEach(metric => {
        switch (metric.id) {
          case 'dossierCount': row[metric.id] = Math.floor(Math.random() * 50) + 10; break;
          case 'conversionRate': row[metric.id] = Math.random() * 0.5 + 0.2; break;
          case 'totalValue': row[metric.id] = Math.floor(Math.random() * 500000) + 100000; break;
          case 'avgResponseTime': row[metric.id] = Math.random() * 24 + 1; break;
          default: row[metric.id] = Math.floor(Math.random() * 100);
        }
      });
      mockData.push(row);
    }
    this.reportData = mockData;
    this.reportGenerated = true;
    this.updateDsColumns();
  }

  resetReport(): void {
    this.selectedDimensions.forEach(d => this.availableDimensions.push(d));
    this.selectedMetrics.forEach(m => this.availableMetrics.push(m));
    this.selectedDimensions = [];
    this.selectedMetrics = [];
    this.reportData = [];
    this.reportGenerated = false;
  }
}
