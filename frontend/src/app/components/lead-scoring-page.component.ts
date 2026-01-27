import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LeadPriorityQueueComponent } from './lead-priority-queue.component';
import { LeadScoringConfigDialogComponent } from './lead-scoring-config-dialog.component';
import { LeadScoringApiService, LeadScoringConfig } from '../services/lead-scoring-api.service';
import { ToastNotificationService } from '../services/toast-notification.service';

@Component({
  selector: 'app-lead-scoring-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    LeadPriorityQueueComponent
  ],
  template: `
    <div class="lead-scoring-page">
      <div class="page-header">
        <div class="header-content">
          <h1>
            <mat-icon class="page-icon">psychology</mat-icon>
            Lead Scoring & Qualification
          </h1>
          <p class="page-description">
            Automated lead scoring and priority management system
          </p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openConfigDialog()">
            <mat-icon>settings</mat-icon>
            Configure Scoring Rules
          </button>
        </div>
      </div>

      <mat-tab-group class="scoring-tabs">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">trending_up</mat-icon>
            Priority Queue
          </ng-template>
          <app-lead-priority-queue></app-lead-priority-queue>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">info</mat-icon>
            About
          </ng-template>
          <div class="about-content">
            <h2>Lead Scoring System</h2>
            <p>
              The lead scoring system automatically evaluates and prioritizes leads based on multiple factors:
            </p>

            <div class="scoring-factors">
              <div class="factor-card">
                <mat-icon class="factor-icon">business</mat-icon>
                <h3>Source Score</h3>
                <p>Weight assigned based on lead source (referral, web, social media, etc.)</p>
              </div>

              <div class="factor-card">
                <mat-icon class="factor-icon">schedule</mat-icon>
                <h3>Response Time</h3>
                <p>Faster response times receive higher scores</p>
              </div>

              <div class="factor-card">
                <mat-icon class="factor-icon">chat</mat-icon>
                <h3>Engagement</h3>
                <p>Based on message exchanges and scheduled appointments</p>
              </div>

              <div class="factor-card">
                <mat-icon class="factor-icon">home</mat-icon>
                <h3>Property Match</h3>
                <p>Quality of property information and matching criteria</p>
              </div>
            </div>

            <h3>Auto-Qualification</h3>
            <p>
              Leads that reach the configured threshold score are automatically moved from NEW to QUALIFYING status.
              This ensures high-priority leads are quickly identified and processed.
            </p>

            <h3>Daily Digest</h3>
            <p>
              Agents receive a daily email digest of high-priority leads, helping them focus on the most promising opportunities.
            </p>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .lead-scoring-page {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
    }

    .header-content h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
    }

    .page-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .page-description {
      margin: 0;
      opacity: 0.95;
      font-size: 16px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .scoring-tabs {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .tab-icon {
      margin-right: 8px;
    }

    .about-content {
      padding: 32px;
      max-width: 900px;
    }

    .about-content h2 {
      font-size: 24px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 16px;
    }

    .about-content h3 {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin: 24px 0 12px;
    }

    .about-content p {
      font-size: 16px;
      line-height: 1.6;
      color: #555;
      margin-bottom: 16px;
    }

    .scoring-factors {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 24px 0;
    }

    .factor-card {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #3498db;
      text-align: center;
    }

    .factor-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #3498db;
      margin-bottom: 12px;
    }

    .factor-card h3 {
      font-size: 16px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 8px 0;
    }

    .factor-card p {
      font-size: 14px;
      color: #7f8c8d;
      margin: 0;
      line-height: 1.4;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .header-actions {
        width: 100%;
      }

      .header-actions button {
        width: 100%;
      }

      .about-content {
        padding: 20px;
      }

      .scoring-factors {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class LeadScoringPageComponent implements OnInit {
  activeConfig: LeadScoringConfig | null = null;

  constructor(
    private dialog: MatDialog,
    private leadScoringApi: LeadScoringApiService,
    private toastService: ToastNotificationService
  ) {}

  ngOnInit(): void {
    this.loadActiveConfig();
  }

  loadActiveConfig(): void {
    this.leadScoringApi.getActiveConfig().subscribe({
      next: (config) => {
        this.activeConfig = config;
      },
      error: (error) => {
        console.error('Error loading active config:', error);
      }
    });
  }

  openConfigDialog(): void {
    const dialogRef = this.dialog.open(LeadScoringConfigDialogComponent, {
      width: '800px',
      data: { config: this.activeConfig }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadActiveConfig();
      }
    });
  }
}
