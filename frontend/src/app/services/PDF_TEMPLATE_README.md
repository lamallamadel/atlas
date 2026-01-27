# PDF Template Service

Professional PDF generation service for Atlas Immobilier with branded templates, print-optimized typography, and multiple document variants.

## Features

- **Branded Header**: Company logo, contact information, and professional layout
- **Footer**: Pagination and legal notices on every page
- **Print-Optimized Typography**: 
  - Georgia serif font for body text (better readability)
  - Helvetica sans-serif for headers and UI elements
  - Consistent font sizing (11pt body, 18pt h2, 24pt h1)
- **Tables with Zebra Striping**: Enhanced readability with alternating row colors
- **Consistent Vertical Spacing**: Professional document flow
- **Signature Zones**: Dedicated signature blocks with fields for name and date
- **Optional Watermarks**: Diagonal watermark text (e.g., "CONFIDENTIEL")
- **Multiple Template Variants**:
  - Dossier Complet
  - Rapport Mensuel
  - Contrat Type

## Installation

The service uses lazy-loaded dependencies for optimal bundle size:

```typescript
import { PdfTemplateService } from '@app/services/pdf-template.service';
```

Dependencies (already in package.json):
- `jspdf` - PDF generation
- `jspdf-autotable` - Table rendering with advanced features

## Usage

### Basic PDF Generation

```typescript
import { PdfTemplateService, PdfDocument, PdfTemplateType } from '@app/services/pdf-template.service';

constructor(private pdfService: PdfTemplateService) {}

async generateCustomPdf() {
  const document: PdfDocument = {
    config: {
      type: PdfTemplateType.DOSSIER_COMPLET,
      title: 'Mon Document',
      filename: 'document',
      orientation: 'portrait',
      includeDate: true,
      includePageNumbers: true,
      includeWatermark: false,
    },
    sections: [
      {
        title: 'Introduction',
        level: 1,
        content: 'Ceci est le contenu de mon document.',
      },
      {
        title: 'Détails',
        level: 2,
        content: [
          'Première ligne',
          'Deuxième ligne',
          'Troisième ligne',
        ],
      },
    ],
  };

  await this.pdfService.generatePdf(document);
}
```

### Generate Dossier Complet

```typescript
async exportDossier(dossierId: number) {
  // Fetch dossier data
  const dossier = await this.dossierService.getDossier(dossierId).toPromise();
  
  // Generate PDF
  await this.pdfService.generateDossierComplet(dossier);
}
```

Output includes:
- Dossier information (ID, status, creation date, source)
- Main contact details
- Associated property information
- Stakeholders table
- Notes and observations
- Signature zones for agent and client

### Generate Rapport Mensuel

```typescript
async exportMonthlyReport(month: string, year: number) {
  const reportData = {
    month,
    year,
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

  await this.pdfService.generateRapportMensuel(reportData);
}
```

Output includes:
- Executive summary
- Detailed statistics table
- Agent performance comparison
- Top property listings
- Comments and recommendations
- Landscape orientation for better table display

### Generate Contrat Type

```typescript
async generateContract(contractData: any) {
  const data = {
    id: 'CTR-2024-001',
    type: 'Mandat de vente',
    clientName: 'Marie Martin',
    clientAddress: '10 Rue de la Paix, 75001 Paris',
    clientPhone: '+33612345678',
    object: 'Mandat de vente exclusif pour le bien situé...',
    terms: 'Durée de 6 mois à compter de la signature',
    remuneration: '3% du prix de vente TTC',
  };

  await this.pdfService.generateContratType(data);
}
```

Output includes:
- Contract header with reference
- Article 1: Object of the contract
- Article 2: Contracting parties
- Article 3: Duration and conditions
- Article 4: Remuneration
- Article 5: Obligations
- Article 6: Termination clause
- Article 7: Disputes resolution
- Three signature zones (provider, client, witness)

## Configuration

### Brand Configuration

Customize company branding:

```typescript
import { PdfBrandConfig } from '@app/services/pdf-template.service';

const brandConfig: PdfBrandConfig = {
  companyName: 'Atlas Immobilier',
  logo: 'data:image/png;base64,...', // Base64 encoded logo
  address: '123 Rue de la République, 75001 Paris',
  phone: '+33 1 23 45 67 89',
  email: 'contact@atlas-immobilier.fr',
  website: 'www.atlas-immobilier.fr',
  primaryColor: '#2c5aa0',
  secondaryColor: '#e67e22',
};

await this.pdfService.generateDossierComplet(dossierData, brandConfig);
```

### Template Configuration

```typescript
interface PdfTemplateConfig {
  type: PdfTemplateType;
  title: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  brandConfig?: PdfBrandConfig;
  includeDate?: boolean;           // Default: true
  includePageNumbers?: boolean;     // Default: true
  includeWatermark?: boolean;       // Default: false
  watermarkText?: string;           // Default: 'CONFIDENTIEL'
  includeSignatures?: boolean;      // Default: false
  signatureCount?: number;          // Default: 2
  legalNotice?: string;             // Custom legal notice
}
```

## Advanced Features

### Tables with Custom Styling

```typescript
const section = {
  title: 'Performance Metrics',
  level: 2,
  content: {
    headers: ['Métrique', 'Valeur', 'Évolution'],
    rows: [
      ['Nouveaux leads', '150', '+15%'],
      ['Conversions', '45', '+5%'],
      ['CA Généré', '250 000 €', '+20%'],
    ],
    zebraStriping: true,
    headerColor: '#2c5aa0',
  } as PdfTable,
};
```

### Watermarks

```typescript
const config: PdfTemplateConfig = {
  // ... other config
  includeWatermark: true,
  watermarkText: 'CONFIDENTIEL',
};
```

