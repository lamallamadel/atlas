import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export interface ReportSchedule {
  id?: number;
  name: string;
  reportType: string;
  frequency: ScheduleFrequency;
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel';
  parameters?: Record<string, any>;
  enabled: boolean;
  nextRunDate?: string;
  lastRunDate?: string;
  branding?: {
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
  };
  dayOfWeek?: number;
  dayOfMonth?: number;
  time?: string;
}

export interface ScheduledReportExecution {
  id: number;
  scheduleId: number;
  executionDate: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  errorMessage?: string;
  recipientCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportSchedulingService {
  private readonly apiUrl = '/api/v1/report-schedules';

  constructor(private http: HttpClient) {}

  createSchedule(schedule: ReportSchedule): Observable<ReportSchedule> {
    return this.http.post<ReportSchedule>(this.apiUrl, schedule);
  }

  updateSchedule(id: number, schedule: ReportSchedule): Observable<ReportSchedule> {
    return this.http.put<ReportSchedule>(`${this.apiUrl}/${id}`, schedule);
  }

  deleteSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getSchedule(id: number): Observable<ReportSchedule> {
    return this.http.get<ReportSchedule>(`${this.apiUrl}/${id}`);
  }

  listSchedules(): Observable<ReportSchedule[]> {
    return this.http.get<ReportSchedule[]>(this.apiUrl);
  }

  enableSchedule(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/enable`, {});
  }

  disableSchedule(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/disable`, {});
  }

  executeNow(id: number): Observable<ScheduledReportExecution> {
    return this.http.post<ScheduledReportExecution>(`${this.apiUrl}/${id}/execute`, {});
  }

  getExecutionHistory(scheduleId: number): Observable<ScheduledReportExecution[]> {
    return this.http.get<ScheduledReportExecution[]>(`${this.apiUrl}/${scheduleId}/executions`);
  }

  async generateScheduledPdfReport(
    reportData: any,
    schedule: ReportSchedule
  ): Promise<Blob> {
    const [jsPDFModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);

    const { jsPDF: JsPDFClass } = jsPDFModule;
    const doc = new JsPDFClass();

    let yPosition = 20;

    if (schedule.branding?.logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = schedule.branding.logoUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        doc.addImage(img, 'PNG', 14, 10, 30, 15);
        yPosition = 35;
      } catch (error) {
        console.warn('Failed to load logo image', error);
      }
    }

    if (schedule.branding?.companyName) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(schedule.branding.companyName, 200, 15, { align: 'right' });
    }

    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(schedule.name, 14, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setTextColor(100);
    const reportDate = new Date().toLocaleDateString('fr-FR');
    doc.text(`Generated on: ${reportDate}`, 14, yPosition);
    yPosition += 15;

    if (reportData.summary) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Summary', 14, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(60);
      doc.text(reportData.summary, 14, yPosition, { maxWidth: 180 });
      yPosition += 20;
    }

    if (reportData.tables && reportData.tables.length > 0) {
      reportData.tables.forEach((table: any) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(table.title, 14, yPosition);
        yPosition += 10;

        (doc as any).autoTable({
          startY: yPosition,
          head: [table.headers],
          body: table.rows,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: {
            fillColor: schedule.branding?.primaryColor 
              ? this.hexToRgb(schedule.branding.primaryColor) 
              : [66, 139, 202]
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      });
    }

    if (schedule.branding?.companyName) {
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `${schedule.branding.companyName} - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
    }

    return doc.output('blob');
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [66, 139, 202];
  }

  calculateNextRunDate(frequency: ScheduleFrequency, dayOfWeek?: number, dayOfMonth?: number, time?: string): Date {
    const now = new Date();
    const nextRun = new Date(now);

    const [hours, minutes] = time ? time.split(':').map(Number) : [9, 0];
    nextRun.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case 'weekly':
        const targetDay = dayOfWeek ?? 1;
        const currentDay = nextRun.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0 || (daysToAdd === 0 && nextRun <= now)) {
          daysToAdd += 7;
        }
        nextRun.setDate(nextRun.getDate() + daysToAdd);
        break;

      case 'monthly':
        const targetDate = dayOfMonth ?? 1;
        nextRun.setDate(targetDate);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }

    return nextRun;
  }
}
