import { TestBed } from '@angular/core/testing';
import { EmptyStateIllustrationsService, EmptyStateContext } from './empty-state-illustrations.service';

describe('EmptyStateIllustrationsService', () => {
  let service: EmptyStateIllustrationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmptyStateIllustrationsService]
    });
    service = TestBed.inject(EmptyStateIllustrationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getConfig', () => {
    it('should return config for NO_DOSSIERS context', () => {
      const config = service.getConfig(EmptyStateContext.NO_DOSSIERS, false);
      
      expect(config.context).toBe(EmptyStateContext.NO_DOSSIERS);
      expect(config.title).toContain('Aucun dossier');
      expect(config.primaryCta).toBeDefined();
      expect(config.primaryCta?.label).toContain('dossier');
      expect(config.illustration).toBeDefined();
    });

    it('should return different text for new users', () => {
      const newUserConfig = service.getConfig(EmptyStateContext.NO_DOSSIERS, true);
      const experiencedUserConfig = service.getConfig(EmptyStateContext.NO_DOSSIERS, false);
      
      expect(newUserConfig.title).not.toBe(experiencedUserConfig.title);
      expect(newUserConfig.title).toContain('Bienvenue');
      expect(newUserConfig.primaryCta?.label).toContain('premier');
    });

    it('should return config for NO_ANNONCES context', () => {
      const config = service.getConfig(EmptyStateContext.NO_ANNONCES, false);
      
      expect(config.context).toBe(EmptyStateContext.NO_ANNONCES);
      expect(config.title).toContain('annonce');
      expect(config.primaryCta).toBeDefined();
      expect(config.illustration).toBeDefined();
    });

    it('should return config for filtered results', () => {
      const config = service.getConfig(EmptyStateContext.NO_DOSSIERS_FILTERED, false);
      
      expect(config.title).toContain('filtre');
      expect(config.primaryCta?.label).toContain('Réinitialiser');
    });

    it('should return config for NO_MESSAGES context', () => {
      const config = service.getConfig(EmptyStateContext.NO_MESSAGES, false);
      
      expect(config.context).toBe(EmptyStateContext.NO_MESSAGES);
      expect(config.title).toContain('message');
      expect(config.primaryCta).toBeDefined();
      expect(config.secondaryCta).toBeDefined();
      expect(config.helpLink).toBeDefined();
    });

    it('should return config for all contexts without errors', () => {
      const contexts = Object.values(EmptyStateContext);
      
      contexts.forEach(context => {
        const config = service.getConfig(context, false);
        expect(config).toBeDefined();
        expect(config.title).toBeTruthy();
        expect(config.message).toBeTruthy();
        expect(config.illustration).toBeDefined();
      });
    });

    it('should include help links when appropriate', () => {
      const configWithHelp = service.getConfig(EmptyStateContext.NO_DOSSIERS, false);
      const configWithoutHelp = service.getConfig(EmptyStateContext.NO_ACTIVITIES, false);
      
      expect(configWithHelp.helpLink).toBeDefined();
      expect(configWithoutHelp.helpLink).toBeUndefined();
    });

    it('should include secondary CTAs when appropriate', () => {
      const configWithSecondary = service.getConfig(EmptyStateContext.NO_DOSSIERS, false);
      const configWithoutSecondary = service.getConfig(EmptyStateContext.NO_ACTIVITIES, false);
      
      expect(configWithSecondary.secondaryCta).toBeDefined();
      expect(configWithoutSecondary.secondaryCta).toBeUndefined();
    });
  });

  describe('illustrations', () => {
    it('should return valid SVG for dossier context', () => {
      const config = service.getConfig(EmptyStateContext.NO_DOSSIERS, false);
      const svg = config.illustration.toString();
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox');
      expect(svg).toContain('</svg>');
    });

    it('should include animations in illustrations', () => {
      const config = service.getConfig(EmptyStateContext.NO_DOSSIERS, false);
      const svg = config.illustration.toString();
      
      expect(svg).toContain('animation');
      expect(svg).toContain('@keyframes');
    });

    it('should include gradients for visual appeal', () => {
      const config = service.getConfig(EmptyStateContext.NO_ANNONCES, false);
      const svg = config.illustration.toString();
      
      expect(svg).toContain('linearGradient');
      expect(svg).toContain('defs');
    });
  });
});
