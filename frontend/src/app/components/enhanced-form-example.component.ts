import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { FormValidationService, ValidationSuggestion } from '../services/form-validation.service';
import { FormDraftService } from '../services/form-draft.service';
import { FormStep } from './form-progress-indicator.component';
import { ComponentCanDeactivate } from '../guards/form-unsaved-changes.guard';

@Component({
  selector: 'app-enhanced-form-example',
  templateUrl: './enhanced-form-example.component.html',
  styleUrls: ['./enhanced-form-example.component.css']
})
export class EnhancedFormExampleComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  form!: FormGroup;
  currentStep = 0;
  formSteps: FormStep[] = [
    { label: 'Informations de base', completed: false },
    { label: 'Coordonnées', completed: false },
    { label: 'Confirmation', completed: false, optional: true }
  ];

  emailSuggestions: ValidationSuggestion[] = [];
  phoneSuggestions: ValidationSuggestion[] = [];
  
  validatingEmail = false;
  validatingPhone = false;
  
  autoSaveEnabled = true;
  lastSavedAt: Date | null = null;

  emailHints = {
    default: 'Entrez votre adresse email',
    focused: 'Format: utilisateur@domaine.com',
    valid: 'Email valide ✓',
    invalid: 'Veuillez entrer un email valide',
    hasValue: 'Vérification de l\'email...'
  };

  phoneHints = {
    default: 'Entrez votre numéro de téléphone',
    focused: 'Format: 06 12 34 56 78 ou +33 6 12 34 56 78',
    valid: 'Numéro valide ✓',
    invalid: 'Veuillez entrer un numéro valide',
    hasValue: 'Le numéro sera formaté automatiquement'
  };

  private destroy$ = new Subject<void>();
  private initialFormValue: any;

  constructor(
    private fb: FormBuilder,
    private validationService: FormValidationService,
    private draftService: FormDraftService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadDraft();
    this.setupValidation();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.draftService.stopAutoSave('enhanced-form-example');
  }

  initializeForm(): void {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      message: ['', [Validators.maxLength(500)]],
      acceptTerms: [false, Validators.requiredTrue]
    });

    this.initialFormValue = this.form.value;
  }

  loadDraft(): void {
    const draft = this.draftService.loadDraft('enhanced-form-example');
    if (draft) {
      this.form.patchValue(draft.data);
      const age = this.draftService.getDraftAge(draft);
      console.log(`Draft loaded (${age} minutes old)`);
    }
  }

  setupValidation(): void {
    const emailControl = this.form.get('email');
    if (emailControl) {
      emailControl.valueChanges
        .pipe(
          debounceTime(800),
          takeUntil(this.destroy$)
        )
        .subscribe(value => {
          if (value && value.includes('@')) {
            this.validatingEmail = true;
            this.validationService.getEmailSuggestions(value)
              .subscribe(suggestions => {
                this.emailSuggestions = suggestions;
                this.validatingEmail = false;
              });
          } else {
            this.emailSuggestions = [];
          }
        });
    }

    const phoneControl = this.form.get('phone');
    if (phoneControl) {
      phoneControl.valueChanges
        .pipe(
          debounceTime(800),
          takeUntil(this.destroy$)
        )
        .subscribe(value => {
          if (value) {
            this.validatingPhone = true;
            this.validationService.getPhoneSuggestions(value)
              .subscribe(suggestions => {
                this.phoneSuggestions = suggestions;
                this.validatingPhone = false;
              });
          } else {
            this.phoneSuggestions = [];
          }
        });
    }
  }

  setupAutoSave(): void {
    if (this.autoSaveEnabled) {
      this.draftService.setupAutoSave(
        'enhanced-form-example',
        this.form.valueChanges,
        undefined,
        2000
      );

      const autoSaveObservable = this.draftService.getAutoSaveObservable('enhanced-form-example');
      if (autoSaveObservable) {
        autoSaveObservable
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.lastSavedAt = new Date();
          });
      }
    }
  }

  onAcceptEmailSuggestion(suggestion: ValidationSuggestion): void {
    this.form.patchValue({ email: suggestion.suggestedValue });
    this.emailSuggestions = [];
  }

  onDismissEmailSuggestion(): void {
    this.emailSuggestions = [];
  }

  onAcceptPhoneSuggestion(suggestion: ValidationSuggestion): void {
    this.form.patchValue({ phone: suggestion.suggestedValue });
    this.phoneSuggestions = [];
  }

  onDismissPhoneSuggestion(): void {
    this.phoneSuggestions = [];
  }

  nextStep(): void {
    if (this.currentStep < this.formSteps.length - 1) {
      this.formSteps[this.currentStep].completed = this.isStepValid(this.currentStep);
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 0:
        return this.form.get('firstName')?.valid && this.form.get('lastName')?.valid || false;
      case 1:
        return this.form.get('email')?.valid && this.form.get('phone')?.valid || false;
      case 2:
        return this.form.get('acceptTerms')?.valid || false;
      default:
        return false;
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
      this.draftService.deleteDraft('enhanced-form-example');
      this.initialFormValue = this.form.value;
    } else {
      this.markFormGroupTouched(this.form);
    }
  }

  onReset(): void {
    this.form.reset();
    this.currentStep = 0;
    this.formSteps.forEach(step => step.completed = false);
    this.draftService.deleteDraft('enhanced-form-example');
  }

  canDeactivate(): boolean {
    return !this.hasUnsavedChanges();
  }

  hasUnsavedChanges(): boolean {
    return JSON.stringify(this.form.value) !== JSON.stringify(this.initialFormValue);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    
    if (control && control.touched && control.invalid) {
      if (control.errors?.['required']) {
        return 'Ce champ est requis';
      }
      if (control.errors?.['email']) {
        return 'Email invalide';
      }
      if (control.errors?.['maxlength']) {
        const maxLength = control.errors['maxlength'].requiredLength;
        return `Maximum ${maxLength} caractères`;
      }
    }
    
    return null;
  }
}
