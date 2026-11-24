import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AnalyticsApiService, ScheduledReportRequest, ScheduledReportResponse } from '../services/analytics-api.service';
import { 
  DsCardComponent, 
  DsButtonComponent, 
  DsIconComponent, 
  DsInputComponent, 
  DsSelectComponent, 
  DsSelectOption,
  DsCheckboxComponent,
  DsBadgeComponent,
  DsToastService,
  DsTableComponent,
  DsColumn,
  DsRowAction
} from '../design-system';

@Component({
  selector: 'app-scheduled-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    DsCardComponent,
    DsButtonComponent,
    DsIconComponent,
    DsInputComponent,
    DsSelectComponent,
    DsCheckboxComponent,
    DsBadgeComponent,
    DsTableComponent,
    DsCellDirective
  ],
  template: `
    <div class="scheduled-reports ds-form-stack" style="padding: 32px; max-width: var(--ds-content-wide); margin: 0 auto;">
      <header style="margin-bottom: 32px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: var(--ds-marine); font-family: var(--ds-font-display);">Rapports planifiés</h1>
        <p style="margin: 8px 0 0; color: var(--ds-text-muted);">Automatisez l'envoi de vos rapports par email</p>
      </header>

      <ds-card [pad]="false" [elevation]="'sm'">
        <div class="sr-card-header" style="padding: 24px 24px 0; display: flex; justify-content: space-between; align-items: center;">
          <h3 class="sr-card-title" style="margin: 0; font-size: 18px; font-weight: 700; color: var(--ds-marine);">Mes planifications</h3>
          <ds-button variant="marine" (dsClick)="createReport()">
            <ds-icon name="plus" [size]="20" style="margin-right: 8px;"></ds-icon>
            Planifier un rapport
          </ds-button>
        </div>
        
        <div class="sr-card-body" style="padding: 24px;">
          <ds-table
            [columns]="dsColumns"
            [data]="reports"
            [rowActions]="dsRowActions"
            (rowAction)="onRowAction($event)"
            emptyTitle="Aucun rapport planifié"
            emptyDescription="Configurez des rapports automatiques pour recevoir vos indicateurs clés par email.">
            
            <ng-template dsCell="enabled" let-report>
              <ds-badge [status]="report.enabled ? 'active' : 'neutral'" [showDot]="false" size="sm">
                {{report.enabled ? 'Actif' : 'Désactivé'}}
              </ds-badge>
            </ng-template>

            <ng-template dsCell="nextRunAt" let-report>
              {{report.nextRunAt | date:'short'}}
            </ng-template>
          </ds-table>
        </div>
      </ds-card>
    
      @if (editingReport) {
        <ds-card class="report-form-card" [pad]="true" elevation="sm" style="margin-top: 32px;">
          <div class="sr-form-card-header" style="margin-bottom: 24px;">
            <h3 class="sr-card-title" style="margin: 0; font-size: 20px; font-weight: 700; color: var(--ds-marine);">{{editingReport.id ? 'Modifier' : 'Créer'}} un rapport planifié</h3>
          </div>
          <div class="sr-form-card-body">
            <form [formGroup]="reportForm" class="ds-form-stack">
              <ds-input label="Nom du rapport" formControlName="name" required="true" placeholder="ex. Rapport hebdomadaire des ventes"></ds-input>
              
              <div class="ds-field">
                <label for="scheduled-reports-field-85" class="ds-field__label">Description</label>
                <div class="ds-field__wrap">
                  <textarea id="scheduled-reports-field-85" class="ds-field__input" formControlName="description" rows="2" style="height: auto; padding: 12px;"></textarea>
                </div>
              </div>

              <div class="ds-form-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <ds-select
                  label="Type de rapport"
                  [options]="reportTypeOptions"
                  formControlName="reportType"
                  required="true">
                </ds-select>

                <ds-select
                  label="Fréquence"
                  [options]="frequencyOptions"
                  formControlName="frequency"
                  required="true">
                </ds-select>
              </div>

              <div class="ds-form-grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                @if (reportForm.get('frequency')?.value === 'WEEKLY') {
                  <ds-select
                    label="Jour de la semaine"
                    [options]="dayOfWeekOptions"
                    formControlName="dayOfWeek">
                  </ds-select>
                }
                @if (reportForm.get('frequency')?.value === 'MONTHLY') {
                  <ds-input
                    label="Jour du mois"
                    type="number"
                    formControlName="dayOfMonth"
                    min="1"
                    max="31">
                  </ds-input>
                }
                <ds-input
                  label="Heure (format 24h)"
                  type="number"
                  formControlName="hour"
                  min="0"
                  max="23">
                </ds-input>
              </div>

              <ds-select
                label="Format"
                [options]="formatOptions"
                formControlName="format"
                required="true">
              </ds-select>

              <div class="ds-field">
                <label for="scheduled-reports-field-141" class="ds-field__label">Destinataires (emails séparés par des virgules)</label>
                <div class="ds-field__wrap">
                  <textarea id="scheduled-reports-field-141" class="ds-field__input" formControlName="recipientsText"
                    placeholder="email1@example.com, email2@example.com"
                    rows="2" style="height: auto; padding: 12px;"></textarea>
                </div>
              </div>

              <ds-checkbox formControlName="enabled" label="Activer ce rapport"></ds-checkbox>

              <div class="form-actions" style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--ds-divider);">
                <ds-button variant="ghost" size="md" (dsClick)="cancelEdit()">Annuler</ds-button>
                <ds-button variant="marine" size="md" (dsClick)="saveReport()" [disabled]="!reportForm.valid">
                  Enregistrer la planification
                </ds-button>
              </div>
            </form>
          </div>
        </ds-card>
      }
    </div>
    `
})
export class ScheduledReportsComponent implements OnInit {
  private analyticsService = inject(AnalyticsApiService);
  private fb = inject(FormBuilder);
  private toastService = inject(DsToastService);

