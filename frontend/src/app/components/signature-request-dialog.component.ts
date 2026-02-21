import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ESignatureApiService } from '../services/esignature-api.service';
import { SignatureRequestCreate, ContractTemplate } from '../models/esignature.models';

export interface SignatureRequestDialogData {
  dossierId: number;
  leadName?: string;
  leadEmail?: string;
}

@Component({
  selector: 'app-signature-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Request Electronic Signature</h2>
    <mat-dialog-content>
      <form [formGroup]="requestForm" class="signature-request-form">
        <mat-form-field appearance="outline">
          <mat-label>Contract Template</mat-label>
          <mat-select formControlName="templateId">
            <mat-option *ngFor="let template of templates" [value]="template.id">
              {{ template.templateName }} ({{ template.templateType }})
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email Subject</mat-label>
          <input matInput formControlName="subject" required>
          <mat-error *ngIf="requestForm.get('subject')?.hasError('required')">
            Subject is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email Message</mat-label>
          <textarea matInput formControlName="emailMessage" rows="4"></textarea>
        </mat-form-field>

        <div class="signers-section">
          <div class="section-header">
            <h3>Signers</h3>
            <button mat-mini-fab color="primary" type="button" (click)="addSigner()">
              <mat-icon>add</mat-icon>
            </button>
          </div>

          <div formArrayName="signers" class="signers-list">
            <div *ngFor="let signer of signers.controls; let i = index" [formGroupName]="i" class="signer-item">
              <mat-form-field appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" required>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" required>
              </mat-form-field>

              <mat-form-field appearance="outline" class="routing-order">
                <mat-label>Order</mat-label>
                <input matInput type="number" formControlName="routingOrder" min="1">
              </mat-form-field>

              <button mat-icon-button color="warn" type="button" (click)="removeSigner(i)" *ngIf="signers.length > 1">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Expiration (days)</mat-label>
          <input matInput type="number" formControlName="expirationDays" min="1" max="365">
          <mat-hint>Days until signature request expires (default: 30)</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onCreate()" [disabled]="!requestForm.valid || creating">
        {{ creating ? 'Creating...' : 'Create & Send' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .signature-request-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 600px;
      padding: 16px 0;
    }

    .signers-section {
      margin: 16px 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h3 {
      margin: 0;
    }

    .signers-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .signer-item {
      display: grid;
      grid-template-columns: 1fr 1fr 100px auto;
      gap: 12px;
      align-items: start;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .routing-order {
      width: 80px;
    }

    mat-form-field {
      width: 100%;
    }

    mat-dialog-content {
      overflow-y: auto;
      max-height: 70vh;
    }
  `]
})
export class SignatureRequestDialogComponent implements OnInit {
  requestForm: FormGroup;
  templates: ContractTemplate[] = [];
  creating = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SignatureRequestDialogComponent>,
    private eSignatureService: ESignatureApiService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: SignatureRequestDialogData
  ) {
    this.requestForm = this.fb.group({
      templateId: [null],
      subject: ['Signature Required for Real Estate Contract', Validators.required],
      emailMessage: ['Please review and sign the attached contract.'],
      signers: this.fb.array([]),
      expirationDays: [30, [Validators.min(1), Validators.max(365)]]
    });
  }

  ngOnInit(): void {
    this.loadTemplates();
    this.addSigner();

    if (this.data.leadName && this.data.leadEmail) {
      this.signers.at(0).patchValue({
        name: this.data.leadName,
        email: this.data.leadEmail,
        routingOrder: 1
      });
    }
  }

  get signers(): FormArray {
    return this.requestForm.get('signers') as FormArray;
  }

  loadTemplates(): void {
    this.eSignatureService.getActiveTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        if (templates.length > 0) {
          this.requestForm.patchValue({ templateId: templates[0].id });
        }
      },
      error: (error) => {
        this.snackBar.open('Failed to load templates', 'Close', { duration: 3000 });
        console.error('Error loading templates:', error);
      }
    });
  }

  addSigner(): void {
    const signerGroup = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      routingOrder: [this.signers.length + 1, Validators.required]
    });
    this.signers.push(signerGroup);
  }

  removeSigner(index: number): void {
    this.signers.removeAt(index);
    this.signers.controls.forEach((control, i) => {
      control.patchValue({ routingOrder: i + 1 });
    });
  }

  onCreate(): void {
    if (this.requestForm.valid) {
      this.creating = true;
      const request: SignatureRequestCreate = {
        dossierId: this.data.dossierId,
        ...this.requestForm.value
      };

      this.eSignatureService.createSignatureRequest(request).subscribe({
        next: (signatureRequest) => {
          this.eSignatureService.sendSignatureRequest(signatureRequest.id!).subscribe({
            next: () => {
              this.snackBar.open('Signature request sent successfully', 'Close', { duration: 3000 });
              this.dialogRef.close(true);
            },
            error: (error) => {
              this.snackBar.open('Failed to send signature request', 'Close', { duration: 3000 });
              console.error('Error sending signature request:', error);
              this.creating = false;
            }
          });
        },
        error: (error) => {
          this.snackBar.open('Failed to create signature request', 'Close', { duration: 3000 });
          console.error('Error creating signature request:', error);
          this.creating = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
