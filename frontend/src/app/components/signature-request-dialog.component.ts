import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { ESignatureApiService } from '../services/esignature-api.service';
import { SignatureRequestCreate, ContractTemplate } from '../models/esignature.models';
import { 
  DsButtonComponent, 
  DsIconComponent, 
  DsInputComponent, 
  DsSelectComponent, 
  DsSelectOption,
  DsCardComponent,
  DsToastService,
  DsSkeletonComponent,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';

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
    DsButtonComponent,
    DsIconComponent,
    DsInputComponent,
    DsSelectComponent,
    DsCardComponent,
    DsSkeletonComponent,
    DsDialogHeaderComponent,
    DsDialogContentComponent,
    DsDialogActionsComponent
  ],
  template: `
    <ds-dialog-header (close)="onCancel()">
      <div style="display: flex; align-items: center; gap: 12px;">
        <ds-icon name="edit" [size]="24" style="color: var(--ds-marine);"></ds-icon>
        <span>Demande de signature électronique</span>
      </div>
    </ds-dialog-header>

    <ds-dialog-content>
      <form [formGroup]="requestForm" class="signature-request-form ds-form-stack">
        <ds-select
          label="Modèle de contrat"
          [options]="templateOptions"
          formControlName="templateId">
        </ds-select>
    
        <ds-input
          label="Sujet de l'email"
          formControlName="subject"
          placeholder="ex. Signature requise pour votre contrat..."
          required="true"
          [error]="getFieldError('subject')">
        </ds-input>
    
        <div class="ds-field">
          <label for="signature-request-dialog-field-69" class="ds-field__label">Message de l'email</label>
          <div class="ds-field__wrap">
            <textarea id="signature-request-dialog-field-69" 
              class="ds-field__input" 
              formControlName="emailMessage" 
              rows="4"
              style="height: auto; padding: 12px;"></textarea>
          </div>
        </div>
    
        <div class="signers-section ds-form-stack" style="margin: 24px 0;">
          <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: var(--ds-marine);">Signataires</h3>
            <ds-button variant="ghost" size="sm" type="button" (dsClick)="addSigner()">
              <ds-icon name="plus" [size]="16" style="margin-right: 8px;"></ds-icon>
              Ajouter
            </ds-button>
          </div>
    
          <div formArrayName="signers" class="signers-list ds-form-stack" style="gap: 16px;">
            @for (signer of signers.controls; track signer; let i = $index) {
              <ds-card [formGroupName]="i" class="signer-item" [pad]="true" elevation="xs" style="background: var(--ds-surface-2);">
                <div style="display: grid; grid-template-columns: 1fr 1fr 80px auto; gap: 16px; align-items: flex-end;">
                  <ds-input label="Nom" formControlName="name" required="true"></ds-input>
                  <ds-input label="Email" type="email" formControlName="email" required="true"></ds-input>
                  <ds-input label="Ordre" type="number" formControlName="routingOrder" min="1"></ds-input>
                  
                  @if (signers.length > 1) {
                    <ds-button variant="icon" size="md" (dsClick)="removeSigner(i)" style="color: var(--ds-error);">
                      <ds-icon name="trash" [size]="20"></ds-icon>
                    </ds-button>
                  }
                </div>
              </ds-card>
            }
          </div>
        </div>
    
        <ds-input
          label="Expiration (jours)"
          type="number"
          formControlName="expirationDays"
          min="1"
          max="365"
          hint="Délai avant expiration (par défaut : 30 jours)">
        </ds-input>
      </form>
    </ds-dialog-content>

    <ds-dialog-actions align="end">
      <ds-button variant="ghost" size="md" (dsClick)="onCancel()">Annuler</ds-button>
      <ds-button 
        variant="marine" 
        size="md" 
        (dsClick)="onCreate()" 
        [disabled]="!requestForm.valid || creating">
        @if (creating) {
          <span class="spinner-small" style="margin-right: 8px; border-color: rgba(255,255,255,0.3); border-top-color: #fff;"></span>
        } @else {
          <ds-icon name="send" [size]="20" style="margin-right: 8px;"></ds-icon>
        }
        <span>{{ creating ? 'Création...' : 'Créer & Envoyer' }}</span>
      </ds-button>
    </ds-dialog-actions>
    `,
  styles: [`
    .signature-request-form {
      min-width: 600px;
    }
    @media (max-width: 768px) {
      .signature-request-form {
        min-width: 100%;
      }
    }
  `]
})
export class SignatureRequestDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private eSignatureService = inject(ESignatureApiService);
  private toastService = inject(DsToastService);
  private dialogRef = inject(DialogRef<boolean>);
  
  public data: SignatureRequestDialogData = inject(DIALOG_DATA);

  requestForm!: FormGroup;
  templates: ContractTemplate[] = [];
  templateOptions: DsSelectOption[] = [];
  creating = false;

  ngOnInit(): void {
    this.initForm();
    this.loadTemplates();
    
    if (this.data.leadName && this.data.leadEmail) {
      this.signers.at(0).patchValue({
        name: this.data.leadName,
        email: this.data.leadEmail,
        routingOrder: 1
      });
    }
  }

  private initForm(): void {
    this.requestForm = this.fb.group({
      templateId: [null],
      subject: ['Signature requise pour votre contrat immobilier', Validators.required],
      emailMessage: ['Bonjour, veuillez consulter et signer électroniquement le contrat ci-joint.'],
      signers: this.fb.array([]),
      expirationDays: [30, [Validators.min(1), Validators.max(365)]]
    });
    this.addSigner();
  }

  get signers(): FormArray {
    return this.requestForm.get('signers') as FormArray;
  }

  loadTemplates(): void {
    this.eSignatureService.getActiveTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.templateOptions = templates.map(t => ({
          value: t.id,
          label: `${t.templateName} (${t.templateType})`
        }));
        if (templates.length > 0) {
          this.requestForm.patchValue({ templateId: templates[0].id });
        }
      },
      error: (error) => {
        this.toastService.error('Échec du chargement des modèles');
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
              this.toastService.success('Demande de signature envoyée avec succès');
              this.dialogRef.close(true);
            },
            error: (error) => {
              this.toastService.error('Échec de l\'envoi de la demande');
              console.error('Error sending signature request:', error);
              this.creating = false;
            }
          });
        },
        error: (error) => {
          this.toastService.error('Échec de la création de la demande');
          console.error('Error creating signature request:', error);
          this.creating = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getFieldError(fieldName: string): string {
    const field = this.requestForm.get(fieldName);
    if (field?.hasError('required')) return 'Ce champ est requis';
    return '';
  }
}
