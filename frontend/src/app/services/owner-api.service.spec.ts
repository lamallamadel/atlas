import { ownerPropertyState } from './owner-api.service';

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
