import { Component, OnInit } from '@angular/core';
import { AnalyticsApiService, ScheduledReportRequest, ScheduledReportResponse } from '../services/analytics-api.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-scheduled-reports',
  template: `
    <div class="scheduled-reports">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Scheduled Reports</mat-card-title>
          <button mat-raised-button color="primary" (click)="createReport()">
            <mat-icon>add</mat-icon>
            Schedule New Report
          </button>
        </mat-card-header>

        <mat-card-content>
          <table mat-table [dataSource]="reports" class="reports-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let report">{{report.name}}</td>
            </ng-container>

            <ng-container matColumnDef="reportType">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let report">{{report.reportType}}</td>
            </ng-container>

            <ng-container matColumnDef="frequency">
              <th mat-header-cell *matHeaderCellDef>Frequency</th>
              <td mat-cell *matCellDef="let report">{{report.frequency}}</td>
            </ng-container>

            <ng-container matColumnDef="format">
              <th mat-header-cell *matHeaderCellDef>Format</th>
              <td mat-cell *matCellDef="let report">{{report.format}}</td>
            </ng-container>

            <ng-container matColumnDef="enabled">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let report">
                <mat-chip [color]="report.enabled ? 'primary' : 'warn'" selected>
                  {{report.enabled ? 'Active' : 'Disabled'}}
                </mat-chip>
              </td>
            </ng-container>

            <ng-container matColumnDef="nextRunAt">
              <th mat-header-cell *matHeaderCellDef>Next Run</th>
              <td mat-cell *matCellDef="let report">{{report.nextRunAt | date:'short'}}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let report">
                <button mat-icon-button (click)="editReport(report)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="deleteReport(report)" matTooltip="Delete" color="warn">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <mat-card *ngIf="editingReport" class="report-form-card">
        <mat-card-header>
          <mat-card-title>{{editingReport.id ? 'Edit' : 'Create'}} Scheduled Report</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="reportForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Report Name</mat-label>
              <input matInput formControlName="name" required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="2"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Report Type</mat-label>
              <mat-select formControlName="reportType" required>
                <mat-option value="COHORT_ANALYSIS">Cohort Analysis</mat-option>
                <mat-option value="SALES_FUNNEL">Sales Funnel</mat-option>
                <mat-option value="AGENT_PERFORMANCE">Agent Performance</mat-option>
                <mat-option value="MARKET_TRENDS">Market Trends</mat-option>
                <mat-option value="REVENUE_FORECAST">Revenue Forecast</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Frequency</mat-label>
              <mat-select formControlName="frequency" required>
                <mat-option value="DAILY">Daily</mat-option>
                <mat-option value="WEEKLY">Weekly</mat-option>
                <mat-option value="MONTHLY">Monthly</mat-option>
                <mat-option value="QUARTERLY">Quarterly</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width" 
                            *ngIf="reportForm.get('frequency')?.value === 'WEEKLY'">
              <mat-label>Day of Week</mat-label>
              <mat-select formControlName="dayOfWeek">
                <mat-option value="MONDAY">Monday</mat-option>
                <mat-option value="TUESDAY">Tuesday</mat-option>
                <mat-option value="WEDNESDAY">Wednesday</mat-option>
                <mat-option value="THURSDAY">Thursday</mat-option>
                <mat-option value="FRIDAY">Friday</mat-option>
                <mat-option value="SATURDAY">Saturday</mat-option>
                <mat-option value="SUNDAY">Sunday</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width"
                            *ngIf="reportForm.get('frequency')?.value === 'MONTHLY'">
              <mat-label>Day of Month</mat-label>
              <input matInput type="number" formControlName="dayOfMonth" min="1" max="31">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Hour (24h format)</mat-label>
              <input matInput type="number" formControlName="hour" min="0" max="23">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Format</mat-label>
              <mat-select formControlName="format" required>
                <mat-option value="PDF">PDF</mat-option>
                <mat-option value="CSV">CSV</mat-option>
                <mat-option value="EXCEL">Excel</mat-option>
                <mat-option value="HTML">HTML</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Recipients (comma-separated emails)</mat-label>
              <textarea matInput formControlName="recipientsText" 
                        placeholder="email1@example.com, email2@example.com"
                        rows="2"></textarea>
            </mat-form-field>

            <mat-checkbox formControlName="enabled">Enable this report</mat-checkbox>

            <div class="form-actions">
              <button mat-raised-button (click)="cancelEdit()">Cancel</button>
              <button mat-raised-button color="primary" (click)="saveReport()" 
                      [disabled]="!reportForm.valid">Save</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .scheduled-reports {
      padding: 20px;
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .reports-table {
      width: 100%;
      margin-top: 20px;
    }

    .report-form-card {
      margin-top: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    mat-chip {
      font-size: 12px;
    }
  `]
})
export class ScheduledReportsComponent implements OnInit {
  reports: ScheduledReportResponse[] = [];
  editingReport: ScheduledReportResponse | null = null;
  reportForm: FormGroup;
  
