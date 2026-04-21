import { Routes } from '@angular/router';
import { AnnoncesComponent } from './annonces.component';
import { AnnonceCreateComponent } from './annonce-create.component';
import { AnnonceDetailComponent } from './annonce-detail.component';

export const ANNONCES_ROUTES: Routes = [
  { path: '', component: AnnoncesComponent, data: { animation: 'AnnoncesPage' } },
  { path: 'new', component: AnnonceCreateComponent, data: { animation: 'AnnonceCreatePage' } },
  { path: ':id', component: AnnonceDetailComponent, data: { animation: 'AnnonceDetailPage' } },
  { path: ':id/edit', component: AnnonceCreateComponent, data: { animation: 'AnnonceEditPage' } }
];
