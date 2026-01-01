import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnnonceApiService, AnnonceCreateRequest, AnnonceUpdateRequest, AnnonceStatus, AnnonceResponse } from '../../services/annonce-api.service';

@Component({
  selector: 'app-annonce-create',
  templateUrl: './annonce-create.component.html',
  styleUrls: ['./annonce-create.component.css']
})
export class AnnonceCreateComponent implements OnInit {
  step1FormGroup!: FormGroup;
  step2FormGroup!: FormGroup;
  step3FormGroup!: FormGroup;
  step4FormGroup!: FormGroup;
  
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

  typeOptions = [
    { value: 'APARTMENT', label: 'Apartment' },
    { value: 'HOUSE', label: 'House' },
    { value: 'STUDIO', label: 'Studio' },
    { value: 'COMMERCIAL', label: 'Commercial' }
  ];

  constructor(
    private fb: FormBuilder,
    private annonceApiService: AnnonceApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.checkEditMode();
  }

  initForms(): void {
    this.step1FormGroup = this.fb.group({
      type: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(500)]],
      description: ['', Validators.maxLength(10000)]
    });

    this.step2FormGroup = this.fb.group({
      price: [null, [Validators.min(0)]],
      city: ['', Validators.maxLength(255)],
      address: ['', Validators.maxLength(500)],
      surface: [null, [Validators.min(0)]]
    });

    this.step3FormGroup = this.fb.group({
      photos: this.fb.array([])
    });

    this.step4FormGroup = this.fb.group({
      rulesJson: ['{}', [Validators.required, this.jsonValidator]]
    });
  }

  get photos(): FormArray {
    return this.step3FormGroup.get('photos') as FormArray;
  }

  getPhotoControl(index: number): FormControl {
    return this.photos.at(index) as FormControl;
  }

  addPhoto(): void {
    this.photos.push(this.fb.control('', [Validators.required, Validators.maxLength(1000)]));
  }

  removePhoto(index: number): void {
    this.photos.removeAt(index);
  }

  jsonValidator(control: AbstractControl): ValidationErrors | null {
    try {
      const value = control.value;
      if (value) {
        JSON.parse(value);
      }
      return null;
    } catch (e) {
      return { invalidJson: true };
    }
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
        this.step1FormGroup.patchValue({
          type: annonce.category || '',
          title: annonce.title,
          description: annonce.description || ''
        });
        
        this.step2FormGroup.patchValue({
          price: annonce.price,
          city: annonce.city || '',
          address: '',
          surface: null
        });

        this.step4FormGroup.patchValue({
          rulesJson: '{}'
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
    if (this.step1FormGroup.invalid || this.step2FormGroup.invalid || 
        this.step3FormGroup.invalid || this.step4FormGroup.invalid) {
      this.markAllFormGroupsTouched();
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
    const step1Value = this.step1FormGroup.value;
    const step2Value = this.step2FormGroup.value;
    
    const request: AnnonceCreateRequest = {
      orgId: 'ORG-001',
      title: step1Value.title,
      description: step1Value.description || undefined,
      category: step1Value.type || undefined,
      city: step2Value.city || undefined,
      price: step2Value.price !== null && step2Value.price !== '' ? step2Value.price : undefined
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

    const step1Value = this.step1FormGroup.value;
    const step2Value = this.step2FormGroup.value;
    
    const request: AnnonceUpdateRequest = {
      title: step1Value.title,
      description: step1Value.description || undefined,
      category: step1Value.type || undefined,
      city: step2Value.city || undefined,
      price: step2Value.price !== null && step2Value.price !== '' ? step2Value.price : undefined
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

  markAllFormGroupsTouched(): void {
    this.markFormGroupTouched(this.step1FormGroup);
    this.markFormGroupTouched(this.step2FormGroup);
    this.markFormGroupTouched(this.step3FormGroup);
    this.markFormGroupTouched(this.step4FormGroup);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          c.markAsTouched();
        });
      }
    });
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string | null {
    const control = formGroup.get(fieldName);
    
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
      if (control.errors?.['invalidJson']) {
        return `${this.getFieldLabel(fieldName)} must be valid JSON`;
      }
    }

    return null;
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      type: 'Type',
      title: 'Title',
      description: 'Description',
      price: 'Price',
      city: 'City',
      address: 'Address',
      surface: 'Surface',
      rulesJson: 'Rules JSON'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const control = formGroup.get(fieldName);
    return !!(control && control.touched && (control.invalid || this.validationErrors[fieldName]));
  }

  formatJson(): void {
    try {
      const control = this.step4FormGroup.get('rulesJson');
      if (control) {
        const parsed = JSON.parse(control.value);
        control.setValue(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      // Invalid JSON, don't format
    }
  }
}