  displayedColumns = ['name', 'reportType', 'frequency', 'format', 'enabled', 'nextRunAt', 'actions'];

  constructor(
    private analyticsService: AnalyticsApiService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.reportForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      reportType: ['', Validators.required],
      frequency: ['', Validators.required],
      format: ['', Validators.required],
      dayOfWeek: [''],
      dayOfMonth: [1],
      hour: [8],
      recipientsText: ['', Validators.required],
      enabled: [true]
    });
  }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.analyticsService.getScheduledReports().subscribe({
      next: (response) => {
        this.reports = response.content || [];
      },
      error: (error) => {
        this.snackBar.open('Failed to load reports', 'Close', { duration: 3000 });
      }
    });
  }

  createReport(): void {
    this.editingReport = {} as ScheduledReportResponse;
    this.reportForm.reset({
      enabled: true,
      hour: 8,
      dayOfMonth: 1
    });
  }

  editReport(report: ScheduledReportResponse): void {
    this.editingReport = report;
    this.reportForm.patchValue({
      ...report,
      recipientsText: report.recipients?.join(', ')
    });
  }

  saveReport(): void {
    if (!this.reportForm.valid) return;

    const formValue = this.reportForm.value;
    const recipients = formValue.recipientsText
      .split(',')
      .map((email: string) => email.trim())
      .filter((email: string) => email);

    const request: ScheduledReportRequest = {
      name: formValue.name,
      description: formValue.description,
      reportType: formValue.reportType,
      frequency: formValue.frequency,
      format: formValue.format,
      recipients: recipients,
      dayOfWeek: formValue.dayOfWeek,
      dayOfMonth: formValue.dayOfMonth,
      hour: formValue.hour,
      enabled: formValue.enabled
    };

    const saveOperation = this.editingReport?.id
      ? this.analyticsService.updateScheduledReport(this.editingReport.id, request)
      : this.analyticsService.createScheduledReport(request);

    saveOperation.subscribe({
      next: () => {
        this.snackBar.open('Report saved successfully', 'Close', { duration: 3000 });
        this.editingReport = null;
        this.loadReports();
      },
      error: (error) => {
        this.snackBar.open(error.error?.message || 'Failed to save report', 'Close', { duration: 3000 });
      }
    });
  }

  cancelEdit(): void {
    this.editingReport = null;
  }

  deleteReport(report: ScheduledReportResponse): void {
    if (!report.id) return;

    if (confirm(`Are you sure you want to delete "${report.name}"?`)) {
      this.analyticsService.deleteScheduledReport(report.id).subscribe({
        next: () => {
          this.snackBar.open('Report deleted successfully', 'Close', { duration: 3000 });
          this.loadReports();
        },
        error: (error) => {
          this.snackBar.open('Failed to delete report', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
