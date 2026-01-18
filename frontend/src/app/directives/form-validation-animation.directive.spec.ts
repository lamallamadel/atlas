import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormValidationAnimationDirective } from './form-validation-animation.directive';

@Component({
  template: `
    <form [formGroup]="testForm">
      <input formControlName="email" appFormValidationAnimation>
    </form>
  `
})
class TestComponent {
  testForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });
}

describe('FormValidationAnimationDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let inputEl: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        FormValidationAnimationDirective,
        TestComponent
      ],
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    inputEl = fixture.debugElement.query(By.css('input'));
    fixture.detectChanges();
  });

  it('should add validation-error class when field is invalid and touched', async () => {
    const emailControl = component.testForm.get('email')!;
    emailControl.markAsTouched();
    emailControl.setValue('');
    fixture.detectChanges();

    await fixture.whenStable();

    expect(inputEl.nativeElement.classList.contains('validation-error')).toBeTruthy();
  });

  it('should not add validation-error class when field is untouched', async () => {
    const emailControl = component.testForm.get('email')!;
    emailControl.setValue('');
    fixture.detectChanges();

    await fixture.whenStable();

    expect(inputEl.nativeElement.classList.contains('validation-error')).toBeFalsy();
  });

  it('should remove validation-error class when field becomes valid', async () => {
    const emailControl = component.testForm.get('email')!;
    emailControl.markAsTouched();
    emailControl.setValue('');
    fixture.detectChanges();

    await fixture.whenStable();

    emailControl.setValue('test@example.com');
    fixture.detectChanges();

    await fixture.whenStable();

    expect(inputEl.nativeElement.classList.contains('validation-error')).toBeFalsy();
  });
});
