import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormControl } from '@angular/forms';
import { FormValidationService, ValidationSuggestion } from './form-validation.service';

describe('FormValidationService', () => {
  let service: FormValidationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FormValidationService]
    });
    service = TestBed.inject(FormValidationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getEmailSuggestions', () => {
    it('should return empty array for invalid email', (done) => {
      service.getEmailSuggestions('notanemail').subscribe(suggestions => {
        expect(suggestions.length).toBe(0);
        done();
      });
    });

    it('should suggest correction for typo in gmail', (done) => {
      service.getEmailSuggestions('user@gmial.com').subscribe(suggestions => {
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].suggestedValue).toBe('user@gmail.com');
        expect(suggestions[0].confidence).toBe('high');
        done();
      });
    });

    it('should suggest similar domain', (done) => {
      service.getEmailSuggestions('user@gmailcom').subscribe(suggestions => {
        expect(suggestions.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format French mobile number', () => {
      const formatted = service.formatPhoneNumber('0612345678');
      expect(formatted).toBe('06 12 34 56 78');
    });

    it('should format international number', () => {
      const formatted = service.formatPhoneNumber('+33612345678');
      expect(formatted).toContain('+33');
    });

    it('should return empty for empty input', () => {
      const formatted = service.formatPhoneNumber('');
      expect(formatted).toBe('');
    });
  });

  describe('getPhoneSuggestions', () => {
    it('should suggest formatted phone number', (done) => {
      service.getPhoneSuggestions('0612345678').subscribe(suggestions => {
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].suggestedValue).toBe('06 12 34 56 78');
        done();
      });
    });

    it('should return empty for already formatted number', (done) => {
      service.getPhoneSuggestions('06 12 34 56 78').subscribe(suggestions => {
        expect(suggestions.length).toBe(0);
        done();
      });
    });
  });

  describe('validateEmailAsync', () => {
    it('should return null for empty value', (done) => {
      const control = new FormControl('');
      const validator = service.validateEmailAsync(0);

      validator(control).subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should validate email with backend', fakeAsync(() => {
      const control = new FormControl('test@example.com');
      const validator = service.validateEmailAsync(0);
      let result: any;

      validator(control).subscribe(r => {
        result = r;
      });

      tick(0);

      const req = httpMock.expectOne('/api/v1/validation/email');
      expect(req.request.method).toBe('POST');
      req.flush({ valid: true });

      expect(result).toBeNull();
    }));

    it('should return errors for invalid email', fakeAsync(() => {
      const control = new FormControl('invalid@email');
      const validator = service.validateEmailAsync(0);
      let result: any;

      validator(control).subscribe(r => {
        result = r;
      });

      tick(0);

      const req = httpMock.expectOne('/api/v1/validation/email');
      req.flush({ valid: false, errors: { invalidEmail: true } });

      expect(result).toBeTruthy();
    }));
  });

  describe('validatePhoneAsync', () => {
    it('should return null for empty value', (done) => {
      const control = new FormControl('');
      const validator = service.validatePhoneAsync(0);

      validator(control).subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should validate phone with backend', fakeAsync(() => {
      const control = new FormControl('0612345678');
      const validator = service.validatePhoneAsync(0);
      let result: any;

      validator(control).subscribe(r => {
        result = r;
      });

      tick(0);

      const req = httpMock.expectOne('/api/v1/validation/phone');
      expect(req.request.method).toBe('POST');
      req.flush({ valid: true });

      expect(result).toBeNull();
    }));
  });
});
