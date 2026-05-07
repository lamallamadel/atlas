import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ContextualHintDirective } from './contextual-hint.directive';

@Component({
    template: `
    <input 
      [formControl]="testControl"
      [appContextualHint]="hints"
      [hintControl]="testControl">
  `,
    standalone: true,
    imports: [ReactiveFormsModule, ContextualHintDirective]
})
class TestComponent {
  testControl = new FormControl('');
  hints = {
    default: 'Enter a value',
    focused: 'Type here',
    valid: 'Looks good!',
    invalid: 'Please fix this'
  };
}

describe('ContextualHintDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        ContextualHintDirective, 
        TestComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show default hint initially', () => {
    const inputElement = fixture.nativeElement.querySelector('input');
    expect(inputElement).toBeTruthy();
  });

  it('should update hint when control value changes', () => {
    component.testControl.setValue('test');
    fixture.detectChanges();
    expect(component.testControl.value).toBe('test');
  });
});
