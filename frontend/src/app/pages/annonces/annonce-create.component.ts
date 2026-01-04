import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AnnonceApiService,
  AnnonceCreateRequest,
  AnnonceUpdateRequest,
  AnnonceStatus,
  AnnonceResponse
} from '../../services/annonce-api.service';

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
    { value: AnnonceStatus.DRAFT, label: 'Brouillon' },
    { value: AnnonceStatus.PUBLISHED, label: 'Publié' },
    { value: AnnonceStatus.ACTIVE, label: 'Actif' },
    { value: AnnonceStatus.PAUSED, label: 'En pause' },
    { value: AnnonceStatus.ARCHIVED, label: 'Archivé' }
  ];

  // Catégorie du bien (correspond à "category" côté backend)
  categoryOptions = [
    { value: 'APARTMENT', label: 'Appartement' },
    { value: 'HOUSE', label: 'Maison' },
    { value: 'STUDIO', label: 'Studio' },
    { value: 'COMMERCIAL', label: 'Commercial' }
  ];

  // Type d’annonce (correspond à enum backend AnnonceType => "type")
  annonceTypeOptions = [
    { value: 'SALE', label: 'Vente' },
    { value: 'RENT', label: 'Location' },
    { value: 'LEASE', label: 'Bail' },
    { value: 'EXCHANGE', label: 'Échange' }
  ];

  constructor(
    private fb: FormBuilder,
    private annonceApiService: AnnonceApiService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.checkEditMode();
  }

  initForms(): void {
    this.step1FormGroup = this.fb.group({
      category: ['', Validators.required],
      annonceType: ['', Validators.required],
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
      rulesJson: ['', [this.jsonValidator]]
    });
  }

  newPhotoUrl = '';
  photoErrors: { [key: number]: boolean } = {};

  get photos(): FormArray {
    return this.step3FormGroup.get('photos') as FormArray;
  }

  getPhotoControl(index: number): FormControl {
    return this.photos.at(index) as FormControl;
  }

  addPhoto(): void {
    if (this.newPhotoUrl.trim()) {
      this.photos.push(
        this.fb.control(this.newPhotoUrl.trim(), [Validators.required, Validators.maxLength(1000)])
      );
      this.newPhotoUrl = '';
    }
  }

  removePhoto(index: number): void {
    this.photos.removeAt(index);
    delete this.photoErrors[index];
  }

  onPhotoError(index: number): void {
    this.photoErrors[index] = true;
  }

  onPhotoLoad(index: number): void {
    this.photoErrors[index] = false;
  }

  jsonValidator(control: AbstractControl): ValidationErrors | null {
    try {
      const value = control.value?.trim();
      if (value && value !== '') {
        JSON.parse(value);
      }
      return null;
    } catch (e) {
      const error = e as Error;
      let position: number | null = null;

      const positionMatch = error.message.match(/position\s+(\d+)|character\s+(\d+)|at\s+(\d+)/i);
      if (positionMatch) {
        position = parseInt(positionMatch[1] || positionMatch[2] || positionMatch[3], 10);
      }

      return {
        invalidJson: true,
        jsonParseError: error.message,
        jsonErrorPosition: position
      };
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
          category: annonce.category || '',
          annonceType: annonce.type || '',
          title: annonce.title,
          description: annonce.description || ''
        });

        this.step2FormGroup.patchValue({
          price: annonce.price,
          city: annonce.city || '',
          address: annonce.address || '',
          surface: annonce.surface
        });

        if (annonce.photos && annonce.photos.length > 0) {
          const photosArray = this.step3FormGroup.get('photos') as FormArray;
          photosArray.clear();
          annonce.photos.forEach(photo => {
            photosArray.push(this.fb.control(photo, [Validators.required, Validators.maxLength(1000)]));
          });
        }

        this.step4FormGroup.patchValue({
          rulesJson:
            annonce.rulesJson && Object.keys(annonce.rulesJson).length > 0
              ? JSON.stringify(annonce.rulesJson, null, 2)
              : ''
        });

        this.loading = false;
      },
      error: (err) => {
        this.error = 'Échec du chargement de l\'annonce. Veuillez réessayer.';
        this.loading = false;
        console.error('Error loading annonce:', err);
      }
    });
  }

  onSubmit(): void {
    this.markAllFormGroupsTouched();

    if (
      this.step1FormGroup.invalid ||
      this.step2FormGroup.invalid ||
      this.step3FormGroup.invalid ||
      this.step4FormGroup.invalid
    ) {
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

  private parseRulesJson(): any | undefined {
    const step4Value = this.step4FormGroup.value;
    try {
      const rulesJsonStr = step4Value.rulesJson?.trim();
      let parsed = rulesJsonStr && rulesJsonStr !== '' ? JSON.parse(rulesJsonStr) : undefined;
      if (parsed && Object.keys(parsed).length === 0) {
        parsed = undefined;
      }
      return parsed;
    } catch {
      return undefined;
    }
  }

  createAnnonce(): void {
    const step1Value = this.step1FormGroup.value;
    const step2Value = this.step2FormGroup.value;

    const request: AnnonceCreateRequest = {
      title: step1Value.title,
      description: step1Value.description || undefined,
      category: step1Value.category || undefined,
      type: step1Value.annonceType || undefined,

      city: step2Value.city || undefined,
      address: step2Value.address || undefined,
      surface: step2Value.surface !== null && step2Value.surface !== '' ? step2Value.surface : undefined,
      price: step2Value.price !== null && step2Value.price !== '' ? step2Value.price : undefined,

      currency: 'EUR',
      photos: this.step3FormGroup.value.photos,
      rulesJson: this.parseRulesJson(),
      meta: { source: 'wizard' }
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
      category: step1Value.category || undefined,
      type: step1Value.annonceType || undefined,

      city: step2Value.city || undefined,
      address: step2Value.address || undefined,
      surface: step2Value.surface !== null && step2Value.surface !== '' ? step2Value.surface : undefined,
      price: step2Value.price !== null && step2Value.price !== '' ? step2Value.price : undefined,

      photos: this.step3FormGroup.value.photos,
      rulesJson: this.parseRulesJson(),
      meta: { source: 'wizard-edit' }
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

  handleError(err: {
    status?: number;
    error?: {
      errors?: { field?: string; message?: string; defaultMessage?: string }[];
      message?: string;
    };
  }): void {
    console.error('Error submitting annonce:', err);

    if (err.status === 400 && err.error && err.error.errors) {
      this.validationErrors = {};
      err.error.errors.forEach((error: { field?: string; message?: string; defaultMessage?: string }) => {
        const field = error.field || 'general';
        this.validationErrors[field] = error.message || error.defaultMessage || 'Valeur invalide';
      });
      this.error = 'Veuillez corriger les erreurs de validation ci-dessous.';
    } else if (err.status === 404) {
      this.error = 'Annonce introuvable.';
    } else if (err.error && err.error.message) {
      this.error = err.error.message;
    } else {
      this.error = 'Échec de l\'enregistrement de l\'annonce. Veuillez réessayer.';
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
        return `${this.getFieldLabel(fieldName)} est requis`;
      }
      if (control.errors?.['maxlength']) {
        const maxLength = control.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} ne doit pas dépasser ${maxLength} caractères`;
      }
      if (control.errors?.['min']) {
        return `${this.getFieldLabel(fieldName)} doit être supérieur ou égal à 0`;
      }
      if (control.errors?.['invalidJson']) {
        const position = control.errors['jsonErrorPosition'];
        if (position !== null && position !== undefined) {
          return `JSON invalide : vérifiez les virgules et guillemets (erreur près de la position ${position})`;
        }
        return `JSON invalide : vérifiez les virgules et guillemets`;
      }
    }

    return null;
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      category: 'Catégorie',
      annonceType: 'Type d’annonce',
      title: 'Titre',
      description: 'Description',
      price: 'Prix',
      city: 'Ville',
      address: 'Adresse',
      surface: 'Surface',
      rulesJson: 'Règles JSON'
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
      if (control && control.value?.trim()) {
        const parsed = JSON.parse(control.value);
        control.setValue(JSON.stringify(parsed, null, 2));
      }
    } catch {
      // Invalid JSON => do nothing
    }
  }
}
