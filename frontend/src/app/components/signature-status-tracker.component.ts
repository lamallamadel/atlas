import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsCardComponent } from '../design-system';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
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
    DsCardComponent,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="signature-tracker-container">
      @for (request of signatureRequests; track request) {
        <ds-card class="signature-card" [pad]="false" [elevation]="'sm'">
          <div class="signature-card-header">
            <h3 class="signature-card-title">{{ request.subject }}</h3>
            <div class="signature-card-subtitle">
              <mat-chip [class]="getStatusClass(request.status)">
                {{ getStatusLabel(request.status) }}
              </mat-chip>
            </div>
          </div>
          <div class="signature-card-body">
            <div class="workflow-visualization">
              <div class="workflow-step" [class.active]="isStepActive(request, 'SENT')" [class.completed]="isStepCompleted(request, 'SENT')">
                <div class="step-icon">
                  <mat-icon>{{ isStepCompleted(request, 'SENT') ? 'check_circle' : 'send' }}</mat-icon>
                </div>
                <div class="step-label">Sent</div>
                @if (request.sentAt) {
                  <div class="step-time">{{ request.sentAt | date:'short' }}</div>
                }
              </div>
              <div class="workflow-connector" [class.active]="isStepCompleted(request, 'SENT')"></div>
              <div class="workflow-step" [class.active]="isStepActive(request, 'VIEWED')" [class.completed]="isStepCompleted(request, 'VIEWED')">
                <div class="step-icon">
                  <mat-icon>{{ isStepCompleted(request, 'VIEWED') ? 'check_circle' : 'visibility' }}</mat-icon>
                </div>
                <div class="step-label">Viewed</div>
                @if (request.viewedAt) {
                  <div class="step-time">{{ request.viewedAt | date:'short' }}</div>
                }
              </div>
              <div class="workflow-connector" [class.active]="isStepCompleted(request, 'VIEWED')"></div>
              <div class="workflow-step" [class.active]="isStepActive(request, 'SIGNED')" [class.completed]="isStepCompleted(request, 'SIGNED')">
                <div class="step-icon">
                  <mat-icon>{{ isStepCompleted(request, 'SIGNED') ? 'check_circle' : 'edit' }}</mat-icon>
                </div>
                <div class="step-label">Signed</div>
                @if (request.signedAt) {
                  <div class="step-time">{{ request.signedAt | date:'short' }}</div>
                }
              </div>
              <div class="workflow-connector" [class.active]="isStepCompleted(request, 'SIGNED')"></div>
              <div class="workflow-step" [class.active]="isStepActive(request, 'COMPLETED')" [class.completed]="isStepCompleted(request, 'COMPLETED')">
                <div class="step-icon">
                  <mat-icon>{{ isStepCompleted(request, 'COMPLETED') ? 'check_circle' : 'task_alt' }}</mat-icon>
                </div>
                <div class="step-label">Completed</div>
                @if (request.completedAt) {
                  <div class="step-time">{{ request.completedAt | date:'short' }}</div>
                }
              </div>
            </div>
            @if (getSigners(request).length > 0) {
              <div class="signers-info">
                <h4>Signers</h4>
                @for (signer of getSigners(request); track signer) {
                  <div class="signer-item">
                    <mat-icon>person</mat-icon>
                    <span>{{ signer.name }} ({{ signer.email }})</span>
                  </div>
                }
              </div>
            }
            @if (request.status === 'DECLINED') {
              <div class="declined-info">
                <mat-icon color="warn">cancel</mat-icon>
                <div>
                  <strong>Declined</strong>
                  @if (request.declinedReason) {
                    <p>{{ request.declinedReason }}</p>
                  }
                  <p class="declined-time">{{ request.declinedAt | date:'short' }}</p>
                </div>
              </div>
            }
            @if (request.status === 'VOIDED') {
              <div class="voided-info">
                <mat-icon color="warn">block</mat-icon>
                <div>
                  <strong>Voided</strong>
                  @if (request.voidedReason) {
                    <p>{{ request.voidedReason }}</p>
                  }
                  <p class="voided-time">{{ request.voidedAt | date:'short' }}</p>
                </div>
              </div>
            }
            @if (request.signedDocumentId) {
              <div class="document-info">
                <button mat-raised-button color="primary">
                  <mat-icon>download</mat-icon>
                  Download Signed Document
                </button>
                @if (request.certificatePath) {
                  <button mat-button>
                    <mat-icon>verified</mat-icon>
                    Download Certificate
                  </button>
                }
              </div>
            }
          </div>
        </ds-card>
      }
    
      @if (signatureRequests.length === 0) {
        <div class="empty-state">
          <mat-icon>description</mat-icon>
          <p>No signature requests for this dossier</p>
        </div>
      }
    </div>
    `,
  styles: [`
    .signature-tracker-container {
      padding: 16px;
    }

    .signature-card {
      display: block;
      margin-bottom: 24px;
    }

    .signature-card-header {
      padding: 16px;
      border-bottom: 1px solid var(--ds-divider, #e0e0e0);
    }

    .signature-card-title {
      margin: 0 0 8px;
      font-size: 1.25rem;
      font-weight: 500;
    }

    .signature-card-subtitle {
      margin: 0;
    }

    .signature-card-body {
      padding: 16px;
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

  constructor(private eSignatureService: ESignatureApiService) { }

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
