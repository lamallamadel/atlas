# Chart Visualization - Guide de Démarrage Rapide

> ⚠️ **Note** — Les extraits de code de ce guide peuvent encore mentionner des
> modules Angular Material dans la configuration historique. Ces dépendances
> ont été retirées du projet : utilisez les primitives équivalentes dans
> `src/app/design-system/` (`ds-button`, `ds-icon`, `ds-menu`, …).

## 🚀 Installation en 5 Minutes

### 1. Vérifier les Dépendances

```bash
# Chart.js doit être installé
npm install chart.js@^4.4.0
```

### 2. Importer le Module

```typescript
// app.module.ts
import { ChartComponent } from './components/chart/chart.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [ChartComponent],
  imports: [
    CommonModule,
    // DS primitives (ds-button, ds-icon, ds-menu, ds-tooltip) are standalone
    // and imported directly in components that need them.
  ]
})
```

### 3. Importer les Styles

```scss
// styles.scss
@import './styles/chart-visualization.scss';
```

## 📊 Premier Graphique (2 Minutes)

### Graphique en Barres Simple

```typescript
// component.ts
export class MyComponent {
  labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'];
  datasets = [
    {
      label: 'Ventes',
      data: [65, 78, 90, 81, 95]
    }
  ];
}
```

```html
<!-- component.html -->
<app-chart
  type="bar"
  [labels]="labels"
  [datasets]="datasets"
  title="Ventes Mensuelles">
</app-chart>
```

✅ **C'est tout !** Vous avez un graphique fonctionnel.

## 🎨 Ajouter des Couleurs (30 Secondes)

### Avec le Service de Palette

```typescript
// component.ts
import { ChartColorPaletteService } from './services/chart-color-palette.service';

constructor(private colorService: ChartColorPaletteService) {}

ngOnInit() {
  const color = this.colorService.getChartColor('vibrant', 0);
  
  this.datasets = [
    {
      label: 'Ventes',
      data: [65, 78, 90, 81, 95],
      backgroundColor: color.alpha20,
      borderColor: color.solid
    }
  ];
}
```

## 🌙 Mode Sombre (10 Secondes)

```html
<app-chart
  [darkMode]="true"
  type="bar"
  [labels]="labels"
  [datasets]="datasets">
</app-chart>
```

## 📱 Responsive (Automatique)

Les graphiques sont responsive par défaut. Pour contrôler l'aspect ratio :

```html
<app-chart
  [aspectRatio]="2"
  [height]="400"
  type="bar"
  [labels]="labels"
  [datasets]="datasets">
</app-chart>
```

## 📥 Export (1 Ligne)

```html
<app-chart
  [enableExport]="true"
  type="bar"
  [labels]="labels"
  [datasets]="datasets"
  (exportComplete)="onExport($event)">
</app-chart>
```

## 🎯 Exemples Rapides

### Graphique Circulaire

```typescript
pieLabels = ['A', 'B', 'C'];
pieDatasets = [{ label: 'Parts', data: [30, 50, 20] }];
```

```html
<app-chart type="pie" [labels]="pieLabels" [datasets]="pieDatasets"></app-chart>
```

### Graphique Linéaire

```typescript
lineDatasets = [
  { 
    label: 'Tendance', 
    data: [10, 20, 15, 30, 25],
    fill: false 
  }
];
```

```html
<app-chart type="line" [labels]="labels" [datasets]="lineDatasets"></app-chart>
```

### Barres Empilées

```typescript
stackedDatasets = [
  { label: 'Série A', data: [10, 20, 30] },
  { label: 'Série B', data: [15, 25, 35] }
];
```

```html
<app-chart 
  type="bar" 
  [stacked]="true"
  [labels]="['T1', 'T2', 'T3']" 
  [datasets]="stackedDatasets">
</app-chart>
```

## 🎭 KPI Cards

```html
<div class="chart-kpi-card">
  <div class="chart-kpi-label">Total Ventes</div>
  <div class="chart-kpi-value">€3.2M</div>
  <div class="chart-kpi-trend positive">
    <mat-icon>trending_up</mat-icon>
    <span>+12.5%</span>
  </div>
</div>
```

## 🔧 Personnalisation Rapide

### Options Communes

```typescript
customOptions = {
  plugins: {
    legend: { position: 'bottom' },
    tooltip: { enabled: true }
  },
  scales: {
    y: { beginAtZero: true }
  }
};
```

```html
<app-chart [customOptions]="customOptions" ...></app-chart>
```

### Événements

```typescript
onChartClick(event: any) {
  console.log('Clicked:', event);
}

onChartHover(event: any) {
  console.log('Hovered:', event);
}
```

```html
<app-chart
  (chartClick)="onChartClick($event)"
  (chartHover)="onChartHover($event)"
  ...>
</app-chart>
```

## 🎨 Palettes Disponibles

```typescript
// default, vibrant, pastel, dark, monochrome, categorical
this.colorService.getColor('vibrant', 0);
```

## 📊 Grilles de Graphiques

```html
<div class="chart-grid-2col">
  <app-chart ...></app-chart>
  <app-chart ...></app-chart>
</div>
```

Classes disponibles :
- `chart-grid-2col` - 2 colonnes
- `chart-grid-3col` - 3 colonnes  
- `chart-grid-4col` - 4 colonnes

## 🛠️ Utilitaires de Données

```typescript
import { ChartUtilsService } from './services/chart-utils.service';

constructor(private utils: ChartUtilsService) {}

// Formater les nombres
this.utils.formatCompactNumber(1500); // "1.5K"

// Calculer les tendances
this.utils.calculateTrend(100, 90); // { value: "+11.1%", type: "positive" }

// Lisser les données
this.utils.smoothData([10, 50, 20, 60, 30], 3);

// Exporter en CSV
const csv = this.utils.exportToCSV(labels, datasets);
this.utils.downloadCSV(csv, 'data.csv');
```

## ⚡ Performances

### Lazy Loading

```typescript
// Charger le composant uniquement quand nécessaire
const { ChartComponent } = await import('./components/chart/chart.component');
```

### Désactiver Animations

```html
<app-chart [animation]="false" ...></app-chart>
```

## ♿ Accessibilité (Automatique)

- ✅ Contraste WCAG AA/AAA
- ✅ Navigation clavier
- ✅ Tooltips accessibles
- ✅ Focus visible
- ✅ Respect prefers-reduced-motion

## 🐛 Dépannage Express

### Le graphique ne s'affiche pas ?
1. Vérifier `npm install chart.js`
2. Vérifier que `datasets` n'est pas vide
3. Ouvrir la console pour les erreurs

### Les couleurs sont étranges ?
1. Utiliser `ChartColorPaletteService`
2. Vérifier les valeurs rgba()

### L'export ne fonctionne pas ?
1. Vérifier `[enableExport]="true"`
2. Vérifier les permissions du navigateur

## 📚 Aller Plus Loin

- 📖 Lire [CHART_VISUALIZATION_README.md](./CHART_VISUALIZATION_README.md)
- 🎨 Voir [chart-demo.component.ts](./chart-demo.component.ts)
- 🔧 Explorer les [types](../../models/chart.types.ts)

## 💡 Astuce Finale

Pour un résultat professionnel instantané :

```html
<div class="chart-demo-container">
  <div class="chart-kpi-grid">
    <!-- KPIs -->
  </div>
  
  <div class="chart-grid-2col">
    <!-- Graphiques -->
  </div>
</div>
```

Ajoutez `[darkMode]="darkMode"` et `[enableExport]="true"` partout !

---

**Temps total : 10 minutes maximum** ⏱️
