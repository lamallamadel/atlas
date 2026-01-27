# Chart Visualization System

Système complet de visualisation de données avec composants réutilisables, palettes de couleurs accessibles, animations fluides et support du mode sombre.

## 🎨 Caractéristiques

### Design Cohérent
- **Styles uniformes** : Axes en gris neutral-400, grilles en neutral-200
- **Tooltips Material Design** : Style mat-card avec ombres et bordures arrondies
- **Typographie cohérente** : Police Roboto/Open Sans, tailles harmonieuses
- **Espacements standardisés** : Padding et marges cohérents

### Palette de Couleurs Accessibles
8 teintes conformes WCAG AA/AAA :
1. **Primary** - rgba(44, 90, 160, 1) - Bleu principal
2. **Secondary** - rgba(66, 136, 206, 1) - Bleu secondaire
3. **Success** - rgba(117, 199, 127, 1) - Vert succès
4. **Warning** - rgba(240, 201, 115, 1) - Orange avertissement
5. **Error** - rgba(237, 127, 127, 1) - Rouge erreur
6. **Info** - rgba(125, 184, 238, 1) - Bleu information
7. **Neutral** - rgba(158, 158, 158, 1) - Gris neutre
8. **Accent** - rgba(171, 130, 255, 1) - Violet accent

### Palettes Thématiques
- **Default** : Palette équilibrée pour usage général
- **Vibrant** : Couleurs vives pour présentations
- **Pastel** : Tons doux pour rapports
- **Dark** : Optimisée pour mode sombre
- **Monochrome** : Variations d'une couleur
- **Categorical** : Pour données catégorielles

### Animations
- **Barres** : Apparition en stagger (décalage progressif)
- **Lignes** : Dessin progressif du tracé
- **Transitions** : Smooth 750ms avec easing cubique
- **Respect prefers-reduced-motion** : Animations désactivées si nécessaire

### Responsive Design
- **Aspect ratios préservés** : 16:9, 4:3, 1:1, 21:9
- **ResizeObserver** : Adaptation automatique au redimensionnement
- **Breakpoints** : Mobile (599px), Tablet (959px), Desktop
- **Grid layouts** : 2, 3, ou 4 colonnes adaptatives

### Mode Sombre
- **Auto-détection** : Support prefers-color-scheme
- **Couleurs inversées** : Textes, grilles, backgrounds
- **Contrastes maintenus** : Accessibilité préservée
- **Transitions douces** : Changement de mode fluide

### Export Haute Résolution
- **Format PNG** : Export bitmap haute qualité
- **Format SVG** : Export vectoriel pour impression
- **Qualité configurable** : De 0.1 à 1.0
- **Nommage automatique** : Horodatage inclus

## 📦 Installation

### 1. Importer le module
```typescript
import { ChartComponent } from './components/chart/chart.component';
import { ChartColorPaletteService } from './services/chart-color-palette.service';

@NgModule({
  declarations: [ChartComponent],
  providers: [ChartColorPaletteService],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule
  ]
})
export class ChartModule { }
```

### 2. Importer les styles
```scss
// styles.scss
@import './styles/chart-visualization.scss';
```

### 3. Vérifier Chart.js
```json
// package.json
"dependencies": {
  "chart.js": "^4.4.0"
}
```

## 🚀 Usage

### Graphique en Barres

```typescript
// component.ts
barChartLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
barChartDatasets: ChartDataset[] = [
  {
    label: 'Ventes Mensuelles',
    data: [65, 78, 90, 81, 56, 95]
  }
];
```

```html
<!-- component.html -->
<app-chart
  type="bar"
  [labels]="barChartLabels"
  [datasets]="barChartDatasets"
  title="Ventes Mensuelles 2024"
  subtitle="Nombre de transactions par mois"
  [darkMode]="darkMode"
  [height]="400"
  (chartClick)="onChartClick($event)"
  (exportComplete)="onExportComplete($event)">
</app-chart>
```

### Graphique Linéaire

```typescript
lineChartDatasets: ChartDataset[] = [
  {
    label: 'Visites',
    data: [45, 52, 48, 65, 72, 68, 85],
    tension: 0.4,
    fill: false
  }
];
```

```html
<app-chart
  type="line"
  [labels]="lineChartLabels"
  [datasets]="lineChartDatasets"
  title="Visites Hebdomadaires"
  [animation]="true"
  [showGrid]="true">
</app-chart>
```

### Graphique Circulaire

```typescript
pieChartDatasets: ChartDataset[] = [
  {
    label: 'Répartition',
    data: [45, 30, 15, 10]
  }
];
```

```html
<app-chart
  type="pie"
  [labels]="['Vente', 'Location', 'Gestion', 'Syndic']"
  [datasets]="pieChartDatasets"
  [aspectRatio]="1"
  [showLegend]="true">
</app-chart>
```

### Barres Empilées

```typescript
stackedBarDatasets: ChartDataset[] = [
  { label: 'Appartements', data: [30, 45, 40, 50] },
  { label: 'Maisons', data: [20, 25, 30, 28] },
  { label: 'Commerces', data: [10, 15, 12, 18] }
];
```

