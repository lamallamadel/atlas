import { annonceStatusLabel, formatAnnoncePrice } from './annonce-format';

describe('annonce-format', () => {
  it('prix en dirhams par défaut, devise de l’annonce sinon', () => {
    expect(formatAnnoncePrice({ price: 1450000 })).toBe(`${new Intl.NumberFormat('fr-FR').format(1450000)} MAD`);
    expect(formatAnnoncePrice({ price: 3500, currency: 'eur' })).toBe(`${new Intl.NumberFormat('fr-FR').format(3500)} €`);
    expect(formatAnnoncePrice({ price: null })).toBe('');
  });

  it('statuts en français', () => {
    expect(annonceStatusLabel('PUBLISHED')).toBe('Publiée');
    expect(annonceStatusLabel('DRAFT')).toBe('Brouillon');
    expect(annonceStatusLabel('INCONNU')).toBe('INCONNU');
  });
});
