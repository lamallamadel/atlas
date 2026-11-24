import { Component, OnInit, input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  DsIconComponent, 
  DsProgressBarComponent 
} from '../design-system';

export interface FormStep {
  label: string;
  completed: boolean;
  optional?: boolean;
  icon?: string;
  error?: boolean;
}

@Component({
    selector: 'app-form-progress-indicator',
    standalone: true,
    templateUrl: './form-progress-indicator.component.html',
    styleUrls: ['./form-progress-indicator.component.css'],
    imports: [CommonModule, DsIconComponent, DsProgressBarComponent]
})
export class FormProgressIndicatorComponent implements OnInit, OnChanges {
  readonly steps = input<FormStep[]>([]);
  readonly currentStep = input(0);
  readonly showPercentage = input(true);

  progressPercentage = 0;

  ngOnInit(): void {
    this.calculateProgress();
  }

  ngOnChanges(): void {
    this.calculateProgress();
  }

  calculateProgress(): void {
    const steps = this.steps();
    if (steps.length === 0) {
      this.progressPercentage = 0;
      return;
    }

    const completedSteps = steps.filter(step => step.completed).length;
    this.progressPercentage = Math.round((completedSteps / steps.length) * 100);
  }

  isStepActive(index: number): boolean {
    return index === this.currentStep();
  }

  isStepCompleted(index: number): boolean {
    return this.steps()[index]?.completed || false;
  }

  getStepIcon(index: number): string {
    const step = this.steps()[index];
    if (step?.icon) return step.icon;
    if (step?.error) return 'info';
    return this.isStepCompleted(index) ? 'check' : 'plus';
  }

  getLineProgress(): number {
    if (this.steps().length <= 1) return 0;
    const totalSteps = this.steps().length - 1;
    const completedSteps = this.steps().filter((step, index) => step.completed && index < this.currentStep()).length;
    return Math.max((completedSteps / totalSteps) * 100, (this.currentStep() / totalSteps) * 100);
  }
}
