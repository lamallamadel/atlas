import { Injectable } from '@angular/core';

/**
 * PDF Template Types
 */
export enum PdfTemplateType {
  DOSSIER_COMPLET = 'DOSSIER_COMPLET',
  RAPPORT_MENSUEL = 'RAPPORT_MENSUEL',
  CONTRAT_TYPE = 'CONTRAT_TYPE'
}

/**
 * Document configuration and branding
 */
export interface PdfBrandConfig {
  companyName: string;
  logo?: string; // Base64 or URL
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * Template configuration options
 */
export interface PdfTemplateConfig {
  type: PdfTemplateType;
  title: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  brandConfig?: PdfBrandConfig;
  includeDate?: boolean;
  includePageNumbers?: boolean;
  includeWatermark?: boolean;
  watermarkText?: string;
  includeSignatures?: boolean;
  signatureCount?: number;
  legalNotice?: string;
}

/**
 * Section for structured content
 */
export interface PdfSection {
  title: string;
  content: string | string[] | PdfTable;
  level?: 1 | 2 | 3; // Heading level
}

/**
 * Table data structure
 */
export interface PdfTable {
  headers: string[];
  rows: (string | number)[][];
  zebraStriping?: boolean;
  headerColor?: string;
}

/**
 * Signature block
 */
export interface PdfSignature {
  label: string;
  name?: string;
  date?: string;
}

/**
 * Complete document structure
 */
export interface PdfDocument {
  config: PdfTemplateConfig;
  sections: PdfSection[];
  signatures?: PdfSignature[];
}

/**
 * Typography and spacing constants for print-optimized layout
 */
const TYPOGRAPHY = {
  font: {
    serif: 'georgia',
    sansSerif: 'helvetica',
  },
  sizes: {
    h1: 24,
    h2: 18,
    h3: 14,
    body: 11,
    caption: 9,
    footer: 8,
  },
  colors: {
    primary: '#2c5aa0',
    secondary: '#e67e22',
    text: '#333333',
    textLight: '#666666',
    border: '#dddddd',
  },
  spacing: {
    section: 15,
    paragraph: 8,
    line: 5,
  },
};

/**
 * Default brand configuration for Atlas Immobilier
 */
const DEFAULT_BRAND: PdfBrandConfig = {
  companyName: 'Atlas Immobilier',
  address: '123 Rue de la République, 75001 Paris',
  phone: '+33 1 23 45 67 89',
  email: 'contact@atlas-immobilier.fr',
  website: 'www.atlas-immobilier.fr',
  primaryColor: '#2c5aa0',
  secondaryColor: '#e67e22',
};

/**
 * Professional PDF Template Service
 * 
 * Provides branded PDF generation with:
 * - Professional header with logo and contact info
 * - Footer with pagination and legal notices
 * - Print-optimized typography (Georgia serif for body, sans-serif for headers)
 * - Tables with zebra striping
 * - Consistent vertical spacing
 * - Signature zones
 * - Optional watermarks
 * - Multiple template variants (dossier complet, rapport mensuel, contrat type)
 */
@Injectable({
  providedIn: 'root'
})
export class PdfTemplateService {
  private defaultLegalNotice = 
    'Document confidentiel - Usage interne uniquement. ' +
    'Les informations contenues dans ce document sont la propriété d\'Atlas Immobilier.';

  constructor() { /* no-op */ }

