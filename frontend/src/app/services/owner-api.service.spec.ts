import { PriceReference, ownerPropertyState, pricePosition } from './owner-api.service';

describe('ownerPropertyState', () => {
  it('shows the agency listing when an active mandate has published it', () => {
    const s = ownerPropertyState(null, { status: 'MANDATE_ACTIVE', agencyName: 'Agence du Détroit', annonceId: 7 });
    expect(s.label).toBe('En ligne');
    expect(s.status).toBe('active');
    expect(s.detail).toBe('Annonce publiée par Agence du Détroit');
  });

  it('says the property is under mandate while the agency prepares its listing', () => {
    const s = ownerPropertyState(null, { status: 'MANDATE_ACTIVE', agencyName: 'Maârif Immo', annonceId: null });
    expect(s.label).toBe('Sous mandat');
    expect(s.detail).toContain('Maârif Immo');
  });

  it('flags a mandate waiting for signature', () => {
    expect(ownerPropertyState(null, { status: 'MANDATE_PENDING_SIGNATURE', agencyName: 'Iberia', annonceId: null }).label)
      .toBe('Mandat à signer');
  });

  it('falls back on the owner listing without a running mandate', () => {
    expect(ownerPropertyState(null, null)).toEqual({ label: "Pas d'annonce", status: 'draft', detail: null });
  });
});

describe('pricePosition', () => {
  const ref = { available: true, low: 1_300_000, mid: 1_420_000, high: 1_550_000 } as PriceReference;

  it('places the asking price against the range, with a 5 % tolerance', () => {
    expect(pricePosition(1_200_000, ref)).toBe('below');
    expect(pricePosition(1_250_000, ref)).toBe('within');
    expect(pricePosition(1_450_000, ref)).toBe('within');
    expect(pricePosition(1_700_000, ref)).toBe('above');
  });

  it('says nothing without a price or a usable range', () => {
    expect(pricePosition(null, ref)).toBeNull();
    expect(pricePosition(1_400_000, { available: false } as PriceReference)).toBeNull();
    expect(pricePosition(1_400_000, null)).toBeNull();
  });
});
