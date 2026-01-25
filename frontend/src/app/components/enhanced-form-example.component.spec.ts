import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EnhancedFormExampleComponent } from './enhanced-form-example.component';
import { FormProgressIndicatorComponent } from './form-progress-indicator.component';
import { InlineValidationSuggestionComponent } from './inline-validation-suggestion.component';
import { ContextualHintDirective } from '../directives/contextual-hint.directive';
import { FormValidationService } from '../services/form-validation.service';
import { FormDraftService } from '../services/form-draft.service';

describe('EnhancedFormExampleComponent', () => {
  let component: EnhancedFormExampleComponent;
  let fixture: ComponentFixture<EnhancedFormExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        EnhancedFormExampleComponent,
        FormProgressIndicatorComponent,
        InlineValidationSuggestionComponent,
        ContextualHintDirective
      ],
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
        HttpClientTestingModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule
      ],
      providers: [
        FormValidationService,
        FormDraftService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnhancedFormExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with required fields', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('firstName')).toBeDefined();
    expect(component.form.get('lastName')).toBeDefined();
    expect(component.form.get('email')).toBeDefined();
    expect(component.form.get('phone')).toBeDefined();
  });

  it('should validate required fields', () => {
    const firstNameControl = component.form.get('firstName');
    firstNameControl?.markAsTouched();
    expect(firstNameControl?.invalid).toBe(true);
    
    firstNameControl?.setValue('John');
    expect(firstNameControl?.valid).toBe(true);
  });

  it('should navigate to next step', () => {
    expect(component.currentStep).toBe(0);
    component.nextStep();
    expect(component.currentStep).toBe(1);
  });

  it('should navigate to previous step', () => {
    component.currentStep = 1;
    component.previousStep();
    expect(component.currentStep).toBe(0);
  });

  it('should detect unsaved changes', () => {
    expect(component.hasUnsavedChanges()).toBe(false);
    
    component.form.patchValue({ firstName: 'John' });
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('should accept email suggestion', () => {
    const suggestion = {
      field: 'email',
      originalValue: 'test@gmial.com',
      suggestedValue: 'test@gmail.com',
      reason: 'Typo detected',
      confidence: 'high' as const
    };

    component.onAcceptEmailSuggestion(suggestion);
    expect(component.form.get('email')?.value).toBe('test@gmail.com');
    expect(component.emailSuggestions.length).toBe(0);
  });

  it('should dismiss email suggestion', () => {
    component.emailSuggestions = [{
      field: 'email',
      originalValue: 'test@gmial.com',
      suggestedValue: 'test@gmail.com',
      reason: 'Typo detected',
      confidence: 'high'
    }];

    component.onDismissEmailSuggestion();
    expect(component.emailSuggestions.length).toBe(0);
  });
});
