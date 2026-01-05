import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PartiePrenanteRole } from '../services/dossier-api.service';

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
  styleUrls: ['./partie-prenante-form-dialog.component.css']
})
export class PartiePrenanteFormDialogComponent implements OnInit {
  partieForm!: FormGroup;
  isEditMode = false;
  PartiePrenanteRole = PartiePrenanteRole;

  roleOptions = [
    { value: PartiePrenanteRole.LEAD, label: 'Lead' },
    { value: PartiePrenanteRole.BUYER, label: 'Acheteur' },
    { value: PartiePrenanteRole.SELLER, label: 'Vendeur' },
    { value: PartiePrenanteRole.AGENT, label: 'Agent' }
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
      phone: [this.data?.phone || '', [Validators.required, Validators.pattern(/^[0-9+\s()-]+$/)]],
      email: [this.data?.email || '', [Validators.required, Validators.email]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.partieForm.valid) {
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
