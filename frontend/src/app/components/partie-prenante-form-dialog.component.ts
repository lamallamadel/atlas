import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PartiePrenanteRole } from '../services/dossier-api.service';
import { trigger, transition, style, animate } from '@angular/animations';

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
  templateUrl: './partie-prenante-form-dialog.component.html',
  styleUrls: ['./partie-prenante-form-dialog.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class PartiePrenanteFormDialogComponent implements OnInit {
  partieForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  PartiePrenanteRole = PartiePrenanteRole;

  roleOptions = [
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
    private dialogRef: MatDialogRef<PartiePrenanteFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PartiePrenanteFormData | null
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
