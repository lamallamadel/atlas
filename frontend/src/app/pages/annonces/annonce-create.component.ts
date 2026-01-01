import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnnonceApiService, AnnonceCreateRequest, AnnonceUpdateRequest, AnnonceStatus, AnnonceResponse } from '../../services/annonce-api.service';

@Component({
  selector: 'app-annonce-create',
  templateUrl: './annonce-create.component.html',
  styleUrls: ['./annonce-create.component.css']
})
export class AnnonceCreateComponent implements OnInit {
  annonceForm!: FormGroup;
  isEditMode = false;
  annonceId: number | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;
  validationErrors: { [key: string]: string } = {};

  AnnonceStatus = AnnonceStatus;
  statusOptions = [
    { value: AnnonceStatus.DRAFT, label: 'Draft' },
    { value: AnnonceStatus.PUBLISHED, label: 'Published' },
    { value: AnnonceStatus.ARCHIVED, label: 'Archived' }
  ];

  constructor(
    private fb: FormBuilder,
    private annonceApiService: AnnonceApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  initForm(): void {
    this.annonceForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(500)]],
      description: ['', [Validators.maxLength(10000)]],
      city: ['', [Validators.maxLength(255)]],
      price: [null, [Validators.min(0)]],
      status: [AnnonceStatus.DRAFT]
    });
  }

  checkEditMode(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.annonceId = parseInt(id, 10);
      this.loadAnnonce();
    }
  }

  loadAnnonce(): void {
    if (this.annonceId === null) return;

    this.loading = true;
    this.error = null;

    this.annonceApiService.getById(this.annonceId).subscribe({
      next: (annonce: AnnonceResponse) => {
        this.annonceForm.patchValue({
          title: annonce.title,
          description: annonce.description || '',
          city: annonce.city || '',
          price: annonce.price,
          status: annonce.status
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load annonce. Please try again.';
        this.loading = false;
        console.error('Error loading annonce:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.annonceForm.invalid) {
      this.markFormGroupTouched(this.annonceForm);
      return;
    }

    this.submitting = true;
    this.error = null;
    this.validationErrors = {};

    if (this.isEditMode && this.annonceId !== null) {
      this.updateAnnonce();
    } else {
      this.createAnnonce();
    }
  }

  createAnnonce(): void {
    const formValue = this.annonceForm.value;
    const request: AnnonceCreateRequest = {
      orgId: 'ORG-001',
      title: formValue.title,
      description: formValue.description || undefined,
      city: formValue.city || undefined,
      price: formValue.price !== null && formValue.price !== '' ? formValue.price : undefined
    };

    this.annonceApiService.create(request).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/annonces']);
      },
      error: (err) => {
        this.submitting = false;
        this.handleError(err);
      }
    });
  }

  updateAnnonce(): void {
    if (this.annonceId === null) return;

    const formValue = this.annonceForm.value;
    const request: AnnonceUpdateRequest = {
      title: formValue.title,
      description: formValue.description || undefined,
      city: formValue.city || undefined,
      price: formValue.price !== null && formValue.price !== '' ? formValue.price : undefined,
      status: formValue.status
    };

    this.annonceApiService.update(this.annonceId, request).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/annonces']);
      },
      error: (err) => {
        this.submitting = false;
        this.handleError(err);
      }
    });
  }

  handleError(err: { status?: number; error?: { errors?: { field?: string; message?: string; defaultMessage?: string }[]; message?: string } }): void {
    console.error('Error submitting annonce:', err);
    
    if (err.status === 400 && err.error && err.error.errors) {
      this.validationErrors = {};
      err.error.errors.forEach((error: { field?: string; message?: string; defaultMessage?: string }) => {
        const field = error.field || 'general';
        this.validationErrors[field] = error.message || error.defaultMessage || 'Invalid value';
      });
      this.error = 'Please correct the validation errors below.';
    } else if (err.status === 404) {
      this.error = 'Annonce not found.';
    } else if (err.error && err.error.message) {
      this.error = err.error.message;
    } else {
      this.error = 'Failed to save annonce. Please try again.';
    }
  }

  onCancel(): void {
    this.router.navigate(['/annonces']);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFieldError(fieldName: string): string | null {
    const control = this.annonceForm.get(fieldName);
    
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
      if (control.errors?.['min']) {
        return `${this.getFieldLabel(fieldName)} must be greater than or equal to 0`;
      }
    }

    return null;
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Title',
      description: 'Description',
      city: 'City',
      price: 'Price',
      status: 'Status'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.annonceForm.get(fieldName);
    return !!(control && control.touched && (control.invalid || this.validationErrors[fieldName]));
  }
}
