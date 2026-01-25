import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { FormProgressIndicatorComponent, FormStep } from './form-progress-indicator.component';

describe('FormProgressIndicatorComponent', () => {
  let component: FormProgressIndicatorComponent;
  let fixture: ComponentFixture<FormProgressIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormProgressIndicatorComponent],
      imports: [MatProgressBarModule, MatIconModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FormProgressIndicatorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate progress percentage correctly', () => {
    component.steps = [
      { label: 'Step 1', completed: true },
      { label: 'Step 2', completed: true },
      { label: 'Step 3', completed: false },
      { label: 'Step 4', completed: false }
    ];
    component.calculateProgress();
    expect(component.progressPercentage).toBe(50);
  });

  it('should identify active step', () => {
    component.currentStep = 2;
    expect(component.isStepActive(2)).toBe(true);
    expect(component.isStepActive(1)).toBe(false);
  });

  it('should identify completed step', () => {
    component.steps = [
      { label: 'Step 1', completed: true },
      { label: 'Step 2', completed: false }
    ];
    expect(component.isStepCompleted(0)).toBe(true);
    expect(component.isStepCompleted(1)).toBe(false);
  });

  it('should return correct step class', () => {
    component.steps = [
      { label: 'Step 1', completed: true },
      { label: 'Step 2', completed: false },
      { label: 'Step 3', completed: false }
    ];
    component.currentStep = 1;

    expect(component.getStepClass(0)).toBe('step-completed');
    expect(component.getStepClass(1)).toBe('step-active');
    expect(component.getStepClass(2)).toBe('step-pending');
  });

  it('should return correct icon for step', () => {
    component.steps = [
      { label: 'Step 1', completed: true },
      { label: 'Step 2', completed: false, icon: 'custom_icon' },
      { label: 'Step 3', completed: false }
    ];

    expect(component.getStepIcon(0)).toBe('check_circle');
    expect(component.getStepIcon(1)).toBe('custom_icon');
    expect(component.getStepIcon(2)).toBe('radio_button_unchecked');
  });
});
