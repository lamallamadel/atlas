import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export interface ValidationSuggestion {
  field: string;
  originalValue: string;
  suggestedValue: string;
  reason: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface AsyncValidationResult {
  valid: boolean;
  errors?: ValidationErrors;
  suggestions?: ValidationSuggestion[];
}

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {
  private readonly API_BASE = '/api/v1';
  private readonly DEFAULT_DEBOUNCE_TIME = 500;

  constructor(private http: HttpClient) {}

  /**
   * Validates email with backend async validation
   */
  validateEmailAsync(debounce = this.DEFAULT_DEBOUNCE_TIME): (control: AbstractControl) => Observable<ValidationErrors | null> {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(debounce).pipe(
        switchMap(() => this.http.post<AsyncValidationResult>(
          `${this.API_BASE}/validation/email`,
          { email: control.value }
        )),
        map(result => result.valid ? null : (result.errors || { invalidEmail: true })),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Validates phone number with backend async validation
   */
  validatePhoneAsync(debounce = this.DEFAULT_DEBOUNCE_TIME): (control: AbstractControl) => Observable<ValidationErrors | null> {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return timer(debounce).pipe(
        switchMap(() => this.http.post<AsyncValidationResult>(
          `${this.API_BASE}/validation/phone`,
          { phone: control.value }
        )),
        map(result => result.valid ? null : (result.errors || { invalidPhone: true })),
        catchError(() => of(null))
      );
    };
  }

  /**
   * Get email suggestions for typo correction
   */
  getEmailSuggestions(email: string): Observable<ValidationSuggestion[]> {
    if (!email || !email.includes('@')) {
      return of([]);
    }

    const suggestions: ValidationSuggestion[] = [];
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'orange.fr', 'free.fr', 'laposte.net', 'wanadoo.fr'];
    const emailParts = email.split('@');
    const domain = emailParts[1]?.toLowerCase();

    if (!domain) {
      return of([]);
    }

    // Check for common typos
    const typoMap: { [key: string]: string } = {
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'yahooo.com': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'hotmial.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'outlok.com': 'outlook.com',
      'outloo.com': 'outlook.com'
    };

    if (typoMap[domain]) {
      suggestions.push({
        field: 'email',
        originalValue: email,
        suggestedValue: `${emailParts[0]}@${typoMap[domain]}`,
        reason: 'Correction de faute de frappe détectée',
        confidence: 'high'
      });
    } else {
      // Suggest similar domains using Levenshtein distance
      for (const commonDomain of commonDomains) {
        const distance = this.levenshteinDistance(domain, commonDomain);
        if (distance === 1 || distance === 2) {
          suggestions.push({
            field: 'email',
            originalValue: email,
            suggestedValue: `${emailParts[0]}@${commonDomain}`,
            reason: 'Vouliez-vous dire ce domaine ?',
            confidence: distance === 1 ? 'high' : 'medium'
          });
        }
      }
    }

    return of(suggestions);
  }

  /**
   * Format phone number (French format)
   */
  formatPhoneNumber(phone: string): string {
    if (!phone) return '';

    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Handle international format
    if (cleaned.startsWith('+33')) {
      cleaned = cleaned.substring(3);
      const formatted = cleaned.match(/.{1,2}/g)?.join(' ') || cleaned;
      return `+33 ${formatted}`;
    }

    // Handle French mobile format starting with 0
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return cleaned.match(/.{1,2}/g)?.join(' ') || cleaned;
    }

    return phone;
  }

  /**
   * Get phone formatting suggestion
   */
  getPhoneSuggestions(phone: string): Observable<ValidationSuggestion[]> {
    if (!phone) {
      return of([]);
    }

    const formatted = this.formatPhoneNumber(phone);
    if (formatted !== phone && formatted !== '') {
      return of([{
        field: 'phone',
        originalValue: phone,
        suggestedValue: formatted,
        reason: 'Format de téléphone suggéré',
        confidence: 'high'
      }]);
    }

    return of([]);
  }

  /**
   * Validate field with debounce
   */
  validateFieldWithDebounce<T>(
    valueChanges: Observable<T>,
    validationFn: (value: T) => Observable<AsyncValidationResult>,
    debounce = this.DEFAULT_DEBOUNCE_TIME
  ): Observable<AsyncValidationResult> {
    return valueChanges.pipe(
      debounceTime(debounce),
      distinctUntilChanged(),
      switchMap(value => validationFn(value)),
      catchError(() => of({ valid: true }))
    );
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Check for duplicate entries (generic)
   */
  checkDuplicates(endpoint: string, field: string, value: string): Observable<any[]> {
    return this.http.post<any[]>(
      `${this.API_BASE}${endpoint}/check-duplicates`,
      { [field]: value }
    ).pipe(
      catchError(() => of([]))
    );
  }
}
