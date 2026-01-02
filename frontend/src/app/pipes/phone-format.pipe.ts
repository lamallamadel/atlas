import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneFormat'
})
export class PhoneFormatPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Format French phone numbers (10 digits)
    if (digits.length === 10) {
      return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }

    // Format international French phone numbers starting with +33 (11 digits with country code)
    if (digits.length === 11 && digits.startsWith('33')) {
      return '+33 ' + digits.substring(2).replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }

    // For other formats, just return the original value
    return value;
  }
}