The watermark appears diagonally in the center of each page with 10% opacity.

### Multiple Sections

```typescript
sections: [
  {
    title: 'Executive Summary',
    level: 1,
    content: 'High-level overview...',
  },
  {
    title: 'Financial Details',
    level: 2,
    content: ['Revenue: 500K', 'Costs: 200K', 'Profit: 300K'],
  },
  {
    title: 'Performance Table',
    level: 2,
    content: {
      headers: ['Month', 'Sales', 'Growth'],
      rows: [['Jan', '100', '+10%'], ['Feb', '110', '+10%']],
    } as PdfTable,
  },
]
```

### Custom Signatures

```typescript
signatures: [
  { label: 'Le Directeur', name: 'Jean Dupont', date: '2024-01-15' },
  { label: 'Le Client', name: '', date: '' },
  { label: 'Témoin', name: '', date: '' },
]
```

## Typography Reference

The service uses print-optimized typography:

### Fonts
- **Body Text**: Georgia (serif) - 11pt
- **Headers**: Helvetica (sans-serif) - Bold
  - H1: 24pt
  - H2: 18pt
  - H3: 14pt
- **Captions**: Helvetica - 9pt
- **Footer**: Helvetica - 8pt

### Colors
- **Primary**: #2c5aa0 (Atlas Blue)
- **Secondary**: #e67e22 (Atlas Orange)
- **Text**: #333333
- **Text Light**: #666666
- **Border**: #dddddd

### Spacing
- **Section Spacing**: 15mm
- **Paragraph Spacing**: 8mm
- **Line Spacing**: 5mm

## Lazy Loading

The service uses dynamic imports for jsPDF and jspdf-autotable to optimize the initial bundle size:

```typescript
const { default: jsPDF } = await import('jspdf');
const { default: autoTable } = await import('jspdf-autotable');
```

Libraries are only loaded when PDF generation is triggered, reducing the initial page load time.

## Best Practices

### 1. Provide Complete Data

Ensure all required fields are populated to avoid "Non renseigné" placeholders:

```typescript
const dossierData = {
  id: 123,
  leadName: 'Jean Dupont',
  leadPhone: '+33612345678',
  leadEmail: 'jean@example.com',
  status: 'QUALIFIED',
  createdAt: new Date().toISOString(),
  // ... complete data
};
```

### 2. Use Appropriate Template Types

- **DOSSIER_COMPLET**: For complete client file exports
- **RAPPORT_MENSUEL**: For monthly reports (use landscape orientation)
- **CONTRAT_TYPE**: For contracts and legal documents

### 3. Optimize Logo Images

Convert logos to Base64 for embedding:

```typescript
async function imageToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const logo = await imageToBase64('/assets/brand/logo-horizontal.svg');
const brandConfig = { ...otherConfig, logo };
```

### 4. Handle Long Content

The service automatically handles page breaks for long text and tables:

```typescript
// Long text is automatically wrapped and split across pages
content: 'Very long paragraph text that will automatically wrap and create new pages as needed...'
```

### 5. Custom Legal Notices

Override the default legal notice for specific documents:

```typescript
config: {
  // ... other config
  legalNotice: 'Ce document est strictement confidentiel et ne peut être diffusé sans autorisation.',
}
```

## Example: Complete Integration

```typescript
import { Component } from '@angular/core';
import { PdfTemplateService, PdfBrandConfig } from '@app/services/pdf-template.service';
import { DossierApiService } from '@app/services/dossier-api.service';

@Component({
  selector: 'app-dossier-detail',
  template: `
    <button (click)="exportPdf()" mat-raised-button color="primary">
      Exporter en PDF
    </button>
  `
})
export class DossierDetailComponent {
  dossierId = 123;

  constructor(
    private pdfService: PdfTemplateService,
    private dossierService: DossierApiService
  ) {}

  async exportPdf() {
    try {
      // Fetch dossier data
      const dossier = await this.dossierService
        .getDossier(this.dossierId)
        .toPromise();

      // Optional: custom brand config
      const brandConfig: PdfBrandConfig = {
        companyName: 'Atlas Immobilier',
        primaryColor: '#2c5aa0',
        secondaryColor: '#e67e22',
      };

      // Generate PDF
      await this.pdfService.generateDossierComplet(dossier, brandConfig);
      
      // Success notification
      console.log('PDF généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  }
}
```

## Troubleshooting

### PDF Not Generating

Check browser console for errors. Common issues:
- Missing jsPDF or jspdf-autotable dependencies
- Malformed logo image (use PNG or JPG, not SVG directly)
- Browser popup blocker (for print functionality)

### Font Rendering Issues

The service uses standard PDF fonts (Helvetica, Georgia/Times). These are universally supported and don't require font embedding.

### Table Overflow

For tables with many columns:
- Use landscape orientation
- Reduce column widths
- Split into multiple tables

```typescript
config: {
  orientation: 'landscape', // Better for wide tables
}
```

### Logo Not Displaying

Ensure logo is in a supported format:
- PNG (recommended)
- JPG/JPEG
- Base64 encoded data URI

Convert SVG logos to PNG before embedding.

## API Reference

### PdfTemplateService Methods

#### `generatePdf(document: PdfDocument): Promise<void>`
Generate a custom PDF from a document structure.

#### `generateDossierComplet(dossierData: any, brandConfig?: PdfBrandConfig): Promise<void>`
Generate a complete dossier report.

#### `generateRapportMensuel(reportData: any, brandConfig?: PdfBrandConfig): Promise<void>`
Generate a monthly performance report.

#### `generateContratType(contractData: any, brandConfig?: PdfBrandConfig): Promise<void>`
Generate a standard contract document.

## License

Part of the Atlas Immobilier application. For internal use only.
