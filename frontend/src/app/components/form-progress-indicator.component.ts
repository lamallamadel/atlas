import { Component, Input, OnInit } from '@angular/core';

export interface FormStep {
  label: string;
  completed: boolean;
  optional?: boolean;
  icon?: string;
  error?: boolean;
}

@Component({
  selector: 'app-form-progress-indicator',
  templateUrl: './form-progress-indicator.component.html',
  styleUrls: ['./form-progress-indicator.component.css']
})
export class FormProgressIndicatorComponent implements OnInit {
  @Input() steps: FormStep[] = [];
  @Input() currentStep = 0;
  @Input() showPercentage = true;

  progressPercentage = 0;

  ngOnInit(): void {
    this.calculateProgress();
  }

  ngOnChanges(): void {
    this.calculateProgress();
  }

  calculateProgress(): void {
    if (this.steps.length === 0) {
      this.progressPercentage = 0;
      return;
    }

    const completedSteps = this.steps.filter(step => step.completed).length;
    this.progressPercentage = Math.round((completedSteps / this.steps.length) * 100);
  }

  isStepActive(index: number): boolean {
    return index === this.currentStep;
  }

  isStepCompleted(index: number): boolean {
    return this.steps[index]?.completed || false;
  }

  getStepIcon(index: number): string {
    const step = this.steps[index];
    if (step?.icon) {
      return step.icon;
    }
    return this.isStepCompleted(index) ? 'check_circle' : 'radio_button_unchecked';
  }

  getStepClass(index: number): string {
    if (this.isStepActive(index)) {
      return 'step-active';
    }
    if (this.isStepCompleted(index)) {
      return 'step-completed';
    }
    return 'step-pending';
  }

  getLineProgress(): number {
    if (this.steps.length <= 1) {
      return 0;
    }
    
    // Calculate progress based on current step and completion
    const totalSteps = this.steps.length - 1;
    const completedSteps = this.steps.filter((step, index) => step.completed && index < this.currentStep).length;
    const baseProgress = (completedSteps / totalSteps) * 100;
    const currentStepProgress = (this.currentStep / totalSteps) * 100;
    
    return Math.max(baseProgress, currentStepProgress);
  }
}
