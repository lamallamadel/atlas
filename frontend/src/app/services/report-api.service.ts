import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReportColumn {
  field: string;
  header: string;
  format?: 'text' | 'number' | 'currency' | 'date' | 'percentage';
  width?: number;
}

export interface ReportExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  columns?: ReportColumn[];
  title?: string;
  subtitle?: string;
  includeHeaders?: boolean;
  includeFooter?: boolean;
  branding?: {
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
  };
}

export interface CustomReportDefinition {
  dimensions: string[];
  metrics: string[];
  filters?: Record<string, any>;
  groupBy?: string[];
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportApiService {
  private readonly apiUrl = '/api/v1/reports';

  constructor(private http: HttpClient) {}

  generateCustomReport(definition: CustomReportDefinition, orgId?: string): Observable<any> {
    let params = new HttpParams();
    if (orgId) {
      params = params.set('orgId', orgId);
    }
    return this.http.post<any>(`${this.apiUrl}/custom`, definition, { params });
  }

  exportReport(reportId: string, options: ReportExportOptions, orgId?: string): Observable<Blob> {
    let params = new HttpParams();
    if (orgId) {
      params = params.set('orgId', orgId);
    }
    return this.http.post(`${this.apiUrl}/${reportId}/export`, options, {
      params,
      responseType: 'blob'
    });
  }

  exportCustomReport(definition: CustomReportDefinition, options: ReportExportOptions, orgId?: string): Observable<Blob> {
    let params = new HttpParams();
    if (orgId) {
      params = params.set('orgId', orgId);
    }
    return this.http.post(`${this.apiUrl}/custom/export`, { definition, options }, {
      params,
      responseType: 'blob'
    });
  }

  getAvailableDimensions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/dimensions`);
  }

  getAvailableMetrics(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/metrics`);
  }

  private downloadFile(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async exportToCSV(data: any[], columns: ReportColumn[], filename = 'report.csv'): Promise<void> {
    const Papa = await import('papaparse');
    
    const csvData = data.map(row => {
      const csvRow: any = {};
      columns.forEach(col => {
        csvRow[col.header] = this.formatValue(row[col.field], col.format);
      });
      return csvRow;
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename);
  }

  async exportToExcel(data: any[], columns: ReportColumn[], filename = 'report.xlsx'): Promise<void> {
    const XLSX = await import('xlsx');
    
    const worksheetData = [
      columns.map(col => col.header),
      ...data.map(row => columns.map(col => this.formatValue(row[col.field], col.format)))
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    columns.forEach((col, idx) => {
      if (col.width) {
        if (!ws['!cols']) ws['!cols'] = [];
        ws['!cols'][idx] = { wch: col.width };
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, filename);
  }

  async exportToPDF(
    data: any[], 
    columns: ReportColumn[], 
    options: { title?: string; subtitle?: string; branding?: any } = {},
    filename = 'report.pdf'
  ): Promise<void> {
    const [jsPDFModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const { jsPDF: JsPDFClass } = jsPDFModule;
    const doc = new JsPDFClass();

    let yPosition = 20;

    if (options.branding?.logoUrl) {
      const img = new Image();
      img.src = options.branding.logoUrl;
      doc.addImage(img, 'PNG', 14, 10, 30, 15);
      yPosition = 35;
    }

    if (options.branding?.companyName) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(options.branding.companyName, 200, 15, { align: 'right' });
    }

    if (options.title) {
      doc.setFontSize(18);
      doc.setTextColor(0);
      doc.text(options.title, 14, yPosition);
      yPosition += 10;
    }

    if (options.subtitle) {
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(options.subtitle, 14, yPosition);
      yPosition += 10;
    }

    (doc as any).autoTable({
      startY: yPosition,
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => this.formatValue(row[col.field], col.format))),
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { 
        fillColor: options.branding?.primaryColor ? this.hexToRgb(options.branding.primaryColor) : [66, 139, 202] 
      }
    });

    doc.save(filename);
  }

  private formatValue(value: any, format?: string): string {
    if (value == null) return '';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
      case 'number':
        return new Intl.NumberFormat('fr-FR').format(value);
      case 'percentage':
        return `${(value * 100).toFixed(2)}%`;
      case 'date':
        return new Date(value).toLocaleDateString('fr-FR');
      default:
        return String(value);
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [66, 139, 202];
  }
}
