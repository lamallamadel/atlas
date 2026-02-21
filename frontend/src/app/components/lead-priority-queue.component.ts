import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LeadScoringApiService, LeadPriority } from '../services/lead-scoring-api.service';
import { ToastNotificationService } from '../services/toast-notification.service';

@Component({
  selector: 'app-lead-priority-queue',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="priority-queue-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon class="title-icon">trending_up</mat-icon>
          High-Priority Leads
        </mat-card-title>
        <div class="header-actions">
          <button mat-icon-button (click)="refresh()" [disabled]="loading" matTooltip="Refresh">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-icon-button (click)="recalculateAll()" [disabled]="loading" matTooltip="Recalculate All Scores">
            <mat-icon>calculate</mat-icon>
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div *ngIf="!loading && leads.length === 0" class="empty-state">
          <mat-icon class="empty-icon">inbox</mat-icon>
          <p>No high-priority leads at the moment</p>
        </div>

        <div *ngIf="!loading && leads.length > 0" class="leads-list">
          <div *ngFor="let lead of leads" 
               class="lead-item" 
               [class.urgent]="lead.urgencyLevel === 'urgent'"
               [class.high]="lead.urgencyLevel === 'high'"
               [class.medium]="lead.urgencyLevel === 'medium'"
               (click)="viewDossier(lead.dossier.id)">
            
            <div class="lead-score">
              <div class="score-value">{{ lead.score.totalScore }}</div>
              <div class="score-label">pts</div>
            </div>

            <div class="lead-info">
              <div class="lead-name">
                {{ lead.dossier.leadName || 'Unknown Lead' }}
              </div>
              <div class="lead-details">
                <span *ngIf="lead.dossier.leadPhone" class="detail-item">
                  <mat-icon class="detail-icon">phone</mat-icon>
                  {{ lead.dossier.leadPhone }}
                </span>
                <span *ngIf="lead.dossier.source" class="detail-item">
                  <mat-icon class="detail-icon">source</mat-icon>
                  {{ lead.dossier.source }}
                </span>
                <span class="detail-item">
                  <mat-icon class="detail-icon">schedule</mat-icon>
                  {{ formatDate(lead.dossier.createdAt) }}
                </span>
              </div>
              <div class="score-breakdown">
                <span class="breakdown-item" matTooltip="Source Score">
                  <mat-icon class="breakdown-icon">business</mat-icon>
                  {{ lead.score.sourceScore }}
                </span>
                <span class="breakdown-item" matTooltip="Response Time Score">
                  <mat-icon class="breakdown-icon">schedule</mat-icon>
                  {{ lead.score.responseTimeScore }}
                </span>
                <span class="breakdown-item" matTooltip="Engagement Score">
                  <mat-icon class="breakdown-icon">chat</mat-icon>
                  {{ lead.score.engagementScore }}
                </span>
                <span class="breakdown-item" matTooltip="Property Match Score">
                  <mat-icon class="breakdown-icon">home</mat-icon>
                  {{ lead.score.propertyMatchScore }}
                </span>
              </div>
            </div>

            <div class="lead-urgency">
              <mat-chip [class]="'urgency-chip ' + lead.urgencyLevel">
                {{ getUrgencyLabel(lead.urgencyLevel) }}
              </mat-chip>
            </div>

            <div class="lead-actions">
              <button mat-icon-button (click)="viewDossier(lead.dossier.id); $event.stopPropagation()" matTooltip="View Details">
                <mat-icon>visibility</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .priority-queue-card {
      margin: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
    }

    .title-icon {
      margin-right: 8px;
      color: #3498db;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 60px 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #7f8c8d;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #bdc3c7;
      margin-bottom: 16px;
    }

    .leads-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px 0;
    }

    .lead-item {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      border-left: 4px solid #3498db;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .lead-item:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .lead-item.urgent {
      border-left-color: #e74c3c;
      background: #fff5f5;
    }

    .lead-item.high {
      border-left-color: #f39c12;
      background: #fffbf0;
    }

    .lead-item.medium {
      border-left-color: #3498db;
      background: #f8fcff;
    }

    .lead-score {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 80px;
      margin-right: 20px;
    }

    .score-value {
      font-size: 32px;
      font-weight: bold;
      color: #2c3e50;
      line-height: 1;
    }

    .score-label {
      font-size: 12px;
      color: #7f8c8d;
      text-transform: uppercase;
    }

    .lead-info {
      flex: 1;
      min-width: 0;
    }

    .lead-name {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .lead-details {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 8px;
      font-size: 14px;
      color: #7f8c8d;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .detail-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .score-breakdown {
      display: flex;
      gap: 12px;
      font-size: 13px;
      color: #7f8c8d;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .breakdown-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .lead-urgency {
      margin: 0 16px;
    }

    .urgency-chip {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
    }

    .urgency-chip.urgent {
      background-color: #e74c3c !important;
      color: white !important;
    }

    .urgency-chip.high {
      background-color: #f39c12 !important;
      color: white !important;
    }

    .urgency-chip.medium {
      background-color: #3498db !important;
      color: white !important;
    }

    .urgency-chip.low {
      background-color: #95a5a6 !important;
      color: white !important;
    }

    .lead-actions {
      display: flex;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .lead-item {
        flex-wrap: wrap;
      }

      .lead-score {
        margin-right: 16px;
        min-width: 60px;
      }

      .score-value {
        font-size: 24px;
      }

      .lead-details {
        flex-direction: column;
        gap: 4px;
      }

      .score-breakdown {
        flex-wrap: wrap;
      }

      .lead-urgency {
        order: -1;
        margin: 0 0 8px 0;
        width: 100%;
      }
    }
  `]
})
export class LeadPriorityQueueComponent implements OnInit {
  leads: LeadPriority[] = [];
  loading = false;

  constructor(
    private leadScoringApi: LeadScoringApiService,
    private router: Router,
    private toastService: ToastNotificationService
  ) {}

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.loading = true;
    this.leadScoringApi.getPriorityQueue(50).subscribe({
      next: (leads) => {
        this.leads = leads;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading priority queue:', error);
        this.toastService.showError('Failed to load priority leads');
        this.loading = false;
      }
    });
  }

  refresh(): void {
    this.loadLeads();
  }

  recalculateAll(): void {
    this.loading = true;
    this.leadScoringApi.recalculateAllScores().subscribe({
      next: (result) => {
        this.toastService.showSuccess('Score recalculation initiated');
        setTimeout(() => this.loadLeads(), 2000);
      },
      error: (error) => {
        console.error('Error recalculating scores:', error);
        this.toastService.showError('Failed to recalculate scores');
        this.loading = false;
      }
    });
  }

  viewDossier(dossierId: number): void {
    this.router.navigate(['/dossiers', dossierId]);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  getUrgencyLabel(level: string): string {
    const labels: { [key: string]: string } = {
      urgent: 'URGENT',
      high: 'HIGH',
      medium: 'MEDIUM',
      low: 'LOW'
    };
    return labels[level] || level.toUpperCase();
  }
}
