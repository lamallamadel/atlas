import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientSatisfactionSurvey } from '../models/customer-portal.models';
import { CustomerPortalService } from '../services/customer-portal.service';

@Component({
  selector: 'app-client-satisfaction-survey',
  template: `
    <div class="survey-container">
      <h2>Évaluez votre expérience</h2>
      <p class="survey-intro">Votre avis nous aide à améliorer nos services</p>
      
      <form [formGroup]="surveyForm" (ngSubmit)="submitSurvey()" class="survey-form">
        <div class="rating-group">
          <label>Satisfaction générale *</label>
          <div class="star-rating">
            <span *ngFor="let star of [1,2,3,4,5]" 
                  (click)="setRating('overallRating', star)"
                  [class.active]="surveyForm.value.overallRating >= star"
                  class="star">★</span>
          </div>
        </div>

        <div class="rating-group">
          <label>Communication *</label>
          <div class="star-rating">
            <span *ngFor="let star of [1,2,3,4,5]" 
                  (click)="setRating('communicationRating', star)"
                  [class.active]="surveyForm.value.communicationRating >= star"
                  class="star">★</span>
          </div>
        </div>

        <div class="rating-group">
          <label>Réactivité *</label>
          <div class="star-rating">
            <span *ngFor="let star of [1,2,3,4,5]" 
                  (click)="setRating('responsivenessRating', star)"
                  [class.active]="surveyForm.value.responsivenessRating >= star"
                  class="star">★</span>
          </div>
        </div>

        <div class="rating-group">
          <label>Professionnalisme *</label>
          <div class="star-rating">
            <span *ngFor="let star of [1,2,3,4,5]" 
                  (click)="setRating('professionalismRating', star)"
                  [class.active]="surveyForm.value.professionalismRating >= star"
                  class="star">★</span>
          </div>
        </div>

        <div class="form-group">
          <label>Commentaires</label>
          <textarea formControlName="comments" 
                    placeholder="Partagez votre expérience..."
                    rows="4"
                    class="form-control"></textarea>
        </div>

        <button type="submit" 
                [disabled]="!surveyForm.valid || submitting"
                class="submit-button">
          <span *ngIf="!submitting">✉️ Envoyer l'évaluation</span>
          <span *ngIf="submitting">⏳ Envoi...</span>
        </button>
      </form>

      <div *ngIf="submitted" class="success-message">
        ✅ Merci pour votre évaluation !
      </div>
    </div>
  `,
  styles: [`
    .survey-container {
      padding: 24px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 600px;
      margin: 0 auto;
    }

    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #333;
      text-align: center;
    }

    .survey-intro {
      text-align: center;
      color: #666;
      margin-bottom: 32px;
    }

    .rating-group {
      margin-bottom: 24px;
    }

    label {
      display: block;
      margin-bottom: 12px;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .star-rating {
      display: flex;
      gap: 8px;
    }

    .star {
      font-size: 32px;
      color: #ddd;
      cursor: pointer;
      transition: color 0.2s;
      user-select: none;
    }

    .star:hover,
    .star.active {
      color: #ffd700;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    textarea.form-control {
      resize: vertical;
    }

    .submit-button {
      width: 100%;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .submit-button:hover:not(:disabled) {
      background: #5568d3;
    }

    .submit-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .success-message {
      margin-top: 24px;
      padding: 16px;
      background: #d4edda;
      color: #155724;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
    }
  `]
})
export class ClientSatisfactionSurveyComponent implements OnInit {
  @Input() dossierId!: number;
  surveyForm: FormGroup;
  submitting = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private portalService: CustomerPortalService
  ) {
    this.surveyForm = this.fb.group({
      overallRating: [0, [Validators.required, Validators.min(1)]],
      communicationRating: [0, [Validators.required, Validators.min(1)]],
      responsivenessRating: [0, [Validators.required, Validators.min(1)]],
      professionalismRating: [0, [Validators.required, Validators.min(1)]],
      comments: ['']
    });
  }

  ngOnInit(): void {}

  setRating(field: string, value: number): void {
    this.surveyForm.patchValue({ [field]: value });
  }

  submitSurvey(): void {
    if (!this.surveyForm.valid || this.submitting) return;

    const survey: ClientSatisfactionSurvey = {
      orgId: this.portalService.currentOrgId!,
      dossierId: this.dossierId,
      ...this.surveyForm.value
    };

    this.submitting = true;
    this.portalService.submitSurvey(this.dossierId, survey).subscribe({
      next: () => {
        this.submitted = true;
        this.submitting = false;
        setTimeout(() => this.submitted = false, 5000);
      },
      error: (err) => {
        console.error('Error submitting survey:', err);
        this.submitting = false;
      }
    });
  }
}
