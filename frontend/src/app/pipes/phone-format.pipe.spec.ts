import { PhoneFormatPipe } from './phone-format.pipe';

describe('PhoneFormatPipe', () => {
  let pipe: PhoneFormatPipe;

  beforeEach(() => {
    pipe = new PhoneFormatPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format a 10-digit French phone number', () => {
    const phone = '0612345678';
    const result = pipe.transform(phone);
    expect(result).toBe('06 12 34 56 78');
  });

  it('should format a French phone number with spaces', () => {
    const phone = '06 12 34 56 78';
    const result = pipe.transform(phone);
    expect(result).toBe('06 12 34 56 78');
  });

  it('should format an international French phone number', () => {
    const phone = '33612345678';
    const result = pipe.transform(phone);
    expect(result).toBe('+33 6 12 34 56 78');
  });

  it('should handle phone numbers with +33 prefix', () => {
    const phone = '+33612345678';
    const result = pipe.transform(phone);
    expect(result).toBe('+33 6 12 34 56 78');
  });

  it('should return empty string for null', () => {
    const result = pipe.transform(null);
    expect(result).toBe('');
  });

  it('should return empty string for undefined', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
  });

  it('should return original value for non-standard format', () => {
    const phone = '123';
    const result = pipe.transform(phone);
    expect(result).toBe('123');
  });
});
