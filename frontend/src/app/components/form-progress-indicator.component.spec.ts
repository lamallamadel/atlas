import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormProgressIndicatorComponent, FormStep } from './form-progress-indicator.component';

describe('FormProgressIndicatorComponent', () => {
  let component: FormProgressIndicatorComponent;
  let fixture: ComponentFixture<FormProgressIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [MatProgressBarModule, FormProgressIndicatorComponent]
}).compileComponents();

    fixture = TestBed.createComponent(FormProgressIndicatorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate progress percentage correctly', () => {
    fixture.componentRef.setInput('steps', [
      { label: 'Step 1', completed: true },
      { label: 'Step 2', completed: true },
      { label: 'Step 3', completed: false },
      { label: 'Step 4', completed: false }
    ]);
    component.calculateProgress();
    expect(component.progressPercentage).toBe(50);
  });

  it('should identify active step', () => {
    fixture.componentRef.setInput('currentStep', 2);
    expect(component.isStepActive(2)).toBe(true);
    expect(component.isStepActive(1)).toBe(false);
  });

  it('should identify completed step', () => {
    fixture.componentRef.setInput('steps', [
      { label: 'Step 1', completed: true },
      { label: 'Step 2', completed: false }
    ]);
    expect(component.isStepCompleted(0)).toBe(true);
    expect(component.isStepCompleted(1)).toBe(false);
  });

  it('should return correct icon for step', () => {
    fixture.componentRef.setInput('steps', [
      { label: 'Step 1', completed: true },
      { label: 'Step 2', completed: false, icon: 'custom_icon' },
      { label: 'Step 3', completed: false }
    ]);

    expect(component.getStepIcon(0)).toBe('check');
    expect(component.getStepIcon(1)).toBe('custom_icon');
    expect(component.getStepIcon(2)).toBe('plus');
  });
});
