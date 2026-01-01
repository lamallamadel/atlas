import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DossierApiService, DossierCreateRequest, DossierResponse } from '../../services/dossier-api.service';

@Component({
  selector: 'app-dossier-create',
  templateUrl: './dossier-create.component.html',
  styleUrls: ['./dossier-create.component.css']
})
export class DossierCreateComponent implements OnInit {
  dossierForm!: FormGroup;
  submitting = false;
  error: string | null = null;
  validationErrors: { [key: string]: string } = {};
  duplicates: DossierResponse[] = [];
  checkingDuplicates = false;

  constructor(
    private fb: FormBuilder,
    private dossierApiService: DossierApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.dossierForm = this.fb.group({
      leadName: ['', [Validators.maxLength(255)]],
      leadPhone: ['', [Validators.maxLength(50)]],
      leadSource: ['', [Validators.maxLength(255)]],
      annonceId: [null]
    });
  }

  onPhoneBlur(): void {
    const phone = this.dossierForm.get('leadPhone')?.value;
    if (phone && phone.trim()) {
      this.checkDuplicates(phone.trim());
    } else {
      this.duplicates = [];
    }
  }

  checkDuplicates(phone: string): void {
    this.checkingDuplicates = true;
    this.dossierApiService.checkDuplicates(phone).subscribe({
      next: (duplicates) => {
        this.duplicates = duplicates;
        this.checkingDuplicates = false;
      },
      error: (err) => {
        console.error('Error checking duplicates:', err);
        this.checkingDuplicates = false;
      }
    });
  }

  onSubmit(): void {
    if (this.dossierForm.invalid) {
      this.markFormGroupTouched(this.dossierForm);
      return;
    }

    this.submitting = true;
    this.error = null;
    this.validationErrors = {};

    const formValue = this.dossierForm.value;
    const request: DossierCreateRequest = {
      orgId: 'ORG-001',
      leadName: formValue.leadName || undefined,
      leadPhone: formValue.leadPhone || undefined,
      leadSource: formValue.leadSource || undefined,
      annonceId: formValue.annonceId !== null && formValue.annonceId !== '' ? formValue.annonceId : undefined
    };

    this.dossierApiService.create(request).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/dossiers']);
      },
      error: (err) => {
        this.submitting = false;
        this.handleError(err);
      }
    });
  }

  handleError(err: { status?: number; error?: { errors?: { field?: string; message?: string; defaultMessage?: string }[]; message?: string } }): void {
    console.error('Error submitting dossier:', err);
    
    if (err.status === 400 && err.error && err.error.errors) {
      this.validationErrors = {};
      err.error.errors.forEach((error: { field?: string; message?: string; defaultMessage?: string }) => {
        const field = error.field || 'general';
        this.validationErrors[field] = error.message || error.defaultMessage || 'Invalid value';
      });
      this.error = 'Please correct the validation errors below.';
    } else if (err.error && err.error.message) {
      this.error = err.error.message;
    } else {
      this.error = 'Failed to create dossier. Please try again.';
    }
  }

  onCancel(): void {
    this.router.navigate(['/dossiers']);
  }

  openExistingDossier(dossierId: number): void {
    this.router.navigate(['/dossiers', dossierId]);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const control = this.dossierForm.get(fieldName);
    
    if (this.validationErrors[fieldName]) {
      return this.validationErrors[fieldName];
    }

    if (control && control.touched && control.invalid) {
      if (control.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors?.['maxlength']) {
        const maxLength = control.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must not exceed ${maxLength} characters`;
      }
    }

    return null;
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      leadName: 'Lead Name',
      leadPhone: 'Lead Phone',
      leadSource: 'Lead Source',
      annonceId: 'Annonce ID'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.dossierForm.get(fieldName);
    return !!(control && control.touched && (control.invalid || this.validationErrors[fieldName]));
  }
}
