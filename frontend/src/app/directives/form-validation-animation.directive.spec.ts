import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormValidationAnimationDirective } from './form-validation-animation.directive';

@Component({
  template: `
    <form [formGroup]="testForm">
      <div class="form-field">
        <input formControlName="email" appFormValidationAnimation>
      </div>
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

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    inputEl = fixture.debugElement.query(By.css('input'));
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should add validation-error class when field is invalid and touched', fakeAsync(async () => {
    const emailControl = component.testForm.get('email')!;
    
    emailControl.markAsTouched();
    emailControl.setValue('');
    fixture.detectChanges();
    await fixture.whenStable();
    tick();
    fixture.detectChanges();

    expect(inputEl.nativeElement.classList.contains('validation-error')).toBeTruthy();
    expect(emailControl.invalid).toBeTruthy();
    expect(emailControl.touched).toBeTruthy();
    
    flush();
  }));

  it('should not add validation-error class when field is untouched', fakeAsync(async () => {
    const emailControl = component.testForm.get('email')!;
    
    emailControl.setValue('');
    fixture.detectChanges();
    await fixture.whenStable();
    tick();
    fixture.detectChanges();

    expect(inputEl.nativeElement.classList.contains('validation-error')).toBeFalsy();
    expect(emailControl.invalid).toBeTruthy();
    expect(emailControl.touched).toBeFalsy();
    
    flush();
  }));

  it('should remove validation-error class when field becomes valid', fakeAsync(async () => {
    const emailControl = component.testForm.get('email')!;
    
    emailControl.markAsTouched();
    emailControl.setValue('');
    fixture.detectChanges();
    await fixture.whenStable();
    tick();
    fixture.detectChanges();

    expect(inputEl.nativeElement.classList.contains('validation-error')).toBeTruthy();

    emailControl.setValue('test@example.com');
    fixture.detectChanges();
    await fixture.whenStable();
    tick();
    fixture.detectChanges();

    expect(inputEl.nativeElement.classList.contains('validation-error')).toBeFalsy();
    expect(emailControl.valid).toBeTruthy();
    
    flush();
  }));

  it('should add validation-error class when field is invalid and dirty', fakeAsync(async () => {
    const emailControl = component.testForm.get('email')!;
    
    emailControl.markAsDirty();
    emailControl.setValue('invalid-email');
    fixture.detectChanges();
    await fixture.whenStable();
    tick();
    fixture.detectChanges();

    expect(inputEl.nativeElement.classList.contains('validation-error')).toBeTruthy();
    expect(emailControl.invalid).toBeTruthy();
    expect(emailControl.dirty).toBeTruthy();
    
    flush();
  }));

  it('should create error container within form field wrapper', fakeAsync(async () => {
    const emailControl = component.testForm.get('email')!;
    
    emailControl.markAsTouched();
    emailControl.setValue('');
    fixture.detectChanges();
    await fixture.whenStable();
    tick();
    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.css('.form-field'));
    const errorContainer = formField.nativeElement.querySelector('.validation-error-container');
    
    expect(errorContainer).toBeTruthy();
    expect(errorContainer).not.toBeNull();
    
    flush();
  }));

  it('should display error message when validation fails', fakeAsync(async () => {
    const emailControl = component.testForm.get('email')!;
    
    emailControl.markAsTouched();
    emailControl.setValue('');
    fixture.detectChanges();
    await fixture.whenStable();
    tick();
    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.css('.form-field'));
    const errorContainer = formField.nativeElement.querySelector('.validation-error-container');
    const errorMessage = errorContainer?.querySelector('.error-message');
    
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).not.toBeNull();
    expect(errorMessage?.textContent).toContain('Ce champ est requis');
    
    flush();
  }));

  it('should clear error message when field becomes valid', fakeAsync(async () => {
    const emailControl = component.testForm.get('email')!;
    
    emailControl.markAsTouched();
    emailControl.setValue('');
    fixture.detectChanges();
    await fixture.whenStable();
    tick();
    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.css('.form-field'));
    let errorContainer = formField.nativeElement.querySelector('.validation-error-container');
    const initialErrorMessage = errorContainer?.querySelector('.error-message');
    
    expect(initialErrorMessage).toBeTruthy();
    expect(initialErrorMessage?.textContent).toContain('Ce champ est requis');

    emailControl.setValue('test@example.com');
    fixture.detectChanges();
    await fixture.whenStable();
    tick(300);
    fixture.detectChanges();

    errorContainer = formField.nativeElement.querySelector('.validation-error-container');
    const clearedErrorMessage = errorContainer?.querySelector('.error-message');
    
    expect(errorContainer?.innerHTML).toBe('');
    expect(clearedErrorMessage).toBeNull();
    
    flush();
  }));

  it('should display email validation error message', fakeAsync(async () => {
    const emailControl = component.testForm.get('email')!;
    
    emailControl.markAsTouched();
    emailControl.setValue('invalid-email');
    fixture.detectChanges();
    await fixture.whenStable();
    tick();
    fixture.detectChanges();

    const formField = fixture.debugElement.query(By.css('.form-field'));
    const errorContainer = formField.nativeElement.querySelector('.validation-error-container');
    const errorMessage = errorContainer?.querySelector('.error-message');
    
    expect(errorMessage).toBeTruthy();
    expect(errorMessage).not.toBeNull();
    expect(errorMessage?.textContent).toContain('Email invalide');
    
    flush();
  }));
});
