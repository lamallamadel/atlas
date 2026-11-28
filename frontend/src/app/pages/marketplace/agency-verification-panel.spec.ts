import { iceError } from './agency-verification-panel.component';

describe('iceError', () => {
  it('accepts 15 digits, spaces included', () => {
    expect(iceError('001234567000089')).toBeNull();
    expect(iceError('001 234 567 000 089')).toBeNull();
  });

  it('explains what is wrong', () => {
    expect(iceError('')).toBe('Indiquez l’ICE de l’agence.');
    expect(iceError('12345')).toBe('L’ICE compte 15 chiffres.');
    expect(iceError('00123456700008A')).toBe('L’ICE compte 15 chiffres.');
  });
});
