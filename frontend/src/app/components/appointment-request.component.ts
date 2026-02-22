import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientAppointmentRequest } from '../models/customer-portal.models';
import { CustomerPortalService } from '../services/customer-portal.service';

@Component({
  selector: 'app-appointment-request',
  template: `
    <div class="appointment-container">
      <h2>Demander un rendez-vous</h2>
      
      <div class="existing-requests" *ngIf="requests.length > 0">
        <h3>Vos demandes</h3>
        <div *ngFor="let request of requests" class="request-card">
          <div class="request-header">
            <span class="request-date">{{ request.proposedStartTime | date:'short' }}</span>
            <span class="request-status" [class]="'status-' + request.status.toLowerCase()">
              {{ getStatusLabel(request.status) }}
            </span>
          </div>
          <div class="request-details" *ngIf="request.preferredLocation">
            📍 {{ request.preferredLocation }}
          </div>
          <div class="request-response" *ngIf="request.agentResponse">
            <strong>Réponse de l'agent:</strong> {{ request.agentResponse }}
          </div>
        </div>
      </div>

      <form [formGroup]="requestForm" (ngSubmit)="submitRequest()" class="request-form">
        <div class="form-group">
          <label for="proposedStartTime">Date et heure souhaitée *</label>
          <input id="proposedStartTime" type="datetime-local" formControlName="proposedStartTime" class="form-control">
        </div>

        <div class="form-group">
          <label for="duration">Durée estimée</label>
          <select id="duration" formControlName="duration" class="form-control">
            <option value="30">30 minutes</option>
            <option value="60">1 heure</option>
            <option value="90">1h30</option>
            <option value="120">2 heures</option>
          </select>
        </div>

        <div class="form-group">
          <label for="preferredLocation">Lieu préféré</label>
          <input id="preferredLocation" type="text" formControlName="preferredLocation" 
                 placeholder="Adresse ou lieu de rendez-vous" 
                 class="form-control">
        </div>

        <div class="form-group">
          <label for="notes">Notes</label>
          <textarea id="notes" formControlName="notes" 
                    placeholder="Informations complémentaires..." 
                    rows="3"
                    class="form-control"></textarea>
        </div>

        <button type="submit" 
                [disabled]="!requestForm.valid || submitting"
                class="submit-button">
          <span *ngIf="!submitting">✉️ Envoyer la demande</span>
          <span *ngIf="submitting">⏳ Envoi...</span>
        </button>
      </form>
    </div>
  `,
  styles: [`
    .appointment-container {
      padding: 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h2 {
      margin: 0 0 24px 0;
      font-size: 20px;
      color: #333;
    }

    h3 {
      margin: 24px 0 16px 0;
      font-size: 16px;
      color: #666;
    }

    .request-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .request-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .request-date {
      font-weight: 500;
      color: #333;
    }

    .request-status {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-accepted {
      background: #d4edda;
      color: #155724;
    }

    .status-declined {
      background: #f8d7da;
      color: #721c24;
    }

    .request-details {
      margin-top: 8px;
      color: #666;
      font-size: 14px;
    }

    .request-response {
      margin-top: 12px;
      padding: 12px;
      background: white;
      border-radius: 4px;
      font-size: 14px;
    }

    .request-form {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    textarea.form-control {
      resize: vertical;
    }

    .submit-button {
      width: 100%;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .submit-button:hover:not(:disabled) {
      background: #5568d3;
    }

    .submit-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class AppointmentRequestComponent implements OnInit {
  @Input() dossierId!: number;
  requests: ClientAppointmentRequest[] = [];
  requestForm: FormGroup;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private portalService: CustomerPortalService
  ) {
    this.requestForm = this.fb.group({
      proposedStartTime: ['', Validators.required],
      duration: [60, Validators.required],
      preferredLocation: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.portalService.getAppointmentRequests(this.dossierId).subscribe({
      next: (requests) => {
        this.requests = requests;
      },
      error: (err) => console.error('Error loading requests:', err)
    });
  }

  submitRequest(): void {
    if (!this.requestForm.valid || this.submitting) return;

    const formValue = this.requestForm.value;
    const startTime = new Date(formValue.proposedStartTime);
    const endTime = new Date(startTime.getTime() + formValue.duration * 60000);

    const request: ClientAppointmentRequest = {
      orgId: this.portalService.currentOrgId!,
      dossierId: this.dossierId,
      proposedStartTime: startTime.toISOString(),
      proposedEndTime: endTime.toISOString(),
      preferredLocation: formValue.preferredLocation,
      notes: formValue.notes,
      status: 'PENDING'
    };

    this.submitting = true;
    this.portalService.createAppointmentRequest(this.dossierId, request).subscribe({
      next: () => {
        this.requestForm.reset({ duration: 60 });
        this.loadRequests();
        this.submitting = false;
      },
      error: (err) => {
        console.error('Error submitting request:', err);
        this.submitting = false;
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'ACCEPTED': 'Acceptée',
      'DECLINED': 'Refusée',
      'CANCELLED': 'Annulée'
    };
    return labels[status] || status;
  }
}
