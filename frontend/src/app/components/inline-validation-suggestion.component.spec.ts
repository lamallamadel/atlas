import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InlineValidationSuggestionComponent } from './inline-validation-suggestion.component';
import { ValidationSuggestion } from '../services/form-validation.service';

describe('InlineValidationSuggestionComponent', () => {
  let component: InlineValidationSuggestionComponent;
  let fixture: ComponentFixture<InlineValidationSuggestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InlineValidationSuggestionComponent],
      imports: [MatIconModule, MatButtonModule, BrowserAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(InlineValidationSuggestionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit accept event when accept button clicked', () => {
    const suggestion: ValidationSuggestion = {
      field: 'email',
      originalValue: 'test@gmial.com',
      suggestedValue: 'test@gmail.com',
      reason: 'Typo detected',
      confidence: 'high'
    };

    component.suggestion = suggestion;
    
    spyOn(component.accept, 'emit');
    component.onAccept();
    
    expect(component.accept.emit).toHaveBeenCalledWith(suggestion);
  });

  it('should emit dismiss event when dismiss button clicked', () => {
    spyOn(component.dismiss, 'emit');
    component.onDismiss();
    expect(component.dismiss.emit).toHaveBeenCalled();
  });

  it('should return correct confidence icon', () => {
    component.suggestion = {
      field: 'test',
      originalValue: 'old',
      suggestedValue: 'new',
      reason: 'test',
      confidence: 'high'
    };
    expect(component.getConfidenceIcon()).toBe('verified');

    component.suggestion.confidence = 'medium';
    expect(component.getConfidenceIcon()).toBe('help_outline');

    component.suggestion.confidence = 'low';
    expect(component.getConfidenceIcon()).toBe('info');
  });
});
