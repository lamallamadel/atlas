import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LeadScoringApiService, LeadScoringConfig } from '../services/lead-scoring-api.service';
import { CommonModule } from '@angular/common';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsInputComponent, 
  DsSelectComponent, 
  DsCardComponent,
  DsToastService,
  DsTabsComponent,
  DsTab,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent,
  DsCheckboxComponent
} from '../design-system';

@Component({
  selector: 'app-lead-scoring-config-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DsButtonComponent,
    DsIconComponent,
    DsInputComponent,
    DsSelectComponent,
    DsCardComponent,
    DsTabsComponent,
    DsDialogHeaderComponent,
    DsDialogContentComponent,
    DsDialogActionsComponent,
    DsCheckboxComponent
  ],
  templateUrl: './lead-scoring-config-dialog.component.html',
  styleUrls: ['./lead-scoring-config-dialog.component.css']
})
export class LeadScoringConfigDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private leadScoringApi = inject(LeadScoringApiService);
  private toastService = inject(DsToastService);
  private dialogRef = inject(DialogRef<LeadScoringConfig>);
  
  public data: { config?: LeadScoringConfig } = inject(DIALOG_DATA);

  configForm!: FormGroup;
  saving = false;
  activeTab = 'source';

  readonly tabs: DsTab[] = [
    { value: 'source', label: 'Sources' },
    { value: 'engagement', label: 'Engagement' },
    { value: 'property', label: 'Biens' },
    { value: 'timing', label: 'Réactivité' }
  ];

  sourceKeys = ['referral', 'web', 'social_media', 'email', 'phone', 'walk_in', 'mobile', 'unknown'];
  engagementKeys = ['inboundMessage', 'outboundMessage', 'appointment'];
  propertyKeys = ['noProperty', 'hasProperty', 'hasPrice', 'hasPhotos'];

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const config = this.data?.config;

    const formConfig: any = {
      configName: [config?.configName || 'Configuration par défaut', Validators.required],
      isActive: [config?.isActive !== undefined ? config.isActive : true],
      autoQualificationThreshold: [config?.autoQualificationThreshold || 70, [Validators.required, Validators.min(0), Validators.max(100)]],
      responseTimeWeight: [config?.responseTimeWeight || 20, [Validators.required, Validators.min(0), Validators.max(30)]],
      fastResponseMinutes: [config?.fastResponseMinutes || 60, [Validators.required, Validators.min(1)]],
      mediumResponseMinutes: [config?.mediumResponseMinutes || 240, [Validators.required, Validators.min(1)]]
    };

    this.sourceKeys.forEach(key => {
      formConfig[`sourceWeight_${key}`] = [config?.sourceWeights?.[key] || this.getDefaultSourceWeight(key), [Validators.min(0), Validators.max(30)]];
    });

    this.engagementKeys.forEach(key => {
      formConfig[`engagementWeight_${key}`] = [config?.engagementWeights?.[key] || this.getDefaultEngagementWeight(key), [Validators.min(0), Validators.max(20)]];
    });

    this.propertyKeys.forEach(key => {
      formConfig[`propertyWeight_${key}`] = [config?.propertyMatchWeights?.[key] || this.getDefaultPropertyWeight(key), [Validators.min(0), Validators.max(20)]];
    });

    this.configForm = this.fb.group(formConfig);
  }

  getDefaultSourceWeight(key: string): number {
    const defaults: { [key: string]: number } = {
      referral: 25, web: 15, social_media: 12, email: 10,
      phone: 20, walk_in: 18, mobile: 15, unknown: 5
    };
    return defaults[key] || 10;
  }

  getDefaultEngagementWeight(key: string): number {
    const defaults: { [key: string]: number } = {
      inboundMessage: 5, outboundMessage: 2, appointment: 15
    };
    return defaults[key] || 5;
  }

  getDefaultPropertyWeight(key: string): number {
    const defaults: { [key: string]: number } = {
      noProperty: 0, hasProperty: 10, hasPrice: 5, hasPhotos: 5
    };
    return defaults[key] || 5;
  }

  formatLabel(key: string): string {
    return key.replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  onSave(): void {
    if (this.configForm.valid) {
      this.saving = true;

      const formValue = this.configForm.value;

      const sourceWeights: { [key: string]: number } = {};
      this.sourceKeys.forEach(key => {
        sourceWeights[key] = formValue[`sourceWeight_${key}`];
      });

      const engagementWeights: { [key: string]: number } = {};
      this.engagementKeys.forEach(key => {
        engagementWeights[key] = formValue[`engagementWeight_${key}`];
      });

      const propertyMatchWeights: { [key: string]: number } = {};
      this.propertyKeys.forEach(key => {
        propertyMatchWeights[key] = formValue[`propertyWeight_${key}`];
      });

      const configData: Partial<LeadScoringConfig> = {
        configName: formValue.configName,
        isActive: formValue.isActive,
        autoQualificationThreshold: formValue.autoQualificationThreshold,
        sourceWeights,
        engagementWeights,
        propertyMatchWeights,
        responseTimeWeight: formValue.responseTimeWeight,
        fastResponseMinutes: formValue.fastResponseMinutes,
        mediumResponseMinutes: formValue.mediumResponseMinutes
      };

      const saveOperation = this.data?.config?.id
        ? this.leadScoringApi.updateConfig(this.data.config.id, configData)
        : this.leadScoringApi.createConfig(configData);

      saveOperation.subscribe({
        next: (result) => {
          this.toastService.success('Configuration enregistrée');
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error saving configuration:', error);
          this.toastService.error('Échec de l\'enregistrement');
          this.saving = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
