import { Routes } from '@angular/router';
import { DossiersComponent } from './dossiers.component';
import { DossierDetailComponent } from './dossier-detail.component';

export const DOSSIERS_ROUTES: Routes = [
  { path: '', component: DossiersComponent, data: { animation: 'DossiersPage' } },
  { path: ':id', component: DossierDetailComponent, data: { animation: 'DossierDetailPage' } }
];
