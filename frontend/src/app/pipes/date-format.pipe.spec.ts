import { DateFormatPipe } from './date-format.pipe';

describe('DateFormatPipe', () => {
  let pipe: DateFormatPipe;

  beforeEach(() => {
    pipe = new DateFormatPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format a date string', () => {
    const date = '2024-01-15T14:30:00';
    const result = pipe.transform(date);
    expect(result).toContain('15/01/2024');
    expect(result).toContain('14:30');
  });

  it('should format a Date object', () => {
    const date = new Date(2024, 0, 15, 14, 30);
    const result = pipe.transform(date);
    expect(result).toContain('15/01/2024');
    expect(result).toContain('14:30');
  });

  it('should return empty string for null', () => {
    const result = pipe.transform(null);
    expect(result).toBe('');
  });

  it('should return empty string for undefined', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
  });
});
