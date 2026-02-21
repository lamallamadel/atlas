import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chip';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ESignatureApiService } from '../services/esignature-api.service';
import { SignatureRequest, SignatureStatus } from '../models/esignature.models';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-signature-status-tracker',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="signature-tracker-container">
      <mat-card *ngFor="let request of signatureRequests" class="signature-card">
        <mat-card-header>
          <mat-card-title>{{ request.subject }}</mat-card-title>
          <mat-card-subtitle>
            <mat-chip [class]="getStatusClass(request.status)">
              {{ getStatusLabel(request.status) }}
            </mat-chip>
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="workflow-visualization">
            <div class="workflow-step" [class.active]="isStepActive(request, 'SENT')" [class.completed]="isStepCompleted(request, 'SENT')">
              <div class="step-icon">
                <mat-icon>{{ isStepCompleted(request, 'SENT') ? 'check_circle' : 'send' }}</mat-icon>
              </div>
              <div class="step-label">Sent</div>
              <div class="step-time" *ngIf="request.sentAt">{{ request.sentAt | date:'short' }}</div>
            </div>

            <div class="workflow-connector" [class.active]="isStepCompleted(request, 'SENT')"></div>

            <div class="workflow-step" [class.active]="isStepActive(request, 'VIEWED')" [class.completed]="isStepCompleted(request, 'VIEWED')">
              <div class="step-icon">
                <mat-icon>{{ isStepCompleted(request, 'VIEWED') ? 'check_circle' : 'visibility' }}</mat-icon>
              </div>
              <div class="step-label">Viewed</div>
              <div class="step-time" *ngIf="request.viewedAt">{{ request.viewedAt | date:'short' }}</div>
            </div>

            <div class="workflow-connector" [class.active]="isStepCompleted(request, 'VIEWED')"></div>

            <div class="workflow-step" [class.active]="isStepActive(request, 'SIGNED')" [class.completed]="isStepCompleted(request, 'SIGNED')">
              <div class="step-icon">
                <mat-icon>{{ isStepCompleted(request, 'SIGNED') ? 'check_circle' : 'edit' }}</mat-icon>
              </div>
              <div class="step-label">Signed</div>
              <div class="step-time" *ngIf="request.signedAt">{{ request.signedAt | date:'short' }}</div>
            </div>

            <div class="workflow-connector" [class.active]="isStepCompleted(request, 'SIGNED')"></div>

            <div class="workflow-step" [class.active]="isStepActive(request, 'COMPLETED')" [class.completed]="isStepCompleted(request, 'COMPLETED')">
              <div class="step-icon">
                <mat-icon>{{ isStepCompleted(request, 'COMPLETED') ? 'check_circle' : 'task_alt' }}</mat-icon>
              </div>
              <div class="step-label">Completed</div>
              <div class="step-time" *ngIf="request.completedAt">{{ request.completedAt | date:'short' }}</div>
            </div>
          </div>

          <div class="signers-info" *ngIf="getSigners(request).length > 0">
            <h4>Signers</h4>
            <div class="signer-item" *ngFor="let signer of getSigners(request)">
              <mat-icon>person</mat-icon>
              <span>{{ signer.name }} ({{ signer.email }})</span>
            </div>
          </div>

          <div class="declined-info" *ngIf="request.status === 'DECLINED'">
            <mat-icon color="warn">cancel</mat-icon>
            <div>
              <strong>Declined</strong>
              <p *ngIf="request.declinedReason">{{ request.declinedReason }}</p>
              <p class="declined-time">{{ request.declinedAt | date:'short' }}</p>
            </div>
          </div>

          <div class="voided-info" *ngIf="request.status === 'VOIDED'">
            <mat-icon color="warn">block</mat-icon>
            <div>
              <strong>Voided</strong>
              <p *ngIf="request.voidedReason">{{ request.voidedReason }}</p>
              <p class="voided-time">{{ request.voidedAt | date:'short' }}</p>
            </div>
          </div>

          <div class="document-info" *ngIf="request.signedDocumentId">
            <button mat-raised-button color="primary">
              <mat-icon>download</mat-icon>
              Download Signed Document
            </button>
            <button mat-button *ngIf="request.certificatePath">
              <mat-icon>verified</mat-icon>
              Download Certificate
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="empty-state" *ngIf="signatureRequests.length === 0">
        <mat-icon>description</mat-icon>
        <p>No signature requests for this dossier</p>
      </div>
    </div>
  `,
  styles: [`
    .signature-tracker-container {
      padding: 16px;
    }

    .signature-card {
      margin-bottom: 24px;
    }

    .workflow-visualization {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 32px 0;
      padding: 24px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .workflow-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 0 0 auto;
      min-width: 100px;
    }

    .step-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e0e0e0;
      color: #757575;
      margin-bottom: 8px;
      transition: all 0.3s ease;
    }

    .workflow-step.active .step-icon {
      background: #2196F3;
      color: white;
      box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
    }

    .workflow-step.completed .step-icon {
      background: #4CAF50;
      color: white;
    }

    .step-icon mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .step-label {
      font-weight: 500;
      margin-bottom: 4px;
      color: #424242;
    }

    .step-time {
      font-size: 12px;
      color: #757575;
    }

    .workflow-connector {
      flex: 1;
      height: 2px;
      background: #e0e0e0;
      margin: 0 8px;
      max-width: 100px;
      transition: background 0.3s ease;
    }

    .workflow-connector.active {
      background: #4CAF50;
    }

    .signers-info {
      margin-top: 24px;
    }

    .signers-info h4 {
      margin-bottom: 12px;
      color: #424242;
    }

    .signer-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      margin-bottom: 4px;
    }

    .signer-item mat-icon {
      color: #757575;
    }

    .declined-info,
    .voided-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      margin-top: 16px;
      border-radius: 4px;
    }

    .declined-time,
    .voided-time {
      font-size: 12px;
      color: #757575;
      margin-top: 4px;
    }

    .document-info {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .empty-state {
      text-align: center;
      padding: 48px;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }

    mat-chip {
      font-size: 12px;
      min-height: 24px;
    }

    mat-chip.status-pending { background: #f5f5f5; color: #757575; }
    mat-chip.status-sent { background: #e3f2fd; color: #1976d2; }
    mat-chip.status-viewed { background: #fff3e0; color: #f57c00; }
    mat-chip.status-signed { background: #e8f5e9; color: #388e3c; }
    mat-chip.status-completed { background: #4caf50; color: white; }
    mat-chip.status-declined { background: #ffebee; color: #c62828; }
    mat-chip.status-voided { background: #f3e5f5; color: #7b1fa2; }
  `]
})
export class SignatureStatusTrackerComponent implements OnInit, OnDestroy {
  @Input() dossierId!: number;
  @Input() autoRefresh = true;
  @Input() refreshInterval = 30000;

  signatureRequests: SignatureRequest[] = [];
  private refreshSubscription?: Subscription;

  constructor(private eSignatureService: ESignatureApiService) {}

  ngOnInit(): void {
    this.loadSignatureRequests();

    if (this.autoRefresh) {
      this.refreshSubscription = interval(this.refreshInterval)
        .pipe(switchMap(() => this.eSignatureService.getSignatureRequestsByDossier(this.dossierId)))
        .subscribe(requests => {
          this.signatureRequests = requests;
        });
    }
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadSignatureRequests(): void {
    this.eSignatureService.getSignatureRequestsByDossier(this.dossierId).subscribe({
      next: (requests) => {
        this.signatureRequests = requests;
      },
      error: (error) => {
        console.error('Error loading signature requests:', error);
      }
    });
  }

  getStatusLabel(status: SignatureStatus): string {
    const labels: Record<SignatureStatus, string> = {
      [SignatureStatus.PENDING]: 'Pending',
      [SignatureStatus.SENT]: 'Sent',
      [SignatureStatus.VIEWED]: 'Viewed',
      [SignatureStatus.SIGNED]: 'Signed',
      [SignatureStatus.COMPLETED]: 'Completed',
      [SignatureStatus.DECLINED]: 'Declined',
      [SignatureStatus.VOIDED]: 'Voided',
      [SignatureStatus.EXPIRED]: 'Expired'
    };
    return labels[status];
  }

  getStatusClass(status: SignatureStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  isStepActive(request: SignatureRequest, step: string): boolean {
    return request.status === step;
  }

  isStepCompleted(request: SignatureRequest, step: string): boolean {
    const stepOrder = ['SENT', 'VIEWED', 'SIGNED', 'COMPLETED'];
    const currentIndex = stepOrder.indexOf(request.status);
    const stepIndex = stepOrder.indexOf(step);
    return currentIndex > stepIndex || (currentIndex === stepIndex && request.status === 'COMPLETED');
  }

  getSigners(request: SignatureRequest): any[] {
    try {
      return Array.isArray(request.signers) ? request.signers : JSON.parse(request.signers as any);
    } catch {
      return [];
    }
  }
}
