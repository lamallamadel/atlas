import { sellerNet } from './mandate-api.service';

describe('sellerNet', () => {
  const base = { estimateMin: null, estimateMax: null };

  it('subtracts the seller share of a percent commission from the asked price', () => {
    expect(sellerNet('SALE', 1_500_000, { ...base, commissionKind: 'PERCENT', commissionValue: 2.5, commissionPayer: 'SELLER' }))
      .toEqual({ basis: 1_500_000, basisSource: 'ASKED', sellerFee: 37_500, net: 1_462_500 });
    expect(sellerNet('SALE', 1_500_000, { ...base, commissionKind: 'PERCENT', commissionValue: 5, commissionPayer: 'SHARED' })?.net)
      .toBe(1_462_500);
    expect(sellerNet('SALE', 1_500_000, { ...base, commissionKind: 'PERCENT', commissionValue: 2.5, commissionPayer: 'BUYER' })?.sellerFee)
      .toBe(0);
  });

  it('handles a flat fee and falls back on the agency estimate', () => {
    expect(sellerNet('SALE', null, { commissionKind: 'FLAT', commissionValue: 20_000, commissionPayer: 'SELLER', estimateMin: 1_400_000, estimateMax: 1_600_000 }))
      .toEqual({ basis: 1_500_000, basisSource: 'ESTIMATE', sellerFee: 20_000, net: 1_480_000 });
  });

  it('gives nothing for a rental or without a price', () => {
    expect(sellerNet('RENT', 8_000, { ...base, commissionKind: 'FLAT', commissionValue: 8_000, commissionPayer: 'SELLER' })).toBeNull();
    expect(sellerNet('SALE', null, { ...base, commissionKind: 'PERCENT', commissionValue: 2, commissionPayer: 'SELLER' })).toBeNull();
  });
});