  reports: ScheduledReportResponse[] = [];
  editingReport: ScheduledReportResponse | null = null;
  reportForm!: FormGroup;
  
  dsColumns: DsColumn<ScheduledReportResponse>[] = [
    { key: 'name',           header: 'Nom' },
    { key: 'reportType',     header: 'Type' },
    { key: 'frequency',      header: 'Fréquence' },
    { key: 'format',         header: 'Format' },
    { key: 'enabled',        header: 'Statut' },
    { key: 'nextRunAt',      header: 'Prochaine exécution' }
  ];

  dsRowActions: DsRowAction<ScheduledReportResponse>[] = [
    { icon: 'edit',  label: 'Modifier',  action: 'edit',    ariaLabel: 'Modifier le rapport' },
    { icon: 'trash', label: 'Supprimer', action: 'delete',  ariaLabel: 'Supprimer le rapport' }
  ];

  readonly reportTypeOptions: DsSelectOption[] = [
    { value: 'COHORT_ANALYSIS', label: 'Analyse de cohorte' },
    { value: 'SALES_FUNNEL', label: 'Tunnel de vente' },
    { value: 'AGENT_PERFORMANCE', label: 'Performance des agents' },
    { value: 'MARKET_TRENDS', label: 'Tendances du marché' },
    { value: 'REVENUE_FORECAST', label: 'Prévisions de revenus' }
  ];

  readonly frequencyOptions: DsSelectOption[] = [
    { value: 'DAILY', label: 'Quotidien' },
    { value: 'WEEKLY', label: 'Hebdomadaire' },
    { value: 'MONTHLY', label: 'Mensuel' },
    { value: 'QUARTERLY', label: 'Trimestriel' }
  ];

  readonly dayOfWeekOptions: DsSelectOption[] = [
    { value: 'MONDAY', label: 'Lundi' },
    { value: 'TUESDAY', label: 'Mardi' },
    { value: 'WEDNESDAY', label: 'Mercredi' },
    { value: 'THURSDAY', label: 'Jeudi' },
    { value: 'FRIDAY', label: 'Vendredi' },
    { value: 'SATURDAY', label: 'Samedi' },
    { value: 'SUNDAY', label: 'Dimanche' }
  ];

  readonly formatOptions: DsSelectOption[] = [
    { value: 'PDF', label: 'PDF' },
    { value: 'CSV', label: 'CSV' },
    { value: 'EXCEL', label: 'Excel' },
    { value: 'HTML', label: 'HTML' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadReports();
  }

  private initForm(): void {
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

  loadReports(): void {
    this.analyticsService.getScheduledReports().subscribe({
      next: (response) => {
        this.reports = response.content || [];
      },
      error: () => {
        this.toastService.error('Échec du chargement des rapports');
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

  onRowAction(event: { action: string; row: ScheduledReportResponse }): void {
    if (event.action === 'edit') {
      this.editReport(event.row);
    } else if (event.action === 'delete') {
      this.deleteReport(event.row);
    }
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
        this.toastService.success('Rapport enregistré avec succès');
        this.editingReport = null;
        this.loadReports();
      },
      error: (error) => {
        this.toastService.error(error.error?.message || 'Échec de l\'enregistrement');
      }
    });
  }

  cancelEdit(): void {
    this.editingReport = null;
  }

  deleteReport(report: ScheduledReportResponse): void {
    if (!report.id) return;

    if (confirm(`Voulez-vous vraiment supprimer le rapport "${report.name}" ?`)) {
      this.analyticsService.deleteScheduledReport(report.id).subscribe({
        next: () => {
          this.toastService.success('Rapport supprimé avec succès');
          this.loadReports();
        },
        error: () => {
          this.toastService.error('Échec de la suppression');
        }
      });
    }
  }
}
