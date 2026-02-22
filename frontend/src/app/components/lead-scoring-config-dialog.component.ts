import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { LeadScoringApiService, LeadScoringConfig } from '../services/lead-scoring-api.service';
import { ToastNotificationService } from '../services/toast-notification.service';

@Component({
  selector: 'app-lead-scoring-config-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatTabsModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>settings</mat-icon>
      {{ data?.config ? 'Edit' : 'Create' }} Lead Scoring Configuration
    </h2>

    <mat-dialog-content>
      <form [formGroup]="configForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Configuration Name</mat-label>
          <input matInput formControlName="configName" placeholder="Default Configuration">
        </mat-form-field>

        <mat-slide-toggle formControlName="isActive" class="full-width">
          Active Configuration
        </mat-slide-toggle>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Auto-Qualification Threshold</mat-label>
          <input matInput type="number" formControlName="autoQualificationThreshold" min="0" max="100">
          <mat-hint>Minimum score to auto-qualify leads</mat-hint>
        </mat-form-field>

        <mat-tab-group>
          <mat-tab label="Source Weights">
            <div class="tab-content">
              <div class="weight-item" *ngFor="let source of sourceKeys">
                <label>{{ formatLabel(source) }}</label>
                <mat-slider min="0" max="30" step="1" discrete>
                  <input matSliderThumb [formControlName]="'sourceWeight_' + source">
                </mat-slider>
                <span class="weight-value">{{ configForm.get('sourceWeight_' + source)?.value }}</span>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Engagement Weights">
            <div class="tab-content">
              <div class="weight-item" *ngFor="let engagement of engagementKeys">
                <label>{{ formatLabel(engagement) }}</label>
                <mat-slider min="0" max="20" step="1" discrete>
                  <input matSliderThumb [formControlName]="'engagementWeight_' + engagement">
                </mat-slider>
                <span class="weight-value">{{ configForm.get('engagementWeight_' + engagement)?.value }}</span>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Property Match Weights">
            <div class="tab-content">
              <div class="weight-item" *ngFor="let property of propertyKeys">
                <label>{{ formatLabel(property) }}</label>
                <mat-slider min="0" max="20" step="1" discrete>
                  <input matSliderThumb [formControlName]="'propertyWeight_' + property">
                </mat-slider>
                <span class="weight-value">{{ configForm.get('propertyWeight_' + property)?.value }}</span>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Response Time">
            <div class="tab-content">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Response Time Weight</mat-label>
                <input matInput type="number" formControlName="responseTimeWeight" min="0" max="30">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Fast Response (minutes)</mat-label>
                <input matInput type="number" formControlName="fastResponseMinutes" min="1">
                <mat-hint>Response within this time gets full weight</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Medium Response (minutes)</mat-label>
                <input matInput type="number" formControlName="mediumResponseMinutes" min="1">
                <mat-hint>Response within this time gets half weight</mat-hint>
              </mat-form-field>
            </div>
          </mat-tab>
        </mat-tab-group>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!configForm.valid || saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-dialog-content {
      min-width: 600px;
      max-height: 600px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .tab-content {
      padding: 20px 0;
    }

    .weight-item {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .weight-item label {
      flex: 0 0 200px;
      font-weight: 500;
    }

    .weight-item mat-slider {
      flex: 1;
    }

    .weight-value {
      flex: 0 0 40px;
      text-align: right;
      font-weight: 600;
      color: #3498db;
    }

    @media (max-width: 768px) {
      mat-dialog-content {
        min-width: auto;
        max-width: 90vw;
      }

      .weight-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .weight-item label {
        flex: none;
      }

      .weight-item mat-slider {
        width: 100%;
      }
    }
  `]
})
export class LeadScoringConfigDialogComponent implements OnInit {
  configForm!: FormGroup;
  saving = false;

  sourceKeys = ['referral', 'web', 'social_media', 'email', 'phone', 'walk_in', 'mobile', 'unknown'];
  engagementKeys = ['inboundMessage', 'outboundMessage', 'appointment'];
  propertyKeys = ['noProperty', 'hasProperty', 'hasPrice', 'hasPhotos'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<LeadScoringConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { config?: LeadScoringConfig },
    private leadScoringApi: LeadScoringApiService,
    private toastService: ToastNotificationService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const config = this.data?.config;

    const formConfig: any = {
      configName: [config?.configName || 'Default Configuration', Validators.required],
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
          this.toastService.success('Configuration saved successfully');
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error saving configuration:', error);
          this.toastService.error('Failed to save configuration');
          this.saving = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
