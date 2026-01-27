import '@angular/localize/init';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

registerLocaleData(localeFr, 'fr-FR');
registerLocaleData(localeEn, 'en-US');
registerLocaleData(localeEs, 'es-ES');

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
