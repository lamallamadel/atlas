import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsCardComponent, DsButtonComponent, DsIconComponent, DsBadgeComponent, DsBadgeStatus } from '../design-system';
import { ESignatureApiService } from '../services/esignature-api.service';
import { SignatureRequest, SignatureStatus } from '../models/esignature.models';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-signature-status-tracker',
  standalone: true,
  imports: [CommonModule, DsCardComponent, DsButtonComponent, DsIconComponent, DsBadgeComponent],
  template: `
    <div class="signature-tracker-container">
      @for (request of signatureRequests; track request) {
        <ds-card class="signature-card" [pad]="false" [elevation]="'sm'">
          <div class="signature-card-header">
            <h3 class="signature-card-title">{{ request.subject }}</h3>
            <div class="signature-card-subtitle">
              <ds-badge [status]="getStatusBadge(request.status)" [showDot]="false" size="sm">
                {{ getStatusLabel(request.status) }}
              </ds-badge>
            </div>
          </div>
          <div class="signature-card-body">
            <div class="workflow-visualization">
              <div class="workflow-step" [class.active]="isStepActive(request, 'SENT')" [class.completed]="isStepCompleted(request, 'SENT')">
                <div class="step-icon">
                  <ds-icon [name]="isStepCompleted(request, 'SENT') ? 'check' : 'mail'" [size]="24"></ds-icon>
                </div>
                <div class="step-label">Envoyé</div>
                @if (request.sentAt) {
                  <div class="step-time">{{ request.sentAt | date:'short' }}</div>
                }
              </div>
              <div class="workflow-connector" [class.active]="isStepCompleted(request, 'SENT')"></div>
              <div class="workflow-step" [class.active]="isStepActive(request, 'VIEWED')" [class.completed]="isStepCompleted(request, 'VIEWED')">
                <div class="step-icon">
                  <ds-icon [name]="isStepCompleted(request, 'VIEWED') ? 'check' : 'eye'" [size]="24"></ds-icon>
                </div>
                <div class="step-label">Vu</div>
                @if (request.viewedAt) {
                  <div class="step-time">{{ request.viewedAt | date:'short' }}</div>
                }
              </div>
              <div class="workflow-connector" [class.active]="isStepCompleted(request, 'VIEWED')"></div>
              <div class="workflow-step" [class.active]="isStepActive(request, 'SIGNED')" [class.completed]="isStepCompleted(request, 'SIGNED')">
                <div class="step-icon">
                  <ds-icon [name]="isStepCompleted(request, 'SIGNED') ? 'check' : 'edit'" [size]="24"></ds-icon>
                </div>
                <div class="step-label">Signé</div>
                @if (request.signedAt) {
                  <div class="step-time">{{ request.signedAt | date:'short' }}</div>
                }
              </div>
              <div class="workflow-connector" [class.active]="isStepCompleted(request, 'SIGNED')"></div>
              <div class="workflow-step" [class.active]="isStepActive(request, 'COMPLETED')" [class.completed]="isStepCompleted(request, 'COMPLETED')">
                <div class="step-icon">
                  <ds-icon name="check" [size]="24"></ds-icon>
                </div>
                <div class="step-label">Complété</div>
                @if (request.completedAt) {
                  <div class="step-time">{{ request.completedAt | date:'short' }}</div>
                }
              </div>
            </div>
            @if (getSigners(request).length > 0) {
              <div class="signers-info">
                <h4>Signataires</h4>
                @for (signer of getSigners(request); track signer) {
                  <div class="signer-item">
                    <ds-icon name="user" [size]="16"></ds-icon>
                    <span>{{ signer.name }} ({{ signer.email }})</span>
                  </div>
                }
              </div>
            }
            @if (request.status === 'DECLINED') {
              <div class="declined-info">
                <ds-icon name="info" [size]="20" style="color: var(--ds-error);"></ds-icon>
                <div>
                  <strong>Refusé</strong>
                  @if (request.declinedReason) {
                    <p>{{ request.declinedReason }}</p>
                  }
                  <p class="declined-time">{{ request.declinedAt | date:'short' }}</p>
                </div>
              </div>
            }
            @if (request.status === 'VOIDED') {
              <div class="voided-info">
                <ds-icon name="info" [size]="20" style="color: var(--ds-warning);"></ds-icon>
                <div>
                  <strong>Annulé</strong>
                  @if (request.voidedReason) {
                    <p>{{ request.voidedReason }}</p>
                  }
                  <p class="voided-time">{{ request.voidedAt | date:'short' }}</p>
                </div>
              </div>
            }
            @if (request.signedDocumentId) {
              <div class="document-info">
                <ds-button variant="marine" size="sm" (dsClick)="downloadDocument(request)">
                  <ds-icon name="download" [size]="16"></ds-icon>
                  Télécharger le document signé
                </ds-button>
                @if (request.certificatePath) {
                  <ds-button variant="ghost" size="sm" (dsClick)="downloadCertificate(request)">
                    <ds-icon name="check" [size]="16"></ds-icon>
                    Télécharger le certificat
                  </ds-button>
                }
              </div>
            }
          </div>
        </ds-card>
      }

      @if (signatureRequests.length === 0) {
        <div class="empty-state">
          <ds-icon name="tasks" [size]="64" style="color: var(--ds-text-faint); margin-bottom: 16px;"></ds-icon>
          <p>Aucune demande de signature pour ce dossier</p>
        </div>
      }
    </div>
    `,
  styles: [`
    .signature-tracker-container { padding: 16px; }

    .signature-card { display: block; margin-bottom: 24px; }

    .signature-card-header {
      padding: 16px;
      border-bottom: 1px solid var(--ds-divider);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .signature-card-title { margin: 0 0 8px; font-size: 1.1rem; font-weight: 600; }

    .signature-card-body { padding: 16px; }

    .workflow-visualization {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 32px 0;
      padding: 24px;
      background: var(--ds-bg-subtle);
      border-radius: var(--ds-radius-md);
    }

    .workflow-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 0 0 auto;
      min-width: 80px;
    }

    .step-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ds-border);
      color: var(--ds-text-muted);
      margin-bottom: 8px;
      transition: all 0.3s ease;
    }

    .workflow-step.active .step-icon { background: var(--ds-marine); color: #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
    .workflow-step.completed .step-icon { background: var(--ds-success); color: #fff; }

    .step-label { font-weight: 500; font-size: 13px; margin-bottom: 4px; color: var(--ds-text-muted); }
    .step-time { font-size: 11px; color: var(--ds-text-faint); }

    .workflow-connector { flex: 1; height: 2px; background: var(--ds-border); margin: 0 8px; max-width: 80px; transition: background 0.3s; }
    .workflow-connector.active { background: var(--ds-success); }

    .signers-info { margin-top: 24px; }
    .signers-info h4 { margin-bottom: 12px; font-size: 13px; font-weight: 600; color: var(--ds-text-muted); }

    .signer-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      margin-bottom: 4px;
      font-size: 13px;
      color: var(--ds-text);
    }

    .declined-info, .voided-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: var(--ds-warning-hl);
      border-left: 4px solid var(--ds-warning);
      margin-top: 16px;
      border-radius: var(--ds-radius-sm);
      font-size: 13px;
    }

    .declined-time, .voided-time { font-size: 11px; color: var(--ds-text-faint); margin-top: 4px; }

    .document-info { display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; }

    .empty-state { text-align: center; padding: 48px; color: var(--ds-text-faint); }
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
        .subscribe(requests => { this.signatureRequests = requests; });
    }
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadSignatureRequests(): void {
    this.eSignatureService.getSignatureRequestsByDossier(this.dossierId).subscribe({
      next: (requests) => { this.signatureRequests = requests; },
      error: (error) => { console.error('Error loading signature requests:', error); }
    });
  }

  downloadDocument(_request: SignatureRequest): void {}
  downloadCertificate(_request: SignatureRequest): void {}

  getStatusLabel(status: SignatureStatus): string {
    const labels: Record<SignatureStatus, string> = {
      [SignatureStatus.PENDING]: 'En attente',
      [SignatureStatus.SENT]: 'Envoyé',
      [SignatureStatus.VIEWED]: 'Vu',
      [SignatureStatus.SIGNED]: 'Signé',
      [SignatureStatus.COMPLETED]: 'Complété',
      [SignatureStatus.DECLINED]: 'Refusé',
      [SignatureStatus.VOIDED]: 'Annulé',
      [SignatureStatus.EXPIRED]: 'Expiré'
    };
    return labels[status];
  }

  getStatusBadge(status: SignatureStatus): DsBadgeStatus {
    switch (status) {
      case SignatureStatus.COMPLETED: return 'success';
      case SignatureStatus.SIGNED: return 'success';
      case SignatureStatus.SENT: return 'info';
      case SignatureStatus.VIEWED: return 'warning';
      case SignatureStatus.DECLINED: return 'error';
      case SignatureStatus.VOIDED: return 'error';
      case SignatureStatus.EXPIRED: return 'error';
      default: return 'neutral';
    }
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