```html
<app-chart
  type="bar"
  [labels]="['T1', 'T2', 'T3', 'T4']"
  [datasets]="stackedBarDatasets"
  [stacked]="true">
</app-chart>
```

### Graphique Radar

```typescript
radarChartDatasets: ChartDataset[] = [
  {
    label: 'Agent A',
    data: [85, 90, 75, 80, 95]
  },
  {
    label: 'Agent B',
    data: [70, 85, 90, 75, 80]
  }
];
```

```html
<app-chart
  type="radar"
  [labels]="['Réactivité', 'Qualité', 'Prix', 'Service', 'Communication']"
  [datasets]="radarChartDatasets">
</app-chart>
```

## 🎨 Service de Palette de Couleurs

### Obtenir une Palette

```typescript
constructor(private colorService: ChartColorPaletteService) {}

ngOnInit() {
  // Obtenir toutes les palettes
  const palettes = this.colorService.getAllPalettes();
  
  // Obtenir une palette spécifique
  const defaultPalette = this.colorService.getPalette('default');
  
  // Obtenir seulement les palettes accessibles
  const accessiblePalettes = this.colorService.getAccessiblePalettes();
}
```

### Utiliser les Couleurs

```typescript
// Obtenir une couleur solide
const color = this.colorService.getColor('vibrant', 0);

// Obtenir une couleur avec transparence
const alphaColor = this.colorService.getAlphaColor('vibrant', 0);

// Obtenir un objet couleur complet
const chartColor = this.colorService.getChartColor('vibrant', 0);
// chartColor = {
//   solid: 'rgba(...)',
//   alpha20: 'rgba(..., 0.2)',
//   alpha40: 'rgba(..., 0.4)',
//   alpha60: 'rgba(..., 0.6)',
//   alpha80: 'rgba(..., 0.8)'
// }
```

### Créer une Palette Personnalisée

```typescript
const customColors = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)'
];

this.colorService.registerCustomPalette(
  'myPalette',
  customColors,
  true,  // accessible
  'AA'   // WCAG level
);
```

### Générer un Dégradé

```typescript
const gradient = this.colorService.generateGradient(
  'rgba(44, 90, 160, 1)',
  5  // nombre d'étapes
);
// Retourne 5 variations de la couleur
```

### Obtenir la Couleur de Contraste

```typescript
const contrastColor = this.colorService.getContrastColor(
  'rgba(44, 90, 160, 1)'
);
// Retourne '#FFFFFF' ou '#212121' selon la luminance
```

## 📊 Composants KPI

### KPI Card

```html
<div class="chart-kpi-card">
  <div class="chart-kpi-label">Ventes Totales</div>
  <div class="chart-kpi-value">€3.2M</div>
  <div class="chart-kpi-trend positive">
    <mat-icon>trending_up</mat-icon>
    <span>+12.5%</span>
  </div>
</div>
```

### KPI Grid

```html
<div class="chart-kpi-grid">
  <div class="chart-kpi-card" *ngFor="let kpi of kpiData">
    <div class="chart-kpi-label">{{ kpi.label }}</div>
    <div class="chart-kpi-value">{{ kpi.value }}</div>
    <div class="chart-kpi-trend" [class]="kpi.trendType">
      <mat-icon>{{ kpi.trendType === 'positive' ? 'trending_up' : 'trending_down' }}</mat-icon>
      <span>{{ kpi.trend }}</span>
    </div>
  </div>
</div>
```

## 🎯 Configuration Avancée

### Options Personnalisées

```typescript
customOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      align: 'center'
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `${context.dataset.label}: ${context.parsed.y}€`;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => value + 'K'
      }
    }
  }
};
```

```html
<app-chart
  type="bar"
  [labels]="labels"
  [datasets]="datasets"
  [customOptions]="customOptions">
</app-chart>
```

### Export Personnalisé

```typescript
async exportChart() {
  await this.chartComponent.exportChart({
    format: 'svg',
    filename: 'rapport-ventes-2024',
    quality: 1.0
  });
}

onExportComplete(event: { format: string; blob: Blob }) {
  console.log(`Export terminé : ${event.format}`);
  // Envoi au backend, etc.
}
```

### Accès à l'Instance Chart.js

```typescript
@ViewChild(ChartComponent) chartComponent!: ChartComponent;

ngAfterViewInit() {
  const chartInstance = this.chartComponent.getChartInstance();
  if (chartInstance) {
    // Manipulation directe de Chart.js
    chartInstance.options.animation = false;
    chartInstance.update();
  }
}
```

## 📱 Responsive Design

### Grilles Adaptatives

```html
<!-- 2 colonnes -->
<div class="chart-grid-2col">
  <app-chart ...></app-chart>
  <app-chart ...></app-chart>
</div>

<!-- 3 colonnes -->
<div class="chart-grid-3col">
  <app-chart ...></app-chart>
  <app-chart ...></app-chart>
  <app-chart ...></app-chart>
</div>

<!-- 4 colonnes -->
<div class="chart-grid-4col">
  <app-chart ...></app-chart>
  <app-chart ...></app-chart>
  <app-chart ...></app-chart>
  <app-chart ...></app-chart>
</div>
```