  /**
   * Generate a professional PDF document
   */
  async generatePdf(document: PdfDocument): Promise<void> {
    const { default: jsPDF } = await import('jspdf');

    const config = this.mergeConfig(document.config);
    const doc = new jsPDF({
      orientation: config.orientation || 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Add custom fonts
    this.setupFonts(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margins = { top: 25, right: 20, bottom: 25, left: 20 };
    const contentWidth = pageWidth - margins.left - margins.right;

    let yPosition = margins.top;

    // Add header to first page
    yPosition = await this.addHeader(doc, config, pageWidth, yPosition);

    // Add watermark if enabled
    if (config.includeWatermark) {
      this.addWatermark(doc, config.watermarkText || 'CONFIDENTIEL', pageWidth, pageHeight);
    }

    // Add sections
    for (const section of document.sections) {
      yPosition = await this.addSection(doc, section, margins, contentWidth, yPosition, pageHeight);
    }

    // Add signatures if enabled
    if (config.includeSignatures && document.signatures) {
      yPosition = await this.addSignatures(doc, document.signatures, margins, contentWidth, yPosition, pageHeight, config.signatureCount || 2);
    }

    // Add footer to all pages
    this.addFooter(doc, config, pageWidth, pageHeight);

    // Save the document
    const filename = `${config.filename}_${new Date().getTime()}.pdf`;
    doc.save(filename);
  }

  /**
   * Generate a Dossier Complet PDF
   */
  async generateDossierComplet(dossierData: any, brandConfig?: PdfBrandConfig): Promise<void> {
    const document: PdfDocument = {
      config: {
        type: PdfTemplateType.DOSSIER_COMPLET,
        title: `Dossier #${dossierData.id} - ${dossierData.leadName || 'Sans nom'}`,
        filename: `dossier_${dossierData.id}`,
        brandConfig,
        includeDate: true,
        includePageNumbers: true,
        includeSignatures: true,
        signatureCount: 2,
      },
      sections: [
        {
          title: 'Informations du Dossier',
          level: 1,
          content: [
            `Numéro de dossier: ${dossierData.id}`,
            `Statut: ${this.translateStatus(dossierData.status)}`,
            `Date de création: ${new Date(dossierData.createdAt).toLocaleDateString('fr-FR')}`,
            `Source: ${dossierData.source || 'Non spécifiée'}`,
          ],
        },
        {
          title: 'Contact Principal',
          level: 2,
          content: [
            `Nom: ${dossierData.leadName || 'Non renseigné'}`,
            `Téléphone: ${dossierData.leadPhone || 'Non renseigné'}`,
            `Email: ${dossierData.leadEmail || 'Non renseigné'}`,
          ],
        },
        {
          title: 'Bien Immobilier',
          level: 2,
          content: dossierData.annonceTitle 
            ? [
                `Titre: ${dossierData.annonceTitle}`,
                `Référence: #${dossierData.annonceId}`,
              ]
            : ['Aucun bien associé'],
        },
        {
          title: 'Parties Prenantes',
          level: 2,
          content: this.buildPartiesTable(dossierData.parties || []),
        },
        {
          title: 'Notes et Observations',
          level: 2,
          content: dossierData.notes || 'Aucune note enregistrée.',
        },
      ],
      signatures: [
        { label: 'Agent immobilier', name: '', date: '' },
        { label: 'Client', name: '', date: '' },
      ],
    };

    await this.generatePdf(document);
  }

  /**
   * Generate a Rapport Mensuel PDF
   */
  async generateRapportMensuel(reportData: any, brandConfig?: PdfBrandConfig): Promise<void> {
    const document: PdfDocument = {
      config: {
        type: PdfTemplateType.RAPPORT_MENSUEL,
        title: `Rapport Mensuel - ${reportData.month} ${reportData.year}`,
        filename: `rapport_mensuel_${reportData.year}_${reportData.month}`,
        orientation: 'landscape',
        brandConfig,
        includeDate: true,
        includePageNumbers: true,
        includeWatermark: false,
      },
      sections: [
        {
          title: 'Résumé Exécutif',
          level: 1,
          content: [
            `Période: ${reportData.month} ${reportData.year}`,
            `Nouveaux dossiers: ${reportData.newDossiers || 0}`,
            `Dossiers clos: ${reportData.closedDossiers || 0}`,
            `Taux de conversion: ${reportData.conversionRate || 0}%`,
          ],
        },
        {
          title: 'Statistiques Détaillées',
          level: 2,
          content: this.buildStatsTable(reportData.stats || []),
        },
        {
          title: 'Performance par Agent',
          level: 2,
          content: this.buildAgentPerformanceTable(reportData.agentPerformance || []),
        },
        {
          title: 'Annonces les Plus Consultées',
          level: 2,
          content: this.buildTopAnnoncesTable(reportData.topAnnonces || []),
        },
        {
          title: 'Commentaires et Recommandations',
          level: 1,
          content: reportData.comments || 'Aucun commentaire.',
        },
      ],
    };

    await this.generatePdf(document);
  }

  /**
   * Generate a Contrat Type PDF
   */
  async generateContratType(contractData: any, brandConfig?: PdfBrandConfig): Promise<void> {
    const document: PdfDocument = {
      config: {
        type: PdfTemplateType.CONTRAT_TYPE,
        title: `Contrat ${contractData.type || 'Standard'}`,
        filename: `contrat_${contractData.id || 'nouveau'}`,
        brandConfig,
        includeDate: true,
        includePageNumbers: true,
        includeWatermark: false,
        includeSignatures: true,
        signatureCount: 3,
      },
      sections: [
        {
          title: 'Contrat de Prestation Immobilière',
          level: 1,
          content: [
            `Date du contrat: ${new Date().toLocaleDateString('fr-FR')}`,
            `Référence: ${contractData.id || 'À compléter'}`,
          ],
        },
        {
          title: 'Article 1 - Objet du Contrat',
          level: 2,
          content: contractData.object || 
            'Le présent contrat a pour objet de définir les conditions dans lesquelles ' +
            'Atlas Immobilier s\'engage à fournir des services de conseil et d\'intermédiation immobilière.',
        },
        {
          title: 'Article 2 - Parties Contractantes',
          level: 2,
          content: [
            'Le Prestataire:',
            `  ${brandConfig?.companyName || DEFAULT_BRAND.companyName}`,
            `  ${brandConfig?.address || DEFAULT_BRAND.address}`,
            '',
            'Le Client:',
            `  Nom: ${contractData.clientName || '______________________'}`,
            `  Adresse: ${contractData.clientAddress || '______________________'}`,
            `  Téléphone: ${contractData.clientPhone || '______________________'}`,
          ],
        },
        {
          title: 'Article 3 - Durée et Conditions',
          level: 2,
          content: contractData.terms || 
            'Le présent contrat est conclu pour une durée de [À COMPLÉTER] mois à compter de sa signature. ' +
            'Il pourra être renouvelé par accord mutuel des parties.',
        },
        {
          title: 'Article 4 - Rémunération',
          level: 2,
          content: contractData.remuneration || 
            'La rémunération du prestataire sera déterminée selon le barème en vigueur. ' +
            'Le montant sera de [À COMPLÉTER] euros.',
        },
        {
          title: 'Article 5 - Obligations des Parties',
          level: 2,
          content: [
            'Le prestataire s\'engage à:',
            '  - Fournir un service de qualité',
            '  - Respecter la confidentialité des informations',
            '  - Conseiller le client dans ses démarches',
            '',
            'Le client s\'engage à:',
            '  - Fournir les informations nécessaires',
            '  - Respecter les délais convenus',
            '  - Honorer ses engagements financiers',
          ],
        },
        {
          title: 'Article 6 - Résiliation',
          level: 2,
          content: 
            'Le présent contrat peut être résilié par l\'une ou l\'autre des parties moyennant ' +
            'un préavis de 30 jours par lettre recommandée avec accusé de réception.',
        },
        {
          title: 'Article 7 - Litiges',
          level: 2,
          content: 
            'En cas de litige relatif à l\'interprétation ou à l\'exécution du présent contrat, ' +
            'les parties s\'efforceront de le résoudre à l\'amiable. À défaut, le tribunal compétent ' +
            'sera celui du ressort du siège social d\'Atlas Immobilier.',
        },
      ],
      signatures: [
        { label: 'Le Prestataire', name: brandConfig?.companyName || DEFAULT_BRAND.companyName, date: '' },
        { label: 'Le Client', name: '', date: '' },
        { label: 'Témoin', name: '', date: '' },
      ],
    };

    await this.generatePdf(document);
  }

  /**
   * Setup fonts for the document
   */
  private setupFonts(doc: any): void {
    // jsPDF comes with built-in fonts: helvetica, times, courier
    // Georgia is similar to Times, Helvetica for sans-serif
    doc.setFont(TYPOGRAPHY.font.sansSerif);
  }

  /**
   * Add branded header to the document
   */
  private async addHeader(
    doc: any,
    config: PdfTemplateConfig,
    pageWidth: number,
    yPosition: number
  ): Promise<number> {
    const brand = config.brandConfig || DEFAULT_BRAND;
    let y = yPosition;

    // Add logo if provided
    if (brand.logo) {
      try {
        doc.addImage(brand.logo, 'PNG', 20, y, 40, 20);
        y += 25;
      } catch (e) {
        console.warn('Could not add logo:', e);
      }
    }

    // Company name and contact info in header
    doc.setFont(TYPOGRAPHY.font.sansSerif, 'bold');
    doc.setFontSize(TYPOGRAPHY.sizes.h3);
    doc.setTextColor(brand.primaryColor || TYPOGRAPHY.colors.primary);
    doc.text(brand.companyName, pageWidth - 20, y, { align: 'right' });
    y += 5;

    doc.setFont(TYPOGRAPHY.font.sansSerif, 'normal');
    doc.setFontSize(TYPOGRAPHY.sizes.caption);
    doc.setTextColor(TYPOGRAPHY.colors.textLight);

    if (brand.address) {
      doc.text(brand.address, pageWidth - 20, y, { align: 'right' });
      y += 4;
    }
    if (brand.phone) {
      doc.text(`Tél: ${brand.phone}`, pageWidth - 20, y, { align: 'right' });
      y += 4;
    }
    if (brand.email) {
      doc.text(brand.email, pageWidth - 20, y, { align: 'right' });
      y += 4;
    }

    y += 10;

    // Title
    doc.setFont(TYPOGRAPHY.font.sansSerif, 'bold');
    doc.setFontSize(TYPOGRAPHY.sizes.h1);
    doc.setTextColor(TYPOGRAPHY.colors.text);
    const titleLines = doc.splitTextToSize(config.title, pageWidth - 40);
    doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
    y += titleLines.length * 8;

    // Date if enabled
    if (config.includeDate) {
      doc.setFont(TYPOGRAPHY.font.sansSerif, 'normal');
      doc.setFontSize(TYPOGRAPHY.sizes.body);
      doc.setTextColor(TYPOGRAPHY.colors.textLight);
      doc.text(
        `Date: ${new Date().toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`,
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      y += 10;
    }

    // Separator line
    doc.setDrawColor(brand.primaryColor || TYPOGRAPHY.colors.primary);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 15;

    return y;
  }

  /**
   * Add footer to all pages
   */
  private addFooter(doc: any, config: PdfTemplateConfig, pageWidth: number, pageHeight: number): void {
    const totalPages = doc.internal.getNumberOfPages();
    const brand = config.brandConfig || DEFAULT_BRAND;

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      const footerY = pageHeight - 15;

      // Separator line
      doc.setDrawColor(TYPOGRAPHY.colors.border);
      doc.setLineWidth(0.3);
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

      // Legal notice on the left
      doc.setFont(TYPOGRAPHY.font.sansSerif, 'normal');
      doc.setFontSize(TYPOGRAPHY.sizes.footer);
      doc.setTextColor(TYPOGRAPHY.colors.textLight);
      const legalText = config.legalNotice || this.defaultLegalNotice;
      const legalLines = doc.splitTextToSize(legalText, pageWidth - 80);
      doc.text(legalLines, 20, footerY, { align: 'left', maxWidth: pageWidth - 80 });

      // Page number on the right
      if (config.includePageNumbers) {
        doc.setFont(TYPOGRAPHY.font.sansSerif, 'normal');
        doc.setFontSize(TYPOGRAPHY.sizes.footer);
        doc.text(`Page ${i} / ${totalPages}`, pageWidth - 20, footerY, { align: 'right' });
      }
    }
  }

  /**
   * Add watermark to the page
   */
  private addWatermark(doc: any, text: string, pageWidth: number, pageHeight: number): void {
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      doc.setFont(TYPOGRAPHY.font.sansSerif, 'bold');
      doc.setFontSize(60);
      doc.setTextColor(150, 150, 150);
      
      // Rotate and center the watermark
      const centerX = pageWidth / 2;
      const centerY = pageHeight / 2;
      doc.text(text, centerX, centerY, { 
        angle: 45, 
        align: 'center' 
      });
      
      doc.restoreGraphicsState();
    }
  }

  /**
   * Add a content section
   */
  private async addSection(
    doc: any,
    section: PdfSection,
    margins: any,
    contentWidth: number,
    yPosition: number,
    pageHeight: number
  ): Promise<number> {
    let y = yPosition;

    // Check if we need a new page
    if (y > pageHeight - 50) {
      doc.addPage();
      y = margins.top + 10; // Skip header on new pages
    }

    // Section title
    const level = section.level || 1;
    let fontSize: number;
    let fontStyle: string;

    switch (level) {
      case 1:
        fontSize = TYPOGRAPHY.sizes.h1;
        fontStyle = 'bold';
        break;
      case 2:
        fontSize = TYPOGRAPHY.sizes.h2;
        fontStyle = 'bold';
        break;
      case 3:
        fontSize = TYPOGRAPHY.sizes.h3;
        fontStyle = 'bold';
        break;
      default:
        fontSize = TYPOGRAPHY.sizes.body;
        fontStyle = 'normal';
    }

    doc.setFont(TYPOGRAPHY.font.sansSerif, fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(TYPOGRAPHY.colors.text);
    doc.text(section.title, margins.left, y);
    y += fontSize * 0.5 + TYPOGRAPHY.spacing.paragraph;

    // Section content
    if (typeof section.content === 'string') {
      y = this.addText(doc, section.content, margins.left, y, contentWidth, pageHeight, margins);
    } else if (Array.isArray(section.content)) {
      for (const line of section.content) {
        y = this.addText(doc, line, margins.left, y, contentWidth, pageHeight, margins);
        y += TYPOGRAPHY.spacing.line;
      }
    } else if (this.isTable(section.content)) {
      y = await this.addTable(doc, section.content, margins.left, y, contentWidth, pageHeight, margins);
    }

    y += TYPOGRAPHY.spacing.section;
    return y;
  }

  /**
   * Add text content with automatic wrapping and page breaks
   */
  private addText(
    doc: any,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    pageHeight: number,
    margins: any
  ): number {
    doc.setFont(TYPOGRAPHY.font.serif, 'normal');
    doc.setFontSize(TYPOGRAPHY.sizes.body);
    doc.setTextColor(TYPOGRAPHY.colors.text);

    const lines = doc.splitTextToSize(text, maxWidth);
    const lineHeight = TYPOGRAPHY.sizes.body * 0.5;

    for (const line of lines) {
      if (y + lineHeight > pageHeight - margins.bottom) {
        doc.addPage();
        y = margins.top + 10;
      }
      doc.text(line, x, y);
      y += lineHeight;
    }

    return y;
  }

  /**
   * Add a table with zebra striping
   */
  private async addTable(
    doc: any,
    table: PdfTable,
    x: number,
    y: number,
    maxWidth: number,
    pageHeight: number,
    margins: any
  ): Promise<number> {
    const { default: autoTable } = await import('jspdf-autotable');

    const headerColor = table.headerColor || TYPOGRAPHY.colors.primary;
    
    autoTable(doc, {
      startY: y,
      head: [table.headers],
      body: table.rows,
      theme: table.zebraStriping !== false ? 'striped' : 'plain',
      headStyles: {
        fillColor: headerColor,
        textColor: '#ffffff',
        fontStyle: 'bold',
        fontSize: TYPOGRAPHY.sizes.body,
        halign: 'left',
        font: TYPOGRAPHY.font.sansSerif,
      },
      bodyStyles: {
        fontSize: TYPOGRAPHY.sizes.body,
        textColor: TYPOGRAPHY.colors.text,
        font: TYPOGRAPHY.font.serif,
      },
      alternateRowStyles: {
        fillColor: '#f9f9f9',
      },
      margin: { left: margins.left, right: margins.right },
      tableWidth: maxWidth,
    });

    return (doc as any).lastAutoTable.finalY + TYPOGRAPHY.spacing.paragraph;
  }

  /**
   * Add signature blocks
   */
  private async addSignatures(
    doc: any,
    signatures: PdfSignature[],
    margins: any,
    contentWidth: number,
    yPosition: number,
    pageHeight: number,
    signatureCount: number
  ): Promise<number> {
    let y = yPosition;

    // Ensure we have enough space
    if (y > pageHeight - 80) {
      doc.addPage();
      y = margins.top + 10;
    }

    y += TYPOGRAPHY.spacing.section;

    // Title
    doc.setFont(TYPOGRAPHY.font.sansSerif, 'bold');
    doc.setFontSize(TYPOGRAPHY.sizes.h2);
    doc.setTextColor(TYPOGRAPHY.colors.text);
    doc.text('Signatures', margins.left, y);
    y += 15;

    // Calculate signature block width
    const sigWidth = contentWidth / Math.min(signatures.length, signatureCount);
    const sigHeight = 40;

    signatures.slice(0, signatureCount).forEach((sig, index) => {
      const xPos = margins.left + (index * sigWidth);
      
      // Signature box
      doc.setDrawColor(TYPOGRAPHY.colors.border);
      doc.setLineWidth(0.3);
      doc.rect(xPos + 5, y, sigWidth - 10, sigHeight);

      // Label
      doc.setFont(TYPOGRAPHY.font.sansSerif, 'bold');
      doc.setFontSize(TYPOGRAPHY.sizes.body);
      doc.setTextColor(TYPOGRAPHY.colors.text);
      doc.text(sig.label, xPos + sigWidth / 2, y - 3, { align: 'center' });

      // Name and date fields
      doc.setFont(TYPOGRAPHY.font.sansSerif, 'normal');
      doc.setFontSize(TYPOGRAPHY.sizes.caption);
      doc.setTextColor(TYPOGRAPHY.colors.textLight);
      
      const fieldY = y + sigHeight + 5;
      doc.text(`Nom: ${sig.name || '_______________________'}`, xPos + 10, fieldY);
      doc.text(`Date: ${sig.date || '_______________________'}`, xPos + 10, fieldY + 5);
    });

    return y + sigHeight + 20;
  }

  /**
   * Merge configuration with defaults
   */
  private mergeConfig(config: PdfTemplateConfig): PdfTemplateConfig {
    return {
      ...config,
      brandConfig: { ...DEFAULT_BRAND, ...config.brandConfig },
      includeDate: config.includeDate !== false,
      includePageNumbers: config.includePageNumbers !== false,
      includeWatermark: config.includeWatermark || false,
      includeSignatures: config.includeSignatures || false,
    };
  }

  /**
   * Type guard for PdfTable
   */
  private isTable(content: any): content is PdfTable {
    return content && typeof content === 'object' && 'headers' in content && 'rows' in content;
  }

  /**
   * Build parties table from parties data
   */
  private buildPartiesTable(parties: any[]): PdfTable {
    if (parties.length === 0) {
      return {
        headers: ['Rôle', 'Nom', 'Contact'],
        rows: [['Aucune partie prenante', '', '']],
        zebraStriping: true,
      };
    }

    return {
      headers: ['Rôle', 'Nom', 'Téléphone', 'Email'],
      rows: parties.map(p => [
        this.translateRole(p.role),
        `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Non renseigné',
        p.phone || 'Non renseigné',
        p.email || 'Non renseigné',
      ]),
      zebraStriping: true,
    };
  }

  /**
   * Build stats table for monthly report
   */
  private buildStatsTable(stats: any[]): PdfTable {
    return {
      headers: ['Métrique', 'Valeur', 'Évolution'],
      rows: stats.map(s => [
        s.label || '',
        String(s.value || 0),
        s.change ? `${s.change > 0 ? '+' : ''}${s.change}%` : '-',
      ]),
      zebraStriping: true,
    };
  }

  /**
   * Build agent performance table
   */
  private buildAgentPerformanceTable(agents: any[]): PdfTable {
    return {
      headers: ['Agent', 'Dossiers', 'Conversions', 'CA Généré'],
      rows: agents.map(a => [
        a.name || '',
        String(a.dossiers || 0),
        String(a.conversions || 0),
        a.revenue ? `${a.revenue.toLocaleString('fr-FR')} €` : '0 €',
      ]),
      zebraStriping: true,
    };
  }

  /**
   * Build top annonces table
   */
  private buildTopAnnoncesTable(annonces: any[]): PdfTable {
    return {
      headers: ['Titre', 'Vues', 'Contacts', 'Statut'],
      rows: annonces.map(a => [
        a.title || '',
        String(a.views || 0),
        String(a.contacts || 0),
        this.translateStatus(a.status) || '',
      ]),
      zebraStriping: true,
    };
  }

  /**
   * Translate status to French
   */
  private translateStatus(status: string): string {
    const translations: { [key: string]: string } = {
      NEW: 'Nouveau',
      QUALIFYING: 'En qualification',
      QUALIFIED: 'Qualifié',
      APPOINTMENT: 'Rendez-vous',
      WON: 'Gagné',
      LOST: 'Perdu',
      DRAFT: 'Brouillon',
      PUBLISHED: 'Publié',
      ACTIVE: 'Actif',
      PAUSED: 'En pause',
      ARCHIVED: 'Archivé',
    };
    return translations[status] || status;
  }

  /**
   * Translate role to French
   */
  private translateRole(role: string): string {
    const translations: { [key: string]: string } = {
      LEAD: 'Prospect',
      BUYER: 'Acheteur',
      SELLER: 'Vendeur',
      AGENT: 'Agent',
      OWNER: 'Propriétaire',
      TENANT: 'Locataire',
      LANDLORD: 'Bailleur',
      NOTARY: 'Notaire',
      BANK: 'Banque',
      ATTORNEY: 'Avocat',
    };
    return translations[role] || role;
  }
}
