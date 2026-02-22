import { TestBed } from '@angular/core/testing';
import { PdfTemplateService, PdfTemplateType, PdfBrandConfig, PdfDocument } from './pdf-template.service';

describe('PdfTemplateService', () => {
  let service: PdfTemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfTemplateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateDossierComplet', () => {
    it('should generate a dossier PDF with correct structure', async () => {
      const dossierData = {
        id: 123,
        leadName: 'Jean Dupont',
        leadPhone: '+33612345678',
        leadEmail: 'jean@example.com',
        status: 'QUALIFIED',
        source: 'WEB',
        createdAt: new Date().toISOString(),
        annonceId: 456,
        annonceTitle: 'Appartement Paris 15e',
        parties: [
          {
            role: 'BUYER',
            firstName: 'Jean',
            lastName: 'Dupont',
            phone: '+33612345678',
            email: 'jean@example.com',
          },
        ],
        notes: 'Client intéressé par le bien',
      };

      spyOn(service, 'generatePdf').and.returnValue(Promise.resolve());

      await service.generateDossierComplet(dossierData);

      expect(service.generatePdf).toHaveBeenCalled();
    });

    it('should handle dossier without annonce', async () => {
      const dossierData = {
        id: 123,
        leadName: 'Jean Dupont',
        status: 'NEW',
        createdAt: new Date().toISOString(),
        parties: [],
      };

      spyOn(service, 'generatePdf').and.returnValue(Promise.resolve());

      await service.generateDossierComplet(dossierData);

      expect(service.generatePdf).toHaveBeenCalled();
    });
  });

  describe('generateRapportMensuel', () => {
    it('should generate a monthly report PDF', async () => {
      const reportData = {
        month: 'Janvier',
        year: 2024,
        newDossiers: 25,
        closedDossiers: 15,
        conversionRate: 60,
        stats: [
          { label: 'Nouveaux prospects', value: 50, change: 10 },
          { label: 'Rendez-vous fixés', value: 30, change: -5 },
        ],
        agentPerformance: [
          { name: 'Agent 1', dossiers: 10, conversions: 6, revenue: 50000 },
          { name: 'Agent 2', dossiers: 8, conversions: 4, revenue: 40000 },
        ],
        topAnnonces: [
          { title: 'Appartement Paris', views: 150, contacts: 20, status: 'ACTIVE' },
        ],
        comments: 'Bon mois dans l\'ensemble',
      };

      spyOn(service, 'generatePdf').and.returnValue(Promise.resolve());

      await service.generateRapportMensuel(reportData);

      expect(service.generatePdf).toHaveBeenCalled();
    });
  });

  describe('generateContratType', () => {
    it('should generate a contract PDF', async () => {
      const contractData = {
        id: 'CTR-2024-001',
        type: 'Mandat de vente',
        clientName: 'Marie Martin',
        clientAddress: '10 Rue de la Paix, 75001 Paris',
        clientPhone: '+33612345678',
        object: 'Mandat de vente exclusif',
        terms: 'Durée de 6 mois',
        remuneration: '3% du prix de vente',
      };

      const brandConfig: PdfBrandConfig = {
        companyName: 'Test Immobilier',
        address: '1 Rue Test, 75000 Paris',
        phone: '+33100000000',
        email: 'test@example.com',
      };

      spyOn(service, 'generatePdf').and.returnValue(Promise.resolve());

      await service.generateContratType(contractData, brandConfig);

      expect(service.generatePdf).toHaveBeenCalled();
    });
  });

  describe('generatePdf', () => {
    it('should generate a basic PDF document', async () => {
      const document: PdfDocument = {
        config: {
          type: PdfTemplateType.DOSSIER_COMPLET,
          title: 'Test Document',
          filename: 'test',
          orientation: 'portrait',
          includeDate: true,
          includePageNumbers: true,
        },
        sections: [
          {
            title: 'Section 1',
            level: 1,
            content: 'This is test content',
          },
        ],
      };

      const generatePdfSpy = spyOn(service, 'generatePdf').and.returnValue(Promise.resolve());

      await service.generatePdf(document);

      expect(generatePdfSpy).toHaveBeenCalledWith(document);
    });
  });
});
