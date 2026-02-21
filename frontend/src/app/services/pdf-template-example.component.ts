import { Component } from '@angular/core';
import { PdfTemplateService, PdfBrandConfig, PdfDocument, PdfTemplateType } from './pdf-template.service';

/**
 * Example component demonstrating PDF Template Service usage
 * 
 * This is a reference implementation showing how to use the service
 * in real-world scenarios. Copy and adapt the methods below for your needs.
 */
@Component({
  selector: 'app-pdf-template-example',
  template: `
    <div class="pdf-examples-container">
      <h2>Exemples de Génération PDF</h2>
      
      <div class="example-section">
        <h3>1. Dossier Complet</h3>
        <button (click)="exportDossierExample()" [disabled]="isGenerating">
          {{ isGenerating ? 'Génération...' : 'Exporter Dossier' }}
        </button>
      </div>
      
      <div class="example-section">
        <h3>2. Rapport Mensuel</h3>
        <button (click)="exportReportExample()" [disabled]="isGenerating">
          {{ isGenerating ? 'Génération...' : 'Exporter Rapport' }}
        </button>
      </div>
      
      <div class="example-section">
        <h3>3. Contrat Type</h3>
        <button (click)="exportContractExample()" [disabled]="isGenerating">
          {{ isGenerating ? 'Génération...' : 'Exporter Contrat' }}
        </button>
      </div>
      
      <div class="example-section">
        <h3>4. Document Personnalisé</h3>
        <button (click)="exportCustomExample()" [disabled]="isGenerating">
          {{ isGenerating ? 'Génération...' : 'Exporter Document Personnalisé' }}
        </button>
      </div>
      
      <div class="example-section">
        <h3>5. Avec Watermark</h3>
        <button (click)="exportWithWatermark()" [disabled]="isGenerating">
          {{ isGenerating ? 'Génération...' : 'Exporter avec Watermark' }}
        </button>
      </div>
      
      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>
      
      <div *ngIf="success" class="success-message">
        {{ success }}
      </div>
    </div>
  `,
  styles: [`
    .pdf-examples-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .example-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .example-section h3 {
      margin-top: 0;
      color: #2c5aa0;
    }
    
    button {
      padding: 10px 20px;
      background-color: #2c5aa0;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    button:hover:not(:disabled) {
      background-color: #1e4070;
    }
    
    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    .error-message {
      margin-top: 20px;
      padding: 10px;
      background-color: #ffebee;
      color: #c62828;
      border-radius: 4px;
    }
    
    .success-message {
      margin-top: 20px;
      padding: 10px;
      background-color: #e8f5e9;
      color: #2e7d32;
      border-radius: 4px;
    }
  `]
})
export class PdfTemplateExampleComponent {
  isGenerating = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private pdfService: PdfTemplateService) {}

  /**
   * Example 1: Export a complete dossier
   */
  async exportDossierExample(): Promise<void> {
    this.startGeneration();
    
    try {
      // Mock dossier data - in real app, fetch from API
      const dossierData = {
        id: 12345,
        leadName: 'Jean Dupont',
        leadPhone: '+33 6 12 34 56 78',
        leadEmail: 'jean.dupont@email.fr',
        status: 'QUALIFIED',
        source: 'WEB',
        createdAt: new Date().toISOString(),
        annonceId: 456,
        annonceTitle: 'Appartement 3 pièces - Paris 15e',
        parties: [
          {
            role: 'BUYER',
            firstName: 'Jean',
            lastName: 'Dupont',
            phone: '+33 6 12 34 56 78',
            email: 'jean.dupont@email.fr',
          },
          {
            role: 'AGENT',
            firstName: 'Marie',
            lastName: 'Martin',
            phone: '+33 1 23 45 67 89',
            email: 'marie.martin@atlas-immobilier.fr',
          },
        ],
        notes: 'Client très intéressé. Premier achat immobilier. Budget confirmé à 350 000 €. Rendez-vous prévu la semaine prochaine pour visite.',
      };

      await this.pdfService.generateDossierComplet(dossierData);
      this.showSuccess('Dossier exporté avec succès !');
    } catch (error) {
      this.showError('Erreur lors de l\'export du dossier');
      console.error(error);
    } finally {
      this.endGeneration();
    }
  }

  /**
   * Example 2: Export a monthly report
   */
  async exportReportExample(): Promise<void> {
    this.startGeneration();
    
    try {
      const reportData = {
        month: 'Janvier',
        year: 2024,
        newDossiers: 45,
        closedDossiers: 28,
        conversionRate: 62.2,
        stats: [
          { label: 'Nouveaux prospects', value: 120, change: 15 },
          { label: 'Rendez-vous fixés', value: 65, change: 8 },
          { label: 'Dossiers qualifiés', value: 45, change: 12 },
          { label: 'Ventes conclues', value: 28, change: -3 },
          { label: 'Chiffre d\'affaires', value: '1 250 000', change: 18 },
        ],
        agentPerformance: [
          { name: 'Marie Martin', dossiers: 15, conversions: 10, revenue: 425000 },
          { name: 'Pierre Durand', dossiers: 12, conversions: 8, revenue: 380000 },
          { name: 'Sophie Bernard', dossiers: 10, conversions: 6, revenue: 275000 },
          { name: 'Luc Petit', dossiers: 8, conversions: 4, revenue: 170000 },
        ],
        topAnnonces: [
          { title: 'Appartement 4P - Neuilly', views: 350, contacts: 45, status: 'ACTIVE' },
          { title: 'Maison 6P - Versailles', views: 280, contacts: 38, status: 'ACTIVE' },
          { title: 'Studio - Paris 11e', views: 420, contacts: 62, status: 'ACTIVE' },
          { title: 'Duplex 5P - Boulogne', views: 195, contacts: 28, status: 'ACTIVE' },
        ],
        comments: 'Excellent mois de janvier avec une augmentation significative des nouveaux prospects et un taux de conversion stable. Performance remarquable de Marie Martin. Focus sur le segment des maisons individuelles pour février.',
      };

      await this.pdfService.generateRapportMensuel(reportData);
      this.showSuccess('Rapport mensuel exporté avec succès !');
    } catch (error) {
      this.showError('Erreur lors de l\'export du rapport');
      console.error(error);
    } finally {
      this.endGeneration();
    }
  }

  /**
   * Example 3: Export a contract
   */
  async exportContractExample(): Promise<void> {
    this.startGeneration();
    
    try {
      const contractData = {
        id: 'CTR-2024-001',
        type: 'Mandat de Vente Exclusif',
        clientName: 'Marie Martin',
        clientAddress: '10 Rue de la Paix, 75002 Paris',
        clientPhone: '+33 6 98 76 54 32',
        object: 'Le présent contrat a pour objet de confier à Atlas Immobilier un mandat de vente exclusif pour le bien immobilier situé au 10 Rue de la Paix, 75002 Paris. Le bien est un appartement de 85m² comprenant 3 pièces principales.',
        terms: 'Le présent mandat est conclu pour une durée de 6 mois à compter de sa signature, soit du 15 janvier 2024 au 15 juillet 2024. Il pourra être renouvelé par accord mutuel des parties.',
        remuneration: 'La rémunération d\'Atlas Immobilier est fixée à 5% du prix de vente TTC, soit un montant estimé de 22 500 euros pour un prix de vente de 450 000 euros. Cette commission sera payable lors de la signature de l\'acte authentique de vente.',
      };

      const brandConfig: PdfBrandConfig = {
        companyName: 'Atlas Immobilier',
        address: '123 Rue de la République, 75001 Paris',
        phone: '+33 1 23 45 67 89',
        email: 'contact@atlas-immobilier.fr',
        website: 'www.atlas-immobilier.fr',
        primaryColor: '#2c5aa0',
        secondaryColor: '#e67e22',
      };

      await this.pdfService.generateContratType(contractData, brandConfig);
      this.showSuccess('Contrat exporté avec succès !');
    } catch (error) {
      this.showError('Erreur lors de l\'export du contrat');
      console.error(error);
    } finally {
      this.endGeneration();
    }
  }

  /**
   * Example 4: Export a custom document with mixed content
   */
  async exportCustomExample(): Promise<void> {
    this.startGeneration();
    
    try {
      const document: PdfDocument = {
        config: {
          type: PdfTemplateType.DOSSIER_COMPLET,
          title: 'Analyse de Marché Immobilier - Paris 15e',
          filename: 'analyse_marche_paris_15e',
          orientation: 'portrait',
          includeDate: true,
          includePageNumbers: true,
          includeSignatures: true,
          signatureCount: 2,
        },
        sections: [
          {
            title: 'Résumé Exécutif',
            level: 1,
            content: 'Le marché immobilier du 15e arrondissement de Paris présente une dynamique positive au premier trimestre 2024. Les prix moyens au m² ont progressé de 3,2% par rapport au trimestre précédent, avec une demande soutenue pour les appartements familiaux.',
          },
          {
            title: 'Données du Marché',
            level: 2,
            content: [
              'Prix moyen au m²: 10 850 €',
              'Variation trimestrielle: +3,2%',
              'Variation annuelle: +5,8%',
              'Délai moyen de vente: 45 jours',
              'Nombre de transactions: 287',
            ],
          },
          {
            title: 'Comparaison par Type de Bien',
            level: 2,
            content: {
              headers: ['Type', 'Prix moyen/m²', 'Variation', 'Délai de vente'],
              rows: [
                ['Studio', '11 200 €', '+2,8%', '35 jours'],
                ['2 pièces', '10 900 €', '+3,1%', '42 jours'],
                ['3 pièces', '10 750 €', '+3,5%', '48 jours'],
                ['4 pièces+', '10 450 €', '+3,8%', '52 jours'],
              ],
              zebraStriping: true,
            },
          },
          {
            title: 'Analyse par Secteur',
            level: 2,
            content: {
              headers: ['Secteur', 'Prix moyen/m²', 'Offre', 'Demande'],
              rows: [
                ['Commerce / Vaugirard', '11 200 €', 'Moyenne', 'Forte'],
                ['Convention / Brancion', '10 650 €', 'Élevée', 'Moyenne'],
                ['Grenelle / Javel', '11 500 €', 'Faible', 'Très forte'],
              ],
              zebraStriping: true,
            },
          },
          {
            title: 'Perspectives',
            level: 2,
            content: 'Les perspectives pour le deuxième trimestre restent favorables. La demande devrait se maintenir, notamment pour les biens rénovés et bien situés. Les taux d\'intérêt stabilisés devraient continuer à soutenir le marché.',
          },
          {
            title: 'Recommandations',
            level: 2,
            content: [
              '1. Privilégier les biens familiaux (3-4 pièces) dans le secteur Grenelle / Javel',
              '2. Mettre l\'accent sur la rénovation et la performance énergétique',
              '3. Ajuster les prix en fonction de la localisation précise',
              '4. Prévoir un délai de commercialisation de 45-50 jours',
              '5. Renforcer la visibilité en ligne des annonces',
            ],
          },
        ],
        signatures: [
          { label: 'Analyste', name: 'Sophie Bernard', date: new Date().toLocaleDateString('fr-FR') },
          { label: 'Directeur', name: 'Jean Dupont', date: '' },
        ],
      };

      await this.pdfService.generatePdf(document);
      this.showSuccess('Document personnalisé exporté avec succès !');
    } catch (error) {
      this.showError('Erreur lors de l\'export du document');
      console.error(error);
    } finally {
      this.endGeneration();
    }
  }

  /**
   * Example 5: Export with watermark (for confidential documents)
   */
  async exportWithWatermark(): Promise<void> {
    this.startGeneration();
    
    try {
      const document: PdfDocument = {
        config: {
          type: PdfTemplateType.DOSSIER_COMPLET,
          title: 'Document Confidentiel - Stratégie Commerciale 2024',
          filename: 'strategie_confidentielle_2024',
          orientation: 'portrait',
          includeDate: true,
          includePageNumbers: true,
          includeWatermark: true,
          watermarkText: 'CONFIDENTIEL',
          legalNotice: 'Ce document est strictement confidentiel et ne peut être diffusé sans l\'autorisation écrite d\'Atlas Immobilier.',
        },
        sections: [
          {
            title: 'Stratégie Commerciale Confidentielle',
            level: 1,
            content: 'Ce document présente la stratégie commerciale d\'Atlas Immobilier pour l\'année 2024. Les informations contenues sont confidentielles et réservées à un usage interne.',
          },
          {
            title: 'Objectifs 2024',
            level: 2,
            content: [
              'Augmentation du CA de 25%',
              'Ouverture de 3 nouvelles agences',
              'Recrutement de 10 agents supplémentaires',
              'Digitalisation complète du parcours client',
            ],
          },
          {
            title: 'Actions Prioritaires',
            level: 2,
            content: {
              headers: ['Action', 'Budget', 'Responsable', 'Échéance'],
              rows: [
                ['Marketing digital', '150 000 €', 'M. Martin', 'T1 2024'],
                ['Formation équipe', '75 000 €', 'S. Bernard', 'T2 2024'],
                ['Nouveaux locaux', '250 000 €', 'J. Dupont', 'T3 2024'],
              ],
              zebraStriping: true,
            },
          },
        ],
      };

      await this.pdfService.generatePdf(document);
      this.showSuccess('Document avec watermark exporté avec succès !');
    } catch (error) {
      this.showError('Erreur lors de l\'export du document');
      console.error(error);
    } finally {
      this.endGeneration();
    }
  }

  private startGeneration(): void {
    this.isGenerating = true;
    this.error = null;
    this.success = null;
  }

  private endGeneration(): void {
    this.isGenerating = false;
  }

  private showSuccess(message: string): void {
    this.success = message;
    setTimeout(() => this.success = null, 5000);
  }

  private showError(message: string): void {
    this.error = message;
    setTimeout(() => this.error = null, 5000);
  }
}
