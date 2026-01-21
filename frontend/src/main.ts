import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

registerLocaleData(localeFr, 'fr-FR');

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
