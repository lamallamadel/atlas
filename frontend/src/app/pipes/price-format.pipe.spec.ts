import { PriceFormatPipe } from './price-format.pipe';

describe('PriceFormatPipe', () => {
  let pipe: PriceFormatPipe;

  beforeEach(() => {
    pipe = new PriceFormatPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should format a price in EUR', () => {
    const price = 1234.56;
    const result = pipe.transform(price);
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('56');
  });

  it('should format a price with default currency', () => {
    const price = 100;
    const result = pipe.transform(price);
    expect(result).toBeTruthy();
    expect(result).not.toBe('');
  });

  it('should format a price in USD', () => {
    const price = 1000;
    const result = pipe.transform(price, 'USD');
    expect(result).toBeTruthy();
  });

  it('should return empty string for null', () => {
    const result = pipe.transform(null);
    expect(result).toBe('');
  });

  it('should return empty string for undefined', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
  });

  it('should handle zero value', () => {
    const result = pipe.transform(0);
    expect(result).toBeTruthy();
    expect(result).not.toBe('');
  });
});