### Aspect Ratios

```html
<div class="chart-aspect-ratio-16-9">
  <app-chart ...></app-chart>
</div>

<div class="chart-aspect-ratio-4-3">
  <app-chart ...></app-chart>
</div>

<div class="chart-aspect-ratio-1-1">
  <app-chart ...></app-chart>
</div>
```

## ♿ Accessibilité

### Conformité WCAG
- **Contraste AA** : Toutes les couleurs par défaut
- **Contraste AAA** : Palettes 'monochrome' et 'dark'
- **Focus visible** : Outline 2px sur tous les boutons
- **Tooltip accessible** : Texte lisible, contrastes respectés
- **Animations désactivables** : Respect de prefers-reduced-motion

### Keyboard Navigation
- **Tab** : Navigation entre les boutons d'export
- **Enter/Space** : Activation des menus
- **Escape** : Fermeture des menus

## 🌙 Mode Sombre

### Activation Manuelle

```typescript
darkMode = false;

toggleDarkMode() {
  this.darkMode = !this.darkMode;
}
```

```html
<app-chart
  [darkMode]="darkMode"
  [labels]="labels"
  [datasets]="datasets">
</app-chart>
```

### Auto-détection

```typescript
@HostListener('window:prefers-color-scheme')
onColorSchemeChange() {
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  this.darkMode = darkModeQuery.matches;
}
```

## 🎭 États et Messages

### État de Chargement

```html
<div class="chart-loading-overlay">
  <div class="chart-loading-spinner"></div>
</div>
```

### État Vide

```html
<div class="chart-empty-state">
  <mat-icon>analytics</mat-icon>
  <div class="chart-empty-state-title">Aucune donnée</div>
  <div class="chart-empty-state-message">
    Les données s'afficheront ici une fois disponibles
  </div>
</div>
```

### État d'Erreur

```html
<div class="chart-error-state">
  <mat-icon>error_outline</mat-icon>
  <div>Erreur de chargement des données</div>
</div>
```

## 📋 Inputs & Outputs

### Inputs

| Propriété | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `type` | ChartType | 'bar' | Type de graphique |
| `labels` | string[] | [] | Labels des axes |
| `datasets` | ChartDataset[] | [] | Données du graphique |
| `title` | string | undefined | Titre du graphique |
| `subtitle` | string | undefined | Sous-titre |
| `height` | number | 400 | Hauteur en pixels |
| `aspectRatio` | number | 2 | Ratio largeur/hauteur |
| `animation` | boolean | true | Activer les animations |
| `showLegend` | boolean | true | Afficher la légende |
| `showGrid` | boolean | true | Afficher la grille |
| `showTooltips` | boolean | true | Afficher les tooltips |
| `darkMode` | boolean | false | Mode sombre |
| `stacked` | boolean | false | Barres/aires empilées |
| `customOptions` | ChartOptions | undefined | Options Chart.js |
| `enableExport` | boolean | true | Bouton d'export |

### Outputs

| Event | Payload | Description |
|-------|---------|-------------|
| `chartClick` | { event, elements } | Click sur le graphique |
| `chartHover` | { event, elements } | Survol du graphique |
| `exportComplete` | { format, blob } | Export terminé |

### Méthodes Publiques

| Méthode | Description |
|---------|-------------|
| `exportChart(options?)` | Exporter le graphique |
| `refreshChart()` | Rafraîchir l'affichage |
| `getChartInstance()` | Obtenir l'instance Chart.js |

## 🖨️ Impression

Les graphiques sont optimisés pour l'impression :
- Ombres supprimées
- Boutons d'export cachés
- Page breaks évités
- Espaces réduits

```css
@media print {
  .chart-wrapper {
    page-break-inside: avoid;
  }
}
```

## 🧪 Tests

```typescript
describe('ChartComponent', () => {
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.type).toBe('bar');
    expect(component.animation).toBe(true);
  });

  it('should handle empty datasets', () => {
    component.datasets = [];
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
```

## 📚 Exemples Complets

Voir `chart-demo.component.ts` pour une démo complète avec :
- Tous les types de graphiques
- KPI cards
- Sélection de palette
- Toggle mode sombre
- Export haute résolution

## 🔧 Dépannage

### Le graphique ne s'affiche pas
- Vérifier que Chart.js est installé
- Vérifier que les datasets ne sont pas vides
- Vérifier la console pour les erreurs

### Les couleurs ne correspondent pas
- Utiliser ChartColorPaletteService pour cohérence
- Vérifier que la palette existe
- Vérifier l'index de couleur

### Les animations ne fonctionnent pas
- Vérifier `[animation]="true"`
- Vérifier prefers-reduced-motion
- Vérifier les options personnalisées

### L'export ne fonctionne pas
- Vérifier `[enableExport]="true"`
- Vérifier les permissions navigateur
- Vérifier la console pour les erreurs

## 📝 Licence

MIT - Voir LICENSE pour plus de détails
