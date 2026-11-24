import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { PartiePrenanteRole } from '../services/dossier-api.service';
import { CommonModule } from '@angular/common';
import {
  DsButtonComponent,
  DsIconComponent,
  DsSelectComponent,
  DsSelectOption,
  DsInputComponent,
  DsDialogHeaderComponent,
  DsDialogContentComponent,
  DsDialogActionsComponent
} from '../design-system';

export interface PartiePrenanteFormData {
  id?: number;
  role: PartiePrenanteRole;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

@Component({
    selector: 'app-partie-prenante-form-dialog',
    standalone: true,
    templateUrl: './partie-prenante-form-dialog.component.html',
    styleUrls: ['./partie-prenante-form-dialog.component.css'],
    imports: [
      CommonModule,
      ReactiveFormsModule, 
      DsButtonComponent,
      DsIconComponent,
      DsSelectComponent,
      DsInputComponent,
      DsDialogHeaderComponent,
      DsDialogContentComponent,
      DsDialogActionsComponent
    ]
})
export class PartiePrenanteFormDialogComponent implements OnInit {
  partieForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  PartiePrenanteRole = PartiePrenanteRole;

  readonly roleOptions: DsSelectOption[] = [
    { value: PartiePrenanteRole.OWNER, label: 'Propriétaire' },
    { value: PartiePrenanteRole.BUYER, label: 'Acheteur' },
    { value: PartiePrenanteRole.SELLER, label: 'Vendeur' },
    { value: PartiePrenanteRole.TENANT, label: 'Locataire' },
    { value: PartiePrenanteRole.LANDLORD, label: 'Bailleur' },
    { value: PartiePrenanteRole.AGENT, label: 'Agent' },
    { value: PartiePrenanteRole.NOTARY, label: 'Notaire' },
    { value: PartiePrenanteRole.BANK, label: 'Banque' },
    { value: PartiePrenanteRole.ATTORNEY, label: 'Avocat' },
    { value: PartiePrenanteRole.LEAD, label: 'Lead' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: DialogRef<PartiePrenanteFormData>,
    @Inject(DIALOG_DATA) public data: PartiePrenanteFormData | null
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!(this.data?.id);
    
    this.partieForm = this.fb.group({
      role: [this.data?.role || PartiePrenanteRole.BUYER, Validators.required],
      firstName: [this.data?.firstName || '', Validators.required],
      lastName: [this.data?.lastName || '', Validators.required],
      phone: [this.data?.phone || '', [Validators.pattern(/^[0-9+\s()-]+$/)]],
      email: [this.data?.email || '', [Validators.email]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.partieForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.partieForm.value;
      this.dialogRef.close({
        id: this.data?.id,
        ...formValue
      });
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.partieForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (field?.hasError('email')) {
      return 'Email invalide';
    }
    if (field?.hasError('pattern')) {
      return 'Format de téléphone invalide';
    }
    return '';
  }
}
