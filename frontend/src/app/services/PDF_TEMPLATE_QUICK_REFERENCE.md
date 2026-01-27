# PDF Template Service - Quick Reference

## Import

```typescript
import { 
  PdfTemplateService, 
  PdfTemplateType,
  PdfBrandConfig,
  PdfDocument,
  PdfSection,
  PdfTable 
} from '@app/services/pdf-template.service';
```

## Quick Examples

### Export Dossier

```typescript
constructor(private pdfService: PdfTemplateService) {}

async exportDossier(dossier: any) {
  await this.pdfService.generateDossierComplet(dossier);
}
```

### Export Monthly Report

```typescript
async exportReport() {
  const reportData = {
    month: 'Janvier',
    year: 2024,
    newDossiers: 25,
    closedDossiers: 15,
    conversionRate: 60,
    stats: [
      { label: 'Nouveaux prospects', value: 50, change: 10 }
    ],
    agentPerformance: [
      { name: 'Agent 1', dossiers: 10, conversions: 6, revenue: 50000 }
    ],
    topAnnonces: [
      { title: 'Appartement Paris', views: 150, contacts: 20, status: 'ACTIVE' }
    ],
    comments: 'Bon mois'
  };
  
  await this.pdfService.generateRapportMensuel(reportData);
}
```

### Export Contract

```typescript
async exportContract() {
  const contractData = {
    id: 'CTR-2024-001',
    type: 'Mandat de vente',
    clientName: 'Marie Martin',
    clientAddress: '10 Rue de la Paix, 75001 Paris',
    clientPhone: '+33612345678'
  };
  
  await this.pdfService.generateContratType(contractData);
}
```

### Custom PDF with Sections

```typescript
async generateCustomPdf() {
  const document: PdfDocument = {
    config: {
      type: PdfTemplateType.DOSSIER_COMPLET,
      title: 'Mon Document',
      filename: 'document',
      includeDate: true,
      includePageNumbers: true,
      includeSignatures: true,
      signatureCount: 2
    },
    sections: [
      {
        title: 'Section 1',
        level: 1,
        content: 'Texte simple'
      },
      {
        title: 'Section 2',
        level: 2,
        content: ['Ligne 1', 'Ligne 2', 'Ligne 3']
      },
      {
        title: 'Tableau',
        level: 2,
        content: {
          headers: ['Col 1', 'Col 2', 'Col 3'],
          rows: [
            ['A', 'B', 'C'],
            ['D', 'E', 'F']
          ],
          zebraStriping: true
        }
      }
    ],
    signatures: [
      { label: 'Agent', name: '', date: '' },
      { label: 'Client', name: '', date: '' }
    ]
  };
  
  await this.pdfService.generatePdf(document);
}
```

## Custom Branding

```typescript
const brandConfig: PdfBrandConfig = {
  companyName: 'Atlas Immobilier',
  logo: 'data:image/png;base64,...',
  address: '123 Rue de la République, 75001 Paris',
  phone: '+33 1 23 45 67 89',
  email: 'contact@atlas-immobilier.fr',
  primaryColor: '#2c5aa0',
  secondaryColor: '#e67e22'
};

await this.pdfService.generateDossierComplet(dossier, brandConfig);
```

## Watermark

```typescript
config: {
  // ... other config
  includeWatermark: true,
  watermarkText: 'CONFIDENTIEL'
}
```

## Typography

- **Body**: Georgia serif, 11pt
- **H1**: Helvetica bold, 24pt
- **H2**: Helvetica bold, 18pt
- **H3**: Helvetica bold, 14pt
- **Footer**: Helvetica, 8pt

## Colors

- Primary: `#2c5aa0`
- Secondary: `#e67e22`
- Text: `#333333`
- Text Light: `#666666`

## Template Types

- `DOSSIER_COMPLET` - Complete client file
- `RAPPORT_MENSUEL` - Monthly report (landscape)
- `CONTRAT_TYPE` - Standard contract

## Configuration Options

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
  watermarkText?: string;
  includeSignatures?: boolean;      // Default: false
  signatureCount?: number;          // Default: 2
  legalNotice?: string;
}
```

## Section Content Types

1. **String**: Simple text
   ```typescript
   content: 'Mon texte'
   ```

2. **String Array**: Multiple lines
   ```typescript
   content: ['Ligne 1', 'Ligne 2', 'Ligne 3']
   ```

3. **Table**: Structured data
   ```typescript
   content: {
     headers: ['Col 1', 'Col 2'],
     rows: [['A', 'B'], ['C', 'D']],
     zebraStriping: true
   }
   ```

## Common Patterns

### With Toast Notification

```typescript
async exportWithFeedback(dossier: any) {
  try {
    await this.pdfService.generateDossierComplet(dossier);
    this.toastService.success('PDF généré avec succès');
  } catch (error) {
    this.toastService.error('Erreur lors de la génération du PDF');
    console.error(error);
  }
}
```

### With Loading State

```typescript
isGeneratingPdf = false;

async exportWithLoading(dossier: any) {
  this.isGeneratingPdf = true;
  try {
    await this.pdfService.generateDossierComplet(dossier);
  } finally {
    this.isGeneratingPdf = false;
  }
}
```

### Convert Logo to Base64

```typescript
async getLogoBase64(logoUrl: string): Promise<string> {
  const response = await fetch(logoUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const logo = await this.getLogoBase64('/assets/brand/logo.png');
const brandConfig = { ...otherConfig, logo };
```

## Tips

1. **Use portrait for text-heavy documents**
2. **Use landscape for wide tables**
3. **Convert SVG logos to PNG before embedding**
4. **Provide complete data to avoid "Non renseigné" placeholders**
5. **Tables automatically handle page breaks**
6. **Watermarks are 10% opacity, centered, 45° angle**
7. **Lazy loading: jsPDF only loads when needed**
