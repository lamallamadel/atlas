/**
 * Token snapshot — détecte toute dérive de la palette Atlasia DS.
 * Un test rouge ici = régression visuelle potentiellement globale.
 *
 * Lancez avec : npm test -- --include="**/tokens.spec.ts"
 */

describe('Atlasia DS Tokens', () => {
  let root: CSSStyleDeclaration;

  beforeAll(() => {
    // Injecter les tokens via une feuille de style inline
    const style = document.createElement('style');
    style.textContent = `
      :root {
        /* Palette Marine */
        --ds-marine:            #0d2c4a;
        --ds-marine-light:      #1a4472;
        --ds-marine-hover:      #07203a;
        --ds-marine-hl:         #dce8f2;
        /* Palette Copper */
        --ds-primary:           #b5622e;
        --ds-primary-hover:     #944e22;
        --ds-primary-active:    #6e3917;
        --ds-primary-hl:        #f2e0d5;
        --ds-primary-subtle:    #faf3ee;
        /* Surfaces */
        --ds-bg:                #f8f7f4;
        --ds-surface:           #ffffff;
        --ds-surface-2:         #faf9f7;
        --ds-surface-offset:    #f2f0eb;
        --ds-divider:           #e0ddd6;
        --ds-border:            #d4d0c8;
        /* Texte */
        --ds-text:              #18160f;
        --ds-text-muted:        #605c52;
        --ds-text-faint:        #a8a49a;
        /* Sémantiques */
        --ds-success:           #2e7d32;
        --ds-error:             #c62828;
        --ds-warning:           #e65100;
        /* Radius */
        --ds-radius-sm:         6px;
        --ds-radius-md:         10px;
        --ds-radius-lg:         14px;
        --ds-radius-xl:         18px;
        --ds-radius-2xl:        24px;
        --ds-radius-pill:       9999px;
      }
    `;
    document.head.appendChild(style);
    root = getComputedStyle(document.documentElement);
  });

  const getToken = (name: string) =>
    root.getPropertyValue(name).trim().toLowerCase();

  describe('Palette Marine', () => {
    it('--ds-marine doit être #0d2c4a', () => {
      expect(getToken('--ds-marine')).toBe('#0d2c4a');
    });
    it('--ds-marine-light doit être #1a4472', () => {
      expect(getToken('--ds-marine-light')).toBe('#1a4472');
    });
    it('--ds-marine-hl doit être #dce8f2', () => {
      expect(getToken('--ds-marine-hl')).toBe('#dce8f2');
    });
  });

  describe('Palette Copper', () => {
    it('--ds-primary doit être #b5622e', () => {
      expect(getToken('--ds-primary')).toBe('#b5622e');
    });
    it('--ds-primary-hover doit être #944e22', () => {
      expect(getToken('--ds-primary-hover')).toBe('#944e22');
    });
    it('--ds-primary-hl doit être #f2e0d5', () => {
      expect(getToken('--ds-primary-hl')).toBe('#f2e0d5');
    });
  });

  describe('Surfaces', () => {
    it('--ds-bg doit être warm off-white #f8f7f4', () => {
      expect(getToken('--ds-bg')).toBe('#f8f7f4');
    });
    it('--ds-surface doit être #ffffff', () => {
      expect(getToken('--ds-surface')).toBe('#ffffff');
    });
    it('--ds-divider doit être #e0ddd6', () => {
      expect(getToken('--ds-divider')).toBe('#e0ddd6');
    });
  });

  describe('Texte', () => {
    it('--ds-text doit être presque noir warm #18160f', () => {
      expect(getToken('--ds-text')).toBe('#18160f');
    });
    it('--ds-text-muted doit être #605c52', () => {
      expect(getToken('--ds-text-muted')).toBe('#605c52');
    });
  });

  describe('Sémantiques', () => {
    it('--ds-success doit être vert #2e7d32', () => {
      expect(getToken('--ds-success')).toBe('#2e7d32');
    });
    it('--ds-error doit être rouge #c62828', () => {
      expect(getToken('--ds-error')).toBe('#c62828');
    });
    it('--ds-warning doit être orange #e65100', () => {
      expect(getToken('--ds-warning')).toBe('#e65100');
    });
  });

  describe('Radius', () => {
    it('--ds-radius-md doit être 10px (aligné sur tokens.css --r-md)', () => {
      expect(getToken('--ds-radius-md')).toBe('10px');
    });
    it('--ds-radius-lg doit être 14px', () => {
      expect(getToken('--ds-radius-lg')).toBe('14px');
    });
    it('--ds-radius-pill doit être 9999px', () => {
      expect(getToken('--ds-radius-pill')).toBe('9999px');
    });
  });

  describe('Divergences corrigées (audit Phase 0)', () => {
    it('Marine ne doit pas être bleu pur #2c5aa0', () => {
      expect(getToken('--ds-marine')).not.toBe('#2c5aa0');
    });
    it('Copper ne doit pas être orange vif #e67e22', () => {
      expect(getToken('--ds-primary')).not.toBe('#e67e22');
    });
    it('Radius md ne doit pas être 8px (ancienne valeur --at-radius-md)', () => {
      expect(getToken('--ds-radius-md')).not.toBe('8px');
    });
  });
});
