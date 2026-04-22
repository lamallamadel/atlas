import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

registerLocaleData(localeFr, 'fr-FR');
registerLocaleData(localeEn, 'en-US');
registerLocaleData(localeEs, 'es-ES');

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
