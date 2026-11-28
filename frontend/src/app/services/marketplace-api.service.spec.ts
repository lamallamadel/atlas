import { formatDelay } from './marketplace-api.service';

describe('formatDelay', () => {
  it('reads hours under two days, days beyond', () => {
    expect(formatDelay(null)).toBe('—');
    expect(formatDelay(5)).toBe('5 h');
    expect(formatDelay(30.25)).toBe('30,3 h');
    expect(formatDelay(60)).toBe('2,5 j');
  });
});
