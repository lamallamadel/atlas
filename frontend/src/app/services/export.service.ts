import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ExportProgress {
  stage: 'preparing' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export interface ExportConfig {
  title: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  includeDate?: boolean;
  includePageNumbers?: boolean;
}

export interface ColumnDef {
  key: string;
  header: string;
  width?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private progressSubject = new Subject<ExportProgress>();
  public progress$ = this.progressSubject.asObservable();

  private defaultConfig: ExportConfig = {
    title: 'Export',
    filename: 'export',
    orientation: 'portrait',
    primaryColor: '#2c5aa0',
    secondaryColor: '#e67e22',
    includeDate: true,
    includePageNumbers: true
  };

  constructor() {
    // Injectable service - no initialization required
  }

  async exportToPDF<T>(
    data: T[],
    columns: ColumnDef[],
    config: Partial<ExportConfig> = {}
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    this.emitProgress('preparing', 0, 'Préparation de l\'export PDF...');

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      this.emitProgress('generating', 30, 'Génération du document PDF...');

      const doc = new jsPDF({
        orientation: finalConfig.orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      if (finalConfig.logo) {
        try {
          doc.addImage(finalConfig.logo, 'PNG', 15, 10, 30, 15);
          yPosition = 30;
        } catch (e) {
          console.warn('Could not add logo to PDF', e);
        }
      }

      doc.setFontSize(18);
      doc.setTextColor(finalConfig.primaryColor || '#2c5aa0');
      doc.text(finalConfig.title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      if (finalConfig.includeDate) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Date: ${new Date().toLocaleDateString('fr-FR')}`,
          pageWidth / 2,
          yPosition,
          { align: 'center' }
        );
        yPosition += 10;
      }

      this.emitProgress('generating', 60, 'Formatage des données...');

      const tableColumns = columns.map(col => ({
        header: col.header,
        dataKey: col.key
      }));

      const tableRows = data.map(item => {
        const row: { [key: string]: unknown } = {};
        columns.forEach(col => {
          const value = (item as { [key: string]: unknown })[col.key];
          
          if (value === null || value === undefined) {
            row[col.key] = '';
          } else if (typeof value === 'object' && value !== null) {
            row[col.key] = JSON.stringify(value);
          } else if (typeof value === 'string' && value.includes('<')) {
            const temp = document.createElement('div');
            temp.innerHTML = value;
            row[col.key] = temp.textContent || temp.innerText || '';
          } else {
            row[col.key] = value;
          }
        });
        return row;
      });

      autoTable(doc, {
        startY: yPosition,
        head: [tableColumns.map(col => col.header)],
        body: tableRows.map(row => columns.map(col => row[col.key] as string)),
        theme: 'striped',
        headStyles: {
          fillColor: finalConfig.primaryColor || '#2c5aa0',
          textColor: '#ffffff',
          fontStyle: 'bold',
          halign: 'left'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          cellWidth: 'auto'
        },
        columnStyles: columns.reduce((acc, col, index) => {
          if (col.width) {
            acc[index] = { cellWidth: col.width };
          }
          return acc;
        }, {} as { [key: number]: { cellWidth: number } }),
        margin: { left: 15, right: 15 },
        didDrawPage: () => {
          if (finalConfig.includePageNumbers) {
            doc.setFontSize(8);
            doc.setTextColor(150);
            const pageNumber = (doc as any).internal.getCurrentPageInfo().pageNumber;
            doc.text(
              `Page ${pageNumber}`,
              pageWidth / 2,
              pageHeight - 10,
              { align: 'center' }
            );
          }
        }
      });

      this.emitProgress('generating', 90, 'Finalisation du PDF...');

      const filename = `${finalConfig.filename}_${new Date().getTime()}.pdf`;
      doc.save(filename);

      this.emitProgress('complete', 100, 'Export PDF terminé avec succès');
    } catch (error) {
      console.error('PDF export error:', error);
      this.emitProgress('error', 0, 'Erreur lors de l\'export PDF', (error as Error).message);
      throw error;
    }
  }

  async exportToExcel<T>(
    data: T[],
    columns: ColumnDef[],
    config: Partial<ExportConfig> = {}
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    this.emitProgress('preparing', 0, 'Préparation de l\'export Excel...');

    try {
      this.emitProgress('generating', 30, 'Génération du fichier Excel...');

      const headers = columns.map(col => col.header);
      
      const rows = data.map(item => {
        return columns.map(col => {
          const value = (item as { [key: string]: unknown })[col.key];
          
          if (value === null || value === undefined) {
            return '';
          } else if (typeof value === 'string' && value.includes('<')) {
            const temp = document.createElement('div');
            temp.innerHTML = value;
            return temp.textContent || temp.innerText || '';
          } else if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return value;
        });
      });

      this.emitProgress('generating', 60, 'Formatage des données...');

      let csvContent = '';
      
      if (finalConfig.title) {
        csvContent += `${finalConfig.title}\n`;
      }
      
      if (finalConfig.includeDate) {
        csvContent += `Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
      }

      csvContent += headers.map(h => this.escapeCSV(h)).join(',') + '\n';
      
      rows.forEach(row => {
        csvContent += row.map(cell => this.escapeCSV(String(cell))).join(',') + '\n';
      });

      this.emitProgress('generating', 90, 'Téléchargement du fichier...');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const filename = `${finalConfig.filename}_${new Date().getTime()}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      this.emitProgress('complete', 100, 'Export Excel terminé avec succès');
    } catch (error) {
      console.error('Excel export error:', error);
      this.emitProgress('error', 0, 'Erreur lors de l\'export Excel', (error as Error).message);
      throw error;
    }
  }

  async printTable<T>(
    data: T[],
    columns: ColumnDef[],
    config: Partial<ExportConfig> = {}
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les popups ne sont pas bloquées.');
    }

    const tableHtml = this.generatePrintHTML(data, columns, finalConfig);
    
    printWindow.document.write(tableHtml);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }

  private generatePrintHTML<T>(
    data: T[],
    columns: ColumnDef[],
    config: ExportConfig
  ): string {
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.title}</title>
  <style>
    @media print {
      * {
        box-shadow: none !important;
        text-shadow: none !important;
      }
      
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        color: #000;
      }
      
      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid ${config.primaryColor};
        padding-bottom: 15px;
      }
      
      .header h1 {
        color: ${config.primaryColor};
        margin: 0 0 10px 0;
        font-size: 24px;
      }
      
      .header .date {
        color: #666;
        font-size: 12px;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10pt;
        page-break-inside: auto;
      }
      
      thead {
        display: table-header-group;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      
      th {
        background-color: ${config.primaryColor};
        color: white;
        padding: 10px;
        text-align: left;
        font-weight: bold;
        border: 1px solid #ddd;
      }
      
      td {
        padding: 8px;
        border: 1px solid #ddd;
        text-align: left;
      }
      
      tbody tr:nth-child(even) {
        background-color: #f9f9f9;
      }
      
      .footer {
        margin-top: 20px;
        text-align: center;
        font-size: 10px;
        color: #666;
      }
    }
  </style>
</head>
<body>
  <div class="header">`;
    
    if (config.logo) {
      html += `<img src="${config.logo}" alt="Logo" style="max-height: 60px; margin-bottom: 10px;">`;
    }
    
    html += `
    <h1>${config.title}</h1>`;
    
    if (config.includeDate) {
      html += `<div class="date">Date: ${new Date().toLocaleDateString('fr-FR')}</div>`;
    }
    
    html += `
  </div>
  
  <table>
    <thead>
      <tr>`;
    
    columns.forEach(col => {
      html += `<th>${col.header}</th>`;
    });
    
    html += `
      </tr>
    </thead>
    <tbody>`;
    
    data.forEach(item => {
      html += '<tr>';
      columns.forEach(col => {
        let value = (item as { [key: string]: unknown })[col.key];
        
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'string' && value.includes('<')) {
          const temp = document.createElement('div');
          temp.innerHTML = value;
          value = temp.textContent || temp.innerText || '';
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        html += `<td>${this.escapeHtml(String(value))}</td>`;
      });
      html += '</tr>';
    });
    
    html += `
    </tbody>
  </table>
  
  <div class="footer">
    Généré le ${new Date().toLocaleString('fr-FR')}
  </div>
</body>
</html>`;
    
    return html;
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private escapeHtml(value: string): string {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  private emitProgress(
    stage: ExportProgress['stage'],
    progress: number,
    message: string,
    error?: string
  ): void {
    this.progressSubject.next({ stage, progress, message, error });
  }
}
