import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, AbstractControl, ValidationErrors, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import {
  AnnonceApiService,
  AnnonceCreateRequest,
  AnnonceUpdateRequest,
  AnnonceStatus,
  AnnonceResponse
} from '../../services/annonce-api.service';
import { LoadingSkeletonComponent } from '../../components/loading-skeleton.component';
import { CommonModule } from '@angular/common';
import { 
  DsSkeletonComponent, 
  DsSelectComponent, 
  DsSelectOption, 
  DsButtonComponent, 
  DsIconComponent, 
  DsInputComponent,
  DsBadgeComponent,
  DsCardComponent,
  DsToastService,
  StageStepperComponent,
  DsStage
} from '../../design-system';

@Component({
    selector: 'app-annonce-create',
    standalone: true,
    templateUrl: './annonce-create.component.html',
    styleUrls: ['./annonce-create.component.css'],
    imports: [
      CommonModule,
      LoadingSkeletonComponent, 
      FormsModule, 
      ReactiveFormsModule, 
      CdkDropList, 
      CdkDrag, 
      CdkDragPlaceholder, 
      DsSelectComponent,
      DsButtonComponent,
      DsIconComponent,
      DsInputComponent,
      StageStepperComponent
    ]
})
export class AnnonceCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private annonceApiService = inject(AnnonceApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(DsToastService);

  activeStepIndex = signal(0);
  
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
  
  readonly statusOptions: DsSelectOption[] = [
    // Suspendre ou archiver se fait depuis le bloc « Publication » de la fiche (raison exigée).
    // Publier n'aboutit que si l'annonce est complète (description, surface, photos…).
    { value: AnnonceStatus.DRAFT, label: 'Brouillon' },
    { value: AnnonceStatus.PUBLISHED, label: 'En ligne (publier)' },
    { value: AnnonceStatus.SUSPENDED, label: 'Suspendue' },
    { value: AnnonceStatus.ARCHIVED, label: 'Archivée' }
  ];

  readonly categoryOptions: DsSelectOption[] = [
    { value: 'APARTMENT', label: 'Appartement' },
    { value: 'HOUSE', label: 'Maison' },
    { value: 'STUDIO', label: 'Studio' },
    { value: 'COMMERCIAL', label: 'Commercial' }
  ];

  readonly typeOptions: DsSelectOption[] = [
    { value: 'SALE', label: 'Vente' },
    { value: 'RENT', label: 'Location' },
    { value: 'LEASE', label: 'Bail' },
    { value: 'EXCHANGE', label: 'Échange' }
  ];

  dragDropActive = false;
  previewUrls: { [key: number]: string } = {};
  photoLoadErrors: { [key: number]: boolean } = {};

  readonly stages = computed<DsStage[]>(() => [
    { label: 'Infos de base', state: this.getStageState(0) },
    { label: 'Localisation', state: this.getStageState(1) },
    { label: 'Photos', state: this.getStageState(2) },
    { label: 'Règles', state: this.getStageState(3) }
  ]);

  private getStageState(index: number): 'done' | 'current' | 'upcoming' {
    if (this.activeStepIndex() === index) return 'current';
    if (this.isStepCompleted(index)) return 'done';
    return 'upcoming';
  }

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
      const url = this.newPhotoUrl.trim();
      this.photos.push(
        this.fb.control(url, [Validators.required, Validators.maxLength(1000)])
      );
      const index = this.photos.length - 1;
      this.previewUrls[index] = url;
      this.newPhotoUrl = '';
    }
  }

  removePhoto(index: number): void {
    this.photos.removeAt(index);
    delete this.photoErrors[index];
    delete this.previewUrls[index];
    delete this.photoLoadErrors[index];
    this.reindexPreviews();
  }

  reindexPreviews(): void {
    const newPreviewUrls: { [key: number]: string } = {};
    const newPhotoLoadErrors: { [key: number]: boolean } = {};
    this.photos.controls.forEach((control, index) => {
      newPreviewUrls[index] = control.value;
      if (this.photoLoadErrors[index]) {
        newPhotoLoadErrors[index] = true;
      }
    });
    this.previewUrls = newPreviewUrls;
    this.photoLoadErrors = newPhotoLoadErrors;
  }

  onPhotoError(index: number): void {
    this.photoErrors[index] = true;
    this.photoLoadErrors[index] = true;
  }

  onPhotoLoad(index: number): void {
    this.photoErrors[index] = false;
    this.photoLoadErrors[index] = false;
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragDropActive = true;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragDropActive = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragDropActive = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragDropActive = false;

    const text = event.dataTransfer?.getData('text');
    if (text && this.isValidUrl(text)) {
      this.newPhotoUrl = text;
      this.addPhoto();
    }
  }

  isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  dropPhoto(event: CdkDragDrop<string[]>): void {
    const photosArray = this.photos;
    const item = photosArray.at(event.previousIndex);
    photosArray.removeAt(event.previousIndex);
    photosArray.insert(event.currentIndex, item);
    this.reindexPreviews();
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
          annonce.photos.forEach((photo, index) => {
            photosArray.push(this.fb.control(photo, [Validators.required, Validators.maxLength(1000)]));
            this.previewUrls[index] = photo;
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

  nextStep(): void {
    const currentGroup = this.getCurrentFormGroup();
    if (currentGroup.valid) {
      this.activeStepIndex.update(i => i + 1);
    } else {
      this.markFormGroupTouched(currentGroup);
      this.toastService.warning('Veuillez remplir correctement tous les champs obligatoires.');
    }
  }

  prevStep(): void {
    if (this.activeStepIndex() > 0) {
      this.activeStepIndex.update(i => i - 1);
    }
  }

  goToStep(index: number): void {
    if (index < this.activeStepIndex()) {
      this.activeStepIndex.set(index);
    } else if (index > this.activeStepIndex()) {
      // Logic for skipping steps could be added here
      if (this.isStepCompleted(this.activeStepIndex())) {
        this.activeStepIndex.set(index);
      }
    }
  }

  private getCurrentFormGroup(): FormGroup {
    switch (this.activeStepIndex()) {
      case 0: return this.step1FormGroup;
      case 1: return this.step2FormGroup;
      case 2: return this.step3FormGroup;
      case 3: return this.step4FormGroup;
      default: return this.step1FormGroup;
    }
  }

  onSubmit(): void {
    this.markAllFormGroupsTouched();

    if (
      this.step1FormGroup.invalid ||
      this.step2FormGroup.invalid ||
      this.step3FormGroup.invalid ||
      this.step4FormGroup.invalid
    ) {
      this.toastService.error('Certaines étapes contiennent des erreurs.');
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

  private parseRulesJson(): Record<string, unknown> | undefined {
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

      currency: 'MAD', // marché marocain : dirham
      photos: this.step3FormGroup.value.photos,
      rulesJson: this.parseRulesJson(),
      meta: { source: 'wizard' }
    };

    this.annonceApiService.create(request).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success('Annonce créée avec succès');
        this.router.navigate(['/pro/annonces']);
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
        this.toastService.success('Annonce modifiée avec succès');
        this.router.navigate(['/pro/annonces']);
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
    this.router.navigate(['/pro/annonces']);
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
      annonceType: 'Type d\'annonce',
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
    } catch (error) {
      // Invalid JSON, do nothing
    }
  }

  isStepCompleted(stepIndex: number): boolean {
    switch (stepIndex) {
      case 0:
        return this.step1FormGroup.valid;
      case 1:
        return this.step2FormGroup.valid;
      case 2:
        return this.step3FormGroup.valid;
      case 3:
        return this.step4FormGroup.valid;
      default:
        return false;
    }
  }
}

